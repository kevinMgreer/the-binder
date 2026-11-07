const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const KEYS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const KEYS_TTL_MS = 60 * 60 * 1000;

type Jwk = JsonWebKey & { kid?: string };

let cache: { keys: Jwk[]; fetchedAt: number } | undefined;

async function googleKeys(now: number, refresh: boolean): Promise<Jwk[]> {
  if (!refresh && cache && now - cache.fetchedAt < KEYS_TTL_MS) return cache.keys;
  const response = await fetch(KEYS_URL);
  if (!response.ok) throw new Error("Google keys unavailable");
  const { keys } = (await response.json()) as { keys: Jwk[] };
  cache = { keys, fetchedAt: now };
  return keys;
}

function toBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const decodeJson = (base64url: string) => JSON.parse(new TextDecoder().decode(toBytes(base64url)));

/** Returns the verified email, or null for any problem; callers must not learn which check failed. */
export async function verifyGoogleIdToken(
  token: string,
  audience: string,
  now = Date.now(),
): Promise<{ email: string } | null> {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const { alg, kid } = decodeJson(header);
    if (alg !== "RS256" || typeof kid !== "string") return null;

    let jwk = (await googleKeys(now, false)).find((k) => k.kid === kid);
    jwk ??= (await googleKeys(now, true)).find((k) => k.kid === kid);
    if (!jwk) return null;

    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      toBytes(signature),
      new TextEncoder().encode(`${header}.${payload}`),
    );
    if (!valid) return null;

    const claims = decodeJson(payload);
    const verified = claims.email_verified === true || claims.email_verified === "true";
    if (
      !ISSUERS.includes(claims.iss) ||
      claims.aud !== audience ||
      typeof claims.exp !== "number" ||
      claims.exp * 1000 <= now ||
      !verified ||
      typeof claims.email !== "string"
    ) {
      return null;
    }
    return { email: claims.email };
  } catch {
    return null;
  }
}
