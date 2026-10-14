/** Edge POST allowed during guarded E2E page loads (read path only). No billing / external POST beyond read-through cache. */
const READ_ONLY_EDGE_FUNCTIONS = [
  'fetch-mrt-stays',
  'fetch-mrt-tnas',
  'pexels-proxy',
  'tourapi-proxy', // service-role read-through cache upsert (same as visitor)
  'transport-proxy', // TAGO card read; server cache upsert only (same as visitor)
  'fetch-place-videos', // service-role read-through cache upsert (same as visitor)
];

/** Smoke uses anon REST only (no direct Edge POST). E2E uses READ_ONLY_EDGE_FUNCTIONS. */
export const SMOKE_PROBE_EDGE_FUNCTIONS = [];

/** Staging project only — never prod. Used by MOONi combo QA against live gemini-proxy. */
const STAGING_SUPABASE_PROJECT_HOST = 'qeqszwxjvhnbzhkchera.supabase.co';

export function classifySupabaseRequest(method, url, options = {}) {
  const edgeAllowlist = options.edgeAllowlist ?? READ_ONLY_EDGE_FUNCTIONS;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return 'allow';
  }

  if (!/\.supabase\.co$/i.test(parsed.hostname)) {
    return 'allow';
  }

  const upper = (method || 'GET').toUpperCase();
  if (upper === 'GET' || upper === 'HEAD' || upper === 'OPTIONS') {
    return 'allow';
  }

  const fnMatch = parsed.pathname.match(/^\/functions\/v1\/([^/]+)/);
  if (fnMatch) {
    const name = fnMatch[1];
    if (
      process.env.MOONI_STAGING_COMBO_QA === '1'
      && name === 'gemini-proxy'
      && parsed.hostname === STAGING_SUPABASE_PROJECT_HOST
    ) {
      return 'allow';
    }
    return edgeAllowlist.includes(name) ? 'allow' : 'reject';
  }

  return 'reject';
}

export async function installReadOnlyGuard(target, log = []) {
  await target.route(/\.supabase\.co\//i, async (route) => {
    const req = route.request();
    const decision = classifySupabaseRequest(req.method(), req.url());
    if (decision === 'reject') {
      let pathname = '/';
      try {
        pathname = new URL(req.url()).pathname;
      } catch {
        /* keep default */
      }
      log.push(`${req.method()} ${pathname}`);
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '42501',
          message: 'permission denied (e2e read-only guard)',
        }),
      });
      return;
    }
    await route.continue();
  });

  await target.route(/google-analytics\.com\/(g\/)?collect/i, async (route) => {
    await route.abort();
  });
}
