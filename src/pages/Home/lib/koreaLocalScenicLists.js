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
  const keys = [
    list.listId,
    list.title,
    list.title_en,
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
 * 표시 제목 `{시군명} {종류}` — SSOT title(문경8경)은 유지.
 * @param {object} list
 * @param {object} [hub]
 * @param {string} [locale]
 */
export function localScenicListDisplayTitle(list, hub, locale = 'ko') {
  const h = hub || resolveCityAttractionHub(list?.hubId);
  const isEn = String(locale || '').toLowerCase().startsWith('en');
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
 * 행 부제 `{시군} {N}경` · 구곡은 `{N}곡`. 그룹 칩(groupTitle)은 바꾸지 않음.
 * @param {object} list
 * @param {object} [hub]
 * @param {object} member
 * @param {string} [locale]
 */
export function localScenicMemberRankBlurb(list, hub, member, locale = 'ko') {
  const fallback = localScenicListDisplayTitle(list, hub, locale);
  const rank = memberIndexInList(list, member);
  if (!rank) return fallback;
  const h = hub || resolveCityAttractionHub(list?.hubId);
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  const city = isEn
    ? String(h?.name_en || h?.name || list?.hubId || '').trim()
    : String(h?.name || list?.hubId || '').trim();
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
 * 명승 페이지 검색 — title/alias exact 또는 includes.
 * @param {string} query
 */
export function matchLocalScenicListForScenicSearch(query) {
  const q = normalizeKey(query);
  if (!q) return null;

  const exact = listByKey.get(q);
  if (exact) return exact;

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
  return {
    ...base,
    groupTitle: localScenicListDisplayTitle(list, h, locale),
    localScenicListId: list.listId,
    source: 'localScenicList',
    contentId: overlay?.contentId || contentId || fromCurated.contentId,
    imageUrl: thumb,
    thumbUrl: thumb,
  };
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
};

function lookupLocalScenicMemberOverlay(spotId) {
  if (!spotId) return null;
  return LOCAL_SCENIC_MEMBER_OVERLAYS[spotId] || null;
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
