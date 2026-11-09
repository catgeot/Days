/**
 * 유네스코 집합유산 「한국의 갯벌」— /place로 실제 열리는 SSOT만 제안(단일 갯벌·가짜 slug 금지).
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

/** 전체 4구성 나열이 아님 — 신안·서천(탐색 /place 미지원) 등은 별도 SSOT */
const COLLECTIVE_GROUP_TITLE = '유네스코 「한국의 갯벌」·사이트에서 확인 가능한 일부 장소';

/** hub SSOT kind=park(공원)와 달리, 집합유산 검색 카드만 세계자연유산 구성 자산에 맞는 표기 */
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
      searchOverlayDesc:
        '유네스코 세계자연유산 「한국의 갯벌」 신안 구성(천연염전·섭조도). WHC 1591.',
    },
  ],
  [
    '신안 갯벌',
    {
      attractionName: '증도',
      searchOverlayDesc:
        '유네스코 세계자연유산 「한국의 갯벌」 신안 구성(천연염전·섭조도). WHC 1591.',
    },
  ],
]);

const ROUTABLE_CANDIDATES = [
  {
    attractionName: '고창 갯벌',
    scenicId: 'gochang-tidal-flat',
    searchOverlayDesc: '유네스코 고창 갯벌 구성. WHC 1591.',
  },
  {
    attractionName: '순천만습지',
    scenicId: 'suncheon-bay-wetland',
    searchOverlayDesc: '유네스코 보성·순천 갯벌 구성(순천만습지). WHC 1591.',
  },
];

function attachScenicRouteFields(item, scenicId) {
  if (!item) return item;
  const spot = getKoreaScenicSpotRecordById(scenicId);
  if (!spot) return item;
  return {
    ...item,
    ...(spot.placeSlug ? { placeSlug: spot.placeSlug } : {}),
    ...(spot.contentId ? { contentId: spot.contentId } : {}),
    ...(spot.imageUrl ? { imageUrl: spot.imageUrl, thumbUrl: spot.imageUrl } : {}),
  };
}

function hubAttractionSuggestion({ attractionName, scenicId, searchOverlayDesc }) {
  const hit = resolveHubAttraction(attractionName);
  if (!hit) return null;
  let item = attractionToSuggestion(hit.hub, hit.attraction);
  item = attachScenicRouteFields(item, scenicId);
  item.groupTitle = COLLECTIVE_GROUP_TITLE;
  item.badge = COLLECTIVE_ATTRACTION_BADGE;
  if (searchOverlayDesc) item.searchOverlayDesc = searchOverlayDesc;
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
  };
  return item;
}

function hubGetbolAttractionSuggestion(spec) {
  const hit = resolveHubAttraction(spec.attractionName);
  if (!hit) return null;
  let item = attractionToSuggestion(hit.hub, hit.attraction);
  item = {
    ...item,
    groupTitle: COLLECTIVE_GROUP_TITLE,
    badge: COLLECTIVE_ATTRACTION_BADGE,
    ...(spec.searchOverlayDesc ? { searchOverlayDesc: spec.searchOverlayDesc } : {}),
  };
  return item;
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
    return item && opensOnPlaceRoute(item) ? [item] : item ? [item] : [];
  }

  if (!COLLECTIVE_QUERY_KEYS.has(key)) return [];

  const out = [];
  for (const spec of ROUTABLE_CANDIDATES) {
    const item = hubAttractionSuggestion(spec);
    if (item && opensOnPlaceRoute(item)) out.push(item);
  }
  return out;
}
