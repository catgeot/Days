/**
 * 해역명 검색 → travelSpots 연결 (Phase 3).
 * SSOT: seaBasins.json · travelSpotCoast.json · TRAVEL_SPOTS
 */
import seaBasinsJson from '../data/seaBasins.json' with { type: 'json' };
import coastJson from '../data/travelSpotCoast.json' with { type: 'json' };
import { TRAVEL_SPOTS } from '../data/travelSpots.js';

const normalize = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·.,]/g, '');

/** 해·만 등 접미사 제거 후 비교 — 맥시코↔멕시코만 */
const seaNameCore = (s) =>
  normalize(s)
    .replace(/(해|헤|만)$/u, '')
    .replace(/(sea|ocean|gulf|bay|channel|strait)$/i, '');

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const curr = [i];
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function maxTypoDistance(len) {
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  return 2;
}

function isTypoMatch(queryNorm, aliasNorm) {
  if (!queryNorm || !aliasNorm) return false;

  const directDist = levenshtein(queryNorm, aliasNorm);
  const maxDirect = maxTypoDistance(Math.min(queryNorm.length, aliasNorm.length));
  if (directDist <= maxDirect) return true;

  const qc = seaNameCore(queryNorm);
  const ac = seaNameCore(aliasNorm);
  if (qc.length < 2 || ac.length < 2) return false;
  if (Math.abs(qc.length - ac.length) > 2) return false;
  const coreDist = levenshtein(qc, ac);
  return coreDist <= maxTypoDistance(Math.min(qc.length, ac.length));
}

const basins = Array.isArray(seaBasinsJson.basins) ? seaBasinsJson.basins : [];
const coastSpots = coastJson.spots || {};

const aliasToBasin = new Map();
for (const b of basins) {
  const keys = new Set([b.id, b.name, b.name_en, ...(b.aliases || [])]);
  for (const k of keys) {
    const n = normalize(k);
    if (n.length >= 2) aliasToBasin.set(n, b);
  }
}

const spotBySlug = new Map(TRAVEL_SPOTS.map((s) => [s.slug, s]));

function spotsForBasin(basin) {
  const slugs = Object.entries(coastSpots)
    .filter(([, e]) => e.seaPrimary === basin.id || (e.seaIds || []).includes(basin.id))
    .map(([slug]) => slug);
  return slugs.map((slug) => spotBySlug.get(slug)).filter(Boolean);
}

function findFuzzyBasin(queryNorm) {
  const scored = [];
  for (const [alias, basin] of aliasToBasin) {
    if (!isTypoMatch(queryNorm, alias)) continue;
    const dist = Math.min(
      levenshtein(queryNorm, alias),
      (() => {
        const qc = seaNameCore(queryNorm);
        const ac = seaNameCore(alias);
        return qc.length >= 2 && ac.length >= 2 ? levenshtein(qc, ac) : Infinity;
      })(),
    );
    scored.push({ basin, alias, dist });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => a.dist - b.dist || a.alias.length - b.alias.length);
  const bestDist = scored[0].dist;
  const best = scored.filter((s) => s.dist === bestDist);
  const basinIds = new Set(best.map((s) => s.basin.id));
  if (basinIds.size !== 1) return null;
  return { basin: best[0].basin, alias: best[0].alias, dist: bestDist };
}

/** @param {string} query */
export function resolveSeaBasinFromQuery(query) {
  const n = normalize(query);
  if (n.length < 2) return null;
  let basin = aliasToBasin.get(n);
  let typoCorrected = false;
  let matchedAlias = n;
  if (!basin) {
    for (const [alias, b] of aliasToBasin) {
      if (alias.length >= 3 && (n.includes(alias) || alias.includes(n))) {
        basin = b;
        matchedAlias = alias;
        break;
      }
    }
  }
  if (!basin) {
    const fuzzy = findFuzzyBasin(n);
    if (!fuzzy) return null;
    basin = fuzzy.basin;
    matchedAlias = fuzzy.alias;
    typoCorrected = fuzzy.dist > 0 || n !== matchedAlias;
  }

  const spots = spotsForBasin(basin);
  if (!spots.length) return null;

  return { basin, spots, typoCorrected, matchedAlias };
}

/**
 * 해역 검색 시 큐레이션 핀 1개 (랜덤 · popularity 가중 가능).
 * @returns {object | null} theme-curation shaped location
 */
export function pickSeaBasinCurationSpot(query, category = 'paradise') {
  const hit = resolveSeaBasinFromQuery(query);
  if (!hit) return null;

  const { basin, spots, typoCorrected } = hit;
  const ranked = [...spots].sort(
    (a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0)
  );
  const pool = ranked.slice(0, Math.min(5, ranked.length));
  const entry = pool[Math.floor(Math.random() * pool.length)];

  const trimmedQuery = String(query).trim();
  const curationSummary = typoCorrected
    ? `"${trimmedQuery}" → ${basin.name} 해역으로 보정 · 「${entry.name}」을(를) 연결했습니다.`
    : `"${trimmedQuery}"(${basin.name}) 해역의 「${entry.name}」을(를) 연결했습니다.`;
  const fixed = typeof entry.desc === 'string' ? entry.desc.trim() : '';
  const desc =
    fixed && fixed !== curationSummary ? `${curationSummary}\n\n${fixed}` : curationSummary;

  return {
    id: entry.id ?? entry.slug,
    slug: entry.slug,
    canonical_slug: entry.slug,
    name: entry.name,
    name_en: entry.name_en ?? entry.name,
    country: entry.country,
    country_en: entry.country_en,
    lat: entry.lat,
    lng: entry.lng,
    category: entry.category ?? entry.primaryCategory ?? category,
    desc,
    curationSummary,
    keywords: entry.keywords,
    type: 'temp-base',
    isCorrected: true,
    seaBasinId: basin.id,
    seaBasinName: basin.name,
  };
}

export function listChipSeaBasins(minSpots = 1) {
  return basins
    .filter((b) => b.tier === 1 || b.tier === 2)
    .map((b) => {
      const n = Object.values(coastSpots).filter(
        (e) => e.seaPrimary === b.id || (e.seaIds || []).includes(b.id)
      ).length;
      return { ...b, spotCount: n };
    })
    .filter((b) => b.spotCount >= minSpots);
}

/** 해역 탐색 레일 — tier 1–3 전체(스팟 유무 무관) */
export function listRailSeaBasins() {
  return basins
    .filter((b) => b.tier === 1 || b.tier === 2 || b.tier === 3)
    .map((b) => {
      const n = Object.values(coastSpots).filter(
        (e) => e.seaPrimary === b.id || (e.seaIds || []).includes(b.id)
      ).length;
      return { ...b, spotCount: n };
    });
}
