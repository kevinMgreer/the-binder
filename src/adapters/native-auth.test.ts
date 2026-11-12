import { beforeEach, describe, expect, test, vi } from "vitest";
import { AuthExpiredError } from "../ports";
import { DRIVE_SCOPES, NativeGoogleAuthProvider, type NativeAuthPlugin } from "./native-auth";

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const jwt = (exp: number) => `h.${b64({ exp, email: "owner@example.test" })}.s`;

type Authorization = { accessToken: string; expiresInSeconds: number } | null;

class FakePlugin implements NativeAuthPlugin {
  signInResult: { idToken: string; email: string } | null = null;
  silentResult: { idToken: string; email: string } | null = null;
  authorizeResults: Authorization[] = [];
  authorizeCalls: { scopes: string[]; interactive: boolean; email?: string }[] = [];
  serverClientIds: string[] = [];
  cleared = false;
  clearedTokens: string[] = [];
  order: string[] = [];

  async clearToken(opts: { token: string }) {
    this.order.push(`clearToken:${opts.token}`);
    this.clearedTokens.push(opts.token);
  }
  async signIn(opts: { serverClientId: string }) {
    this.serverClientIds.push(opts.serverClientId);
    return this.signInResult;
  }
  async silentSignIn(opts: { serverClientId: string }) {
    this.serverClientIds.push(opts.serverClientId);
    return this.silentResult;
  }
  async authorize(opts: { scopes: string[]; interactive: boolean; email?: string }) {
    this.order.push("authorize");
    this.authorizeCalls.push(opts);
    await Promise.resolve();
    return this.authorizeResults.shift() ?? null;
  }
  async clearCredentialState() {
    this.cleared = true;
    this.silentResult = null;
  }
}

let nowMs: number;
let plugin: FakePlugin;
let fetchMock: ReturnType<typeof vi.fn>;
let auth: NativeGoogleAuthProvider;
const idToken = (lifetimeSeconds = 3600) => jwt(Math.floor(nowMs / 1000) + lifetimeSeconds);

beforeEach(() => {
  nowMs = Date.UTC(2026, 5, 1);
  plugin = new FakePlugin();
  fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
  auth = new NativeGoogleAuthProvider(plugin, {
    webClientId: "web-client-id",
    now: () => nowMs,
    fetch: fetchMock as unknown as typeof fetch,
  });
});

async function signedIn() {
  plugin.signInResult = { idToken: idToken(), email: "owner@example.test" };
  plugin.authorizeResults.push({ accessToken: "access-1", expiresInSeconds: 3600 });
  return auth.signIn();
}

describe("sign in with Google", () => {
  test("signs in with the web client id and requests only the drive.file scope", async () => {
    expect(await signedIn()).toEqual({ email: "owner@example.test" });
    expect(plugin.serverClientIds).toEqual(["web-client-id"]);
    expect(plugin.authorizeCalls).toEqual([{ scopes: DRIVE_SCOPES, interactive: true, email: "owner@example.test" }]);
    expect(DRIVE_SCOPES).toEqual(["https://www.googleapis.com/auth/drive.file"]);
  });

  test("cancelling the account picker signs nobody in and asks for no Drive access", async () => {
    plugin.signInResult = null;
    expect(await auth.signIn()).toBeNull();
    expect(plugin.authorizeCalls).toEqual([]);
  });

  test("declining Drive access leaves the user signed out", async () => {
    plugin.signInResult = { idToken: idToken(), email: "owner@example.test" };
    plugin.authorizeResults.push(null);
    expect(await auth.signIn()).toBeNull();
    expect(await auth.currentUser()).toBeNull();
  });

  test("a returning user is signed in silently at launch", async () => {
    plugin.silentResult = { idToken: idToken(), email: "owner@example.test" };
    plugin.authorizeResults.push({ accessToken: "access-1", expiresInSeconds: 3600 });
    expect(await auth.currentUser()).toEqual({ email: "owner@example.test" });
    expect(plugin.authorizeCalls).toEqual([{ scopes: DRIVE_SCOPES, interactive: false, email: "owner@example.test" }]);
  });

  test("a returning user whose Drive access was revoked must sign in again", async () => {
    plugin.silentResult = { idToken: idToken(), email: "owner@example.test" };
    plugin.authorizeResults.push(null);
    expect(await auth.currentUser()).toBeNull();
  });
});

describe("session renewal", () => {
  test("an expired access token is renewed silently when Drive is next needed", async () => {
    await signedIn();
    expect(await auth.getAccessToken()).toBe("access-1");

    nowMs += 3600 * 1000;
    plugin.authorizeResults.push({ accessToken: "access-2", expiresInSeconds: 3600 });
    expect(await auth.getAccessToken()).toBe("access-2");
    expect(plugin.authorizeCalls.at(-1)).toEqual({ scopes: DRIVE_SCOPES, interactive: false, email: "owner@example.test" });

    expect(await auth.getAccessToken()).toBe("access-2");
    expect(plugin.authorizeCalls).toHaveLength(2);
  });

  test("concurrent Drive calls share one renewal", async () => {
    await signedIn();
    nowMs += 3600 * 1000;
    plugin.authorizeResults.push({ accessToken: "access-2", expiresInSeconds: 3600 });
    const tokens = await Promise.all([auth.getAccessToken(), auth.getAccessToken(), auth.getAccessToken()]);
    expect(tokens).toEqual(["access-2", "access-2", "access-2"]);
    expect(plugin.authorizeCalls).toHaveLength(2);
  });

  test("silent renewal refused by Google raises AuthExpiredError", async () => {
    await signedIn();
    nowMs += 3600 * 1000;
    plugin.authorizeResults.push(null);
    await expect(auth.getAccessToken()).rejects.toBeInstanceOf(AuthExpiredError);
  });

  test("an expired ID token is renewed silently, or raises AuthExpiredError when refused", async () => {
    await signedIn();
    nowMs += 3600 * 1000;
    plugin.silentResult = { idToken: idToken(), email: "owner@example.test" };
    expect(await auth.getIdToken()).toBe(plugin.silentResult.idToken);

    nowMs += 3600 * 1000;
    plugin.silentResult = null;
    await expect(auth.getIdToken()).rejects.toBeInstanceOf(AuthExpiredError);
  });
});

