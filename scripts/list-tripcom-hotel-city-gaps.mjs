/**
 * Trip 호텔 CTA 후보인데 city ID 미등록인 slug 목록.
 *
 *   node scripts/list-tripcom-hotel-city-gaps.mjs
 *   MRT_STAY_AUDIT_JSON=tmp/mrt-stay-audit/mrt-stay-coverage-live-YYYY-MM-DD.json \
 *     node scripts/list-tripcom-hotel-city-gaps.mjs
 *
 * LIVE JSON이 있으면 empty · no_region · ok&(total≤LOW | priced≤LOW) 만 후보.
 * (priced = fetch 페이지 내 요금有 — 프로덕션 size50 감사와 맞출 것)
 * 없으면 travelSpots 전수 중 city·sparse 미등록을 나열(우선 태평양 배치 강조).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LIST_PATH = join(ROOT, 'src/pages/Home/data/travelSpots-list.json');
const AFFILIATE_PATH = join(ROOT, 'src/utils/affiliate.js');
const OUT_DIR =
  process.env.MRT_STAY_AUDIT_OUT ||
  (process.platform === 'win32'
    ? join(ROOT, 'tmp', 'mrt-stay-audit')
    : '/opt/cursor/artifacts/mrt-stay-audit');

/** 저재고 CTA와 동일 임계 (affiliate MRT_STAY_LOW_COUNT) */
const LOW = Number(process.env.MRT_STAY_LOW_COUNT) || 5;

/** 1차 배치·연쇄 QA 권역 (표시용) */
const PACIFIC_PRIORITY = new Set([
  'kosrae',
  'nauru',
  'kiribati',
  'yap',
  'tonga',
  'vanuatu',
  'rarotonga',
  'aitutaki',
  'samoa',
  'pohnpei',
  'chuuk',
  'fiji',
  'palau',
  'tuvalu',
]);

