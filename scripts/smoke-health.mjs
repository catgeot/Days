/**
 * gateo.kr 사이트·API 헬스 스모크 (Phase 1-A)
 * @see plans/site-health-monitoring-plan.md
 */
import { loadEnvFile } from './lib/load-env-file.mjs';

if (!process.env.GITHUB_ACTIONS) {
  loadEnvFile();
}

const REQUEST_TIMEOUT_MS = 15_000;

let siteUrl = (process.env.SMOKE_SITE_URL || 'https://gateo.kr').replace(/\/$/, '');
const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/\s+/g, '');
const skipGemini = process.env.SMOKE_SKIP_GEMINI === '1';
const isCi = process.env.GITHUB_ACTIONS === 'true';

function isLocalHost(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

/** Vite basic-ssl(self-signed) 로컬 HTTPS — Node fetch가 인증서 거부하지 않도록 */
function allowInsecureLocalTls(url) {
  if (isLocalHost(url) && url.startsWith('https://')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

/**
 * 로컬에서 http://localhost:5173 로 치면 Vite HTTPS(dev)에 실패함 → https로 한 번 재시도.
 * @returns {Promise<string>}
 */
async function resolveSiteUrl(preferred) {
  allowInsecureLocalTls(preferred);
  if (!isLocalHost(preferred) || !preferred.startsWith('http://')) {
    return preferred;
  }
  try {
    const response = await fetchWithTimeout(`${preferred}/`);
    if (response.ok) return preferred;
  } catch {
    // fall through to https
  }
  const httpsUrl = preferred.replace(/^http:\/\//i, 'https://');
  allowInsecureLocalTls(httpsUrl);
  try {
    const response = await fetchWithTimeout(`${httpsUrl}/`);
    if (response.ok) {
      console.log(
        `[smoke-health] local HTTP unreachable — using ${httpsUrl} (Vite basic-ssl). Set SMOKE_SITE_URL=${httpsUrl}`
      );
      return httpsUrl;
    }
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    console.log(
      `[smoke-health] local site probe failed (${preferred} / ${httpsUrl}): ${detail}. Is npm run dev running?`
    );
  }
  return preferred;
}

/** @type {Array<{ id: string, name: string, status: 'pass' | 'warn' | 'fail' | 'skip', detail: string, priority: 'P0' | 'P1' }>} */
const checks = [];

function record(id, name, status, detail, priority) {
  checks.push({ id, name, status, detail, priority });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
    const hasShell = /<title[\s>]/i.test(html) || /id=["']root["']/i.test(html);
    if (!hasShell) {
      record(id, name, 'fail', 'Missing <title> or #root in HTML', 'P0');
      return;
    }
    record(id, name, 'pass', `HTTP ${response.status}`, 'P0');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
}

async function probeSupabaseRest() {
  const id = 'P0-2';
  const name = 'Supabase REST';
  if (!supabaseUrl || !anonKey) {
    record(
      id,
      name,
      'fail',
      isCi
        ? 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — Repository secrets 확인'
        : 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing',
      'P0'
    );
    return;
  }
  if (!anonKey.startsWith('eyJ') || anonKey.length < 100) {
    record(id, name, 'fail', 'anon key format invalid (JWT eyJ… expected)', 'P0');
    return;
  }
  try {
    const response = await fetchWithTimeout(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
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

async function probeGeminiProxy() {
  const id = 'P0-3';
  const name = 'gemini-proxy';

  if (skipGemini) {
    record(id, name, 'skip', 'SMOKE_SKIP_GEMINI=1', 'P0');
    return;
  }

  if (!supabaseUrl || !anonKey) {
    record(id, name, 'fail', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing', 'P0');
    return;
  }

  try {
    const response = await fetchWithTimeout(
      `${supabaseUrl.replace(/\/$/, '')}/functions/v1/gemini-proxy`,
      {
        method: 'POST',
        headers: {
          ...supabaseHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: 'gemini-3.1-flash-lite',
          parts: [{ text: 'ping' }],
        }),
      }
    );

    const raw = await response.text();
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }

    const combined = `${response.status} ${raw}`;

    if (response.status === 401 || /UNAUTHORIZED|Invalid JWT/i.test(combined)) {
      record(id, name, 'fail', '401 Invalid JWT — check VITE_SUPABASE_ANON_KEY trim', 'P0');
      return;
    }

    if (body?.success === true) {
      record(id, name, 'pass', `modelUsed=${body.modelUsed ?? 'unknown'}`, 'P0');
      return;
    }

    if (
      response.status === 429 ||
      /429|RESOURCE_EXHAUSTED|prepayment credits are depleted/i.test(combined)
    ) {
      record(id, name, 'warn', '429 RESOURCE_EXHAUSTED — Gemini credits depleted', 'P0');
      return;
    }

    const errMsg = body?.error || raw.slice(0, 200) || `HTTP ${response.status}`;
    record(id, name, 'fail', errMsg, 'P0');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
}

/**
 * MRT 숙소 Edge — Summary「숙소 찾기」의존.
 * Pass: HTTP 200 + ok. items 0은 warn (일시 재고·region).
 */
async function probeMrtStayProxy() {
  const id = 'P0-4';
  const name = 'fetch-mrt-stays';

  if (!supabaseUrl || !anonKey) {
    record(id, name, 'fail', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing', 'P0');
    return;
  }

  try {
    const response = await fetchWithTimeout(
      `${supabaseUrl.replace(/\/$/, '')}/functions/v1/fetch-mrt-stays`,
      {
        method: 'POST',
        headers: {
          ...supabaseHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: '덴파사르',
          isDomestic: false,
          countryHint: '인도네시아',
          countryHintAlts: ['Indonesia'],
          altKeywords: ['Denpasar', '우붓', 'Ubud', '발리', 'Bali'],
          nameEn: 'Bali',
          size: 3,
        }),
      }
    );

    const raw = await response.text();
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }

    const combined = `${response.status} ${raw}`;

    if (response.status === 401 || /UNAUTHORIZED|Invalid JWT/i.test(combined)) {
      record(id, name, 'fail', '401 Invalid JWT — check VITE_SUPABASE_ANON_KEY trim', 'P0');
      return;
    }

    if (response.status >= 500) {
      record(id, name, 'fail', `HTTP ${response.status}`, 'P0');
      return;
    }

    if (body?.ok === true) {
      const n = Array.isArray(body.items) ? body.items.length : 0;
      if (n === 0) {
        record(
          id,
          name,
          'warn',
          `ok but items=0 (region=${body.region?.subName || body.region?.name || '-'})`,
          'P0'
        );
        return;
      }
      record(id, name, 'pass', `ok items=${n}`, 'P0');
      return;
    }

    const errMsg = body?.error || body?.message || raw.slice(0, 200) || `HTTP ${response.status}`;
    record(id, name, 'fail', errMsg, 'P0');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
}

/** TourAPI Edge — 국내 갤러리·명소 좌표. Pass: searchKeyword 경복궁 items≥1 */
async function probeTourapiProxy() {
  const id = 'P0-5';
  const name = 'tourapi-proxy';

  if (!supabaseUrl || !anonKey) {
    record(id, name, 'fail', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing', 'P0');
    return;
  }

  try {
    const response = await fetchWithTimeout(
      `${supabaseUrl.replace(/\/$/, '')}/functions/v1/tourapi-proxy`,
      {
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
      }
    );

    const raw = await response.text();
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }

    const combined = `${response.status} ${raw}`;

    if (response.status === 401 || /UNAUTHORIZED|Invalid JWT/i.test(combined)) {
      record(id, name, 'fail', '401 Invalid JWT — check VITE_SUPABASE_ANON_KEY trim', 'P0');
      return;
    }

    if (response.status >= 500) {
      record(id, name, 'fail', `HTTP ${response.status}`, 'P0');
      return;
    }

    const n = Array.isArray(body?.items) ? body.items.length : 0;
    if (body?.ok === true && n >= 1) {
      record(id, name, 'pass', `ok items=${n}`, 'P0');
      return;
    }

    const errMsg =
      body?.error || body?.message || (body?.ok ? `items=${n}` : null) || raw.slice(0, 200) ||
      `HTTP ${response.status}`;
    record(id, name, 'fail', errMsg, 'P0');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P0');
  }
}

async function probePlaceCardShell() {
  const id = 'P1-1';
  const name = 'PlaceCard shell';
  try {
    const response = await fetchWithTimeout(`${siteUrl}/place/bali`);
    if (response.ok) {
      record(id, name, 'pass', `HTTP ${response.status}`, 'P1');
      return;
    }
    record(id, name, 'fail', `HTTP ${response.status}`, 'P1');
  } catch (error) {
    const detail = error.name === 'AbortError' ? 'timeout' : error.message;
    record(id, name, 'fail', detail, 'P1');
  }
}

async function probeSitemap() {
  const id = 'P1-2';
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
  const p0Warn = p0Checks.some((c) => c.status === 'warn');
  const failOnWarn = process.env.SMOKE_FAIL_ON_WARN === '1';
  const ok = !p0Failed && !(failOnWarn && p0Warn);

  for (const check of checks) {
    const tag = check.status.toUpperCase().padEnd(4);
    console.log(`[smoke-health] ${check.id} ${tag} ${check.name} — ${check.detail}`);
  }

  if (failOnWarn && p0Warn && !p0Failed) {
    console.log('[smoke-health] SMOKE_FAIL_ON_WARN=1 — P0 warn treated as failure for alerting');
  }

  const summary = { ok, checks };
  console.log(JSON.stringify(summary));

  return ok ? 0 : 1;
}

siteUrl = await resolveSiteUrl(siteUrl);

await probeSiteHtml();
await probeSupabaseRest();
await probeGeminiProxy();
await probeMrtStayProxy();
await probeTourapiProxy();
await probePlaceCardShell();
await probeSitemap();

process.exit(printSummary());
