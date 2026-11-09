/**
 * 유네스코 집합유산 「한국의 갯벌」— SSOT 장소만 제안(가짜 slug 금지).
 */
import { resolveHubAttraction, attractionToSuggestion, resolveCityAttractionHub } from './cityAttractionHubs.js';
import { getKoreaScenicSpotRecordById } from './koreaScenicSpots.js';
import { normalizeExploreSelectionPin } from './explorePlaceNav.js';
import { resolveSearchResultSelect } from './exploreRecentHistory.js';
import {
  localScenicMemberToSuggestion,
  listsForHub,
} from './koreaLocalScenicLists.js';

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const COLLECTIVE_GROUP_TITLE = '유네스코 세계자연유산 「한국의 갯벌」 구성';

const COLLECTIVE_ATTRACTION_BADGE = '자연유산';

const COLLECTIVE_QUERY_KEYS = new Set([
  '갯벌',
  '한국의갯벌',
  '한국갯벌',
  'koreagetbol',
  'koreantidalflats',
]);

const GETBOL_LOCAL_MEMBER_ALIASES = new Map([
  [
    '서천갯벌',
    {
      listId: 'seocheon-gugyeong',
      attractionName: '유부도와 서천갯벌',
      searchOverlayDesc:
        '유네스코 세계자연유산 「한국의 갯벌」 서천 구성(유부도·서천갯벌). WHC 1591.',
    },
  ],
  [
    '서천 갯벌',
    {
      listId: 'seocheon-gugyeong',
      attractionName: '유부도와 서천갯벌',
      searchOverlayDesc:
        '유네스코 세계자연유산 「한국의 갯벌」 서천 구성(유부도·서천갯벌). WHC 1591.',
    },
  ],
]);

const GETBOL_HUB_ATTRACTION_ALIASES = new Map([
  [
    '신안갯벌',
    {
      attractionName: '증도',
      scenicId: 'jeungdo',
      searchOverlayDesc:
        '유네스코 세계자연유산 「한국의 갯벌」 신안 구성(천연염전·섭조도). WHC 1591.',
    },
  ],
  [
    '신안 갯벌',
    {
      attractionName: '증도',
      scenicId: 'jeungdo',
      searchOverlayDesc:
        '유네스코 세계자연유산 「한국의 갯벌」 신안 구성(천연염전·섭조도). WHC 1591.',
    },
  ],
]);

/** 서천(유부도)는 TourAPI contentId 없음 — 집합 검색에서 제외, 개별 `서천갯벌`만 팔경 카드 */
const COLLECTIVE_UNESCO_MEMBERS = [
  {
    attractionName: '고창 갯벌',
    scenicId: 'gochang-tidal-flat',
    searchOverlayDesc: '유네스코 세계자연유산 「한국의 갯벌」 고창 구성. WHC 1591.',
  },
  {
    attractionName: '증도',
    scenicId: 'jeungdo',
    searchOverlayDesc:
      '유네스코 세계자연유산 「한국의 갯벌」 신안 구성(천연염전·섭조도). WHC 1591.',
    searchName: '신안갯벌(증도)',
  },
  {
    attractionName: '순천만습지',
    scenicId: 'suncheon-bay-wetland',
    searchOverlayDesc: '유네스코 세계자연유산 「한국의 갯벌」 보성·순천 구성(순천만습지). WHC 1591.',
    searchName: '순천만습지(보성·순천갯벌)',
  },
];

function attachScenicRouteFields(item, scenicId) {
  if (!item) return item;
  const spot = getKoreaScenicSpotRecordById(scenicId);
  if (!spot) return item;
  const next = {
    ...item,
    lat: spot.lat ?? item.lat,
    lng: spot.lng ?? item.lng,
    ...(spot.imageUrl ? { imageUrl: spot.imageUrl, thumbUrl: spot.imageUrl } : {}),
  };
  if (spot.placeSlug) {
    next.placeSlug = spot.placeSlug;
    next.slug = spot.placeSlug;
    next.canonical_slug = spot.placeSlug;
  }
  if (spot.contentId) {
    next.contentId = spot.contentId;
    next.source = 'tourapi';
  }
  return next;
}

