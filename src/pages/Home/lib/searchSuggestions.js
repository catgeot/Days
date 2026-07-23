/**
 * 타이핑용 하이브리드 검색 제안: SSOT 여행지 + 도시 허브/명소 + 정착지 + Mapbox.
 * 우선순위: 여행지 → hub 도시 → hub 명소 → settlements(지역).
 * 명소 exact/단일허브 prefix → 부모 hub+형제 명소 역펼침 (정착지 제외).
 * 정착지 exact → 허브형 역펼침 (부모 hub + 히트 지역 + 명소 + 형제 지역).
 * 큐레이션·SSOT는 동기 즉시, Mapbox는 허브/명소/정착지 exact가 아닐 때만 보강.
 */
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { resolveTravelSpotFromSearchQuery } from '../../../utils/travelSpotResolve.js';
import {
  matchCityAttractionHubsPrefix,
  resolveCityAttractionHub,
  resolveHubAttraction,
  hubToSuggestion,
  attractionToSuggestion,
  buildHubDisambiguationCandidates,
  makeDisambiguationResult,
} from './cityAttractionHubs';
import {
  getSettlementsForHub,
  settlementsForHubSuggestions,
  matchSettlementsPrefix,
  settlementToSuggestion,
  resolveSettlement,
} from './mapboxSettlementPlaces';
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
 * hub + 명소 클러스터.
 * - hub exact: includeSettlements → 명소 뒤 정착지 ≤3
 * - 정착지 exact(허브형): preferSettlement → hub → 히트 지역 → 명소 → 형제 지역(전부, 히트 강제)
 * - 명소 exact: preferAttraction, 정착지 비포함
 * @param {object} hub
 * @param {object[]} out
 * @param {Set<string>} seen
 * @param {{ preferAttraction?: object, preferSettlement?: object, includeSettlements?: boolean }} [opts]
 */
function pushHubAttractionCluster(hub, out, seen, opts = {}) {
  if (!hub) return;
  const rowStub = { hubId: hub.hubId };
  pushUnique(out, seen, hubToSuggestion(hub));

  const preferSettlement = opts.preferSettlement;
  if (preferSettlement) {
    pushUnique(out, seen, settlementToSuggestion(rowStub, preferSettlement));
  }

  const preferAttraction = opts.preferAttraction;
  if (preferAttraction) {
    pushUnique(out, seen, attractionToSuggestion(hub, preferAttraction));
  }

  for (const attraction of hub.attractions || []) {
    pushUnique(out, seen, attractionToSuggestion(hub, attraction));
  }

  if (opts.includeSettlements) {
    // 정착지 reverse-expand: 히트 강제 + 형제 전부. hub exact: ≤3
    const list = preferSettlement
      ? getSettlementsForHub(hub.hubId)
      : settlementsForHubSuggestions(hub.hubId);
    for (const settlement of list) {
      pushUnique(out, seen, settlementToSuggestion(rowStub, settlement));
    }
  }
}

/**
 * 정착지 허브형 클러스터 (드롭다운·Enter 공통).
 * @param {object} hub
 * @param {object} preferSettlement
 */
function buildSettlementHubCluster(hub, preferSettlement) {
  const out = [];
  const seen = new Set();
  pushHubAttractionCluster(hub, out, seen, {
    preferSettlement,
    includeSettlements: true,
  });
  return out;
}

/**
 * 명소 히트가 한 hub로만 모이면 역펼침 (다중 hub면 나열만).
 * @param {{ hub: object, attraction: object }[]} attractionHits
 */
