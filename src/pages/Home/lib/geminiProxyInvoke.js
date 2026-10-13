import {
  classifyGeminiProxyFailure,
  GeminiProxyError,
} from './geminiProxyError.js';
import { parseGeminiProxySuccess } from './geminiProxyResult.js';
import {
  isAccessTokenExpired,
  isJwtGatewayRejection,
  readJwtAlg,
  selectGeminiProxyBearer,
} from './geminiProxyAuth.js';

/**
 * Refresh only a legacy HS256 session that is about to expire.
 * ES256 access tokens stay rejected by verify_jwt even after refresh.
 * @param {{ auth: { getSession: () => Promise<{ data?: { session?: { access_token?: string } | null } }>, refreshSession: () => Promise<{ data?: { session?: { access_token?: string } | null } }> } }} client
 */
export async function resolveGeminiProxyAccessToken(client) {
  const { data } = await client.auth.getSession();
  let token = data?.session?.access_token || null;
  if (!token) return null;
  if (readJwtAlg(token) === 'HS256' && isAccessTokenExpired(token)) {
    const refreshed = await client.auth.refreshSession();
    token = refreshed?.data?.session?.access_token || null;
  }
  return token;
}

/**
 * @param {{
 *   anonKey: string,
 *   accessToken?: string | null,
 *   task: string,
 *   params: object,
 *   nowSec?: number,
 *   invoke: (args: { authorization: string, task: string, params: object }) => Promise<{
 *     ok: boolean,
 *     status: number | null,
 *     data: Record<string, unknown> | null,
 *     error?: unknown,
 *   }>,
 * }} input
 */
export async function invokeGeminiProxyWithSession({
  anonKey,
  accessToken,
  task,
  params,
  nowSec,
  invoke,
}) {
  const first = selectGeminiProxyBearer({ anonKey, accessToken, nowSec });
  const call = (bearer) => invoke({
    authorization: `Bearer ${bearer}`,
    task,
    params,
  });
  let attempt = await call(first.bearer);
  if (!attempt.ok && first.bearer !== anonKey && isJwtGatewayRejection(attempt)) {
    attempt = await call(anonKey);
  }
  if (!attempt.ok || !attempt.data?.success) {
    throw new GeminiProxyError(classifyGeminiProxyFailure({
      error: attempt.error,
      data: attempt.data,
      httpStatus: attempt.status,
    }));
  }
  return parseGeminiProxySuccess(attempt.data);
}
