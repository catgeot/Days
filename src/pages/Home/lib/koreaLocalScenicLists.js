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
  const curated = lookupCuratedScenicSpot(list.hubId, member.attractionName);
  const fromCurated = scenicThumbFromCurated(curated);
  const spotId = localScenicMemberSpotId(list.listId, member.attractionName);
  const overlay = lookupLocalScenicMemberOverlay(spotId);
  const thumb = overlay?.imageUrl || fromCurated.imageUrl;
  const rankBlurb = localScenicMemberRankBlurb(list, h, member, locale);
  return {
    ...base,
    groupTitle: localScenicListDisplayTitle(list, h, locale),
    rankBlurb,
    localScenicListId: list.listId,
    source: 'localScenicList',
    contentId: overlay?.contentId || contentId || fromCurated.contentId,
    imageUrl: thumb,
    thumbUrl: thumb,
  };
}

/**
 * 탐색 검색 행에 GATEO 선정 썸네일·contentId를 붙인다 (JSON 쓰기 아님).
 * 공식 팔경이 없는 허브 명소는 `{시군} 명소` 소제목만 (N경 아님).
 * @param {object} item
 * @param {string} [locale]
 */
export function enrichSearchCandidateScenicMedia(item, locale = 'ko') {
  if (!item || typeof item !== 'object') return item;
  let next = item;
  const hubId = String(item.hubId || '').trim();
  const name = String(item.name || '').trim();
  const hasThumb = Boolean(
    String(item.imageUrl || item.thumbUrl || item.firstImage || item.image_url || '').trim(),
  );
  if (hubId && name) {
    const fromCurated = scenicThumbFromCurated(lookupCuratedScenicSpot(hubId, name));
    if (fromCurated.imageUrl || fromCurated.contentId) {
      if (!(hasThumb && item.contentId)) {
        next = {
          ...next,
          ...(fromCurated.imageUrl && !hasThumb
            ? { imageUrl: fromCurated.imageUrl, thumbUrl: fromCurated.imageUrl }
            : {}),
          ...(fromCurated.contentId && !next.contentId
            ? { contentId: fromCurated.contentId }
            : {}),
        };
      }
    }
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
  const thumb =
    nearbyHit?.firstImage ||
    overlay?.firstImage ||
    overlay?.imageUrl ||
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

function localScenicPhotoOverlay(overview, addr1, imageUrl, extraGallery = []) {
  const galleryUrls = [imageUrl, ...extraGallery.filter((u) => u && u !== imageUrl)];
  return {
    overview,
    addr1,
    imageUrl,
    firstImage: imageUrl,
    galleryUrls,
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
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/06/1050806.jpg',
    firstImage: 'https://tong.visitkorea.or.kr/cms2/website/06/1050806.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms2/website/06/1050806.jpg',
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
};

function lookupLocalScenicMemberOverlay(spotId) {
  if (!spotId) return null;
  return LOCAL_SCENIC_MEMBER_OVERLAYS[spotId] || null;
}

const LOCAL_SCENIC_OVERLAY_BY_CONTENT_ID = (() => {
  /** @type {Map<string, ReturnType<typeof localScenicPhotoOverlay>>} */
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
