/**
 * Smoke Health — prod Supabase fetch with read-only guard (REST/RPC writes blocked).
 * @see e2e/readOnlyGuard.js SMOKE_PROBE_EDGE_FUNCTIONS
 */
import { classifySupabaseRequest, SMOKE_PROBE_EDGE_FUNCTIONS } from '../../e2e/readOnlyGuard.js';

export function assertSmokeSupabaseRequestAllowed(method, url) {
  const decision = classifySupabaseRequest(method, url, {
    edgeAllowlist: SMOKE_PROBE_EDGE_FUNCTIONS,
  });
  if (decision === 'reject') {
    throw new Error(`smoke read-only guard blocked ${method} ${url}`);
  }
}

export async function smokeSupabaseFetch(url, options = {}, fetchImpl, timeoutMs) {
  const method = options.method || 'GET';
  assertSmokeSupabaseRequestAllowed(method, url);
  return fetchImpl(url, options, timeoutMs);
}
