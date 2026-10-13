/**
 * gemini-proxy gateway (`verify_jwt`) accepts the legacy HS256 anon key.
 * Logged-in access tokens are ES256. The gateway answers
 * 401 UNAUTHORIZED_ASYMMETRIC_JWT before the function runs, so MOONi
 * never receives a body. Send the anon key for those sessions.
 * Do not log token strings.
 */

function decodeJwtJson(segment) {
  if (!segment || typeof segment !== 'string') return null;
  try {
    const pad = segment.length % 4 === 0 ? '' : '='.repeat(4 - (segment.length % 4));
    const b64 = segment.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readJwtHeader(token) {
  const part = String(token || '').split('.')[0];
  const json = decodeJwtJson(part);
  return json && typeof json === 'object' ? json : null;
}

export function readJwtPayload(token) {
  const part = String(token || '').split('.')[1];
  const json = decodeJwtJson(part);
  return json && typeof json === 'object' ? json : null;
}

export function readJwtAlg(token) {
  const alg = readJwtHeader(token)?.alg;
  return typeof alg === 'string' ? alg : null;
}

export function readJwtRole(token) {
  const role = readJwtPayload(token)?.role;
  return typeof role === 'string' ? role : null;
}

export function isAccessTokenExpired(token, nowSec = Date.now() / 1000) {
  const exp = Number(readJwtPayload(token)?.exp);
  if (!Number.isFinite(exp)) return false;
  return exp <= nowSec + 15;
}

/**
 * @param {{ anonKey: string, accessToken?: string | null, nowSec?: number }} input
 * @returns {{ bearer: string, kind: 'anon' | 'anon-fallback' | 'user-hs256' }}
 */
export function selectGeminiProxyBearer({ anonKey, accessToken, nowSec }) {
  if (!accessToken || accessToken === anonKey) {
    return { bearer: anonKey, kind: 'anon' };
  }
  if (readJwtAlg(accessToken) !== 'HS256' || isAccessTokenExpired(accessToken, nowSec)) {
    return { bearer: anonKey, kind: 'anon-fallback' };
  }
  return { bearer: accessToken, kind: 'user-hs256' };
}

export function isJwtGatewayRejection(attempt) {
  const status = attempt?.status;
  const data = attempt?.data;
  const code = typeof data?.code === 'string' ? data.code : '';
  const message = typeof data?.message === 'string' ? data.message : '';
  if (status === 401) return true;
  return /UNAUTHORIZED_|Invalid JWT/i.test(`${code} ${message}`);
}

/** Logged-in health gate: a blank model string is a failed answer. */
export function loggedInMooniAnswerOk(text) {
  return typeof text === 'string' && text.trim().length > 0 && text.trim() !== '죄송합니다.';
}