function hubAttractionSuggestion({ attractionName, scenicId, searchOverlayDesc, searchName }) {
  const hit = resolveHubAttraction(attractionName);
  if (!hit) return null;
  let item = attractionToSuggestion(hit.hub, hit.attraction);
  if (scenicId) item = attachScenicRouteFields(item, scenicId);
  item.groupTitle = COLLECTIVE_GROUP_TITLE;
  item.badge = COLLECTIVE_ATTRACTION_BADGE;
  if (searchOverlayDesc) item.searchOverlayDesc = searchOverlayDesc;
  if (searchName) item.name = searchName;
  return item;
}

function opensOnPlaceRoute(item) {
  if (!item) return false;
  const pin = normalizeExploreSelectionPin(item);
  return resolveSearchResultSelect(pin)?.type === 'place';
}

export function isKoreaGetbolCollectiveSearchQuery(query) {
  const key = normalizeKey(query);
  if (GETBOL_LOCAL_MEMBER_ALIASES.has(key) || GETBOL_HUB_ATTRACTION_ALIASES.has(key)) {
    return true;
  }
  return COLLECTIVE_QUERY_KEYS.has(key);
}

function localScenicGetbolMemberSuggestion(spec) {
  const hub = resolveCityAttractionHub(spec.hubId || 'seocheon');
  const list = (listsForHub(hub?.hubId) || []).find((row) => row.listId === spec.listId);
  if (!list || !hub) return null;
  const member = (list.members || []).find(
    (m) => normalizeKey(m.attractionName) === normalizeKey(spec.attractionName),
  );
  if (!member) return null;
  let item = localScenicMemberToSuggestion(list, hub, member);
  if (!item) return null;
  item = {
    ...item,
    groupTitle: COLLECTIVE_GROUP_TITLE,
    badge: COLLECTIVE_ATTRACTION_BADGE,
    ...(spec.searchOverlayDesc ? { searchOverlayDesc: spec.searchOverlayDesc } : {}),
    ...(spec.searchName ? { name: spec.searchName } : {}),
  };
  return item;
}

function hubGetbolAttractionSuggestion(spec) {
  const hit = resolveHubAttraction(spec.attractionName);
  if (!hit) return null;
  let item = attractionToSuggestion(hit.hub, hit.attraction);
  if (spec.scenicId) {
    item = attachScenicRouteFields(item, spec.scenicId);
  }
  item = {
    ...item,
    groupTitle: COLLECTIVE_GROUP_TITLE,
    badge: COLLECTIVE_ATTRACTION_BADGE,
    ...(spec.searchOverlayDesc ? { searchOverlayDesc: spec.searchOverlayDesc } : {}),
    ...(spec.searchName ? { name: spec.searchName } : {}),
  };
  return item;
}

function buildCollectiveMemberSuggestion(spec) {
  if (!spec) return null;
  if (spec.listId) return localScenicGetbolMemberSuggestion(spec);
  if (spec.scenicId) {
    return hubAttractionSuggestion(spec);
  }
  if (spec.attractionName) return hubGetbolAttractionSuggestion(spec);
  return null;
}

/**
 * @param {string} query
 * @returns {object[]}
 */
export function buildKoreaGetbolCollectiveSearchSuggestions(query) {
  const key = normalizeKey(query);
  const localAlias = GETBOL_LOCAL_MEMBER_ALIASES.get(key);
  if (localAlias) {
    const item = localScenicGetbolMemberSuggestion(localAlias);
    return item ? [item] : [];
  }
  const hubAlias = GETBOL_HUB_ATTRACTION_ALIASES.get(key);
  if (hubAlias) {
    const item = hubGetbolAttractionSuggestion(hubAlias);
    return item && opensOnPlaceRoute(item) ? [item] : [];
  }

  if (!COLLECTIVE_QUERY_KEYS.has(key)) return [];

  const out = [];
  for (const spec of COLLECTIVE_UNESCO_MEMBERS) {
    const item = buildCollectiveMemberSuggestion(spec);
    if (!item || !opensOnPlaceRoute(item)) continue;
    out.push(item);
  }
  return out;
}
