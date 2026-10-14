import {
  classifyGeminiProxyFailure,
  GeminiProxyError,
} from './geminiProxyError.js';
import { parseGeminiProxySuccess } from './geminiProxyResult.js';
import {
  isAccessTokenExpired,
  isJwtGatewayRejection,
  selectGeminiProxyBearer,
} from './geminiProxyAuth.js';

/**
 * Refresh an expired session before the call.
 * The ES256 token is not the Authorization bearer. A fresh one can still
 * be verified from the request body for the per-user limit.
 * @param {{ auth: { getSession: () => Promise<{ data?: { session?: { access_token?: string } | null } }>, refreshSession: () => Promise<{ data?: { session?: { access_token?: string } | null } }> } }} client
 */
export async function resolveGeminiProxyAccessToken(client) {
  const { data } = await client.auth.getSession();
  let token = data?.session?.access_token || null;
  if (!token) return null;
  if (isAccessTokenExpired(token)) {
    const refreshed = await client.auth.refreshSession();
    token = refreshed?.data?.session?.access_token || token;
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
 *   invoke: (args: { authorization: string, userJwt: string | null, task: string, params: object }) => Promise<{
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
    userJwt: first.userJwt,
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