describe("sign out", () => {
  test("revokes the access token and clears Credential Manager state", async () => {
    await signedIn();
    await auth.signOut();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("https://oauth2.googleapis.com/revoke");
    expect(String(url) + String(init?.body ?? "")).toContain("access-1");
    expect(init?.method).toBe("POST");
    expect(plugin.cleared).toBe(true);
    expect(await auth.currentUser()).toBeNull();
  });

  test("drops the revoked token from the Play services cache so the next sign-in cannot get it back", async () => {
    await signedIn();
    await auth.signOut();
    expect(plugin.clearedTokens).toEqual(["access-1"]);
  });

  test("signing in again drops the previously issued token before asking for a new one", async () => {
    await signedIn();
    plugin.order.length = 0;
    plugin.signInResult = { idToken: idToken(), email: "owner@example.test" };
    plugin.authorizeResults.push({ accessToken: "access-2", expiresInSeconds: 3600 });
    await auth.signIn();
    expect(plugin.order).toEqual(["clearToken:access-1", "authorize"]);
    expect(await auth.getAccessToken()).toBe("access-2");
  });

  test("still signs out and drops the token when the revoke request fails", async () => {
    await signedIn();
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await auth.signOut();
    expect(plugin.cleared).toBe(true);
    expect(plugin.clearedTokens).toEqual(["access-1"]);
    await expect(auth.getAccessToken()).rejects.toBeInstanceOf(AuthExpiredError);
  });
});

describe("remembered account (auth-resilience)", () => {
  let storage: Map<string, string>;
  const mapStorage = () => ({
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
  });

  beforeEach(() => {
    storage = new Map();
    auth = new NativeGoogleAuthProvider(plugin, {
      webClientId: "web-client-id",
      now: () => nowMs,
      fetch: fetchMock as unknown as typeof fetch,
      storage: mapStorage(),
      silentTimeoutMs: 20,
    });
  });

  test("signing in remembers the email and no token reaches storage", async () => {
    await signedIn();
    expect(storage.get("thebinder.email")).toBe("owner@example.test");
    const stored = [...storage.values()].join(" ");
    expect(stored).not.toContain("access-1");
    expect(stored).not.toContain(plugin.signInResult!.idToken);
  });

  test("with no remembered email currentUser is null when the silent path fails", async () => {
    plugin.silentResult = null;
    expect(await auth.currentUser()).toBeNull();
  });

  test.each([
    ["silentSignIn throws", () => void (plugin.silentSignIn = () => Promise.reject(new Error("offline")))],
    ["silentSignIn returns null", () => void (plugin.silentResult = null)],
    ["authorize returns null", () => void (plugin.silentResult = { idToken: idToken(), email: "owner@example.test" })],
    ["silentSignIn hangs", () => void (plugin.silentSignIn = () => new Promise(() => {}))],
  ])("a remembered user is returned without tokens when %s", async (_, arrange) => {
    storage.set("thebinder.email", "owner@example.test");
    arrange();
    expect(await auth.currentUser()).toEqual({ email: "owner@example.test" });
  });

  test("the remembered user's first Drive call renews lazily, and a refusal raises AuthExpiredError", async () => {
    storage.set("thebinder.email", "owner@example.test");
    plugin.silentResult = null;
    await auth.currentUser();
    plugin.authorizeResults.push(null);
    await expect(auth.getAccessToken()).rejects.toBeInstanceOf(AuthExpiredError);
    expect(plugin.authorizeCalls).toEqual([{ scopes: DRIVE_SCOPES, interactive: false, email: "owner@example.test" }]);
  });

  test("a successful silent path uses its account and remembers its email", async () => {
    storage.set("thebinder.email", "old@example.test");
    plugin.silentResult = { idToken: idToken(), email: "owner@example.test" };
    plugin.authorizeResults.push({ accessToken: "access-1", expiresInSeconds: 3600 });
    expect(await auth.currentUser()).toEqual({ email: "owner@example.test" });
    expect(storage.get("thebinder.email")).toBe("owner@example.test");
    expect(await auth.getAccessToken()).toBe("access-1");
  });

  test("signing out forgets the email", async () => {
    await signedIn();
    await auth.signOut();
    expect(storage.has("thebinder.email")).toBe(false);
    expect(await auth.currentUser()).toBeNull();
  });

  test("authorize is pinned to the signed-in account", async () => {
    await signedIn();
    expect(plugin.authorizeCalls).toEqual([{ scopes: DRIVE_SCOPES, interactive: true, email: "owner@example.test" }]);
  });

  test("dropAccessToken clears the cached token and drops the issued one once", async () => {
    await signedIn();
    await auth.dropAccessToken();
    expect(plugin.clearedTokens).toEqual(["access-1"]);
    plugin.authorizeResults.push({ accessToken: "access-2", expiresInSeconds: 3600 });
    expect(await auth.getAccessToken()).toBe("access-2");
  });
});
