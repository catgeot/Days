/**
 * 타이핑용 하이브리드 검색 제안: SSOT 여행지 + 도시 허브/명소 + Mapbox.
 * 큐레이션·SSOT는 동기 즉시, Mapbox는 허브 exact가 아닐 때만 보강.
 */
import { TRAVEL_SPOTS } from '../data/travelSpots';
import {
  matchCityAttractionHubsPrefix,
  resolveCityAttractionHub,
  hubToSuggestion,
  attractionToSuggestion,
  buildHubDisambiguationCandidates,
} from './cityAttractionHubs';
import { searchBoxForward } from './mapboxSearchBox';

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

function spotToSuggestion(spot) {
  return {
    ...spot,
    id: `spot-${spot.slug || spot.id}`,
    kind: 'spot',
    badge: '여행지',
    name: spot.name,
    name_en: spot.name_en || spot.name,
    country: spot.country || 'Explore',
    country_en: spot.country_en || 'Explore',
    lat: spot.lat,
    lng: spot.lng,
    slug: spot.slug,
    source: 'ssot',
  };
}

function dedupeKey(item) {
  return normalizeKey(item?.name) || String(item?.id || '');
}

function pushUnique(out, seen, item) {
  if (!item?.name) return;
  const k = dedupeKey(item);
  if (!k || seen.has(k)) return;
  seen.add(k);
  out.push(item);
}

/**
 * 로컬만 (SSOT + 큐레이션 허브) — 동기·즉시.
 * @param {string} query
 * @param {{ spotLimit?: number }} [opts]
 */
export function buildLocalSearchSuggestions(query, opts = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const spotLimit = opts.spotLimit ?? 5;
  const lower = q.toLowerCase();
  const key = normalizeKey(q);
  const out = [];
  const seen = new Set();

  const spotHits = TRAVEL_SPOTS.filter((spot) => {
    const name = (spot.name || '').toLowerCase();
    const nameEn = (spot.name_en || '').toLowerCase();
    const country = (spot.country || '').toLowerCase();
    return (
      name.includes(lower) ||
      nameEn.includes(lower) ||
      country.includes(lower) ||
      normalizeKey(spot.name).startsWith(key) ||
      normalizeKey(spot.name_en).startsWith(key)
    );
  })
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, spotLimit);

  for (const spot of spotHits) pushUnique(out, seen, spotToSuggestion(spot));

  const exactHub = resolveCityAttractionHub(q);
  const { hubs, attractions } = matchCityAttractionHubsPrefix(q, { limit: 6 });

  if (exactHub) {
    pushUnique(out, seen, hubToSuggestion(exactHub));
    for (const attraction of exactHub.attractions || []) {
      pushUnique(out, seen, attractionToSuggestion(exactHub, attraction));
    }
  } else {
    for (const hub of hubs) pushUnique(out, seen, hubToSuggestion(hub));
    for (const { hub, attraction } of attractions) {
      pushUnique(out, seen, attractionToSuggestion(hub, attraction));
    }
  }

  return out.slice(0, 16);
}

/**
 * @param {string} query
 * @param {{ mapboxLimit?: number, spotLimit?: number, includeMapbox?: boolean }} [opts]
 * @returns {Promise<object[]>}
 */
export async function buildHybridSearchSuggestions(query, opts = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const local = buildLocalSearchSuggestions(q, { spotLimit: opts.spotLimit ?? 5 });
  const includeMapbox = opts.includeMapbox !== false;
  const exactHub = resolveCityAttractionHub(q);

  // 허브 exact(속초·파리)는 큐레이션만 — Mapbox 대기로 지연시키지 않음
  if (!includeMapbox || exactHub) {
    return local;
  }

  const out = [...local];
  const seen = new Set(local.map(dedupeKey).filter(Boolean));
  const mapboxLimit = opts.mapboxLimit ?? 6;

  try {
    const remote = await searchBoxForward(q, {
      limit: mapboxLimit,
      types: 'place,city,poi',
    });
    for (const item of remote) pushUnique(out, seen, item);
  } catch {
    // degrade: local only
  }

  return out.slice(0, 16);
}

/**
 * Enter용 허브 후보 — 큐레이션만 (즉시).
 * @param {object} hub
 */
export async function buildHubCandidatesForEnter(hub) {
  return buildHubDisambiguationCandidates(hub, []);
}
