/**
 * gateo.kr 사이트·API 헬스 스모크 (Phase 1-A)
 * @see plans/site-health-monitoring-plan.md
 *
 * 역할: 빠른 liveness (HTML·JS 번들·Supabase REST·핵심 Edge 2종).
 * 기능 플로우(MRT·MOONi·갤러리 UI 등)는 E2E Health + smoke-health-pages.spec.js.
 */
import { loadEnvFile } from './lib/load-env-file.mjs';
import { smokeSupabaseFetch } from './lib/smoke-supabase-fetch.mjs';

if (!process.env.GITHUB_ACTIONS) {
  loadEnvFile();
}

const REQUEST_TIMEOUT_MS = 15_000;
const EDGE_PROBE_TIMEOUT_MS = 28_000;
const EDGE_PROBE_ATTEMPTS = 3;
const EDGE_PROBE_RETRY_MS = 1_500;

let siteUrl = (process.env.SMOKE_SITE_URL || 'https://gateo.kr').replace(/\/$/, '');
const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/\s+/g, '');
const isCi = process.env.GITHUB_ACTIONS === 'true';

function isLocalHost(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function allowInsecureLocalTls(url) {
  if (isLocalHost(url) && url.startsWith('https://')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

async function resolveSiteUrl(preferred) {
  allowInsecureLocalTls(preferred);
  if (!isLocalHost(preferred) || !preferred.startsWith('http://')) {
    return preferred;
  }
  try {
    const response = await fetchWithTimeout(`${preferred}/`);
    if (response.ok) return preferred;
  } catch {
    /* fall through */
  }
  const httpsUrl = preferred.replace(/^http:\/\//i, 'https://');
  allowInsecureLocalTls(httpsUrl);
  try {
    const response = await fetchWithTimeout(`${httpsUrl}/`);
    if (response.ok) {
      console.log(
        `[smoke-health] local HTTP unreachable — using ${httpsUrl} (Vite basic-ssl). Set SMOKE_SITE_URL=${httpsUrl}`,
      );
      return httpsUrl;
    }
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    console.log(
      `[smoke-health] local site probe failed (${preferred} / ${httpsUrl}): ${detail}. Is npm run dev running?`,
    );
  }
  return preferred;
}

/** @type {Array<{ id: string, name: string, status: 'pass' | 'warn' | 'fail' | 'skip', detail: string, priority: 'P0' | 'P1' }>} */
const checks = [];

function record(id, name, status, detail, priority) {
  checks.push({ id, name, status, detail, priority });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function supabaseFetch(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  return smokeSupabaseFetch(url, options, fetchWithTimeout, timeoutMs);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseJsonBody(response) {
  const raw = await response.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }
  return { raw, body };
}

function supabaseHeaders() {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

async function probeSiteHtml() {
  const id = 'P0-1';
  const name = 'Site HTML';
  try {
    const response = await fetchWithTimeout(`${siteUrl}/`);
    const html = await response.text();
    if (!response.ok) {
      record(id, name, 'fail', `HTTP ${response.status}`, 'P0');
      return;
    }
    const hasShell = /<title[\s>]/i.test(html) && /id=["']root["']/i.test(html);
    if (!hasShell) {
      record(id, name, 'fail', 'Missing <title> or #root in HTML', 'P0');
      return;
    }
    if (!/GATEO/i.test(html)) {
      record(id, name, 'fail', 'Missing GATEO in document title/meta', 'P0');
      return;
    }
    record(id, name, 'pass', `HTTP ${response.status}`, 'P0');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
}

async function probeJsBundle() {
  const id = 'P0-2';
  const name = 'Vite JS bundle';
  try {
    const home = await fetchWithTimeout(`${siteUrl}/`);
    const html = await home.text();
    if (!home.ok) {
      record(id, name, 'fail', `home HTTP ${home.status}`, 'P0');
      return;
    }
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!match) {
      record(id, name, 'fail', 'No /assets/index-*.js in index.html', 'P0');
      return;
    }
    const assetUrl = new URL(match[1], siteUrl).href;
    const asset = await fetchWithTimeout(assetUrl);
    const body = await asset.text();
    if (!asset.ok) {
      record(id, name, 'fail', `HTTP ${asset.status} for ${match[1]}`, 'P0');
      return;
    }
    if (body.length < 5000 || !/\b(import|export|function)\b/.test(body)) {
      record(id, name, 'fail', `Suspicious bundle payload (${body.length} bytes)`, 'P0');
      return;
    }
    record(id, name, 'pass', `${match[1]} (${body.length} bytes)`, 'P0');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
}

async function probeSupabaseRest() {
  const id = 'P0-3';
  const name = 'Supabase REST';
  if (!supabaseUrl || !anonKey) {
    record(
      id,
      name,
      'fail',
      isCi
        ? 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — Repository secrets 확인'
        : 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing',
      'P0',
    );
    return;
  }
  if (!anonKey.startsWith('eyJ') || anonKey.length < 100) {
    record(id, name, 'fail', 'anon key format invalid (JWT eyJ… expected)', 'P0');
    return;
  }
  try {
    const response = await supabaseFetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
      headers: supabaseHeaders(),
    });
    if (response.ok || response.status === 401) {
      record(id, name, 'pass', `HTTP ${response.status}`, 'P0');
      return;
    }
    record(id, name, 'fail', `HTTP ${response.status}`, 'P0');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
}

async function probeTourapiProxy() {
  const id = 'P0-4';
  const name = 'tourapi-proxy';

  if (!supabaseUrl || !anonKey) {
    record(id, name, 'fail', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing', 'P0');
    return;
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/tourapi-proxy`;
  const init = {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'searchKeyword',
      keyword: '경복궁',
      numOfRows: 3,
    }),
  };

  let lastDetail = 'unknown';

  for (let attempt = 1; attempt <= EDGE_PROBE_ATTEMPTS; attempt += 1) {
    try {
      const response = await supabaseFetch(url, init, EDGE_PROBE_TIMEOUT_MS);
      const { raw, body } = await parseJsonBody(response);
      const combined = `${response.status} ${raw}`;

      if (response.status === 401 || /UNAUTHORIZED|Invalid JWT/i.test(combined)) {
        record(id, name, 'fail', '401 Invalid JWT — check VITE_SUPABASE_ANON_KEY trim', 'P0');
        return;
      }

      if (/TOUR_API_SERVICE_KEY is not configured/i.test(combined)) {
        record(id, name, 'fail', 'TOUR_API_SERVICE_KEY missing on Edge', 'P0');
        return;
      }

      const n = Array.isArray(body?.items) ? body.items.length : 0;
      if (body?.ok === true && n >= 1) {
        record(
          id,
          name,
          'pass',
          attempt > 1 ? `ok items=${n} (attempt ${attempt})` : `ok items=${n}`,
          'P0',
        );
        return;
      }

      lastDetail =
        body?.error ||
        body?.message ||
        (body?.ok ? `items=${n}` : null) ||
        raw.slice(0, 200) ||
        `HTTP ${response.status}`;
    } catch (error) {
      lastDetail = error.name === 'AbortError' ? 'timeout' : error.message;
    }

    if (attempt < EDGE_PROBE_ATTEMPTS) {
      console.log(`[smoke-health] ${id} retry ${attempt}/${EDGE_PROBE_ATTEMPTS} — ${lastDetail}`);
      await sleep(EDGE_PROBE_RETRY_MS);
    }
  }

  record(id, name, 'warn', `${lastDetail} (after ${EDGE_PROBE_ATTEMPTS} attempts)`, 'P0');
}

async function probeFetchPlaceVideos() {
  const id = 'P0-5';
  const name = 'fetch-place-videos';

  if (!supabaseUrl || !anonKey) {
    record(id, name, 'fail', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing', 'P0');
    return;
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/fetch-place-videos`;
  const init = {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: '파리 여행 브이로그',
      fallbackQuery: 'Paris travel vlog',
      placeId: 'paris',
      mode: 'place',
      maxResults: 3,
      skipUpsert: true,
    }),
  };

  let lastDetail = 'unknown';

  for (let attempt = 1; attempt <= EDGE_PROBE_ATTEMPTS; attempt += 1) {
    try {
      const response = await supabaseFetch(url, init, EDGE_PROBE_TIMEOUT_MS);
      const { raw, body } = await parseJsonBody(response);
      const combined = `${response.status} ${raw}`;

      if (response.status === 401 || /UNAUTHORIZED|Invalid JWT/i.test(combined)) {
        record(id, name, 'fail', '401 Invalid JWT — check VITE_SUPABASE_ANON_KEY trim', 'P0');
        return;
      }

      const videos = Array.isArray(body?.videos) ? body.videos : [];
      if (body?.success === true && videos.length >= 1) {
        record(
          id,
          name,
          'pass',
          attempt > 1
            ? `videos=${videos.length} (attempt ${attempt})`
            : `videos=${videos.length}`,
          'P0',
        );
        return;
      }

      lastDetail = body?.error || raw.slice(0, 200) || `HTTP ${response.status}`;
    } catch (error) {
      lastDetail = error.name === 'AbortError' ? 'timeout' : error.message;
    }

    if (attempt < EDGE_PROBE_ATTEMPTS) {
      console.log(`[smoke-health] ${id} retry ${attempt}/${EDGE_PROBE_ATTEMPTS} — ${lastDetail}`);
      await sleep(EDGE_PROBE_RETRY_MS);
    }
  }

  record(id, name, 'warn', `${lastDetail} (after ${EDGE_PROBE_ATTEMPTS} attempts)`, 'P0');
}

async function probeSitemap() {
  const id = 'P1-1';
  const name = 'Sitemap';
  try {
    const response = await fetchWithTimeout(`${siteUrl}/sitemap.xml`);
    const xml = await response.text();
    if (!response.ok) {
      record(id, name, 'fail', `HTTP ${response.status}`, 'P1');
      return;
    }
    if (!/<urlset[\s>]/i.test(xml)) {
      record(id, name, 'fail', 'Missing <urlset> in sitemap.xml', 'P1');
      return;
    }
    record(id, name, 'pass', `HTTP ${response.status}`, 'P1');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P1');
  }
}

function printSummary() {
  const p0Checks = checks.filter((c) => c.priority === 'P0');
  const p0Failed = p0Checks.some((c) => c.status === 'fail');
  const ok = !p0Failed;

  for (const check of checks) {
    const tag = check.status.toUpperCase().padEnd(4);
    console.log(`[smoke-health] ${check.id} ${tag} ${check.name} — ${check.detail}`);
  }

  const p0Warn = p0Checks.filter((c) => c.status === 'warn');
  if (p0Warn.length && ok) {
    console.log(
      `[smoke-health] note: ${p0Warn.map((c) => c.id).join(', ')} warn (upstream degraded, exit 0)`,
    );
  }

  const summary = { ok, checks };
  console.log(JSON.stringify(summary));

  return ok ? 0 : 1;
}

siteUrl = await resolveSiteUrl(siteUrl);

await probeSiteHtml();
await probeJsBundle();
await probeSupabaseRest();
await probeTourapiProxy();
await probeFetchPlaceVideos();
await probeSitemap();

process.exit(printSummary());
