import { identifyCard, type ClaudeEnv } from "./claude";
import { verifyGoogleIdToken } from "./google-token";

interface Env extends ClaudeEnv {
  OWNER_EMAIL: string;
  GOOGLE_WEB_CLIENT_ID: string;
  COUNTER: { get(key: string): Promise<string | null>; put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> };
  DAILY_LIMIT?: string;
  MAX_IMAGE_BYTES?: string;
  ALLOWED_ORIGIN?: string;
}

const DEFAULT_DAILY_LIMIT = 50;
const DEFAULT_MAX_IMAGE_BYTES = 1024 * 1024;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const COUNTER_TTL_SECONDS = 2 * 24 * 60 * 60;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // A native app has no trustworthy Origin, so it is only used to let the WebView read responses, never to allow requests.
    const cors = {
      "access-control-allow-origin": env.ALLOWED_ORIGIN ?? "https://localhost",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      vary: "Origin",
    };
    const reply = (status: number, body?: unknown) =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { ...cors, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      });

    const { pathname } = new URL(request.url);
    if (pathname !== "/identify") return reply(404, { error: "not_found" });
    if (request.method === "OPTIONS") return reply(204);
    if (request.method !== "POST") return reply(405, { error: "method_not_allowed" });

    const token = /^Bearer (.+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
    if (!token) return reply(401, { error: "unauthorized" });
    const user = await verifyGoogleIdToken(token, env.GOOGLE_WEB_CLIENT_ID);
    if (!user) return reply(401, { error: "unauthorized" });
    if (user.email.toLowerCase() !== env.OWNER_EMAIL.toLowerCase()) return reply(403, { error: "forbidden" });

    const maxBytes = Number(env.MAX_IMAGE_BYTES ?? DEFAULT_MAX_IMAGE_BYTES);
    if (Number(request.headers.get("content-length")) > maxBytes + MULTIPART_OVERHEAD_BYTES) {
      return reply(413, { error: "too_large" });
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return reply(400, { error: "bad_request" });
    }
    const images = ["front", "back"].map((side) => form.get(side)).filter((f): f is File => f instanceof File && f.size > 0);
    if (images.length === 0) return reply(400, { error: "no_image" });
    if (images.reduce((sum, f) => sum + f.size, 0) > maxBytes) return reply(413, { error: "too_large" });

    const key = `count:${new Date().toISOString().slice(0, 10)}`;
    const read = async () => Number((await env.COUNTER.get(key)) ?? 0);
    if ((await read()) >= Number(env.DAILY_LIMIT ?? DEFAULT_DAILY_LIMIT)) return reply(429, { error: "daily_limit" });

    try {
      const suggestion = await identifyCard(images, env);
      // Charged only after Claude answered, so failures cost no slot. KV is eventually consistent and has no atomic
      // increment: parallel requests can overshoot, so this cap is best-effort. The Anthropic spend limit is the hard cap.
      await env.COUNTER.put(key, String((await read()) + 1), { expirationTtl: COUNTER_TTL_SECONDS });
      return reply(200, suggestion);
    } catch {
      return reply(502, { error: "upstream" });
    }
  },
};