function uniqueHubFromAttractionHits(attractionHits) {
  if (!attractionHits?.length) return null;
  const byId = new Map();
  for (const { hub, attraction } of attractionHits) {
    if (!hub?.hubId) continue;
    if (!byId.has(hub.hubId)) byId.set(hub.hubId, { hub, prefers: [] });
    byId.get(hub.hubId).prefers.push(attraction);
  }
  if (byId.size !== 1) return null;
  return [...byId.values()][0];
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
  const exactAttraction = exactHub ? null : resolveHubAttraction(q);
  const exactSettlement =
    exactHub || exactAttraction ? null : resolveSettlement(q);
  const { hubs, attractions } = matchCityAttractionHubsPrefix(q, { limit: 6 });

  if (exactHub) {
    // hub exact: 도시 + 명소 + 정착지(≤3)
    pushHubAttractionCluster(exactHub, out, seen, { includeSettlements: true });
  } else if (exactAttraction) {
    // 명소 exact: 부모 도시 + 형제 명소만 (정착지 비포함)
    pushHubAttractionCluster(exactAttraction.hub, out, seen, {
      preferAttraction: exactAttraction.attraction,
      includeSettlements: false,
    });
  } else if (exactSettlement) {
    // 정착지 exact: 허브형 역펼침 (도시 + 히트 지역 + 명소 + 형제 지역)
    const parentHub = resolveCityAttractionHub(exactSettlement.row.hubId);
    if (parentHub) {
      pushHubAttractionCluster(parentHub, out, seen, {
        preferSettlement: exactSettlement.settlement,
        includeSettlements: true,
      });
    } else {
      pushUnique(
        out,
        seen,
        settlementToSuggestion(exactSettlement.row, exactSettlement.settlement),
      );
    }
  } else {
    const singleHubHit = uniqueHubFromAttractionHits(attractions);
    // hub 이름 prefix 없이 명소만 한 도시로 모이면 동일 역펼침
    if (singleHubHit && hubs.length === 0) {
      pushHubAttractionCluster(singleHubHit.hub, out, seen, {
        preferAttraction: singleHubHit.prefers[0],
        includeSettlements: false,
      });
    } else {
      for (const hub of hubs) pushUnique(out, seen, hubToSuggestion(hub));
      for (const { hub, attraction } of attractions) {
        pushUnique(out, seen, attractionToSuggestion(hub, attraction));
      }
    }
    for (const { row, settlement } of matchSettlementsPrefix(q, { limit: 4 })) {
      pushUnique(out, seen, settlementToSuggestion(row, settlement));
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
  const exactAttraction = exactHub ? null : resolveHubAttraction(q);
  const exactSettlement =
    exactHub || exactAttraction ? null : resolveSettlement(q);

  // 허브/명소/정착지 exact는 큐레이션만 — Mapbox 대기로 지연시키지 않음
  if (!includeMapbox || exactHub || exactAttraction || exactSettlement) {
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

/** 선택 카드용 — 여행지 SSOT */
export function travelSpotToChoiceCandidate(spot) {
  return spotToSuggestion(spot);
}

/**
 * 임의 장소 객체 → 선택 카드 candidate.
 * @param {object} loc
 */
export function locationToChoiceCandidate(loc) {
  if (!loc?.name) return null;
  if (loc.kind && loc.badge && Number.isFinite(Number(loc.lat))) {
    return loc;
  }
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  return {
    ...loc,
    id: loc.id || `choice-${lat}-${lng}-${normalizeKey(loc.name)}`,
    kind: loc.kind || (loc.uiPlace ? 'city' : 'spot'),
    badge: loc.badge || (loc.uiPlace ? '장소' : '여행지'),
    name: loc.name,
    name_en: loc.name_en || loc.name,
    country: loc.country || 'Explore',
    country_en: loc.country_en || 'Explore',
    lat,
    lng,
    slug: loc.slug,
    source: loc.source || 'search',
    uiPlace: loc.uiPlace,
    desc: loc.desc,
    parentCity: loc.parentCity,
  };
}

/**
 * @param {string} query
 * @param {object[]} candidates
 * @param {string} [title]
 */
export function ensureDisambiguation(query, candidates, title) {
  const list = (candidates || []).map(locationToChoiceCandidate).filter(Boolean);
  if (!list.length) return null;
  const seen = new Set();
  const deduped = [];
  for (const item of list) {
    const k = dedupeKey(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    deduped.push(item);
  }
  if (!deduped.length) return null;
  return makeDisambiguationResult(query, deduped, {
    title: title || `'${query}' — 원하는 장소를 선택하세요`,
  });
}

/**
 * Enter + requireChoice용 큐레이션 선택 카드.
 * hub → 명소 → 정착지 → 여행지 순. 없으면 null.
 * @param {string} query
 */
export async function buildCuratedEnterDisambiguation(query) {
  const q = String(query || '').trim();
  if (!q) return null;

  const hubHit = resolveCityAttractionHub(q);
  if (hubHit) {
    let candidates = await buildHubCandidatesForEnter(hubHit);
    const spot =
      resolveTravelSpotFromSearchQuery(q) ||
      TRAVEL_SPOTS.find((s) => s.slug === hubHit.hubId);
    if (spot) {
      candidates = [spotToSuggestion(spot), ...candidates];
    }
    return ensureDisambiguation(q, candidates, `'${hubHit.name}' — 도시와 명소를 골라주세요`);
  }

  const attractionHit = resolveHubAttraction(q);
  if (attractionHit) {
    const { hub, attraction } = attractionHit;
    const raw = buildHubDisambiguationCandidates(hub, []);
    const preferKey = normalizeKey(attraction.name);
    const hubCard = raw[0];
    const rest = raw.slice(1);
    const prefer = rest.find((c) => normalizeKey(c.name) === preferKey);
    const others = rest.filter((c) => normalizeKey(c.name) !== preferKey);
    return ensureDisambiguation(
      q,
      [hubCard, prefer, ...others],
      `'${hub.name}' — 도시와 명소를 골라주세요`,
    );
  }

  const settlementHit = resolveSettlement(q);
  if (settlementHit) {
    const { row, settlement } = settlementHit;
    const parentHub = resolveCityAttractionHub(row.hubId);
    if (parentHub) {
      const candidates = buildSettlementHubCluster(parentHub, settlement);
      return ensureDisambiguation(
        q,
        candidates,
        `'${parentHub.name}' — 도시·명소·지역을 골라주세요`,
      );
    }
    return ensureDisambiguation(
      q,
      [settlementToSuggestion(row, settlement)],
      `'${settlement.name}' — 원하는 장소를 선택하세요`,
    );
  }

  const querySpot = resolveTravelSpotFromSearchQuery(q);
  if (querySpot) {
    return ensureDisambiguation(q, [spotToSuggestion(querySpot)], `'${querySpot.name}' — 이 여행지로 갈까요?`);
  }

  return null;
}
