// @vitest-environment node
import { build } from "esbuild";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";

const CLIENT_ID = "web-client.apps.googleusercontent.com";
const OWNER = "owner@example.test";
const ANTHROPIC_KEY = "sk-ant-test-secret";
const APP_ORIGIN = "https://localhost";

interface AnthropicCall {
  headers: Record<string, string>;
  body: any;
}

let anthropicCalls: AnthropicCall[];
let anthropicReply: () => Response;
let keyPair: CryptoKeyPair;
let otherKeyPair: CryptoKeyPair;
let publicJwk: JsonWebKey & { kid?: string };
let script: string;
const instances: Miniflare[] = [];

const b64url = (data: ArrayBuffer | string) =>
  Buffer.from(typeof data === "string" ? data : new Uint8Array(data))
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const generate = () =>
  crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  ) as Promise<CryptoKeyPair>;

async function makeToken(
  claims: Record<string, unknown> = {},
  options: { key?: CryptoKey; alg?: string } = {},
) {
  const header = b64url(JSON.stringify({ alg: options.alg ?? "RS256", kid: "test-key", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: "https://accounts.google.com",
      aud: CLIENT_ID,
      email: OWNER,
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...claims,
    }),
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    options.key ?? keyPair.privateKey,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${b64url(signature)}`;
}

async function startWorker(vars: Record<string, string> = {}) {
  const mf = new Miniflare({
    modules: true,
    script,
    compatibilityDate: "2026-07-01",
    kvNamespaces: ["COUNTER"],
    bindings: {
      OWNER_EMAIL: OWNER,
      GOOGLE_WEB_CLIENT_ID: CLIENT_ID,
      ANTHROPIC_API_KEY: ANTHROPIC_KEY,
      MODEL: "test-model",
      DAILY_LIMIT: "1000",
      ...vars,
    },
    outboundService: async (request: Request) => {
      const url = new URL(request.url);
      if (url.host === "www.googleapis.com") return Response.json({ keys: [publicJwk] });
      if (url.host === "api.anthropic.com") {
        anthropicCalls.push({ headers: Object.fromEntries(request.headers), body: await request.json() });
        return anthropicReply();
      }
      return new Response("unexpected host", { status: 500 });
    },
  });
  instances.push(mf);
  return mf;
}

// Built by hand so the test does not depend on Node's FormData matching Miniflare's fetch implementation.
function multipart(parts: { name: string; size: number }[]) {
  const boundary = `----test${Math.random().toString(16).slice(2)}`;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  for (const { name, size } of parts) {
    chunks.push(
      encoder.encode(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${name}.webp"\r\nContent-Type: image/webp\r\n\r\n`,
      ),
      new Uint8Array(size).fill(7),
      encoder.encode("\r\n"),
    );
  }
  chunks.push(encoder.encode(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

function identifyRequest(options: { token?: string | null; origin?: string; front?: number; back?: number } = {}) {
  const parts = [];
  if (options.front !== 0) parts.push({ name: "front", size: options.front ?? 1000 });
  if (options.back) parts.push({ name: "back", size: options.back });
  const { body, contentType } = multipart(parts);
  const headers: Record<string, string> = { origin: options.origin ?? APP_ORIGIN, "content-type": contentType };
  if (options.token !== null) headers.authorization = `Bearer ${options.token ?? "missing"}`;
  return { method: "POST", headers, body };
}

const claudeSuggestion = (input: object) =>
  Response.json({ content: [{ type: "tool_use", name: "report_card", input }] });

let mf: Miniflare;
const identify = async (init: ReturnType<typeof identifyRequest>) => mf.dispatchFetch("http://worker.test/identify", init as any);

beforeAll(async () => {
  keyPair = await generate();
  otherKeyPair = await generate();
  publicJwk = { ...(await crypto.subtle.exportKey("jwk", keyPair.publicKey)), kid: "test-key", alg: "RS256", use: "sig" };
  const result = await build({
    entryPoints: ["worker/src/index.ts"],
    bundle: true,
    format: "esm",
    write: false,
    platform: "neutral",
    target: "es2022",
  });
  script = result.outputFiles[0].text;
  mf = await startWorker();
}, 60_000);

afterAll(async () => {
  await Promise.all(instances.map((i) => i.dispose()));
});

beforeEach(() => {
  anthropicCalls = [];
  anthropicReply = () =>
    claudeSuggestion({
      player: "Ronald Acuña Jr.",
      team: "Atlanta Braves",
      year: 2024,
      manufacturer: "Topps",
      set: "Series 1",
      cardNumber: "27",
      parallel: { name: "Gold", serial: 23, serialLegible: true, printRun: 2024 },
      confidence: { player: "high", set: "low", cardNumber: "high" },
    });
});

describe("proxy serves only the owner", () => {
  test("a request with no credential is rejected without calling Claude", async () => {
    const response = await identify(identifyRequest({ token: null }));
    expect(response.status).toBe(401);
    expect(anthropicCalls).toHaveLength(0);
  });

  test("a valid credential for another account is rejected without calling Claude", async () => {
    const response = await identify(identifyRequest({ token: await makeToken({ email: "someone.else@example.test" }) }));
    expect(response.status).toBe(403);
    expect(anthropicCalls).toHaveLength(0);
  });

  test("the app's Origin header does not help another account's token", async () => {
    const token = await makeToken({ email: "someone.else@example.test" });
    const response = await identify(identifyRequest({ token, origin: APP_ORIGIN }));
    expect(response.status).toBe(403);
    expect(anthropicCalls).toHaveLength(0);
  });

  test("the owner's token works from any Origin because Origin is not a gate", async () => {
    const response = await identify(identifyRequest({ token: await makeToken(), origin: "https://evil.example" }));
    expect(response.status).toBe(200);
  });

  test.each([
    ["wrong audience", { aud: "another-client" }],
    ["expired", { exp: Math.floor(Date.now() / 1000) - 10 }],
    ["wrong issuer", { iss: "https://evil.example" }],
    ["unverified email", { email_verified: false }],
  ])("a token with %s is rejected", async (_name, claims) => {
    const response = await identify(identifyRequest({ token: await makeToken(claims) }));
    expect(response.status).toBe(401);
    expect(anthropicCalls).toHaveLength(0);
  });

  test("a token signed with a different key is rejected", async () => {
    const response = await identify(identifyRequest({ token: await makeToken({}, { key: otherKeyPair.privateKey }) }));
    expect(response.status).toBe(401);
  });

  test("an unsigned token (alg none) is rejected", async () => {
    const header = b64url(JSON.stringify({ alg: "none", kid: "test-key" }));
    const payload = b64url(JSON.stringify({ iss: "https://accounts.google.com", aud: CLIENT_ID, email: OWNER, email_verified: true, exp: Math.floor(Date.now() / 1000) + 3600 }));
    const response = await identify(identifyRequest({ token: `${header}.${payload}.` }));
    expect(response.status).toBe(401);
    expect(anthropicCalls).toHaveLength(0);
  });
});

describe("identification", () => {
  test("the owner gets suggestions and low-confidence fields back", async () => {
    const response = await identify(identifyRequest({ token: await makeToken(), front: 2000, back: 3000 }));
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.suggestion).toMatchObject({
      player: "Ronald Acuña Jr.",
      year: 2024,
      cardNumber: "27",
      parallel: { name: "Gold", serial: 23, printRun: 2024 },
    });
    expect(body.lowConfidence).toEqual(["set"]);
  });

  test("Claude is called with the secret key held by the proxy, the configured model, forced JSON output and both images", async () => {
    await identify(identifyRequest({ token: await makeToken(), front: 2000, back: 3000 }));
    expect(anthropicCalls).toHaveLength(1);
    const [call] = anthropicCalls;
    expect(call.headers["x-api-key"]).toBe(ANTHROPIC_KEY);
    expect(call.body.model).toBe("test-model");
    expect(call.body.tool_choice).toEqual({ type: "tool", name: "report_card" });
    const images = call.body.messages[0].content.filter((block: any) => block.type === "image");
    expect(images).toHaveLength(2);
  });

  test("the API key never appears in any response", async () => {
    const ok = await identify(identifyRequest({ token: await makeToken() }));
    const okText = await ok.text();
    anthropicReply = () => new Response("upstream exploded sk-ant-test-secret", { status: 500 });
    const failed = await identify(identifyRequest({ token: await makeToken() }));
    const failedText = await failed.text();
    expect(okText).not.toContain(ANTHROPIC_KEY);
    expect(failed.status).toBe(502);
    expect(failedText).not.toContain(ANTHROPIC_KEY);
  });

  test("a request without any image is rejected without calling Claude", async () => {
    const response = await identify(identifyRequest({ token: await makeToken(), front: 0 }));
    expect(response.status).toBe(400);
    expect(anthropicCalls).toHaveLength(0);
  });
});

describe("spend limits", () => {
  test("images over the size limit are rejected without calling Claude", async () => {
    const response = await identify(identifyRequest({ token: await makeToken(), front: 700_000, back: 700_000 }));
    expect(response.status).toBe(413);
    expect(anthropicCalls).toHaveLength(0);
  });

  test("requests beyond the daily cap are refused without calling Claude", async () => {
    const capped = await startWorker({ DAILY_LIMIT: "2" });
    const send = async () =>
      capped.dispatchFetch("http://worker.test/identify", identifyRequest({ token: await makeToken() }) as any);
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    const third = await send();
    expect(third.status).toBe(429);
    expect(await third.json()).toEqual({ error: "daily_limit" });
    expect(anthropicCalls).toHaveLength(2);
  });

  test("oversized and unauthorized requests do not use up the daily cap", async () => {
    const capped = await startWorker({ DAILY_LIMIT: "1" });
    const send = async (init: ReturnType<typeof identifyRequest>) => capped.dispatchFetch("http://worker.test/identify", init as any);
    await send(identifyRequest({ token: null }));
    await send(identifyRequest({ token: await makeToken(), front: 2_000_000 }));
    expect((await send(identifyRequest({ token: await makeToken() }))).status).toBe(200);
  });
});

describe("browser access", () => {
  test("answers the WebView preflight for the app origin only", async () => {
    const response = await mf.dispatchFetch("http://worker.test/identify", {
      method: "OPTIONS",
      headers: { origin: APP_ORIGIN, "access-control-request-method": "POST", "access-control-request-headers": "authorization" },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(APP_ORIGIN);
    expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("authorization");
  });

  test("error responses carry the CORS header so the app can read them", async () => {
    const response = await identify(identifyRequest({ token: null }));
    expect(response.headers.get("access-control-allow-origin")).toBe(APP_ORIGIN);
  });

  test("other paths and methods are not served", async () => {
    expect((await mf.dispatchFetch("http://worker.test/other", { method: "POST" })).status).toBe(404);
    expect((await mf.dispatchFetch("http://worker.test/identify", { method: "GET" })).status).toBe(405);
  });
});
