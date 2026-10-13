/**
 * ES256 user access tokens for gemini-proxy rate-limit identity.
 * Authorization stays the HS256 anon key so verify_jwt can stay on.
 * The user token arrives in the JSON body (`userJwt`) and is verified
 * against the project JWKS before it can set a uid bucket.
 * Do not log token strings.
 */

const JWKS_TTL_MS = 10 * 60 * 1000;
const USER_JWT_MAX = 8192;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let jwksCache = null;

export function resetUserJwtCache() {
  jwksCache = null;
}

function bytesToJson(bytes) {
  return JSON.parse(new TextDecoder().decode(bytes));
}

function b64urlToBytes(segment) {
  if (!segment || typeof segment !== "string") return null;
  const pad = segment.length % 4 === 0 ? "" : "=".repeat(4 - (segment.length % 4));
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/") + pad;
  try {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function audienceOk(aud) {
  if (aud == null) return true;
  if (typeof aud === "string") return aud === "authenticated";
  return Array.isArray(aud) && aud.includes("authenticated");
}

/**
 * @param {string} token
 * @param {Array<Record<string, string>>} jwks
 * @param {number} [nowSec]
 * @returns {Promise<{ role: "authenticated", sub: string } | null>}
 */
export async function verifyEs256UserJwt(token, jwks, nowSec = Date.now() / 1000) {
  if (typeof token !== "string" || token.length === 0 || token.length > USER_JWT_MAX) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const headerBytes = b64urlToBytes(parts[0]);
  const payloadBytes = b64urlToBytes(parts[1]);
  const sig = b64urlToBytes(parts[2]);
  if (!headerBytes || !payloadBytes || !sig) return null;
  let header;
  let payload;
  try {
    header = bytesToJson(headerBytes);
    payload = bytesToJson(payloadBytes);
  } catch {
    return null;
  }
  if (!header || header.alg !== "ES256" || typeof header.kid !== "string" || !header.kid) return null;
  if (!payload || payload.role !== "authenticated") return null;
  if (typeof payload.sub !== "string" || !UUID_RE.test(payload.sub)) return null;
  if (!audienceOk(payload.aud)) return null;
  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp <= nowSec - 15) return null;
  const key = (jwks || []).find((item) => item && item.kid === header.kid && item.kty === "EC");
  if (!key?.x || !key?.y) return null;
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      { kty: "EC", crv: "P-256", x: key.x, y: key.y, alg: "ES256", ext: true },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, cryptoKey, sig, data);
    if (!ok) return null;
  } catch {
    return null;
  }
  return { role: "authenticated", sub: payload.sub };
}

/**
 * Gateway claims stay in force when the body token is missing or unverified.
 * A verified ES256 token replaces them so the uid bucket is the user id.
 * @param {{
 *   authorizationRole?: string | null,
 *   authorizationSub?: string | null,
 *   userJwt?: string,
 *   jwks?: Array<Record<string, string>>,
 *   nowSec?: number,
 * }} input
 */
export async function resolveRateLimitIdentity({
  authorizationRole = null,
  authorizationSub = null,
  userJwt = "",
  jwks = [],
  nowSec = Date.now() / 1000,
} = {}) {
  const gateway = {
    role: typeof authorizationRole === "string" ? authorizationRole : null,
    sub: typeof authorizationSub === "string" ? authorizationSub : null,
  };
  if (typeof userJwt !== "string" || userJwt.length === 0) {
    return { ...gateway, userJwt: "absent" };
  }
  const verified = await verifyEs256UserJwt(userJwt, jwks, nowSec);
  if (!verified) return { ...gateway, userJwt: "rejected" };
  return { role: verified.role, sub: verified.sub, userJwt: "verified" };
}

export async function loadProjectJwks(fetchImpl, supabaseUrl, nowMs = Date.now()) {
  if (jwksCache && nowMs - jwksCache.at < JWKS_TTL_MS) return jwksCache.keys;
  const base = String(supabaseUrl || "").replace(/\/$/, "");
  if (!base) throw new Error("jwks_unconfigured");
  const response = await fetchImpl(`${base}/auth/v1/.well-known/jwks.json`);
  if (!response?.ok) throw new Error("jwks_unavailable");
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("jwks_unavailable");
  }
  const keys = Array.isArray(body?.keys) ? body.keys : [];
  jwksCache = { keys, at: nowMs };
  return keys;
}
