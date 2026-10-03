/**
 * Playwright network guard for YouTube quota harness — never hit prod Supabase.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export const PROD_SUPABASE_REF = 'phdjnbfitvmrguqzverm';
export const DEFAULT_MOCK_SUPABASE_URL = 'https://mock-supa.invalid';

export function resolveMockSupabaseUrl() {
  const url = (process.env.VITE_SUPABASE_URL || DEFAULT_MOCK_SUPABASE_URL).replace(/\/$/, '');
  if (url.includes(PROD_SUPABASE_REF)) {
    console.error(`FAIL  VITE_SUPABASE_URL points at prod (${PROD_SUPABASE_REF})`);
    process.exit(1);
  }
  if (!process.env.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = url;
  }
  return url;
}

export function getMockSupabaseHost() {
  return new URL(resolveMockSupabaseUrl()).hostname;
}

export function isProdOrLiveSupabaseHost(hostname, mockHost) {
  if (hostname.includes(PROD_SUPABASE_REF)) return true;
  if (hostname.endsWith('.supabase.co') && hostname !== mockHost) return true;
  return false;
}

export function distBundleContainsProdRef() {
  const assetsDir = join(process.cwd(), 'dist', 'assets');
  if (!existsSync(assetsDir)) return false;
  for (const name of readdirSync(assetsDir)) {
    if (!name.endsWith('.js')) continue;
    const text = readFileSync(join(assetsDir, name), 'utf8');
    if (text.includes(PROD_SUPABASE_REF)) return true;
  }
  return false;
}

export function ensureHarnessPreviewBuild() {
  resolveMockSupabaseUrl();
  if (!existsSync(join(process.cwd(), 'dist', 'index.html')) || distBundleContainsProdRef()) {
    console.log('Building preview bundle with mock VITE_SUPABASE_URL…');
    const build = spawnSync('npm', ['run', 'build'], {
      env: { ...process.env, VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL },
      stdio: 'inherit',
      shell: false,
    });
    if (build.status !== 0) {
      console.error('FAIL  preview build');
      process.exit(build.status ?? 1);
    }
  }
  if (distBundleContainsProdRef()) {
    console.error('FAIL  dist still embeds prod Supabase ref after build');
    process.exit(1);
  }
}

export function createHarnessNetworkState() {
  return { externalRequests: [], unmockedSupabase: [] };
}

/**
 * Register first; add specific Supabase mocks after so they take precedence.
 */
export async function installSupabaseHarnessGuard(page, state) {
  const mockHost = getMockSupabaseHost();
  await page.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
      return route.continue();
    }
    if (isProdOrLiveSupabaseHost(u.hostname, mockHost)) {
      state.externalRequests.push({ method: req.method(), url: req.url() });
      return route.abort('blocked');
    }
    if (u.hostname === mockHost) {
      state.unmockedSupabase.push({
        method: req.method(),
        path: `${u.pathname}${u.search}`,
      });
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'harness: unmocked Supabase request',
          path: u.pathname,
        }),
      });
    }
    return route.continue();
  });
}

export async function installDefaultSupabaseHarnessMocks(page) {
  const json = (route, body) =>
    route.fulfill({ status: 200, contentType: 'application/json', body });
  await page.route('**/auth/v1/**', async (route) => {
    const u = new URL(route.request().url());
    if (u.pathname.endsWith('/user')) {
      return json(route, JSON.stringify({ message: 'not logged in' }));
    }
    return json(route, 'null');
  });
  await page.route('**/rest/v1/place_reviews**', async (route) => json(route, '[]'));
  await page.route('**/rest/v1/reports**', async (route) => json(route, '[]'));
  await page.route('**/rest/v1/profiles**', async (route) => json(route, '[]'));
  await page.route('**/storage/v1/**', async (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '[]' }),
  );
}

export function reportHarnessNetworkViolations(state) {
  let bad = 0;
  if (state.externalRequests.length > 0) {
    bad += 1;
    console.error('FAIL  external Supabase requests (prod/live):');
    for (const e of state.externalRequests) {
      console.error(`      ${e.method} ${e.url}`);
    }
  }
  if (state.unmockedSupabase.length > 0) {
    console.warn('WARN  unmocked mock Supabase (503, not forwarded):');
    for (const e of state.unmockedSupabase) {
      console.warn(`      ${e.method} ${e.path}`);
    }
  }
  return bad;
}
