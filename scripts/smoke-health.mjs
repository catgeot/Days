/**
 * gateo.kr 사이트·API 헬스 스모크 (Phase 1-A)
 * @see plans/site-health-monitoring-plan.md
 *
 * 역할: 빠른 liveness (HTML·JS 번들·Supabase REST·DB 캐시·place_videos). Edge upstream 호출 최소화.
 * 기능 플로우(MRT·MOONi·갤러리 UI 등)는 E2E Health + smoke-health-pages.spec.js.
 */
import { loadEnvFile } from './lib/load-env-file.mjs';
import { smokeSupabaseFetch } from './lib/smoke-supabase-fetch.mjs';

if (!process.env.GITHUB_ACTIONS) {
  loadEnvFile();
}

const REQUEST_TIMEOUT_MS = 15_000;
/** Fail P0-4 when rolling12 cache row is older than this (hours). Override: SMOKE_FESTIVAL_CACHE_MAX_AGE_HOURS */
const FESTIVAL_CACHE_MAX_AGE_HOURS = Number(process.env.SMOKE_FESTIVAL_CACHE_MAX_AGE_HOURS) || 96;

let siteUrl = (process.env.SMOKE_SITE_URL || 'https://www.gateo.kr/').replace(/\/$/, '');
const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/\s+/g, '');
const isCi = process.env.GITHUB_ACTIONS === 'true';

/** @type {{ ok: boolean, status: number, html: string } | null} */
let siteHomeSnapshot = null;

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

function supabaseHeaders() {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

async function loadSiteHomeOnce() {
  if (siteHomeSnapshot) return siteHomeSnapshot;
  try {
    const response = await fetchWithTimeout(`${siteUrl}/`);
    const html = await response.text();
    siteHomeSnapshot = { ok: response.ok, status: response.status, html };
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    siteHomeSnapshot = { ok: false, status: 0, html: '', error: detail };
  }
  return siteHomeSnapshot;
}

async function probeSiteHtml() {
  const id = 'P0-1';
  const name = 'Site HTML';
  const home = await loadSiteHomeOnce();
  if (home.error) {
    record(id, name, 'fail', home.error, 'P0');
    return;
  }
  if (!home.ok) {
    record(id, name, 'fail', `HTTP ${home.status}`, 'P0');
    return;
  }
  const html = home.html;
  const hasShell = /<title[\s>]/i.test(html) && /id=["']root["']/i.test(html);
  if (!hasShell) {
    record(id, name, 'fail', 'Missing <title> or #root in HTML', 'P0');
    return;
  }
  if (!/GATEO/i.test(html)) {
    record(id, name, 'fail', 'Missing GATEO in document title/meta', 'P0');
    return;
  }
  record(id, name, 'pass', `HTTP ${home.status}`, 'P0');
}

async function probeJsBundle() {
  const id = 'P0-2';
  const name = 'Vite JS bundle';
  const home = await loadSiteHomeOnce();
  if (home.error) {
    record(id, name, 'fail', home.error, 'P0');
    return;
  }
  if (!home.ok) {
    record(id, name, 'fail', `home HTTP ${home.status}`, 'P0');
    return;
  }
  try {
    const match = home.html.match(/src="(\/assets\/index-[^"]+\.js)"/);
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

async function probeTourapiFestivalCache() {
  const id = 'P0-4';
  const name = 'tourapi festival cache';

  if (!supabaseUrl || !anonKey) {
    record(id, name, 'fail', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing', 'P0');
    return;
  }

  const base = supabaseUrl.replace(/\/$/, '');
  const cacheUrl =
    `${base}/rest/v1/tourapi_festival_cache` +
    '?select=cache_key,fetched_at,payload' +
    '&cache_key=like.list:ko:rolling12*' +
    '&order=fetched_at.desc' +
    '&limit=1';

  try {
    const response = await supabaseFetch(cacheUrl, {
      headers: { ...supabaseHeaders(), Accept: 'application/json' },
    });
    if (response.status === 401 || response.status === 403) {
      record(id, name, 'fail', `GET cache HTTP ${response.status} — anon SELECT policy`, 'P0');
      return;
    }
    if (!response.ok) {
      record(id, name, 'fail', `GET cache HTTP ${response.status}`, 'P0');
      return;
    }
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      record(id, name, 'fail', 'No rolling12 ko cache row (Edge festivalWindow may not have run)', 'P0');
      return;
    }
    const row = rows[0];
    const items = row?.payload?.items;
    const n = Array.isArray(items) ? items.length : 0;
    if (n < 1) {
      record(id, name, 'fail', `cache_key=${row?.cache_key ?? '?'} items=${n}`, 'P0');
      return;
    }
    const fetchedAt = row?.fetched_at ? Date.parse(row.fetched_at) : NaN;
    if (!Number.isFinite(fetchedAt)) {
      record(id, name, 'fail', 'fetched_at missing or invalid', 'P0');
      return;
    }
    const ageHours = (Date.now() - fetchedAt) / 3_600_000;
    if (ageHours > FESTIVAL_CACHE_MAX_AGE_HOURS) {
      record(
        id,
        name,
        'fail',
        `cache stale ${ageHours.toFixed(1)}h > ${FESTIVAL_CACHE_MAX_AGE_HOURS}h (${row.cache_key})`,
        'P0',
      );
      return;
    }
    record(
      id,
      name,
      'pass',
      `${row.cache_key} items=${n} age=${ageHours.toFixed(1)}h`,
      'P0',
    );
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
}

async function probeFetchPlaceVideos() {
  const id = 'P0-5';
  const name = 'place_videos cache';

  if (!supabaseUrl || !anonKey) {
    record(id, name, 'fail', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing', 'P0');
    return;
  }

  const base = supabaseUrl.replace(/\/$/, '');

  try {
    const cacheRes = await supabaseFetch(
      `${base}/rest/v1/place_videos?place_id=eq.paris&select=place_id,videos&limit=1`,
      {
        headers: { ...supabaseHeaders(), Accept: 'application/json' },
      },
    );
    if (cacheRes.status >= 400) {
      record(id, name, 'fail', `GET place_videos HTTP ${cacheRes.status}`, 'P0');
      return;
    }
    const rows = await cacheRes.json();
    if (!Array.isArray(rows)) {
      record(id, name, 'fail', 'GET place_videos body not array', 'P0');
      return;
    }
    if (rows.length === 0) {
      record(id, name, 'fail', 'No place_videos row for paris', 'P0');
      return;
    }
    const videos = rows[0]?.videos;
    const videoCount = Array.isArray(videos) ? videos.length : 0;
    if (videoCount < 1) {
      record(id, name, 'fail', 'paris place_videos cache empty', 'P0');
      return;
    }

    record(id, name, 'pass', `paris videos=${videoCount} (anon REST only, no Edge)`, 'P0');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
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
await probeTourapiFestivalCache();
await probeFetchPlaceVideos();
await probeSitemap();

process.exit(printSummary());
