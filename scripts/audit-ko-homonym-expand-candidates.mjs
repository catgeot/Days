/**
 * Phase 0: 국내 동명 검색 확장 후보 추출
 * - 기본: 시드 + SSOT 짧은 한글명 분류 (Nominatim 없음)
 * - LIVE: KO_HOMONYM_EXPAND_LIVE=1 → Nominatim 순차 조회 · 지역 라벨 ≥2면 NEED_DISAMBIG
 * - DB: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY(또는 ANON) 있으면 search_dictionary 상위 병합
 *
 * 출력: scripts/out/ko-homonym-expand-candidates.json
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  formatKoHomonymRiRegionLabel,
  isKoHomonymRiSearchQuery,
} from '../src/pages/Home/lib/koHomonymRiSearch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'scripts/outputs');
const OUT_FILE = join(OUT_DIR, 'ko-homonym-expand-candidates.json');
const NOMINATIM_UA = 'ProjectDays/1.0 (contact: project.days.dev@gmail.com)';
const LIVE = process.env.KO_HOMONYM_EXPAND_LIVE === '1';
const LIVE_LIMIT = Math.min(40, Number(process.env.KO_HOMONYM_EXPAND_LIMIT || 25) || 25);
const DELAY_MS = Number(process.env.KO_HOMONYM_EXPAND_DELAY_MS || 1100) || 1100;

const SEED = [
  '대화리',
  '대화동',
  '대화면',
  '광주',
  '고성',
  '남양',
  '신촌',
  '중동',
  '사천',
  '진주',
  '공주',
  '세종',
  '제주',
  '남양주',
];

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function classifyPattern(q) {
  const s = String(q || '').trim();
  if (/리$/.test(s)) return 'ri';
  if (/읍$/.test(s)) return 'eup';
  if (/면$/.test(s)) return 'myeon';
  if (/동$/.test(s)) return 'dong';
  if (/시$/.test(s)) return 'si';
  if (/군$/.test(s)) return 'gun';
  if (/구$/.test(s)) return 'gu';
  return 'bare';
}

function coveredByCurrentRiPath(q) {
  return isKoHomonymRiSearchQuery(q);
}

function loadShortSsotNames() {
  const out = new Set();
  try {
    const hubsRaw = JSON.parse(
      readFileSync(join(ROOT, 'src/pages/Home/data/cityAttractionHubs.json'), 'utf8'),
    );
    const hubs = Array.isArray(hubsRaw)
      ? hubsRaw
      : Array.isArray(hubsRaw.hubs)
        ? hubsRaw.hubs
        : [];
    for (const h of hubs) {
      const country = String(h?.country || h?.country_en || '');
      if (!/대한.?민국|한국|Korea|KR/i.test(country)) continue;
      const n = String(h?.name || h?.name_ko || '').trim();
      if (n.length >= 2 && n.length <= 4 && HAS_HANGUL_RE.test(n) && !/\s/.test(n)) {
        out.add(n);
      }
    }
  } catch {
    /* ignore */
  }
    try {
    const settle = JSON.parse(
      readFileSync(join(ROOT, 'src/pages/Home/data/mapboxSettlementPlaces.json'), 'utf8'),
    );
    const hubs = Array.isArray(settle) ? settle : [];
    for (const hub of hubs) {
      const rows = Array.isArray(hub?.settlements) ? hub.settlements : [];
      for (const row of rows) {
        const n = String(row?.name || row?.name_ko || '').trim();
        // 정착지: 동·읍·면·리만 (잡음 bare 제외)
        if (!/[동읍면리]$/u.test(n)) continue;
        if (n.length >= 2 && n.length <= 6 && HAS_HANGUL_RE.test(n) && !/\s/.test(n)) {
          out.add(n);
        }
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const list = JSON.parse(
      readFileSync(join(ROOT, 'src/pages/Home/data/travelSpots-list.json'), 'utf8'),
    );
    const spots = Array.isArray(list) ? list : list?.spots || [];
    for (const s of spots) {
      const country = String(s?.country || '').trim();
      if (country !== '한국') continue;
      const n = String(s?.name || s?.name_ko || '').trim();
      if (n.length >= 2 && n.length <= 4 && HAS_HANGUL_RE.test(n) && !/\s/.test(n)) {
        out.add(n);
      }
    }
  } catch {
    /* ignore */
  }
  return [...out];
}

async function fetchSearchDictionaryQueries() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) {
    return { ok: false, reason: 'no_supabase_env', queries: [] };
  }
  try {
    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/search_dictionary?select=original_query&limit=300`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}`, queries: [] };
    }
    const rows = await res.json();
    const queries = [];
    const seen = new Set();
    for (const row of rows || []) {
      const q = String(row?.original_query || '').trim();
      if (!q || seen.has(q)) continue;
      if (!HAS_HANGUL_RE.test(q) || /\s/.test(q) || q.length > 8) continue;
      seen.add(q);
      queries.push(q);
    }
    return { ok: true, reason: 'ok', queries };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e), queries: [] };
  }
}

