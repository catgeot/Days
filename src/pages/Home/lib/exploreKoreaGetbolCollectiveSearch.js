/**
 * 유네스코 집합유산 「한국의 갯벌」— 탐색창 질의는 등재 구성 자산만 나열(단일 갯벌로 리다이렉트하지 않음).
 */
import { resolveHubAttraction, attractionToSuggestion, resolveCityAttractionHub } from './cityAttractionHubs.js';
import { getKoreaScenicSpotRecordById } from './koreaScenicSpots.js';
import { listsForHub, localScenicMemberToSuggestion } from './koreaLocalScenicLists.js';

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const COLLECTIVE_GROUP_TITLE = '유네스코 「한국의 갯벌」 구성 자산';

const COLLECTIVE_QUERY_KEYS = new Set([
  '한국의갯벌',
  '한국갯벌',
  'koreagetbol',
  'koreantidalflats',
]);

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

function hubAttractionSuggestion(attractionName, scenicId, searchOverlayDesc) {
  const hit = resolveHubAttraction(attractionName);
  if (!hit) return null;
  let item = attractionToSuggestion(hit.hub, hit.attraction);
  item = attachScenicRouteFields(item, scenicId);
  item.groupTitle = COLLECTIVE_GROUP_TITLE;
  if (searchOverlayDesc) item.searchOverlayDesc = searchOverlayDesc;
  return item;
}

function seocheonGetbolSuggestion() {
  const list = listsForHub('seocheon').find((row) => row.listId === 'seocheon-gugyeong');
  const member = list?.members?.find(
    (row) => normalizeKey(row.attractionName) === normalizeKey('유부도와 서천갯벌'),
  );
  if (!list || !member) return null;
  const hub = resolveCityAttractionHub('seocheon');
  const item = localScenicMemberToSuggestion(list, hub, member);
  if (!item) return null;
  return {
    ...item,
    groupTitle: COLLECTIVE_GROUP_TITLE,
    searchOverlayDesc: '유네스코 서천 갯벌(서천9경 유부도 일대) 구성 자산.',
  };
}

export function isKoreaGetbolCollectiveSearchQuery(query) {
  return COLLECTIVE_QUERY_KEYS.has(normalizeKey(query));
}

/**
 * @param {string} query
 * @returns {object[]}
 */
export function buildKoreaGetbolCollectiveSearchSuggestions(query) {
  if (!isKoreaGetbolCollectiveSearchQuery(query)) return [];

  const out = [];
  const push = (item) => {
    if (item?.name) out.push(item);
  };

  push(
    hubAttractionSuggestion(
      '고창 갯벌',
      'gochang-tidal-flat',
      '유네스코 고창 갯벌 구성 자산.',
    ),
  );
  push(seocheonGetbolSuggestion());
  push(
    hubAttractionSuggestion(
      '순천만습지',
      'suncheon-bay-wetland',
      '유네스코 보성·순천 갯벌 구성 자산(순천만습지).',
    ),
  );

  return out;
}
