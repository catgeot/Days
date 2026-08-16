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

/** @param {string} query */
export function resolveSeaBasinFromQuery(query) {
  const n = normalize(query);
  if (n.length < 2) return null;
  let basin = aliasToBasin.get(n);
  if (!basin) {
    for (const [alias, b] of aliasToBasin) {
      if (alias.length >= 3 && (n.includes(alias) || alias.includes(n))) {
        basin = b;
        break;
      }
    }
  }
  if (!basin) return null;

  const slugs = Object.entries(coastSpots)
    .filter(([, e]) => e.seaPrimary === basin.id || (e.seaIds || []).includes(basin.id))
    .map(([slug]) => slug);

  const spots = slugs.map((slug) => spotBySlug.get(slug)).filter(Boolean);
  if (!spots.length) return null;

  return { basin, spots };
}

/**
 * 해역 검색 시 큐레이션 핀 1개 (랜덤 · popularity 가중 가능).
 * @returns {object | null} theme-curation shaped location
 */
export function pickSeaBasinCurationSpot(query, category = 'paradise') {
  const hit = resolveSeaBasinFromQuery(query);
  if (!hit) return null;

  const { basin, spots } = hit;
  const ranked = [...spots].sort(
    (a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0)
  );
  const pool = ranked.slice(0, Math.min(5, ranked.length));
  const entry = pool[Math.floor(Math.random() * pool.length)];

  const curationSummary = `"${String(query).trim()}"(${basin.name}) 해역의 「${entry.name}」을(를) 연결했습니다.`;
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

export function listChipSeaBasins(minSpots = 2) {
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
