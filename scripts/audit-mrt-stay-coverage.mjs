/**
 * travelSpots-list.json 전수 — resolveMrtStayQuery + (옵션) Edge LIVE.
 *
 *   node scripts/audit-mrt-stay-coverage.mjs
 *   MRT_STAY_AUDIT_LIVE=1 node scripts/audit-mrt-stay-coverage.mjs
 *   MRT_STAY_AUDIT_LIVE=1 MRT_STAY_AUDIT_CONCURRENCY=3 node scripts/audit-mrt-stay-coverage.mjs
 *   MRT_STAY_AUDIT_LIVE=1 MRT_STAY_AUDIT_LIMIT=20 node scripts/audit-mrt-stay-coverage.mjs
 *
 * LIVE는 배포된 fetch-mrt-stays 호출. Secrets: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveMrtStayQuery, isMrtDomesticLocation } from '../src/utils/mrtStayQuery.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LIST_PATH = join(ROOT, 'src/pages/Home/data/travelSpots-list.json');

const LIVE = process.env.MRT_STAY_AUDIT_LIVE === '1';
const CONCURRENCY = Math.max(1, Math.min(6, Number(process.env.MRT_STAY_AUDIT_CONCURRENCY) || 3));
const LIMIT = Number(process.env.MRT_STAY_AUDIT_LIMIT) || 0;
const OFFSET = Math.max(0, Number(process.env.MRT_STAY_AUDIT_OFFSET) || 0);
const OUT_DIR =
  process.env.MRT_STAY_AUDIT_OUT ||
  (process.platform === 'win32'
    ? join(ROOT, 'tmp', 'mrt-stay-audit')
    : '/opt/cursor/artifacts/mrt-stay-audit');

function loadSpots() {
  const raw = JSON.parse(readFileSync(LIST_PATH, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('travelSpots-list.json must be array');
  let spots = raw.filter((s) => s && s.slug);
  if (OFFSET) spots = spots.slice(OFFSET);
  if (LIMIT > 0) spots = spots.slice(0, LIMIT);
  return spots;
}

async function mapPool(items, concurrency, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return out;
}

async function liveFetch(url, anon, body) {
  const res = await fetch(`${url}/functions/v1/fetch-mrt-stays`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data };
}

function classifyLive(data, httpStatus) {
  if (httpStatus >= 500 || data?.ok === false) {
    return { kind: 'error', total: 0, n: 0, region: null, detail: data?.error || data?.detail || `HTTP ${httpStatus}` };
  }
  const items = data?.items || [];
  const n = items.length;
  const total = Number(data?.totalCount ?? n) || 0;
  const region = data?.region
    ? `${data.region.name || ''}|${data.region.subName || ''}|${data.region.type || ''}`
    : null;
  if (!data?.region?.regionId) {
    return { kind: 'no_region', total: 0, n: 0, region: null, usedKeyword: data?.usedKeyword || null };
  }
  if (n > 0 || total > 0) {
    return {
      kind: 'ok',
      total,
      n,
      region,
      usedKeyword: data?.usedKeyword || null,
      priced: items.filter((it) => Number(it?.salePrice) > 0).length,
    };
  }
  return { kind: 'empty', total: 0, n: 0, region, usedKeyword: data?.usedKeyword || null };
}

async function main() {
  const spots = loadSpots();
  console.log(`spots=${spots.length} live=${LIVE} concurrency=${CONCURRENCY} offset=${OFFSET}`);

  const queryRows = spots.map((spot) => {
    const location = {
      slug: spot.slug,
      name: spot.name,
      name_en: spot.name_en,
      country: spot.country,
      country_en: spot.country_en,
    };
    const q = resolveMrtStayQuery(location);
    return {
      slug: spot.slug,
      name: spot.name,
      country: spot.country || '',
      keyword: q.keyword,
      altKeywords: q.altKeywords,
      countryHint: q.countryHint,
      countryHintAlts: q.countryHintAlts,
      nameEn: spot.name_en || '',
      isDomestic: isMrtDomesticLocation(location),
      queryOk: Boolean(q.keyword),
    };
  });

  const noKeyword = queryRows.filter((r) => !r.queryOk);
  if (noKeyword.length) {
    console.warn(`WARN query keyword empty: ${noKeyword.length}`);
  }

  let liveRows = [];
  if (LIVE) {
    const url = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
    const anon = String(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
    if (!url || !anon) {
      console.error('LIVE requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      process.exit(1);
    }

    let done = 0;
    liveRows = await mapPool(queryRows, CONCURRENCY, async (row) => {
      if (!row.queryOk) {
        done += 1;
        return { ...row, kind: 'no_keyword', total: 0, n: 0, region: null };
      }
      try {
        const { status, data } = await liveFetch(url, anon, {
          keyword: row.keyword,
          isDomestic: row.isDomestic,
          countryHint: row.countryHint,
          countryHintAlts: row.countryHintAlts,
          altKeywords: row.altKeywords,
          nameEn: row.nameEn || '',
          size: 5,
        });
        const cls = classifyLive(data, status);
        done += 1;
        if (done % 25 === 0 || done === queryRows.length) {
          console.error(`… ${done}/${queryRows.length}`);
        }
        return { ...row, ...cls };
      } catch (err) {
        done += 1;
        return {
          ...row,
          kind: 'error',
          total: 0,
          n: 0,
          region: null,
          detail: err instanceof Error ? err.message : String(err),
        };
      }
    });
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const base = LIVE ? `mrt-stay-coverage-live-${stamp}` : `mrt-stay-coverage-query-${stamp}`;

  if (!LIVE) {
    const outPath = join(OUT_DIR, `${base}.json`);
    writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: queryRows.length, rows: queryRows }, null, 2));
    console.log(`wrote ${outPath}`);
    console.log(`queryOk=${queryRows.filter((r) => r.queryOk).length} noKeyword=${noKeyword.length}`);
    return;
  }

  const byKind = {};
  for (const r of liveRows) {
    byKind[r.kind] = (byKind[r.kind] || 0) + 1;
  }

  const failKinds = new Set(['no_region', 'empty', 'error', 'no_keyword']);
  const fails = liveRows.filter((r) => failKinds.has(r.kind));
  const oks = liveRows.filter((r) => r.kind === 'ok');

  const summary = {
    generatedAt: new Date().toISOString(),
    count: liveRows.length,
    byKind,
    ok: oks.length,
    fail: fails.length,
    okRate: liveRows.length ? Number((oks.length / liveRows.length).toFixed(4)) : 0,
  };

  const jsonPath = join(OUT_DIR, `${base}.json`);
  const mdPath = join(OUT_DIR, `${base}.md`);
  writeFileSync(
    jsonPath,
    JSON.stringify({ ...summary, fails, okSample: oks.slice(0, 20), all: liveRows }, null, 2),
  );

  const lines = [
    `# MRT 숙소 커버리지 LIVE (${stamp})`,
    '',
    `- 대상: travelSpots-list.json ${liveRows.length}곳`,
    `- OK: **${oks.length}** · Fail: **${fails.length}** · 성공률 ${(summary.okRate * 100).toFixed(1)}%`,
    `- byKind: ${Object.entries(byKind).map(([k, v]) => `${k}=${v}`).join(' · ')}`,
    '',
    '## 실패 목록',
    '',
    '| slug | name | country | kind | keyword | region |',
    '|------|------|---------|------|---------|--------|',
  ];
  for (const r of fails.sort((a, b) => a.slug.localeCompare(b.slug))) {
    lines.push(
      `| ${r.slug} | ${r.name || ''} | ${r.country || ''} | ${r.kind} | ${r.keyword || ''} | ${(r.region || r.detail || '-').replace(/\|/g, '/')} |`,
    );
  }
  lines.push('', `JSON: \`${jsonPath.replace(`${ROOT}/`, '')}\``, '');
  writeFileSync(mdPath, lines.join('\n'));

  console.log(JSON.stringify(summary, null, 2));
  console.log(`wrote ${mdPath}`);
  console.log(`fails=${fails.length}`);
  for (const r of fails.slice(0, 40)) {
    console.log(`FAIL ${r.kind.padEnd(10)} ${r.slug}  kw=${r.keyword}  region=${r.region || r.detail || '-'}`);
  }
  if (fails.length > 40) console.log(`… +${fails.length - 40} more (see MD)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