async function nominatimKrHits(q) {
  const params = new URLSearchParams({
    format: 'json',
    q,
    limit: '8',
    addressdetails: '1',
    countrycodes: 'kr',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      'User-Agent': NOMINATIM_UA,
      'Accept-Language': 'ko,en',
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function regionLabelsFromRows(rows) {
  const labels = [];
  const seen = new Set();
  for (const row of rows) {
    const address = row?.address || {};
    if (String(address.country_code || '').toLowerCase() === 'kr' || !address.country_code) {
      const label = formatKoHomonymRiRegionLabel(address, null);
      const key = label.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      labels.push(label);
    }
  }
  return labels;
}

function buildCandidate(query, source) {
  return {
    query,
    pattern: classifyPattern(query),
    source,
    coveredByRiPath: coveredByCurrentRiPath(query),
    expandGap: !coveredByCurrentRiPath(query),
    liveStatus: 'pending',
    regionLabels: [],
    regionCount: 0,
    flag: null,
  };
}

const byQuery = new Map();

function upsert(query, source) {
  const q = String(query || '').trim();
  if (!q) return;
  const prev = byQuery.get(q);
  if (prev) {
    if (!prev.source.includes(source)) prev.source = `${prev.source}+${source}`;
    return;
  }
  byQuery.set(q, buildCandidate(q, source));
}

for (const q of SEED) upsert(q, 'seed');
for (const q of loadShortSsotNames()) upsert(q, 'ssot');

const dict = await fetchSearchDictionaryQueries();
for (const q of dict.queries) upsert(q, 'search_dictionary');

const candidates = [...byQuery.values()].sort((a, b) => {
  if (a.expandGap !== b.expandGap) return a.expandGap ? -1 : 1;
  return a.query.localeCompare(b.query, 'ko');
});

if (LIVE) {
  const seedSet = new Set(SEED);
  const liveTargets = [
    ...candidates.filter((c) => seedSet.has(c.query)),
    ...candidates.filter(
      (c) =>
        !seedSet.has(c.query) &&
        (c.expandGap || c.pattern === 'ri' || c.pattern === 'dong' || c.pattern === 'bare'),
    ),
  ].slice(0, LIVE_LIMIT);
  console.log(`LIVE Nominatim: ${liveTargets.length} queries (delay ${DELAY_MS}ms)`);
  for (let i = 0; i < liveTargets.length; i += 1) {
    const c = liveTargets[i];
    try {
      const rows = await nominatimKrHits(c.query);
      const labels = regionLabelsFromRows(rows);
      c.liveStatus = 'ok';
      c.regionLabels = labels;
      c.regionCount = labels.length;
      c.flag = labels.length >= 2 ? 'NEED_DISAMBIG' : labels.length === 1 ? 'SINGLE' : 'NO_HIT';
      console.log(
        `[${i + 1}/${liveTargets.length}] ${c.query} (${c.pattern}) → ${c.flag} ${labels.join(' | ') || '-'}`,
      );
    } catch (e) {
      c.liveStatus = 'error';
      c.flag = 'ERROR';
      c.error = String(e?.message || e);
      console.warn(`[${i + 1}/${liveTargets.length}] ${c.query} ERROR`, e?.message || e);
    }
    if (i < liveTargets.length - 1) await delay(DELAY_MS);
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  live: LIVE,
  searchDictionary: { ok: dict.ok, reason: dict.reason, count: dict.queries.length },
  totals: {
    candidates: candidates.length,
    expandGap: candidates.filter((c) => c.expandGap).length,
    coveredByRiPath: candidates.filter((c) => c.coveredByRiPath).length,
    needDisambig: candidates.filter((c) => c.flag === 'NEED_DISAMBIG').length,
    byPattern: candidates.reduce((acc, c) => {
      acc[c.pattern] = (acc[c.pattern] || 0) + 1;
      return acc;
    }, {}),
  },
  decisionHint:
    'NEED_DISAMBIG + expandGap 위주로 동/bare/시·군 확장 O/X 결정. coveredByRiPath는 #36 회귀만 확인.',
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  OUT_FILE,
  JSON.stringify({ summary, candidates }, null, 2),
  'utf8',
);

console.log('\n=== summary ===');
console.log(JSON.stringify(summary, null, 2));
console.log(`\nwrote ${OUT_FILE}`);

const preview = candidates
  .filter((c) => c.flag === 'NEED_DISAMBIG' || (c.expandGap && !LIVE))
  .slice(0, 25);
console.log('\n=== preview (NEED or expandGap) ===');
for (const c of preview) {
  console.log(
    `- ${c.query}\t${c.pattern}\tgap=${c.expandGap}\t${c.flag || 'n/a'}\t${(c.regionLabels || []).join(',')}\t${c.source}`,
  );
}
