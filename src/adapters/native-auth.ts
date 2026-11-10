import { AuthExpiredError, type AuthProvider } from "../ports";

// openid and email come with the ID token; drive.file is the only Drive scope (non-sensitive).
export const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const REFRESH_MARGIN_MS = 60_000;

export interface NativeAuthPlugin {
  /** Credential Manager account picker. Null when the user cancels. */
  signIn(opts: { serverClientId: string }): Promise<{ idToken: string; email: string } | null>;
  /** Sign in with an already authorized account and no UI. Null when there is none. */
  silentSignIn(opts: { serverClientId: string }): Promise<{ idToken: string; email: string } | null>;
  /** Drive authorization. `interactive` may show the consent screen. Null when refused. */
  authorize(opts: { scopes: string[]; interactive: boolean }): Promise<{ accessToken: string; expiresInSeconds: number } | null>;
  clearCredentialState(): Promise<void>;
  /** Drops an access token from the Play services cache, which otherwise hands a revoked token back on the next authorize. */
  clearToken(opts: { token: string }): Promise<void>;
}

interface Options {
  webClientId: string;
  now?: () => number;
  fetch?: typeof fetch;
}

interface Token {
  value: string;
  expiresAt: number;
}

function jwtExpiry(token: string): number {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
}

/** Tokens live in memory only; nothing is written to storage. */
export class NativeGoogleAuthProvider implements AuthProvider {
  private user: { email: string } | null = null;
  private idToken?: Token;
  private accessToken?: Token;
  private renewing?: Promise<string>;
  /** The last access token the platform gave us, so it can be dropped from its cache when it is revoked or rejected. */
  private issued?: string;
  private now: () => number;
  private fetch: typeof fetch;

  constructor(
    private plugin: NativeAuthPlugin,
    private options: Options,
  ) {
    this.now = options.now ?? Date.now;
    this.fetch = options.fetch ?? ((...args) => fetch(...args));
  }

  async signIn() {
    const account = await this.plugin.signIn({ serverClientId: this.options.webClientId });
    if (!account) return null;
    // After "Sign in again" the old token was rejected; without this the platform cache returns it again.
    await this.dropIssued();
    const access = await this.plugin.authorize({ scopes: DRIVE_SCOPES, interactive: true });
    if (!access) return null;
    return this.startSession(account, access);
  }

  async currentUser() {
    if (this.user) return this.user;
    const account = await this.plugin.silentSignIn({ serverClientId: this.options.webClientId });
    if (!account) return null;
    const access = await this.plugin.authorize({ scopes: DRIVE_SCOPES, interactive: false });
    if (!access) return null;
    return this.startSession(account, access);
  }

  getAccessToken(): Promise<string> {
    if (this.valid(this.accessToken)) return Promise.resolve(this.accessToken.value);
    this.renewing ??= this.renewAccess().finally(() => {
      this.renewing = undefined;
    });
    return this.renewing;
  }

  async getIdToken(): Promise<string> {
    if (this.valid(this.idToken)) return this.idToken.value;
    const account = this.user && (await this.plugin.silentSignIn({ serverClientId: this.options.webClientId }));
    if (!account) throw new AuthExpiredError("Sign in again");
    this.idToken = { value: account.idToken, expiresAt: jwtExpiry(account.idToken) };
    return account.idToken;
  }

  async signOut() {
    const token = this.accessToken?.value;
    this.user = null;
    this.idToken = undefined;
    this.accessToken = undefined;
    if (token) {
      try {
        await this.fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token }),
        });
      } catch {
        // Offline: the token expires on its own within the hour, and sign-out must still finish.
      }
    }
    await this.dropIssued(token);
    await this.plugin.clearCredentialState();
  }

  private async dropIssued(token = this.issued) {
    this.issued = undefined;
    if (!token) return;
    try {
      await this.plugin.clearToken({ token });
    } catch {
      // A cache miss must not block sign-in or sign-out; the token is revoked or expires on its own.
    }
  }

  private valid(token: Token | undefined): token is Token {
    return !!token && token.expiresAt - REFRESH_MARGIN_MS > this.now();
  }

  private startSession(account: { idToken: string; email: string }, access: { accessToken: string; expiresInSeconds: number }) {
    this.user = { email: account.email };
    this.idToken = { value: account.idToken, expiresAt: jwtExpiry(account.idToken) };
    this.accessToken = { value: access.accessToken, expiresAt: this.now() + access.expiresInSeconds * 1000 };
    this.issued = access.accessToken;
    return this.user;
  }

  private async renewAccess(): Promise<string> {
    const access = this.user && (await this.plugin.authorize({ scopes: DRIVE_SCOPES, interactive: false }));
    if (!access) throw new AuthExpiredError("Sign in again");
    this.accessToken = { value: access.accessToken, expiresAt: this.now() + access.expiresInSeconds * 1000 };
    this.issued = access.accessToken;
    return access.accessToken;
  }
}
