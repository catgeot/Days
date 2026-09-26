/**
 * 지자체 팔경·구경 컬렉션 SSOT — 시·군·구 단위 리스트 메타·멤버십.
 * hub append·aliases 병합은 메인 세션만. koreaScenicSpots 쓰기 금지.
 */
import listsJson from '../data/koreaLocalScenicLists.json' with { type: 'json' };
import scenicJson from '../data/koreaScenicSpots.json' with { type: 'json' };
import {
  resolveCityAttractionHub,
  hubToSuggestion,
  attractionToSuggestion,
  getKindLabel,
  placeUrlSlug,
} from './cityAttractionHubs.js';
import {
  scenicAreaCodeForHubId,
  scenicRegionForAreaCode,
} from './koreaTourAttractionMap.js';

export const LIST_KINDS = new Set(['palgyeong', 'gugyeong', 'sipgyeong', 'gugok', 'other']);
export const LIST_STATUSES = new Set(['draft', 'verified', 'skip_no_source', 'skip_ambiguous']);
export const LINK_STATUSES = new Set([
  'linked',
  'appended',
  'pending_coord',
  'skipped_conflict',
]);

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const LISTS = Array.isArray(listsJson) ? listsJson : [];

const KIND_LABEL_KO = {
  palgyeong: '팔경',
  gugyeong: '구경',
  sipgyeong: '십경',
  gugok: '구곡',
  other: '명소',
};
const KIND_LABEL_EN = {
  palgyeong: 'Eight Views',
  gugyeong: 'Nine Views',
  sipgyeong: 'Ten Views',
  gugok: 'Nine Valleys',
  other: 'Views',
};

/** 강진12경 → 강진 12경. */
function spacedKoNumberedGyeongTitle(title) {
  const t = String(title || '').trim();
  if (!/(\d+)경\s*$/u.test(t)) return '';
  return t.replace(/(\d+)경\s*$/u, ' $1경').replace(/\s+/g, ' ').trim();
}

function titleGyeongCount(title) {
  const m = String(title || '').trim().match(/(\d+)경\s*$/u);
  return m ? Number(m[1]) : 0;
}

/** other 공식 N경, 또는 sipgyeong인데 12경(남해·포항 등 — 「십경」은 10경). */
function localScenicNumberedDisplayTitle(list, locale = 'ko') {
  const spaced = spacedKoNumberedGyeongTitle(list?.title);
  if (!spaced) return '';
  const n = titleGyeongCount(list?.title);
  const useNumbered =
    list?.listKind === 'other' || (list?.listKind === 'sipgyeong' && n === 12);
  if (!useNumbered) return '';
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  if (isEn) return String(list?.title_en || spaced).trim();
  return spaced;
}

const LOCAL_SCENIC_NEAR_HUB_KM = 40;

/** @type {Map<string, object>} */
const listByKey = new Map();
/** @type {Map<string, object>} listId → list */
const listById = new Map();
/** @type {Map<string, object[]>} hubId → lists */
const listsByHubId = new Map();

for (const list of LISTS) {
  if (!list?.listId) continue;
  listById.set(list.listId, list);
  if (list.hubId) {
    const hid = String(list.hubId).trim();
    if (hid) {
      if (!listsByHubId.has(hid)) listsByHubId.set(hid, []);
      listsByHubId.get(hid).push(list);
    }
  }
  const hubForKeys = list.hubId ? resolveCityAttractionHub(list.hubId) : null;
  const cityKo = String(hubForKeys?.name || list.hubId || '').trim();
  const kindKo = KIND_LABEL_KO[list.listKind] || KIND_LABEL_KO.other;
  const displayKo = cityKo ? `${cityKo} ${kindKo}` : kindKo;
  const numberedKo = localScenicNumberedDisplayTitle(list, 'ko');
  const keys = [
    list.listId,
    list.title,
    list.title_en,
    displayKo,
    numberedKo,
    ...(list.aliases || []),
  ];
  for (const k of keys) {
    const nk = normalizeKey(k);
    if (nk && !listByKey.has(nk)) listByKey.set(nk, list);
  }
}

function toRad(d) {
  return (d * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function memberContentId(member, attraction) {
  const raw = member?.contentId ?? attraction?.contentId ?? null;
  const id = String(raw || '').trim();
  return /^\d{1,32}$/.test(id) ? id : null;
}

/** @type {Map<string, object>} hubId:name → GATEO 선정 명소 (썸네일·contentId) */
const curatedScenicByHubName = new Map();
for (const spot of Array.isArray(scenicJson?.spots) ? scenicJson.spots : []) {
  const hubKey = normalizeKey(spot?.hubId);
  const nameKey = normalizeKey(spot?.attractionName || spot?.name);
  if (!hubKey || !nameKey) continue;
  const key = `${hubKey}:${nameKey}`;
  if (!curatedScenicByHubName.has(key)) curatedScenicByHubName.set(key, spot);
}

function lookupCuratedScenicSpot(hubId, attractionName) {
  const key = `${normalizeKey(hubId)}:${normalizeKey(attractionName)}`;
  return curatedScenicByHubName.get(key) || null;
}

function scenicThumbFromCurated(curated) {
  if (!curated) return { imageUrl: null, contentId: null };
  const imageUrl = String(curated.imageUrl || '').trim() || null;
  const rawId = String(curated.contentId || '').trim();
  const contentId = /^\d{1,32}$/.test(rawId) ? rawId : null;
  return { imageUrl, contentId };
}

export function listKoreaLocalScenicLists() {
  return LISTS;
}

/**
 * hubId에 매달린 팔경·구경 리스트 (verified/draft 포함 · skip 제외 안 함 — 호출측 필터).
 * @param {string} hubId
 */
export function listsForHub(hubId) {
  const id = String(hubId || '').trim();
  if (!id) return [];
  return listsByHubId.get(id) || [];
}

function overlayForHubMemberName(hubId, attractionName) {
  const id = String(hubId || '').trim();
  const name = String(attractionName || '').trim();
  if (!id || !name) return null;
  for (const list of listsForHub(id)) {
    const overlay = lookupLocalScenicMemberOverlay(
      localScenicMemberSpotId(list.listId, name),
    );
    if (overlay?.imageUrl || overlay?.contentId) return overlay;
  }
  return null;
}

/**
 * 명승 리스트 행 — 합성 id 또는 hub+이름 오버레이.
 * Tour contentId 썸네일보다 멤버 오버레이가 우선 (같은 id를 쓰는 2경·3경 분리).
 * @param {object} [spot]
 */
export function lookupLocalScenicMemberOverlayForSpot(spot) {
  if (!spot || typeof spot !== 'object') return null;
  const byId = lookupLocalScenicMemberOverlay(String(spot.id || '').trim());
  if (byId?.imageUrl) return byId;
  const name = spot.attractionName || spot.name;
  const listId = String(spot.localScenicListId || '').trim();
  if (listId && name) {
    const byList = lookupLocalScenicMemberOverlay(
      localScenicMemberSpotId(listId, name),
    );
    if (byList?.imageUrl) return byList;
  }
  return overlayForHubMemberName(spot.hubId, name);
}

/**
 * 명승 행 썸네일 — 멤버 오버레이가 Tour contentId firstimage보다 우선.
 * 같은 contentId를 쓰는 2경·3경이 Tour 사진으로 덮이지 않게 한다.
 * @param {object} [spot]
 * @param {Map<string, string>} [tourByContentId]
 * @param {Map<string, string>} [peeked]
 * @param {{ firstImage?: string | null }} [extra]
 */
export function resolveLocalScenicRowFirstImage(
  spot,
  tourByContentId,
  peeked,
  extra,
) {
  const overlayThumb = lookupLocalScenicMemberOverlayForSpot(spot)?.imageUrl;
  if (overlayThumb) return overlayThumb;
  const contentId = String(spot?.contentId || '').trim();
  return (
    (contentId && tourByContentId?.get(contentId)) ||
    (contentId && peeked?.get(contentId)) ||
    extra?.firstImage ||
    spot?.firstImage ||
    spot?.imageUrl ||
    null
  );
}

/**
 * 탐색 검색 행 썸네일·contentId — 명승 팔경 오버레이 → contentId 오버레이 → GATEO 선정.
 * JSON 쓰기 아님.
 * @param {object} [item]
 * @returns {{ imageUrl: string | null, contentId: string | null }}
 */
export function resolveSearchScenicMedia(item) {
  if (!item || typeof item !== 'object') {
    return { imageUrl: null, contentId: null };
  }
  const hubId = String(item.hubId || '').trim();
  const name = String(item.name || item.attractionName || '').trim();
  const existing =
    String(
      item.imageUrl || item.thumbUrl || item.firstImage || item.image_url || '',
    ).trim() || null;
  const overlay =
    overlayForHubMemberName(hubId, name) || lookupLocalScenicMemberOverlayForSpot(item);
  const fromCurated = scenicThumbFromCurated(lookupCuratedScenicSpot(hubId, name));
  const rawId = String(
    overlay?.contentId || item.contentId || fromCurated.contentId || '',
  ).trim();
  const contentId = /^\d{1,32}$/.test(rawId) ? rawId : null;
  const byContentId = lookupLocalScenicPhotoByContentId(contentId);
  const imageUrl =
    overlay?.imageUrl ||
    existing ||
    byContentId?.imageUrl ||
    fromCurated.imageUrl ||
    null;
  return { imageUrl, contentId };
}

/**
 * 공식 팔경·구경이 없는 허브의 탐색 명소 소제목. 있으면 빈 문자열 (N경 그룹만).
 * @param {object} [hub]
 * @param {string} [locale]
 */
export function hubAttractionSearchGroupTitle(hub, locale = 'ko') {
  if (!hub?.hubId || listsForHub(hub.hubId).length) return '';
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  const city = isEn
    ? String(hub.name_en || hub.name || '').trim()
    : String(hub.name || '').trim();
  if (!city) return '';
  const kind = isEn ? KIND_LABEL_EN.other : KIND_LABEL_KO.other;
  return `${city} ${kind}`;
}

function listsOfSameKindOnHub(list, hub) {
  const hid = String(hub?.hubId || list?.hubId || '').trim();
  if (!hid) return [];
  return listsForHub(hid).filter((row) => row?.listKind === list?.listKind);
}

function localScenicRankPlaceLabel(list, hub, locale = 'ko') {
  const h = hub || resolveCityAttractionHub(list?.hubId);
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  if (listsOfSameKindOnHub(list, h).length > 1) {
    if (isEn) {
      const stem = String(list?.title_en || list?.title || '')
        .replace(/\s+((Eight|Nine|Ten|Twelve)\s+)?(Scenic\s+)?(Views|Valleys)\s*$/i, '')
        .trim();
      if (stem) return stem;
    } else {
      const stem = String(list?.title || '')
        .replace(/(팔경|구경|십이경|십경|구곡|명소|\d+경)\s*$/u, '')
        .trim();
      if (stem) return stem;
    }
  }
  return isEn
    ? String(h?.name_en || h?.name || list?.hubId || '').trim()
    : String(h?.name || list?.hubId || '').trim();
}

/**
 * 표시 제목 `{시군명} {종류}` — SSOT title(문경8경)은 유지.
 * 같은 시군에 같은 종류가 둘이면(영동 한천팔경·양산팔경) 공식 title.
 * @param {object} list
 * @param {object} [hub]
 * @param {string} [locale]
 */
export function localScenicListDisplayTitle(list, hub, locale = 'ko') {
  const h = hub || resolveCityAttractionHub(list?.hubId);
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  if (listsOfSameKindOnHub(list, h).length > 1) {
    const ssot = isEn
      ? String(list?.title_en || list?.title || '').trim()
      : String(list?.title || '').trim();
    if (ssot) {
      if (!isEn) return spacedKoNumberedGyeongTitle(ssot) || ssot;
      return ssot;
    }
  }
  const numberedTitle = localScenicNumberedDisplayTitle(list, locale);
  if (numberedTitle) return numberedTitle;
  const city = isEn
    ? String(h?.name_en || h?.name || list?.hubId || '').trim()
    : String(h?.name || list?.hubId || '').trim();
  const kind = isEn
    ? KIND_LABEL_EN[list?.listKind] || KIND_LABEL_EN.other
    : KIND_LABEL_KO[list?.listKind] || KIND_LABEL_KO.other;
  if (!city) return kind;
  return `${city} ${kind}`;
}

function memberIndexInList(list, member) {
  const key = normalizeKey(member?.attractionName);
  if (!key) return 0;
  const idx = (list?.members || []).findIndex(
    (m) => normalizeKey(m.attractionName) === key,
  );
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * 행 부제 `{시군} {N}경` · 구곡은 `{N}곡`.
 * 같은 시군에 팔경이 둘이면 공식명 어간(한천팔경→한천 1경).
 * @param {object} list
 * @param {object} [hub]
 * @param {object} member
 * @param {string} [locale]
 */
export function localScenicMemberRankBlurb(list, hub, member, locale = 'ko') {
  const fallback = localScenicListDisplayTitle(list, hub, locale);
  const rank = memberIndexInList(list, member);
  if (!rank) return fallback;
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  const city = localScenicRankPlaceLabel(list, hub, locale);
  if (isEn) {
    const unit = list?.listKind === 'gugok' ? 'Valley' : 'View';
    return city ? `${city} ${unit} ${rank}` : `${unit} ${rank}`;
  }
  const unit = list?.listKind === 'gugok' ? '곡' : '경';
  return city ? `${city} ${rank}${unit}` : `${rank}${unit}`;
}

/**
 * 리스트 exact(title/alias) 우선 · 아니면 hub exact의 리스트들.
 * @param {string} query
 * @returns {object[]}
 */
export function matchLocalScenicListsForQuery(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const exact = listByKey.get(normalizeKey(q));
  if (exact) return [exact];
  const hub = resolveCityAttractionHub(q);
  if (hub?.hubId) return listsForHub(hub.hubId);
  return [];
}

/**
 * hubId 또는 좌표로 팔경 hub 결정. 리스트 alias가 hub 별칭보다 우선인 조회는 match 쪽.
 * @param {{ hubId?: string, lat?: number, lng?: number }} [opts]
 */
export function resolveLocalScenicHubId(opts = {}) {
  const hid = String(opts.hubId || '').trim();
  if (hid && listsForHub(hid).length) return hid;
  if (hid) {
    const hub = resolveCityAttractionHub(hid);
    if (hub?.hubId && listsForHub(hub.hubId).length) return hub.hubId;
  }
  const lat = Number(opts.lat);
  const lng = Number(opts.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return hid || null;
  let bestId = null;
  let bestKm = Infinity;
  const seen = new Set();
  for (const list of LISTS) {
    if (!list?.hubId || seen.has(list.hubId)) continue;
    seen.add(list.hubId);
    const hub = resolveCityAttractionHub(list.hubId);
    if (hub?.lat == null || hub?.lng == null) continue;
    const km = haversineKm(lat, lng, Number(hub.lat), Number(hub.lng));
    if (km < bestKm) {
      bestKm = km;
      bestId = list.hubId;
    }
  }
  if (bestId && bestKm <= LOCAL_SCENIC_NEAR_HUB_KM) return bestId;
  return hid || null;
}

/**
 * 리스트명·alias·listId exact (지구본 검색·Enter).
 * @param {string} query
 */
export function resolveLocalScenicList(query) {
  const key = normalizeKey(query);
  if (!key) return null;
  const list = listByKey.get(key);
  if (!list) return null;
  const hub = resolveCityAttractionHub(list.hubId);
  return { list, hub };
}

/**
 * 지구본·명승 검색 — title/alias exact, 아니면 includes(한천→한천팔경).
 * 시군 단독(양산·영동)은 hub 가드라 exact가 아니면 null.
 * @param {string} query
 */
export function resolveLocalScenicListFromSearchQuery(query) {
  const exact = resolveLocalScenicList(query);
  if (exact) return exact;
  const list = matchLocalScenicListForScenicSearch(query);
  if (!list) return null;
  const hub = resolveCityAttractionHub(list.hubId);
  return { list, hub };
}

const GENERIC_SCENIC_QUERY_TERMS = new Set([
  '팔경',
  '8경',
  '구경',
  '9경',
  '십경',
  '10경',
  '십이경',
  '12경',
  '경',
  '명승',
  '명소',
  'scenic',
]);

/**
 * 명승 페이지 검색 — title/alias exact 또는 includes.
 * @param {string} query
 */
export function matchLocalScenicListForScenicSearch(query) {
  const q = normalizeKey(query);
  if (!q || GENERIC_SCENIC_QUERY_TERMS.has(q)) return null;

  const exact = listByKey.get(q);
  if (exact) return exact;

  const hub = resolveCityAttractionHub(query);
  if (hub?.hubId) {
    const hubNameKey = normalizeKey(hub.name);
    if (q === hubNameKey || q === normalizeKey(hub.hubId)) {
      return null;
    }
  }

  for (const list of LISTS) {
    const keys = [list.title, list.title_en, ...(list.aliases || [])].filter(Boolean);
    if (keys.some((k) => {
      const nk = normalizeKey(k);
      return nk && (nk === q || nk.includes(q) || q.includes(nk));
    })) {
      return list;
    }
  }
  return null;
}

/**
 * hub attractions에서 멤버명 exact 매칭.
 * @param {object} hub
 * @param {object} member
 */
export function resolveMemberAttraction(hub, member) {
  if (!hub || !member?.attractionName) return null;
  const target = normalizeKey(member.attractionName);
  for (const attraction of hub.attractions || []) {
    if (normalizeKey(attraction.name) === target) return attraction;
  }
  return null;
}

/**
 * @param {object} list
 */
export function localScenicListMemberKeys(list) {
  return new Set(
    (list?.members || [])
      .map((m) => normalizeKey(m.attractionName))
      .filter(Boolean),
  );
}

/**
 * curated spot이 리스트 멤버인지 (hubId + attractionName exact).
 * @param {object} spot
 * @param {object} list
 */
export function spotMatchesLocalScenicListMember(spot, list) {
  if (!spot || !list || spot.hubId !== list.hubId) return false;
  const keys = localScenicListMemberKeys(list);
  const spotKey = normalizeKey(spot.attractionName || spot.name);
  return Boolean(spotKey && keys.has(spotKey));
}

function listKindBadge(listKind) {
  return KIND_LABEL_KO[listKind] || KIND_LABEL_KO.other;
}

function memberSuggestionBase(list, hub, member) {
  const h = hub || resolveCityAttractionHub(list.hubId);
  const attraction = resolveMemberAttraction(h, member);
  if (attraction && h) return attractionToSuggestion(h, attraction);
  if (!h) return null;
  const lat = member.lat ?? h.lat;
  const lng = member.lng ?? h.lng;
  if (lat == null || lng == null) return null;
  return {
    id: `local-scenic-member-${list.listId}-${normalizeKey(member.attractionName)}`,
    kind: 'attraction',
    badge: getKindLabel(member.kind) || '명소',
    name: member.attractionName,
    name_en: member.name_en || member.attractionName,
    country: h.country || '대한민국',
    country_en: h.country_en || 'South Korea',
    lat,
    lng,
    hubId: list.hubId,
    source: 'localScenicList',
    uiPlace: true,
    parentCity: h.name,
  };
}

/**
 * 드롭다운 멤버 1행 — groupTitle은 소제목용.
 * @param {object} list
 * @param {object} [hub]
 * @param {object} member
 * @param {string} [locale]
 */
export function localScenicMemberToSuggestion(list, hub, member, locale = 'ko') {
  const h = hub || resolveCityAttractionHub(list.hubId);
  const base = memberSuggestionBase(list, h, member);
  if (!base) return null;
  const contentId = memberContentId(member, resolveMemberAttraction(h, member));
  const media = resolveSearchScenicMedia({
    ...base,
    name: member.attractionName,
    hubId: list.hubId,
    contentId,
  });
  const rankBlurb = localScenicMemberRankBlurb(list, h, member, locale);
  return {
    ...base,
    groupTitle: localScenicListDisplayTitle(list, h, locale),
    rankBlurb,
    localScenicListId: list.listId,
    source: 'localScenicList',
    contentId: media.contentId,
    imageUrl: media.imageUrl,
    thumbUrl: media.imageUrl,
  };
}

/**
 * 탐색 검색 행에 명승과 같은 썸네일·contentId를 붙인다 (JSON 쓰기 아님).
 * 팔경 오버레이 → contentId 오버레이 → GATEO 선정. 공식 팔경이 없는 허브 명소는 `{시군} 명소` 소제목만 (N경 아님).
 * @param {object} item
 * @param {string} [locale]
 */
export function enrichSearchCandidateScenicMedia(item, locale = 'ko') {
  if (!item || typeof item !== 'object') return item;
  let next = item;
  const hubId = String(item.hubId || '').trim();
  const hasThumb = Boolean(
    String(item.imageUrl || item.thumbUrl || item.firstImage || item.image_url || '').trim(),
  );
  const media = resolveSearchScenicMedia(item);
  if (media.imageUrl && !hasThumb) {
    next = { ...next, imageUrl: media.imageUrl, thumbUrl: media.imageUrl };
  }
  if (media.contentId && !next.contentId) {
    next = { ...next, contentId: media.contentId };
  }
  if (
    !next.groupTitle &&
    !next.rankBlurb &&
    next.kind === 'attraction' &&
    hubId
  ) {
    const groupTitle = hubAttractionSearchGroupTitle(
      resolveCityAttractionHub(hubId),
      locale,
    );
    if (groupTitle) next = { ...next, groupTitle };
  }
  return next;
}

/**
 * 인근 관광지 행 — Tour 스팟과 이름 매칭 시 썸네일·contentId 유지.
 * @param {object} list
 * @param {object} member
 * @param {object} [hub]
 * @param {object} [nearbyHit]
 * @param {string} [locale]
 */
export function localScenicMemberToNearbyItem(list, member, hub, nearbyHit, locale = 'ko') {
  const h = hub || resolveCityAttractionHub(list.hubId);
  const attraction = resolveMemberAttraction(h, member);
  const curated = lookupCuratedScenicSpot(list.hubId, member.attractionName);
  const fromCurated = scenicThumbFromCurated(curated);
  const spotId = localScenicMemberSpotId(list.listId, member.attractionName);
  const overlay = lookupLocalScenicMemberOverlay(spotId);
  const contentId =
    memberContentId(member, attraction) ||
    (nearbyHit && /^\d{1,32}$/.test(String(nearbyHit.contentId || '').trim())
      ? String(nearbyHit.contentId).trim()
      : null) ||
    overlay?.contentId ||
    fromCurated.contentId;
  const name = member.attractionName;
  const rankBlurb = localScenicMemberRankBlurb(list, h, member, locale);
  const fromTourThumb = lookupLocalScenicPhotoByContentId(contentId);
  const thumb =
    nearbyHit?.firstImage ||
    overlay?.firstImage ||
    overlay?.imageUrl ||
    fromTourThumb?.firstImage ||
    fromTourThumb?.imageUrl ||
    fromCurated.imageUrl ||
    null;
  return {
    ...(nearbyHit || {}),
    id:
      nearbyHit?.id ||
      nearbyHit?.contentId ||
      `local-scenic-member-${list.listId}-${normalizeKey(name)}`,
    name: nearbyHit?.name || name,
    contentId,
    lat: nearbyHit?.lat ?? member.lat ?? attraction?.lat ?? h?.lat,
    lng: nearbyHit?.lng ?? member.lng ?? attraction?.lng ?? h?.lng,
    hubId: list.hubId,
    locality: nearbyHit?.locality || h?.name,
    firstImage: thumb,
    imageUrl: thumb,
    distKm: nearbyHit?.distKm,
    source: nearbyHit?.source || 'localScenicList',
    groupTitle: localScenicListDisplayTitle(list, h, locale),
    localScenicListId: list.listId,
    rankBlurb,
    blurb: rankBlurb,
  };
}

/**
 * 팔경 그룹 행 중 사진이 없고 Tour contentId만 있는 id — DB first_image 조회용.
 * @param {{ groups?: { items?: object[] }[] } | null | undefined} grouped
 * @returns {string[]}
 */
export function missingNearbyThumbContentIds(grouped) {
  /** @type {string[]} */
  const ids = [];
  const seen = new Set();
  for (const group of grouped?.groups || []) {
    for (const item of group.items || []) {
      const hasThumb = Boolean(
        String(item?.firstImage || item?.imageUrl || '').trim(),
      );
      if (hasThumb) continue;
      const id = String(item?.contentId || '').trim();
      if (!hasTourContentId(id) || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/**
 * @param {object[]} spots
 * @param {{ hubId?: string, lat?: number, lng?: number, locale?: string }} [opts]
 */
export function groupNearbySpotsWithLocalScenic(spots, opts = {}) {
  const incoming = Array.isArray(spots) ? spots : [];
  const hubId = resolveLocalScenicHubId({
    hubId: opts.hubId,
    lat: opts.lat,
    lng: opts.lng,
  });
  const lists = listsForHub(hubId);
  if (!lists.length) return { groups: [], rest: incoming };

  const byName = new Map();
  for (const spot of incoming) {
    const k = normalizeKey(spot?.name);
    if (k && !byName.has(k)) byName.set(k, spot);
  }

  const used = new Set();
  const groups = [];
  const hub = resolveCityAttractionHub(hubId);
  for (const list of lists) {
    const items = [];
    for (const member of list.members || []) {
      const k = normalizeKey(member.attractionName);
      if (!k || used.has(k)) continue;
      used.add(k);
      items.push(
        localScenicMemberToNearbyItem(
          list,
          member,
          hub,
          byName.get(k) || null,
          opts.locale,
        ),
      );
    }
    if (items.length) {
      groups.push({
        title: localScenicListDisplayTitle(list, hub, opts.locale),
        listId: list.listId,
        items,
      });
    }
  }

  const rest = incoming.filter((spot) => !used.has(normalizeKey(spot?.name)));
  return { groups, rest };
}

export function localScenicMemberSpotId(listId, attractionName) {
  return `local-scenic:${listId}:${normalizeKey(attractionName)}`;
}

const LOCAL_SCENIC_SPOT_ID_RE = /^local-scenic:([^:]+):(.+)$/;

/**
 * 명승 리스트 합성 id (`local-scenic:listId:name`) → 멤버 행.
 * scenicById/URL `spot=` 조회용. koreaScenicSpots 쓰기 아님.
 * @param {string} id
 * @param {string} [locale]
 */
export function resolveLocalScenicListSpotById(id, locale = 'ko') {
  const raw = String(id || '').trim();
  const m = LOCAL_SCENIC_SPOT_ID_RE.exec(raw);
  if (!m) return null;
  const list = listById.get(m[1]);
  if (!list) return null;
  const nameKey = m[2];
  const member = (list.members || []).find(
    (mem) => normalizeKey(mem.attractionName) === nameKey,
  );
  if (!member) return null;
  return memberToScenicListSpot(list, member, undefined, locale);
}

const USC_BINGHYEOL_FRONT =
  'https://www.usc.go.kr/upload/contents/20240321/DA406CB9AFE3484383F4A34ABC5D3332.jpg';
const USC_BINGHYEOL_TREES =
  'https://www.usc.go.kr/upload/contents/20240321/1E5203EEE5204E6AA97DCC4FD2B1F229.jpg';
const USC_CLIFF_STREAM =
  'https://www.usc.go.kr/upload/contents/20240321/F4444D586A6840ABB9375AA2BFC7E195.jpg';
const USC_INAM_INSCRIPTION =
  'https://www.usc.go.kr/upload/contents/20240331/C84BAAD7A0754ACCBB6A6F9DBACFD18C.jpg';
const USC_INAM_STREAM_ROCK =
  'https://www.usc.go.kr/upload/contents/20240331/20CC56FCB3D64648BA18938F22CDE063.jpg';
const USC_SEOWON_BINGWOLRU =
  'https://www.usc.go.kr/upload/contents/20240321/45306B3FD633427F9CA36FE3C7C55635.jpg';
const USC_SEOWON_HALL =
  'https://www.usc.go.kr/upload/contents/20240321/B6C3DA5800874BB19D09FFF26728F480.jpg';
const USC_BRIDGE =
  'https://www.usc.go.kr/upload/contents/20240321/D727AF913F294667B9543FA2FB1F2119.jpg';
const USC_STREAM_ROAD =
  'https://www.usc.go.kr/upload/contents/20240321/9A8628466C9D419A819EE3750416EA44.jpg';
const USC_PAGODA_AUTUMN =
  'https://www.usc.go.kr/upload/contents/20240331/B479016F2590494F8F79E3115234A62A.jpg';
const USC_PAGODA_SKY =
  'https://www.usc.go.kr/upload/contents/20240331/942CD7641A86489EB4D011E3AA0C1E32.jpg';
const USC_PAGODA_GINKGO =
  'https://www.usc.go.kr/upload/contents/20240331/B08D438E5E7E47EB99DAF08880FFA7CF.jpg';
const VISITKOREA_BINGGYE_VALLEY =
  'https://tong.visitkorea.or.kr/cms/resource/62/3542362_image2_1.jpg';
const VISITKOREA_BINGGYE_PEAK =
  'https://tong.visitkorea.or.kr/cms/resource/63/3542363_image2_1.jpg';
const VISITKOREA_BINGGYE_RAINBOW =
  'https://tong.visitkorea.or.kr/cms/resource/64/3542364_image2_1.jpg';
const VISITKOREA_BINGGYE_TALUS =
  'https://tong.visitkorea.or.kr/cms/resource/66/3542366_image2_1.jpg';
const VISITKOREA_BINGGYE_MEANDER =
  'https://tong.visitkorea.or.kr/cms/resource/68/3542368_image2_1.jpg';
const VISITKOREA_BINGGYE_GORGE =
  'https://tong.visitkorea.or.kr/cms/resource/69/3542369_image2_1.jpg';
const VISITKOREA_BINGGYE_SEOWON =
  'https://tong.visitkorea.or.kr/cms/resource/93/3407093_image2_1.jpg';
const VISITKOREA_GUCHEONDONG =
  'https://tong.visitkorea.or.kr/cms/resource/33/3304433_image2_1.jpg';
const VISITKOREA_DEOGYUSAN =
  'https://tong.visitkorea.or.kr/cms/resource/44/3533344_image2_1.jpg';
const KHS_ILSADAE = 'https://www.khs.go.kr/unisearch/images/scenic_site/1629007.jpg';
const KHS_PAHOE_SUSIMDAE =
  'https://www.khs.go.kr/unisearch/images/scenic_site/1629008.jpg';
const KHS_BINGSANSA_PAGODA =
  'https://www.khs.go.kr/unisearch/images/treasure/2021070217141301.jpg';

const BINGGYE_PARK_ADDR = '경상북도 의성군 춘산면 빙계리 896 (빙계군립공원)';
const GUCHEONDONG_SEOLCHEON_ADDR =
  '전북특별자치도 무주군 설천면 구천동 계곡 일원';
const GUCHEONDONG_TRAIL_ADDR =
  '전북특별자치도 무주군 설천면 삼공리 (덕유산국립공원 구천동 탐방로)';

const GY_SCENIC_BASE = 'https://gwangyang.go.kr/tour/images/sub';
const GY_SCENIC_VALLEYS = `${GY_SCENIC_BASE}/scenic01.jpg`;
const GY_SCENIC_FOREST = `${GY_SCENIC_BASE}/scenic03.jpg`;
const GY_SCENIC_BRIDGE = `${GY_SCENIC_BASE}/scenic04.jpg`;
const GY_SCENIC_BAY_NIGHT = `${GY_SCENIC_BASE}/scenic06.jpg`;
const GY_SCENIC_CAMELLIA = `${GY_SCENIC_BASE}/scenic07.jpg`;
const GY_SCENIC_EUPSU = `${GY_SCENIC_BASE}/scenic09.jpg`;
const VISITKOREA_DONGGOK =
  'https://tong.visitkorea.or.kr/cms/resource/10/3027110_image2_1.jpg';
const VISITKOREA_SEONGBUL =
  'https://tong.visitkorea.or.kr/cms/resource/97/3520297_image2_1.jpg';
const VISITKOREA_EOCHI =
  'https://tong.visitkorea.or.kr/cms/resource/64/1606764_image2_1.jpg';
const VISITKOREA_BAEGUNSAN_GY =
  'https://tong.visitkorea.or.kr/cms/resource/57/3345057_image2_1.JPG';
const VISITKOREA_YISUNSIN =
  'https://tong.visitkorea.or.kr/cms2/website/68/1287568.jpg';
const VISITKOREA_OKRYONG =
  'https://tong.visitkorea.or.kr/cms/resource/03/3520303_image2_1.jpg';
const VISITKOREA_YUDANG =
  'https://tong.visitkorea.or.kr/cms/resource/58/4082858_image2_1.jpg';
const VISITKOREA_HWAGAE_CHERRY =
  'https://tong.visitkorea.or.kr/cms2/website/91/1540691.jpg';
const VISITKOREA_GEUMOSAN_CABLE =
  'https://tong.visitkorea.or.kr/cms/resource/30/3530930_image2_1.jpg';
const VISITKOREA_SSANGGYESA =
  'https://tong.visitkorea.or.kr/cms/resource/55/4075655_image2_1.jpg';
const VISITKOREA_PYEONGSARI =
  'https://tong.visitkorea.or.kr/cms2/website/89/1022589.jpg';
const VISITKOREA_SAMSUNGGUNG =
  'https://tong.visitkorea.or.kr/cms/resource/06/4065606_image2_1.jpg';
const VISITKOREA_HADONG_SONGRIM =
  'https://tong.visitkorea.or.kr/cms/resource_photo/88/3312688_image2_1.jpg';
const VISITKOREA_HADONG_PARK =
  'https://tong.visitkorea.or.kr/cms/resource/48/3549648_image2_1.jpg';
const YD_HANCHEON = 'https://tong.visitkorea.or.kr/cms/resource/62/3577262_image2_1.jpg';
const YD_HANCHEON_2 = 'https://tong.visitkorea.or.kr/cms/resource/60/3577260_image2_1.jpg';
const YD_HANCHEON_3 = 'https://tong.visitkorea.or.kr/cms/resource/61/3577261_image2_1.jpg';
const YD_HANCHEON_4 = 'https://tong.visitkorea.or.kr/cms/resource/63/3577263_image2_1.jpg';
const YD_WOLLYU = 'https://tong.visitkorea.or.kr/cms/resource/60/3543160_image2_1.jpg';
const YD_WOLLYU_2 = 'https://tong.visitkorea.or.kr/cms/resource/54/3543154_image2_1.jpg';
const YD_WOLLYU_3 = 'https://tong.visitkorea.or.kr/cms/resource/55/3543155_image2_1.jpg';
const YD_WOLLYU_4 = 'https://tong.visitkorea.or.kr/cms/resource/56/3543156_image2_1.jpg';
const YD_GANGSEON = 'https://tong.visitkorea.or.kr/cms/resource/06/3572806_image2_1.jpg';
const YD_GANGSEON_2 = 'https://tong.visitkorea.or.kr/cms/resource/03/3572803_image2_1.jpg';
const YD_GANGSEON_3 = 'https://tong.visitkorea.or.kr/cms/resource/04/3572804_image2_1.jpg';
const YD_BIDAN = 'https://tong.visitkorea.or.kr/cms/resource/21/3060021_image2_1.JPG';
const YD_BIDAN_2 = 'https://tong.visitkorea.or.kr/cms/resource/18/3060018_image2_1.JPG';
const YD_SONGHO = 'https://tong.visitkorea.or.kr/cms/resource/88/3572788_image2_1.jpg';
const YD_SONGHO_2 = 'https://tong.visitkorea.or.kr/cms/resource/04/2949504_image2_1.jpg';
const YD_GALGI = 'https://tong.visitkorea.or.kr/cms/resource/51/3341351_image2_1.JPG';
const YD_GAHAK = 'https://tong.visitkorea.or.kr/cms/resource/62/3572762_image2_1.jpg';
const YD_CHEONTAE = 'https://tong.visitkorea.or.kr/cms/resource/36/3059936_image2_1.JPG';
const YD_MULHAN = 'https://tong.visitkorea.or.kr/cms/resource/27/3082527_image2_1.jpg';
const HAMAN_MARI = 'https://tong.visitkorea.or.kr/cms/resource/21/4002121_image2_1.jpg';
const HAMAN_MARI_2 = 'https://tong.visitkorea.or.kr/cms/resource/16/4002116_image2_1.jpg';
const HAMAN_MARI_3 = 'https://tong.visitkorea.or.kr/cms2/website/81/3034481.jpg';
const HAMAN_AGYANG_POPPY = 'https://tong.visitkorea.or.kr/cms2/website/23/2761523.jpg';
const HAMAN_AGYANG_SUNSET = 'https://tong.visitkorea.or.kr/cms2/website/74/2761574.jpg';
const HAMAN_AGYANG_MAY = 'https://tong.visitkorea.or.kr/cms2/website/31/2761531.jpg';
const HAMAN_MUJIN = 'https://tong.visitkorea.or.kr/cms2/website/51/3034451.jpg';
const HAMAN_MUJIN_2 = 'https://tong.visitkorea.or.kr/cms2/website/52/3034452.jpg';
const HAMAN_MUJIN_NAKWA = 'https://tong.visitkorea.or.kr/cms2/website/98/3567298.JPG';
const HAMAN_LOTUS = 'https://tong.visitkorea.or.kr/cms/resource/15/2755215_image2_1.JPG';
const HAMAN_LOTUS_2 = 'https://tong.visitkorea.or.kr/cms/resource/21/2755221_image2_1.JPG';
const HAMAN_LOTUS_3 = 'https://tong.visitkorea.or.kr/cms/resource/17/2755217_image2_1.JPG';
const HAMAN_JANGCHUN = 'https://tong.visitkorea.or.kr/cms/resource/59/3077459_image2_1.jpg';
const HAMAN_JANGCHUN_2 = 'https://tong.visitkorea.or.kr/cms/resource/60/3077460_image2_1.jpg';
const HAMAN_JANGCHUN_3 = 'https://tong.visitkorea.or.kr/cms/resource/63/3077463_image2_1.jpg';
const HAMAN_DAESAN_WALK = 'https://tong.visitkorea.or.kr/cms2/website/96/2761696.jpg';
const HAMAN_AGYANG_ECO = 'https://tong.visitkorea.or.kr/cms/resource/16/3538216_image2_1.jpg';
const HAMAN_AGYANG_ECO_2 = 'https://tong.visitkorea.or.kr/cms/resource/10/3538210_image2_1.jpg';
const HAMAN_AGYANG_ECO_3 = 'https://tong.visitkorea.or.kr/cms/resource/12/3538212_image2_1.jpg';
const HAMAN_AGYANG_ECO_4 = 'https://tong.visitkorea.or.kr/cms/resource/11/3538211_image2_1.jpg';
const HAMAN_AGYANG_ECO_5 = 'https://tong.visitkorea.or.kr/cms/resource/14/3538214_image2_1.jpg';
const SACHEON_CABLE = 'https://tong.visitkorea.or.kr/cms2/website/65/2704865.jpg';
const SACHEON_CABLE_2 = 'https://tong.visitkorea.or.kr/cms2/website/68/2704868.jpg';
const SACHEON_BRIDGE = 'https://tong.visitkorea.or.kr/cms2/website/24/2705324.jpg';
const SACHEON_NAMIL = 'https://tong.visitkorea.or.kr/cms/resource/62/3374262_image2_1.JPG';
const SACHEON_NAMIL_2 = 'https://tong.visitkorea.or.kr/cms/resource/63/3374263_image2_1.JPG';
const SACHEON_NAMIL_3 = 'https://tong.visitkorea.or.kr/cms/resource/94/3374294_image2_1.JPG';
const SACHEON_SEONJIN = 'https://tong.visitkorea.or.kr/cms/resource/24/3564424_image2_1.jpg';
const SACHEON_SEONJIN_2 = 'https://tong.visitkorea.or.kr/cms/resource/25/3564425_image2_1.jpg';
const SACHEON_SEONJIN_3 = 'https://tong.visitkorea.or.kr/cms/resource/12/3515512_image2_1.jpg';
const SACHEON_DASOL = 'https://tong.visitkorea.or.kr/cms/resource/33/3510333_image2_1.jpg';
const SACHEON_DASOL_2 = 'https://tong.visitkorea.or.kr/cms/resource/34/3510334_image2_1.jpg';
const SACHEON_DASOL_3 = 'https://tong.visitkorea.or.kr/cms/resource/36/3510336_image2_1.jpg';
const SACHEON_BITO = 'https://tong.visitkorea.or.kr/cms/resource/19/3537819_image2_1.jpg';
const SACHEON_BITO_2 = 'https://tong.visitkorea.or.kr/cms/resource/42/3583242_image2_1.jpg';
const SACHEON_BITO_3 = 'https://tong.visitkorea.or.kr/cms/resource/43/3583243_image2_1.jpg';
const SACHEON_YONGDU = 'https://tong.visitkorea.or.kr/cms/resource/62/3515562_image2_1.jpg';
const SACHEON_YONGDU_2 = 'https://tong.visitkorea.or.kr/cms/resource/63/3515563_image2_1.jpg';
const SACHEON_YONGDU_3 = 'https://tong.visitkorea.or.kr/cms/resource/66/3515566_image2_1.jpg';
const ICHEON_NOSEONG = 'https://tong.visitkorea.or.kr/cms/resource/36/3060436_image2_1.jpg';
const ICHEON_NOSEONG_2 = 'https://tong.visitkorea.or.kr/cms/resource/27/2617227_image2_1.jpg';
const ICHEON_NOSEONG_3 = 'https://tong.visitkorea.or.kr/cms/resource/37/3060437_image2_1.jpg';
const ICHEON_DODEURAM = 'https://tong.visitkorea.or.kr/cms/resource/40/3060440_image2_1.jpg';
const ICHEON_DODEURAM_2 = 'https://tong.visitkorea.or.kr/cms/resource/38/3060438_image2_1.jpg';
const ICHEON_DODEURAM_3 = 'https://tong.visitkorea.or.kr/cms/resource/29/2617229_image2_1.JPG';
const ICHEON_BANRYONG = 'https://tong.visitkorea.or.kr/cms/resource/74/3383574_image2_1.jpg';
const ICHEON_BANRYONG_2 = 'https://tong.visitkorea.or.kr/cms/resource/75/3383575_image2_1.jpg';
const ICHEON_BANRYONG_3 = 'https://tong.visitkorea.or.kr/cms/resource/76/3383576_image2_1.jpg';
const ICHEON_SAGIMAK = 'https://tong.visitkorea.or.kr/cms/resource/46/3541546_image2_1.jpg';
const ICHEON_SAGIMAK_2 = 'https://tong.visitkorea.or.kr/cms/resource/45/3541545_image2_1.jpg';
const ICHEON_SAGIMAK_3 = 'https://tong.visitkorea.or.kr/cms/resource/47/3541547_image2_1.jpg';
const ICHEON_SAMHYEONGJE = 'https://tong.visitkorea.or.kr/cms/resource/52/3058352_image2_1.jpg';
const ICHEON_SAMHYEONGJE_2 = 'https://tong.visitkorea.or.kr/cms/resource/53/3058353_image2_1.jpg';
const ICHEON_SAMHYEONGJE_3 = 'https://tong.visitkorea.or.kr/cms/resource/55/3058355_image2_1.jpg';
const ICHEON_AERYEON = 'https://tong.visitkorea.or.kr/cms/resource/26/3541426_image2_1.jpg';
const ICHEON_AERYEON_2 = 'https://tong.visitkorea.or.kr/cms/resource/27/3541427_image2_1.jpg';
const ICHEON_AERYEON_3 = 'https://tong.visitkorea.or.kr/cms/resource/28/3541428_image2_1.jpg';
const CNG_UPO = 'https://tong.visitkorea.or.kr/cms2/website/85/2620285.jpg';
const CNG_UPO_2 = 'https://tong.visitkorea.or.kr/cms2/website/56/2761856.jpg';
const CNG_UPO_3 = 'https://tong.visitkorea.or.kr/cms2/website/72/1961572.jpg';
const CNG_HWAWANG = 'https://tong.visitkorea.or.kr/cms/resource/29/3496729_image2_1.jpg';
const CNG_HWAWANG_2 = 'https://tong.visitkorea.or.kr/cms/resource/28/3496728_image2_1.jpg';
const CNG_HWAWANG_3 = 'https://tong.visitkorea.or.kr/cms/resource/30/3496730_image2_1.jpg';
const CNG_RAPESEED = 'https://tong.visitkorea.or.kr/cms/resource/54/4053654_image2_1.jpg';
const CNG_GAEBIRI = 'https://tong.visitkorea.or.kr/cms/resource/88/4046188_image2_1.jpg';
const CNG_GAEBIRI_2 = 'https://tong.visitkorea.or.kr/cms/resource/65/3564565_image2_1.JPG';
const CNG_MANOK = 'https://tong.visitkorea.or.kr/cms/resource/41/3496641_image2_1.jpg';
const CNG_MANOK_2 = 'https://tong.visitkorea.or.kr/cms/resource/35/3496635_image2_1.jpg';
const CNG_PAGODA = 'https://tong.visitkorea.or.kr/cms/resource/71/3376171_image2_1.JPG';
const CNG_TOMB = 'https://tong.visitkorea.or.kr/cms/resource/27/3538827_image2_1.jpg';
const CNG_TOMB_2 = 'https://tong.visitkorea.or.kr/cms2/website/31/3567231.jpg';
const CNG_TOMB_3 = 'https://tong.visitkorea.or.kr/cms2/website/47/3567247.jpg';
const CNG_MANNYEON = 'https://tong.visitkorea.or.kr/cms/resource/11/4046211_image2_1.jpg';
const CNG_MANNYEON_2 = 'https://tong.visitkorea.or.kr/cms2/website/33/2761533.jpg';
const CNG_MANNYEON_3 = 'https://tong.visitkorea.or.kr/cms2/website/00/2907700.jpg';
const JINJU_UIAM = 'https://tong.visitkorea.or.kr/cms/resource/92/3349292_image2_1.jpg';
const JINJU_UIAM_2 = 'https://tong.visitkorea.or.kr/cms/resource/93/3349293_image2_1.jpg';
const JINJU_UIAM_3 = 'https://tong.visitkorea.or.kr/cms/resource/94/3349294_image2_1.jpg';
const JINJU_DWIBYORI = 'https://tong.visitkorea.or.kr/cms/resource/41/2894541_image2_1.jpg';
const JINJU_DWIBYORI_2 = 'https://tong.visitkorea.or.kr/cms/resource/37/2894537_image2_1.jpg';
const JINJU_DWIBYORI_3 = 'https://tong.visitkorea.or.kr/cms/resource/56/3492756_image2_1.jpg';
const JINJU_SAEBYEORI = 'https://tong.visitkorea.or.kr/cms/resource/65/3522165_image2_1.jpg';
const JINJU_SAEBYEORI_2 = 'https://tong.visitkorea.or.kr/cms/resource/66/3522166_image2_1.jpg';
const JINJU_SAEBYEORI_3 = 'https://tong.visitkorea.or.kr/cms/resource/67/3522167_image2_1.jpg';
const JINJU_MANGJIN = 'https://tong.visitkorea.or.kr/cms2/website/36/1966336.jpg';
const JINJU_MANGJIN_2 = 'https://tong.visitkorea.or.kr/cms2/website/40/1966340.jpg';
const JINJU_MANGJIN_3 = 'https://tong.visitkorea.or.kr/cms2/website/43/1966343.jpg';
const JINJU_BIBONG = 'https://tong.visitkorea.or.kr/cms/resource/55/3040855_image2_1.jpg';
const JINJU_BIBONG_2 = 'https://tong.visitkorea.or.kr/cms/resource/52/3040852_image2_1.jpg';
const JINJU_BIBONG_3 = 'https://tong.visitkorea.or.kr/cms/resource/56/3040856_image2_1.jpg';
const JINJU_WOLA = 'https://tong.visitkorea.or.kr/cms/resource/22/3538822_image2_1.jpg';
const JINJU_WOLA_2 = 'https://tong.visitkorea.or.kr/cms/resource/20/3538820_image2_1.jpg';
const JINJU_WOLA_3 = 'https://tong.visitkorea.or.kr/cms/resource/21/3538821_image2_1.jpg';
const JC_PYEONGSA = 'https://tong.visitkorea.or.kr/cms2/website/31/3343431.jpg';
const JC_PYEONGSA_2 = 'https://tong.visitkorea.or.kr/cms2/website/41/3343441.jpg';
const JC_PYEONGSA_3 = 'https://tong.visitkorea.or.kr/cms2/website/47/3343447.jpg';
const JC_UDAM = 'https://tong.visitkorea.or.kr/cms2/website/92/3343492.jpg';
const JC_UDAM_2 = 'https://tong.visitkorea.or.kr/cms2/website/93/3343493.jpg';
const JC_UDAM_3 = 'https://tong.visitkorea.or.kr/cms2/website/77/3414777.jpg';
const JC_GEUMGYE = 'https://tong.visitkorea.or.kr/cms2/website/32/1436432.jpg';
const JC_GEUMGYE_2 = 'https://tong.visitkorea.or.kr/cms2/website/40/1436440.jpg';
const JC_GEUMGYE_3 = 'https://tong.visitkorea.or.kr/cms2/website/44/1436444.jpg';
const JC_SANGSAN = 'https://tong.visitkorea.or.kr/cms2/website/68/1363968.jpg';
const JC_SANGSAN_2 = 'https://tong.visitkorea.or.kr/cms2/website/70/1363970.jpg';
const JC_SANGSAN_3 = 'https://tong.visitkorea.or.kr/cms2/website/75/1363975.jpg';
const JC_EOEUN = 'https://tong.visitkorea.or.kr/cms2/website/38/1436038.jpg';
const JC_EOEUN_2 = 'https://tong.visitkorea.or.kr/cms2/website/39/1436039.jpg';
const JC_EOEUN_3 = 'https://tong.visitkorea.or.kr/cms2/website/40/1436040.jpg';
const JC_JEOKDAE = 'https://tong.visitkorea.or.kr/cms2/website/51/3343451.jpg';
const JC_JEOKDAE_2 = 'https://tong.visitkorea.or.kr/cms2/website/64/3343464.jpg';
const JC_JEOKDAE_3 = 'https://tong.visitkorea.or.kr/cms2/website/74/3343474.jpg';
const vkScenicImg = (id) => `https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=${id}`;
const GYE_NOGO_UNHAE = vkScenicImg('b77aaed7-f970-42d6-8df1-beead1d4ca33');
const GYE_NOGO_UNHAE_2 = vkScenicImg('79ef576f-f392-4f80-bfc4-ba5fea640dcd');
const GYE_NOGO_UNHAE_3 = vkScenicImg('4b1547e7-44cb-49d9-93a9-cd11a834b0e8');
const GYE_BANYA = vkScenicImg('b2fb54e2-2be7-47d1-838f-bf0cada98366');
const GYE_BANYA_2 = vkScenicImg('65ec10f8-8c7a-4e09-b827-8cb20e97e6c2');
const GYE_BANYA_3 = vkScenicImg('65d1b496-ab69-4144-99a2-086c58caedc9');
const GYE_PIAGOL = vkScenicImg('fc5efde4-a53b-4a39-9607-66eebdfd965a');
const GYE_PIAGOL_2 = vkScenicImg('aa51788c-f230-4c31-a357-4829bdf4dff0');
const GYE_PIAGOL_3 = vkScenicImg('c1ed2033-9a74-42c3-b5b4-00143f7d862c');
const GYE_SANDONG = vkScenicImg('fe28d36e-f32b-4355-a8c1-b6e54526a2e1');
const GYE_SANDONG_2 = vkScenicImg('5e490224-ad27-491e-973e-3c75755f1486');
const GYE_SANDONG_3 = vkScenicImg('1ea3d24c-30a2-46e5-a025-26149136ae0d');
const GYE_NOGO_SNOW = vkScenicImg('65f69570-fb78-4d74-9965-215ba64cf433');
const GYE_NOGO_SNOW_2 = vkScenicImg('b08d8a75-4da7-4a47-82a6-f75347d43790');
const GYE_NOGO_SNOW_3 = vkScenicImg('68714b1a-a7c2-4d34-bdb5-5cb71d4acea4');
const GJ_WOLCHUL = 'https://tong.visitkorea.or.kr/cms/resource/81/3518681_image2_1.jpg';
const GJ_WOLCHUL_2 = 'https://tong.visitkorea.or.kr/cms/resource/59/4057159_image2_1.jpg';
const GJ_WOLCHUL_3 = 'https://tong.visitkorea.or.kr/cms/resource/82/3518682_image2_1.jpg';
const GJ_GAHAK = 'https://tong.visitkorea.or.kr/cms/resource/09/3061309_image2_1.jpg';
const GJ_GAHAK_2 = 'https://tong.visitkorea.or.kr/cms/resource/92/3061292_image2_1.jpg';
const GJ_GAHAK_3 = 'https://tong.visitkorea.or.kr/cms/resource/01/3061301_image2_1.jpg';
const GJ_BAEKYA = 'https://tong.visitkorea.or.kr/cms/resource/61/3340061_image2_1.jpg';
const GJ_BAEKYA_2 = 'https://tong.visitkorea.or.kr/cms/resource/62/3340062_image2_1.jpg';
const GJ_BAEKYA_3 = 'https://tong.visitkorea.or.kr/cms/resource/63/3340063_image2_1.jpg';
const GJ_NAMDO = 'https://tong.visitkorea.or.kr/cms2/website/61/1676861.jpg';
const GJ_NAMDO_2 = 'https://tong.visitkorea.or.kr/cms2/website/62/1676862.jpg';
const GJ_NAMDO_3 = 'https://tong.visitkorea.or.kr/cms2/website/63/1676863.jpg';
const GJ_CELADON = 'https://tong.visitkorea.or.kr/cms/resource/34/4101934_image2_1.jpg';
const GJ_CELADON_2 = 'https://tong.visitkorea.or.kr/cms/resource/29/4101929_image2_1.jpg';
const GJ_CELADON_3 = 'https://tong.visitkorea.or.kr/cms2/website/82/1676782.jpg';
const GJ_VILLAGE = 'https://tong.visitkorea.or.kr/cms/resource/36/4101936_image2_1.jpg';
const GJ_VILLAGE_2 = 'https://tong.visitkorea.or.kr/cms/resource/35/4101935_image2_1.jpg';
const GJ_VILLAGE_3 = 'https://tong.visitkorea.or.kr/cms/resource/37/4101937_image2_1.jpg';
const GS_NAKJO = 'https://tong.visitkorea.or.kr/cms2/website/27/3587127.jpg';
const GS_NAKJO_2 = 'https://tong.visitkorea.or.kr/cms2/website/26/3587126.jpg';
const GS_NAKJO_3 = 'https://www.khs.go.kr/unisearch/images/scenic_site/2018060814463900.JPG';
const GS_MYEONGSA = 'https://tong.visitkorea.or.kr/cms2/website/78/2812178.jpg';
const GS_MYEONGSA_2 = 'https://tong.visitkorea.or.kr/cms2/website/04/2812204.jpg';
const GS_MYEONGSA_3 = 'https://tong.visitkorea.or.kr/cms2/website/77/2812177.jpg';
const GS_MANGJU = 'https://www.khs.go.kr/unisearch/images/scenic_site/2018060817221700.jpg';
const GS_MANGJU_2 = 'https://tong.visitkorea.or.kr/cms2/website/77/2812177.jpg';
const GS_MANGJU_3 = 'https://www.khs.go.kr/unisearch/images/scenic_site/2018060817244600.jpg';
const GS_WOLYEONG = 'https://tong.visitkorea.or.kr/cms2/website/81/3345581.jpg';
const GS_WOLYEONG_2 = 'https://tong.visitkorea.or.kr/cms2/website/15/3086015.jpg';
const GS_WOLYEONG_3 = 'https://tong.visitkorea.or.kr/cms2/website/00/3043300.jpg';
const GS_MUSAN = 'https://tong.visitkorea.or.kr/cms2/website/64/1961764.jpg';
const GS_MUSAN_2 = 'https://tong.visitkorea.or.kr/cms2/website/32/3587532.jpg';
const GS_MUSAN_3 = 'https://tong.visitkorea.or.kr/cms2/website/44/1674144.jpg';
const GEUM_FOREST = 'https://tong.visitkorea.or.kr/cms/resource/05/2749805_image2_1.jpg';
const GEUM_FOREST_2 = 'https://tong.visitkorea.or.kr/cms/resource/11/2749811_image2_1.jpg';
const GEUM_FOREST_3 = 'https://tong.visitkorea.or.kr/cms/resource/37/2952537_image2_1.jpg';
const GEUM_GIAHS = 'https://tong.visitkorea.or.kr/cms/resource/71/3559771_image2_1.jpg';
const GEUM_GIAHS_2 = 'https://tong.visitkorea.or.kr/cms/resource/70/3559770_image2_1.jpg';
const GEUM_GIAHS_3 = 'https://tong.visitkorea.or.kr/cms/resource/74/3559774_image2_1.jpg';
const GEUM_MARKET = 'https://tong.visitkorea.or.kr/cms/resource/69/4086869_image2_1.jpg';
const GEUM_MARKET_2 = 'https://tong.visitkorea.or.kr/cms/resource/52/3045152_image2_1.JPG';
const GEUM_MARKET_3 = 'https://tong.visitkorea.or.kr/cms/resource/53/3045153_image2_1.JPG';
const GEUM_WOL = 'https://tong.visitkorea.or.kr/cms/resource/44/4086844_image2_1.jpg';
const GEUM_WOL_2 = 'https://tong.visitkorea.or.kr/cms/resource/79/3036479_image2_1.jpg';
const GEUM_WOL_3 = 'https://tong.visitkorea.or.kr/cms/resource/60/3559860_image2_1.jpg';
const GEUM_GINKGO = 'https://www.geumsan.go.kr/tour/img/sub02/sub020610_img02.jpg';
const GEUM_GINKGO_2 = 'https://www.khs.go.kr/unisearch/images/natural_monument/1630483.jpg';
const GEUM_SEODAE = 'https://www.geumsan.go.kr/tour/img/sub02/sub020604_img02.jpg';
const GEUM_SEODAE_2 = 'https://www.geumsan.go.kr/tour/img/sub02/sub020604_img01.jpg';
const GEUM_SEODAE_3 = 'https://www.geumsan.go.kr/tour/img/sub02/sub020604_img03.jpg';
const GEUM_JINAK = 'https://www.geumsan.go.kr/tour/img/sub02/sub020603_img01.jpg';
const GEUM_JINAK_2 = 'https://www.geumsan.go.kr/tour/img/sub02/sub020603_img02.jpg';
const GEUM_JINAK_3 = 'https://www.geumsan.go.kr/tour/img/sub02/sub020603_img03.jpg';
const NH_BORIAM = 'https://tong.visitkorea.or.kr/cms2/website/11/1579511.jpg';
const NH_BORIAM_2 = 'https://tong.visitkorea.or.kr/cms2/website/14/1579514.jpg';
const NH_BORIAM_3 = 'https://tong.visitkorea.or.kr/cms2/website/16/1579516.jpg';
const NH_JUK = 'https://tong.visitkorea.or.kr/cms2/website/72/1764272.jpg';
const NH_JUK_2 = 'https://tong.visitkorea.or.kr/cms2/website/73/1764273.jpg';
const NH_JUK_3 = 'https://tong.visitkorea.or.kr/cms2/website/95/2613895.jpg';
const NH_NODO = 'https://tong.visitkorea.or.kr/cms/resource/64/3556464_image2_1.jpg';
const NH_NODO_2 = 'https://tong.visitkorea.or.kr/cms/resource/56/3556456_image2_1.jpg';
const NH_NODO_3 = 'https://tong.visitkorea.or.kr/cms/resource/61/3556461_image2_1.jpg';
const NH_FOREST = 'https://tong.visitkorea.or.kr/cms2/website/20/1571320.jpg';
const NH_FOREST_2 = 'https://tong.visitkorea.or.kr/cms2/website/22/1571322.jpg';
const NH_FOREST_3 = 'https://tong.visitkorea.or.kr/cms2/website/24/1571324.jpg';
const NH_BRIDGE = 'https://tong.visitkorea.or.kr/cms2/website/98/1576398.jpg';
const NH_BRIDGE_2 = 'https://tong.visitkorea.or.kr/cms2/website/01/1576401.jpg';
const NH_BRIDGE_3 = 'https://tong.visitkorea.or.kr/cms2/website/10/1576410.jpg';
const PH_HOMI = 'https://tong.visitkorea.or.kr/cms2/website/99/2644199.jpg';
const PH_HOMI_2 = 'https://tong.visitkorea.or.kr/cms2/website/00/2644200.jpg';
const PH_HOMI_3 = 'https://tong.visitkorea.or.kr/cms2/website/14/1224414.jpg';
const PH_FALLS = 'https://tong.visitkorea.or.kr/cms2/website/21/3543621.jpg';
const PH_FALLS_2 = 'https://tong.visitkorea.or.kr/cms2/website/05/3543605.jpg';
const PH_FALLS_3 = 'https://tong.visitkorea.or.kr/cms2/website/06/3543606.jpg';
const PH_OEO = 'https://tong.visitkorea.or.kr/cms2/website/20/2454220.jpg';
const PH_OEO_2 = 'https://tong.visitkorea.or.kr/cms2/website/23/2454223.jpg';
const PH_OEO_3 = 'https://tong.visitkorea.or.kr/cms2/website/26/2454226.jpg';
const PH_YEONGIL = 'https://tong.visitkorea.or.kr/cms2/website/79/2454079.jpg';
const PH_YEONGIL_2 = 'https://tong.visitkorea.or.kr/cms2/website/81/2454081.jpg';
const PH_YEONGIL_3 = 'https://tong.visitkorea.or.kr/cms2/website/23/2504223.jpg';
const PH_RAIL = 'https://www.pohang.go.kr/phtour/data/tour/image/112/1663228413252.jpg';
const PH_RAIL_2 = 'https://www.pohang.go.kr/phtour/data/tour/image/112/1663228416441.jpg';
const PH_RAIL_3 = 'https://www.pohang.go.kr/phtour/data/tour/image/112/1671447358825.jpg';
const AY_MANG = 'https://www.anyang.go.kr/DATA/tour/19/20230209031933577Iau219.jpg';
const AY_MANG_2 = 'https://www.anyang.go.kr/DATA/tour/36/EDDFDB77-5710-49ED-2111-FD88E457F2BF-20200116.jpg';
const AY_MANG_3 = 'https://www.anyang.go.kr/DATA/tour/36/4C305641-5246-EAB1-A49D-D88D5476DE91-20191218.jpg';
const AY_SURI = 'https://www.anyang.go.kr/DATA/tour/21/thumb/p_20220504110521911YvDW1i.jpg';
const AY_PYEONG = 'https://www.anyang.go.kr/DATA/tour/22/thumb/p_20210108105653517zEGNSR.jpg';
const AY_MANAN = 'https://www.anyang.go.kr/DATA/tour/19/74C657E2-741C-120D-39E4-BACBDEA3A796-20191126.jpg';
const AY_MANAN_2 = 'https://www.anyang.go.kr/DATA/tour/19/24EACAED-B757-CEE7-1685-95FF4839039E-20200115.jpg';
const AY_MANAN_3 = 'https://www.anyang.go.kr/DATA/tour/19/1C04209B-7D12-6F1C-EE94-DE7DFA1DDF00-20200115.jpg';
const JP_STAR = 'https://www.jp.go.kr/uloads_clone/tursmCn/TUCN_201802050508247131.jpg';
const JP_STAR_2 = 'https://www.jp.go.kr/uloads_clone/tursmCn/TUCN_201802050508248363.jpg';
const JP_STAR_3 = 'https://www.jp.go.kr/uloads_clone/tursmCn/TUCN_201802050508248924.jpg';
const JP_SAMGI = 'https://tong.visitkorea.or.kr/cms2/website/36/3450336.jpg';
const JP_SAMGI_2 = 'https://tong.visitkorea.or.kr/cms2/website/37/3450337.jpg';
const JP_SAMGI_3 = 'https://tong.visitkorea.or.kr/cms2/website/38/3450338.jpg';
const JP_CHU = 'https://www.khs.go.kr/unisearch/images/history_site/1626405.jpg';
const JP_CHU_2 = 'https://jparchives.kr/images/108253.jpg';
const JP_CHU_3 = 'https://jparchives.kr/images/108254.jpg';
const JP_YEON = 'https://jparchives.kr/images/107492.jpg';
const JP_YEON_2 = 'https://www.jp.go.kr/images/facility/sub02/sub02_08_01_img01.jpg';
const JP_YEON_3 = 'https://jparchives.kr/images/107520.jpg';
const GR_GUKSA = 'https://www.gyeryong.go.kr/kr/img/sub06/sub06020204_img01.jpg';
const GR_GUKSA_2 = 'https://www.gyeryong.go.kr/_prog/dn00/?file_id=9cd17e27542283522df76ca9775de896';
const GR_GUKSA_3 = 'https://www.gyeryong.go.kr/_prog/dn00/?file_id=396c2ea4177fe67130695258ffd854e5';
const GR_SUT = 'https://www.gyeryong.go.kr/_prog/download/?editor_image=20211227161510442_YDCLKBZE.jpg';
const GR_AM = 'https://www.gyeryong.go.kr/_prog/download/?editor_image=20211227161405101_K69Z04LL.jpg';
const GR_AM_2 = 'https://www.gyeryong.go.kr/_prog/dn00/?file_id=2b70b0d4b37063d583728062f3eb209f';
const GR_UNI = 'https://www.gyeryong.go.kr/_prog/dn00/?file_id=7de9c26193dec2a10ac8431a9a12e589';
const GR_UNI_2 =
  'https://www.gyeryong.go.kr/_prog/download/?site_dvs_cd=tour&func_gbn_cd=tourist&filename=20210825144327_00442b143tp5az6mhqcqo4an81rycz.png&editor=Y';
const GR_UNI_3 = 'https://www.gyeryong.go.kr/kr/img/sub06/sub06030204_img02.jpg';
const NS_SURAK = 'https://www.nonsan.go.kr/site/tour/img/sub02/sub020201_img03.jpg';
const NS_SURAK_2 = 'https://www.nonsan.go.kr/site/tour/img/sub01/28/photo01.jpg';
const NS_SURAK_3 = 'https://www.nonsan.go.kr/site/tour/img/sub01/28/photo18.jpg';
const NS_SURAK_4 = 'https://www.nonsan.go.kr/site/tour/img/sub01/28/photo23.jpg';
const NS_GANG = 'https://www.nonsan.go.kr/site/tour/img/sub02/sub020201_img07.jpg';
const NS_GANG_2 = 'https://tong.visitkorea.or.kr/cms2/website/66/2442466.jpg';
const NS_GANG_3 = 'https://tong.visitkorea.or.kr/cms2/website/90/2442490.jpg';
const NS_NOSEONG = 'https://www.nonsan.go.kr/site/tour/img/sub02/sub020201_img08.jpg';
const NS_NOSEONG_2 = 'https://tong.visitkorea.or.kr/cms2/website/17/1222217.jpg';
const NS_NOSEONG_3 = 'https://tong.visitkorea.or.kr/cms2/website/47/1414447.jpg';
const NS_JONGHAK = 'https://www.nonsan.go.kr/site/tour/img/sub02/sub020201_img11.jpg';
const NS_JONGHAK_2 = 'https://tong.visitkorea.or.kr/cms2/website/00/1222500.jpg';
const NS_JONGHAK_3 = 'https://tong.visitkorea.or.kr/cms2/website/38/2442538.jpg';
const NS_YANGCHON =
  'https://www.nonsan.go.kr/_prog/download/?d_type=1&filename=20240129135124_00g51rm9gy97sfntbmkbocer3sip5x.jpg&func_gbn_cd=tourinfo&site_dvs_cd=tour';
const NS_YANGCHON_2 =
  'https://www.nonsan.go.kr/_prog/download/?d_type=1&filename=20240129135124_01ffjt8rh0p1af8ur4jxn1gmecydzv.jpg&func_gbn_cd=tourinfo&site_dvs_cd=tour';
const NS_HISTORY = 'https://tong.visitkorea.or.kr/cms/resource/35/3082135_image2_1.JPG';
const NS_HISTORY_2 = 'https://tong.visitkorea.or.kr/cms/resource/36/3082136_image2_1.JPG';
const NS_HISTORY_3 = 'https://tong.visitkorea.or.kr/cms/resource/37/3082137_image2_1.JPG';
const NS_NOGANG =
  'https://www.nonsan.go.kr/_prog/download/?d_type=1&filename=20221222134750_005oh6xhh6tp6jsk3shswc6989u7wa.jpg&func_gbn_cd=tourinfo&site_dvs_cd=tour';
const NS_NOGANG_2 =
  'https://www.nonsan.go.kr/_prog/download/?d_type=1&filename=20221222134732_01uf5luuxcjcn6e21u0eu4j262dc6x.jpg&func_gbn_cd=tourinfo&site_dvs_cd=tour';
const CN_YU = 'https://www.cheonan.go.kr/thumbnail/tranPROGFile/tursmCn/TUCN_202311160351371300.jpg';
const CN_YU_2 = 'https://www.cheonan.go.kr/thumbnail/tranPROGFile/images/tour/sub01/photo01_img04.jpg';
const CN_YU_3 = 'https://www.cheonan.go.kr/thumbnail/tranPROGFile/images/tour/sub01/photo01_img01.jpg';
const CN_TAEJO = 'https://www.cheonan.go.kr/thumbnail/tuTrsm/TT_202602090307011892.JPG';
const CN_TAEJO_2 = 'https://www.cheonan.go.kr/thumbnail/tuTrsm/TT_202602090307013903.JPG';
const CN_TAEJO_3 = 'https://www.cheonan.go.kr/thumbnail/tranPROGFile/images/tour/sub01/photo05_img01.jpg';
const CN_ARARIO = 'https://www.cheonan.go.kr/thumbnail/tranPROGFile/tursmCn/TUCN_202311160356224720.jpg';
const CN_ARARIO_2 = 'https://www.cheonan.go.kr/thumbnail/tranPROGFile/tursmCn/TUCN_201512300206334556.JPG';
const CN_ARARIO_3 = 'https://www.cheonan.go.kr/thumbnail/tranPROGFile/tursmCn/TUCN_201512300206338437.jpg';
const CN_STELE = 'https://www.cheonan.go.kr/thumbnail/tuTrsm/TT_202602090337447340.JPG';
const CN_STELE_2 = 'https://www.cheonan.go.kr/thumbnail/tuTrsm/TT_202602090337493453.JPG';
const CN_STELE_3 = 'https://www.cheonan.go.kr/thumbnail/tuTrsm/TT_202602090337496804.JPG';
const DY_GAMA =
  'https://www.damyang.go.kr/board/getFile?boardId=BBS_0000169&fileSid=128366';
const DY_GAMA_2 = 'https://tong.visitkorea.or.kr/cms/resource/35/3027135_image2_1.jpg';
const DY_GAMA_3 = 'https://tong.visitkorea.or.kr/cms/resource/36/3027136_image2_1.jpg';
const DY_SAMIN =
  'https://www.damyang.go.kr/board/getFile?boardId=BBS_0000169&fileSid=128341';
const DY_META =
  'https://www.damyang.go.kr/board/getFile?boardId=BBS_0000169&fileSid=128338';
const DY_META_2 =
  'https://www.damyang.go.kr/board/getFile?boardId=BBS_0000169&fileSid=128339';
const DY_META_3 = 'https://tong.visitkorea.or.kr/cms/resource/45/4105445_image2_1.jpg';
const DY_GWANBANG =
  'https://www.damyang.go.kr/board/getFile?boardId=BBS_0000169&fileSid=128370';
const DY_GWANBANG_2 =
  'https://www.damyang.go.kr/board/getFile?boardId=BBS_0000169&fileSid=128368';
const DY_GWANBANG_3 =
  'https://www.damyang.go.kr/board/getFile?boardId=BBS_0000169&fileSid=128367';
const DY_GWANBANG_4 = 'https://tong.visitkorea.or.kr/cms/resource/57/3533957_image2_1.jpg';
const DY_CHUWOL = 'https://tong.visitkorea.or.kr/cms/resource/93/3581993_image2_1.jpg';
const DY_GEUMSEONG = 'https://tong.visitkorea.or.kr/cms/resource/71/4110971_image2_1.jpg';
const DY_BYEONGPUNG = 'https://tong.visitkorea.or.kr/cms/resource/57/3582057_image2_1.jpg';
const MR_HOBAKSO = 'https://tong.visitkorea.or.kr/cms/resource/72/2660872_image2_1.jpg';
const MR_HOBAKSO_2 = 'https://tong.visitkorea.or.kr/cms/resource/65/2589465_image2_1.jpg';
const MR_HOBAKSO_3 = 'https://tong.visitkorea.or.kr/cms/resource/63/2589463_image2_1.jpg';
const MR_WOLYEON = 'https://www.khs.go.kr/unisearch/images/scenic_site/1629308.jpg';
const MR_WOLYEON_2 = 'https://www.khs.go.kr/unisearch/images/scenic_site/1629309.jpg';
const MR_WOLYEON_3 = 'https://www.khs.go.kr/unisearch/images/scenic_site/1629310.jpg';
const MR_MANEO = 'https://tong.visitkorea.or.kr/cms/resource/43/3494643_image2_1.JPG';
const MR_MANEO_2 = 'https://tong.visitkorea.or.kr/cms/resource/40/3494640_image2_1.JPG';
const MR_MANEO_3 = 'https://tong.visitkorea.or.kr/cms/resource/42/3494642_image2_1.JPG';
const MR_JONGNAM = 'https://tong.visitkorea.or.kr/cms/resource/40/2778040_image2_1.jpg';
const MR_JONGNAM_2 = 'https://tong.visitkorea.or.kr/cms/resource/39/2778039_image2_1.jpg';
const MR_JONGNAM_3 = 'https://tong.visitkorea.or.kr/cms/resource/43/2778043_image2_1.jpg';
const YD_DOCHON =
  'https://www.korea.kr/newsWeb/resources/attaches/2025.02/05/0743c1bfdce5922af816a3742c8af5de.jpg';
const YD_PALGAK = 'https://tong.visitkorea.or.kr/cms/resource/71/3465371_image2_1.jpg';
const YD_PALGAK_2 = 'https://tong.visitkorea.or.kr/cms/resource/73/3465373_image2_1.jpg';
const YD_PALGAK_3 = 'https://tong.visitkorea.or.kr/cms/resource/74/3465374_image2_1.jpg';
const YD_PALGAK_4 = 'https://www.khs.go.kr/unisearch/images/scenic_site/2022030409555300.JPG';
const YD_CAMELLIA = 'https://tong.visitkorea.or.kr/cms2/website/61/2006161.jpg';
const YD_CAMELLIA_2 = 'https://tong.visitkorea.or.kr/cms2/website/65/2006165.jpg';
const YD_CAMELLIA_3 = 'https://tong.visitkorea.or.kr/cms2/website/67/2006167.jpg';
const YD_NAONG = 'https://tong.visitkorea.or.kr/cms2/website/46/2648746.jpg';
const YD_NAONG_2 = 'https://tong.visitkorea.or.kr/cms2/website/47/2648747.jpg';
const YD_NAONG_3 = 'https://tong.visitkorea.or.kr/cms2/website/48/2648748.jpg';
const YD_SAMSA = 'https://tong.visitkorea.or.kr/cms/resource/52/4076752_image2_1.jpg';
const YD_SAMSA_2 = 'https://tong.visitkorea.or.kr/cms/resource/53/4076753_image2_1.jpg';
const YD_SAMSA_3 = 'https://tong.visitkorea.or.kr/cms/resource/55/4076755_image2_1.jpg';
const YD_HAJEO = 'https://tong.visitkorea.or.kr/cms/resource/96/3590496_image2_1.jpg';
const JD_JODO =
  'https://www.jindo.go.kr/uploads/tour/info/nature/201611080750465200.jpg';
const JD_DECK =
  'https://www.jindo.go.kr/uploads/tour/info/nature/201611080750470042.jpg';
const JD_LIGHT_AIR =
  'https://www.jindo.go.kr/uploads/tour/info/nature/201612230215081020.jpg';
const JD_LIGHT =
  'https://www.jindo.go.kr/uploads/tour/info/nature/201612230215081201.jpg';
const JD_GASA =
  'https://www.jindo.go.kr/uploads/tour/info/nature/201611080739579140.jpg';
const HP_BAEKJE = 'https://tong.visitkorea.or.kr/cms/resource/22/3536122_image2_1.jpg';
const HP_BAEKJE_2 = 'https://tong.visitkorea.or.kr/cms/resource/23/3536123_image2_1.jpg';
const HP_BAEKJE_3 = 'https://tong.visitkorea.or.kr/cms/resource/24/3536124_image2_1.jpg';
const HP_BAEKJE_GUN = 'https://www.hampyeong.go.kr/home/tour/images/sub/thum_mk010.jpg';
const HP_MOAK = 'https://tong.visitkorea.or.kr/cms/resource/45/3061145_image2_1.jpg';
const HP_MOAK_2 = 'https://tong.visitkorea.or.kr/cms/resource/41/3061141_image2_1.jpg';
const HP_MOAK_GUN = 'https://www.hampyeong.go.kr/home/tour/images/sub/thum_mk009.jpg';
const HP_SAMHO = 'https://tong.visitkorea.or.kr/cms/resource/04/3081704_image2_1.jpg';
const HP_SAMHO_2 = 'https://tong.visitkorea.or.kr/cms/resource/00/3081700_image2_1.jpg';
const HP_SAMHO_3 = 'https://tong.visitkorea.or.kr/cms/resource/01/3081701_image2_1.jpg';
const HP_CHEONG = 'https://tong.visitkorea.or.kr/cms/resource/21/3061121_image2_1.jpg';
const HP_CHEONG_2 = 'https://tong.visitkorea.or.kr/cms/resource/13/3061113_image2_1.jpg';
const HN_LIGHT = 'https://tong.visitkorea.or.kr/cms/resource/84/3563584_image2_1.jpg';
const HN_LIGHT_2 = 'https://tong.visitkorea.or.kr/cms/resource/81/3563581_image2_1.jpg';
const HN_LIGHT_3 = 'https://tong.visitkorea.or.kr/cms/resource/83/3563583_image2_1.jpg';
const HN_NOK = 'https://tong.visitkorea.or.kr/cms/resource/20/689220_image2_1.jpg';
const HN_NOK_2 = 'https://tong.visitkorea.or.kr/cms/resource/09/689209_image2_1.jpg';
const HN_NOK_3 = 'https://tong.visitkorea.or.kr/cms/resource/91/219391_image2_1.jpg';
const HN_DOSOL = 'https://tong.visitkorea.or.kr/cms/resource/06/3591506_image2_1.jpg';
const HN_DOSOL_2 = 'https://tong.visitkorea.or.kr/cms/resource/07/3591507_image2_1.jpg';
const HN_MIHWANG = 'https://tong.visitkorea.or.kr/cms/resource/61/3563061_image2_1.jpg';
const HN_ULDOL = 'https://tong.visitkorea.or.kr/cms/resource/09/3007809_image2_1.jpg';
const HN_ULDOL_2 = 'https://tong.visitkorea.or.kr/cms/resource/00/3007800_image2_1.jpg';
const HN_ULDOL_3 = 'https://tong.visitkorea.or.kr/cms2/website/82/1832682.jpg';
const YD_GYEONGJEONG = 'https://tong.visitkorea.or.kr/cms/resource/85/3400985_image2_1.jpg';
const YD_GYEONGJEONG_2 =
  'https://tong.visitkorea.or.kr/cms/resource/55/2917755_image2_1.jpg';
const HS_MANHAE =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200459391045.JPG';
const HS_MANHAE_2 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200459392536.JPG';
const HS_MANHAE_3 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200459396739.JPG';
const HS_MANHAE_KHS =
  'https://www.khs.go.kr/unisearch/images/tangible_cult_prop/1639122.jpg';
const HS_SEONG =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011270145581511.jpg';
const HS_SEONG_2 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011270145582902.jpg';
const HS_SEONG_3 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011270145584203.jpg';
const HS_LEE =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200428043631.JPG';
const HS_LEE_2 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200428044972.JPG';
const HS_LEE_3 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200428046323.JPG';
const HS_GARDEN =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200511080921.JPG';
const HS_GARDEN_2 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200511082322.JPG';
const HS_GARDEN_3 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200511083833.JPG';
const HS_YONG =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011130259425353.JPG';
const HS_YONG_2 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011130259427504.JPG';
const HS_YONG_3 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011130259429665.JPG';
const HS_OSEO =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011270102041141.jpg';
const HS_OSEO_2 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011270102042372.jpg';
const HS_OSEO_3 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011270102043973.jpg';
const HS_JUK =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011271144168288.jpg';
const HS_JUK_2 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011271144169689.jpg';
const HS_JUK_3 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_2020112711441709210.jpg';
const HS_UISA =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200614597037.JPG';
const HS_UISA_2 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_202011200616128968.JPG';
const HS_UISA_3 =
  'https://www.hongseong.go.kr/thumbnail/tursmCn/TUCN_2020112701475843510.jpg';
const HW_SKY = 'https://www.hwasun.go.kr/culture/img/sub_010103_sdimg01.jpg';
const HW_SKY_2 = 'https://www.hwasun.go.kr/culture/img/sub_010103_sdimg02.jpg';
const HW_SKY_3 = 'https://www.hwasun.go.kr/culture/img/sub_010103_sdimg03.jpg';
const HW_DOLMEN = 'https://www.hwasun.go.kr/culture/img/sub_010104_sdimg01.jpg';
const HW_DOLMEN_2 = 'https://www.hwasun.go.kr/culture/img/sub_010104_sdimg02.jpg';
const HW_DOLMEN_3 = 'https://www.hwasun.go.kr/culture/img/sub_010104_sdimg03.jpg';
const HW_AZALEA = 'https://www.hwasun.go.kr/culture/img/sub_010105_sdimg01.jpg';
const HW_AZALEA_2 = 'https://www.hwasun.go.kr/culture/img/sub_010105_sdimg02.jpg';
const HW_AZALEA_3 = 'https://www.hwasun.go.kr/culture/img/sub_010105_sdimg03.jpg';
const HW_FOUNTAIN = 'https://www.hwasun.go.kr/culture/img/sub_010111_sdimg01.png';
const HW_FOUNTAIN_2 = 'https://www.hwasun.go.kr/culture/img/sub_010111_sdimg02.png';
const HW_FOUNTAIN_3 = 'https://www.hwasun.go.kr/culture/img/sub_010111_sdimg03.png';
const HW_FOREST = 'https://www.hwasun.go.kr/culture/img/sub_010107_sdimg01.jpg';
const HW_FOREST_2 = 'https://www.hwasun.go.kr/culture/img/sub_010107_sdimg02.jpg';
const HW_FOREST_3 = 'https://www.hwasun.go.kr/culture/img/sub_010107_sdimg03.jpg';
const GJ_HAKDONG = 'https://tong.visitkorea.or.kr/cms2/website/55/1047555.jpg';
const GJ_HAKDONG_2 = 'https://tong.visitkorea.or.kr/cms2/website/62/1047562.jpg';
const GJ_HAKDONG_3 = 'https://tong.visitkorea.or.kr/cms2/website/64/1047564.jpg';
const GJ_POW = 'https://tong.visitkorea.or.kr/cms2/website/85/2440885.jpg';
const GJ_POW_2 = 'https://tong.visitkorea.or.kr/cms2/website/86/2440886.jpg';
const GJ_POW_3 = 'https://tong.visitkorea.or.kr/cms2/website/87/2440887.jpg';
const GJ_GONGGOJI = 'https://tong.visitkorea.or.kr/cms/resource/61/3495061_image2_1.jpg';
const GJ_GONGGOJI_2 = 'https://tong.visitkorea.or.kr/cms/resource/62/3495062_image2_1.jpg';
const GJ_GONGGOJI_3 = 'https://tong.visitkorea.or.kr/cms2/website/26/2761526.jpg';
const GJ_NAEDO = 'https://tong.visitkorea.or.kr/cms/resource/42/3576042_image2_1.jpg';
const GJ_NAEDO_2 = 'https://tong.visitkorea.or.kr/cms/resource/40/3576040_image2_1.jpg';
const GJ_GARDEN = 'https://tong.visitkorea.or.kr/cms/resource/17/3521017_image2_1.jpg';
const GJ_GARDEN_2 = 'https://tong.visitkorea.or.kr/cms2/website/71/3590471.jpg';
const GJ_GARDEN_3 = 'https://tong.visitkorea.or.kr/cms2/website/82/3590482.jpg';
const GJ_MAEMI = 'https://tong.visitkorea.or.kr/cms2/website/92/3092092.jpg';
const GJ_MAEMI_2 = 'https://tong.visitkorea.or.kr/cms2/website/94/3092094.jpg';
const GJ_MAEMI_3 = 'https://tong.visitkorea.or.kr/cms2/website/95/3092095.jpg';
const GJ_GUJORA = 'https://tong.visitkorea.or.kr/cms/resource/10/3519210_image2_1.jpg';
const GJ_GUJORA_2 = 'https://tong.visitkorea.or.kr/cms2/website/47/1047447.jpg';
const GJ_GUJORA_3 = 'https://tong.visitkorea.or.kr/cms2/website/54/1047454.jpg';
const GJ_TERMINAL = 'https://tong.visitkorea.or.kr/cms2/website/82/1250082.jpg';
const GJ_TERMINAL_2 = 'https://tong.visitkorea.or.kr/cms2/website/92/1250092.jpg';
const GJ_TERMINAL_3 = 'https://tong.visitkorea.or.kr/cms2/website/95/1250095.jpg';
const DH_HOHAE = 'https://www.dh.go.kr/DATA/tour/12/20230103025348668_lC3E.jpg';
const DH_HOHAE_2 = 'https://www.dh.go.kr/DATA/tour/12/20230103025348704_Uzoq.jpg';
const DH_HOHAE_3 = 'https://www.dh.go.kr/DATA/tour/12/20230103025348728_hS4t.jpg';
const DH_HALMI = 'https://www.dh.go.kr/DATA/tour/5/20230103024451037_RxXo.jpg';
const DH_HALMI_2 = 'https://www.dh.go.kr/site/tour/images/contents/cts1564_img07.png';
const DH_HALMI_3 = 'https://www.dh.go.kr/DATA/tour/5/20230103024451061_KTwk.jpg';
const DH_CHOROK = 'https://www.dh.go.kr/DATA/tour/5/20230103023227431_f3xe.jpg';
const DH_CHOROK_2 = 'https://www.dh.go.kr/DATA/tour/5/20230103023227447_yFNP.jpg';
const DH_CHOROK_3 = 'https://www.dh.go.kr/site/tour/images/contents/cts1564_img08.png';
const DH_YONGCHU = 'https://www.dh.go.kr/DATA/tour/5/20230103124007904_kzKl.jpg';
const DH_YONGCHU_2 = 'https://www.dh.go.kr/DATA/tour/5/20230103124007912_8ic8.jpg';
const DH_YONGCHU_3 = 'https://www.dh.go.kr/DATA/tour/5/20230103124007915_XCDN.jpg';
const DH_BANSEOK = 'https://www.dh.go.kr/DATA/tour/5/20230103123643831_NxfT.jpg';
const DH_BANSEOK_2 = 'https://www.dh.go.kr/DATA/tour/5/20230103123643840_b4fX.jpg';
const DH_BANSEOK_3 = 'https://www.dh.go.kr/DATA/tour/5/20230103123643846_2ldi.jpg';
const DH_MANGSANG = 'https://www.dh.go.kr/DATA/tour/4/20250120043232553_U7Rc.jpg';
const DH_MANGSANG_2 = 'https://www.dh.go.kr/DATA/tour/4/20250120043232576_hTQo.jpg';
const DH_EODAL = 'https://www.dh.go.kr/DATA/tour/4/20230103020936597_ZL0E.jpg';
const DH_EODAL_2 = 'https://www.dh.go.kr/DATA/tour/4/20230103020936600_ihHv.jpg';
const DH_EODAL_3 = 'https://www.dh.go.kr/DATA/tour/4/20230103020936571_nh03.jpg';
const YG_BAEKSU = 'https://tong.visitkorea.or.kr/cms2/website/00/1672400.jpg';
const YG_SALT = 'https://tong.visitkorea.or.kr/cms2/website/85/3401885.jpg';
const YG_SALT_2 = 'https://tong.visitkorea.or.kr/cms2/website/00/3401900.jpg';
const YG_SUPJAENG = 'https://tong.visitkorea.or.kr/cms/resource/38/3057538_image2_1.jpg';
const YG_SUPJAENG_2 = 'https://www.khs.go.kr/unisearch/images/scenic_site/1629029.jpg';
const YG_SUPJAENG_3 = 'https://www.khs.go.kr/unisearch/images/scenic_site/1629030.jpg';
const YG_MULMU = 'https://tong.visitkorea.or.kr/cms/resource/88/2676388_image2_1.JPG';
const YG_MULMU_2 = 'https://tong.visitkorea.or.kr/cms/resource/89/2676389_image2_1.JPG';
const YG_MULMU_3 = 'https://tong.visitkorea.or.kr/cms/resource/86/2825886_image2_1.jpg';
const YG_BULGAP = 'https://tong.visitkorea.or.kr/cms/resource/92/2831192_image2_1.jpg';
const YG_BULGAP_2 = 'https://tong.visitkorea.or.kr/cms/resource/50/2996250_image2_1.jpg';
const YG_BULGAP_3 = 'https://tong.visitkorea.or.kr/cms/resource/53/2996253_image2_1.JPG';
const GH_SSUK = 'https://tong.visitkorea.or.kr/cms/resource/79/3502479_image2_1.jpg';
const GH_SSUK_2 =
  'https://tour.goheung.go.kr/ajax/image.do?file=/upload/302//20241125104902_322452096.jpg&size=1180x1180';
const GH_SSUK_3 =
  'https://tour.goheung.go.kr/ajax/image.do?file=/upload/302//20241125104902_1242149056.jpg&size=1180x1180';
const GH_GEUM =
  'https://tour.goheung.go.kr/ajax/image.do?file=/upload/271//20241018144623_1155388928.jpg&size=1180x1180';
const GH_GEUM_2 =
  'https://tour.goheung.go.kr/ajax/image.do?file=/upload/271//20241018144623_117692224.jpg&size=1180x1180';
const GH_GEUM_3 =
  'https://tour.goheung.go.kr/ajax/image.do?file=/upload/271//20241018144623_1506270848.jpg&size=1180x1180';
const GH_SUNSET =
  'https://tour.goheung.go.kr/ajax/image.do?file=/upload/307//20241219151255_1602298624.jpg&size=1180x1180';
const GH_SUNSET_2 =
  'https://tour.goheung.go.kr/ajax/image.do?file=/upload/307//20241219151255_160332832.jpg&size=1180x1180';
const GH_SUNSET_3 =
  'https://tour.goheung.go.kr/ajax/image.do?file=/upload/308//20241219152116_1305081728.jpg&size=1180x1180';
const GH_FOREST = 'https://tong.visitkorea.or.kr/cms/resource/77/2380877_image2_1.JPG';
const GH_FOREST_2 = 'https://tong.visitkorea.or.kr/cms/resource/81/2380881_image2_1.JPG';
const GH_FOREST_3 = 'https://tong.visitkorea.or.kr/cms/resource/78/2380878_image2_1.jpg';
const GH_YONG = 'https://tong.visitkorea.or.kr/cms/resource/63/2788863_image2_1.jpg';
const GH_YONG_2 = 'https://tong.visitkorea.or.kr/cms/resource/65/2788865_image2_1.jpg';
const GH_YONG_3 = 'https://tong.visitkorea.or.kr/cms/resource/62/2788862_image2_1.jpg';
const GIM_HWAPO = 'https://tong.visitkorea.or.kr/cms2/website/07/2563907.jpg';
const GIM_HWAPO_2 = 'https://tong.visitkorea.or.kr/cms/resource/78/3578778_image2_1.jpeg';
const GIM_HWAPO_3 = 'https://tong.visitkorea.or.kr/cms/resource/79/3578779_image2_1.jpg';
const GIM_GAYA = 'https://tong.visitkorea.or.kr/cms2/website/65/3392365.jpg';
const GIM_GAYA_2 = 'https://tong.visitkorea.or.kr/cms2/website/66/3392366.jpg';
const GIM_GAYA_3 = 'https://tong.visitkorea.or.kr/cms2/website/36/2649536.jpg';
const GIM_ASTRO = 'https://tong.visitkorea.or.kr/cms2/website/20/3362120.jpg';
const GIM_ASTRO_2 = 'https://tong.visitkorea.or.kr/cms2/website/24/3362124.jpg';
const GIM_ASTRO_3 = 'https://tong.visitkorea.or.kr/cms2/website/69/3457369.jpg';
const DG_GUKCHAE = 'https://tong.visitkorea.or.kr/cms/resource/86/3515186_image2_1.jpg';
const DG_GUKCHAE_2 = 'https://tong.visitkorea.or.kr/cms/resource/83/3515183_image2_1.jpg';
const DG_GUKCHAE_3 = 'https://tong.visitkorea.or.kr/cms/resource/87/3515187_image2_1.jpg';
const DG_DALSEONG = 'https://tong.visitkorea.or.kr/cms2/website/26/1018426.jpg';
const DG_DALSEONG_2 = 'https://tong.visitkorea.or.kr/cms/resource/58/3565158_image2_1.jpg';
const DG_DALSEONG_3 = 'https://tong.visitkorea.or.kr/cms/resource/60/3565160_image2_1.jpg';
const DG_GAMYEONG = 'https://tong.visitkorea.or.kr/cms/resource/44/3310544_image2_1.jpg';
const DG_GAMYEONG_2 = 'https://tong.visitkorea.or.kr/cms/resource/41/3310541_image2_1.jpg';
const DG_GAMYEONG_3 = 'https://tong.visitkorea.or.kr/cms/resource/42/3310542_image2_1.jpg';
const YS_TOUR = 'https://www.yeosu.go.kr/tour';
const YS_EXPO =
  `${YS_TOUR}/build/images/1743/17439999/17439999170773_2.jpg/740x1x70/740x1_17439999170773_2.jpg`;
const YS_EXPO_2 = `${YS_TOUR}/contents/60/expo_2.jpg`;
const YS_EXPO_3 =
  `${YS_TOUR}/build/images/1743/17439999/17439999073042.jpg/740x1x70/740x1_17439999073042.jpg`;
const YS_NIGHT =
  `${YS_TOUR}/build/images/1743/17439998/17439998378816.jpg/740x1x70/740x1_17439998378816.jpg`;
const YS_NIGHT_2 = `${YS_TOUR}/contents/41/sea_2.jpg`;
const YS_NIGHT_3 = `${YS_TOUR}/contents/41/sea_1.jpg`;
const YS_CABLE =
  `${YS_TOUR}/build/images/1682/16826402/1682640297.jpg/740x1x70/740x1_1682640297.jpg`;
const YS_CABLE_2 = `${YS_TOUR}/contents/50/cable_3.jpg`;
const YS_CABLE_3 = `${YS_TOUR}/contents/50/cable_1.jpg`;
const YS_JINNAM = `${YS_TOUR}/contents/31/jinnam_2.jpg`;
const YS_JINNAM_2 = `${YS_TOUR}/contents/31/jinnam_1.jpg`;
const YS_JINNAM_3 = `${YS_TOUR}/contents/31/jinnam_5.jpg`;
const YS_BRIDGE = `${YS_TOUR}/contents/112/yisunsin2.jpg`;
const YS_BRIDGE_2 = `${YS_TOUR}/contents/112/yisunsin1.jpg`;
const YS_BRIDGE_3 = `${YS_TOUR}/contents/112/yisunsin3.jpg`;
const YC_TOUR = 'https://www.ycg.kr/images/open.content/tour/travel/yecheon';
const YC_GEUM = `${YC_TOUR}/geumdangsil/img.png`;
const YC_GEUM_2 =
  'https://www.khs.go.kr/unisearch/images/natural_monument/2021041210543503.jpg';
const YC_GEUM_3 =
  'https://www.khs.go.kr/unisearch/images/natural_monument/2021041210543500.jpg';
const YC_INSECT = `${YC_TOUR}/insect/img.png`;
const YC_INSECT_2 = 'https://www.ycg.kr/images/open.content/insect/main/insect-visual.jpg';
const YC_INSECT_3 = 'https://www.ycg.kr/images/open.content/insect/main/insect-visual01.jpg';
const YC_SEOK = `${YC_TOUR}/seogsonglyeong/img.png`;
const YC_SEOK_2 =
  'https://www.khs.go.kr/unisearch/images/natural_monument/2021041210341002.jpg';
const YC_SEOK_3 =
  'https://www.khs.go.kr/unisearch/images/natural_monument/2021041210341001.jpg';
// 예천 검색 신라식물원 — Tour firstimage·detailImage·searchPhoto 없음. 공식 홈페이지는 HTTP·자가서명 TLS라 Wayback HTTPS.
const YC_SILLA =
  'https://web.archive.org/web/20250714195611im_/http://sinrafarm.com/img/main_scroll_img3.jpg';
const YC_SILLA_2 =
  'https://web.archive.org/web/20250713195244im_/http://sinrafarm.com/img/main_scroll_img2.jpg';
const YC_SILLA_3 =
  'https://web.archive.org/web/20250714014653im_/http://sinrafarm.com/img/main_scroll_img1.jpg';
// 예천 GATEO 선정 용궁시장 — fill이 회룡포(126734) 항공을 빌려 씀. 군 공식 시장·순대축제 사진.
const YC_MARKET =
  'https://www.ycg.kr/images/open.content/tour/theme/tv.trip/1n2d.trip08.png';
const YC_MARKET_2 =
  'https://www.ycg.kr/images/open.content/tour/festivals/sundae/sundae-img.png';
const YC_MARKET_3 =
  'https://www.ycg.kr/images/open.content/tour/festivals/sundae/photo4.png';
const YC_MARKET_4 =
  'https://www.ycg.kr/images/open.content/tour/festivals/sundae/photo2.png';
const IC_KWATER = 'https://www.kwater.or.kr';
const IC_ARAON = `${IC_KWATER}/giwaterway/images/giwaterway/main/travel_infor_photo2.jpg`;
const IC_ARAON_2 = `${IC_KWATER}/giwaterway/images/giwaterway/main/travel_infor_photo3.jpg`;
const IC_ARAON_3 = `${IC_KWATER}/giwaterway/images/giwaterway/main/travel_infor_photo1.jpg`;
const IC_SEASIDE = 'https://tong.visitkorea.or.kr/cms/resource/02/2609702_image2_1.JPG';
const IC_SEASIDE_2 = 'https://www.insiseol.or.kr/park/seaside/img/contents/railbike01.jpg';
const IC_SEASIDE_3 = 'https://www.insiseol.or.kr/park/seaside/img/contents/railbike02.jpg';
const IC_GANGHWA_TOUR = 'https://www.ganghwa.go.kr/open_content/tour/images/contents';
const IC_GANGHWA = `${IC_GANGHWA_TOUR}/photo/storywalk1.jpg`;
const IC_GANGHWA_2 = `${IC_GANGHWA_TOUR}/photo/storywalk2.jpg`;
const IC_GANGHWA_3 = `${IC_GANGHWA_TOUR}/historytour0804.jpg`;
const YG_ECO = 'https://www.yg-eco.kr/images/sub';
const YG_ARB = `${YG_ECO}/img_introduce_01.png`;
const YG_ARB_2 = `${YG_ECO}/img_introduce_02.png`;
const YG_DMZ = 'https://www.ygdmz.co.kr/common/img';
const YG_ARB_3 = `${YG_DMZ}/1-3.jpg`;
const YG_BONG = `${YG_DMZ}/7-2.jpg`;
const YG_BONG_2 = `${YG_DMZ}/7-3.jpg`;
const YG_BONG_3 = `${YG_DMZ}/7-4.jpg`;
const YG_BRIDGE = `${YG_DMZ}/8-4.png`;
const YG_BRIDGE_2 = `${YG_DMZ}/8-2.jpg`;
const YG_BRIDGE_3 = `${YG_DMZ}/8-5.jpg`;
const JE_9GYEONG = 'https://www.jeongeup.go.kr/upload_data/board_data/BBS_0000011';
const JE_DH = `${JE_9GYEONG}/175305752440905.png`;
const JE_DH_2 = 'https://www.1894.or.kr/main/img/sub/77/77_1_1.jpg';
const JE_DH_3 = 'https://www.1894.or.kr/main/img/sub/77/77_1_2.jpg';
const JE_YS = `${JE_9GYEONG}/175305752442925.png`;
const JE_YS_2 = `${JE_9GYEONG}/173630232064639.jpg`;
const JE_WY = `${JE_9GYEONG}/175021230997132.png`;
const JE_ECO = 'https://www.ecotour.kr/upload_data/board_data/BBS_0000005';
const JE_WY_2 = `${JE_ECO}/175012107890103.jpg`;
const JE_WY_3 = `${JE_ECO}/175014798426947.jpg`;
const JS_HWAAM = 'https://www.jeongseon.go.kr/page/language/images/sub';
const JS_GEBUK = `${JS_HWAAM}/img-geobukbawi.jpg`;
const JS_YONGMA = `${JS_HWAAM}/img-yongmaso.jpg`;
const JS_HWAPYO = `${JS_HWAAM}/img-hwapyoju.jpg`;
const TB_KHS = 'https://www.khs.go.kr/unisearch/images/natural_monument';
const TB_FOSSIL = `${TB_KHS}/1630197.jpg`;
const TB_PALEO = 'https://www.paleozoicgp.com/images';
const TB_FOSSIL_2 = `${TB_PALEO}/geoplace--05-01.jpg`;
const TB_TOUR = 'https://tour.taebaek.go.kr/upload/smartdb';
const TB_FOSSIL_3 = `${TB_TOUR}/common/main/common_main_20210104_1.jpg`;
const TB_CAVE = `${TB_PALEO}/geoplace--10-03.jpg`;
const TB_CAVE_2 = `${TB_PALEO}/geoplace--10-01.jpg`;
const TB_CAVE_3 = `${TB_PALEO}/geoplace--10-02.jpg`;
const TB_CAVE_4 = `${TB_TOUR}/2016/01/11/AN0012_I_05.JPG`;
const TB_FMC = 'https://www.tfmc.or.kr/resource/taebaek/images/contents';
const TB_JEOL = `${TB_FMC}/sub_3_9_img4.jpg`;
const TB_JEOL_2 = `${TB_FMC}/sub_3_9_img2.jpg`;
const TB_JEOL_3 = `${TB_FMC}/sub_3_9_img8.jpg`;
const UJ_TOUR = 'https://www.ui4u.go.kr/tour/img/content/sub02';
const UJ_DOJEONG = `${UJ_TOUR}/img_view03.png`;
const UJ_DOJEONG_2 = `${UJ_TOUR}/img_view03_01.png`;
const UJ_LRT = `${UJ_TOUR}/img_view05_01.png`;
const UJ_LRT_2 = `${UJ_TOUR}/img_view05_02.png`;
const UJ_LRT_3 = `${UJ_TOUR}/img_view05_03.png`;
const UJ_LRT_4 = `${UJ_TOUR}/img_view05_04.png`;
const UJ_MARKET = `${UJ_TOUR}/img_view07.png`;
const UJ_MARKET_2 = `${UJ_TOUR}/img_view07_01.png`;
const UJ_MARKET_VK = 'https://tong.visitkorea.or.kr/cms2/website/34/3051534.JPG';
const UJ_MARKET_VK_2 = 'https://tong.visitkorea.or.kr/cms2/website/38/3051538.JPG';
const UJ_MARKET_VK_3 = 'https://tong.visitkorea.or.kr/cms2/website/40/3051540.JPG';
const UJ_MARKET_VK_4 = 'https://tong.visitkorea.or.kr/cms2/website/68/3051568.JPG';
const TY_VK = 'https://tong.visitkorea.or.kr/cms/resource';
const TY_NAM = `${TY_VK}/27/3349727_image2_1.jpg`;
const TY_NAM_2 = `${TY_VK}/28/3349728_image2_1.jpg`;
const TY_NAM_3 = `${TY_VK}/29/3349729_image2_1.jpg`;
const TY_JE = `${TY_VK}/14/3558314_image2_1.jpg`;
const TY_JE_2 = `${TY_VK}/15/3558315_image2_1.jpg`;
const TY_JE_SURU = `${TY_VK}/13/3558313_image2_1.jpg`;
const TY_KHS = 'https://www.khs.go.kr/unisearch/images/history_site';
const TY_JE_AIR = `${TY_KHS}/1628218.jpg`;
const TY_CANAL = `${TY_VK}/88/3534988_image2_1.jpg`;
const TY_CANAL_2 = `${TY_VK}/89/3534989_image2_1.jpg`;
const TY_CANAL_3 = `${TY_VK}/90/3534990_image2_1.jpg`;
const TY_UTOUR = 'https://www.utour.go.kr/CmsMultiFile/view.do?multifileId=MF90100028';
const TY_YONG = `${TY_UTOUR}&idx=16550`;
const TY_YONG_2 = `${TY_UTOUR}&idx=16548`;
const TY_YONG_3 = `${TY_UTOUR}&idx=16549`;
const TY_YONG_4 = `${TY_UTOUR}&idx=2803861`;
// Tour 127103 homepage는 badaland.com(구 통영 관광 호스트). utour.go.kr과 같은 IP인데 인증서가 *.utour.go.kr이라 HTTPS가 ERR_CERT_COMMON_NAME_INVALID.
const TY_YONG_HOME =
  'https://www.utour.go.kr/00001/00007/00011.web?amode=view&idx=1660';
const TY_YI_PHOTO = 'https://tong.visitkorea.or.kr/cms/resource_photo';
const TY_YI = `${TY_YI_PHOTO}/92/3479192_image2_1.jpg`;
const TY_YI_2 = `${TY_YI_PHOTO}/93/3479193_image2_1.jpg`;
const TY_YI_3 = `${TY_YI_PHOTO}/94/3479194_image2_1.jpg`;
const TY_YI_4 = `${TY_YI_PHOTO}/99/3479199_image2_1.jpg`;
const GJ_GI_TOUR = 'https://www.gjcity.go.kr/tour/img/sub01';
const GJ_GI_BUNWON = `${GJ_GI_TOUR}/img_pardang2.png`;
const GJ_GI_BUNWON_2 = `${GJ_GI_TOUR}/img_pardang1.png`;
const GJ_GI_BUNWON_3 = `${GJ_GI_TOUR}/img_pardang3.png`;
const GJ_GI_BUNWON_HOME = 'https://www.gjcity.go.kr/tour/contents.do?mId=0101020000';
const GJ_GI_AENGJA = `${GJ_GI_TOUR}/img_aengjabong1.png`;
const GJ_GI_AENGJA_2 = `${GJ_GI_TOUR}/img_aengjabong2.png`;
const GJ_GI_AENGJA_3 = `${GJ_GI_TOUR}/img_aengjabong3.png`;
const GJ_GI_AENGJA_HOME = 'https://www.gjcity.go.kr/tour/contents.do?mId=0101040000';
const GJ_GI_MUGAP = `${GJ_GI_TOUR}/img_mugabsan3.png`;
const GJ_GI_MUGAP_2 = `${GJ_GI_TOUR}/img_mugabsan2.png`;
const GJ_GI_MUGAP_3 = `${GJ_GI_TOUR}/img_mugabsan1.png`;
const GJ_GI_MUGAP_HOME = 'https://www.gjcity.go.kr/tour/contents.do?mId=0101050000';
const GJ_GI_TAEHWA = `${GJ_GI_TOUR}/img_taehwasan1.png`;
const GJ_GI_TAEHWA_2 = `${GJ_GI_TOUR}/img_taehwasan2.png`;
const GJ_GI_TAEHWA_3 = `${GJ_GI_TOUR}/img_taehwasan3.png`;
const GJ_GI_TAEHWA_HOME = 'https://www.gjcity.go.kr/tour/contents.do?mId=0101060000';
const GJ_GI_DOJA = `${GJ_GI_TOUR}/img_ggdoja1.png`;
const GJ_GI_DOJA_2 = `${GJ_GI_TOUR}/img_ggdoja2.png`;
const GJ_GI_DOJA_3 = `${GJ_GI_TOUR}/img_ggdoja3.png`;
const GJ_GI_DOJA_HOME = 'https://www.gjcity.go.kr/tour/contents.do?mId=0101070000';
const MP_TOUR = 'https://www.mokpo.go.kr/contents';
const MP_JIN = `${MP_TOUR}/17315/mokpojin_intro.jpg`;
const MP_JIN_2 = `${MP_TOUR}/17315/mokpojin_info2.jpg`;
const MP_JIN_3 = `${MP_TOUR}/17315/mokpojin_legend1.jpg`;
const MP_JIN_HOME = 'https://www.mokpo.go.kr/tour/attraction/nineplace/mokpojin';
const MP_DADO = `${MP_TOUR}/17316/archipelago1.jpg`;
const MP_DADO_2 = `${MP_TOUR}/17316/archipelago2.jpg`;
const MP_DADO_3 = `${MP_TOUR}/17316/archipelago.jpg`;
const MP_DADO_HOME = 'https://www.mokpo.go.kr/tour/attraction/nineplace/archipelago';
const MA_TOUR = 'https://tour.muan.go.kr/contents';
const MA_SIK = `${MA_TOUR}/18/spring_5_2_200401.jpg`;
const MA_SIK_2 = `${MA_TOUR}/18/spring_5_200401.jpg`;
const MA_SIK_HOME =
  'https://tour.muan.go.kr/tour/culture/cultural/treasure?mode=view&idx=247';
const MA_TOP = `${MA_TOUR}/11/tommeori_2.jpg`;
const MA_TOP_2 = `${MA_TOUR}/11/tommeori_3.jpg`;
const MA_HOL = `${MA_TOUR}/66/summer_4_200401.jpg`;
const MA_BEACH_HOME = 'https://www.muan.go.kr/tour/travel/tommeori_beach';
const MA_SEUNG = `${MA_TOUR}/1/seungdalsan_8.jpg`;
const MA_SEUNG_2 = `${MA_TOUR}/1/seungdalsan_4.jpg`;
const MA_SEUNG_3 = `${MA_TOUR}/1/seungdalsan_10.jpg`;
const MA_SEUNG_HOME = 'https://tour.muan.go.kr/tour/travel/seungdalsan';
const MA_CHO = `${MA_TOUR}/9/01.jpg`;
const MA_CHO_2 = `${MA_TOUR}/9/02.jpg`;
const MA_CHO_3 = `${MA_TOUR}/9/historic_img01.jpg`;
const MA_CHO_HOME = 'https://tour.muan.go.kr/tour/travel/historic_site';
const BS_TOUR = 'https://www.boseong.go.kr/contents';
const BS_ILRIM = `${BS_TOUR}/21495/ilrim10.jpg`;
const BS_ILRIM_2 = `${BS_TOUR}/21495/ilrim12.jpg`;
const BS_ILRIM_3 = `${BS_TOUR}/21495/ilrim6.jpg`;
const BS_ILRIM_HOME = 'https://www.boseong.go.kr/tour/tourist/9tour/ilrim_yongchoo';
const BS_SEO = `${BS_TOUR}/21492/seojp2.jpg`;
const BS_SEO_2 = `${BS_TOUR}/21492/juam2.jpg`;
const BS_SEO_3 = `${BS_TOUR}/21492/seojp11.jpg`;
const BS_SEO_HOME = 'https://www.boseong.go.kr/tour/tourist/9tour/juam_seojp';
const SC_HWANG =
  'https://tong.visitkorea.or.kr/cms/resource/00/2658500_image2_1.jpg';
const SC_HWANG_2 =
  'https://tong.visitkorea.or.kr/cms/resource/50/2653250_image2_1.jpg';
const SC_HWANG_3 =
  'https://tong.visitkorea.or.kr/cms/resource/99/2658499_image2_1.jpg';
const SC_HWANG_4 =
  'https://tong.visitkorea.or.kr/cms/resource/51/2653251_image2_1.jpg';
const SC_HWANG_HOME = 'https://sancheong.go.kr/tour/contents.do?key=1941';
const SC_NAM = 'https://www.khs.go.kr/unisearch/images/history_site/1628317.jpg';
const SC_NAM_2 =
  'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=6e9586a4-e8a9-4c5e-bb33-bdbd20dbe3af';
const SC_NAM_3 =
  'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=0b1e0a04-4d9c-4f1e-b6a0-6bc591469e7b';
const SC_NAM_HOME = 'https://sancheong.go.kr/tour/contents.do?key=1945';
const SCH_BASE = 'https://www.seocheon.go.kr';
const SCH_JANG = `${SCH_BASE}/cmm/fms/getImage.do?kind=920&atchFileId=FILE_00000004924Gw2i&fileSn=0`;
const SCH_JANG_2 = `${SCH_BASE}/cmm/fms/getImage.do?kind=920&atchFileId=FILE_00000004924Gw2i&fileSn=1`;
const SCH_JANG_3 = `${SCH_BASE}/cmm/fms/getImage.do?kind=920&atchFileId=FILE_00000004924Gw2i&fileSn=2`;
const SCH_JANG_HOME = `${SCH_BASE}/prog/trspt/tour/sub01_01_08/view.do?trsptSn=8`;
const SCH_YUBU = `${SCH_BASE}/cmm/fms/getImage.do?kind=920&atchFileId=FILE_00000004926Ey2h&fileSn=0`;
const SCH_YUBU_2 = `${SCH_BASE}/cmm/fms/getImage.do?kind=920&atchFileId=FILE_00000004926Ey2h&fileSn=1`;
const SCH_YUBU_3 = `${SCH_BASE}/cmm/fms/getImage.do?kind=920&atchFileId=FILE_00000004926Ey2h&fileSn=2`;
const SCH_YUBU_HOME = `${SCH_BASE}/prog/trspt/tour/sub01_01_09/view.do?trsptSn=9`;

const INJE_SCENICS_HOME = 'https://injetour.co.kr/scenics/index';
const INJE_DCB =
  'https://injetour.co.kr/files/e794313a-a5bb-43f6-a90b-1b076d1fa45d.png';
const INJE_NAERIN_VALLEY =
  'https://injetour.co.kr/files/4f364a58-77fe-403d-8449-0dac77685ec1.jpg';
const INJE_BANGDONG_SPRING =
  'https://injetour.co.kr/files/e2d2d664-1f01-4066-a696-265eaed92197.jpg';
const INJE_DAESEUNG_FALLS =
  'https://injetour.co.kr/files/879b0b5b-14a9-44a6-b270-b16bee41eb90.jpg';
const INJE_HAPGANG_PAVILION =
  'https://injetour.co.kr/files/3c665dac-463b-43aa-a0c2-8f7ebb539e01.jpg';

const HC_TOUR = 'https://www.hongcheon.go.kr';
const HC_MIYAK = `${HC_TOUR}/DATA/tour/2016/thumb/p_20210208082101687jnf379.jpg`;
const HC_MIYAK_HOME =
  `${HC_TOUR}/tour/selectTourCntntsWebView.do?ctgry=6&key=2035&tourNo=2016`;
const HC_GARYEONG = `${HC_TOUR}/DATA/tour/2018/thumb/p_202102180508378213s06jQ.jpg`;
const HC_GARYEONG_2 = `${HC_TOUR}/DATA/tour/2018/thumb/p_20210218051022475PfUGRo.jpg`;
const HC_GARYEONG_3 = `${HC_TOUR}/DATA/tour/2018/thumb/p_20210218051022496eh1vfS.jpg`;
const HC_GARYEONG_HOME =
  `${HC_TOUR}/tour/selectTourCntntsWebView.do?ctgry=6&key=2035&tourNo=2018`;

function localScenicPhotoOverlay(overview, addr1, imageUrl, extraGallery = [], homepage = null) {
  const galleryUrls = [imageUrl, ...extraGallery.filter((u) => u && u !== imageUrl)];
  return {
    overview,
    addr1,
    imageUrl,
    firstImage: imageUrl,
    galleryUrls,
    ...(homepage ? { homepage } : {}),
  };
}

/**
 * 지자체 팔경 멤버별 런타임 오버레이 — JSON contentId 직접 기입·scenic 승격 없이
 * TourAPI 미등재 또는 사진 누락 멤버의 썸네일·개요·갤러리 보강.
 */
const LOCAL_SCENIC_MEMBER_OVERLAYS = {
  'local-scenic:hongcheon-palgyeong:금학산': {
    overview:
      '해발 655m(652m)의 산으로, 홍천강이 산자락을 휘감아 돌며 빚어내는 수태극(태극문양)의 절경을 정상 전망대에서 한눈에 굽어볼 수 있는 홍천의 대표 명산입니다. 굽이치는 물길이 빚어낸 남노일강변의 수려한 풍광과 탁 트인 조망으로 널리 알려져 있으며, 행정안전부 주관 지역자원 경연대회에서 금상을 수상한 바 있습니다.',
    addr1: '강원특별자치도 홍천군 북방면 원소리 / 남노일리 일원',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/51/1842051_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/51/1842051_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/51/1842051_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/49/1842049_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/50/1842050_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/52/1842052_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/53/1842053_image2_1.jpg',
    ],
  },
  'local-scenic:hongcheon-palgyeong:가리산': {
    firstImage: 'https://tong.visitkorea.or.kr/cms2/website/63/2778563.jpg',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/63/2778563.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms2/website/63/2778563.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/64/2778564.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/65/2778565.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/66/2778566.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/67/2778567.jpg',
    ],
    addr1: '강원특별자치도 홍천군 두촌면 가리산길 260-9',
  },
  'local-scenic:sokcho-palgyeong:조도': {
    overview:
      '속초 8경 중 제6경으로 꼽히는 조도(鳥島)는 새들이 많이 찾는 섬이라 하여 붙여진 이름입니다. 속초해수욕장 정면 바다에 떠 있는 무인도로, 소나무 숲이 우거져 푸른 동해와 어우러지며 백사장과 조도 너머로 붉게 타오르는 아침 일출이 장관을 이룹니다.',
    addr1: '강원특별자치도 속초시 조양동 (속초해수욕장 앞 해상)',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/30/1692430.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms2/website/30/1692430.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms2/website/30/1692430.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/32/1692432.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/52/1692452.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/84/1692484.jpg',
    ],
  },
  'local-scenic:samcheok-sipgyeong:새천년해안유원지': {
    contentId: '2610236',
    overview:
      '삼척 10경 중 하나로, 삼척항에서 삼척해수욕장까지 약 4.6km에 걸쳐 푸른 동해를 따라 이어지는 명품 해안도로이자 유원지입니다. ‘한국의 아름다운 길 100선’에 선정될 만큼 깎아지른 기암절벽과 푸른 바다가 어우러지는 비경을 자랑하며, 비치조각공원과 소망의 탑, 해안 산책로가 조성되어 있어 사계절 동해 일출과 산책 명소로 각광받고 있습니다.',
    addr1: '강원특별자치도 삼척시 새천년도로 61-18 (정하동)',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/07/3503607_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/07/3503607_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/07/3503607_image2_1.jpg',
    ],
  },
  'local-scenic:wonju-palgyeong:비로봉': {
    contentId: '125587',
    overview:
      '원주 8경 중 제3경으로 지정된 해발 1,288m의 치악산 국립공원 최고봉입니다. 정상에는 용왕탑·산신탑·칠성탑이라 불리는 거대한 세 기의 돌탑(원주 미륵불탑)이 우뚝 솟아 있어 신비로운 자태를 뽐내며, 사방으로 막힘없이 펼쳐지는 웅장한 백두대간 능선 파노라마와 사계절 운해·설경이 장관을 이룹니다.',
    addr1: '강원특별자치도 원주시 소초면 무쇠점2길 26 (치악산국립공원 비로봉)',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/26/4057126_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/26/4057126_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/26/4057126_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/78/1528578.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/89/1528589.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/35/1528835.jpg',
    ],
  },
  'local-scenic:hongcheon-palgyeong:살둔계곡': {
    contentId: '802670',
    overview:
      '정감록에서 난을 피할 수 있는 명당으로 꼽은 삼둔사거리 중 하나로, 홍천 9경 가운데 제8경에 속하는 청정 계곡입니다. 내린천 상류의 맑고 차가운 물줄기가 원시림과 기암괴석 사이를 굽이쳐 흐르며, 고즈넉한 한국 전통 귀틀집 양식의 살둔분교와 어우러져 오지 속 힐링과 계곡 트레킹 명소로 유명합니다.',
    addr1: '강원특별자치도 홍천군 내면 살둔길 일원 / 내린천로 638',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/80/3043180_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/80/3043180_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/80/3043180_image2_1.jpg',
    ],
  },
  'local-scenic:hongcheon-palgyeong:삼봉약수': {
    contentId: '1837460',
    overview:
      '홍천 9경 중 제9경으로, 2011년 천연기념물로 지정된 유서 깊은 탄산약수입니다. 가칠봉·응복산·사삼봉 세 봉우리의 정기가 모인 곳에서 솟아나며, 철분과 탄산이 풍부하여 톡 쏘는 상쾌함과 청량감을 자랑합니다. 주변 삼봉자연휴양림의 울창한 전나무·주목 숲과 깨끗한 계곡이 어우러져 사계절 휴양 명소로 꼽힙니다.',
    addr1: '강원특별자치도 홍천군 내면 삼봉휴양길 276',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/86/1732286_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/86/1732286_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/86/1732286_image2_1.jpg',
    ],
  },
  'local-scenic:hongcheon-palgyeong:미약골': localScenicPhotoOverlay(
    '홍천9경 3경 미약골은 서석면 구룡령로 3748-8입니다. 홍천군 문화관광은 높은 산과 깊은 계곡으로 둘러싸인 곳이며, 풍수가가 삼정승 6판서가 날 명당이라 보고 학이 울고 촛대바위가 치솟았으며 선녀가 목욕했다는 암석폭포가 있어 미암동 또는 미약골이라 했다고 적습니다. 원시림과 용천수가 있고, 그 물이 400리를 흘러 북한강 청평댐으로 드는 홍천강 발원지입니다. 산불조심기간(봄 2월 1일~5월 15일, 가을 11월 1일~12월 15일)에는 입산이 금지됩니다. 주차는 서석면 생곡리 11(구룡령로 3748-8)이며 화장실이 있습니다. 문의 033-430-4451. 7경 용소계곡·8경 살둔계곡·2경 가리산과 다른 서석 생곡 계곡입니다. 사진은 홍천군 문화관광 9경 공식 사진입니다.',
    '강원특별자치도 홍천군 서석면 구룡령로 3748-8',
    HC_MIYAK,
    [],
    HC_MIYAK_HOME,
  ),
  'local-scenic:hongcheon-palgyeong:가령폭포': localScenicPhotoOverlay(
    '홍천9경 5경 가령폭포는 내촌면 와야리 산12-1입니다. 홍천군 문화관광은 백암산(1,099m) 서남쪽 기슭의 폭포로 개령폭포라고도 하며, 약 50m 낭떠러지로 떨어진다고 적습니다. 해발 950m 어사리덕 산골샘에서 나온 물이 비레올 계곡을 지나 400리 홍천강으로 이어집니다. 숲에 가려 잘 드러나지 않는 폭포로 알려져 있고, 주차는 내촌면 와야리 38-3입니다. 문의 033-430-2544. 문경 용추계곡·동해 무릉 용추폭포·인제 대승폭포·포항 내연산 12폭포와 다른 내촌 백암산 폭포입니다. 사진은 홍천군 문화관광 9경 공식 사진 3장입니다.',
    '강원특별자치도 홍천군 내촌면 와야리 산12-1',
    HC_GARYEONG,
    [HC_GARYEONG_2, HC_GARYEONG_3],
    HC_GARYEONG_HOME,
  ),
  'local-scenic:danyang-palgyeong:하선암': {
    contentId: '126654',
    overview:
      '단양팔경 중 제6경으로 꼽히는 하선암(下仙巖)은 선암계곡의 백미를 이루는 절경입니다. 삼선구곡의 첫 경승지로 3층으로 된 널찍한 흰 바위 위에 크고 둥근 바위가 미륵불 형상으로 얹혀 있어 불암(佛巖)이라고도 불립니다. 조선 성종 때 신선이 노닐던 바위라 하여 ‘선암’이라 명명되었으며, 거울처럼 맑은 계류에 비친 너럭바위와 사계절 기암괴석이 어우러져 예로부터 시인묵객들의 발길이 끊이지 않는 명소입니다.',
    addr1: '충청북도 단양군 단성면 선암계곡로 1337',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/04/1800004.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms2/website/04/1800004.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms2/website/04/1800004.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/05/1800005.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/06/1800006.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/19/4085219_image2_1.jpg',
    ],
  },
  'local-scenic:danyang-palgyeong:옥순봉': {
    overview:
      '단양팔경이자 명승 제48호로 지정된 옥순봉(玉荀峰)은 남한강 청풍호반 위로 힘차게 솟구쳐 오른 기암절벽입니다. 비가 갠 뒤 희고 푸른 여러 개의 바위 봉우리가 마치 대나무 죽순처럼 돋아나듯 솟아 있다 하여 붙여진 이름입니다. 조선 명종 때 단양군수 퇴계 이황이 절경에 감탄하여 석벽에 ‘단구동문(丹丘洞門)’이라 새기며 단양의 관문으로 삼았다는 일화가 전해지며, 배를 타고 호수 위에서 바라보거나 출렁다리에서 감상하는 풍광이 으뜸입니다.',
    addr1: '충청북도 제천시 수산면 괴곡리 산9 일원 (단양·제천 경계 충주호반)',
    imageUrl: 'https://www.khs.go.kr/unisearch/images/scenic_site/1628952.jpg',
    firstImage: 'https://www.khs.go.kr/unisearch/images/scenic_site/1628952.jpg',
    galleryUrls: [
      'https://www.khs.go.kr/unisearch/images/scenic_site/1628952.jpg',
      'https://www.khs.go.kr/unisearch/images/scenic_site/1628953.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/90/3480590_image2_1.jpg',
    ],
  },
  'local-scenic:mungyeong-palgyeong:새재계곡': {
    contentId: '126017',
    overview:
      '문경8경 중 제1경으로 꼽히는 새재계곡은 조령산과 주흘산 사이의 깊은 협곡을 따라 백두대간 조령(문경새재) 관문을 관통하여 흐르는 유서 깊은 명품 계곡입니다. 맑고 차가운 청정 계류를 따라 우거진 원시림과 흙길 산책로가 이어지며, 영남 제1관(주흘관)부터 제3관(조령관)에 이르는 유려한 역사 유적과 자연경관이 사계절 빼어난 정취를 선사합니다.',
    addr1: '경상북도 문경시 문경읍 새재로 932 (문경새재도립공원 일원)',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/37/1121037.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms2/website/37/1121037.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms2/website/37/1121037.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/39/1121039.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/45/1121045.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/50/1121050.jpg',
    ],
  },
  'local-scenic:mungyeong-palgyeong:쌍용계곡': {
    overview:
      '문경8경 중 제4경에 속하는 쌍용계곡은 도장산 기슭을 흐르는 청룡·황룡의 전설이 깃든 비경의 계곡입니다. 깊고 그윽한 협곡을 따라 층암절벽과 너럭바위, 푸른 소(沼)가 4km에 걸쳐 연속으로 펼쳐지며, 여름철 피서와 사계절 암반 계곡 트레킹 명소로 유명합니다.',
    addr1: '경상북도 문경시 농암면 내서리 일원',
    imageUrl: 'https://www.gbmg.go.kr/tour/img/sub02/mg8_0401.jpg',
    firstImage: 'https://www.gbmg.go.kr/tour/img/sub02/mg8_0401.jpg',
    galleryUrls: [
      'https://www.gbmg.go.kr/tour/img/sub02/mg8_0401.jpg',
      'https://www.gbmg.go.kr/tour/img/sub02/mg8_0402.jpg',
    ],
  },
  'local-scenic:mungyeong-palgyeong:운달계곡': {
    contentId: '127819',
    overview:
      '문경8경 중 제6경으로 꼽히는 운달계곡은 해발 1,097m의 명산 운달산 동남쪽 자락에 자리한 원시 계곡입니다. 한여름에도 손이 시릴 정도로 차가운 맑은 물이 솟아 ‘냉골’이라 불리며, 계곡을 따라 천년고찰 김룡사로 이어지는 울창한 전나무 숲길과 기암괴석이 사계절 고즈넉한 힐링 풍광을 자아냅니다.',
    addr1: '경상북도 문경시 산북면 김용리 (운달산 김룡사 일원)',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/00/3528000_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/00/3528000_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/00/3528000_image2_1.jpg',
    ],
  },
  'local-scenic:mungyeong-palgyeong:봉암사백운대': {
    overview:
      '문경8경 중 제8경으로 꼽히는 봉암사 백운대(白雲臺)는 희양산 남쪽 계곡, 조계종 종립특별선원인 천년고찰 봉암사 경내에 위치한 구름 같은 화강암 암반 지대입니다. 거대한 백색 암반 위로 맑고 투명한 옥수가 소리 없이 흘러내리며, 너럭바위에 새겨진 마애보살좌상과 백운대 암각, 기이한 괴석들이 어우러져 선경을 방불케 하는 불교 청정 도량의 정취를 보여줍니다.',
    addr1: '경상북도 문경시 가은읍 원북길 313 (봉암사 백운대 계곡)',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/88/1120888.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms2/website/88/1120888.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms2/website/88/1120888.jpg',
    ],
  },
  'local-scenic:mungyeong-palgyeong:선유동계곡': {
    contentId: '126056',
    overview:
      '문경8경 중 제2경 선유동계곡은 조령산과 주흘산 사이 깊은 협곡을 따라 흐르는 맑은 계곡입니다. 울창한 숲과 바위, 폭포가 어우러진 산책로가 이어지며 사계절 피서·트레킹 명소로 알려져 있습니다.',
    addr1: '경상북도 문경시 문경읍 선유동계곡 일원',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/91/3517191_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/91/3517191_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/91/3517191_image2_1.jpg',
    ],
  },
  'local-scenic:mungyeong-palgyeong:용추계곡': {
    contentId: '127913',
    overview:
      '문경8경 중 제3경 용추계곡은 대야산 자락에 자리한 계곡으로, 맑은 계류와 기암괴석·폭포가 어우러진 산수 경관이 뛰어납니다.',
    addr1: '경상북도 문경시 산북면 용추계곡 일원',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/30/3517030_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/30/3517030_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/30/3517030_image2_1.jpg',
    ],
  },
  'local-scenic:mungyeong-palgyeong:경천호': {
    contentId: '131064',
    overview:
      '문경8경 중 제7경 경천호는 문경시 동쪽 산간에 조성된 인공호로, 호수와 주변 산세가 어우러진 힐링·드라이브 명소입니다.',
    addr1: '경상북도 문경시 동로면 경천리 일원',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/43/3517043_image2_1.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/43/3517043_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/43/3517043_image2_1.jpg',
    ],
  },
  'local-scenic:uiseong-binggye-palgyeong:빙계빙혈': localScenicPhotoOverlay(
    '빙계팔경 제1경 빙혈(氷穴)은 춘산면 서원마을 뒷산 기슭 바위 아래, 너덧 명이 들어설 수 있는 방 한 칸 넓이의 얼음 구멍입니다. 의성군에 따르면 입춘이면 찬 기운이 나고 한여름에는 얼음이 얼며, 입추가 지나면 녹아 동지에는 훈훈한 바람이 나옵니다. 경사면 암괴(애추)가 만드는 이 현상으로 빙계리 일대는 2011년 천연기념물 제527호 의성 빙계리 얼음골로 지정되었습니다.',
    BINGGYE_PARK_ADDR,
    USC_BINGHYEOL_FRONT,
    [USC_BINGHYEOL_TREES],
  ),
  'local-scenic:uiseong-binggye-palgyeong:빙계풍혈': localScenicPhotoOverlay(
    '빙계팔경 제2경 풍혈(風穴)은 마을 동구 도로변 바위와 바위 사이에 뚫린 좁고 깊은 바람 구멍입니다. 의성군 공식 소개에 여름에는 찬바람이, 겨울철에는 훈훈한 더운 바람이 일며, 근방 크고 작은 바위 틈에서도 같은 현상이 나타납니다. 제1경 빙혈과 함께 천연기념물 의성 빙계리 얼음골을 이루는 대표 지점입니다.',
    BINGGYE_PARK_ADDR,
    USC_CLIFF_STREAM,
    [VISITKOREA_BINGGYE_TALUS],
  ),
  'local-scenic:uiseong-binggye-palgyeong:빙계인암': localScenicPhotoOverlay(
    '빙계팔경 제3경 인암(仁岩)은 옛 빙계서원 터 앞에 있는 너비 1.2m, 높이 2.4m가 넘는 큰 바위입니다. 의성군에 따르면 정오 햇살에 바위 전면에 어질 인(仁)자 모양의 그늘이 나타나 세상 인심을 선도하는 듯하다고 전합니다. 1933년 경북팔승 중 하나로 뽑힌 빙계계곡 암반 경관의 한 축입니다.',
    BINGGYE_PARK_ADDR,
    USC_INAM_INSCRIPTION,
    [USC_INAM_STREAM_ROCK],
  ),
  'local-scenic:uiseong-binggye-palgyeong:빙계의각': localScenicPhotoOverlay(
    '빙계팔경 제4경 의각(義閣)은 임진왜란 때 윤은보(尹殷甫)가 모재·회재 두 분의 위패를 청송 주왕산으로 모셔 7년 동안 삭망 향화를 이어 피난시킨 공적을 기리는 전각입니다. 의성군은 그 의리를 기려 비와 전각을 세워 의사각(義士閣)이라 불렀다고 적습니다. 빙계서원과 맞물린 유교 충의의 현장입니다.',
    BINGGYE_PARK_ADDR,
    VISITKOREA_BINGGYE_SEOWON,
    [USC_SEOWON_BINGWOLRU, USC_SEOWON_HALL],
  ),
  'local-scenic:uiseong-binggye-palgyeong:빙계수대': localScenicPhotoOverlay(
    '빙계팔경 제5경 수대(水碓)는 시냇물을 이용해 매일 많은 곡식을 찧던 규모 큰 물레방아가 있던 자리입니다. 의성군에 따르면 물레방아는 오래전 자취를 감췄고, 그 빈터 가까이 대한불교법화종 소속 빙계정사(氷溪精舍)가 자리합니다. 계곡 살림과 신앙이 겹친 빙계 마을의 생활 경관입니다.',
    BINGGYE_PARK_ADDR,
    USC_BRIDGE,
    [VISITKOREA_BINGGYE_RAINBOW],
  ),
  'local-scenic:uiseong-binggye-palgyeong:빙산사지오층석탑': localScenicPhotoOverlay(
    '빙계팔경 제6경이자 보물로 지정된 의성 빙산사지 오층석탑은 높이 8.15m의 모전석탑입니다. 의성군·국가유산청에 따르면 돌을 벽돌 크기로 다듬어 쌓았으며, 국보 의성 탑리 오층석탑을 본뜬 통일신라 말~고려 초 형식으로 보입니다. 1층 몸돌 정면에는 불상을 모시던 감실이 있고, 상륜부는 노반만 남아 있습니다.',
    '경상북도 의성군 춘산면 빙계계곡길 127 (빙계리 산70)',
    USC_PAGODA_AUTUMN,
    [USC_PAGODA_SKY, USC_PAGODA_GINKGO, KHS_BINGSANSA_PAGODA],
  ),
  'local-scenic:uiseong-binggye-palgyeong:빙계불정': localScenicPhotoOverlay(
    '빙계팔경 제7경 불정(佛頂)은 불정봉 꼭대기가 움푹 파인 지점입니다. 의성군은 그 옛날 부처가 용과 싸울 때 찍은 쇠스랑 자국이라는 설을 전합니다. 병풍처럼 둘러선 빙계 절벽과 함께 경북팔승지일(八勝地一) 비석이 있는 계곡 암봉 경관의 일부입니다.',
    BINGGYE_PARK_ADDR,
    VISITKOREA_BINGGYE_PEAK,
    [VISITKOREA_BINGGYE_MEANDER],
  ),
  'local-scenic:uiseong-binggye-palgyeong:빙계용추': localScenicPhotoOverlay(
    '빙계팔경 제8경 용추(龍湫·용소)는 깎아지른 절벽 밑 시냇물이 굽이치는 곳의 깊은 웅덩이입니다. 의성군에 따르면 부처와 싸운 용의 머리가 부딪쳐 파인 데라 전하나, 현재는 거의 메워진 상태입니다. 불정과 짝을 이루는 빙계 창세 설화의 물길 경승입니다.',
    BINGGYE_PARK_ADDR,
    VISITKOREA_BINGGYE_VALLEY,
    [VISITKOREA_BINGGYE_GORGE, USC_STREAM_ROAD],
  ),
  'local-scenic:muju-other:은구암': localScenicPhotoOverlay(
    '구천동33경 제2경 은구암(隱龜岩)은 라제통문에서 약 2.9km, 설천면 두길리 구산마을 남쪽 계곡 운장대 앞에 있습니다. 무주군은 거북 형상의 바위가 숨어 있는 듯하다 하여 이름 붙였고, 선녀가 내려와 목욕하던 곳이라 하여 강선대(降仙臺)라고도 불렀습니다.',
    '전북특별자치도 무주군 설천면 두길리 구산마을 남쪽 계곡',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:청금대': localScenicPhotoOverlay(
    '구천동33경 제3경 청금대(聽琴臺)는 은구암에서 남쪽으로 약 0.5km 지점입니다. 무주군 공식 소개에 흐르는 개울 물소리에 귀를 기울이면 탄금(彈琴) 소리처럼 신비롭다고 하여 붙여진 이름입니다. 외구천동 드라이브 구간의 계류 청취 명소입니다.',
    '전북특별자치도 무주군 설천면 두길리 일원',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:와룡담': localScenicPhotoOverlay(
    '구천동33경 제4경 와룡담(臥龍潭)은 청금대에서 물길을 따라 약 1.9km, 일사대 하류의 반석 소입니다. 무주군은 물이 누워 있는 용 같은 바위 주변을 맴돌며 담을 이룬다고 적으며, 용이 등천하려고 10년을 머물렀다는 전설이 전합니다. 위치가 궁벽해 발길은 드물지만 독특한 정취를 지닌 외구천동 경승입니다.',
    '전북특별자치도 무주군 설천면 두길리 (일사대 하류)',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:학소대': localScenicPhotoOverlay(
    '구천동33경 제5경 학소대(鶴巢臺)는 와룡담에서 약 0.6km, 서벽정 동쪽 계곡입니다. 무주군에 따르면 학이 둥지를 틀고 살던 노송이 있던 명소로, 지금은 어린 소나무가 그 자리를 잇습니다. 제6경 일사대·서벽정과 맞닿은 외구천동의 기암 소나무 경관입니다.',
    '전북특별자치도 무주군 설천면 두길리 서벽정 동쪽 계곡',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:일사대': localScenicPhotoOverlay(
    '구천동33경 제6경 일사대(一士臺)는 명승으로 지정된 원당천 하식애입니다. 국가유산청은 고종 때 학자 연재 송병선이 서벽정을 짓고 은거한 곳으로, 고을 선비들이 그를 동방일사(東方一士)라 한 데서 이름이 비롯되었다고 적습니다. 서벽정 서쪽 기암이 배의 돛대처럼 솟아 구천동 3대 경승 중 하나로 꼽힙니다.',
    '전북특별자치도 무주군 설천면 구천동로 1868-30 (두길리)',
    KHS_ILSADAE,
    [VISITKOREA_GUCHEONDONG],
  ),
  'local-scenic:muju-other:함벽소': localScenicPhotoOverlay(
    '구천동33경 제7경 함벽소(涵碧沼)는 일사대에서 약 0.4km 지점입니다. 무주군은 늦은 봄 철쭉과 가을 단풍으로 붉은 골짜기를 이루고, 여름 남벽수색(藍碧水色)이 마음을 씻어 주는 듯하다고 소개합니다. 일사대 일원과 이어지는 외구천동의 맑은 소입니다.',
    '전북특별자치도 무주군 설천면 두길리 일원',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:가의암': localScenicPhotoOverlay(
    '구천동33경 제8경 가의암(可意巖)은 함벽소에서 약 0.3km, 인공으로 다듬은 듯한 흰 반석이 층층을 이룬 자리입니다. 무주군에 따르면 맑은 물이 차례로 굴러 넘기고, 함벽소를 거쳐 온 노인이 쉴 곳이 마땅찮다 하자 지나던 고승이 그 뜻을 받아 반석을 만들어 주었다는 전설에서 이름이 왔습니다.',
    '전북특별자치도 무주군 설천면 두길리 일원',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:추월담': localScenicPhotoOverlay(
    '구천동33경 제9경 추월담(秋月潭)은 가의암에서 약 2.0km 지점입니다. 무주군은 가을밤 달빛이 소에 담기면 기암이 선경을 이룬다고 적으며, 임진왜란 때 김천일 장군의 장인 양도사가 마전 부락에서 매일 밤 바위에 앉아 공을 드리다가 소에 비친 달을 보고 도를 깨워 이름을 붙였다고 전합니다.',
    '전북특별자치도 무주군 설천면 구천동 계곡 (마전 일원)',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:만조탄': localScenicPhotoOverlay(
    '구천동33경 제10경 만조탄(晩釣灘)은 추월담에서 약 0.6km의 여울 낚시터입니다. 무주군에 따르면 석양빛 여울에 낚시를 드리우는 풍정이 으뜸이고 송병선도 자주 찾았으며, 구천 승려가 쌀을 씻던 뜨물이 여기까지 흘렀다 하여 뜨물재라고도 불렀습니다.',
    GUCHEONDONG_SEOLCHEON_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:수심대': localScenicPhotoOverlay(
    '구천동33경 제12경 수심대(水心臺)는 파회와 함께 명승으로 지정된 기암 절벽입니다. 국가유산청은 신라 일지대사가 맑은 물에 비친 그림자를 보고 도를 깨쳤다 하여 수심대, 물이 돌아 나간다 하여 수회(水回)라 불렀다고 적습니다. 병풍처럼 중첩된 절벽을 금강봉·소금강이라 부르며 파회와 짝을 이루는 구천동 3대 경승입니다.',
    '전북특별자치도 무주군 설천면 심곡리 산13-2 일원',
    KHS_PAHOE_SUSIMDAE,
    [VISITKOREA_GUCHEONDONG],
  ),
  'local-scenic:muju-other:세심대': localScenicPhotoOverlay(
    '구천동33경 제13경 세심대(洗心臺)는 수심대에서 약 1.8km, 설천면 삼공리로 드는 소머리고개 비탈 아래입니다. 무주군은 큰 바위와 아름다운 담이 있어, 덕유산 아래 사찰이 성할 때 불공·수도하러 가는 이가 몸과 마음을 먼저 씻고 갔다고 전합니다. 외구천동에서 내구천동으로 넘어가는 문턱입니다.',
    '전북특별자치도 무주군 설천면 삼공리 소머리고개 아래',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:수경대': localScenicPhotoOverlay(
    '구천동33경 제14경 수경대(水鏡臺)는 세심대에서 약 0.5km, 삼공리를 가르는 계곡의 다리 위쪽입니다. 무주군에 따르면 병풍 암벽 아래로 비단결 같은 암반을 미끄러진 물이 거울처럼 맑은 담을 이룹니다. 외구천동의 마지막 경승으로, 여기서부터 내구천동은 걸어서 듭니다.',
    '전북특별자치도 무주군 설천면 삼공리',
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:월하탄': localScenicPhotoOverlay(
    '구천동33경 제15경 월하탄(月下灘)은 수경대에서 약 3.0km, 인월담으로 이어지는 긴 여울목입니다. 무주군은 기암을 타고 여러 갈래로 쏟아지는 폭포수가 달빛에 은빛으로 빛난다고 소개하며, 내구천동 탐방의 들머리로 구천동 관광단지와 맞닿아 있습니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
    [VISITKOREA_DEOGYUSAN],
  ),
  'local-scenic:muju-other:사자담': localScenicPhotoOverlay(
    '구천동33경 제17경 사자담(獅子潭)은 인월담에서 약 0.2km 지점입니다. 무주군에 따르면 사자목에 살던 사자가 내려와 목욕하던 곳이며, 사자 형상의 기암이 소를 이룹니다. 인월담·청류동·비파담으로 이어지는 내구천동 중류의 암반 담입니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:청류동': localScenicPhotoOverlay(
    '구천동33경 제18경 청류동(淸流洞)은 사자담과 비파담 사이 약 0.2km의 직통 계곡입니다. 무주군은 홈 진 암반 위로 맑은 물이 얇게 깔려 흐르고, 가을 단풍이 짙으면 물이 붉게 물들어 별천지가 된다고 적습니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:비파담': localScenicPhotoOverlay(
    '구천동33경 제19경 비파담(琵琶潭)은 속칭 대접소로, 비파 모양의 소입니다. 무주군은 선녀가 내려와 비파를 타며 놀았다는 전설을 전하며, 다연대 암반을 타고 쏟아진 폭포수가 담을 이뤄 천연 수영장이 되었다가 청류동으로 흘러든다고 소개합니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:다연대': localScenicPhotoOverlay(
    '구천동33경 제20경 다연대(茶煙臺)는 비파담 위쪽의 연계 암반입니다. 무주군에 따르면 구천동을 탐승하던 선인들이 비파담으로 미끄러지는 옥류에 감탄하고 차를 끓여 마시며 피로를 풀던 자리입니다. 비파담과 한 세트로 읽는 내구천동의 차 향 대입니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:구월담': localScenicPhotoOverlay(
    '구천동33경 제21경 구월담(九月潭)은 다연대에서 약 0.3km, 월음령 계곡과 백련사 계곡 물이 합류해 폭포수를 쏟는 담입니다. 무주군은 형형색색 무늬의 암반이 맑은 물에 잠기고, 가을 단풍이 곱게 물들면 더욱 아름답다고 적습니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:금포탄': localScenicPhotoOverlay(
    '구천동33경 제22경 금포탄(琴浦灘)은 구월담에서 약 0.9km의 여울입니다. 무주군에 따르면 바위 사이를 굽는 여울 소리와 심산유곡의 바람 소리가 어우러져 탄금 소리 같다 하여 이름이 붙었습니다. 내구천동 중·상류를 잇는 청각의 경승입니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:호탄암': localScenicPhotoOverlay(
    '구천동33경 제23경 호탄암(虎灘巖)은 금포탄에서 약 0.7km, 구천 계곡에서 향적봉을 볼 수 있는 고개 아래입니다. 무주군은 밀림 사이로 쏟아지는 물소리와 산대나무 숲, 겹쳐 솟은 큰 바위를 적으며, 산신을 모시던 호랑이가 안개 속 바위에서 미끄러져 소에 빠졌다는 전설을 전합니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
    [VISITKOREA_DEOGYUSAN],
  ),
  'local-scenic:muju-other:청류계': localScenicPhotoOverlay(
    '구천동33경 제24경 청류계(淸流溪)는 호탄암과 안심대 사이 약 1.1km 계곡입니다. 무주군은 산책로에서 훤히 보이는 울창한 수림과 기암괴석 사이로 흐르는 맑은 물이 비경을 이룬다고 소개합니다. 백련사로 오르는 탐방로와 나란한 내구천동 상류 물길입니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:안심대': localScenicPhotoOverlay(
    '구천동33경 제25경 안심대(安心臺)는 청류계와 이어진 다리 위쪽의 여울목입니다. 무주군에 따르면 구천동과 백련사를 오가는 행인이 계곡물을 안심하고 건너던 곳이며, 기암 사이 폭포수와 맑은 물이 덕유산 등산객의 쉼터가 됩니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:신양담': localScenicPhotoOverlay(
    '구천동33경 제26경 신양담(新陽潭)은 안심대에서 약 0.2km, 속칭 새암골입니다. 무주군은 숲 터널 구천동 계곡 중 유일하게 햇빛을 볼 수 있는 지점으로, 옛 신양사(新陽寺) 터만 남았다고 적습니다. 길 아래 기암과 양쪽 계곡에서 흘러내리는 물이 비경을 이룹니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:명경담': localScenicPhotoOverlay(
    '구천동33경 제27경 명경담(明鏡潭)은 신양담에서 약 0.3km, 백련사로 오르는 오르막 여울목입니다. 무주군에 따르면 잠긴 물이 거울같이 맑다 하여 이름이 붙었고, 절로 향하는 이가 담수에 자신을 비쳐 심신을 가다듬던 곳입니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:구천폭포': localScenicPhotoOverlay(
    '구천동33경 제28경 구천폭포(九千瀑布)는 명경담에서 약 0.2km의 층암 폭포입니다. 무주군은 산책로 오른쪽에서는 2단, 계곡 건너 왼쪽에서는 3단으로 보이며, 선녀가 무지개를 타고 내려와 놀았다는 전설을 전합니다. 백련사 직전 내구천동의 대표 폭포입니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
    [VISITKOREA_DEOGYUSAN],
  ),
  'local-scenic:muju-other:백련담': localScenicPhotoOverlay(
    '구천동33경 제29경 백련담(白蓮潭)은 구천폭포에서 약 0.2km, 백련사를 지척에 둔 못입니다. 무주군은 덕유산 상봉 못봉의 못과 연관이 있다고 하며, 연화폭을 거친 맑은 물이 담겨 흘러간다고 소개합니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
  ),
  'local-scenic:muju-other:연화폭': localScenicPhotoOverlay(
    '구천동33경 제30경 연화폭(蓮華瀑)은 백련담과 이속대 사이 약 0.3km 계곡입니다. 무주군에 따르면 흘러내리는 물이 층층 암반과 기암에 부딪치며 여러 개의 작은 폭포와 물보라를 이룹니다. 백련사 골짜기의 연꽃 같은 다단 폭포입니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
    [VISITKOREA_DEOGYUSAN],
  ),
  'local-scenic:muju-other:이속대': localScenicPhotoOverlay(
    '구천동33경 제31경 이속대(離俗臺)는 연화폭과 이어지고 백련사와 지척입니다. 무주군은 기암의 좁은 홈을 타고 미끄러지듯 쏟아지는 한줄기 폭포수를 적으며, 사바세계를 떠나는 중생이 속세와의 연을 끊는 곳이라 하여 이름 지었다고 전합니다. 제32경 백련사로 드는 마지막 속세의 대입니다.',
    GUCHEONDONG_TRAIL_ADDR,
    VISITKOREA_GUCHEONDONG,
    [VISITKOREA_DEOGYUSAN],
  ),
  'local-scenic:gwangyang-gugyeong:백운산4대계곡': localScenicPhotoOverlay(
    '광양9경 제1경 백운산 4대 계곡은 성불·동곡·어치·금천입니다. 광양시에 따르면 백운산(1,222m)은 전남에서 가장 높은 산이며, 상봉에서 매봉·따리봉·도솔봉·형제봉으로 이어지는 능선 아래 네 계곡이 유리처럼 맑고 차갑게 흐릅니다. 동곡은 약 10km로 가장 길고 용소·선유대·병암폭포를 품으며, 어치는 구시폭포와 오로대, 성불은 성불사 풍경소리, 금천은 옥녀봉에서 내려와 섬진강과 만납니다.',
    '전라남도 광양시 백운산 성불·동곡·어치·금천계곡 일원',
    GY_SCENIC_VALLEYS,
    [VISITKOREA_DONGGOK, VISITKOREA_SEONGBUL, VISITKOREA_EOCHI],
  ),
  'local-scenic:gwangyang-gugyeong:백운산자연휴양림': localScenicPhotoOverlay(
    '광양9경 제3경 백운산 자연휴양림은 옥룡면 백계로 337에 있습니다. 광양시는 잘 보존된 원시림과 삼나무·편백 인공림이 융단처럼 어우러진다고 소개하며, 산막·황토방·오토캠핑장·황톳길과 치유의 숲 센터(건강측정·요가명상·피톤치드 북카페·족욕)를 갖추었습니다. 숲속의 집·캐빈하우스·목재체험관이 있어 하루 묵으며 백운산 숲을 걷는 휴양지입니다.',
    '전라남도 광양시 옥룡면 백계로 337',
    GY_SCENIC_FOREST,
    [VISITKOREA_BAEGUNSAN_GY],
  ),
  'local-scenic:gwangyang-gugyeong:광양이순신대교': localScenicPhotoOverlay(
    '광양9경 제4경 광양이순신대교는 광양과 여수를 잇는 현수교입니다. 광양시에 따르면 총연장 2,260m, 주탑 사이 1,545m는 이순신 장군 탄생 연도를 기리고, 주탑 높이 270m는 콘크리트 주탑으로는 세계 최고 수준입니다. 노량해전이 시작된 바다 위에 놓여 광양항 야경과 함께 드라이브·조망 명소로 꼽힙니다.',
    '전라남도 광양시 제철로 (금호동)',
    GY_SCENIC_BRIDGE,
    [
      VISITKOREA_YISUNSIN,
      'https://tong.visitkorea.or.kr/cms2/website/66/1914666.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/63/3520963_image2_1.jpg',
    ],
  ),
  'local-scenic:gwangyang-gugyeong:광양만야경': localScenicPhotoOverlay(
    '광양9경 제6경 광양만 야경은 광양시와 여수시 사이 내해의 밤 풍경입니다. 광양시는 포스코 광양제철소·이순신대교·광양항·여수국가산업단지의 불빛이 파노라마로 펼쳐지며, 구봉산 전망대가 야경 포인트라고 적습니다. 묘도·송도·장도가 떠 있고 한려해상 서쪽 끝이자 노량해전 유적과 맞닿은 항구 야경입니다.',
    '전라남도 광양시 광양만 일원 (구봉산 전망대)',
    GY_SCENIC_BAY_NIGHT,
    [
      'https://tong.visitkorea.or.kr/cms/resource/53/3534653_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/54/3534654_image2_1.jpg',
    ],
  ),
  'local-scenic:gwangyang-gugyeong:옥룡사지동백나무숲': localScenicPhotoOverlay(
    '광양9경 제7경 옥룡사지 동백나무 숲은 천연기념물 제489호입니다. 광양시에 따르면 통일신라 말 선각국사 도선이 백계산(505m) 남쪽 옥룡사 땅의 기운을 보강하려고 동백을 심었고, 864년부터 35년간 주석하다 입적했습니다. 수령 100년 이상 동백 1만여 그루가 절터 주변에 군락을 이루며, 매년 2~4월 빨간 동백꽃이 핍니다.',
    '전라남도 광양시 옥룡면 백계1길 71 일원',
    GY_SCENIC_CAMELLIA,
    [
      VISITKOREA_OKRYONG,
      'https://tong.visitkorea.or.kr/cms/resource/04/3520304_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/39/723539.jpg',
    ],
  ),
  'local-scenic:gwangyang-gugyeong:광양읍수와이팝나무': localScenicPhotoOverlay(
    '광양9경 제9경 광양읍수와 이팝나무는 천연기념물 제235호입니다. 광양시·국가유산청에 따르면 1528년 광양현감 박세후가 읍성을 쌓은 뒤 바다 쪽에서 성이 보이지 않도록 팽나무·이팝나무를 심고 연못을 파 비보림을 만들었습니다. 성은 사라졌어도 유당공원 숲이 남았고, 입하 무렵 흰 꽃이 쌀밥처럼 피면 풍년을 점쳤던 이팝나무가 읍수와 함께 지정되어 있습니다.',
    '전라남도 광양시 광양읍 인동리 193-1 (유당공원)',
    GY_SCENIC_EUPSU,
    [
      VISITKOREA_YUDANG,
      'https://tong.visitkorea.or.kr/cms/resource/57/4082857_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/59/4082859_image2_1.jpg',
    ],
  ),
  'local-scenic:hadong-sipgyeong:화개장터십리벚꽃': localScenicPhotoOverlay(
    '하동10경 제1경 화개장터십리벚꽃은 화개장터에서 쌍계사로 이어지는 벚꽃길입니다. 하동군은 꽃샘추위가 끝난 3월이면 화개에 벚꽃이 십리에 날리며, 청춘 남녀가 손을 잡고 걸으면 백년해로한다고 하여 혼례길이라고도 부른다고 적습니다. 지방도 1023 화개로를 따라 화개동천과 함께 봄 터널이 이어집니다.',
    '경상남도 하동군 화개면 삼신리 672 (지방도 1023)',
    VISITKOREA_HWAGAE_CHERRY,
    [
      'https://tong.visitkorea.or.kr/cms2/website/92/1540692.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/95/1540695.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/08/1540708.jpg',
    ],
  ),
  'local-scenic:hadong-sipgyeong:금오산일출과다도해': localScenicPhotoOverlay(
    '하동10경 제2경 금오산 일출과 다도해는 지리산 줄기가 남해로 건너가기 전 우뚝 솟은 산의 해돋이입니다. 하동군에 따르면 높이 849m 정상에서 남으로 한려해상 국립공원의 바다와 섬이, 북으로 지리산 주능선이 펼쳐집니다. 금남면 경충로 해맞이공원까지 차량으로 오를 수 있어, 다도해 아침을 맞는 하동의 일출 명소입니다.',
    '경상남도 하동군 금남면 경충로 493-223',
    VISITKOREA_GEUMOSAN_CABLE,
    [
      'https://tong.visitkorea.or.kr/cms/resource/26/3530926_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/32/3530932_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/34/3530934_image2_1.jpg',
    ],
  ),
  'local-scenic:hadong-sipgyeong:쌍계사의가을': localScenicPhotoOverlay(
    '하동10경 제3경 쌍계사의 가을은 화개골 천년고찰의 단풍입니다. 하동군에 따르면 신라 성덕왕 21년 삼법스님이 혜능의 사리를 모시고 와 창건했고, 문성왕 2년(840) 진감선사 혜소가 옥천사라 하였다가 정강왕 때 쌍계사로 바뀌었습니다. 국보 진감선사 대공탑비와 보물 등 문화재 29점을 보유한 지리산 고찰의 가을 경승입니다.',
    '경상남도 하동군 화개면 쌍계사길 59',
    VISITKOREA_SSANGGYESA,
    [
      'https://tong.visitkorea.or.kr/cms2/website/91/1497791.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/47/4075647_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/61/3311961.jpg',
    ],
  ),
  'local-scenic:hadong-sipgyeong:형제봉철쭉': localScenicPhotoOverlay(
    '하동10경 제5경 형제봉 철쭉은 지리산 남부 능선 끝자락이 섬진강에 잠기기 전에 솟은 봉우리의 봄 경관입니다. 하동군은 봄이면 연분홍 꽃자수가 능선을 따라 그림 같은 비경을 빚고, 악양 너른 들판과 섬진강이 어우러진다고 적습니다. 화개·악양 형제봉 활공장 일대에서 능선과 들녘을 함께 조망합니다.',
    '경상남도 하동군 악양면·화개면 (형제봉 활공장 일대)',
    VISITKOREA_PYEONGSARI,
    [
      'https://tong.visitkorea.or.kr/cms2/website/18/1022618.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/05/1022705.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/13/1022713.jpg',
    ],
  ),
  'local-scenic:hadong-sipgyeong:청학동삼성궁': localScenicPhotoOverlay(
    '하동10경 제6경 청학동 삼성궁은 환인·환웅·단군을 모신 성전입니다. 하동군에 따르면 우리 고유 선도의 도량이며, 이 고장 출신 한풀선사가 1983년 고조선 소도를 복원했습니다. 청암면 묵계리 해발 850m 골짜기에 여러 모양의 돌탑이 솟아 있고, 완만한 산길을 따라 청학동으로 듭니다.',
    '경상남도 하동군 청암면 삼성궁길 86-15',
    VISITKOREA_SAMSUNGGUNG,
    [
      'https://tong.visitkorea.or.kr/cms/resource/25/3535225_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/94/4065594_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/77/3021077.jpg',
    ],
  ),
  'local-scenic:hadong-sipgyeong:하동포구백사청송': localScenicPhotoOverlay(
    '하동10경 제8경 하동포구 백사청송은 섬진강 변 흰 모래와 푸른 소나무입니다. 하동군에 따르면 조선 영조 21년(1745) 강바람과 모래바람을 막으려고 소나무를 심어 오늘날 노송 숲이 되었고, 숲 면적 약 41,000㎡에 노송 900여 그루가 우거져 있습니다. 유유히 흐르는 강과 백사장이 한 폭처럼 어우러진 하동읍 목도리의 쉼터입니다.',
    '경상남도 하동군 하동읍 목도리',
    VISITKOREA_HADONG_SONGRIM,
    [
      'https://tong.visitkorea.or.kr/cms/resource/83/3501083_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/85/3501085_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource_photo/78/3312678_image2_1.jpg',
    ],
  ),
  'local-scenic:hadong-sipgyeong:섬호정에서바라본섬진강': localScenicPhotoOverlay(
    '하동10경 제10경 섬호정에서 바라본 섬진강은 하동공원 정상 2층 누각의 조망입니다. 하동군은 섬호정(蟾湖亭)에 오르면 동으로 하동 읍내가, 남으로 섬진강이 유유히 흐르며, 강이 호수같이 보여 이름 붙였다고 적습니다. 군내에서 경관이 가장 아름다운 정자로 꼽히는 하동읍 향교 옆 강변 누각입니다.',
    '경상남도 하동군 하동읍 향교2길 23',
    VISITKOREA_HADONG_PARK,
    [
      'https://tong.visitkorea.or.kr/cms/resource/41/3549641_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/44/3549644_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms2/website/80/1342380.jpg',
    ],
  ),
  'local-scenic:yeongdong-yangsan-palgyeong:비봉산': localScenicPhotoOverlay(
    '양산팔경 제3경 비봉산은 양산면 수두리에 솟은 해발 460m의 산입니다. 영동군에 따르면 산세보다 정상 조망이 뛰어나 금강과 양산면 일대를 한눈에 볼 수 있고, 비단강 숲마을 강변에서 바라보는 낙조가 아름답다고 소개합니다.',
    '충청북도 영동군 양산면 수두리',
    YD_GALGI,
    [
      'https://tong.visitkorea.or.kr/cms/resource/52/3341352_image2_1.JPG',
      YD_BIDAN_2,
    ],
  ),
  'local-scenic:yeongdong-yangsan-palgyeong:봉황대': localScenicPhotoOverlay(
    '양산팔경 제4경 봉황대는 수두리 비단강 숲마을 강변 절벽 위 정자입니다. 영동군은 과거 봉화대 앞으로 돌아오는 돛단배 풍경이 아름다워 으뜸 경치로 꼽았다고 적으며, 예전 누각은 소실되었고 2012년 정자를 세웠습니다. 금강변 산책 휴식처로 이어집니다.',
    '충청북도 영동군 양산면 수두리 비단강 숲마을 강변',
    YD_BIDAN,
    [YD_BIDAN_2, YD_GANGSEON_3],
  ),
  'local-scenic:yeongdong-yangsan-palgyeong:함벽정': localScenicPhotoOverlay(
    '양산팔경 제5경 함벽정은 봉황대 동쪽 강변 바위 위 정자입니다. 영동군에 따르면 송호리에서 금강을 따라 약 500m 올라가면 강가 나무 사이에 서 있으며, 시 읊고 글 쓰는 이들이 모여 풍류를 즐기던 곳으로 함벽정팔경을 따로 즐겼다고 전합니다. 비봉산 낙조를 볼 수 있는 위치입니다.',
    '충청북도 영동군 양산면 봉곡리',
    YD_GANGSEON,
    [YD_GANGSEON_2, YD_GANGSEON_3],
  ),
  'local-scenic:yeongdong-yangsan-palgyeong:여의정': localScenicPhotoOverlay(
    '양산팔경 제6경 여의정은 송호관광지 솔밭 바위 위 정자입니다. 영동군은 금강을 사이에 두고 강선대와 마주하는 절경이라 적으며, 만취당 박응종이 낙향해 세운 만취당을 1935년 후손이 여의정으로 고친 곳입니다. 백여 년 묵은 송림이 1만여 그루 우거진 송호관광지와 함께합니다.',
    '충청북도 영동군 양산면 송호로 103 (송호리)',
    YD_SONGHO,
    [
      'https://tong.visitkorea.or.kr/cms/resource/89/3572789_image2_1.jpg',
      YD_SONGHO_2,
    ],
  ),
  'local-scenic:yeongdong-yangsan-palgyeong:자풍서당': localScenicPhotoOverlay(
    '양산팔경 제7경 자풍서당은 양강면 두평리 조선시대 서당입니다. 영동군에 따르면 중기 유학자 이충범이 제자를 양성한 곳으로, 최초는 양강 강가에 지었고 인조 4년(1626)부터 숙종 46년(1720)까지 여러 차례 보수해 시도유형문화재 영동 자풍서당으로 이어집니다.',
    '충청북도 영동군 양강면 두평길 2-153 (두평리)',
    YD_GAHAK,
    [
      'https://tong.visitkorea.or.kr/cms/resource/55/3572755_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/08/3335708_image2_1.JPG',
    ],
  ),
  'local-scenic:yeongdong-yangsan-palgyeong:용암': localScenicPhotoOverlay(
    '양산팔경 제8경 용암은 송호관광지 금강변의 바위입니다. 영동군은 양강 물살을 견디는 용암 경치가 송림과 어우러져 한 폭의 그림을 이룬다고 소개하며, 선녀가 목욕한 강선대와 선녀를 보느라 승천하지 못한 용암 전설이 짝을 이룬다고 전합니다.',
    '충청북도 영동군 양산면 송호로 105 (송호리, 송호관광지관리사무소)',
    YD_GANGSEON_2,
    [YD_SONGHO_2, YD_WOLLYU],
  ),
  'local-scenic:yeongdong-hancheon-palgyeong:화헌악': localScenicPhotoOverlay(
    '한천팔경 제2경 화헌악은 한천정 뒤쪽 산봉우리입니다. 영동군에 따르면 꽃과 나무가 우거져 화헌이라 이름 붙었으며, 봄이면 진달래·철쭉이 만산홍을 이룹니다. 황간면 원촌리 월류봉 일대 우암 송시열이 머문 한천정사에서 유래한 팔경의 꽃 산경입니다.',
    '충청북도 영동군 황간면 원촌리',
    YD_WOLLYU_2,
    [YD_WOLLYU, YD_HANCHEON_3],
  ),
  'local-scenic:yeongdong-hancheon-palgyeong:용연대': localScenicPhotoOverlay(
    '한천팔경 제3경 용연대는 월류봉 앞 절벽입니다. 영동군은 산줄기가 평지에서 우뚝 솟아 용연(龍淵)에 이른 돌머리 모양 대(臺)라고 소개합니다. 월류봉 절벽과 초강천이 어우러진 황간 원촌리 경승입니다.',
    '충청북도 영동군 황간면 원촌리',
    YD_WOLLYU_3,
    [YD_WOLLYU_4, YD_HANCHEON],
  ),
  'local-scenic:yeongdong-hancheon-palgyeong:산양벽': localScenicPhotoOverlay(
    '한천팔경 제4경 산양벽은 월류봉 첫·두 번째 봉을 이루는 절벽입니다. 영동군에 따르면 병풍처럼 깎아지른 암벽으로 인적이 닿지 않고 새들의 보금자리가 되며, 돌 틈 뿌리내린 수목의 자연미가 빼어납니다.',
    '충청북도 영동군 황간면 원촌리',
    YD_WOLLYU_4,
    [YD_HANCHEON_3, YD_WOLLYU],
  ),
  'local-scenic:yeongdong-hancheon-palgyeong:청학굴': localScenicPhotoOverlay(
    '한천팔경 제5경 청학굴은 월류봉 중턱 자연동굴입니다. 영동군은 가을 단풍이 붉게 물들고 청학(靑鶴)이 깃든다 하여 이름 붙였다고 적습니다. 월류봉 하산길 옆 입이 벌어진 동굴이 탐방객의 발길을 사로잡습니다.',
    '충청북도 영동군 황간면 원촌리',
    YD_HANCHEON_4,
    [YD_MULHAN, YD_HANCHEON_2],
  ),
  'local-scenic:yeongdong-hancheon-palgyeong:법존암': localScenicPhotoOverlay(
    '한천팔경 제6경 법존암은 작은 암자가 있었다 전해지는 곳입니다. 영동군에 따르면 암자 위치는 현재 황간면 원촌마을로 추정합니다. 초강천과 백사장이 어우러진 한천팔경 중심 경승입니다.',
    '충청북도 영동군 황간면 원촌리',
    YD_HANCHEON_2,
    [YD_HANCHEON, YD_HANCHEON_3],
  ),
  'local-scenic:yeongdong-hancheon-palgyeong:사군봉': localScenicPhotoOverlay(
    '한천팔경 제7경 사군봉은 황간면 북쪽 명산으로 ‘나라의 사신(使臣)이 되는 산’이라는 뜻을 지녔다고 영동군이 소개하며, 설경으로 유명합니다. 월류봉 일대와 맞닿은 황간의 겨울 산경 명소입니다.',
    '충청북도 영동군 황간면 원촌리 일원',
    YD_CHEONTAE,
    [
      'https://tong.visitkorea.or.kr/cms/resource/33/3059933_image2_1.JPG',
      YD_WOLLYU,
    ],
  ),
  'local-scenic:yeongdong-hancheon-palgyeong:냉천정': localScenicPhotoOverlay(
    '한천팔경 제8경 냉천정은 법존암 앞 모래밭 샘에서 여덟 팔(八)자로 흘러 팔연(八淵)에 이르는 곳입니다. 영동군에 따르면 한여름에도 물이 무척 차며, 냉천정에 올라 바라보는 풍경이 아름답기로 유명하고 옛 선비들의 풍류 정취가 느껴진다고 적습니다.',
    '충청북도 영동군 황간면 원촌리',
    YD_HANCHEON,
    [YD_HANCHEON_4, YD_MULHAN],
  ),
  'local-scenic:yeongdong-yangsan-palgyeong:강선대': localScenicPhotoOverlay(
    '양산팔경 제2경 강선대는 금강 상류 물가 절벽 위에 홀로 우뚝 선 육각 정자입니다. 멀리서 보면 강물 위에 떠 있는 바위 위에 정자가 앉아 있는 듯하며, 옛날 하늘에서 선녀들이 내려와 목욕을 하고 놀았다는 아름다운 전설이 전해집니다. 주변의 노송과 맑은 금강 물줄기가 어우러진 풍광이 양산팔경 중에서도 으뜸 절경으로 꼽힙니다.',
    '충청북도 영동군 양산면 봉곡리 756-1',
    YD_GANGSEON_3,
    [YD_GANGSEON, YD_GANGSEON_2],
  ),
  'local-scenic:yangsan-other:내원사계곡': {
    contentId: '126073',
    overview:
      '양산 12경 제3경 내원사 계곡은 천성산 기슭에 자리한 유서 깊은 청정 계곡입니다. 예부터 소금강이라 불릴 정도로 자연경관이 빼어나며, 사시사철 맑고 깨끗한 계류가 기암괴석과 첩첩이 선 삼층바위, 병풍바위 사이를 굽이쳐 흐릅니다. 여름철 피서와 봄·가을 등산 및 단풍 명소로 널리 알려져 있습니다.',
    addr1: '경상남도 양산시 하북면 용연리 (내원사 계곡 일원)',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/40/3489340_image2_1.JPG',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/40/3489340_image2_1.JPG',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/40/3489340_image2_1.JPG',
      'https://tong.visitkorea.or.kr/cms/resource/25/3489425_image2_1.JPG',
      'https://tong.visitkorea.or.kr/cms/resource/37/3532137_image2_1.jpg',
    ],
  },
  'local-scenic:yangsan-other:황산공원': {
    contentId: '2784326',
    overview:
      '양산 12경 제9경 황산공원은 물금읍 낙동강변에 187만㎡ 규모로 조성된 대규모 수변문화공원입니다. 드넓은 억새 생태탐방로와 사계절 야생화 단지, 캠핑장, 산책로, 자전거길, 파크골프장 등 다양한 휴식·레저 공간을 갖추고 있습니다. 시원한 강바람과 낙동강을 붉게 물들이는 저녁 낙조가 아름다운 양산의 대표 힐링 명소입니다.',
    addr1: '경상남도 양산시 물금읍 물금리 162-1 (황산문화체육공원)',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/15/2784415_image2_1.JPG',
    firstImage: 'https://tong.visitkorea.or.kr/cms/resource/15/2784415_image2_1.JPG',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/15/2784415_image2_1.JPG',
      'https://tong.visitkorea.or.kr/cms/resource/82/2731482_image2_1.jpg',
    ],
  },
  'local-scenic:haman-gugyeong:말이산고분군': localScenicPhotoOverlay(
    '함안9경 제1경 말이산고분군은 아라가야 왕과 귀족의 묘역입니다. 디지털함안문화대전에 따르면 가야읍 말이산 능선에 100여 기가 이어지고, 사적으로 지정된 면적은 약 52만㎡입니다. 도항리·말산리 고분군을 2011년 통합했고, 2023년 유네스코 세계유산 가야고분군에 포함되었습니다. 함안박물관과 이어진 고분 산책이 대표 경관입니다.',
    '경상남도 함안군 가야읍 도항리 484 (말이산고분군)',
    HAMAN_MARI,
    [HAMAN_MARI_2, HAMAN_MARI_3],
  ),
  'local-scenic:haman-gugyeong:악양의꽃길과노을': localScenicPhotoOverlay(
    '함안9경 제2경 악양의 꽃길과 노을은 법수면 남강 변 악양둑방입니다. 함안군은 2009년 둑방길을 조성했고, 봄에는 양귀비·안개꽃, 가을에는 코스모스·메밀이 핍니다. 한국관광공사는 둑방 너머 악양루에서 바라보는 남강 노을이 깊다고 적습니다. 왕복 약 6.5km 둑방 산책과 꽃밭 위 경비행 풍경이 짝을 이룹니다.',
    '경상남도 함안군 법수면 윤외리 73-4 (악양둑방)',
    HAMAN_AGYANG_POPPY,
    [HAMAN_AGYANG_SUNSET, HAMAN_AGYANG_MAY],
  ),
  'local-scenic:haman-gugyeong:무진정의사계': localScenicPhotoOverlay(
    '함안9경 제4경 무진정의 사계는 함안면 괴산리 충노담 언덕 위 정자입니다. 디지털함안문화대전은 조삼이 후학을 위해 짓고 호를 따 이름 붙였으며, 경상남도 유형문화유산이라고 적습니다. 왕버들 연못과 정자가 사철 바뀌고, 매년 함안낙화놀이가 연등과 숯가루 불꽃을 물 위에 뿌립니다. 말이산고분군과 가까운 사진 명소입니다.',
    '경상남도 함안군 함안면 괴산4길 25 (괴산리)',
    HAMAN_MUJIN,
    [HAMAN_MUJIN_2, HAMAN_MUJIN_NAKWA],
  ),
  'local-scenic:haman-gugyeong:연꽃테마파크의아라홍련': localScenicPhotoOverlay(
    '함안9경 제5경 연꽃테마파크의 아라홍련은 가야읍 옛 늪지를 활용한 공원입니다. 한국관광공사에 따르면 2013년 개장했고, 2009년 성산산성에서 나온 고려 시대 연씨를 함안박물관이 피워 아라홍련이라 이름 붙였습니다. 홍련·백련·수련·가시연과 함안에서만 보는 아라홍련이 7~8월에 핍니다. 징검다리와 정자에서 가까이 볼 수 있습니다.',
    '경상남도 함안군 가야읍 왕궁1길 38-20',
    HAMAN_LOTUS,
    [HAMAN_LOTUS_2, HAMAN_LOTUS_3],
  ),
  'local-scenic:haman-gugyeong:장춘사의산사풍경': localScenicPhotoOverlay(
    '함안9경 제7경 장춘사의 산사풍경은 칠북면 무릉산 자락 고찰입니다. 디지털함안문화대전은 832년(흥덕왕 7) 무염국사가 초창했다고 전하며, 대웅전·약사전의 석조 여래와 오층석탑이 경상남도 유형문화유산입니다. 계곡을 따라 오르는 산사와 약수가 고요하고, 신증동국여지승람에도 칠원현 대표 사찰로 적혀 있습니다.',
    '경상남도 함안군 칠북면 북원로 110-1 (영동리)',
    HAMAN_JANGCHUN,
    [HAMAN_JANGCHUN_2, HAMAN_JANGCHUN_3],
  ),
  'local-scenic:haman-gugyeong:합강정과반구정의해돋이': localScenicPhotoOverlay(
    '함안9경 제8경 합강정과 반구정의 해돋이는 대산면 용화산 기슭 낙동강 변입니다. 디지털함안문화대전에 따르면 합강정은 1633년 조임도가 수학하던 정자로, 남강과 낙동강이 합류한다 하여 이름 붙었습니다. 반구정은 정유재란 뒤 조방이 말바위 위에 세웠고 1858년 지금 자리로 옮겼습니다. 강에서 떠오르는 해와 남지철교·들판 조망이 짝을 이룹니다.',
    '경상남도 함안군 대산면 구암로 469 (장암리, 합강정) · 구암4길 116-2 (반구정)',
    HAMAN_DAESAN_WALK,
    [HAMAN_AGYANG_ECO_2, HAMAN_AGYANG_ECO_3],
  ),
  'local-scenic:haman-gugyeong:대평늪의늪지식물': localScenicPhotoOverlay(
    '함안9경 제9경 대평늪의 늪지식물은 법수면 대송리 남강 배후습지입니다. 디지털함안문화대전은 함안 대송리 늪지식물을 우리나라에서 늪지 식물대를 천연기념물로 지정한 곳으로 적으며, 지정 면적 약 3만 3,911㎡·수심 1.5~2m에 가시연꽃·자라풀 등 21종이 산다고 합니다. 광주 안씨가 풍수에 따라 늪을 지켜 오늘에 이릅니다.',
    '경상남도 함안군 법수면 대송리 883-1 (함안 대송리 늪지식물)',
    HAMAN_AGYANG_ECO,
    [HAMAN_AGYANG_ECO_4, HAMAN_AGYANG_ECO_5],
  ),
  'local-scenic:sacheon-gugyeong:삼천포대교와사천바다케이블카': localScenicPhotoOverlay(
    '사천9경 제1경 삼천포대교와 사천바다케이블카는 대방동과 남해 창선을 잇는 연륙교와 해상 케이블카입니다. 디지털사천문화대전은 창선·삼천포대교가 모개섬·초양도·늑도를 잇는 최초 연륙교이며 낮의 한려해상과 밤 야경으로 「한국의 아름다운 길 100선」에 올랐다고 적습니다. 사천바다케이블카는 각산·바다·초양도를 잇는 국내 최초 코스로 왕복 약 25분입니다.',
    '경상남도 사천시 사천대로 18 (대방동, 사천바다케이블카)',
    SACHEON_CABLE,
    [SACHEON_BRIDGE, SACHEON_CABLE_2],
  ),
  'local-scenic:sacheon-gugyeong:남일대코끼리바위': localScenicPhotoOverlay(
    '사천9경 제3경 남일대 코끼리바위는 남일대해수욕장 동쪽 끝의 기암입니다. 디지털사천문화대전은 코끼리가 코를 박고 바닷물을 마시는 형상이며, 코와 몸 사이 천연 동굴로 파도가 넘실거린다고 적습니다. 신라 말 최치원이 남해 으뜸 절경이라 하여 남일대(南一臺)라 이름 붙였다는 이야기가 전합니다. 은빛 백사장과 병풍 절벽이 한 폭입니다.',
    '경상남도 사천시 모례2길 11-19 (향촌동, 남일대해수욕장)',
    SACHEON_NAMIL,
    [SACHEON_NAMIL_2, SACHEON_NAMIL_3],
  ),
  'local-scenic:sacheon-gugyeong:선진리성벚꽃': localScenicPhotoOverlay(
    '사천9경 제4경 선진리성 벚꽃은 용현면 사천선진리성입니다. 디지털사천문화대전은 고려 12조창 통양창을 지키려 쌓았으나 임진왜란 때 왜군이 왜성으로 고쳤다고 적습니다. 토성과 문지·장대 흔적이 남아 있고, 1,000여 그루 벚나무가 봄철 사천의 대표 볼거리입니다. 성벽을 따라 이충무공 사천해전 승첩비와 전적기념비가 이어집니다.',
    '경상남도 사천시 용현면 선진리 770 일원 (사천선진리성)',
    SACHEON_SEONJIN,
    [SACHEON_SEONJIN_2, SACHEON_SEONJIN_3],
  ),
  'local-scenic:sacheon-gugyeong:봉명산다솔사': localScenicPhotoOverlay(
    '사천9경 제6경 봉명산 다솔사는 곤명면 1,500여 년 고찰입니다. 디지털사천문화대전은 임진왜란 승병의 자리이자 만해 한용운이 「독립선언서」 초안을 쓴 곳, 김동리가 소설 『등신불』의 모티브를 얻은 곳이라고 적습니다. 영조 때 대양루와 극락전·응진전이 남아 봉명산 솔숲과 어우러집니다. 역사와 산사 경치가 같이 남는 사천의 고찰입니다.',
    '경상남도 사천시 곤명면 다솔사길 417',
    SACHEON_DASOL,
    [SACHEON_DASOL_2, SACHEON_DASOL_3],
  ),
  'local-scenic:sacheon-gugyeong:비토섬갯벌': localScenicPhotoOverlay(
    '사천9경 제8경 비토섬 갯벌은 서포면 비토리의 연륙 섬 갯벌입니다. 디지털사천문화대전은 『별주부전』 전설이 전하는 섬이며, 나타났다 사라지는 갯벌이 천연자원의 보고라고 적습니다. 하봉마을과 월등도는 하루 두 차례 바닷길이 열리고, 모래·자갈·진흙·바위가 섞인 갯벌에서 생태 체험을 할 수 있습니다. 다리로 육지와 이어집니다.',
    '경상남도 사천시 서포면 비토리 (비토섬 갯벌)',
    SACHEON_BITO,
    [SACHEON_BITO_2, SACHEON_BITO_3],
  ),
  'local-scenic:sacheon-gugyeong:용두공원과청룡사겹벚꽃': localScenicPhotoOverlay(
    '사천9경 제9경 용두공원과 청룡사 겹벚꽃은 와룡산 자락의 공원과 사찰입니다. 디지털사천문화대전은 2023년 사천8경에 더해진 구경이며, 4월 청룡사 진입로에 겹벚꽃이 터널을 이룬다고 적습니다. 용두공원은 2009년 삼천포천·와룡저수지 아래 조성되어 편백숲·바닥분수·풍차·데크가 있습니다. 차로 약 10분 거리의 벚꽃과 친수 공원이 한 경입니다.',
    '경상남도 사천시 용강동 (용두공원) · 와룡산 자락 청룡사',
    SACHEON_YONGDU,
    [SACHEON_YONGDU_2, SACHEON_YONGDU_3],
  ),
  'local-scenic:inje-palgyeong:대청봉': localScenicPhotoOverlay(
    '인제8경 제1경 대청봉은 설악산 최고봉으로 기암괴석과 대자연의 파노라마가 어우러진 명승입니다. 인제군 문화관광은 국립공원·유네스코 생물권 보존지역으로 지정된 설악산 정상 일대를 인제 8경의 첫 경으로 소개합니다. 양양 10경 「설악산 대청봉」과 동일 산정이나 인제군 팔경 명칭은 「대청봉」입니다.',
    '강원특별자치도 인제군 북면·인제읍 일원 (설악산 대청봉)',
    INJE_DCB,
    [],
    INJE_SCENICS_HOME,
  ),
  'local-scenic:inje-palgyeong:내린천계곡': localScenicPhotoOverlay(
    '인제8경 제5경 내린천계곡은 푸른 물줄기와 기암괴석이 어우른 선경으로, 맑은 내린천 상류 계곡이 널리 알려진 곳입니다. 인제군은 우리나라에서 가장 아름답고 깨끗한 계곡을 꼽을 때 인제 내린천을 든다고 소개합니다.',
    '강원특별자치도 인제군 기린면·상남면 내린천 일원',
    INJE_NAERIN_VALLEY,
    [],
    INJE_SCENICS_HOME,
  ),
  'local-scenic:inje-palgyeong:방동약수': localScenicPhotoOverlay(
    '인제8경 제6경 방동약수는 기린면 방동리에 있으며 약 300년 전 발견된 명품 약수로 소개됩니다. 인제군은 물맛과 강원도 정취를 함께 느낄 수 있는 명소로 안내합니다.',
    '강원특별자치도 인제군 기린면 방동리 (방동약수)',
    INJE_BANGDONG_SPRING,
    [],
    INJE_SCENICS_HOME,
  ),
  'local-scenic:icheon-gugyeong:노성산말머리바위': localScenicPhotoOverlay(
    '이천9경 제8경 노성산 말머리바위는 설성면·안성 일죽면에 걸친 노성산 7부 능선의 바위입니다. 이천시 문화관광에 따르면 노성·마국·설성 세 산 장수가 말을 나눠 가진 전설에서 노성산 장수가 머리를 차지했고, 말 머리 형상의 바위와 병풍바위·굴바위가 있습니다. 산행은 약 2시간이며 산 아래 노성산시민공원이 있습니다.',
    '경기도 이천시 설성면 진상미로 238-7 (노성산)',
    ICHEON_NOSEONG,
    [ICHEON_NOSEONG_2, ICHEON_NOSEONG_3],
  ),
  'local-scenic:icheon-gugyeong:도드람산삼봉': localScenicPhotoOverlay(
    '이천9경 제1경 도드람산 삼봉은 마장면 일명 저명산(猪鳴山)입니다. 이천시 문화관광은 효자가 석이를 따다 산돼지 울음으로 밧줄이 끊기기 전에 올라왔다는 전설에서 돗울음산이 도드람산이 되었다고 적습니다. 해발 349m 주능선이 바위로 이루어졌고, 정상 부근 세 봉우리가 이천의 대표 절경입니다.',
    '경기도 이천시 마장면 장암리 산144 일원',
    ICHEON_DODEURAM,
    [ICHEON_DODEURAM_2, ICHEON_DODEURAM_3],
  ),
  'local-scenic:icheon-gugyeong:반룡송': localScenicPhotoOverlay(
    '이천9경 제6경 반룡송은 백사면 도립리의 소나무로, 이천시는 1996년 천연기념물 제381호에 지정되었다고 적습니다. 하늘에 오르기 전 땅에 서린 용이라는 뜻이며, 지상 2m에서 가지가 사방으로 갈라져 용틀임합니다. 신라 말 도선이 심은 만년송으로 전하고, 키에 비해 수형이 넓어 생물학적 자료 가치도 높습니다.',
    '경기도 이천시 백사면 원적로 910 (도립리 반룡송)',
    ICHEON_BANRYONG,
    [ICHEON_BANRYONG_2, ICHEON_BANRYONG_3],
  ),
  'local-scenic:icheon-gugyeong:사기막골도예촌': localScenicPhotoOverlay(
    '이천9경 제9경 사기막골도예촌은 사음동·신둔면 일대 도자 마을입니다. 한국관광공사에 따르면 사기막골은 예부터 사기를 굽던 골짜기라는 뜻이며, 입구 도자 조형물에서 공방·상점 수십 곳이 이어집니다. 이천시는 경충대로 2995 일원을 구경으로 두었고, 끊겼던 전통 도자 기법을 재현하는 공방이 모인 이천 도예의 얼굴입니다.',
    '경기도 이천시 경충대로2993번길 56 (사음동, 사기막골도예촌)',
    ICHEON_SAGIMAK,
    [ICHEON_SAGIMAK_2, ICHEON_SAGIMAK_3],
  ),
  'local-scenic:icheon-gugyeong:설봉산삼형제바위': localScenicPhotoOverlay(
    '이천9경 제3경 설봉산 삼형제 바위는 관고동 설봉산 등산로 입구에서 약 15분 거리의 세 바위입니다. 이천시 문화관광은 나란히 선 커다란 세 바위로, 효심 깊은 삼형제가 호랑이에게 쫓기는 어머니를 구하려 절벽에서 뛰어내려 바위로 변했다는 전설을 전합니다. 이천 시가지를 품은 진산 중턱의 대표 기암입니다.',
    '경기도 이천시 관고동 산66-1 일원 (설봉산)',
    ICHEON_SAMHYEONGJE,
    [ICHEON_SAMHYEONGJE_2, ICHEON_SAMHYEONGJE_3],
  ),
  'local-scenic:icheon-gugyeong:애련정': localScenicPhotoOverlay(
    '이천9경 제7경 애련정은 안흥동 안흥지 위의 정자입니다. 이천시 문화관광에 따르면 부사 이세보가 중건하고 신숙주에게 애련정이라는 이름을 얻었으며, 1998년 이천시가 복원했습니다. 조선왕조실록에는 중종의 양로연과 숙종·영조·정조의 방문이 남아 있고, 연못과 단청 정자가 시민의 휴식 공간이 됩니다.',
    '경기도 이천시 안흥동 404 (안흥지 애련정)',
    ICHEON_AERYEON,
    [ICHEON_AERYEON_2, ICHEON_AERYEON_3],
  ),
  'local-scenic:changnyeong-gugyeong:우포늪과따오기': localScenicPhotoOverlay(
    '창녕구경 제1경 우포늪과 따오기는 유어·이방·대합·대지 네 면에 걸친 국내 최대 내륙습지입니다. 한국관광공사는 면적 약 250만 5,000㎡, 1998년 람사르습지 등록과 2018년 세계 최초 람사르습지도시 인증을 적습니다. 창녕군은 2008년 유어면 따오기복원센터를 열고 중국에서 기증받은 천연기념물 따오기를 증식·복원하고 있습니다.',
    '경상남도 창녕군 유어면 우포늪길 220 (우포늪) · 유어면 세진리 355 (따오기복원센터)',
    CNG_UPO,
    [CNG_UPO_2, CNG_UPO_3],
  ),
  'local-scenic:changnyeong-gugyeong:화왕산억새와진달래': localScenicPhotoOverlay(
    '창녕구경 제2경 화왕산 억새와 진달래는 창녕읍 옥천리 화왕산군립공원입니다. 한국관광공사에 따르면 정상 둘레에 화왕산성이 있고, 봄에는 수십만 평 진달래·철쭉, 가을에는 억새초원이 장관입니다. 창녕군은 한국의 100대 명산으로 봄 진달래와 가을 은빛 억새를 구경으로 꼽습니다.',
    '경상남도 창녕군 창녕읍 옥천리 (화왕산군립공원)',
    CNG_HWAWANG,
    [CNG_HWAWANG_2, CNG_HWAWANG_3],
  ),
  'local-scenic:changnyeong-gugyeong:낙동강유채축제와남지개비리': localScenicPhotoOverlay(
    '창녕구경 제4경 낙동강유채축제와 남지개비리는 남지읍 낙동강 변입니다. 한국관광공사는 유채단지가 전국 단일면적 최대 약 110ha이며 2006년부터 창녕낙동강유채축제를 연다고 적습니다. 남지개비리길은 용산·영아지 마을을 잇는 순환 트레킹으로, 창나루에서 전망대·쉼터를 돌아 약 2시간 30분입니다.',
    '경상남도 창녕군 남지읍 남지강변길 177 (유채단지) · 용산리 160-2 (남지개비리길)',
    CNG_RAPESEED,
    [CNG_GAEBIRI, CNG_GAEBIRI_2],
  ),
  'local-scenic:changnyeong-gugyeong:만옥정공원과신라진흥왕척경비,술정리동삼층석탑': localScenicPhotoOverlay(
    '창녕구경 제6경 만옥정공원과 신라진흥왕척경비, 술정리동삼층석탑은 창녕읍 도심 문화유산입니다. 한국관광공사에 따르면 만옥정공원은 봄 벚꽃 명소이며, 언덕에 국보 창녕 신라 진흥왕 척경비(561년경, 1924년 이전)가 있습니다. 인근 술정리 동 삼층석탑은 통일신라 이중기단 삼층석탑으로, 국가유산청은 경주 불국사 석탑에 비길 기품이 있다고 적습니다.',
    '경상남도 창녕군 창녕읍 교상리 28-34 (만옥정공원) · 시장2길 37 (술정리 동 삼층석탑)',
    CNG_MANOK,
    [CNG_PAGODA, CNG_MANOK_2],
  ),
  'local-scenic:changnyeong-gugyeong:교동과송현동고분군': localScenicPhotoOverlay(
    '창녕구경 제7경 교동과 송현동고분군은 창녕읍 교리·송현리의 비화가야 대형 고분군입니다. 한국관광공사·국가유산청에 따르면 150여 기가 확인되고 5~6세기가 중심이며, 진한 불사국(비사벌) 터로 알려져 있습니다. 2011년 사적으로 묶였고, 2023년 가야고분군 세계유산의 구성 유산입니다.',
    '경상남도 창녕군 창녕읍 창밀로 34 (교동과 송현동 고분군)',
    CNG_TOMB,
    [CNG_TOMB_2, CNG_TOMB_3],
  ),
  'local-scenic:changnyeong-gugyeong:3·1민속문화제와영산만년교': localScenicPhotoOverlay(
    '창녕구경 제8경 3·1민속문화제와 영산만년교는 영산면입니다. 한국민족문화대백과에 따르면 축제는 1961년부터 3월 1일 전후 나흘간 열리며, 중심은 국가무형유산 영산쇠머리대기와 영산줄다리기입니다. 한국관광공사는 영산 만년교를 1780년 석수 백진기가 쌓고 1892년 중수한 무지개 홍예 돌다리(보물)로 적습니다.',
    '경상남도 창녕군 영산면 원다리길 42 (영산 만년교) · 영산면 일원 (3·1민속문화제)',
    CNG_MANNYEON,
    [CNG_MANNYEON_2, CNG_MANNYEON_3],
  ),
  'local-scenic:jinju-palgyeong:남강의암': localScenicPhotoOverlay(
    '진주8경 제2경 남강 의암은 진주성 촉석루 암벽 아래 남강 물속의 바위입니다. 디지털진주문화대전에 따르면 임진왜란 전까지 위암이라 불렀고, 제2차 진주성전투에서 성이 함락되자 논개가 왜장을 유인해 껴안고 투신한 뒤 의암이 되었습니다. 윗면은 3.65m×3.3m이고, 서쪽면에 정대륭이 새긴 의암 글자가 있습니다. 진주시 문화관광은 진주성(남강로 626) 안에서 본다고 적습니다.',
    '경상남도 진주시 남강로 626 (본성동, 진주성)',
    JINJU_UIAM,
    [JINJU_UIAM_2, JINJU_UIAM_3],
  ),
  'local-scenic:jinju-palgyeong:뒤벼리': localScenicPhotoOverlay(
    '진주8경 제3경 뒤벼리는 상대동에서 옥봉동까지 남강 변 절벽입니다. 디지털진주문화대전은 벼랑을 뜻하는 벼리에 뒤를 붙여 뒤에 있는 벼랑이라 하며, 진주성 동쪽 기슭을 흐르던 남강이 오른쪽으로 휘돌아 병풍처럼 깎은 절경이라고 적습니다. 제3경은 남가람문화거리와 짝을 이룹니다. 진주시 주소는 남강로 일원입니다.',
    '경상남도 진주시 남강로 일원 (상대동·옥봉동, 뒤벼리)',
    JINJU_DWIBYORI,
    [JINJU_DWIBYORI_2, JINJU_DWIBYORI_3],
  ),
  'local-scenic:jinju-palgyeong:새벼리': localScenicPhotoOverlay(
    '진주8경 제4경 새벼리는 가좌동에서 시내로 들어오는 길목의 벼랑입니다. 디지털진주문화대전은 동쪽에 있는 벼랑이라는 뜻이며, 남해고속도로에서 진주로 들어오던 관문이라고 적습니다. 정상 석류공원에서 비봉산·뒤벼리·선학산과 남강이 한눈에 들어옵니다. 진주시 주소는 진주대로 685(가좌동)입니다.',
    '경상남도 진주시 진주대로 685 (가좌동, 석류공원·새벼리)',
    JINJU_SAEBYEORI,
    [JINJU_SAEBYEORI_2, JINJU_SAEBYEORI_3],
  ),
  'local-scenic:jinju-palgyeong:망진산봉수대': localScenicPhotoOverlay(
    '진주8경 제5경 망진산 봉수대는 망경동 망진산(망경산, 172.4m) 정상 아래입니다. 디지털진주문화대전에 따르면 조선 초기 망진봉수로 제2직봉의 간봉이었고, 1895년 폐지된 뒤 1995~1996년 시민 성금으로 복원했습니다. 진주시는 2025년 8월 말 5연조 봉수대와 방호벽을 완공했다고 적습니다. 주소는 봉수대길 116입니다.',
    '경상남도 진주시 봉수대길 116 (망경동, 망진산 봉수대)',
    JINJU_MANGJIN,
    [JINJU_MANGJIN_2, JINJU_MANGJIN_3],
  ),
  'local-scenic:jinju-palgyeong:비봉산의봄': localScenicPhotoOverlay(
    '진주8경 제6경 비봉산의 봄은 상봉동 진산 비봉산(138m)입니다. 디지털진주문화대전은 남쪽에 시가지·진주성·남강이 이어지고, 비봉공원과 동쪽 의곡사·연화사, 서쪽 비봉루·봉산사가 있다고 적습니다. 옛 진주12경의 비봉청람은 묵은 나무에 새순이 돋는 봄 풍경입니다. 진주시 주소는 상봉동·초장동 일원입니다.',
    '경상남도 진주시 상봉동·초장동 일원 (비봉산)',
    JINJU_BIBONG,
    [JINJU_BIBONG_2, JINJU_BIBONG_3],
  ),
  'local-scenic:jinju-palgyeong:월아산해돋이': localScenicPhotoOverlay(
    '진주8경 제7경 월아산 해돋이는 진성면·금산면·문산읍에 걸친 월아산(달음산, 482m)입니다. 디지털진주문화대전은 달이 떠오르는 모양의 산으로 1986년 도시자연공원 지정, 정상 장군대는 기우제터이자 임진왜란 김덕령 목책성 본영이라고 적습니다. 산행은 약 4.6km·1시간 30분~2시간입니다. 진주시 주소는 진성면 달음산로 313입니다.',
    '경상남도 진주시 진성면 달음산로 313 (월아산)',
    JINJU_WOLA,
    [JINJU_WOLA_2, JINJU_WOLA_3],
  ),
  'local-scenic:jincheon-palgyeong:평사낙안': localScenicPhotoOverlay(
    '상산팔경 제1경 평사낙안은 문백면 평산리 미호천 백사장입니다. 디지털진천문화대전에 따르면 흰 모래가 십리에 펼쳐지고 기암과 기러기 떼가 앉는 절경이며, 통산별업팔경의 하나입니다. 인문지리는 미호천·백곡천·초평천이 만나는 평사리에서 소두머니까지를 평사십리라 적습니다. 진천군 주소는 문백면 평산리 일원입니다.',
    '충청북도 진천군 문백면 평산리 일원 (미호천 백사장)',
    JC_PYEONGSA,
    [JC_PYEONGSA_2, JC_PYEONGSA_3],
  ),
  'local-scenic:jincheon-palgyeong:우담제월': localScenicPhotoOverlay(
    '상산팔경 제2경 우담제월은 문백면 은탄리 우담입니다. 디지털진천문화대전은 우담을 은탄리의 큰 호수, 제월을 비가 개인 뒤의 달이라 하며, 티 없이 맑은 호숫가 달빛이 상산팔경의 하나라고 적습니다. 인문지리는 소두머니를 우담의 다른 이름이라 합니다. 봄여름 휴식처로도 불립니다.',
    '충청북도 진천군 문백면 은탄리 (우담·소두머니)',
    JC_UDAM,
    [JC_UDAM_2, JC_UDAM_3],
  ),
  'local-scenic:jincheon-palgyeong:금계완사': localScenicPhotoOverlay(
    '상산팔경 제3경 금계완사는 광혜원면 광혜원리 금계입니다. 디지털진천문화대전은 금계 물가에서 빨래하는 풍경을 읊은 한시이며, 충청도관찰사가 경질될 때 신·구 관찰사가 도장을 주고받던 곳이라고 적습니다. 금계완사(錦溪浣紗)는 비단 시내에서 비단옷을 입고 놀던 정취입니다. 진천군 문화관광도 광혜원리 금계 물가를 가리킵니다.',
    '충청북도 진천군 광혜원면 광혜원리 (금계)',
    JC_GEUMGYE,
    [JC_GEUMGYE_2, JC_GEUMGYE_3],
  ),
  'local-scenic:jincheon-palgyeong:상산모운': localScenicPhotoOverlay(
    '상산팔경 제5경 상산모운은 이월면 사곡리 상산입니다. 디지털진천문화대전은 유수응의 한시 「상산모운(常山暮雲)」이 저녁노을과 구름이 상산 허리를 감싸는 정경이며, 벽오팔경 제1경이기도 하다고 적습니다. 인문지리는 상선모운(常仙暮雲)으로도 전합니다. 사진은 같은 군 만뢰산 보탑사 공식 사진으로 근사했습니다.',
    '충청북도 진천군 이월면 사곡리 일원 (상산)',
    JC_SANGSAN,
    [JC_SANGSAN_2, JC_SANGSAN_3],
  ),
  'local-scenic:jincheon-palgyeong:어은계석': localScenicPhotoOverlay(
    '상산팔경 제7경 어은계석은 문백면 봉죽리 어은동 계곡입니다. 진천군 문화관광은 송강 정철 묘소가 있는 계곡 풍경이라 적습니다. 디지털진천문화대전에 따르면 1665년 묘를 환희산 동쪽으로 옮기며 정송강사가 들어섰고, 어은마을은 연일 정씨 세거지입니다. 주소는 송강로 523(정송강사)입니다.',
    '충청북도 진천군 문백면 봉죽리 562 (송강로 523, 정송강사)',
    JC_EOEUN,
    [JC_EOEUN_2, JC_EOEUN_3],
  ),
  'local-scenic:jincheon-palgyeong:적대청람': localScenicPhotoOverlay(
    '상산팔경 제8경 적대청람은 문백면 평산리 백사장 암벽입니다. 디지털진천문화대전은 한원진이 암벽 위 정자에서 지은 「적대청람(笛臺晴嵐)」이며, 신선이 피리를 불다 간 자리라고 적습니다. 지금은 정자 흔적만 남고 높은 대에서 푸른 물을 굽어봅니다. 진천군은 화창한 날 아지랑이를 구경으로 적습니다.',
    '충청북도 진천군 문백면 평산리 일원 (백사장 암벽)',
    JC_JEOKDAE,
    [JC_JEOKDAE_2, JC_JEOKDAE_3],
  ),
  'local-scenic:gurye-other:노고단운해': localScenicPhotoOverlay(
    '구례10경 제1경 노고단 운해는 산동면 성삼재에서 오르는 지리산 서봉 노고단(1,507m)입니다. 구례군 문화관광은 천왕봉·반야봉과 함께 지리산 3대 주봉이자 영봉이라 적으며, 남쪽에서 구름과 안개가 파도처럼 밀려와 노고단을 감쌀 때 구름 바다가 장관을 이룬다고 합니다. 한국관광공사에 따르면 정상 탐방은 예약제이며, 주소는 산동면 노고단로 1068(성삼재)입니다.',
    '전라남도 구례군 산동면 노고단로 1068 (성삼재·노고단)',
    GYE_NOGO_UNHAE,
    [GYE_NOGO_UNHAE_2, GYE_NOGO_UNHAE_3],
  ),
  'local-scenic:gurye-other:반야봉낙조': localScenicPhotoOverlay(
    '구례10경 제2경 반야봉 낙조는 해발 1,732m 지리산 제2봉입니다. 구례군 문화관광은 노고단에서 임걸령으로 이어지는 능선 동북방 약 5.5km의 지리산권 중심에 있어 전경을 한눈에 조망하고, 해질 녘 낙조가 번뇌를 사그라뜨린다고 적습니다. 한국관광공사는 남원시 산내면과 구례군 산동면 사이 서부 지리산 최고봉이며, 반야봉에서 본 낙조를 지리산 팔경의 하나로 적습니다.',
    '전라남도 구례군 산동면 노고단로 1068 일원 (반야봉·성삼재 접근)',
    GYE_BANYA,
    [GYE_BANYA_2, GYE_BANYA_3],
  ),
  'local-scenic:gurye-other:피아골단풍': localScenicPhotoOverlay(
    '구례10경 제3경 피아골 단풍은 토지면 연곡사 위 지리산 최대 활엽수림 계곡입니다. 구례군 문화관광은 연곡사를 지나 약 4km를 오르면 피아골이며, 산·물·사람이 붉게 물드는 삼홍의 명소라고 적습니다. 한국관광공사에 따르면 반야봉 중턱에서 발원한 물이 임걸령·피아골 삼거리·연곡사를 지나 섬진강으로 흐르고, 10월 중순부터 11월 초 단풍이 지리산 10경의 하나입니다.',
    '전라남도 구례군 토지면 내서리 (피아골로·연곡사)',
    GYE_PIAGOL,
    [GYE_PIAGOL_2, GYE_PIAGOL_3],
  ),
  'local-scenic:gurye-other:산동산수유꽃': localScenicPhotoOverlay(
    '구례10경 제5경 산동 산수유꽃은 산동면 위안·월계 일대입니다. 구례군 문화관광은 산수유가 2월 말부터 4월 초까지 피고, 11월에는 붉은 열매가 열리며 전국 생산량의 큰 몫을 차지한다고 적습니다. 한국관광공사에 따르면 위안월계 산수유마을 산수유는 전국의 70% 이상을 점유하고, 봄 산수유꽃축제와 가을 열매 축제가 열립니다.',
    '전라남도 구례군 산동면 위안리 (위안월계 산수유마을)',
    GYE_SANDONG,
    [GYE_SANDONG_2, GYE_SANDONG_3],
  ),
  'local-scenic:gurye-other:노고단설경': localScenicPhotoOverlay(
    '구례10경 제10경 노고단 설경은 같은 봉우리 겨울 설화입니다. 구례군 문화관광은 정상을 길상봉이라고도 하며, 선도성모를 모시던 남악사가 있어 산신 할머니의 단이라는 뜻의 노고단이라 이름 붙였다고 적습니다. 봄 철쭉·여름 원추리와 운해·가을 단풍과 함께 겨울 눈꽃이 철따라 극치를 이루고, 화엄사·천은사·만복대·피아골 코스가 이곳을 지납니다.',
    '전라남도 구례군 산동면 노고단로 1068 (노고단·성삼재)',
    GYE_NOGO_SNOW,
    [GYE_NOGO_SNOW_2, GYE_NOGO_SNOW_3],
  ),
  'local-scenic:gangjin-other:월출산': localScenicPhotoOverlay(
    '강진12경 제6경 월출산은 강진군 성전면과 영암군 경계의 국립공원입니다. 강진군 문화관광은 호남의 소금강이라 부르며 해발 809m 천황봉과 구정봉·장군봉·사자봉이 이어지고, 산행 기점은 성전면 월남리 경포대라고 적습니다. 한국관광공사 금릉경포대 안내에 따르면 천황봉·구정봉에서 흘러내리는 물줄기가 무명베를 늘어놓은 듯하여 경포대라 하며, 주소는 성전면 백운로 148-4(경포대지구)입니다.',
    '전라남도 강진군 성전면 백운로 148-4 (월출산국립공원 경포대지구)',
    GJ_WOLCHUL,
    [GJ_WOLCHUL_2, GJ_WOLCHUL_3],
  ),
  'local-scenic:gangjin-other:가학산': localScenicPhotoOverlay(
    '강진12경 제7경 가학산은 해남·영암·강진 성전면이 맞닿는 575m 바위산입니다. 디지털해남문화대전은 산세가 학이 나는 모습이라 가학산이라 하며, 정상은 돔형 바위 봉이고 북동쪽으로 월출산이 보인다고 적습니다. 강진 쪽 들머리는 성전면 월평리 제전마을입니다. 사진은 같은 능선 흑석산자연휴양림(옛 가학산) 한국관광공사 공식 사진으로 근사했습니다.',
    '전라남도 강진군 성전면 월평리 (제전마을·가학산 들머리)',
    GJ_GAHAK,
    [GJ_GAHAK_2, GJ_GAHAK_3],
  ),
  'local-scenic:gangjin-other:백야김좌진기념관': localScenicPhotoOverlay(
    '강진12경 제8경 백야김좌진기념관은 독립운동가 백야 김좌진 장군을 기리는 기념관입니다. 한국관광공사에 따르면 백야기념관은 충남 홍성군 갈산면 백야로546번길 12에 있으며, 청산리 전투를 이끈 생애와 계몽·독립운동을 전시합니다. 사진은 한국관광공사 백야기념관 공식 사진입니다.',
    '충청남도 홍성군 갈산면 백야로546번길 12 (백야기념관)',
    GJ_BAEKYA,
    [GJ_BAEKYA_2, GJ_BAEKYA_3],
  ),
  'local-scenic:gangjin-other:남도별미식문화박물관': localScenicPhotoOverlay(
    '강진12경 제9경 남도별미식문화박물관은 남도 별미·식문화를 다루는 시설명입니다. 강진군은 사의재 한옥체험관과 저잣거리에서 전통 먹거리·체험을 안내하며, 사의재는 다산 정약용이 유배 초기 머문 집입니다. 주소는 강진읍 사의재길 27입니다. 사진은 같은 읍 사의재 공식 사진으로 근사했습니다.',
    '전라남도 강진군 강진읍 사의재길 27 (사의재 저잣거리)',
    GJ_NAMDO,
    [GJ_NAMDO_2, GJ_NAMDO_3],
  ),
  'local-scenic:gangjin-other:강진청자박물관': localScenicPhotoOverlay(
    '강진12경 제10경 강진청자박물관은 대구면 고려청자박물관입니다. 강진군 문화관광에 따르면 1997년 개관해 청자요지와 고려청자 문화유산을 보존·전시하며, 고려 500여 년 청자 생산지이자 2007년 태안 죽도 목간에 탐진(강진)이 확인되었습니다. 주소는 대구면 청자촌길 33입니다.',
    '전라남도 강진군 대구면 청자촌길 33 (고려청자박물관)',
    GJ_CELADON,
    [GJ_CELADON_2, GJ_CELADON_3],
  ),
  'local-scenic:gangjin-other:청자단지': localScenicPhotoOverlay(
    '강진12경 제12경 청자단지는 대구면 고려청자촌입니다. 강진군 문화관광은 청자요지·고려청자박물관·공방·판매장이 한곳에 모인 단지라고 안내하며, 고려 때 청자를 굽던 가마터가 사적으로 남아 있습니다. 주소는 대구면 청자촌길 일원입니다. 사진은 한국관광공사 고려청자박물관 단지 공식 사진입니다.',
    '전라남도 강진군 대구면 청자촌길 일원 (고려청자촌)',
    GJ_VILLAGE,
    [GJ_VILLAGE_2, GJ_VILLAGE_3],
  ),
  'local-scenic:gunsan-palgyeong:선유낙조': localScenicPhotoOverlay(
    '선유8경 제1경 선유낙조는 선유도 망주봉과 해수욕장에서 바라보는 서해 석양입니다. 군산시 문화관광은 점점이 떠 있는 섬 사이 수평선으로 해가 질 때 하늘과 바다가 불바다를 이룬다고 적습니다. 국가유산청 명승 「군산 선유도 망주봉 일원」 안내에 따르면 하늘과 바다가 붉은 색조로 변하여 서해 낙조기관 중 으뜸입니다. 주소는 옥도면 선유도1길 106-4(망주봉 일원)입니다.',
    '전북특별자치도 군산시 옥도면 선유도1길 106-4 (망주봉 일원)',
    GS_NAKJO,
    [GS_NAKJO_2, GS_NAKJO_3],
  ),
  'local-scenic:gunsan-palgyeong:명사십리': localScenicPhotoOverlay(
    '선유8경 제2경 명사십리는 선유도해수욕장의 백사장입니다. 군산시 문화관광은 유리알처럼 고운 천연 모래가 10여 리에 펼쳐져 명사십리 해수욕장으로도 불린다고 적습니다. 한국관광공사에 따르면 100여 m를 들어가도 수심이 허리까지뿐이고 파도가 낮아 물놀이에 안전합니다. 주소는 옥도면 선유도리입니다.',
    '전북특별자치도 군산시 옥도면 선유도리 (선유도해수욕장)',
    GS_MYEONGSA,
    [GS_MYEONGSA_2, GS_MYEONGSA_3],
  ),
  'local-scenic:gunsan-palgyeong:망주폭포': localScenicPhotoOverlay(
    '선유8경 제3경 망주폭포는 해발 152m 망주봉 암벽입니다. 군산시 문화관광은 바위 봉우리 둘이 북쪽을 향해 마주 서 있고, 여름 큰비에 큰 망주봉에서 7~8개 물줄기가 폭포처럼 쏟아진다고 적습니다. 국가유산청은 솔섬에서 비가 오면 망주봉 정상 암벽을 타고 흐르는 폭포를 본다고 적습니다. 주소는 옥도면 선유도리(망주봉·솔섬)입니다.',
    '전북특별자치도 군산시 옥도면 선유도리 (망주봉·솔섬)',
    GS_MANGJU,
    [GS_MANGJU_2, GS_MANGJU_3],
  ),
  'local-scenic:gunsan-palgyeong:월영단풍': localScenicPhotoOverlay(
    '선유8경 제7경 월영단풍은 신시도 해발 198m 월영봉의 가을입니다. 군산시 문화관광은 가을 신시도 앞바다를 지날 때 월영봉 단풍이 한국 병풍 같고, 최치원이 절경에 반해 머물며 글을 읽었다고 적습니다. 월영봉 옆 대각산(187m) 전망대에서 고군산군도와 새만금방조제를 조망합니다. 사진은 같은 섬 대각산 한국관광공사 공식 사진으로 근사했습니다.',
    '전북특별자치도 군산시 옥도면 신시도리 (월영봉·대각산)',
    GS_WOLYEONG,
    [GS_WOLYEONG_2, GS_WOLYEONG_3],
  ),
  'local-scenic:gunsan-palgyeong:무산십이봉': localScenicPhotoOverlay(
    '선유8경 제8경 무산십이봉은 방축도·말도 등 12개 섬 봉우리입니다. 군산시 문화관광은 고군산의 방벽인 방축도와 말도 등 12봉이 투구를 쓴 병사처럼 도열하고, 선유봉에서 병풍 또는 무사로 보인다고 적습니다. 한국민족문화대백과사전은 방축도·명도·말도의 봉우리가 무사와 같다고 적습니다. 주소는 옥도면 방축도리·말도리 일원입니다.',
    '전북특별자치도 군산시 옥도면 방축도리·말도리 일원',
    GS_MUSAN,
    [GS_MUSAN_2, GS_MUSAN_3],
  ),
  'local-scenic:geumsan-sipgyeong:산림문화힐링명소': localScenicPhotoOverlay(
    '금산10경 제5경 산림문화 힐링명소는 남이면 금산산림문화타운입니다. 금산군 문화관광은 남이자연휴양림·느티골산림욕장·금산생태숲·금산건강숲·산림생태문화체험단지·목재문화체험장·생태치유숲길·유아숲체험원 8개 산림복지시설이 통합 운영되는 중부권 산림힐링단지라고 적습니다. 무장애나눔길이 있어 휴양·생태체험·산림치유를 함께 누립니다. 주소는 남이면 느티골길 200입니다.',
    '충청남도 금산군 남이면 느티골길 200 (금산산림문화타운)',
    GEUM_FOREST,
    [GEUM_FOREST_2, GEUM_FOREST_3],
  ),
  'local-scenic:geumsan-sipgyeong:금산인삼세계농업유산': localScenicPhotoOverlay(
    '금산10경 제6경 금산인삼 세계농업유산은 제원면 천내리 일원의 전통 인삼농업입니다. 금산군 문화관광에 따르면 유엔식량농업기구(FAO) 세계중요농업유산으로 국내 4번째·인삼으로는 세계 최초 등재되었습니다. 순환식 이동농법과 해가림, 농가 자가채종이 유산 가치로 인정받았습니다. 사진은 같은 군 금산인삼관 한국관광공사 공식 사진으로 근사했습니다.',
    '충청남도 금산군 제원면 천내리 일원 (금산전통인삼농업)',
    GEUM_GIAHS,
    [GEUM_GIAHS_2, GEUM_GIAHS_3],
  ),
  'local-scenic:geumsan-sipgyeong:인삼·약령시장': localScenicPhotoOverlay(
    '금산10경 제7경 인삼·약령시장은 금산읍 인삼약초로 24입니다. 금산군 문화관광은 인삼·약초상가가 밀집한 인삼의 거리가 국내 인삼유통의 중심이며 전국 인삼생산량의 70%가 이곳에서 집산·거래된다고 적습니다. 한국관광공사에 따르면 재래시장·국제시장·수삼센터가 있고, 매달 2·7일 오일장에 상인과 소비자가 모입니다.',
    '충청남도 금산군 금산읍 인삼약초로 24 (금산인삼약령시장)',
    GEUM_MARKET,
    [GEUM_MARKET_2, GEUM_MARKET_3],
  ),
  'local-scenic:geumsan-sipgyeong:월영산원골': localScenicPhotoOverlay(
    '금산10경 제9경 월영산 원골은 제원면 월영산길 23 일원입니다. 금산군 문화관광은 월영산을 달을 맞이하는 산이라 하며, 제원면 사람들이 대보름 달로 농사를 점쳤다고 적습니다. 주봉에서 갈기산·천태산·덕유산·마이산·서대산이 조망됩니다. 원골유원지(기러기공원)와 월영산·부엉산을 잇는 출렁다리(높이 45m·길이 275m)가 있습니다.',
    '충청남도 금산군 제원면 월영산길 23 (원골·월영산)',
    GEUM_WOL,
    [GEUM_WOL_2, GEUM_WOL_3],
  ),
  'local-scenic:geumsan-sipgyeong:태조태실요광은행나무': localScenicPhotoOverlay(
    '금산10경 제10경 태조태실 요광은행나무는 추부면 만인산 태조대왕태실과 요광리 은행나무입니다. 금산군 문화관광에 따르면 태조가 함경도 용연의 태를 만인산으로 옮겨 태자와 함께 안치했고, 1928년 총독부가 태 항아리를 옮긴 뒤 1993년 주민이 복원했습니다. 충청남도 유형문화재 제131호입니다. 요광리 은행나무는 수령 약 1000년 천연기념물 제84호이며 마을 수호신으로 모십니다. 사진은 금산군 문화관광·국가유산청 요광리 은행나무 공식 사진입니다.',
    '충청남도 금산군 추부면 마전리 산1-66 · 요광리 329-8 (태조대왕태실·요광리 은행나무)',
    GEUM_GINKGO,
    [GEUM_GINKGO_2],
  ),
  'local-scenic:geumsan-sipgyeong:서대산산꽃세상': localScenicPhotoOverlay(
    '금산10경 제4경 서대산 산꽃세상은 군북면 보곡산골입니다. 금산군 문화관광은 전국 최대 규모 산벚꽃 자생군락지이며 산딸나무·병꽃나무·조팝나무·진달래·생강나무가 앞다퉈 핀다고 적습니다. 매년 4월 비단고을 산꽃축제와 산꽃벚꽃마을 오토캠핑장이 있습니다. 주소는 군북면 자진뱅이길 39입니다. TourAPI 서대산(contentId 127518)은 사진이 없어 금산군 산꽃세상 공식 사진을 연결했습니다.',
    '충청남도 금산군 군북면 자진뱅이길 39 (산꽃벚꽃마을·보곡산골)',
    GEUM_SEODAE,
    [GEUM_SEODAE_2, GEUM_SEODAE_3],
  ),
  'local-scenic:geumsan-sipgyeong:금산진악산': localScenicPhotoOverlay(
    '금산10경 제3경 금산 진악산은 남이면 성곡리 일원입니다. 금산군 문화관광은 개삼터(開蔘터)가 있는 명산으로, 강처사가 진악산 백년약수에 인삼 씨앗을 씻어 심은 개삼 전설을 전합니다. TourAPI 진악산(contentId 126811)은 사진이 없어 금산군 진악산·개삼터 공식 사진을 연결했습니다.',
    '충청남도 금산군 남이면 성곡리 (진악산·개삼터)',
    GEUM_JINAK,
    [GEUM_JINAK_2, GEUM_JINAK_3],
  ),
  'local-scenic:namhae-sipgyeong:남해금산과보리암': localScenicPhotoOverlay(
    '남해12경 제1경 남해 금산과 보리암은 상주면 보리암로 665입니다. 남해군 문화관광은 소금강·남해금강이라 불리는 삼남 제일의 명산이며, 금산(704m)은 한려해상국립공원의 유일한 산악공원으로 기암 38경이 이어진다고 적습니다. 한국관광공사에 따르면 원효가 보광사(보광산)를 열었고, 이성계가 백일기도 뒤 조선을 연 뒤 현종이 1660년 왕실 원당으로 삼아 산 이름을 금산·절 이름을 보리암으로 바꿨습니다. 강화 보문사·낙산사 홍련암과 함께 3대 기도처입니다.',
    '경상남도 남해군 상주면 보리암로 665 (금산·보리암)',
    NH_BORIAM,
    [NH_BORIAM_2, NH_BORIAM_3],
  ),
  'local-scenic:namhae-sipgyeong:창선교와남해지족해협죽방렴': localScenicPhotoOverlay(
    '남해12경 제4경 창선교와 남해지족해협 죽방렴은 삼동면·창선면 사이 지족해협입니다. 남해군 문화관광은 창선교가 창선면 지족마을과 삼동면을 잇고, 죽방렴 홍보관 주소는 삼동면 죽방로 65라고 안내합니다. 국가유산청 명승 「남해 지족해협 죽방렴」은 시속 13~15km 물살에 참나무 말목과 대나무 발을 세워 멸치를 잡는 전통 어살이며 2010년 지정되었습니다. 한국관광공사는 창선교 길이 438m·1995년 재가설이라고 적습니다.',
    '경상남도 남해군 삼동면 죽방로 65 (지족해협·창선교)',
    NH_JUK,
    [NH_JUK_2, NH_JUK_3],
  ),
  'local-scenic:namhae-sipgyeong:서포김만중선생유허와노도': localScenicPhotoOverlay(
    '남해12경 제7경 서포 김만중 선생 유허와 노도는 상주면 노도입니다. 남해군 문화관광은 섬에서 바라보는 금산과 앵강만 풍광, 주소 상주면 노도길 73-34를 안내합니다. 한국관광공사에 따르면 삿갓처럼 생겨 삿갓섬이라 불리다 노를 많이 만들어 노도가 되었고, 구운몽·사씨남정기의 작가 서포 김만중이 유배되어 생을 마친 문학의 섬입니다. 벽련항에서 나룻배로 건너가며 초옥 터·샘터·허묘와 서포문학관이 있습니다.',
    '경상남도 남해군 상주면 노도길 73-34 (노도·서포 김만중 유허)',
    NH_NODO,
    [NH_NODO_2, NH_NODO_3],
  ),
  'local-scenic:namhae-sipgyeong:남해물건리방조어부림과물미해안': localScenicPhotoOverlay(
    '남해12경 제10경 남해 물건리 방조어부림과 물미해안은 삼동면 물건리입니다. 남해군 문화관광은 태풍·염해로부터 마을을 지키고 고기를 모으는 숲으로, 길이 약 1.5km·너비 30m 반달형에 팽나무·푸조나무·느티나무·이팝나무·후박나무 등 300년 수종이 천연기념물 제150호라고 적습니다. 물미해안은 물건과 미조를 잇는 해안도로입니다. 주소는 삼동면 동부대로1030번길 59입니다.',
    '경상남도 남해군 삼동면 동부대로1030번길 59 (물건리 방조어부림)',
    NH_FOREST,
    [NH_FOREST_2, NH_FOREST_3],
  ),
  'local-scenic:namhae-sipgyeong:창선-삼천포대교': localScenicPhotoOverlay(
    '남해12경 제12경 창선-삼천포대교는 창선면과 사천 삼천포를 잇는 연륙교입니다. 남해군 문화관광은 총연장 3.4km의 5개 교량이며 주소는 창선면 동부대로2964번길 49-10이라고 적습니다. 디지털사천문화대전은 모개섬·초양도·늑도를 잇는 연륙교로 낮의 한려해상과 밤 야경이 「한국의 아름다운 길 100선」에 올랐다고 안내합니다. 사진은 한국관광공사 창선·삼천포대교 공식 사진입니다.',
    '경상남도 남해군 창선면 동부대로2964번길 49-10 (창선·삼천포대교)',
    NH_BRIDGE,
    [NH_BRIDGE_2, NH_BRIDGE_3],
  ),
  'local-scenic:pohang-sipgyeong:호미곶일출': localScenicPhotoOverlay(
    '포항12경 제1경 호미곶 일출은 남구 호미곶면 해맞이로150번길 20입니다. 포항시 문화관광은 한반도 지형상 호랑이 꼬리·최동단으로 가장 먼저 해가 뜨며, 2000년·2001년 1월 1일 국가지정 해맞이 축전이 열렸고 해마다 한민족 해맞이 축전이 열린다고 적습니다. 해맞이광장에는 영원의 불씨함, 바다와 육지의 상생의 손, 연오랑세오녀상이 있고 호미곶등대와 국립등대박물관이 있습니다. 육당 최남선이 일출제일의 이곳을 조선십경의 하나로 꼽았습니다.',
    '경상북도 포항시 남구 호미곶면 해맞이로150번길 20 (호미곶 해맞이광장)',
    PH_HOMI,
    [PH_HOMI_2, PH_HOMI_3],
  ),
  'local-scenic:pohang-sipgyeong:내연산12폭포': localScenicPhotoOverlay(
    '포항12경 제2경 내연산 12폭포는 북구 송라면 보경로 523 내연산 보경사 시립공원입니다. 포항시 문화관광은 청하골 열두 폭포 가운데 관음폭포(제6)와 연산폭포(제7) 경관이 빼어나며, 관음폭포 위 구름다리를 건너면 높이 30m·길이 40m 연산폭포가 보인다고 적습니다. 보경사에서 연산폭포까지 왕복 약 6km·2시간이며 등산로가 잘 닦여 있습니다. 보경사에는 원진국사비(보물 제252호)·원진국사부도(보물 제430호)가 있습니다.',
    '경상북도 포항시 북구 송라면 보경로 523 (내연산 보경사 시립공원)',
    PH_FALLS,
    [PH_FALLS_2, PH_FALLS_3],
  ),
  'local-scenic:pohang-sipgyeong:운제산오어사사계': localScenicPhotoOverlay(
    '포항12경 제3경 운제산 오어사 사계는 남구 오천읍 오어로 1입니다. 포항시 문화관광은 신라 진평왕 대 창건 항사사로, 원효와 혜공이 법력으로 고기를 살리는 시합을 하다 나 오(吾)·고기 어(魚)를 써서 오어사라 하였다고 전합니다. 대웅전은 영조 17년(1741) 중건 정면 3칸 팔작지붕이며 경북문화재, 범종은 보물 제1280호입니다. 운제산과 오어지, 자장암·원효암이 사계절 경관을 이룹니다.',
    '경상북도 포항시 남구 오천읍 오어로 1 (운제산 오어사)',
    PH_OEO,
    [PH_OEO_2, PH_OEO_3],
  ),
  'local-scenic:pohang-sipgyeong:영일대포스코야경': localScenicPhotoOverlay(
    '포항12경 제5경 영일대 포스코 야경은 북구 해안로 95 영일대해수욕장입니다. 포항시 문화관광은 백사장 길이 1,750m·너비 40~70m이며 POSCO와 영일만이 보인다고 적습니다. 영일대는 전국 최초 해상 누각으로 2013년 대한민국 공간문화대상을 받았고 누각 123㎡·전망데크 738㎡·인도교 80m입니다. 포스코 야경은 2010년 야간경관 개선으로 1,500여 개 LED가 금빛 테마이며 형산강변·영일대·환호공원·송도에서 보입니다. 사진은 한국관광공사 영일대 누각(영일정)·포항불빛축제 공식 사진입니다.',
    '경상북도 포항시 북구 해안로 95 (영일대해수욕장·영일대)',
    PH_YEONGIL,
    [PH_YEONGIL_2, PH_YEONGIL_3],
  ),
  'local-scenic:pohang-sipgyeong:철길숲불의정원': localScenicPhotoOverlay(
    '포항12경 제9경 철길숲 불의 정원은 남구 대이로1번길 37(대잠동)입니다. 포항시 문화관광은 효자역과 옛 포항역 사이 4.3km 폐철도가 2015년 KTX 이전 뒤 도시숲이 되었고, 왕벚나무·느티나무·메타세쿼이아 등 4,800여 그루가 심겼다고 적습니다. 2017년 3월 관정 굴착 중 지하 200m 천연가스에 불이 붙어 불의정원을 조성했습니다. 포항시에 따르면 불꽃은 2024년 9월 27일 꺼졌습니다. 사진은 포항시 철길숲·불의정원 공식 사진입니다.',
    '경상북도 포항시 남구 대이로1번길 37 (대잠동 철길숲·불의정원)',
    PH_RAIL,
    [PH_RAIL_2, PH_RAIL_3],
  ),
  'local-scenic:anyang-gugyeong:망해암일몰': localScenicPhotoOverlay(
    '안양9경 제4경 망해암일몰은 만안구 임곡로 245입니다. 안양시 문화관광은 망해암(望海庵)이 바다를 볼 수 있는 암자라는 뜻이며, 신라 원효대사가 창건하고 조선 순조 3년 정조대왕의 모친인 혜경궁 홍씨가 중건했다고 알려진 사찰이라고 적습니다. 한국관광공사에 따르면 용화전 석불 입상에 성화 15년(1479) 조성이 새겨져 있고, 1803년·1863년 중창 뒤 1922년 화재와 한국전쟁으로 소실된 것을 다시 지었습니다. 서향이라 서해 낙조와 안양 시가지를 함께 볼 수 있습니다. 사진은 안양시 문화관광 망해암 공식 사진입니다.',
    '경기도 안양시 만안구 임곡로 245 (망해암)',
    AY_MANG,
    [AY_MANG_2, AY_MANG_3],
  ),
  'local-scenic:anyang-gugyeong:수리산성지': localScenicPhotoOverlay(
    '안양9경 제6경 수리산성지는 만안구 병목안로 394입니다. 안양시 문화관광은 대한민국 두 번째 신부인 최양업의 아버지 최경환과 부인 이성례가 안양 담배촌에 정착해 교우촌을 이루다 기해박해(헌종 5, 1839) 때 순교한 것을 기리는 순례지라고 적습니다. 한국관광공사에 따르면 1984년 교황 요한 바오로 2세가 최경환을 시성했고, 순례자성당·기념관·십자가 모양 생가 성당에 유해(팔뼈)가 모셔져 있으며 묘역과 야외 미사터가 있습니다. 사진은 안양시 문화관광 수리산성지 공식 사진입니다.',
    '경기도 안양시 만안구 병목안로 394 (수리산성지)',
    AY_SURI,
  ),
  'local-scenic:anyang-gugyeong:평촌1번가문화의거리': localScenicPhotoOverlay(
    '안양9경 제7경 평촌1번가 문화의거리는 4호선 범계역 2번출구 일대입니다. 안양시 문화관광은 범계역을 중심으로 형성된 거리로 버스킹 공연과 음식점·카페·주점이 밀집해 전국적으로 손꼽히는 만남의 장소라고 적습니다. 사진은 안양시 문화관광 평촌1번가 공식 사진입니다.',
    '경기도 안양시 동안구 4호선 범계역 2번출구 일대 (평촌1번가 문화의거리)',
    AY_PYEONG,
  ),
  'local-scenic:anyang-gugyeong:만안교': localScenicPhotoOverlay(
    '안양9경 제9경 만안교는 만안구 석수동 679입니다. 안양시 문화관광은 정조가 아버지 사도세자의 능을 참배하러 갈 때 임시 다리를 없애고 백성도 편히 쓰도록 만든 석조 다리이며, 조선 후기 대표적인 무지개(아치형) 돌다리로 경기도 유형문화유산이라고 적습니다. 만안교(萬安橋)는 만 년 동안의 편안함을 뜻합니다. 안양시 문화유산 안내에 따르면 1795년(정조 19) 축조되었고 만안구 지명의 유래입니다. 사진은 안양시 문화관광 만안교 공식 사진입니다.',
    '경기도 안양시 만안구 석수동 679 (만안교)',
    AY_MANAN,
    [AY_MANAN_2, AY_MANAN_3],
  ),
  'local-scenic:jeungpyeong-gugyeong:좌구산천문대': localScenicPhotoOverlay(
    '증평구경 제3경 좌구산 천문대는 증평읍 솟점말길 187입니다. 증평군 문화관광은 한남금북정맥과 청주·증평 최고봉 좌구산(657m)에 있으며, 거북이가 앉아 남쪽을 보는 형상에서 산 이름이 붙었고 주변에 큰 도시가 없어 맑은 밤하늘을 간직한다고 적습니다. 국내에서 가장 큰 356mm 굴절망원경과 천체투영실을 갖추고, 광공해가 적어 밤에 5등급 별 약 1,500개를 헤아릴 수 있습니다. 사진은 증평군 문화관광 좌구산 천문대 공식 사진입니다.',
    '충청북도 증평군 증평읍 솟점말길 187 (좌구산 천문대)',
    JP_STAR,
    [JP_STAR_2, JP_STAR_3],
  ),
  'local-scenic:jeungpyeong-gugyeong:삼기저수지등잔길': localScenicPhotoOverlay(
    '증평구경 제4경 삼기저수지 등잔길은 증평읍 율리휴양로 163 수변산책로 일원입니다. 증평군 문화관광은 좌구산에서 발원한 삼기천이 삼기저수지에서 사곡리 합수점까지 8km를 흐르며, 저수지 일원 총장 3km 수변산책로가 생태공원에서 한 바퀴 돌아온다고 적습니다. 목재 탐방데크가 수면 위를 지나 좌구산 사계절 풍경을 보며 걷습니다. 사진은 한국관광공사 삼기저수지 공식 사진입니다.',
    '충청북도 증평군 증평읍 율리휴양로 163 (삼기저수지 등잔길)',
    JP_SAMGI,
    [JP_SAMGI_2, JP_SAMGI_3],
  ),
  'local-scenic:jeungpyeong-gugyeong:추성산성': localScenicPhotoOverlay(
    '증평구경 제7경 추성산성은 도안면 노암리 산74입니다. 증평군 문화관광은 해발 259m·242m 두 봉우리에 북성과 남성 토성이 있으며 북성 둘레 429m·남성 둘레 1,411m라고 적습니다. 국가유산청 사적 제527호(2014.1.23.)이며 한성백제 시기 지방 최대 규모 토축산성입니다. 사진은 국가유산청·증평기록관 추성산성 공식 사진입니다.',
    '충청북도 증평군 도안면 노암리 산74 (추성산성)',
    JP_CHU,
    [JP_CHU_2, JP_CHU_3],
  ),
  'local-scenic:jeungpyeong-gugyeong:연병호항일역사공원': localScenicPhotoOverlay(
    '증평구경 제9경 연병호 항일역사공원은 도안면 산정길 5입니다. 증평군은 독립운동가 연병호 선생의 삶과 생가를 둘러보는 쉼터로 2016년 조성했고, 항일기념관·상징조형물·무궁화동산·생가가 있다고 안내합니다. 증평군 문화관광에 따르면 형 연병환, 딸 연미당, 제부 엄항섭, 외손녀 엄기선까지 일가가 독립운동에 투신했습니다. 사진은 증평기록관·증평군 시설 안내 공식 사진입니다.',
    '충청북도 증평군 도안면 산정길 5 (연병호 항일역사공원)',
    JP_YEON,
    [JP_YEON_2, JP_YEON_3],
  ),
  'local-scenic:gyeryong-gugyeong:향적산국사봉': localScenicPhotoOverlay(
    '계룡9경 향적산 국사봉은 엄사면 향한리 산 50-1입니다. 계룡시 엄사면 안내는 계룡산 남쪽 봉우리로 해발 574m이며 논산시 상월면과 계룡시 엄사면의 경계를 이룬다고 적습니다. 향기로운 땀(香積)이 쌓인 산으로, 공부와 도를 깨우치려 용맹정진하는 곳이라 일컫습니다. 국사봉은 조선초 태조 이성계가 신도안에 도읍을 정할 때 친히 올라가 국사를 논했다 하여 붙은 이름입니다. 서쪽 연천봉 능선과 동쪽 천황봉 능선이 보여 계룡산을 조망하는 등산 코스입니다. 사진은 계룡시 엄사면 향적산 국사봉 공식 사진이며, 같은 산 향적산 치유의 숲 공식 사진을 보탰습니다.',
    '충청남도 계룡시 엄사면 향한리 산 50-1 (향적산 국사봉)',
    GR_GUKSA,
    [GR_GUKSA_2, GR_GUKSA_3],
  ),
  'local-scenic:gyeryong-gugyeong:숫용추': localScenicPhotoOverlay(
    '계룡9경 숫용추는 신도안면 부남리입니다. 계룡시 문화관광은 대궐터에서 서쪽으로 계곡을 따라 약 2km 가면 10m 높이 폭포 아래 화강암 바위 속 약 4m 깊이 웅덩이가 숫용추라고 적습니다. 계룡산 서쪽에 있어 서용추(西龍湫)라고도 하며, 숫용이 도를 닦아 승천한 자리라는 전설이 있습니다. 동쪽 용동리 암용추의 암용과 땅속으로 왕래했다는 이야기도 전합니다. 군사보호구역으로 출입이 제한됩니다. 사진은 계룡시 문화관광 숫용추 공식 사진입니다.',
    '충청남도 계룡시 신도안면 부남리 (숫용추)',
    GR_SUT,
  ),
  'local-scenic:gyeryong-gugyeong:암용추': localScenicPhotoOverlay(
    '계룡9경 암용추는 신도안면 용동리입니다. 계룡시 문화관광은 구룡관사 위쪽 제석사 앞 계곡에 너비 12m·깊이 2.5m 바위 웅덩이가 있으며, 암용이 도를 닦아 승천한 자리라는 전설이 깃든 암용추이고 동쪽에 있어 동용추(東龍湫)라고도 부른다고 적습니다. 군사보호구역이며, 계룡시는 계룡안보생태탐방로 예약으로 하늘소리길 구간을 안내합니다. 사진은 계룡시 문화관광 암용추 공식 사진입니다.',
    '충청남도 계룡시 신도안면 용동리 (암용추)',
    GR_AM,
    [GR_AM_2],
  ),
  'local-scenic:gyeryong-gugyeong:계룡대통일탑': localScenicPhotoOverlay(
    '계룡9경 계룡대 통일탑은 신도안면 부남리 계룡대 영내입니다. 계룡시 문화관광은 높이 36m의 통일탑이 국군의 충·의·지·인·용 기치 아래 국가를 보위하고 민족의 번영과 약진을 보장한다는 의미를 지닌다고 적습니다. 주변에는 전투기·전차 등 무기를 전시합니다. 군사보호구역으로 출입이 제한되며, 나라사랑 계룡대견학(월~금 오전 10:30·오후 14:00)에서 통일탑 단체사진을 안내합니다. 계룡시 신도안면 안내에 따르면 육·공군본부는 1989년 7월 18일까지, 해군본부는 1993년 이전했습니다. 사진은 계룡시 문화관광·신도안면 계룡대 통일탑 공식 사진입니다.',
    '충청남도 계룡시 신도안면 부남리 (계룡대 통일탑)',
    GR_UNI,
    [GR_UNI_2, GR_UNI_3],
  ),
  'local-scenic:nonsan-other:대둔산수락계곡': localScenicPhotoOverlay(
    '논산11경 제3경 대둔산 수락계곡은 벌곡면 수락계곡길(수락리 산 14-2)입니다. 논산시 문화관광은 대둔산을 호남의 소금강이라 부르며 논산·금산·완주 3개 시군에 걸쳐 있고 면적은 논산이 가장 넓다고 적습니다. 군지계곡과 수락폭포가 소금강의 진수이며, 수락계곡은 한여름에도 차가운 물이 흐르고 여름마다 반딧불 축제가 열리기도 합니다. 시 여름명소 안내는 경찰승전탑 광장에서 수락폭포까지 0.82km 오솔길, 선녀폭포 탐방데크, 수락폭포에서 마천대까지 군지구름다리를 안내합니다. 수락계곡에서 정상 마천대까지는 약 2시간입니다. 사진은 논산시 문화관광 대둔산 수락계곡 공식 사진이며, 같은 시 여름명소 수락계곡 오솔길·선녀폭포·수락폭포 공식 사진을 보탰습니다.',
    '충청남도 논산시 벌곡면 수락계곡길 (대둔산 수락계곡)',
    NS_SURAK,
    [NS_SURAK_2, NS_SURAK_3, NS_SURAK_4],
  ),
  'local-scenic:nonsan-other:강경포구와근대역사거리': localScenicPhotoOverlay(
    '논산11경 제7경 강경포구와 근대역사거리는 강경읍 옥녀봉로73번길입니다. 논산시 문화관광은 「택리지」 저자 이중환이 강경의 풍물과 경치에 빠져 살며 책을 썼다고 적습니다. 달 밝은 보름날 선녀들이 산마루에 내려와 금강에서 목욕했다는 전설이 있고, 옥녀봉 정자에서 논산평야와 부여·익산이 한눈에 들어옵니다. 부여에서 내려온 금강이 옥녀봉에서 꺾여 서해로 나갑니다. 옥녀봉은 1919년 3월 10일 강경읍 장날 500여 명이 독립만세를 외친 현장으로, 1985년 산정에 강경항일독립만세운동기념비가 세워졌습니다. 발효젓갈로 유명한 읍내에는 근대 건축물이 남아 있고, 강경 천주교회는 배 모양 설계로 지붕이 큰 돛을 연상케 합니다. 사진은 논산시 문화관광 강경포구 공식 사진이며, 한국관광공사 옥녀봉·강경역사관(구 한일은행 강경지점) 사진을 보탰습니다.',
    '충청남도 논산시 강경읍 옥녀봉로73번길 (강경포구와 근대역사거리)',
    NS_GANG,
    [NS_GANG_2, NS_GANG_3],
  ),
  'local-scenic:nonsan-other:노성산성과명재고택': localScenicPhotoOverlay(
    '논산11경 제8경 노성산성과 명재고택은 노성면 노성산성길 일원입니다. 논산시 문화관광은 노성산성이 백제 때 축성되어 연산 황산성과 함께 신라에 대한 백제의 마지막 방어기지였고, 자연 지세를 이용해 약 1km를 석축으로 쌓았으며 「신증동국여지승람」에 성 둘레 590m·높이 2.4m라고 적습니다. 정상에는 장대지, 동쪽 벽 아래에는 봉수대 터가 있고 성 안 우물 4개는 지금도 씁니다. 국가유산청 사적(1995.8.2., 구 사적 제393호)입니다. 산 아래 명재고택은 유학자 명재 윤증 생전(1709, 숙종)에 지어진 상류 양반가옥으로 안채는 ㄷ자형, 사랑채까지 포함하면 ㅁ자형이며 국가민속문화유산입니다. 주소는 산성이 송당리 산1-1, 고택이 노성산성길 50입니다. 사진은 논산시 문화관광 명재고택 공식 사진이며, 한국관광공사 명재고택 사진을 보탰습니다.',
    '충청남도 논산시 노성면 노성산성길 50 (노성산성과 명재고택)',
    NS_NOSEONG,
    [NS_NOSEONG_2, NS_NOSEONG_3],
  ),
  'local-scenic:nonsan-other:종학당과한국유교문화진흥원': localScenicPhotoOverlay(
    '논산11경 제11경 종학당과 한국유교문화진흥원은 노성면 종학길 39-6(종학당)입니다. 논산시 문화관광은 파평 윤씨 문중 자녀와 내외척·처가 자녀가 모여 합숙교육을 받던 교육도장으로, 인조 21년(1643) 윤순거가 세운 뒤 종약(宗約)을 정했다고 적습니다. 화재로 없어졌다가 1970년 윤정규가 다시 지었고, 정면 3칸·측면 2칸에 가운데 대청과 양쪽 방을 둔 한옥입니다. 일반 서원·서당과 달리 교육목표·교육과정·학칙을 두고 1910년까지 운영되었습니다. 충청남도 유형문화유산 제152호(1997.12.30.)입니다. 시는 2012년 기호유학 중심지인 논산을 한국유교문화진흥원 최적지로 꼽았고, 세계유산 돈암서원·종학당과 연계해 유교 가치를 현대화한다고 안내합니다. 진흥원 위치는 종학길 10(병사리 산 41-4)입니다. 사진은 논산시 문화관광 종학당·한국유교문화진흥원 공식 사진이며, 한국관광공사 종학당 사진을 보탰습니다.',
    '충청남도 논산시 노성면 종학길 39-6 (종학당과 한국유교문화진흥원)',
    NS_JONGHAK,
    [NS_JONGHAK_2, NS_JONGHAK_3],
  ),
  'local-scenic:cheonan-palgyeong:유관순열사사적지': localScenicPhotoOverlay(
    '천안8경 제2경 유관순열사사적지는 동남구 병천면 유관순길 38입니다. 천안시 문화관광은 1919년 3월 1일 탑골공원에서 시작된 독립만세가 같은 달 5일 학생단 시위로 이어지다 휴교령으로 막히자, 이화학당 학생 유관순열사(1902.12.16.~1920.9.28.)가 고향 병천으로 내려와 김구응·조인원·유중무 등과 4월 1일 아우내장터 만세운동을 일으켰다고 적습니다. 병천천을 사이에 두고 아우내장터와 사적(구 사적 제230호)이 마주 보며, 매봉산 일원 3,544㎡에 기념관·생가·봉화대·추모각·초혼묘·열사의 거리가 있습니다. 1972년 사당을 세우고 초상을 모셨으며 매년 3월 마지막 날에 봉화를 올립니다. 사진은 천안시 문화관광 유관순열사사적지 공식 사진입니다.',
    '충청남도 천안시 동남구 병천면 유관순길 38 (유관순열사사적지)',
    CN_YU,
    [CN_YU_2, CN_YU_3],
  ),
  'local-scenic:cheonan-palgyeong:태조산왕건길과청동대좌불': localScenicPhotoOverlay(
    '천안8경 제4경 태조산 왕건길과 청동대좌불은 동남구 각원사길 245입니다. 천안시 문화관광은 태조산(421m)이 고려 태조가 머물렀다 하여 붙은 천안의 진산이며, 930년 태조가 후백제 신검과 대치할 때 이 산에 올라 주둔지를 살폈고 산신제 제단 흔적이 남는다고 적습니다. 서쪽 자락에 각원사와 성불사가 직선거리 700m로 있고, 각원사는 남북통일의 염원으로 1977년 창건한 조계종 직할교구입니다. 남북통일기원 청동대불은 1977년 5월 9일 태조산 중봉에 봉안했으며 좌대 지름 10m·좌대와 불상 전체 높이 15m·둘레 30m·무게 청동 60톤입니다. 시는 국내 최고 크기 좌불이라고 안내합니다. 사진은 천안시 문화관광 태조산 각원사 청동대좌불 공식 사진이며, GATEO 선정 각원사와 다른 시 공식 사진을 썼습니다.',
    '충청남도 천안시 동남구 각원사길 245 (태조산 왕건길과 청동대좌불)',
    CN_TAEJO,
    [CN_TAEJO_2, CN_TAEJO_3],
  ),
  'local-scenic:cheonan-palgyeong:아라리오조각광장': localScenicPhotoOverlay(
    '천안8경 제5경 아라리오조각광장은 동남구 만남로 43(신부동)입니다. 천안시 문화관광은 하루 7만 명 이상이 이용하는 광장으로 종합터미널·아라리오갤러리·신세계백화점을 잇는 중심이며, 학생·청소년이 많이 찾는 젊음의 광장이라고 적습니다. 2007년 우리나라 최고의 아름다운 광장 최우수상(국무총리상)을 받았고, 설치된 작품은 총 28점입니다. ARARIO Small City는 어디서나 현대미술을 볼 수 있게 했고, 시는 국내 미술 애호가의 순례지이자 해외 여행객의 관광 코스라고 안내합니다. 사진은 천안시 문화관광 아라리오조각광장 공식 사진입니다.',
    '충청남도 천안시 동남구 만남로 43 (아라리오조각광장)',
    CN_ARARIO,
    [CN_ARARIO_2, CN_ARARIO_3],
  ),
  'local-scenic:cheonan-palgyeong:봉선홍경사갈기비': localScenicPhotoOverlay(
    '천안8경 제8경 봉선홍경사갈기비는 서북구 성환읍 대홍3길 77-48입니다. 천안시 문화관광은 봉선홍경사가 고려 현종 12년(1021)에 창건된 절이며, 절 이름 앞의 봉선(奉先)은 불교를 전하고자 절을 짓다 마치지 못하고 돌아간 아버지 안종(安宗)의 뜻을 아들 현종이 받든다는 의미라고 적습니다. 현재 절터에는 창건 기록을 담은 비석만 남았습니다. 갈비(碣碑)는 보통 머릿돌·지붕돌을 얹지 않으나 이 비는 거북받침돌과 머릿돌을 갖추었고, 거북 머리가 용머리로 바뀌고 지느러미 같은 날개가 있습니다. 비몸 앞면 위에 「봉선홍경사갈기」가 가로로 새겨져 있고 머릿돌에는 구름에 휩싸인 용이 있습니다. 현종 17년(1026)에 세웠으며 비문은 해동공자로 불리던 최충이 짓고 백현례가 썼습니다. 1962년 12월 20일 국보로 지정되었습니다. 사진은 천안시 문화관광 봉선홍경사갈기비 공식 사진입니다.',
    '충청남도 천안시 서북구 성환읍 대홍3길 77-48 (봉선홍경사갈기비)',
    CN_STELE,
    [CN_STELE_2, CN_STELE_3],
  ),
  'local-scenic:damyang-other:가마골용소': localScenicPhotoOverlay(
    '담양10경 제1경 가마골용소는 용면 용소길 261입니다. 담양군 문화관광은 용연리 용추산(해발 523m)을 중심으로 사방 4km를 가마골이라 부르고, 깊은 계곡·폭포·기암괴석이 어우러져 사계절 관광객이 찾는다고 적습니다. 영산강의 시원(발원지)으로 알려진 용소가 있고 1986년부터 관광지로 지정·개발되어 등산로·쉼터·편의시설이 갖춰졌습니다. 안쪽에는 가마골생태공원이 있고 하류 가마골계곡은 물놀이가 가능합니다. 옛 가마터가 많아 붙은 이름이며 용이 솟은 못을 용소라 부른 전설이 전해집니다. 사진은 담양군 문화관광 가마골용소 공식 사진이며, 한국관광공사 가마골계곡 사진을 보탰습니다.',
    '전라남도 담양군 용면 용소길 261 (가마골용소)',
    DY_GAMA,
    [DY_GAMA_2, DY_GAMA_3],
  ),
  'local-scenic:damyang-other:삼인산': localScenicPhotoOverlay(
    '담양10경 제5경 삼인산은 대전면 행성리 산 55입니다. 담양군 문화관광은 대전면 행성리와 수북면 오정리 경계에 있는 해발 564m 산으로, 북쪽에 삼인동(三人洞) 마을이 있다고 적습니다. 삼인산은 옛이름 몽선암(夢仙庵)이며, 견훤 난 때 피난한 여인들이 몽골 병졸의 만행에 맞서 절벽 아래로 떨어졌다는 전설이 전해집니다. 이성계가 명산을 찾아 기도하던 중 꿈에서 삼인산을 찾으라는 성몽을 받고 제를 올려 등극했다 하여 몽성산(夢聖山)이라 부르기도 합니다. 산형이 人자 세 겹을 겹친 형국이라 三人山이라 이름붙였다고 안내합니다. 사진은 담양군 문화관광 삼인산 공식 사진입니다.',
    '전라남도 담양군 대전면 행성리 산 55 (삼인산)',
    DY_SAMIN,
  ),
  'local-scenic:damyang-other:메타세쿼이아가로수길': localScenicPhotoOverlay(
    '담양10경 제6경 메타세쿼이아 가로수길은 담양읍 메타세쿼이아로 일대입니다. 담양군 문화관광은 1972년 당시 김기회 군수 때 국도 24호선 군청~금성면 원율삼거리 5km 구간에 5년생 메타세쿼이아 1,300본을 식재해 조성했다고 적습니다. 이후 읍·면 연결 도로에도 식재·관리해 담양의 대표 가로수길이 되었고, 영화 「와니와 준하」·「화려한 휴가」와 예능 「1박 2일」 촬영지로 알려졌습니다. 하절기 09:00~19:00·동절기 09:00~18:00 운영(설·추석 당일 휴무)이며 입장료가 있습니다. 사진은 담양군 문화관광 메타세쿼이아 길 공식 사진이며, 한국관광공사 담양 메타세쿼이아길 사진을 보탰습니다.',
    '전라남도 담양군 담양읍 메타세쿼이아로 12 (메타세쿼이아 가로수길)',
    DY_META,
    [DY_META_2, DY_META_3],
  ),
  'local-scenic:damyang-other:담양관방제림': localScenicPhotoOverlay(
    '담양10경 제9경 담양관방제림은 담양읍 죽녹원로 98 일대입니다. 담양군 문화관광은 담양천 제방인 관방제를 보호하기 위해 조성한 숲으로, 푸조나무·느티나무·팽나무·벚나무·은단풍 등 300년 넘은 활엽수가 1.2km 이어진다고 적습니다. 조선 인조 26년(1648) 부사 성이성이 제방을 쌓고 나무를 심기 시작했고, 철종 5년(1854) 부사 황종림이 제방을 늘려 숲을 다듬었다고 전해집니다. 1991년 11월 27일 천연기념물로 지정되었고 2004년 제5회 아름다운 숲 전국대회 대상을 수상했습니다. 여름 피서지·연인 데이트 코스로 알려졌습니다. 사진은 담양군 문화관광 관방제림 공식 사진이며, 한국관광공사 관방제림 사진을 보탰습니다.',
    '전라남도 담양군 담양읍 죽녹원로 98 (담양관방제림)',
    DY_GWANBANG,
    [DY_GWANBANG_2, DY_GWANBANG_3, DY_GWANBANG_4],
  ),
  'local-scenic:miryang-palgyeong:시례호박소': localScenicPhotoOverlay(
    '밀양8경 제2경 시례 호박소는 산내면 얼음골로 334-1 호박소계곡입니다. 한국관광공사에 따르면 호박소는 수백만 년 동안 물살이 바위를 깎아 만든 포트홀(호박소)과 폭포가 어우러진 계곡으로, 둘레가 약 30m인 대형 호박소가 대표적입니다. 한국의 명수 100선에 선정되었고, 계곡에는 백련사·형제소·오천평반석 등이 있습니다. 밀양시는 밀양8경 제2경으로 안내합니다. 사진은 한국관광공사 호박소계곡 사진입니다.',
    '경상남도 밀양시 산내면 얼음골로 334-1 (시례 호박소·호박소계곡)',
    MR_HOBAKSO,
    [MR_HOBAKSO_2, MR_HOBAKSO_3],
  ),
  'local-scenic:miryang-palgyeong:월연정풍경': localScenicPhotoOverlay(
    '밀양8경 제4경 월연정 풍경은 용평동 월연대 일원입니다. 국가유산청 명승 밀양 월연대 일원(2012.2.8.)에 따르면 조선 중종 때 문신 월연(月淵) 이태가 관직에서 물러나 쌍경당과 월연대를 조성한 데서 유래했고, 월연정에서 바라본 강변 풍경이 빼어나 월주경(月洲景)으로 불립니다. 바위에 새겨진 글씨와 월연대 12경 등 문화경관이 함께합니다. 주소는 용평로 330-7(용평동 2-1)입니다. 사진은 국가유산청 명승 밀양 월연대 일원 공식 사진입니다.',
    '경상남도 밀양시 용평로 330-7 (월연정 풍경·월연대 일원)',
    MR_WOLYEON,
    [MR_WOLYEON_2, MR_WOLYEON_3],
  ),
  'local-scenic:miryang-palgyeong:만어사운해': localScenicPhotoOverlay(
    '밀양8경 제6경 만어사 운해는 삼랑진읍 만어로 776 만어사 일대입니다. 한국관광공사·밀양시 문화관광에 따르면 해발 674m 만어산 8부 능선에 자리한 만어사는 가락국 수로왕 창건 전설과 암괴류·종석이 있는 사찰이며, 얼음골·표충비와 함께 밀양 3대 신비로 꼽힙니다. 산 정상 부근 입지 덕분에 비가 내린 뒤나 새벽에는 사찰 아래로 구름이 바다처럼 펼쳐지는 운해를 볼 수 있다고 안내합니다. 사진은 한국관광공사 만어사 사진이며, 능선·안개 느낌 사진을 보탰습니다.',
    '경상남도 밀양시 삼랑진읍 만어로 776 (만어사 운해)',
    MR_MANEO,
    [MR_MANEO_2, MR_MANEO_3],
  ),
  'local-scenic:miryang-palgyeong:종남산진달래': localScenicPhotoOverlay(
    '밀양8경 제7경 종남산 진달래는 상남면·부북면·초동면에 걸친 해발 663m 종남산 능선입니다. 디지털밀양문화대전·밀양시 문화관광에 따르면 수백 년간 이어진 진달래 군락이 약 2만 600㎡에 이르며, 3월 말~4월 초에 만개해 능선이 분홍빛으로 물듭니다. 6부 능선부터 진달래가 본격적으로 보이고 8부 능선부터 대규모 군락이 형성됩니다. 정상에서는 밀양 시가지·낙동강 들녘·영남알프스가 조망되며, 팔각정 코스(상남면 조남길 408 등)가 대표입니다. 매년 종남산진달래축제가 열립니다. 사진은 한국관광공사 종남산(밀양) 사진입니다.',
    '경상남도 밀양시 상남면 조남길 408 일대 (종남산 진달래·팔각정 코스)',
    MR_JONGNAM,
    [MR_JONGNAM_2, MR_JONGNAM_3],
  ),
  'local-scenic:yeongdeok-sipgyeong:영덕도천숲': localScenicPhotoOverlay(
    '영덕9경 제3경 영덕 도천숲은 남정면 도천리 75 일대입니다. 영덕군·국가유산청에 따르면 약 400년 전 마을 개척 때 조성된 비보(裨補) 마을숲으로, 앞산 뱀머리(사두혈) 형상을 막기 위해 풍수적으로 만들었다 전합니다. 사암천을 따라 느티나무·팽나무·말채나무 등 낙엽수 200여 그루가 자라며 정자·탁자·의자가 있는 휴식 공간입니다. 대마를 땅속 구덩이에서 삶아 옷을 만들던 삼굿 흔적이 남한에서 유일하게 남아 있고, 제당에서 대보름 동제를 지냅니다. 2009년 12월 30일 천연기념물 제514호입니다. 사진은 대한민국 정책브리핑 국가유산청 「영덕 도천리 도천숲」 소개 공식 사진입니다.',
    '경상북도 영덕군 남정면 도천리 75 (영덕 도천리 도천숲)',
    YD_DOCHON,
  ),
  'local-scenic:yeongdeok-sipgyeong:영덕팔각산': localScenicPhotoOverlay(
    '영덕9경 제4경 영덕 팔각산은 달산면 옥계리 해발 628m 산입니다. 영덕군 문화관광은 여덟 개 모가 난 바위봉우리가 이어져 옥계팔봉이라 부르는 명산이며, 독립된 암봉과 기암괴석·주변 경관이 뛰어나다고 적습니다. 팔각산장 주차장에서 108계단·1~8봉 능선을 도는 원점회귀 코스는 약 4.5km·3시간이며 로프·난간이 설치된 암릉 산행입니다. 산 아래 옥계계곡과 침수정 일원의 맑은 물·기암괴석이 어우러집니다. 입산통제구역이 있어 산림과·군청 안내에 따라 등산을 확인합니다. 사진은 한국관광공사 옥계계곡 공식 사진이며, 국가유산청 명승 영덕 옥계 침수정 일원 사진을 보탰습니다.',
    '경상북도 영덕군 달산면 팔각산로 737 일대 (영덕 팔각산·팔각산장)',
    YD_PALGAK,
    [YD_PALGAK_2, YD_PALGAK_3, YD_PALGAK_4],
  ),
  'local-scenic:yeongdeok-sipgyeong:영덕사월의복사꽃': localScenicPhotoOverlay(
    '영덕9경 제5경 영덕 사월의 복사꽃은 지품면 삼화리 영덕복사꽃마을 일대입니다. 1959년 태풍 사라호 이후 사토에 복숭아나무를 심어 조성한 밭으로, 4월 초~중순 복사꽃이 만개하면 마을과 국도 34호선 언덕이 분홍빛으로 물듭니다. 마을회관 주변 약 2km 복사꽃 터널·전망대가 사진 명소이며, 매년 영덕복사꽃축제가 열립니다. 주소는 삼화2길 18(삼화2리)입니다. 사진은 한국관광공사 영덕 복사꽃마을 공식 사진입니다.',
    '경상북도 영덕군 지품면 삼화2길 18 (영덕복사꽃마을)',
    YD_CAMELLIA,
    [YD_CAMELLIA_2, YD_CAMELLIA_3],
  ),
  'local-scenic:yeongdeok-sipgyeong:영덕나옹왕사사적비': localScenicPhotoOverlay(
    '영덕9경 제9경 영덕 나옹왕사 사적비는 창수면 신기리 반송유적지입니다. 영덕군 문화관광에 따르면 고려 말 왕사 나옹혜근(1320~1376)이 출가할 때 반송 지팡이를 꽂아 “이 나무가 살아 있으면 내가 살아 있는 줄 알라”고 남긴 자리로, 625년을 살았던 반송이 1965년경 고사한 뒤 2008년 사적비를 세우고 반송을 다시 심어 반송유적지로 정비했습니다. 폭 5m·높이 3.4m·47t 보령오석 비석이며, 비문은 지관 큰스님 근찬·초당 이무호 선생이 집필·서사했습니다. 나옹왕사는 인량리 까치소 탄생 설화·장육사 창건 등 영덕 역사와 연결됩니다. 사진은 한국관광공사 장육사(나옹왕사가 창건) 공식 사진입니다.',
    '경상북도 영덕군 창수면 신기리 (반송유적지·나옹왕사 사적비)',
    YD_NAONG,
    [YD_NAONG_2, YD_NAONG_3],
  ),
  'local-scenic:jindo-other:조도관음도': localScenicPhotoOverlay(
    '진도10경 조도관음도는 조도면 다도해 섬 경관입니다. 진도군 문화관광은 조도를 조도 6군도(가사·거차·관매·상조·성남·하조) 178여 개 섬이 새떼처럼 펼쳐진 곳이라 적습니다. 같은 안내는 광대도(사자섬) 바위굴의 돌부처와 신선바위·바둑바위 해발 77m 상봉, 구멍 뚫린 혈도(공도)를 소개합니다. 사진은 진도군 문화관광 가사도(조도 6군도) 공식 사진이며, 같은 군 조도 다도해 조망 사진을 보탰습니다.',
    '전라남도 진도군 조도면 가사도길 일원 (조도 6군도·가사도)',
    JD_GASA,
    [JD_JODO],
  ),
  'local-scenic:jindo-other:의장대': localScenicPhotoOverlay(
    '진도10경 의장대는 조도면에서 다도해를 내려다보는 정자·전망 경관입니다. 진도군 문화관광은 기암괴석이 즐비한 하조도 등대와 다도해 풍광을 느낄 수 있는 돈대산·도리산 등산로를 안내합니다. 군 스탬프투어는 상조도 여미리 도리산 전망대를 인증 장소로 두었고, 한국관광공사 여행안내는 나무 데크 전망대에서 남쪽으로 관매도·서거차도, 북쪽으로 옥도·성남도·내병도가 보인다고 적습니다. 사진은 진도군 문화관광 조도 전망 데크 공식 사진입니다.',
    '전라남도 진도군 조도면 여미리 (도리산 전망대 일원)',
    JD_DECK,
  ),
  'local-scenic:jindo-other:돈대산': localScenicPhotoOverlay(
    '진도10경 돈대산은 조도면 하조도 창유리 뒷산입니다. 디지털진도문화대전은 한자 墩臺山, 높이 231m이며 봉수대가 있던 곳이라고 적습니다. 봉수대는 창유리 남서쪽 약 1㎞ 제2봉에 있고, 산정은 암벽으로 둘러싸여 있으며 상단 직경 약 7m·높이 280㎝, 하단 직경 약 5m·높이 320㎝의 원형 석축이 남았습니다. 진도군 문화관광은 다도해 풍광을 느낄 수 있는 돈대산 등산로를 안내합니다. 사진은 진도군 문화관광 조도 다도해 조망 공식 사진입니다.',
    '전라남도 진도군 조도면 창유리 (하조도 돈대산)',
    JD_JODO,
  ),
  'local-scenic:jindo-other:하조대': localScenicPhotoOverlay(
    '진도10경 하조대는 조도면 하조도등대입니다. 진도군 문화관광은 1909년 만들어진 유인등대로 높이 48m 하조도 끝자락 마디단에 있으며 만물상 바위와 어우러진다고 적습니다. 디지털진도문화대전은 1909년 2월 1일 점등, 등탑 12m·등고 평균해수면 48m, 주소 창유리 1-1이라고 적습니다. 장죽수도를 지나는 배의 길잡이이며 스탬프투어 주소는 조도등대길 429입니다. 사진은 진도군 문화관광 하조도등대 공식 사진입니다.',
    '전라남도 진도군 조도면 조도등대길 429 (하조도등대)',
    JD_LIGHT,
    [JD_LIGHT_AIR],
  ),
  'local-scenic:hampyeong-palgyeong:백제고도': localScenicPhotoOverlay(
    '함평8경 백제고도는 월야면 예덕리·신덕 고분 경관입니다. 함평군 문화관광은 예덕리고분을 4세기부터 5세기에 걸쳐 형성된 백제시대 독무덤이라 적고, 영산강 하류 옹관묘·전방후원분으로 안내합니다. 국가유산청은 2026년 함평 예덕리 고분군(일명 만가촌 고분군)을 사적으로 지정했고, 고막원천 상류에 3세기부터 약 300년에 걸쳐 조성된 마한 고분 14기라고 밝혔습니다. 사진은 한국관광공사 함평예덕리고분군 공식 사진이며, 함평군 문화관광 예덕리신덕고분군 사진을 보탰습니다.',
    '전라남도 함평군 월야면 예덕리 산170-3 일원 (예덕리·신덕 고분군)',
    HP_BAEKJE,
    [HP_BAEKJE_2, HP_BAEKJE_3, HP_BAEKJE_GUN],
  ),
  'local-scenic:hampyeong-palgyeong:모악산': localScenicPhotoOverlay(
    '함평8경 모악산은 해보면 산입니다. 함평군 문화관광은 높이 348m, 불갑산 줄기를 이은 봉우리로 활엽수와 단풍나무가 우거져 녹음과 단풍이 절경을 이룬다고 적습니다. 등산로는 주차장(연방죽) 0.8km → 모악산 0.2km → 용천봉 0.3km → 용봉 0.7km → 용천사입구이며, 용천사입구에서 구수재·연실봉으로 이어집니다. 산자락 해보면 용천사길 209에 용천사와 꽃무릇공원이 있고, 군은 함평모악산 꽃무릇축제를 안내합니다. 사진은 한국관광공사 용천사 꽃무릇공원 공식 사진입니다.',
    '전라남도 함평군 해보면 용천사길 209 (모악산·용천사 꽃무릇공원)',
    HP_MOAK,
    [HP_MOAK_2, HP_MOAK_GUN],
  ),
  'local-scenic:hampyeong-palgyeong:삼호천': localScenicPhotoOverlay(
    '함평8경 삼호천은 함평 수변 경관입니다. 함평군 문화관광에 삼호천이라는 독립 하천 안내는 없고, 함평읍 주산과 함평천을 기산영수라 부릅니다. 한국관광공사는 함평천수변공원을 함평읍 수호리에 두었고, 바로 옆 엑스포공원과 연결되어 있으며 물가에 수양버들이 많다고 적습니다. 함평천은 엑스포공원·생태공원 옆을 지나 영산강으로 합류합니다. 사진은 한국관광공사 함평천수변공원 공식 사진입니다.',
    '전라남도 함평군 함평읍 수호리 (함평천수변공원·기산영수 일원)',
    HP_SAMHO,
    [HP_SAMHO_2, HP_SAMHO_3],
  ),
  'local-scenic:hampyeong-palgyeong:청계산': localScenicPhotoOverlay(
    '함평8경 청계산은 신광면 산줄기 경관입니다. 함평군 신광면은 함정리 청계(淸溪) 마을을, 가뭄에도 마르지 않는 원천수가 있어 맑은 물이 흐른다 하여 청계라 부른다고 적습니다. 인접 함봉마을 뒷산은 옛 이름 함봉(咸峰)입니다. 같은 면 등산 안내는 신광·손불·영광 경계의 군유산(403m)을 공민왕이 노닐다 갔다 하여 군유산이라 소개합니다. 사진은 한국관광공사 손불면 양재리 이팝나무(군유산 자락 동산) 공식 사진입니다.',
    '전라남도 함평군 신광면 함정리 청계 일원 (군유산·손불면 양재리 자락)',
    HP_CHEONG,
    [HP_CHEONG_2],
  ),
  'local-scenic:haenam-palgyeong:해남구목포구등대낙조전망대': localScenicPhotoOverlay(
    '해남8경 주광낙조는 화원면 매월리 구 목포구등대와 낙조 전망대입니다. 목포지방해양수산청은 주소를 화원면 매봉길 582로 두고, 1908년 1월 무인등대로 점등한 뒤 1964년 유인등대, 2003년 높이 36m 백색 원형 콘크리트 신등대, 2023년 다시 무인등대로 전환했다고 적습니다. 대한제국 때 지은 구 등대는 2008년 국가등록문화재 제379호입니다. 해남 화원반도와 목포 달리도 사이 목포항 입구에 있으나 행정구역은 해남군이며, 등대 옆에 낙조전망대가 있습니다. 사진은 한국관광공사 해남 목포구 등대 공식 사진입니다.',
    '전라남도 해남군 화원면 매봉길 582 (매월리 구 목포구등대·낙조 전망대)',
    HN_LIGHT,
    [HN_LIGHT_2, HN_LIGHT_3],
  ),
  'local-scenic:haenam-palgyeong:해남윤씨옥우당': localScenicPhotoOverlay(
    '해남8경 연봉녹우는 해남윤씨 종택 경관입니다. 해남군 공공데이터는 관광지명을 해남윤씨 옥우당 일원으로 적었고, 국가유산청 사적은 해남윤씨 녹우당 일원입니다. 해남읍 녹우당길 135, 고산 윤선도의 4대 조 윤효정이 15세기 중엽 연동리에 자리를 잡은 종택이며 사랑채는 현종 9년(1668) 수원 집을 옮겨 왔습니다. 국보 윤두서 자화상과 천연기념물 비자나무숲이 있습니다. 사진은 한국관광공사 해남윤씨 녹우당 일원 공식 사진입니다.',
    '전라남도 해남군 해남읍 녹우당길 135 (해남윤씨 녹우당 일원)',
    HN_NOK,
    [HN_NOK_2, HN_NOK_3],
  ),
  'local-scenic:haenam-palgyeong:미황사및도솔암': localScenicPhotoOverlay(
    '해남8경 달마도솔은 송지면 달마산 미황사와 도솔암입니다. 한국관광공사는 미황사를 송지면 미황사길 164, 도솔암을 마봉송종길 355-300으로 안내합니다. 디지털해남문화대전은 미황사를 749년(경덕왕 8) 창건한 육지 최남단 사찰이라 적고, 도솔암은 달마산 도솔봉 암자로 정유재란 때 소실된 뒤 2002년 중건했다고 적습니다. 국가유산청 명승 해남 달마산 미황사 일원은 바위병풍·석양·불상의 삼황 경관입니다. 사진은 한국관광공사 도솔암(해남) 공식 사진이며, 같은 공사 미황사 사진을 보탰습니다.',
    '전라남도 해남군 송지면 마봉송종길 355-300 · 미황사길 164 (달마산 도솔암·미황사)',
    HN_DOSOL,
    [HN_DOSOL_2, HN_MIHWANG],
  ),
  'local-scenic:haenam-palgyeong:울돌목': localScenicPhotoOverlay(
    '해남8경 명량노도는 문내면 울돌목(명량해협)입니다. 한국관광공사는 우수영관광지를 문내면 관광레저로 12, 울돌목 스카이워크를 학동리 1467-10으로 안내합니다. 해협 가장 좁은 곳은 약 294m이며 물살이 울어 울돌목, 한자로 명량(鳴梁)이라 부릅니다. 1597년 이순신 장군의 명량대첩 격전지이고, 2021년 해남 쪽에 길이 111m 울돌목 스카이워크가 들어섰습니다. 사진은 한국관광공사 울돌목 스카이워크 공식 사진입니다.',
    '전라남도 해남군 문내면 학동리 1467-10 (울돌목 스카이워크·우수영관광지)',
    HN_ULDOL,
    [HN_ULDOL_2, HN_ULDOL_3],
  ),
  'local-scenic:hongseong-other:만해한용운생가지': localScenicPhotoOverlay(
    '홍성12경 제7경 만해한용운생가지는 결성면 성곡리 생가입니다. 홍성군 문화관광은 주소를 결성면 만해로318번길 83으로 두고, 독립운동가이자 승려·시인인 만해 한용운이 태어난 곳이며 1919년 3·1운동 민족대표 33인으로 독립선언서 공약 3장을 쓰고 1926년 시집 『님의 침묵』을 냈다고 적습니다. 생가가 쓰러진 뒤 앞면 3칸·옆면 2칸 초가와 만해사·민족시비공원·만해문학체험관을 조성했습니다. 국가유산청은 충청남도 기념물 제75호(1989년 12월 29일)로 지정했고, 한국민족문화대백과사전은 1992년 복원이라고 적습니다. 사진은 홍성군 문화관광 한용운선생생가지 공식 사진이며, 국가유산청 기념물 사진을 보탰습니다.',
    '충청남도 홍성군 결성면 만해로318번길 83 (성곡리 만해 한용운 생가지)',
    HS_MANHAE,
    [HS_MANHAE_2, HS_MANHAE_3, HS_MANHAE_KHS],
  ),
  'local-scenic:hongseong-other:선상문선생유허지': localScenicPhotoOverlay(
    '홍성12경 제9경 선상문선생 유허지는 군 공식명 성삼문선생유허지입니다. 홍성군 문화관광은 주소를 홍북읍 매죽헌길 403-12로 두고, 사육신 성삼문의 외가이자 출생 집터라고 적습니다. 세종 때 집현전 학자로 훈민정음에 참여했고, 수양대군이 단종을 폐한 뒤 절개를 지키다 죽임을 당했습니다. 국가유산청은 충청남도 기념물 제5호(1973년 12월 24일)로 지정했습니다. 군은 1954년 홍성 고적현창회가 제단을 보수했고 해마다 음력 10월 20일 제사를 지내며, 유허비는 마을 앞 약 30m에 있다고 안내합니다. 사진은 홍성군 문화관광 성삼문선생유허지 공식 사진입니다.',
    '충청남도 홍성군 홍북읍 매죽헌길 403-12 (노은리 성삼문선생유허지)',
    HS_SEONG,
    [HS_SEONG_2, HS_SEONG_3],
  ),
  'local-scenic:hongseong-other:고암이응노생가기념관': localScenicPhotoOverlay(
    '홍성12경 제10경 고암이응노 생가 기념관은 홍북읍 중계리 홍천마을의 이응노의 집입니다. 홍성군 문화관광은 주소를 홍북읍 이응노로 61-7로 두고, 고암 이응노가 그림의 꿈을 품은 생가 터 위에 2011년 11월 8일 개관했다고 적습니다. 전시동·복원 생가·야외전시장·연지공원·북카페가 있고 유품·작품 863점을 소장하며, 2012년 1월 25일 전문미술관으로 등록했습니다. 군 기념관 안내는 대지 2만596㎡·건축 1,002㎡이며 월산 품에서 용봉산을 바라보던 자리라고 적습니다. 사진은 홍성군 문화관광 고암이응노 생가기념관 공식 사진입니다.',
    '충청남도 홍성군 홍북읍 이응노로 61-7 (중계리 홍천마을 이응노의 집)',
    HS_LEE,
    [HS_LEE_2, HS_LEE_3],
  ),
  'local-scenic:hongseong-other:그림같은수목원': localScenicPhotoOverlay(
    '홍성12경 제12경 그림같은수목원은 광천읍 사립 수목원입니다. 홍성군 문화관광은 주소를 광천읍 충서로400번길 102-36으로 두고, 89,449㎡ 대지에 소나무를 중심으로 목본류 460여 종·초본류 870여 종 등 1,330여 종을 갖춰 2005년에 문을 열었다고 적습니다. 한국관광공사 연계 안내는 2004년 12월 29일 산림청 등록 사립수목원이며 온실식물원·미술관·폭포·전망대가 있다고 적습니다. 사진은 홍성군 문화관광 그림같은 수목원 공식 사진입니다.',
    '충청남도 홍성군 광천읍 충서로400번길 102-36 (매현리 그림같은 수목원)',
    HS_GARDEN,
    [HS_GARDEN_2, HS_GARDEN_3],
  ),
  'local-scenic:hongseong-other:홍성용봉산': localScenicPhotoOverlay(
    '홍성12경 제3경 용봉산은 홍북읍 상하리의 기암 산입니다. 홍성군 문화관광은 내포의 금강산이라 부르며 홍성·예산에 걸쳐 있고, 정상에서 예당평야와 서해가 보인다고 적습니다. 사진은 홍성군 문화관광 용봉산 공식 사진입니다.',
    '충청남도 홍성군 홍북읍 상하리 (용봉산)',
    HS_YONG,
    [HS_YONG_2, HS_YONG_3],
  ),
  'local-scenic:hongseong-other:오서산': localScenicPhotoOverlay(
    '홍성12경 제4경 오서산은 광천읍 담산리의 억새 산입니다. 홍성군 문화관광은 충남 서북부 최고봉 791m이며 멀리 바다에서도 보여 서해의 등대라고 적습니다. 사진은 홍성군 문화관광 오서산 공식 사진입니다.',
    '충청남도 홍성군 광천읍 담산리 일원 (오서산)',
    HS_OSEO,
    [HS_OSEO_2, HS_OSEO_3],
  ),
  'local-scenic:hongseong-other:죽도': localScenicPhotoOverlay(
    '홍성12경 제5경 죽도는 서부면 천수만의 유인도입니다. 홍성군 문화관광은 주소를 서부면 죽도길 86으로 두고, 섬 주위에 대나무가 많아 죽도라 부르며 남당항에서 배로 약 15분이라고 적습니다. 사진은 홍성군 문화관광 죽도 공식 사진입니다.',
    '충청남도 홍성군 서부면 죽도길 86 (죽도리)',
    HS_JUK,
    [HS_JUK_2, HS_JUK_3],
  ),
  'local-scenic:hongseong-other:홍주의사총': localScenicPhotoOverlay(
    '홍성12경 제11경 홍주의사총은 홍성읍 남산의 의병 묘소입니다. 홍성군 문화관광은 주소를 홍성읍 의사로 79로 두고, 1906년 홍주성 전투에서 희생된 의병을 모셨으며 옛 이름은 구백의총이고 2001년 8월 17일 사적으로 지정됐다고 적습니다. 사진은 홍성군 문화관광 홍주의사총 공식 사진입니다.',
    '충청남도 홍성군 홍성읍 의사로 79 (홍주의사총)',
    HS_UISA,
    [HS_UISA_2, HS_UISA_3],
  ),
  'local-scenic:hwasun-other:백아산하늘다리': localScenicPhotoOverlay(
    '화순11경 제3경 백아산 하늘다리는 백아면 백아산 산악 현수교입니다. 화순군 문화관광은 주소를 백아면 백아로 1310-56으로 두고, 희끗한 바위가 흰 거위처럼 보여 백아산이라 부르며 해발 756m 마당바위와 절터바위를 잇는 연장 66m·폭 1.2m 산악현수교라고 적습니다. 다리 가운데 강화유리 조망창(가로 40cm·세로 1m) 3곳이 있어 하늘 위를 걷는 듯한 스릴을 느낄 수 있습니다. 한국관광공사는 산 높이 810m이며 무등산·만연산과 함께 화순을 대표하는 산이라고 안내합니다. 사진은 화순군 문화관광 백아산하늘다리 공식 사진입니다.',
    '전라남도 화순군 백아면 백아로 1310-56 (백아산 하늘다리)',
    HW_SKY,
    [HW_SKY_2, HW_SKY_3],
  ),
  'local-scenic:hwasun-other:고인돌유적지': localScenicPhotoOverlay(
    '화순11경 제4경 고인돌 유적지는 도곡면 효산리와 춘양면 대신리의 지석묘군입니다. 화순군 문화관광은 약 3km에 596기가 밀집하고 채석장이 함께 남아 동북아시아 고인돌 변천을 밝히는 자료이며 2000년 유네스코 세계문화유산에 등재됐다고 적습니다. 11경 위치는 도곡면 효산리 64(유적지 부근)·춘양면 지동길 10(발굴지 보호각 부근)입니다. 국가유산청 사적은 화순 효산리와 대신리 지석묘군으로, 1998년 9월 17일 지정됐습니다. 대신리에는 약 280톤 초대형 고인돌이 있습니다. 사진은 화순군 문화관광 고인돌 유적지 공식 사진입니다.',
    '전라남도 화순군 도곡면 효산리 64 · 춘양면 지동길 10 (효산리·대신리 지석묘군)',
    HW_DOLMEN,
    [HW_DOLMEN_2, HW_DOLMEN_3],
  ),
  'local-scenic:hwasun-other:수만리철쭉공원': localScenicPhotoOverlay(
    '화순11경 제5경 수만리 철쭉공원은 화순읍 수만리에서 큰 재를 지나 안양산까지 이어지는 철쭉 경관입니다. 화순군 문화관광은 주소를 화순읍 안양산로 258로 두고, 한국의 알프스라 불릴 만큼 경관이 뛰어나며 봄철 철쭉이 도로변에서 산 정상까지 융단처럼 덮인다고 적습니다. 무등산 자락이 화순을 향해 이룬 봉우리와 깊은 골짜기입니다. 11경 공식명은 수만리 철쭉공원이며 GATEO 선정 만연산 치유숲과 다른 자리입니다. 사진은 화순군 문화관광 수만리 철쭉공원 공식 사진입니다.',
    '전라남도 화순군 화순읍 안양산로 258 (수만리 철쭉공원)',
    HW_AZALEA,
    [HW_AZALEA_2, HW_AZALEA_3],
  ),
  'local-scenic:hwasun-other:화순꽃강길음악분수': localScenicPhotoOverlay(
    '화순11경 제10경 화순 꽃강길 음악분수는 화순읍 대리 화순천의 야간 분수입니다. 화순군 문화관광은 주소를 화순읍 대리 481로 두고, 2023년 10월 문을 연 랜드마크이며 길이 60m·폭 10m 음악 수조와 최대 높이 50m 캐논 슈터·LED 수중조명이 화순 야경을 밝힌다고 적습니다. 함께 조성된 광장·코스모스 산책로와 3층 개미산 전망대에서 공연을 볼 수 있습니다. 개미산 전망대 주소는 화순읍 연양1길 31입니다. 사진은 화순군 문화관광 꽃강길 음악분수 공식 사진입니다.',
    '전라남도 화순군 화순읍 대리 481 (화순 꽃강길 음악분수)',
    HW_FOUNTAIN,
    [HW_FOUNTAIN_2, HW_FOUNTAIN_3],
  ),
  'local-scenic:hwasun-other:연둔리숲정이': localScenicPhotoOverlay(
    '화순11경 제7경 연둔리 숲정이는 동복면 연둔리 동복천의 버드나무 마을 숲입니다. 화순군 문화관광은 동복천을 따라 심은 아름드리 수양버들이 동복호와 어우러지며 2002년 아름다운 마을 숲에 선정됐다고 적습니다. 한국관광공사 주소는 동복면 둔동1길 38입니다. 주변에는 화순 적벽과 김삿갓 문학동산이 있습니다. GATEO 선정 만연산 치유숲·고창 고인돌과 다른 자리입니다. 사진은 화순군 문화관광 연둔리 숲정이 공식 사진입니다.',
    '전라남도 화순군 동복면 둔동1길 38 (연둔리 숲정이)',
    HW_FOREST,
    [HW_FOREST_2, HW_FOREST_3],
  ),
  'local-scenic:geoje-gugyeong:학동몽돌해수욕장': localScenicPhotoOverlay(
    '거제9경 제4경 학동몽돌해수욕장은 거제시 공식명 학동 흑진주 몽돌해변입니다. 거제시 문화관광은 위치를 동부면 학동리 276-5번지로 두고, 길이 1.2km·폭 50m·면적 3만㎡의 거제도 남쪽 검은 몽돌 해변이라고 적습니다. 파도가 몽돌을 굴리는 소리는 우리나라 자연의 소리 100선에 선정됐습니다. 학이 날아오르는 지형이라 학동이라 부르며, 해안을 따라 노자산·가라산 능선과 야생 동백림(천연기념물 팔색조)이 있습니다. 한국관광공사 주소는 동부면 학동6길 18-1입니다. 고성 학동마을·해남 학동리와 다른 자리입니다. 사진은 한국관광공사 거제학동몽돌해변 공식 사진입니다.',
    '경상남도 거제시 동부면 학동6길 18-1 (학동 흑진주 몽돌해변)',
    GJ_HAKDONG,
    [GJ_HAKDONG_2, GJ_HAKDONG_3],
  ),
  'local-scenic:geoje-gugyeong:거제포로수용소유적공원': localScenicPhotoOverlay(
    '거제9경 제6경 거제포로수용소유적공원은 고현동 계룡로 61입니다. 거제시 문화관광에 따르면 1950년 말 고현·수월지구 약 1,200만㎡에 거제도포로수용소가 설치되어 1951년 2월부터 북한군 15만·중공군 2만·의용군 3천 등 최대 17만 3천 명(여자포로 300여 명 포함)을 수용했습니다. 1953년 7월 27일 휴전 후 폐쇄됐고, 유적공원은 약 95,794㎡에 1999년 1차·2002년 2차·2013년 3차 개장했습니다. 1983년 12월 20일 경상남도 문화재자료 제99호입니다. 사진은 한국관광공사 포로수용소유적공원 공식 사진입니다.',
    '경상남도 거제시 계룡로 61 (고현동 거제포로수용소유적공원)',
    GJ_POW,
    [GJ_POW_2, GJ_POW_3],
  ),
  'local-scenic:geoje-gugyeong:공곶이·내도': localScenicPhotoOverlay(
    '거제9경 제7경 공곶이·내도는 일운면 와현리 94-2 일원입니다. 거제시 문화관광은 지형이 궁둥이처럼 툭 튀어나와 공곶이라 부르며, 1957년 강명식·지상악 노부부가 산비탈 16,000㎡에 동백·수선화·종려나무를 일군 자연농원이라고 적습니다. 맞은편 내도는 외도의 안에 있어 안섬·모자섬이라 부르고 구조라선착장에서 도선으로 갑니다. 한국관광공사는 내도를 거북섬·모자섬이라 부르며 동백숲과 해안 바위가 어우러진다고 적습니다. 외도보타니아·지심도와 다른 자리입니다. 사진은 한국관광공사 공곶이·내도 공식 사진입니다.',
    '경상남도 거제시 일운면 와현리 94-2 (공곶이·내도)',
    GJ_GONGGOJI,
    [GJ_GONGGOJI_2, GJ_GONGGOJI_3, GJ_NAEDO, GJ_NAEDO_2],
  ),
  'local-scenic:geoje-gugyeong:거제식물원': localScenicPhotoOverlay(
    '거제9경 제5경 거제 식물원은 거제시 공식명 거제식물원(정글돔)입니다. 거제시 문화관광은 위치를 거제면 거제남서로 3595로 두고, 거제정글돔(열대온실)·야외생태정원·수생정원·석부작정원으로 구성된다고 적습니다. 한국관광공사는 면적 4,468㎡·최고 높이 30m·유리 7,472장, 열대수목 300여 종 1만 주라고 안내합니다. 외도보타니아와 다른 자리입니다. 사진은 한국관광공사 거제식물원 공식 사진입니다.',
    '경상남도 거제시 거제면 거제남서로 3595 (거제식물원 정글돔)',
    GJ_GARDEN,
    [GJ_GARDEN_2, GJ_GARDEN_3],
  ),
  'local-scenic:geoje-gugyeong:매미성': localScenicPhotoOverlay(
    '거제9경 제9경 매미성은 장목면 복항길 29입니다. 거제시 문화관광에 따르면 2003년 태풍 매미로 경작지를 잃은 백순삼 씨가 자연재해로부터 작물을 지키려고 설계도 없이 홀로 쌓아 올린 돌벽입니다. 바닷가에 네모반듯한 돌을 쌓고 시멘트로 메운 것이 유럽 중세 성을 연상하게 되었습니다. 매미면가 식당·횟집과 다른 자리입니다. 사진은 한국관광공사 매미성 공식 사진입니다.',
    '경상남도 거제시 장목면 복항길 29 (매미성)',
    GJ_MAEMI,
    [GJ_MAEMI_2, GJ_MAEMI_3],
  ),
  'local-scenic:geoje-gugyeong:구조라해수욕장': localScenicPhotoOverlay(
    '구조라해수욕장은 일운면 구조라리의 내륙형 백사장입니다. 거제시 문화관광은 구조라 반도 서해안 약 1km 백사장으로 모래가 부드럽고 수심이 완만하며 호수처럼 잔잔하다고 적습니다. 서쪽 해안에 윤돌섬이 있고, 구조라항에서 내도·외도·해금강 유람선을 탑니다. 거제9경 학동 흑진주 몽돌해변과 다른 자리입니다. 사진은 한국관광공사 구조라해수욕장 공식 사진입니다.',
    '경상남도 거제시 일운면 구조라리 (구조라해수욕장)',
    GJ_GUJORA,
    [GJ_GUJORA_2, GJ_GUJORA_3],
  ),
  'local-scenic:donghae-bijing:용추폭포': localScenicPhotoOverlay(
    '동해비경 용추폭포는 무릉계곡 명승 안쪽 삼화로 538의 폭포입니다. 동해시 관광은 낙수가 바위를 기묘하게 깎아 용이 승천하는 듯하며, 상탕·중탕은 옹기 항아리 같고 하탕은 진옥색 큰 용소를 이룬다고 적습니다. 비경 안내는 곧게 내려쏟는 폭포 옆에 서면 현기증이 날 정도라고 합니다. 무릉권역 안내는 높이 100자도 넘어 금강산 구룡폭포에 비긴다고 적고, 쌍폭포와는 다른 자리입니다. 문경 용추계곡·계룡 숫용추·무릉반석·GATEO 선정 동해 무릉계곡(계곡 전체)과 다른 경승입니다. 사진은 동해시 관광 용추폭포 공식 사진입니다.',
    '강원특별자치도 동해시 삼화로 538 (용추폭포)',
    DH_YONGCHU,
    [DH_YONGCHU_2, DH_YONGCHU_3],
  ),
  'local-scenic:donghae-bijing:무릉반석': localScenicPhotoOverlay(
    '동해비경 무릉반석은 무릉계곡 명승 입구 삼화로 538의 넓은 화강암 반석입니다. 동해시 관광은 금란정 위쪽에서 삼화사 입구까지 약 1,500평이며 옛 풍월객의 석각이 새겨져 있다고 적습니다. 「무릉선원 중대천석 두타동천」 12자 석각이 있고, 시는 마모를 막으려고 1995년 모형 석각을 세워 보존합니다. 용추폭포·쌍폭포·GATEO 선정 동해 무릉계곡(계곡 전체)과 다른 자리입니다. 사진은 동해시 관광 무릉반석 공식 사진입니다.',
    '강원특별자치도 동해시 삼화로 538 (무릉반석)',
    DH_BANSEOK,
    [DH_BANSEOK_2, DH_BANSEOK_3],
  ),
  'local-scenic:donghae-bijing:동해망상해수욕장': localScenicPhotoOverlay(
    '동해비경 망상해변은 동해시 공식명 망상해변이며 주소는 동해대로 6270-10(망상동)입니다. 동해시 관광은 울창한 송림 뒤로 해안선을 따라 펼쳐진 백사장과 얕은 수심의 동해안 제1 해변이며, 매년 600만~700만 명이 찾는다고 적습니다. 비경 안내는 숙박·편의시설을 갖춘 사계절 관광지라고 합니다. 어달해변·대진해변·노봉해변·추암해수욕장과 다른 자리입니다. 사진은 동해시 관광 망상해변 공식 사진입니다.',
    '강원특별자치도 동해시 동해대로 6270-10 (망상해변)',
    DH_MANGSANG,
    [DH_MANGSANG_2],
  ),
  'local-scenic:donghae-bijing:호해정': localScenicPhotoOverlay(
    '동해비경 호해정은 동해시 구미동 산2의 정자입니다. 동해시 문화유산 안내는 조국의 광복을 기념하여 창건됐다고 적고, 1945년 일헌 최덕규 등 40명의 주춘계원이 세웠으며 추사 김정희의 현액 「천하괴석」과 만제 홍낙섭의 「풍속영귀」가 걸려 있다고 합니다. 앞으로는 전천이 갯목과 함께 흐르고 뒤로는 동해 해안 기암이 펼쳐지며, 서산낙조를 바라보는 구조입니다. 동해시 비경 페이지는 호해정·할미바위를 한 항목으로 안내합니다. 강릉 경포 호해정(유형문화유산)·동해 추암 해암정·인근 만경대와 다른 자리입니다. 사진은 동해시 관광 호해정 공식 사진입니다.',
    '강원특별자치도 동해시 구미동 산2 (호해정)',
    DH_HOHAE,
    [DH_HOHAE_2, DH_HOHAE_3],
  ),
  'local-scenic:donghae-bijing:할미바위': localScenicPhotoOverlay(
    '동해비경 할미바위는 동해시 구미동 산1 해안절벽의 흔들바위입니다. 동해시 관광은 앞으로는 전천이 흐르고 뒤로는 동해와 맞닿으며, 한두 사람이 흔들면 움직이지만 여럿이 밀면 꿈쩍하지 않는다고 적습니다. 호해정 안내는 해안절벽 위 지름 2.5m 흔들바위를 할미바위(마고암)라 부르고, 앞에 할머니 조형물과 마고암 전설 시가 있다고 합니다. 아기를 바라는 사람이 바위를 흔들며 소원을 빈다는 설화를 시가 안내합니다. 동해시 비경 페이지는 호해정과 묶어 「호해정·할미바위」로 소개합니다. 삼척·고성 할미바위와 다른 자리입니다. 사진은 동해시 관광 할미바위 공식 사진입니다.',
    '강원특별자치도 동해시 구미동 산1 (할미바위)',
    DH_HALMI,
    [DH_HALMI_2, DH_HALMI_3],
  ),
  'local-scenic:donghae-bijing:초록봉': localScenicPhotoOverlay(
    '동해비경 초록봉은 동해시 천곡동·비로동·이로동·승지동에 걸친 산입니다. 동해시 관광은 동해 8경 중 8경이며, 정상 능선에서 동쪽으로 동해, 서쪽으로 대관령 남쪽 백두대간·두타산·청옥산 능선을 본다고 적습니다. 이웃 봉우리에 MBC 송신중계소가 있고, 정상에는 시가 세운 초록봉 숲 탐방로 안내문과 돌탑이 있습니다. 비경 페이지는 백두대간 연봉 청오간의 한 봉우리로 수목이 울창한 등산로이자 시민 휴식공간이라고 안내합니다. 등산 1-1코스는 종합경기장~초록봉 2.4km(1시간), 1-2코스 2.6km, 2코스 묵호고~초록봉 3.6km, 3코스 북삼초교~초록봉 6.2km입니다. 두타산·청옥산과 다른 봉우리입니다. 사진은 동해시 관광 초록봉 정상석 공식 사진입니다.',
    '강원특별자치도 동해시 천곡동 (초록봉)',
    DH_CHOROK,
    [DH_CHOROK_2, DH_CHOROK_3],
  ),
  'local-scenic:yeonggwang-gugyeong:황금산': localScenicPhotoOverlay(
    'SSOT 행 이름은 황금산입니다. 영광군에는 산 이름 황금산이 없고, 충남 서산 9경 황금산·거제 학동 몽돌해변 황금산과 다른 자리입니다. 영광군 문화관광 공식 9경 제1경은 백수해안도로입니다. 군·한국관광공사 열린관광 안내는 백수읍 길용리에서 백암리 석구미 마을까지 16.8km 해안도로이며 기암괴석·갯벌·석양이 만난다고 적습니다. 주소는 백수읍 해안로 957 일원(노을전시관)입니다. 해안 아래 목재 데크 3.5km 해안 노을길이 있고, 2006년 국토해양부 한국의 아름다운 길 100선, 2011년 대한민국 자연경관대상 최우수상을 받았습니다. 칠산정에서 칠산 앞바다와 구불구불한 도로를 내려다봅니다. 한빛원전 단지와 다른 경승입니다. 사진은 한국관광공사 백수해안도로(칠산정 해안로) 공식 사진과 같은 군 백수·염산 인근 천일염전 공식 사진입니다.',
    '전라남도 영광군 백수읍 해안로 957 (백수해안도로·노을전시관)',
    YG_BAEKSU,
    [YG_SALT, YG_SALT_2],
  ),
  'local-scenic:yeonggwang-gugyeong:왕글공원': localScenicPhotoOverlay(
    'SSOT 행 이름은 왕글공원입니다. 영광군에 왕글공원이라는 공원 지명은 없고, 같은 리스트 법성포(포구) 행과 다른 자리입니다. 영광군 문화관광 공식 9경 제7경은 숲쟁이공원입니다. 국가유산 명승 제22호 영광 법성진 숲쟁이이며, 주소는 법성면 법성리 821-1·백제문화로 67입니다. 국가유산청은 법성포 포구와 마을을 보호하는 법성진성의 방풍림이며 「쟁이」는 숲으로 된 성(재)이라고 적습니다. 느티나무 숲과 법성진 석축이 어우러지고, 법성포 단오제 등 민속행사가 이어집니다. 사진은 한국관광공사 숲쟁이 느티나무 숲·국가유산청 법성진 석축 공식 사진입니다.',
    '전라남도 영광군 법성면 백제문화로 67 (숲쟁이공원)',
    YG_SUPJAENG,
    [YG_SUPJAENG_2, YG_SUPJAENG_3],
  ),
  'local-scenic:yeonggwang-gugyeong:백학촌': localScenicPhotoOverlay(
    'SSOT 행 이름은 백학촌입니다. 경기도 연천군 백학면·장성 백학봉과 다른 자리입니다. 영광읍 백학리는 실존 법정동으로, 한국학중앙연구원 민족문화대백과는 원각사·영광읍성을 백학리로 적습니다. 군 산림 안내는 물무산 행복숲 들머리 물무-1 코스가 백학이며, 주소는 영광읍 물무로 219입니다. 군 문화관광은 숲속 둘레길 10km, 맨발 황톳길 2km(질퍽 0.6km·마른 1.4km), 유아숲체험원·편백명상원·하늘공원이 있는 종합 산림복지숲이며 2018년 3월 개장, 한국관광공사 2020 가을 비대면 관광지 100선이라고 안내합니다. 황톳길 일부는 묘량면 덕흥리 615입니다. 사진은 한국관광공사 물무산 행복숲 황톳길·숲길 공식 사진입니다.',
    '전라남도 영광군 영광읍 물무로 219 (물무산 행복숲·백학리)',
    YG_MULMU,
    [YG_MULMU_2, YG_MULMU_3],
  ),
  'local-scenic:goheung-other:쑥섬': localScenicPhotoOverlay(
    '고흥10경 쑥섬은 봉래면 애도(艾島)입니다. 고흥군 관광은 외나로항에서 500m·배로 약 3분이며, 질 좋은 쑥이 나 쑥섬·한자 애도라 부른다고 적습니다. 전남 1호 민간정원 힐링파크 쑥섬쑥섬은 김상현·고채훈 부부가 가꾼 별정원·달정원·태양정원·치유정원·수국정원·동백정원이 있는 해상 꽃정원입니다. 2017년 산림청 아름다운 숲으로 선정된 400년 난대원시림이 있고, 행정안전부 휴가철 찾아가고 싶은 33섬·2021~2022 한국관광 100선입니다. 고양이가 많아 고양이 섬이라 부릅니다. 주소는 봉래면 나로도항길 120-7(나로도연안여객선터미널)이며 정원 들머리는 애도길 41입니다. 같은 리스트 소록도·연홍도·나로우주센터와 다른 섬입니다. 사진은 한국관광공사 쑥섬 수국정원 공식 사진과 고흥군 관광 고양이 조형·꽃정원 공식 사진입니다.',
    '전라남도 고흥군 봉래면 나로도항길 120-7 (쑥섬·애도)',
    GH_SSUK,
    [GH_SSUK_2, GH_SSUK_3],
  ),
  'local-scenic:goheung-other:금산해안경관': localScenicPhotoOverlay(
    '고흥10경 금산 해안경관은 금산면 거금도의 해안 경관입니다. 충남 금산군 10경·남해 금산 보리암과 다른 자리입니다. 군 공식 10경 이름은 금산 해안경관과 거금생태숲입니다. 고흥군 관광은 소록도·나로도와 함께 고흥을 대표하는 섬 거금도의 해안도로이며 국토부 남해안 해안 경관도로 15선이라고 적습니다. 주소는 금산면 거금일주로 1234입니다. 소원동산에서 다도해를 내려다보고, 금의시비공원·몽돌해변·익금해수욕장이 이어지며 해안 일주도로가 자전거 코스이기도 합니다. 녹동항·소록도·거금대교 드라이브와 다른 금산면 본섬 해안입니다. 사진은 고흥군 관광 소원동산·거금 해안도로 공식 사진입니다.',
    '전라남도 고흥군 금산면 거금일주로 1234 (금산 해안경관·소원동산)',
    GH_GEUM,
    [GH_GEUM_2, GH_GEUM_3],
  ),
  'local-scenic:goheung-other:고흥만수변노을공원': localScenicPhotoOverlay(
    '고흥10경 고흥만 수변노을공원은 도덕면 용동리입니다. 고흥군 관광은 썬밸리리조트 인접 26만㎡이며 해변캠핑장·물놀이장·야외공연장·미로공원·오감 체험숲이 있는 복합문화공간이라고 적습니다. 주소는 도덕면 고흥만로 1132-14입니다. 해변 쪽 저녁노을이 이름이며, 봄에는 고흥만 유채와 약 4km 벚꽃터널이 있고 학꽁치 낚시로도 찾습니다. 같은 리스트 남열 해돋이해수욕장(일출)과 다른 자리이며, 영광 백수해안도로 노을과도 다른 고흥만 간척 수변입니다. 사진은 고흥군 관광 수변노을공원 노을·벚꽃터널 공식 사진입니다.',
    '전라남도 고흥군 도덕면 고흥만로 1132-14 (고흥만 수변노을공원)',
    GH_SUNSET,
    [GH_SUNSET_2, GH_SUNSET_3],
  ),
  'local-scenic:goheung-other:팔영산자연휴양림': localScenicPhotoOverlay(
    '고흥10경 1경 팔영산 자연휴양림은 영남면 우천리 팔영산 동쪽 계곡(해발 약 400m)입니다. 숲나들e는 참나무류 천연림이며 산림문화휴양관 1동과 숲속의 집 9동, 야영데크·파고라가 있다고 적습니다. 주소는 영남면 팔영로 1347-418입니다. 팔영산 8봉(유영봉~적취봉) 암릉과 다도해 조망이 휴양림의 배경이며, 1998년 7월 16일 개장했습니다. 점암면 능가사·팔영산 편백치유의 숲과 다른 숙박·야영 시설이며, 같은 영남면 남열 해돋이해수욕장·영남용바위(용바위길 22)와도 다른 자리입니다. 사진은 한국관광공사 휴양림 산림문화휴양관·숲길·팔영산 8봉 공식 사진입니다.',
    '전라남도 고흥군 영남면 팔영로 1347-418 (팔영산 자연휴양림)',
    GH_FOREST,
    [GH_FOREST_2, GH_FOREST_3],
  ),
  'local-scenic:gimhae-gugyeong:화포천습지생태공원': localScenicPhotoOverlay(
    '김해9경 5경 화포천습지 생태공원은 한림면입니다. 김해시 관광 9경은 우리나라 최대의 하천형 배후습지이며 노랑부리저어새와 큰기러기를 비롯한 희귀 동식물이 서식하고 계절에 따라 모습이 바뀐다고 적습니다. 주소는 한림면 한림로 183-300입니다. 시 습지 안내는 낙동강과 만나는 화포천 중·하류이며 창녕 우포늪·창원 주남저수지·낙동강 하구를 잇는 철새 이동 거점이라고 합니다. 길이 3.5km·면적 약 159만㎡의 생태공원이며 탐방 A~D 코스(1~3km)와 생태학습관이 있습니다. 같은 리스트 1경 봉하마을(진영읍)과 다른 한림면 습지입니다. 사진은 한국관광공사 화포천의 아침(한림면) 공식 사진과 화포천습지과학관 공식 사진입니다.',
    '경상남도 김해시 한림면 한림로 183-300 (화포천습지 생태공원)',
    GIM_HWAPO,
    [GIM_HWAPO_2, GIM_HWAPO_3],
  ),
  'local-scenic:gimhae-gugyeong:경전철에서바라본가야유적': localScenicPhotoOverlay(
    '김해9경 8경 경전철에서 바라본 가야유적은 부산김해경전철 박물관역·수로왕릉역입니다. 김해시 관광 9경은 박물관역에서 국립김해박물관·구지봉·수로왕비릉을, 수로왕릉역에서 대성동고분군·수릉원·수로왕릉을 둘러볼 수 있다고 적습니다. 대성동고분군은 유네스코 세계유산이며 주소는 가야의길 126입니다. 같은 리스트 3경 김해 수로왕릉(왕릉로 26)과 다른 항목이며, GATEO 선정 가야테마파크와도 다른 원도심 경전철 구간입니다. 부산 도시철도·부산김해경전철 공항역 구간만의 풍경과 혼동하지 않습니다. 사진은 한국관광공사 김해 대성동고분군·국립김해박물관 공식 사진입니다.',
    '경상남도 김해시 가야의길 126 (대성동고분군·부산김해경전철 박물관역·수로왕릉역)',
    GIM_GAYA,
    [GIM_GAYA_2, GIM_GAYA_3],
  ),
  'local-scenic:gimhae-gugyeong:분산(천문대)전경및운무': localScenicPhotoOverlay(
    '김해9경 9경 분산(천문대)전경 및 운무는 어방동 분성산(분산) 정상 김해천문대입니다. 김해시 관광 9경은 천문대에서 바라보는 가야고도 김해의 전경(야경)과, 안개 때 임호산 봉우리와 경운산 일부를 제외한 김해 전체를 덮는 운무가 장관이라고 적습니다. 주소는 가야테마길 254입니다. 영남 최초 시민천문대로 2002년 2월 1일 개관했으며 알 모양 건물은 수로왕 탄생 설화에서 왔습니다. 같은 산 사적 분산성·GATEO 선정 가야테마파크와 다른 정상 전망이며, 증평 좌구산 천문대와 다른 자리입니다. 사진은 한국관광공사 김해천문대·분산성 공식 사진입니다.',
    '경상남도 김해시 가야테마길 254 (어방동 김해천문대·분성산)',
    GIM_ASTRO,
    [GIM_ASTRO_2, GIM_ASTRO_3],
  ),
  'local-scenic:daegu-sipgyeong:대구국채보상운동기념공원': localScenicPhotoOverlay(
    '대구12경 8경 국채보상운동 기념공원은 중구 동인동2가입니다. 대구관광안내는 1907년 대구에서 처음 시작된 국채보상운동의 정신이 깃든 도심 속 쉼터이며 총면적 42,509㎡에 잔디광장·오솔길·분수·정자가 있다고 적습니다. 주소는 국채보상로 670입니다. 한국관광공사는 달구벌 대종·종각과 독립지사 흉상, 국채보상운동 여성기념비, 공원 한쪽 국채보상운동기념관을 안내합니다. 달구벌대종은 22.5t이며 1998년 12월 22일 설치되어 제야의 종 타종식에 씁니다. 같은 리스트 9경 동성로·7경 경상감영공원 통일의 종(예전 제야의 종)과 다른 자리이며, 2·28기념중앙공원과도 다른 동인동 공원입니다. 사진은 한국관광공사 달구벌대종 종각·김광제·서상돈 흉상·국채보상운동 여성기념비 공식 사진입니다.',
    '대구광역시 중구 국채보상로 670 (동인동2가 국채보상운동기념공원)',
    DG_GUKCHAE,
    [DG_GUKCHAE_2, DG_GUKCHAE_3],
  ),
  'local-scenic:daegu-sipgyeong:대구달성토성': localScenicPhotoOverlay(
    '대구12경 6경 달성토성은 중구 달성동 달성공원입니다. 사적 제62호 대구 달성이며 대구관광안내는 달구벌의 토성에서 이름이 왔다고 적습니다. 주소는 달성공원로 35입니다. 한국관광공사는 우리나라 성곽 발달 사상 이른 시기의 토성이며 공원 둘레 오솔길이 있다고 합니다. 1601년 경상감영 정문이었던 관풍루는 1906년 이곳으로 옮겨 언덕 위에 있습니다. 달성군 화원읍 달성습지·비슬산 달성군립공원·목포 유달산 달성공원과 다른 중구 토성이며, 같은 리스트 7경 경상감영공원(관풍루 원래 자리)과도 다른 자리입니다. 사진은 한국관광공사 관풍루·달성공원 잔디와 누각 공식 사진입니다.',
    '대구광역시 중구 달성공원로 35 (달성동 달성공원·사적 대구 달성)',
    DG_DALSEONG,
    [DG_DALSEONG_2, DG_DALSEONG_3],
  ),
  'local-scenic:daegu-sipgyeong:대구경상감영과옛골목': localScenicPhotoOverlay(
    '대구12경 7경 경상감영과 옛골목은 중구 포정동 경상감영공원과 인근 근대골목입니다. 대구관광안내는 선조 34년(1601) 경상감영이 있던 곳이며 1970년 중앙공원으로 개장한 뒤 경상감영공원으로 불렀다고 적습니다. 주소는 경상감영길 99입니다. 사적 제538호 대구 경상감영지이며 관찰사 집무실 선화당과 처소 징청각이 원위치에 있습니다. 관풍루는 1906년 6경 달성토성으로 옮겨졌습니다. 인근 옛골목은 근대골목 1코스 경상감영달성길(향촌동·북성로·대구근대역사관)이며 한국관광 100선입니다. 상주 태평성대경상감영공원·공주 충청감영·원주 강원감영과 다른 대구 감영지이며, 계산예가·청라언덕 2코스와도 다른 1코스입니다. 사진은 대구광역시 중구 선화당·징청각 항공 공식 사진과 선화당 배롱나무 공식 사진입니다.',
    '대구광역시 중구 경상감영길 99 (포정동 경상감영공원·근대골목 1코스)',
    DG_GAMYEONG,
    [DG_GAMYEONG_2, DG_GAMYEONG_3],
  ),
  'local-scenic:yeosu-other:여수세계박람회장': localScenicPhotoOverlay(
    '여수10경 5경 여수세계박람회장은 덕충동입니다. 여수시 관광 10경은 2012년 여수세계박람회 개최지이며 빅오쇼·스카이타워·아쿠아플라넷과 수변공원이 있는 해양 복합공간이라고 적습니다. 주소는 박람회길 1입니다. 시 안내는 820만 관람객이 찾은 박람회 뒤 빅오(디오 The-O와 해상분수)·스카이타워·엑스포디지털갤러리를 핵심 시설로 소개합니다. 스카이타워는 시멘트 사일로를 살린 전망대이자 파이프오르간이며, 빅오는 분수·안개·화염·레이저 뉴미디어 쇼입니다. 2026 여수세계섬박람회(섬 주제 별도 행사)·함평엑스포공원·9경 해상케이블카와 다른 덕충동 박람회장입니다. 사진은 여수시 관광 엑스포장 항공(빅오·디지털갤러리)·10경 빅오쇼·스카이타워 야경 공식 사진입니다.',
    '전라남도 여수시 박람회길 1 (덕충동 여수세계박람회장)',
    YS_EXPO,
    [YS_EXPO_2, YS_EXPO_3],
  ),
  'local-scenic:yeosu-other:여수밤바다와산단야경': localScenicPhotoOverlay(
    '여수10경 7경 여수 밤바다와 산단 야경은 종화동 해양공원·돌산공원에서 보는 도심 밤바다와 화치동 여수국가산업단지 야경입니다. 여수시 관광 10경은 버스커버스커가 노래한 해안선 야경이며, 해양공원에서 돌산대교·거북선대교·장군도를, 돌산공원에서 돌산대교와 장군도 야경을 본다고 적습니다. 돌산대교는 밤마다 50여 가지 색 경관조명을 켭니다. 산단은 1967년 조성 정유·비료·석유화학 국내 최대 중화학단지이며, 화치동 산183-4 국가산단전망대(2009년 3월)가 조망 포인트입니다. 광양9경 광양만 야경(구봉산·포스코 광양제철)·9경 해상케이블카 야경·10경 이순신대교와 다른 여수 도심·여천 산단 야경입니다. 사진은 여수시 관광 밤바다 야경(남산공원)·10경 돌산대교·해양공원 공식 사진입니다.',
    '전라남도 여수시 종화동 해양공원·돌산공원 및 화치동 여수국가산단전망대',
    YS_NIGHT,
    [YS_NIGHT_2, YS_NIGHT_3],
  ),
  'local-scenic:yeosu-other:여수해상케이블카': localScenicPhotoOverlay(
    '여수10경 9경 여수해상케이블카는 돌산읍 돌산공원(놀아정류장)과 자산공원(해야정류장)을 잇는 1.5km 국내 첫 해상케이블카입니다. 여수시 관광 10경은 바닥이 투명한 크리스탈 캐빈 15대와 일반 캐빈 35대, 총 50대가 운행하며 박람회장·오동도·다도해와 밤바다를 본다고 적습니다. 주소는 돌산로 3600-1(돌산)·오동도로 116(자산, 소노캄 맞은편)입니다. 2014년 12월 개통, 아시아에서는 홍콩·싱가포르·베트남에 이은 네 번째 해상 노선입니다. 목포해상케이블카·사천바다케이블카·부산 송도해상케이블카와 다른 여수 돌산~자산 노선입니다. 사진은 여수시 관광 해상케이블카 캐빈(거북선대교)·10경 캐빈 내부·돌산 전망 공식 사진입니다.',
    '전라남도 여수시 돌산읍 돌산로 3600-1 (돌산공원)·오동도로 116 (자산공원)',
    YS_CABLE,
    [YS_CABLE_2, YS_CABLE_3],
  ),
  'local-scenic:yeosu-other:진남관': localScenicPhotoOverlay(
    '여수10경 6경 진남관은 고소동 동문로 11입니다. 여수시 관광 10경은 충무공 이순신이 전라좌수영 본영으로 삼았던 진해루 터이며, 1599년(선조 32) 후임 통제사 겸 전라좌수사 이시언이 정유재란 때 불탄 자리에 75칸 객사를 세우고 남쪽의 왜구를 진압해 나라를 평안하게 한다는 뜻으로 진남관(鎭南館)이라 했다고 적습니다. 정면 15칸·측면 5칸(약 240평)으로 현존 지방관아 가운데 최대 규모 단층 목조이며, 1963년 보물 지정 뒤 2001년 국보 제304호가 됐습니다. 정문 2층 누각 망해루는 일제강점기에 철거됐다가 복원됐습니다. 순천 낙안읍성 객사·남원 광한루·여수 이순신광장과 다른 고소동 전라좌수영 객사입니다. 사진은 여수시 관광 10경 진남관 전경·내부 열주·야경 공식 사진입니다.',
    '전라남도 여수시 동문로 11 (고소동 진남관·망해루)',
    YS_JINNAM,
    [YS_JINNAM_2, YS_JINNAM_3],
  ),
  'local-scenic:yeosu-other:여수이순신대교': localScenicPhotoOverlay(
    '여수10경 10경 여수 이순신대교는 묘도동과 광양시 금호동을 잇는 현수교입니다. 여수시 관광 10경은 순수 우리 기술로 만든 국내 첫 현수교이며, 주탑 높이 270m는 63빌딩보다 높고 콘크리트 주탑으로는 세계 최고, 주탑 사이 1,545m는 이순신 장군 탄신 해(1545)를 기린다고 적습니다. 노량해전이 펼쳐진 묘도~금호 바다 위에 있으며, 여수 쪽 전망대는 거북선을 형상화한 실내 조망 시설입니다. 광양9경 제4경 광양이순신대교와 같은 다리의 광양시 안내·사진이 아니며, Tour 이순신대교홍보관(실내 전시)과도 다른 여수 묘도 10경 경관입니다. 사진은 여수시 관광 10경 이순신대교 항공·주행·야경 공식 사진입니다.',
    '전라남도 여수시 묘도동 (이순신대교·여수 전망대)',
    YS_BRIDGE,
    [YS_BRIDGE_2, YS_BRIDGE_3],
  ),
  'local-scenic:yecheon-palgyeong:금당실전통마을과송림': localScenicPhotoOverlay(
    '예천8경 3경 금당실 전통마을과 송림은 용문면 상금곡리입니다. 예천군 문화관광 8경은 조선시대 전통가옥을 간직한 마을이며, 전쟁이나 천재지변에도 안심할 수 있는 땅으로 조선 태조가 도읍지로 정하려 했던 십승지 가운데 하나라고 적습니다. 주소는 금당실길 52-4입니다. 청동기 고인돌·금곡서원·추원재 및 사당·반송재 고택·사괴당 고택과 99칸 저택터가 있고, 마을 안길은 돌담길입니다. 마을 서북쪽 송림은 천연기념물 제469호 예천 금당실 송림으로, 오미봉 아래에서 용문초등학교 앞까지 약 800m 소나무 숲이며 수해·북서풍을 막기 위해 조성했습니다. 같은 면 죽림리 4경 초간정 및 원림·5경 용문사와 다른 상금곡리 마을이며, 7경 석송령(감천면 한 그루 반송)·8경 선몽대 송림(호명읍 백송리)·안동 하회마을·영주 무섬마을과 다른 자리입니다. 사진은 예천군 문화관광 8경 금당실 고택·국가유산청 금당실 송림 공식 사진입니다.',
    '경상북도 예천군 용문면 금당실길 52-4 (상금곡리 금당실 마을)',
    YC_GEUM,
    [YC_GEUM_2, YC_GEUM_3],
  ),
  'local-scenic:yecheon-palgyeong:예천곤충생태원': localScenicPhotoOverlay(
    '예천8경 6경 예천곤충생태원은 효자면 고항리입니다. 예천군 문화관광 8경은 국내외 곤충을 보고 만질 수 있는 생태체험관이며, 예천곤충바이오엑스포를 2007년(62만)·2012년(85만)·2016년(62만) 열어 전국 곤충생태체험 명소가 됐다고 적습니다. 주소는 은풍로 1045입니다. 예천군곤충연구소·곤충생태원이며 환경부 지정 생물다양성 관리기관입니다. 곤충생태체험관(3D영상관·학습관·생태관·자원관)과 무당벌레 모양 멀티체험관, 야외 나비 터널·동굴곤충체험관·전망대·모노레일이 있습니다. 함평엑스포공원·함평나비대축제·예천곤충축제(계절 행사)와 다른 효자면 상설 생태원이며, 도로명 은풍로는 은풍면이 아니라 효자면입니다. 사진은 예천군 문화관광 8경 생태원 항공·곤충연구소 야외 전경·무당벌레 멀티체험관 공식 사진입니다.',
    '경상북도 예천군 효자면 은풍로 1045 (고항리 577 예천군곤충연구소·곤충생태원)',
    YC_INSECT,
    [YC_INSECT_2, YC_INSECT_3],
  ),
  'local-scenic:yecheon-palgyeong:석송령': localScenicPhotoOverlay(
    '예천8경 7경 석송령은 감천면 천향리 석평마을입니다. 예천군 문화관광 8경은 천연기념물로 지정된 600년이 넘는 반송이며 부귀·장수·상록을 상징하고, 수고 10m·가슴높이 둘레 4.2m·그늘 약 1,000㎡라고 적습니다. 주소는 석송로 321-6(천향리 804)입니다. 천연기념물 제294호 예천 천향리 석송령입니다. 1930년경 마을 사람 이수목이 영험 있는 나무라는 뜻으로 이름을 짓고 토지 3,937㎡를 등기해 주어, 세금을 내고 관내 학생에게 장학금을 주는 부자나무가 됐습니다. 정월 대보름 동제를 지내는 동신목입니다. 3경 금당실 송림(용문면 마을숲)·예천 금남리 황목근·보은 속리 정이품송과 다른 감천면 한 그루입니다. 사진은 예천군 문화관광 8경 석송령 전경·국가유산청 석송령 공식 사진입니다.',
    '경상북도 예천군 감천면 석송로 321-6 (천향리 804 석평마을 석송령)',
    YC_SEOK,
    [YC_SEOK_2, YC_SEOK_3],
  ),
  'yonggung-market': localScenicPhotoOverlay(
    '용궁시장은 예천군 용궁면 읍부리 전통 오일장(4·9일)이자 상설 골목시장입니다. 예천군 문화관광은 순대국밥 맛집이 가득한 용궁시장으로 안내하며 주소는 용궁로 118·용궁시장길입니다. 별주부전 설화의 용왕·토끼 조형과 용궁순대 골목이 있고, 장터에서 회룡포·삼강주막으로 이어집니다. 명승 16호 회룡포(내성천이 휘감은 물돌이) 항공 사진이 아니며, 같은 면 회룡포 전망대·뿅뿅다리와 다른 읍부리 장터입니다. 사진은 예천군 문화관광 TV따라 여행 용궁시장·용궁순대축제 공식 사진입니다.',
    '경상북도 예천군 용궁면 용궁시장길 10-4 (읍부리 용궁시장)',
    YC_MARKET,
    [YC_MARKET_2, YC_MARKET_3, YC_MARKET_4],
  ),
  'local-scenic:incheon-gugyeong:인천계양아라온': localScenicPhotoOverlay(
    '인천9경 4경 계양 아라온은 계양구 장기동 경인아라뱃길 황어광장~수향원 구간입니다. 인천광역시는 2024년 「야경 명소 계양 아라온에서 빛의 거리 구경하기」로 선정했으며, 계양대교 밑 뱃길을 따라 낮에는 꽃의 정원을 거닐고 해질 무렵 낙조를 본 뒤 저녁에는 빛의 거리·미디어아트 야경을 즐긴다고 적습니다. 계양구는 황어광장부터 수향원 일대를 「계양 아라뱃길 빛의 거리」로 조성했고 주소는 장기동 109-1(수향원 주차장)입니다. 아라뱃길 공영주차장은 장기동 55-3입니다. 서해구 아라인천여객터미널·정서진(수향1경)·아라폭포·송도센트럴파크와 다른 계양구 뱃길 구간입니다. 사진은 한국수자원공사 경인아라뱃길 공식 관광 사진입니다.',
    '인천광역시 계양구 장기동 109-1 (황어광장~수향원 계양 아라온 빛의 거리)',
    IC_ARAON,
    [IC_ARAON_2, IC_ARAON_3],
  ),
  'local-scenic:incheon-gugyeong:인천영종씨사이드파크': localScenicPhotoOverlay(
    '인천9경 6경 영종 씨사이드파크는 중구 영종도 해변공원입니다. 인천광역시는 「영종 씨사이드파크에서 바닷길 따라 레일바이크 타기」로 선정했으며, 레일바이크를 타고 인천 해안경관을 만끽하고 캠핑장·염전산책 등 자연 속 액티비티를 즐긴다고 적습니다. 영종씨사이드 레일바이크 주소는 구읍로 75이며 4인승 레일바이크 왕복 5.6km 해안 코스입니다. 한국관광공사는 월미도·인천대교까지 바다 전망과 인공폭포 등 부대시설을 안내합니다. 인천시설공단 씨사이드파크는 중산동 136-12입니다. 을왕리해수욕장·월미도·강화 섬과 다른 영종 해변공원입니다. 사진은 한국관광공사 영종씨사이드 레일바이크·인천시설공단 레일바이크 공식 사진입니다.',
    '인천광역시 중구 구읍로 75 (영종씨사이드파크·레일바이크)',
    IC_SEASIDE,
    [IC_SEASIDE_2, IC_SEASIDE_3],
  ),
  'local-scenic:incheon-gugyeong:인천강화읍원도심': localScenicPhotoOverlay(
    '인천9경 7경 강화읍 원도심은 강화군 강화읍 역사·문화 도보 탐방 구간입니다. 인천광역시는 「강화읍 원도심에서 도보 탐방하기」로 선정했으며, 숨겨진 역사와 문화를 걸으며 강화의 역사·산업·종교를 만나고 문화관광해설사 도보해설·원데이 클래스를 즐긴다고 적습니다. 강화군 도보해설 코스는 용흥궁→대한성공회강화성당→3·1독립만세 기념비→고려궁지→노동사목 표지석→이화견직 담장길→김상용 순절비·심도직물(약 1시간 20분)입니다. 네이버 예약 용흥궁 해설사 대기소. GATEO 선정 고려궁지(127184) 단일 명소가 아니라 읍성·성당·고택이 이어지는 원도심 일주이며, 강화 전등사·보문사(석모도)와 다른 강화읍 마을입니다. 사진은 강화군 문화관광 원도심 도보해설(스토리워크) 공식 사진입니다.',
    '인천광역시 강화군 강화읍 강화대로 394 일원 (원도심 도보해설·용흥궁)',
    IC_GANGHWA,
    [IC_GANGHWA_2, IC_GANGHWA_3],
  ),
  'local-scenic:yanggu-gugyeong:양구수목원': localScenicPhotoOverlay(
    '양구9경 1경 양구 수목원은 동면 원당리 대암산 자락입니다. 양구군 문화관광은 도내 6번째 공립 수목원으로 등록되어 1,000여 종의 나무와 식물을 한곳에서 감상할 수 있다고 적습니다. 2004년 생태 식물원 조성을 시작으로 DMZ야생동물생태관·DMZ야생화분재원·목재문화체험관·DMZ무장애나눔길·생태 탐방로가 어우러진 자연 중심 수목원입니다. 해발 450m이며 주소는 숨골로310번길 132입니다. 숲 키움터(멸종위기 식물 보전원·유리온실)·숲 놀이터(우주 콘셉트 놀이터)·숲 배움터(야생화 정원)로 나뉩니다. 옛 이름 양구자연생태공원입니다. 구례 수목원·홍성 그림같은수목원·거제식물원·광릉 국립수목원과 다른 양구 동면 공립 수목원입니다. 사진은 양구수목원 공식 홈·양구 DMZ 생태관광협회 1경 공식 사진입니다.',
    '강원특별자치도 양구군 동면 숨골로310번길 132 (양구수목원)',
    YG_ARB,
    [YG_ARB_2, YG_ARB_3],
  ),
  'local-scenic:yanggu-gugyeong:양구봉화산': localScenicPhotoOverlay(
    '양구9경 7경 양구 봉화산은 국토정중앙면 죽리입니다. 양구군 문화관광은 도심 정남향 해발 875m 산이며, 정상에서 양구시가지와 사명산·대암산 자락을 조망한다고 적습니다. 이름은 조선 선조 37년(1604) 정상 봉화대에서 유래했습니다. 6·25 전 양남팔경의 봉화낙월(서산 일몰과 남쪽 봉화산의 달)입니다. 정상 서쪽 약 500m·북동쪽 약 200m 초원은 한라산 축소판처럼 시원하고 가을 억새 산행 코스입니다. 산자락 아래 소양호를 조망합니다. 6·25 이후 군부대 사격장이라 평일 등산 불가·주말(공휴일)만 이용합니다. 국토정중앙천문대(박수근로 21-17)·서울 중랑 봉화산·화천 용화산과 다른 양구 국토정중앙면 산입니다. 사진은 양구 DMZ 생태관광협회 7경 공식 사진입니다.',
    '강원특별자치도 양구군 국토정중앙면 죽리 (양구 봉화산)',
    YG_BONG,
    [YG_BONG_2, YG_BONG_3],
  ),
  'local-scenic:yanggu-gugyeong:양구상무룡출렁다리': localScenicPhotoOverlay(
    '양구9경 8경 양구 상무룡 출렁다리는 양구읍 월명리입니다. 양구 DMZ 생태관광협회는 2022년 개통해 월명리와 상무룡2리(서호마을)를 잇는 총 길이 335m 보도 전용 현수교이며, 일부 구간이 강화유리아라 발 아래 파로호를 본다고 적습니다. 주탑 높이 36m입니다. 입구 주소는 간척월명로 1719-21(월명리 산1-53)입니다. 입장·주차 무료입니다. 화순 백아산 하늘다리·금산 월영산 출렁다리·거제 매미성 인근 다리와 다른 파로호 현수교입니다. 사진은 양구 DMZ 생태관광협회 8경 공식 사진입니다.',
    '강원특별자치도 양구군 양구읍 간척월명로 1719-21 (상무룡 출렁다리)',
    YG_BRIDGE,
    [YG_BRIDGE_2, YG_BRIDGE_3],
  ),
  'local-scenic:jeongeup-gugyeong:동학농민혁명기념공원': localScenicPhotoOverlay(
    '정읍9경 4경 동학농민혁명기념공원은 덕천면 하학리입니다. 정읍시 문화관광은 1894년 반부패·반봉건·반외세의 기치를 들고 봉기한 동학농민군이 관군을 크게 이긴 최초 전승지 황토현 전적 안에 국가사업으로 들어선 공원이며, 전시관·추모관·기념관이 있다고 적습니다. 주소는 동학로 742입니다. 사적 제295호 정읍 황토현전적 일대이며, 동학농민혁명기념재단은 2022년 5월 11일(동학농민혁명기념일) 개원했다고 안내합니다. 면적 약 30만㎡이며 사발통문광장·울림의 기둥·기억의 들판·방문자센터511과 군상 「불멸, 바람길」이 있습니다. 2004년 개관한 동학농민혁명기념관(동학로 715) 단독 전시관이 아니라 2022년 연 공원이며, 고창 무장·전주 동학농민혁명기념관·내장산국립공원과 다른 덕천면 황토현입니다. 사진은 정읍시 문화관광 4경·동학농민혁명기념재단 공식 사진입니다.',
    '전북특별자치도 정읍시 덕천면 동학로 742 (하학리 동학농민혁명기념공원)',
    JE_DH,
    [JE_DH_2, JE_DH_3],
  ),
  'local-scenic:jeongeup-gugyeong:용산호': localScenicPhotoOverlay(
    '정읍9경 6경 용산호는 신정동 내장산리조트관광지입니다. 정읍시 문화관광은 호수를 가로지르는 데크에서 산책하고 미르샘분수를 보며, 주변 리조트와 낭만모래사장이 운치를 더한다고 적습니다. 주소는 신정동 132-11입니다. 2022년 개통한 미르샘다리는 길이 642m·폭 2m 수면 위 보행 데크이며, 중심부에 단풍·구절초·라벤더 구(毬)·정읍을 뜻하는 샘(井)·용(龍) 조형과 약 18m 조형 낙하 분수가 있습니다. 서울 용산·임실 옥정호(구 정읍 9경)·1경 내장산국립공원·GATEO 선정 단풍생태공원과 다른 신정동 호수입니다. 사진은 정읍시 문화관광 6경 용산호·미르샘 공식 사진입니다.',
    '전북특별자치도 정읍시 신정동 132-11 (용산호·미르샘다리)',
    JE_YS,
    [JE_YS_2],
  ),
  'local-scenic:jeongeup-gugyeong:월영습지와솔티숲': localScenicPhotoOverlay(
    '정읍9경 8경 월영습지와 솔티숲은 쌍암동·송산동 내장산 자락입니다. 정읍시 문화관광은 국가생태관광지로 선정될 만큼 생태계가 잘 보존되고, 나무와 덩굴이 엉클어진 원시 숲 형태를 간직한다고 적습니다. 9경 안내는 쌍암동 1029이며, 월영습지 탐방안내소는 송산동 산112, 솔티숲은 송죽길 25입니다. 2014년 환경부 습지보호지역으로, 낮은 산 정상부 곡저분지의 저층형 산지 내륙습지입니다. 화전 폐경지가 약 50년 방치되며 자연 천이한 네 곳 습지이며 깃대종 비단벌레·진노랑상사화가 있습니다. 안동 월영교·금산 월영산·군산 선유8경 월영단풍·3경 정읍사공원·단풍생태공원과 다른 송산 습지·솔티마을 숲입니다. 사진은 정읍시 문화관광 8경·월영습지와 솔티숲 생태관광 공식 사진입니다.',
    '전북특별자치도 정읍시 쌍암동 1029 (월영습지 탐방안내소 송산동 산112·솔티숲 송죽길 25)',
    JE_WY,
    [JE_WY_2, JE_WY_3],
  ),
  'local-scenic:jeongseon-palgyeong:거북바위': localScenicPhotoOverlay(
    '화암8경 2경 거북바위는 화암면 화암리입니다. 정선군 공식 관광(화암8경)은 화암약수 진입로 오른쪽 절벽 위 둘레 6m 거북 모양 기암이며 머리·네 다리·꼬리가 갖춰져 능선을 오르는 듯하다고 적습니다. 주소는 화암리 336-1입니다. 마을 수호 바위로, 정성 들여 찾으면 건강·마음 평화·장수를 얻는다고 전합니다. 맞은편에서 신선바위를 본다고 안내합니다. 1977년 국민관광지 화암관광지(약수길 1328 일원) 8경 중 2경입니다. 여수 거북바위·거제 학동·남해 물건리 거북바위와 다른 화암리 절벽 위 바위입니다. 사진은 정선군 공식 화암8경 거북바위 사진입니다.',
    '강원특별자치도 정선군 화암면 화암리 336-1 (거북바위)',
    JS_GEBUK,
  ),
  'local-scenic:jeongseon-palgyeong:용마소': localScenicPhotoOverlay(
    '화암8경 3경 용마소는 화암면 화암리입니다. 정선군 공식 관광은 주소 화암리 1306-1이며, 그림바위 앞 넓은 반석 아래로 맑은 물이 흐르는 소(沼)라고 적습니다. 화암약수 진입로에서 약 500m 아래 하천변입니다. 조선 중기 그림바위 마을 아기장수 전설이 있으며, 용마가 주인을 찾아 울다 이 소에 빠져 죽었다 하여 일명 용사소(龍死沼)라고도 합니다. 화암면은 깊은 소와 폭포가 어우러진다고 안내합니다. 입장 무료입니다. 다른 고을 용소·용마공원·정읍 용산호와 다른 화암리 소입니다. 사진은 정선군 공식 화암8경 용마소 사진입니다.',
    '강원특별자치도 정선군 화암면 화암리 1306-1 (용마소)',
    JS_YONGMA,
  ),
  'local-scenic:jeongseon-palgyeong:화표주': localScenicPhotoOverlay(
    '화암8경 5경 화표주는 화암면 화암리입니다. 정선군 공식 관광은 주소 화암리 329-4이며, 절벽 옆 긴 돌기둥 두 개라고 적습니다. 화암리에서 화표동(몰운대 방면) 삼거리 오른쪽 약 30m입니다. 신선들이 이 기둥에 신틀을 걸고 짚신(집신)을 삼았다는 전설이 있습니다. 화암면은 겸재 정선의 작품으로도 알려진다고 안내합니다. 소금강(설암)·몰운대·광대곡·단양 도담삼봉과 다른 화표동 입구 두 기둥입니다. 사진은 정선군 공식 화암8경 화표주 사진입니다.',
    '강원특별자치도 정선군 화암면 화암리 329-4 (화표주)',
    JS_HWAPYO,
  ),
  'local-scenic:taebaek-palgyeong:장성하부고생대화석산지': localScenicPhotoOverlay(
    '태백8경 3경 장성하부고생대화석산지는 장성동입니다. 태백시 문화관광은 천연기념물 「태백 장성 오르도비스기 화석산지」로, 고생대 생물이 화석으로 잘 보존되어 삼엽충·완족류·두족류·복족류가 대표적이라고 적습니다. 주소는 장성동 산42-2번지 일원입니다. 국가유산청은 2000년 4월 28일 지정·면적 186,831㎡이며 관리자는 태백시입니다. 강원고생대국가지질공원은 전기 고생대 조선누층군 직운산층, 오르도비스기 깊은 바다의 세립질 퇴적암이며 삼엽충·두족류·필석·극피동물·코노돈트가 보고된다고 적습니다. 태백시는 삼엽충 5속 15종·1cm 이하~22cm, 한반도에서는 주로 이곳에서 발견된다고 안내합니다. 1986년 강원도 기념물 제57호에서 승격했습니다. 현장은 보호 펜스로 출입이 제한됩니다. 전남 장성군·2경 구문소·태백고생대자연사박물관·나팔고개 삼엽충 산지와 다른 장성동 직운산층 노두입니다. 사진은 국가유산청·강원고생대국가지질공원·태백시 문화관광 공식 사진입니다.',
    '강원특별자치도 태백시 장성동 산42-2 (태백 장성 오르도비스기 화석산지)',
    TB_FOSSIL,
    [TB_FOSSIL_2, TB_FOSSIL_3],
  ),
  'local-scenic:taebaek-palgyeong:용연굴': localScenicPhotoOverlay(
    '태백8경 7경 용연굴은 화전동 용연동굴입니다. 태백시 관광은 「태백 용연굴(자연유산)」로, 용의 연못 속 용이 계곡을 따라 하늘로 승천했다는 이름이며 금대봉 하부능선 해발 920m, 약 1억5천~3억 년 전, 길이 약 843m, 4개 광장과 순환형 수평굴이라고 적습니다. 주소는 태백로 283-29입니다. 강원고생대국가지질공원은 개방 동굴 가운데 가장 높은 고도의 자연 석회동굴이며 중간부 광장은 폭·높이 약 30m·길이 약 150m, 강원특별자치도 기념물 제39호라고 적습니다. 한국관광공사·태백시는 내부 평균 9~12℃, 긴다리장님좀먼지벌레 등 동굴생물, 매표소에서 열차 또는 도보, 월요일 휴관·09:00~18:00을 안내합니다. 1997년 11월 1일부터 관광 개방입니다. 영동 한천 용연대·정선 화암동굴·삼척 환선굴·단양 고수동굴·울진 성류굴과 다른 화전동 고지대 건식 석회동굴입니다. 사진은 강원고생대국가지질공원·태백시 관광 공식 사진입니다.',
    '강원특별자치도 태백시 태백로 283-29 (화전동 용연동굴)',
    TB_CAVE,
    [TB_CAVE_2, TB_CAVE_3, TB_CAVE_4],
  ),
  'local-scenic:taebaek-palgyeong:절골마을관리휴양지': localScenicPhotoOverlay(
    '태백8경 8경 절골마을관리휴양지는 황지동 함백산 동쪽 절골입니다. 한국관광공사는 본적사지3층석탑 안내에서 함백산(1,573m) 동쪽 산기슭, 절골 유원지 입구 다리를 지나 민가가 들어선 일대가 절터이며 절이 많아 절골이라 한다고 적습니다. 본적사지는 번적사지라고도 하며 주소는 절골1길 90(황지동 467-10)입니다. 태백시시설관리공단은 같은 골 황지동 466-36에 절골힐링캠핑장을 두고, 대지면적 9,896㎡·자동차야영 14면·야영노지 16면이며 주소는 오투로 116입니다. 국가유산청은 태백 본적사지 삼층석탑재(강원도 문화재자료)를 황지동 467-10으로 적습니다. 철암 머리골 태백고원자연휴양림·고원힐링캠핑장·정선 고한과 다른 황지동 절골 계곡입니다. 사진은 태백시시설관리공단 절골힐링캠핑장 공식 사진입니다.',
    '강원특별자치도 태백시 오투로 116 (황지동 466-36 절골힐링캠핑장·절골1길 90 본적사지)',
    TB_JEOL,
    [TB_JEOL_2, TB_JEOL_3],
  ),
  'local-scenic:uijeongbu-palgyeong:수락산도정봉': localScenicPhotoOverlay(
    '의정부8경 3경 수락산 도정봉은 장암동 수락산입니다. 의정부시 문화관광 8경은 화강암 능선이 펼쳐진 경관으로, 해발 526m이며 수락산 주봉으로 올라가는 코스라고 적습니다. 추천 만가대 코스는 4.5km·약 1시간 50분(만가대 화기물 보관 초소→도정봉→기차바위→정상), 동막골 코스는 5.3km·약 2시간 10분(동막골 장암주공삼거리→도정봉→기차바위→정상)입니다. 도정봉을 지나 기차바위·철모바위 등 기암을 보며 산행 내내 탁 트인 전망이 열린다고 안내합니다. 수락산(638m)은 서울시·의정부시·남양주시 별내면 경계이며 금류·은류·옥류 폭포와 흥국사·내원사·석림사·궤산정이 산재합니다. 남쪽은 불암산, 서쪽은 도봉산입니다. 지하철 4호선 당고개역·학림사·용굴암은 서울 쪽 선호 코스이며 노원 수락산 주봉·도봉산·논산 대둔산 수락계곡과 다른 장암동 도정봉입니다. 사진은 의정부시 문화관광 8경 수락산 도정봉 공식 사진입니다.',
    '경기도 의정부시 장암동 (동막골 장암주공삼거리·만가대 코스 수락산 도정봉)',
    UJ_DOJEONG,
    [UJ_DOJEONG_2],
  ),
  'local-scenic:uijeongbu-palgyeong:의정부경전철': localScenicPhotoOverlay(
    '의정부8경 5경 의정부경전철은 의정부 일대입니다. 의정부시 문화관광 8경은 2012년에 개통한 경기도 최초의 경전철이며, 전 구간에서 도시와 자연을 잇는 풍경을 감상할 수 있어 이동 자체가 여행이 된다고 적습니다. 소재지는 의정부 일대, 대표번호는 031-820-1004입니다. 공식 노선 안내는 발곡~회룡·범골·경전철의정부·의정부시청·흥선·의정부중앙·동오·새말·경기도청북부청사·효자·곤제·어룡·송산·탑석~차량기지 임시승강장입니다. 친환경 교통으로 문화 공간과 관광 명소를 연결한다고 안내합니다. 부산김해경전철·용인 에버라인·인천 월미바다열차·김해9경 「경전철에서 바라본 가야유적」과 다른 의정부 U라인입니다. 사진은 의정부시 문화관광 8경 의정부 경전철 전경 공식 사진입니다.',
    '경기도 의정부시 일대 (발곡역~탑석역·차량기지 임시승강장, 의정부경전철 중앙역)',
    UJ_LRT,
    [UJ_LRT_2, UJ_LRT_3, UJ_LRT_4],
  ),
  'local-scenic:uijeongbu-palgyeong:의정부제일시장': localScenicPhotoOverlay(
    '의정부8경 7경 의정부제일시장은 의정부동입니다. 의정부시 문화관광 8경은 전통과 현대가 어우러진 우수 재래시장으로, 주소 시민로121번길 43-2, 대표번호 031-846-2617, 의정부역 하차 후 도보 2분이라고 적습니다. 1978년 설립, 점포 600개가 넘는 대형 전통시장이며 가·나·다·라동으로 나뉩니다. 가동은 의류, 나동은 잡화·커튼, 다동은 식품·방앗간, 라동은 한복 등 일반 의류입니다. 중심 십자마당은 공연문화 커뮤니티입니다. 행복로를 따라 부대찌개거리·녹색거리·로데오거리와 이어지나 번화가 끝의 재래시장입니다. 경기북부에서 규모가 큰 시장이며 2008년 전통시장 활성화 평가에서 도내 1위·전국 3위였다고 안내합니다. GATEO 선정 의정부 부대찌개거리·행복로·다른 도시 제일시장과 구분합니다. 사진은 의정부시 문화관광 8경·한국관광공사 의정부 제일시장 공식 사진입니다.',
    '경기도 의정부시 시민로121번길 43-2 (의정부동 의정부제일시장)',
    UJ_MARKET,
    [UJ_MARKET_2, UJ_MARKET_VK, UJ_MARKET_VK_2, UJ_MARKET_VK_3, UJ_MARKET_VK_4],
  ),
  'local-scenic:tongyeong-palgyeong:연화도용머리': localScenicPhotoOverlay(
    '통영팔경 1경 연화도 용머리는 욕지면 연화리입니다. 통영시 공식 팔경은 주소 욕지면 연화리, 문의 055-650-0580·055-650-2570이라고 적습니다. 섬 동남쪽 끝의 해안 절벽과 네 개 바위섬이 용이 바다를 향해 헤엄치는 머리처럼 보여 용머리라 부릅니다. 둘레 약 12km 연화도의 대표 경승이며 동두항에서 전망대로 오릅니다. 제주 용머리해안·연화사 법당·용머리민박과 다른 욕지면 연화리 해식절벽입니다. 사진은 통영U투어 연화도 용머리 해안 공식 사진입니다.',
    '경상남도 통영시 욕지면 연화리 (연화도 용머리)',
    TY_YONG,
    [TY_YONG_2, TY_YONG_3, TY_YONG_4],
    TY_YONG_HOME,
  ),
  'local-scenic:tongyeong-palgyeong:남망산공원': localScenicPhotoOverlay(
    '통영팔경 3경 남망산공원은 동호동입니다. 한국관광공사는 남망산 조각공원으로, 주소 남망공원길 29, 문의 055-650-4560, 연중무휴이며 세계 10개국 조각가 15명의 작품으로 1997년 조성된 5,000여 평 조각공원이라고 적습니다. 통영시 시민문화회관도 같은 남망공원길 29입니다. 남망산은 해발 약 80m이며 정상에는 1953년 6월 세운 이충무공 동상이 있고 통영항·한산도를 조망합니다. 공원 구분 문화공원, 면적 152,311㎡, 지번 동호동 230-1입니다. 같은 산 야간 미디어 산책 디피랑(DPIRANG)은 남망산공원 안에 있으나 별도 매표·수요일 휴장이며, 동피랑벽화마을·서피랑·이순신공원·서울 남산과 다른 동호동 조각공원입니다. 사진은 한국관광공사 남망산 조각공원 공식 사진입니다.',
    '경상남도 통영시 남망공원길 29 (동호동 230-1 남망산공원·남망산 조각공원)',
    TY_NAM,
    [TY_NAM_2, TY_NAM_3],
  ),
  'local-scenic:tongyeong-palgyeong:한산도제승당': localScenicPhotoOverlay(
    '통영팔경 4경 한산도제승당은 한산면 두억리입니다. 국가유산청은 사적 「통영 한산도 이충무공 유적」(1963년 1월 21일 지정, 2011년 명칭 변경)으로, 주소 한산일주로 70입니다. 제승당은 승리를 만드는 집이며, 임진왜란 중 이순신이 참모와 작전한 운주당 터입니다. 선조 26년(1593)부터 30년(1597)까지 약 3년 8개월 삼도수군 본영이었습니다. 선조 30년 군영이 불탔고, 영조 15년(1739) 통제사 조경이 제승당과 유허비를 세웠습니다. 현재 건물은 1976년 정화사업 때 중건한 정면 5칸·측면 3칸입니다. 경내에는 충무사·한산정·수루·한산대첩비·거북등대가 있습니다. 하절기 09:00~18:00·동절기 09:00~17:00, 입장 무료이며 통영항에서 배로 약 25분입니다. 시내 세병관(통제영)·아산 현충사·여수 진남관·충렬사와 다른 한산도 두억리 사령부입니다. 사진은 한국관광공사 제승당·국가유산청 사적 공식 사진입니다.',
    '경상남도 통영시 한산면 한산일주로 70 (두억리 한산도제승당)',
    TY_JE,
    [TY_JE_2, TY_JE_SURU, TY_JE_AIR],
  ),
  'local-scenic:tongyeong-palgyeong:통영운하야경': localScenicPhotoOverlay(
    '통영팔경 7경 통영운하 야경은 당동~미수동입니다. 한국관광공사는 「충무교와 통영운하」로, 당동과 미수동(진남초교 입구)을 잇고 물때 영향 없이 배가 오가며 야경이 아름다워 예부터 동양의 나폴리라 불린다고 적습니다. 운하 위 배, 바다 밑 해저터널 보행, 육지(시내)와 미륵도를 잇는 충무교 자동차가 함께 있어 하늘·바다·바닷속이 이어진 한국 유일 3중 교통로입니다. 한산대첩 때 왜선이 좁은 목을 파고 달아났다 하여 판데목·송장목이라 불렀고, 1927년 5월 착공해 5년 6개월 만인 1932년 12월 운하와 해저터널이 개통했습니다. 운하는 길이 약 1,420m·너비 55m이며, 해저터널은 등록문화재 제201호(길이 483m)입니다. 통영대교 조명 야경·강구안·여수 밤바다·광양만 야경·인천 운하와 다른 당동 운하입니다. 사진은 한국관광공사 충무교와 통영운하 공식 사진입니다.',
    '경상남도 통영시 당동 (충무교·통영운하, 미수동 진남초교 입구)',
    TY_CANAL,
    [TY_CANAL_2, TY_CANAL_3],
  ),
  'local-scenic:tongyeong-palgyeong:이순신공원': localScenicPhotoOverlay(
    '이순신공원은 정량동입니다. 한국관광공사는 구 한산대첩기념공원으로, 주소 정량동 688-1, 문의 055-650-1411~5, 상시 개방·연중무휴라고 적습니다. 도로명 멘데해안길 205이며 동호항 방파제 인근입니다. 1592년 8월 14일 한산대첩 승첩지를 기념하며, 공원 중앙 청동 이순신 장군 동상(높이 17.3m)이 한산도 앞바다를 바라봅니다. 해안 수변데크길·수국 산책로·무장애나눔길·통영해상순직장병 위령탑이 있습니다. 남망산공원·동피랑·제승당·여수 이순신공원·남해 이순신공원과 다른 정량동 공원입니다. 사진은 한국관광공사 통영 이순신공원 공식 사진입니다.',
    '경상남도 통영시 멘데해안길 205 (정량동 688-1 이순신공원)',
    TY_YI,
    [TY_YI_2, TY_YI_3, TY_YI_4],
  ),
  'local-scenic:gwangju-gi-palgyeong:분원도요지&팔당물안개공원': localScenicPhotoOverlay(
    '광주8경 2경 분원도요지 & 팔당물안개공원은 남종면입니다. 광주시 문화관광 8경은 조선도자연구의 기반이라고 적습니다. 분원도요지는 남종면 분원리 116입니다. 조선시대 광주 일대는 왕실 도자기를 생산하는 관요가 산재했고, 사옹원 분원이 분원리에 있어 백자가 생산되었습니다. 2003년 개관한 분원백자관은 구 분원초등학교 폐교를 리모델링한 사교육장입니다. 팔당물안개공원은 남종면 귀여리 596이며 원래 명칭은 귀여섬이었고 시민 명칭공모로 바뀌었습니다. 다목적광장·시민의 숲·희망의 숲·코스모스길이 있고 자전거 대여가 있습니다. 문의는 문화관광과 031-760-2634입니다. 7경 경기도자박물관(경충대로 727)·곤지암도자공원·화담숲·남양주 팔당과 다른 남종면 분원리·귀여리입니다. 사진은 광주시 문화관광 8경 분원도요지·팔당물안개공원 공식 사진입니다.',
    '경기도 광주시 남종면 분원리 116 (분원도요지), 남종면 귀여리 596 (팔당물안개공원)',
    GJ_GI_BUNWON,
    [GJ_GI_BUNWON_2, GJ_GI_BUNWON_3],
    GJ_GI_BUNWON_HOME,
  ),
  'local-scenic:gwangju-gi-palgyeong:앵자봉&천진암': localScenicPhotoOverlay(
    '광주8경 4경 앵자봉 & 천진암은 퇴촌면 우산리입니다. 광주시 문화관광 8경은 꾀꼬리가 알을 품고 있는 산세 앵자봉이라고 적습니다. 해발 667m이며 정상에서 동쪽으로 양자산, 서쪽으로 무갑산이 보입니다. 신유박해 때 가톨릭교도들이 숨어들 만큼 심산유곡입니다. 한국천주교회 발상지 천진암이 자리하며 창립선조 5위 묘·강학기념비·한국천주교 창립연구원·성모경당·광암성당·한국천주교박물관이 있고 100년 계획 천진암 대성당 공사가 진행 중입니다. 문의는 문화관광과 031-760-2634입니다. 5경 무갑산·광주광역시 무등산·절 무갑사와 다른 퇴촌면 우산리 산·성지입니다. 사진은 광주시 문화관광 8경 앵자봉·천진암 공식 사진입니다.',
    '경기도 광주시 퇴촌면 우산리 (앵자봉·천진암)',
    GJ_GI_AENGJA,
    [GJ_GI_AENGJA_2, GJ_GI_AENGJA_3],
    GJ_GI_AENGJA_HOME,
  ),
  'local-scenic:gwangju-gi-palgyeong:무갑산': localScenicPhotoOverlay(
    '광주8경 5경 무갑산은 초월읍·퇴촌면입니다. 광주시 문화관광 8경은 높이 578m로 가족들과 산행하기 좋은 산이며 소재지는 초월읍, 퇴촌면이라고 적습니다. 초월읍에 위치한 무갑산은 실촌읍(현 곤지암읍)과 퇴촌면으로 지맥을 뻗칩니다. 임진왜란 때 항복을 거부한 무인들이 은둔했다는 설과, 산의 형태가 갑옷을 두른 듯해서 붙인 이름이라는 설이 있습니다. 정상에 오르면 팔당호를 비롯한 주변 풍광이 시원하게 펼쳐집니다. 산행지로 잘 알려지지 않아 호젓하고, 봄 진달래·산나물, 여름 녹음, 가을 단풍, 겨울 눈꽃은 한라의 그것과 견줄 만큼 아름답다고 안내합니다. 문의는 문화관광과 031-760-2634입니다. 들머리는 무갑리 버스 종점이며 초월역(경강선)에서 광주시 축협 환승 후 무갑리 하차입니다. 같은 골 무갑리계곡(무갑리 822)은 관산과 무갑산 사이 약 1km 계곡입니다. 광주광역시 무등산·6경 태화산·4경 앵자봉·관산·무갑사 법당과 다른 초월읍 무갑리 산입니다. 사진은 광주시 문화관광 8경 무갑산 전경 공식 사진입니다.',
    '경기도 광주시 초월읍 무갑리 (퇴촌면 지맥, 무갑리 버스 종점)',
    GJ_GI_MUGAP,
    [GJ_GI_MUGAP_2, GJ_GI_MUGAP_3],
    GJ_GI_MUGAP_HOME,
  ),
  'local-scenic:gwangju-gi-palgyeong:태화산': localScenicPhotoOverlay(
    '광주8경 6경 태화산은 도척면 추곡리입니다. 광주시 문화관광 8경은 뾰족한 봉우리를 가진 아담한 태화산이며 해발 664m라고 적습니다. 인근에 곤지암 소머리국밥촌과 낚시터 저수지가 있습니다. 정상 남쪽 산자락에 고려 충숙왕 12년 일연선사가 창건했다는 백련암이 있고, 대웅전 아래 전설의 장군수가 등산 식수입니다. 능선 오솔길 바위 전망대에서 계곡과 백마봉 능선이 보입니다. 어느 코스든 약 3시간이면 오를 수 있습니다. 문의는 문화관광과 031-760-2634입니다. 공주 태화산 마곡사·5경 무갑산·4경 앵자봉·광주광역시와 다른 도척면 추곡리 산입니다. 사진은 광주시 문화관광 8경 태화산 전경 공식 사진입니다.',
    '경기도 광주시 도척면 추곡리 (태화산 664m)',
    GJ_GI_TAEHWA,
    [GJ_GI_TAEHWA_2, GJ_GI_TAEHWA_3],
    GJ_GI_TAEHWA_HOME,
  ),
  'local-scenic:gwangju-gi-palgyeong:경기도자박물관': localScenicPhotoOverlay(
    '광주8경 7경 경기도자박물관은 경충대로 727입니다. 광주시 문화관광 8경은 한국전통도자를 연구하는 전문도자박물관이라고 적습니다. 조선백자 연구·관요 유적 발굴·전통 도자문화교육을 하며, 「아름다운 우리 도자기전」을 격년 개최합니다. 대형 전시실 2곳·기획전시실·다목적실, 야외 조각공원·장작가마·한국정원·다례시연장·도자쇼핑몰이 있습니다. 옛 명칭 광주 조선관요박물관으로 순백자·청화백자·분청사기와 현대작가 작품을 상설 전시합니다. 입장 10:00~17:00, 운영 종료 18:00, 매주 월요일·1월 1일 휴관입니다. 한국도자재단이 운영합니다. 문의는 문화관광과 031-760-2634입니다. 2경 분원도요지·곤지암도자공원·화담숲·영은미술관과 다른 경충대로 박물관입니다. 사진은 광주시 문화관광 8경 경기도자박물관 공식 사진입니다.',
    '경기도 광주시 경충대로 727 (경기도자박물관)',
    GJ_GI_DOJA,
    [GJ_GI_DOJA_2, GJ_GI_DOJA_3],
    GJ_GI_DOJA_HOME,
  ),
  'local-scenic:mokpo-gugyeong:목포진': localScenicPhotoOverlay(
    '목포9경 6경 목포진은 만호동 목포진 역사공원입니다. 목포시 문화관광 9경은 조선시대 수군 진영이며 목포영·목포대·만호진이라고도 불렀고, 세종 21년(1439) 설치, 연산군 8년(1502) 진성, 1895년 7월 15일 고종 칙령 제141호로 폐진했다고 적습니다. 주소는 목포진길 11번길 1-5이며 지번은 만호동 1-56입니다. 전라남도 문화재자료 제137호 목포진지(1987년 1월 15일)입니다. 2014년 객사 등을 역사공원으로 일부 복원했습니다. 문의 061-270-8291, 상시 개방·무료입니다. 해남 구 목포구등대·2경 목포대교·7경 삼학도·유달산 달성공원·대구 달성토성과 다른 만호동 수군진입니다. 사진은 목포시 문화관광 9경 목포진 역사공원 객사 설경·홍살문 공식 사진입니다.',
    '전라남도 목포시 목포진길 11번길 1-5 (만호동 1-56 목포진 역사공원)',
    MP_JIN,
    [MP_JIN_2, MP_JIN_3],
    MP_JIN_HOME,
  ),
  'local-scenic:mokpo-gugyeong:다도해전경': localScenicPhotoOverlay(
    '목포9경 8경 다도해 전경은 유달산에서 내려다보는 목포 인근 섬바다입니다. 목포시 문화관광 9경은 유달산 바로 앞 반달 모양 고하도와 외달도 등 다도해가 소박한 운치를 더한다고 적습니다. 조망은 유달산 정상·일주도로이며 고하도·외달도·목포대교 너머 서남해 섬들이 한눈에 들어옵니다. 1경 유달산 산봉·2경 목포대교 일몰·9경 외달도 섬 자체·진도·완도 다도해해상국립공원·목포해상케이블카와 다른 유달산 조망입니다. 사진은 목포시 문화관광 9경 유달산에서 바라본 다도해·하늘에서 바라본 다도해 공식 사진입니다.',
    '전라남도 목포시 유달산 (죽교동 유달산 정상·일주도로, 고하도·외달도 조망)',
    MP_DADO,
    [MP_DADO_2, MP_DADO_3],
    MP_DADO_HOME,
  ),
  'local-scenic:muan-gugyeong:영산강식영정과느러지': localScenicPhotoOverlay(
    '무안9경 3경 영산강 식영정과 느러지는 몽탄면 이산리입니다. 무안군 문화관광 9경은 한호 임연 선생이 1630년 무안으로 입향한 이후 강학소요처로 지은 정자이며 영산강과 주변 경관이 어울린다고 적습니다. 주소는 호반로 562-15이며 지번은 이산리 612입니다. 전라남도 문화재자료 제237호(2002년 4월 20일) 무안 식영정(息營亭)입니다. 현재 건물은 1900년대 초반 중건한 정면 3칸·측면 3칸 팔작지붕입니다. 문의 061-450-5498입니다. 느러지는 영산강이 나주 동강면과 무안 몽탄면 사이에서 한반도처럼 늘어진 물돌이로, 영산강 8경 2경 몽탄노적이며 영월 동강보다 강폭이 넓습니다. 담양 식영정(息影亭·명승)·광주 환벽당·나주 동강면 느러지전망대·영월 한반도지형과 다른 몽탄 이산리 정자와 곡강입니다. 사진은 무안군 문화관광 봄 여행 식영정 항공·정자 공식 사진입니다.',
    '전라남도 무안군 몽탄면 호반로 562-15 (이산리 612, 식영정)',
    MA_SIK,
    [MA_SIK_2],
    MA_SIK_HOME,
  ),
  'local-scenic:muan-gugyeong:톱머리·홀통해수욕장': localScenicPhotoOverlay(
    '무안9경 5경 톱머리·홀통 해수욕장은 망운면 톱머리와 현경면 홀통입니다. 무안군 문화관광은 톱머리를 무안읍에서 서쪽 8km 망운면 피서리이며 조수간만의 차가 커서 간조 때 길이 2km·폭 100m 백사장과 보호림 해송이 어우러진다고 적습니다. 주소는 톱머리길 66이며 문의 061-450-5628입니다. 홀통은 현경면 홀통길 198-1, 무안국제공항에서 북쪽 약 15km의 자연발생 해변으로 울창한 해송과 긴 백사장, 수심이 낮고 파도가 잔잔해 윈드서핑 적지입니다. 7경 도리포해수욕장·조금나루·신안 증도 해수욕장·목포 외달도와 다른 망운·현경 해변입니다. 사진은 무안군 문화관광 톱머리해수욕장 백사장·방조제, 여름 여행 홀통 해송 반도 공식 사진입니다.',
    '전라남도 무안군 망운면 톱머리길 66 · 현경면 홀통길 198-1',
    MA_TOP,
    [MA_TOP_2, MA_HOL],
    MA_BEACH_HOME,
  ),
  'local-scenic:muan-gugyeong:승달산': localScenicPhotoOverlay(
    '무안9경 8경 승달산은 청계면 월선리·몽탄면입니다. 무안군 문화관광은 해발 333m로 높지 않으나 남도 바닷가에 있어 조망이 뛰어나고, 토양·기후가 야생난 자생에 맞아 난(蘭) 자생지로 이름났다고 적습니다. 산 이름은 고려 인종 때 원나라 승려 원명이 이 산에서 교세를 떨치고 제자 500여 명이 한꺼번에 깨달음을 얻었다는 전설에서 왔으며, 풍수지리로는 호남 4패 명혈의 첫째 혈처로 적힙니다. 산행은 목포대학교 정문에서 매봉·깃봉·하루재·천치골을 도는 원점회귀가 많고, 깃대봉이 정상입니다. 같은 산 법천사(GATEO 선정 법천사 무안, 몽탄면 법천길)·목포대 캠퍼스·목우암과 다른 청계·몽탄 산봉입니다. 사진은 무안군 문화관광 승달산 산나리 조망·암릉·설경 공식 사진입니다.',
    '전라남도 무안군 청계면 월선리 (승달산, 목포대 정문·깃대봉)',
    MA_SEUNG,
    [MA_SEUNG_2, MA_SEUNG_3],
    MA_SEUNG_HOME,
  ),
  'local-scenic:muan-gugyeong:초의선사탄생지': localScenicPhotoOverlay(
    '무안9경 4경 초의선사탄생지는 삼향읍 왕산리입니다. 무안군 문화관광은 주소를 초의길 30으로 두고, 초의 대선사가 1786년(정조 10년) 4월 5일 삼향읍 왕산리에서 태어났으며 속성은 흥성장씨·이름은 의순(意恂), 호 초의(艸衣)는 스승 완호 윤우에게서 받았다고 적습니다. 15세 나주 운흥사 출가, 19세 해남 대둔사에서 구족계를 받았고 다성(茶聖)으로 한국의 다도를 중흥했습니다. 1997년 무안군 문화인물 선정 뒤 생가·추모각·기념전시관·차문화관을 복원·건립했고, 음력 4월 5일 전후로 초의선사탄생문화제를 엽니다. 해남 대흥사 일지암·강진 다산초당·몽탄 법천사 무안과 다른 삼향 왕산리 생가·다도 성지입니다. 사진은 무안군 문화관광 초의선사 탄생지 전경·설경·경내 공식 사진입니다.',
    '전라남도 무안군 삼향읍 초의길 30 (왕산리 초의선사 탄생지)',
    MA_CHO,
    [MA_CHO_2, MA_CHO_3],
    MA_CHO_HOME,
  ),
  'local-scenic:boseong-gugyeong:일림산용추계곡': localScenicPhotoOverlay(
    '보성9경 7경 일림산 용추계곡은 웅치면과 회천면 사이 일림산입니다. 보성군 문화관광 9경은 높이를 664m로 두고, 100만여평 철쭉군락과 보성강의 시원인 용추계곡이 있다고 적습니다. 산 정상 아래 습지에서 쏟아지는 물이 암반을 따라 용이 승천하듯 굽이쳐 내려오고, 계곡 사이 삼나무 향이 짙으며 매년 5월 초 일림산 철쭉제가 열립니다. 용추폭포 용소는 용이 승천했다는 전설이 있고 명주실 한 타래를 풀어도 끝이 닿지 않는다고 하며, 옆에 선녀탕·용바위가 있습니다. 주차는 웅치면 용반리 639-7 용추폭포 주차장입니다. 문의 061-850-5482입니다. 문경8경 용추계곡·가평 용추폭포·동해 용추폭포·계룡 숫용추·의성 빙계 용추·6경 제암산자연휴양림과 다른 웅치면 용반리 계곡입니다. 사진은 보성군 문화관광 9경 용추폭포·계곡·입구 공식 사진입니다.',
    '전라남도 보성군 웅치면 용반리 (용추계곡·용추폭포, 용추폭포 주차장 용반리 639-7)',
    BS_ILRIM,
    [BS_ILRIM_2, BS_ILRIM_3],
    BS_ILRIM_HOME,
  ),
  'local-scenic:boseong-gugyeong:주암호서재필기념관': localScenicPhotoOverlay(
    '보성9경 9경 주암호 서재필기념관은 문덕면 용암리입니다. 보성군 문화관광 9경은 주암 다목적댐(1984년 10월 17일 착공, 1990년 4월 담수)으로 보성·순천·화순에 걸친 인공호수가 생겼고, 문덕면 용암리·덕치리·죽산리 호반과 철제 아치교 일대가 경관이 가장 수려하다고 적습니다. 서재필 기념관은 1992년 사업을 시작해 사당·송재로·개화문·독립문 실측모형·조각공원·유물전시관·생가를 갖췄고, 유품 800여 점을 전시합니다. 송재 서재필은 1864년 1월 7일 문덕면 용암리 가내마을에서 태어났습니다. 기념관 주소는 용암길 8이며 생가는 가내길 18-35입니다(6·25 소실, 2003년 복원). 문의 061-852-2815, 상시 개방·무료입니다. 서울 독립문·순천 주암댐 본체·화순 동복호·주암호생태습지·8경 대원사와 다른 문덕 용암리 기념공원입니다. 사진은 보성군 문화관광 9경 개화문·서재필 동상, 주암호 항공, 생가 공식 사진입니다.',
    '전라남도 보성군 문덕면 용암길 8 (서재필기념관) · 가내길 18-35 (생가)',
    BS_SEO,
    [BS_SEO_2, BS_SEO_3],
    BS_SEO_HOME,
  ),
  'local-scenic:sancheong-gugyeong:황매산철쭉': localScenicPhotoOverlay(
    '산청9경 제3경 황매산 철쭉은 차황면 법평리 황매산입니다. 산청군 문화관광 9경은 높이를 1,113.1m로 두고, 한뫼산(큰 산)이 한자로 바뀌어 황매산이 되었다고 적습니다. 태백산맥 마지막 준봉이며 고려 무학대사가 수도한 곳으로, 칡넝쿨·땅가시·뱀이 없다는 삼무(三無)의 산으로도 불립니다. 5월이면 정상 부근 평전이 철쭉으로 덮이고 산청 황매산 철쭉제가 열리며, 산청·합천이 함께 개막 퍼포먼스를 합니다. 네비 주소는 차황면 법평리 1-1이고, 한국관광공사는 황매산로1202번길·법평리로 안내합니다. 문의 055-970-7204(관광진흥과)·055-970-6901(산림녹지과)입니다. 합천8경 황매산·보성9경 일림산 철쭉·화순 수만리 철쭉·하동 형제봉 철쭉과 다른 차황면 법평리 철쭉 평전입니다. 사진은 한국관광공사 황매산(산청) 철쭉군락·황매산성·모원재 공식 사진입니다.',
    '경상남도 산청군 차황면 법평리 (황매산로1202번길, 법평리 1-1)',
    SC_HWANG,
    [SC_HWANG_2, SC_HWANG_3, SC_HWANG_4],
    SC_HWANG_HOME,
  ),
  'local-scenic:sancheong-gugyeong:남명조식유적지': localScenicPhotoOverlay(
    '산청9경 제7경 남명조식유적지는 시천면 사리·원리입니다. 산청군 문화관광 9경은 조선 실천유학의 대가 남명 조식(1501~1572)이 을묘 단성소를 올린 선비의 고장 유적이며, 시천면 덕천강변에 산천재·덕천서원·남명기념관·세심정·묘소·여재실이 있다고 적습니다. 국가유산청 사적(1984.1.26., 구 사적 제305호) 소재지는 시천면 사리 384번지 일원입니다. 사리에는 산천재·별묘·신도비·묘비, 원리에는 덕천서원·세심정이 있습니다. 산천재는 명종 16년(1561)에 짓고 순조 18년(1818)에 고친 앞면 2칸·옆면 2칸 서실이며, 뜰의 남명매는 선생이 손수 심었다고 전합니다. 덕천서원은 선조 9년(1576)에 세웠고 광해군 원년(1608) 사액 뒤 서원철폐로 훼철되었다가 1926년에 고쳐 지었습니다. 세심정은 선조 15년(1582) 덕천강가에 세웠습니다. 산천재·남명기념관 주소는 남명로 311, 덕천서원은 남명로 137입니다. 문의 055-973-9781입니다. 안동 도산서원·하동 회남재·단속사지 정당매·6경 남사예담촌과 다른 시천면 사리 유적입니다. 사진은 국가유산청 사적 산청 조식 유적·한국관광공사 산천재 남명매·덕천서원 공식 사진입니다.',
    '경상남도 산청군 시천면 사리 384번지 일원 (산천재 남명로 311 · 덕천서원 남명로 137)',
    SC_NAM,
    [SC_NAM_2, SC_NAM_3],
    SC_NAM_HOME,
  ),
  'local-scenic:seocheon-gugyeong:장항송림산림욕장과장항스카이워크': localScenicPhotoOverlay(
    '서천9경 제8경 장항송림산림욕장과 장항스카이워크는 장항읍 송림리입니다. 서천군 문화관광 9경 공식명은 장항송림자연휴양림과 스카이워크입니다. 바닷바람을 막는 방풍림으로 1954년 장항농고(현 장항공고) 학생들이 2년생 곰솔을 심었고, 곰솔(해송)이 1만2천여 그루 자랍니다. 면적 275,703㎡, 해안 산책로 1.5km이며 맥문동·해국·송엽국이 하층에 있습니다. 8~9월이면 맥문동이 핍니다. 2019년 산림청 국가산림문화자산으로, 2021년 자연휴양림으로 지정되었습니다. 스카이워크(기벌포 전망대)는 높이 15m·길이 236m로 해송 위와 서해·갯벌·일몰을 봅니다. 앞바다는 676년(문무왕 16) 기벌포해전이 있던 바다입니다. 주소는 장항읍 장항산단로34번길 122-16, 문의 041-956-5505입니다. 5경 춘장대해수욕장·7경 금강하굿둑 철새도래지·해남 울돌목 스카이워크와 다른 장항 송림입니다. 사진은 서천군 문화관광 9경 공식 사진입니다.',
    '충청남도 서천군 장항읍 장항산단로34번길 122-16 (장항송림자연휴양림·스카이워크)',
    SCH_JANG,
    [SCH_JANG_2, SCH_JANG_3],
    SCH_JANG_HOME,
  ),
  'local-scenic:seocheon-gugyeong:유부도와서천갯벌': localScenicPhotoOverlay(
    '서천9경 제9경 유부도와 서천갯벌은 장항읍 유부도입니다. 서천군 문화관광 9경은 서천갯벌 면적을 약 68.09㎢로 두고, 금강하구에서 온 펄과 모래 갯벌이 함께 있다고 적습니다. 유부도는 철새 이동 경로의 중간기착지이자 바닷게 거점이며 100여 종의 희귀 철새가 쉽니다. 섬 이름은 임진왜란 때 아버지가 머문 섬을 유부도, 아들이 머문 섬을 유자도라 한 데서 왔다는 이야기가 있고, 고려 때부터 유배지로도 알려졌습니다. 검은머리물떼새는 천연기념물 제326호·멸종위기 야생생물 Ⅱ급이며 겨울에 2천5백여 마리가 모입니다. 서천군 해안선은 장항읍·마서면·종천면·비인면·서면 72.5km입니다. 2008년 2월 1일 서천 선언으로 서면 월호리, 비인면 다사리·장포리, 종천면 당정리와 유부도 연안습지 15.3㎢가 습지보호지역이 되었고 2009년 람사르 습지로 지정되었습니다. 서천갯벌은 2021년 유네스코 세계자연유산 「한국의 갯벌」에 등재된 구성 자산입니다. 주소는 장항읍 유부도길6번길 3입니다. 7경 금강하굿둑 철새도래지·5경 춘장대 모래갯벌·고창·신안·보성순천 갯벌과 다른 유부도 일대입니다. 사진은 서천군 문화관광 9경 공식 사진입니다.',
    '충청남도 서천군 장항읍 유부도길6번길 3 (유부도·서천갯벌)',
    SCH_YUBU,
    [SCH_YUBU_2, SCH_YUBU_3],
    SCH_YUBU_HOME,
  ),
};

function lookupLocalScenicMemberOverlay(spotId) {
  if (!spotId) return null;
  return LOCAL_SCENIC_MEMBER_OVERLAYS[spotId] || null;
}

function localScenicThumbOverlay(imageUrl, extraGallery = []) {
  const galleryUrls = [imageUrl, ...extraGallery.filter((u) => u && u !== imageUrl)];
  return { imageUrl, firstImage: imageUrl, galleryUrls };
}

/** TourAPI first_image 없는 검색 행 — JSON contentId 기입 아님. */
const LOCAL_SCENIC_TOUR_THUMB_BY_CONTENT_ID = {
  2750930: localScenicThumbOverlay(NS_YANGCHON, [NS_YANGCHON_2]),
  946844: localScenicThumbOverlay(NS_HISTORY, [NS_HISTORY_2, NS_HISTORY_3]),
  1956315: localScenicThumbOverlay(NS_NOGANG, [NS_NOGANG_2]),
  126143: localScenicThumbOverlay(YD_SAMSA, [YD_SAMSA_2, YD_SAMSA_3]),
  127160: localScenicThumbOverlay(YD_HAJEO),
  1621219: localScenicThumbOverlay(YD_GYEONGJEONG, [YD_GYEONGJEONG_2]),
  // 문경석탄박물관 — TourAPI 상세는 문경에코월드(2599737). DB first_image 미동기화.
  2599737: localScenicThumbOverlay(
    'https://tong.visitkorea.or.kr/cms/resource/97/4059797_image2_1.jpg',
  ),
  // 진도 검색 조도(조도6군도) — TourAPI first_image 없음. JSON contentId 기입 아님.
  553447: localScenicThumbOverlay(JD_JODO, [JD_GASA]),
  // 홍성 검색 용봉산·오서산·죽도(홍성)·홍주의사총 — TourAPI first_image 없음.
  125821: localScenicThumbOverlay(HS_YONG, [HS_YONG_2, HS_YONG_3]),
  126746: localScenicThumbOverlay(HS_OSEO, [HS_OSEO_2, HS_OSEO_3]),
  126721: localScenicThumbOverlay(HS_JUK, [HS_JUK_2, HS_JUK_3]),
  125993: localScenicThumbOverlay(HS_UISA, [HS_UISA_2, HS_UISA_3]),
  // 화순 검색 화순동복연둔리숲정이 — DB first_image 미동기화. JSON contentId 기입 아님.
  3014431: localScenicThumbOverlay(HW_FOREST, [HW_FOREST_2, HW_FOREST_3]),
  // 거제 검색 공곶이 — TourAPI first_image 없음. JSON contentId 기입 아님.
  2536196: localScenicThumbOverlay(GJ_GONGGOJI, [GJ_GONGGOJI_2, GJ_GONGGOJI_3, GJ_NAEDO]),
  // 거제 검색 구조라해수욕장 — hub 명소(9경 아님). JSON contentId 기입 아님.
  583071: localScenicThumbOverlay(GJ_GUJORA, [GJ_GUJORA_2, GJ_GUJORA_3]),
  // 거제 검색 동백섬 지심도터미널 — TourAPI first_image 없음. 장승포 선착장. JSON contentId 기입 아님.
  2756617: localScenicThumbOverlay(GJ_TERMINAL, [GJ_TERMINAL_2, GJ_TERMINAL_3]),
  // 동해 검색 망상해수욕장 — GATEO 선정 imageUrl 공란·탐색홈은 Tour firstimage를 쓰지 않음.
  125713: localScenicThumbOverlay(DH_MANGSANG, [DH_MANGSANG_2]),
  // 동해 명승 검색 어달해변 — TourAPI first_image 없음. 망상·대진·노봉과 다른 해변.
  125708: localScenicThumbOverlay(DH_EODAL, [DH_EODAL_2, DH_EODAL_3]),
  // 담양10경 — tourapi_attraction 미동기화·firstimage 공란. JSON contentId만 있음.
  126254: localScenicThumbOverlay(DY_CHUWOL),
  126407: localScenicThumbOverlay(DY_GEUMSEONG),
  126252: localScenicThumbOverlay(DY_BYEONGPUNG),
  // 영광 검색 불갑산도립공원 — firstimage·searchPhoto 공란, 사진은 detailImage. 불갑사 126349와 다른 id.
  126248: localScenicThumbOverlay(YG_BULGAP, [YG_BULGAP_2, YG_BULGAP_3]),
  // 고흥 검색 팔영산자연휴양림 — TourAPI firstimage 없음. JSON contentId 기입 아님.
  125426: localScenicThumbOverlay(GH_FOREST, [GH_FOREST_2, GH_FOREST_3]),
  // 고흥 검색 영남용바위 — 10경 아님. TourAPI firstimage 없음. JSON contentId 기입 아님.
  2782706: localScenicThumbOverlay(GH_YONG, [GH_YONG_2, GH_YONG_3]),
  // 예천 검색 신라식물원 — TourAPI firstimage·detailImage·searchPhoto 없음. JSON contentId 기입 아님.
  1910438: localScenicThumbOverlay(YC_SILLA, [YC_SILLA_2, YC_SILLA_3]),
  // 통영 탐색홈 이순신공원 — hub 명소(팔경 아님). Tour 584970 firstimage는 LIVE CMS, DB 미동기화.
  584970: localScenicThumbOverlay(TY_YI, [TY_YI_2, TY_YI_3, TY_YI_4]),
  // 인제8경 — Tour DB first_image 공란·축제 주변 팔경 행. JSON contentId 기입 아님.
  126643: localScenicThumbOverlay(INJE_DAESEUNG_FALLS),
  125723: localScenicThumbOverlay(INJE_BANGDONG_SPRING),
  1932458: localScenicThumbOverlay(INJE_HAPGANG_PAVILION),
};

const LOCAL_SCENIC_OVERLAY_BY_CONTENT_ID = (() => {
  /** @type {Map<string, ReturnType<typeof localScenicPhotoOverlay> | ReturnType<typeof localScenicThumbOverlay>>} */
  const map = new Map();
  for (const list of LISTS) {
    for (const member of list.members || []) {
      const contentId = String(member.contentId || '').trim();
      if (!/^\d{1,32}$/.test(contentId) || map.has(contentId)) continue;
      const overlay = lookupLocalScenicMemberOverlay(
        localScenicMemberSpotId(list.listId, member.attractionName),
      );
      if (overlay?.imageUrl) map.set(contentId, overlay);
    }
  }
  for (const [contentId, overlay] of Object.entries(
    LOCAL_SCENIC_TOUR_THUMB_BY_CONTENT_ID,
  )) {
    if (!overlay?.imageUrl || map.has(contentId)) continue;
    map.set(contentId, overlay);
  }
  return map;
})();

/**
 * TourAPI contentId → 팔경 멤버 런타임 오버레이 (사진 없는 Tour 행 보강).
 * JSON contentId 쓰기는 아님.
 * @param {string | number | null | undefined} contentId
 */
export function lookupLocalScenicPhotoByContentId(contentId) {
  const id = String(contentId || '').trim();
  if (!/^\d{1,32}$/.test(id)) return null;
  return LOCAL_SCENIC_OVERLAY_BY_CONTENT_ID.get(id) || null;
}

/**
 * 명승 curated 행 형태. koreaScenicSpots JSON 쓰기는 금지 — 리스트 표시만.
 * @param {object} list
 * @param {object} member
 * @param {object} [hub]
 * @param {string} [locale]
 */
export function memberToScenicListSpot(list, member, hub, locale = 'ko') {
  const h = hub || resolveCityAttractionHub(list.hubId);
  const attraction = resolveMemberAttraction(h, member);
  const curated = lookupCuratedScenicSpot(list.hubId, member.attractionName);
  const fromCurated = scenicThumbFromCurated(curated);
  const areaCode = scenicAreaCodeForHubId(list.hubId);
  const region = scenicRegionForAreaCode(areaCode) || '';
  const title = localScenicListDisplayTitle(list, h, locale);
  const rankBlurb = localScenicMemberRankBlurb(list, h, member, locale);
  const contentId = memberContentId(member, attraction) || fromCurated.contentId;
  const spotId = localScenicMemberSpotId(list.listId, member.attractionName);
  const overlay = lookupLocalScenicMemberOverlay(spotId);
  const firstImage = overlay?.firstImage || fromCurated.imageUrl || null;
  const imageUrl = overlay?.imageUrl || fromCurated.imageUrl || null;
  return {
    id: spotId,
    name: member.attractionName,
    blurb: rankBlurb,
    region,
    hubId: list.hubId,
    attractionName: member.attractionName,
    attractionNameEn: member.name_en || attraction?.name_en || member.attractionName,
    placeSlug: placeUrlSlug(
      member.name_en || attraction?.name_en,
      member.attractionName,
    ),
    lat: member.lat ?? attraction?.lat ?? null,
    lng: member.lng ?? attraction?.lng ?? null,
    contentId: overlay?.contentId || contentId,
    imageUrl,
    firstImage,
    galleryUrls: overlay?.galleryUrls || null,
    overview: overlay?.overview || null,
    addr1: overlay?.addr1 || null,
    homepage: overlay?.homepage || null,
    source: 'localScenicList',
    groupTitle: title,
    localScenicListId: list.listId,
  };
}

/**
 * 같은 ul 선두에 N경 멤버. curated에 있으면 그 행을 끌어올림.
 * @param {object[]} spots
 * @param {string} hubId
 * @param {string} [locale]
 */
export function mergeLocalScenicMembersIntoScenicSpots(spots, hubId, locale = 'ko') {
  const existing = Array.isArray(spots) ? spots : [];
  const lists = listsForHub(hubId);
  if (!lists.length) return existing;

  const byKey = new Map();
  for (const spot of existing) {
    const k = normalizeKey(spot?.attractionName || spot?.name);
    if (k && !byKey.has(k)) byKey.set(k, spot);
  }

  const front = [];
  const used = new Set();
  const hub = resolveCityAttractionHub(hubId);
  for (const list of lists) {
    const title = localScenicListDisplayTitle(list, hub, locale);
    for (const member of list.members || []) {
      const k = normalizeKey(member.attractionName);
      if (!k || used.has(k)) continue;
      used.add(k);
      const hit = byKey.get(k);
      const rankBlurb = localScenicMemberRankBlurb(list, hub, member, locale);
      if (hit) {
        const spotId = localScenicMemberSpotId(list.listId, member.attractionName);
        const overlay = lookupLocalScenicMemberOverlay(spotId);
        front.push({
          ...hit,
          blurb: rankBlurb,
          groupTitle: title,
          localScenicListId: list.listId,
          contentId: overlay?.contentId || hit.contentId,
          imageUrl: overlay?.imageUrl || hit.imageUrl,
          firstImage: overlay?.firstImage || hit.firstImage,
          galleryUrls: overlay?.galleryUrls || hit.galleryUrls,
          overview: overlay?.overview || hit.overview,
          addr1: overlay?.addr1 || hit.addr1,
          homepage: overlay?.homepage || hit.homepage,
        });
      } else {
        front.push(memberToScenicListSpot(list, member, hub, locale));
      }
    }
  }
  const rest = existing.filter(
    (spot) => !used.has(normalizeKey(spot?.attractionName || spot?.name)),
  );
  return [...front, ...rest];
}

export function hasTourContentId(value) {
  return /^\d{1,32}$/.test(String(value || '').trim());
}

/**
 * 축제·명승 상세 「주변 관광지」 팔경 행 — Tour contentId 또는 GATEO 멤버 오버레이 개요.
 * @param {object} [spot]
 */
export function isNearbyAttractionRowClickable(spot) {
  if (hasTourContentId(spot?.contentId)) return true;
  const listId = String(spot?.localScenicListId || '').trim();
  const name = String(spot?.attractionName || spot?.name || '').trim();
  if (!listId || !name) return false;
  const scenic = resolveLocalScenicListSpotById(
    localScenicMemberSpotId(listId, name),
  );
  return Boolean(String(scenic?.overview || '').trim());
}

/**
 * 팔경 주변 행 → ThemeSpotDetailModal spot (contentId 없을 때 오버레이 본문).
 * @param {object} spot
 */
export function mergeNearbyRowWithLocalScenicDetail(spot) {
  if (!spot || typeof spot !== 'object') return spot;
  if (hasTourContentId(spot.contentId)) return spot;
  const listId = String(spot.localScenicListId || '').trim();
  const name = String(spot.attractionName || spot.name || '').trim();
  if (!listId || !name) return spot;
  const scenic = resolveLocalScenicListSpotById(
    localScenicMemberSpotId(listId, name),
  );
  if (!scenic?.overview) return spot;
  const thumb =
    String(spot.firstImage || spot.imageUrl || '').trim() ||
    scenic.firstImage ||
    scenic.imageUrl ||
    null;
  return {
    ...scenic,
    ...spot,
    id: scenic.id,
    name: spot.name || scenic.name,
    blurb: spot.rankBlurb || spot.blurb || scenic.blurb,
    overview: scenic.overview,
    galleryUrls: scenic.galleryUrls,
    addr1: scenic.addr1 || spot.addr1,
    homepage: scenic.homepage || spot.homepage,
    imageUrl: thumb,
    firstImage: thumb,
    lat: spot.lat ?? scenic.lat,
    lng: spot.lng ?? scenic.lng,
    hubId: spot.hubId || scenic.hubId,
    contentId: spot.contentId || scenic.contentId || null,
  };
}

/**
 * hub 팔경 멤버 contentId — JSON·GATEO 선정 명소·hub attraction.
 * @param {string} hubId
 */
export function collectLocalScenicThumbContentIds(hubId) {
  return listLocalScenicMemberJobs(hubId)
    .map((job) => job.contentId)
    .filter(Boolean);
}

/**
 * hub 팔경 멤버 — 썸네일·contentId 런타임 조회용. JSON 쓰기 아님.
 * @param {string} hubId
 * @returns {{ spotId: string, name: string, contentId: string | null, hubId: string }[]}
 */
export function listLocalScenicMemberJobs(hubId) {
  const id = String(hubId || '').trim();
  if (!id) return [];
  const hub = resolveCityAttractionHub(id);
  /** @type {{ spotId: string, name: string, contentId: string | null, hubId: string }[]} */
  const out = [];
  const seen = new Set();
  for (const list of listsForHub(id)) {
    for (const member of list.members || []) {
      const name = String(member?.attractionName || '').trim();
      const key = normalizeKey(name);
      if (!name || seen.has(key)) continue;
      seen.add(key);
      const attraction = resolveMemberAttraction(hub, member);
      const curated = lookupCuratedScenicSpot(list.hubId, member.attractionName);
      const fromCurated = scenicThumbFromCurated(curated);
      const spotId = localScenicMemberSpotId(list.listId, name);
      const overlay = lookupLocalScenicMemberOverlay(spotId);
      out.push({
        spotId,
        name,
        contentId: overlay?.contentId || memberContentId(member, attraction) || fromCurated.contentId,
        hubId: list.hubId,
      });
    }
  }
  return out;
}

/**
 * 드롭다운 1행 — hub + 멤버 수 요약.
 * @param {object} list
 * @param {object} [hub]
 */
export function localScenicListToSuggestion(list, hub) {
  const h = hub || resolveCityAttractionHub(list.hubId);
  const memberCount = list.members?.length || 0;
  const display = localScenicListDisplayTitle(list, h);
  return {
    id: `local-scenic-${list.listId}`,
    kind: 'localScenicList',
    badge: listKindBadge(list.listKind),
    name: display,
    name_en: list.title_en || display,
    country: h?.country || '대한민국',
    country_en: h?.country_en || 'South Korea',
    lat: h?.lat,
    lng: h?.lng,
    slug: list.hubId,
    hubId: list.hubId,
    listId: list.listId,
    source: 'localScenicList',
    uiPlace: true,
    parentCity: h?.name || list.hubId,
    desc: `${h?.name || list.hubId} · ${memberCount}곳`,
    groupTitle: display,
  };
}

/**
 * 리스트 exact → hub + 멤버 명소 클러스터 (기존 hub 패턴).
 * @param {object} list
 * @param {object} [hub]
 */
export function buildLocalScenicListHubCluster(list, hub) {
  const h = hub || resolveCityAttractionHub(list.hubId);
  if (!h) return [localScenicListToSuggestion(list, null)];

  const out = [];
  const seen = new Set();
  const push = (item) => {
    if (!item?.name) return;
    const k = normalizeKey(item.name);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(item);
  };

  push(hubToSuggestion(h));

  for (const member of list.members || []) {
    const row = localScenicMemberToSuggestion(list, h, member);
    if (row) push(row);
  }

  return out;
}

export { normalizeKey as normalizeLocalScenicKey, listById as localScenicListById };
