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
  };
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
  const contentId = memberContentId(member, attraction) || fromCurated.contentId;
  const spotId = localScenicMemberSpotId(list.listId, member.attractionName);
  const overlay = lookupLocalScenicMemberOverlay(spotId);
  const firstImage = overlay?.firstImage || fromCurated.imageUrl || null;
  const imageUrl = overlay?.imageUrl || fromCurated.imageUrl || null;
  return {
    id: spotId,
    name: member.attractionName,
    blurb: title,
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
      if (hit) {
        front.push({
          ...hit,
          groupTitle: title,
          localScenicListId: list.listId,
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
      out.push({
        spotId: localScenicMemberSpotId(list.listId, name),
        name,
        contentId: memberContentId(member, attraction) || fromCurated.contentId,
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