function parseAffiliateSets(src) {
  const cityIds = new Set();
  const cityBlock = src.match(
    /export const PLANNER_TRIPCOM_HOTEL_CITY_IDS\s*=\s*\{([\s\S]*?)\n\};/,
  );
  if (cityBlock) {
    for (const m of cityBlock[1].matchAll(/['"]?([a-z0-9-]+)['"]?\s*:\s*['"](\d+)['"]/g)) {
      cityIds.add(m[1]);
    }
  }
  const sparse = new Set();
  const sparseBlock = src.match(
    /export const TRIPCOM_HOTEL_SPARSE_INVENTORY_SLUGS\s*=\s*new Set\(\[([\s\S]*?)\]\)/,
  );
  if (sparseBlock) {
    for (const m of sparseBlock[1].matchAll(/['"]([a-z0-9-]+)['"]/g)) {
      sparse.add(m[1]);
    }
  }
  return { cityIds, sparse };
}

function findLatestLiveJson() {
  const envPath = process.env.MRT_STAY_AUDIT_JSON;
  if (envPath && existsSync(envPath)) return envPath;
  if (envPath && existsSync(join(ROOT, envPath))) return join(ROOT, envPath);
  if (!existsSync(OUT_DIR)) return null;
  const files = readdirSync(OUT_DIR)
    .filter((f) => /^mrt-stay-coverage-live-.*\.json$/.test(f))
    .sort()
    .reverse();
  return files.length ? join(OUT_DIR, files[0]) : null;
}

function loadLiveRows(jsonPath) {
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const rows = Array.isArray(raw.all) ? raw.all : Array.isArray(raw.rows) ? raw.rows : [];
  return { rows, meta: raw };
}

function isTripCtaCandidate(row) {
  if (!row) return false;
  if (row.kind === 'empty' || row.kind === 'no_region') return true;
  if (row.kind === 'ok') {
    const n = Number(row.n ?? 0);
    const total = Number(row.total ?? 0);
    const priced = Number(row.priced);
    // audit 샘플 n(페이지 크기)과 혼동 금지 — total이 있으면 total 기준
    const count = total > 0 ? total : n;
    if (count > 0 && count <= LOW) return true;
    // 프로덕션 GlobeStayStrip: bookableCount(priced) ≤ LOW → Trip CTA
    if (Number.isFinite(priced) && priced >= 0 && priced <= LOW) return true;
  }
  return false;
}

function main() {
  const affiliateSrc = readFileSync(AFFILIATE_PATH, 'utf8');
  const { cityIds, sparse } = parseAffiliateSets(affiliateSrc);
  const spots = JSON.parse(readFileSync(LIST_PATH, 'utf8')).filter((s) => s?.slug);

  const livePath = findLatestLiveJson();
  let gaps = [];

  if (livePath) {
    const { rows } = loadLiveRows(livePath);
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    for (const spot of spots) {
      const slug = String(spot.slug).toLowerCase();
      if (cityIds.has(slug) || sparse.has(slug)) continue;
      const live = bySlug.get(slug) || bySlug.get(spot.slug);
      if (!live || !isTripCtaCandidate(live)) continue;
      gaps.push({
        slug,
        name: spot.name || '',
        country: spot.country || '',
        kind: live.kind,
        n: live.n ?? 0,
        total: live.total ?? 0,
        pacific: PACIFIC_PRIORITY.has(slug),
      });
    }
  } else {
    for (const spot of spots) {
      const slug = String(spot.slug).toLowerCase();
      if (cityIds.has(slug) || sparse.has(slug)) continue;
      gaps.push({
        slug,
        name: spot.name || '',
        country: spot.country || '',
        kind: 'no_live',
        n: '',
        total: '',
        pacific: PACIFIC_PRIORITY.has(slug),
      });
    }
  }

  gaps.sort((a, b) => {
    if (a.pacific !== b.pacific) return a.pacific ? -1 : 1;
    return a.slug.localeCompare(b.slug);
  });

  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const mdPath = join(OUT_DIR, `tripcom-hotel-city-gaps-${stamp}.md`);
  const jsonPath = join(OUT_DIR, `tripcom-hotel-city-gaps-${stamp}.json`);

  const lines = [
    `# Trip.com 호텔 city ID gap (${stamp})`,
    '',
    livePath
      ? `- LIVE: \`${livePath.replace(`${ROOT}/`, '').replace(`${ROOT}\\`, '')}\` · CTA 후보(empty/no_region/ok&total≤${LOW}|priced≤${LOW}) 중 city·sparse 미등록`
      : `- LIVE JSON 없음 → city·sparse 미등록 전수 (우선 태평양 표시). \`MRT_STAY_AUDIT_LIVE=1 npm run audit:mrt-stays\` 후 재실행`,
    `- city 등록: **${cityIds.size}** · sparse: **${sparse.size}** · gap: **${gaps.length}** (태평양 우선 ${gaps.filter((g) => g.pacific).length})`,
    '',
    '| slug | name | country | kind | n | total | pacific |',
    '|------|------|---------|------|---|-------|---------|',
  ];
  for (const g of gaps) {
    lines.push(
      `| ${g.slug} | ${g.name} | ${g.country} | ${g.kind} | ${g.n} | ${g.total} | ${g.pacific ? 'Y' : ''} |`,
    );
  }
  lines.push('');
  writeFileSync(mdPath, lines.join('\n'));
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        livePath,
        low: LOW,
        cityRegistered: cityIds.size,
        sparse: sparse.size,
        gapCount: gaps.length,
        gaps,
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        livePath: livePath || null,
        cityRegistered: cityIds.size,
        sparse: sparse.size,
        gaps: gaps.length,
        pacificGaps: gaps.filter((g) => g.pacific).map((g) => g.slug),
      },
      null,
      2,
    ),
  );
  console.log(`wrote ${mdPath}`);
  if (!livePath) {
    console.log('HINT: run LIVE audit first for CTA-filtered gaps');
  }
}

main();
