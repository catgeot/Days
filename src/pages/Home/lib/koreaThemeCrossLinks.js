import { listKoreaTop10Scenic } from './koreaTop10Scenic.js';
import { listKoreaScenicSpots } from './koreaScenicSpots.js';
import { listKoreaThemeRegionAttractions } from './koreaThemeRegions.js';
import { areaCodeForHubId, hubIdsForArea } from '../../Korea/koreaHubSeeds.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { extractTourAttractionSigungu } from './koreaTourAttractionLocality.js';
import {
  SCENIC_REGION_ORDER,
  scenicAreaCodeForHubId,
  scenicRegionForAreaCode,
} from './koreaTourAttractionMap.js';
import { nearbyHubsForFestival } from '../../Korea/nearbyFestivalHubs.js';
import {
  resolveMrtStayQuery,
  stripKoAdminSuffix,
} from '../../../utils/mrtStayQuery.js';
import { resolveMrtTnaQuery } from '../../../utils/mrtTnaQuery.js';
import { resolveMrtPackageThemeHref } from '../../../utils/mrtPackageLinks.js';
import { buildThemeModulePath } from './koreaThemeNavBack.js';

/**
 * GATEO 권역 라벨(top10/scenic `region`) → TourAPI 시도 areaCode.
 * 1:1이 아니면 대표 코드 1개(deep-link용). hubId가 있으면 areaCodeForHubId 우선.
 */
export const THEME_REGION_LABEL_TO_AREA = {
  수도권: '1',
  서울: '1',
  인천: '2',
  경기: '31',
  강원: '32',
  충청: '34',
  충남: '34',
  충북: '33',
  전라: '38',
  전남: '38',
  전북: '37',
  경상: '35',
  경북: '35',
  경남: '36',
  부산: '6',
  대구: '4',
  울산: '7',
  광주: '5',
  대전: '3',
  제주: '39',
};

/** hubId → 상품 LIVE 확인된 국내 패키지 테마 키 (부산·경주 오탐 제외) */
const PACKAGE_BY_HUB = {
  jeju: 'koreaJeju',
  seogwipo: 'koreaJeju',
  yeosu: 'koreaYeosu',
  namhae: 'koreaYeosu',
  suncheon: 'koreaSuncheon',
  ulleung: 'koreaUlleungdo',
  pohang: 'koreaUlleungdo',
  mokpo: 'koreaHongdo',
  gangneung: 'koreaGangwon',
  sokcho: 'koreaGangwon',
  samcheok: 'koreaGangwon',
  donghae: 'koreaGangwon',
  wonju: 'koreaGangwon',
  hoengseong: 'koreaGangwon',
  pyeongchang: 'koreaGangwon',
  chuncheon: 'koreaGangwon',
};

const DEFAULT_NEARBY_LIMIT = 4;
const DEFAULT_SAME_HUB_LIMIT = 4;

function normId(v) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

function normSlug(v) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

/**
 * @param {{ hubId?: string, region?: string, areaCode?: string | number } | null | undefined} spot
 * @returns {string | null}
 */
export function resolveThemeSpotAreaCode(spot) {
  if (!spot) return null;
  const direct = String(spot.areaCode ?? '').trim();
  if (direct && direct !== 'all') return direct;

  const fromHub = areaCodeForHubId(spot.hubId);
  if (fromHub) return String(fromHub);

  const label = String(spot.region || '').trim();
  if (label && THEME_REGION_LABEL_TO_AREA[label]) {
    return THEME_REGION_LABEL_TO_AREA[label];
  }
  return null;
}

/**
 * placeSlug / hubId 기준 테마 멤버십 인덱스 (런타임 생성 · JSON 복제 금지).
 * @returns {{
 *   byPlaceSlug: Map<string, {
 *     placeSlug: string,
 *     hubId: string,
 *     name: string,
 *     top10: object | null,
 *     scenic: object | null,
 *     regionAttraction: object | null,
 *     modules: string[],
 *   }>,
 *   byHubId: Map<string, string[]>,
 * }}
 */
export function buildThemeMembershipIndex() {
  /** @type {Map<string, any>} */
  const byPlaceSlug = new Map();
  /** @type {Map<string, string[]>} */
  const byHubId = new Map();

  const touch = (placeSlug, hubId, name, moduleId, payload) => {
    const slug = normSlug(placeSlug);
    if (!slug) return;
    const hid = normId(hubId);
    let row = byPlaceSlug.get(slug);
    if (!row) {
      row = {
        placeSlug: slug,
        hubId: hid,
        name: String(name || slug),
        top10: null,
        scenic: null,
        regionAttraction: null,
        modules: [],
      };
      byPlaceSlug.set(slug, row);
    }
    if (hid) row.hubId = hid;
    if (name) row.name = String(name);
    if (moduleId === 'top10') row.top10 = payload;
    if (moduleId === 'scenic') row.scenic = payload;
    if (moduleId === 'regions') row.regionAttraction = payload;
    if (moduleId && !row.modules.includes(moduleId)) row.modules.push(moduleId);
    if (hid) {
      const list = byHubId.get(hid) || [];
      if (!list.includes(slug)) list.push(slug);
      byHubId.set(hid, list);
    }
  };

  for (const s of listKoreaTop10Scenic()) {
    touch(s.placeSlug, s.hubId, s.name, 'top10', s);
  }
  for (const s of listKoreaScenicSpots()) {
    touch(s.placeSlug, s.hubId, s.name, 'scenic', s);
  }

  const areas = new Set();
  for (const s of [...listKoreaTop10Scenic(), ...listKoreaScenicSpots()]) {
    const code = resolveThemeSpotAreaCode(s);
    if (code) areas.add(code);
  }
  for (const id of hubIdsForArea('all') || []) {
    const code = areaCodeForHubId(id);
    if (code) areas.add(String(code));
  }
  // 전 시도 커버 — regions 멤버십
  for (const code of [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
  ]) {
    areas.add(code);
  }

  for (const code of areas) {
    for (const a of listKoreaThemeRegionAttractions(code)) {
      touch(a.placeSlug, a.hubId, a.name, 'regions', a);
    }
  }

  return { byPlaceSlug, byHubId };
}

let _membershipCache = null;

/** @returns {ReturnType<typeof buildThemeMembershipIndex>} */
export function getThemeMembershipIndex() {
  if (!_membershipCache) _membershipCache = buildThemeMembershipIndex();
  return _membershipCache;
}

/** @param {string | null | undefined} placeSlug */
export function getThemeMembership(placeSlug) {
  const slug = normSlug(placeSlug);
  if (!slug) return null;
  return getThemeMembershipIndex().byPlaceSlug.get(slug) || null;
}

function firstTourContentId(...candidates) {
  for (const raw of candidates) {
    const id = String(raw || '').trim();
    if (/^\d{1,32}$/.test(id)) return id;
  }
  return null;
}

/**
 * 멤버십 → 명승 페이지 spot deep-link.
 * curated scenic id만 URL로 연다. regions/top10 페이지는 리다이렉트로 spot이 사라지고,
 * Tour contentId URL은 제목이 Tour 공식명으로 바뀌므로 비-명승은 중첩 모달(modalSpot)을 쓴다.
 * @param {{
 *   scenic?: { id?: string, contentId?: string | null } | null,
 *   top10?: { id?: string, contentId?: string | null } | null,
 *   regionAttraction?: { id?: string, contentId?: string | null } | null,
 *   hubId?: string,
 * } | null | undefined} membership
 * @returns {string | null}
 */
export function sameHubMembershipDeepPath(membership) {
  if (!membership?.scenic?.id) return null;
  return buildThemeModulePath('/korea/theme/scenic', {
    spotId: membership.scenic.id,
  });
}

/**
 * 비-명승 sameHub → 중첩 모달 spot (GATEO 이름 유지 · contentId 있으면 Tour LIVE).
 * @param {{
 *   placeSlug?: string,
 *   hubId?: string,
 *   name?: string,
 *   scenic?: object | null,
 *   top10?: object | null,
 *   regionAttraction?: object | null,
 * } | null | undefined} membership
 * @returns {object | null}
 */
export function sameHubMembershipModalSpot(membership) {
  if (!membership) return null;
  const src =
    membership.regionAttraction || membership.top10 || membership.scenic;
  if (!src) return null;
  const name = String(membership.name || src.name || '').trim();
  if (!name) return null;
  const contentId = firstTourContentId(
    membership.regionAttraction?.contentId,
    membership.top10?.contentId,
    membership.scenic?.contentId,
    src.contentId,
  );
  const hubId = normId(membership.hubId || src.hubId);
  const hub = hubId ? resolveCityAttractionHub(hubId) : null;
  const hubAttr = (hub?.attractions || []).find(
    (a) => String(a?.name || '').trim() === name,
  );
  const lat = Number(hubAttr?.lat ?? src.lat);
  const lng = Number(hubAttr?.lng ?? src.lng);
  return {
    id: String(src.id || membership.placeSlug || name),
    name,
    subtitle: String(
      src.hubName || src.areaName || src.region || src.areaLabel || hub?.name || '',
    ).trim() || undefined,
    blurb: src.blurb || undefined,
    placeSlug: membership.placeSlug || src.placeSlug || null,
    contentId,
    hubId: hubId || null,
    region: src.region || src.areaName || null,
    areaCode: src.areaCode ?? null,
    areaLabel: src.areaLabel || src.areaName || null,
    nameEn: src.nameEn || src.attractionNameEn || hubAttr?.name_en || null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

/**
 * 같은 hub의 다른 테마 명소 (자기 제외).
 * @param {string} hubId
 * @param {{ excludePlaceSlug?: string, limit?: number }} [opts]
 */
export function listSameHubCrossSpots(hubId, opts = {}) {
  const hid = normId(hubId);
  if (!hid) return [];
  const limit = opts.limit ?? DEFAULT_SAME_HUB_LIMIT;
  const exclude = normSlug(opts.excludePlaceSlug);
  const { byHubId, byPlaceSlug } = getThemeMembershipIndex();
  const slugs = byHubId.get(hid) || [];
  /** @type {any[]} */
  const out = [];
  for (const slug of slugs) {
    if (exclude && slug === exclude) continue;
    const row = byPlaceSlug.get(slug);
    if (!row) continue;
    const deepPath = sameHubMembershipDeepPath(row);
    const modalSpot = deepPath ? null : sameHubMembershipModalSpot(row);
    if (!deepPath && !modalSpot) continue;
    out.push({
      placeSlug: row.placeSlug,
      hubId: row.hubId,
      name: row.name,
      modules: row.modules.slice(),
      pathHint: '/korea/theme/scenic',
      deepPath,
      modalSpot,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * hub → 해당 시·군 명승지 홈 (`/korea/theme/scenic?region=&area=&hub=`).
 * 시도(area)만 쓰면 보령·공주·태안이 같은 홈으로 뭉개지므로 hub를 반드시 붙인다.
 * @param {string | null | undefined} hubId
 * @returns {string}
 */
export function scenicHomePathForHubId(hubId) {
  const hid = normId(hubId);
  if (!hid) return '/korea/theme/scenic';
  if (!resolveCityAttractionHub(hid)) return '/korea/theme/scenic';
  const areaCode =
    scenicAreaCodeForHubId(hid) || areaCodeForHubId(hid) || null;
  let region = scenicRegionForAreaCode(areaCode);
  if (!region) {
    const curated = listKoreaScenicSpots().find((s) => normId(s.hubId) === hid);
    const label = String(curated?.region || '').trim();
    if (label && SCENIC_REGION_ORDER.includes(label)) region = label;
  }
  const params = new URLSearchParams();
  if (region) params.set('region', region);
  if (areaCode && region) params.set('area', String(areaCode));
  params.set('hub', hid);
  return `/korea/theme/scenic?${params.toString()}`;
}

/**
 * 축제 nearbyHubs 패턴 재사용 — spot 좌표/area로 인근 hub.
 * @param {{ lat?: number, lng?: number, mapx?: unknown, mapy?: unknown, hubId?: string, areaCode?: string|number, region?: string, addr1?: string }} spot
 * @param {Array<{ hubId: string, name: string, lat?: number, lng?: number }>} hubList
 * @param {{ limit?: number, maxKm?: number }} [opts]
 */
export function listNearbyHubsForThemeSpot(spot, hubList, opts = {}) {
  if (!spot) return [];
  const areaCode = resolveThemeSpotAreaCode(spot);
  const lat = Number(spot.lat);
  const lng = Number(spot.lng);
  const item = {
    mapx: spot.mapx,
    mapy: spot.mapy,
    areaCode,
    addr1: spot.addr1,
  };
  // TourAPI mapx=lng, mapy=lat. spot은 lat/lng 필드.
  if (Number.isFinite(lat) && Number.isFinite(lng) && item.mapx == null) {
    item.mapx = lng;
    item.mapy = lat;
  }
  const hubs = nearbyHubsForFestival(item, hubList, {
    limit: opts.limit ?? DEFAULT_NEARBY_LIMIT,
    maxKm: opts.maxKm,
  });
  const selfHub = normId(spot.hubId);
  return hubs.filter((h) => normId(h?.hubId) !== selfHub);
}

/**
 * PlaceCard/MRT 쿼리용 location 골격 (숙소·투어).
 * 관광지 POI 제목 대신 hub·시군구·areaLabel을 parentCity로 올려 지역 검색한다.
 * @param {{
 *   hubId?: string,
 *   placeSlug?: string,
 *   name?: string,
 *   nameEn?: string,
 *   lat?: number,
 *   lng?: number,
 *   addr1?: string,
 *   addr2?: string,
 *   locality?: string,
 *   areaLabel?: string,
 * }} spot
 */
export function buildThemeSpotLocation(spot) {
  const hubId = normId(spot?.hubId);
  const placeSlug = normSlug(spot?.placeSlug) || hubId;
  const hub = hubId ? resolveCityAttractionHub(hubId) : null;
  const fromAddr =
    extractTourAttractionSigungu(spot?.addr1, spot?.addr2) ||
    extractTourAttractionSigungu(spot?.locality) ||
    '';
  const areaLabel = String(spot?.areaLabel || '').trim();
  // hub·시군 축약(춘천시→춘천) 우선 — POI 제목은 name에만 두고 검색 선두로 쓰지 않음
  const parentCity =
    hub?.name ||
    stripKoAdminSuffix(fromAddr) ||
    fromAddr ||
    areaLabel ||
    undefined;
  return {
    slug: placeSlug || hubId,
    hubId,
    name: String(spot?.name || hub?.name || placeSlug || ''),
    name_en: String(spot?.nameEn || hub?.name_en || ''),
    name_ko: String(spot?.name || hub?.name || ''),
    country: '대한민국',
    country_en: 'South Korea',
    lat: Number(spot?.lat) || Number(hub?.lat) || undefined,
    lng: Number(spot?.lng) || Number(hub?.lng) || undefined,
    parentCity,
  };
}

/**
 * @param {{ hubId?: string }} spot
 * @returns {string | null} MRT_PACKAGE_THEME_TARGETS 키
 */
export function resolveThemePackageKey(spot) {
  const hid = normId(spot?.hubId);
  return PACKAGE_BY_HUB[hid] || null;
}

/**
 * 테마 상세 모달용 크로스 링크 번들 (UI 배선 = #19).
 *
 * @param {{
 *   hubId?: string,
 *   placeSlug?: string,
 *   name?: string,
 *   nameEn?: string,
 *   region?: string,
 *   areaCode?: string | number,
 *   lat?: number,
 *   lng?: number,
 *   contentId?: string | null,
 *   addr1?: string,
 *   addr2?: string,
 *   locality?: string,
 *   areaLabel?: string,
 * }} spot
 * @param {{ hubList?: Array<{ hubId: string, name: string, lat?: number, lng?: number }>, utmContentPrefix?: string }} [opts]
 */
export function resolveThemeCrossLinks(spot, opts = {}) {
  if (!spot) {
    return {
      areaCode: null,
      membership: null,
      sameHub: [],
      nearbyHubs: [],
      deepLinks: {
        festivals: '/korea?from=theme',
        courses: '/korea/theme/courses',
        regions: '/korea/theme/regions',
        scenic: '/korea/theme/scenic',
        top10: '/korea/theme/top10',
      },
      stay: null,
      tna: null,
      packageCta: null,
    };
  }

  const areaCode = resolveThemeSpotAreaCode(spot);
  const membership = getThemeMembership(spot.placeSlug);
  const sameHub = listSameHubCrossSpots(spot.hubId, {
    excludePlaceSlug: spot.placeSlug,
  });

  let hubList = opts.hubList;
  if (!Array.isArray(hubList) || !hubList.length) {
    const ids = areaCode ? hubIdsForArea(areaCode) : hubIdsForArea('all');
    hubList = ids
      .map((id) => {
        const hub = resolveCityAttractionHub(id);
        if (!hub) return null;
        return {
          hubId: String(hub.hubId || id).toLowerCase(),
          name: String(hub.name || id),
          lat: Number(hub.lat),
          lng: Number(hub.lng),
        };
      })
      .filter(Boolean);
  }

  const nearbyHubs = listNearbyHubsForThemeSpot(spot, hubList);

  const deepLinks = {
    festivals: areaCode
      ? `/korea?from=theme&area=${encodeURIComponent(areaCode)}`
      : '/korea?from=theme',
    courses: areaCode
      ? `/korea/theme/courses?area=${encodeURIComponent(areaCode)}`
      : '/korea/theme/courses',
    regions: areaCode
      ? `/korea/theme/regions?area=${encodeURIComponent(areaCode)}`
      : '/korea/theme/regions',
    scenic: '/korea/theme/scenic',
    top10: '/korea/theme/top10',
  };

  const location = buildThemeSpotLocation(spot);
  const stayQ = resolveMrtStayQuery(location);
  const tnaQ = resolveMrtTnaQuery(location);

  const packageKey = resolveThemePackageKey(spot);
  let packageCta = null;
  if (packageKey) {
    const resolved = resolveMrtPackageThemeHref(packageKey, {
      utmContent: `${opts.utmContentPrefix || 'korea-theme-cross'}-${packageKey}`.slice(
        0,
        100,
      ),
    });
    if (resolved?.url) {
      packageCta = {
        key: packageKey,
        url: resolved.url,
        ctaLabel: resolved.ctaLabel,
      };
    }
  }

  return {
    areaCode,
    membership: membership
      ? {
          placeSlug: membership.placeSlug,
          hubId: membership.hubId,
          modules: membership.modules.slice(),
          inTop10: Boolean(membership.top10),
          inScenic: Boolean(membership.scenic),
          inRegions: Boolean(membership.regionAttraction),
        }
      : null,
    sameHub,
    nearbyHubs: nearbyHubs.map((h) => {
      const hubId = String(h.hubId);
      return {
        hubId,
        name: String(h.name || h.hubId),
        scenicPath: scenicHomePathForHubId(hubId),
      };
    }),
    deepLinks,
    stay: stayQ
      ? {
          keyword: stayQ.keyword,
          altKeywords: stayQ.altKeywords || [],
          location,
        }
      : null,
    tna: tnaQ
      ? {
          keyword: tnaQ.keyword,
          altKeywords: tnaQ.altKeywords || [],
          nearbyKeywords: tnaQ.nearbyKeywords || [],
          location,
        }
      : null,
    packageCta,
  };
}

function hubListForArea(areaCode) {
  const ids = areaCode ? hubIdsForArea(areaCode) : hubIdsForArea('all');
  return ids
    .map((id) => {
      const hub = resolveCityAttractionHub(id);
      if (!hub) return null;
      return {
        hubId: String(hub.hubId || id).toLowerCase(),
        name: String(hub.name || id),
        lat: Number(hub.lat),
        lng: Number(hub.lng),
      };
    })
    .filter(Boolean);
}

/**
 * 축제 상세용 크로스 번들 — 인근 hub로 숙소·투어·패키지 매칭 (#34).
 * 지도·칩 로직은 건드리지 않음.
 *
 * @param {Record<string, unknown> | null | undefined} item TourAPI festival item
 * @param {{ region?: string, areaCode?: string | number, utmContentPrefix?: string }} [opts]
 */
export function resolveFestivalThemeCrossLinks(item, opts = {}) {
  if (!item) return resolveThemeCrossLinks(null);

  const areaCode =
    opts.areaCode != null && String(opts.areaCode).trim() !== ''
      ? String(opts.areaCode).trim()
      : resolveThemeSpotAreaCode({
          areaCode: item.areaCode ?? item.areacode,
          region: opts.region,
        });

  let hubList = hubListForArea(areaCode);
  if (!hubList.length) hubList = hubListForArea(null);

  const nearby = nearbyHubsForFestival(
    { ...item, areaCode: areaCode || item.areaCode || item.areacode },
    hubList,
    { limit: 12 },
  );

  const nearestHubId = nearby[0]?.hubId || null;
  let packageHubId = null;
  for (const h of nearby) {
    if (resolveThemePackageKey({ hubId: h.hubId })) {
      packageHubId = h.hubId;
      break;
    }
  }

  const cross = resolveThemeCrossLinks(
    {
      hubId: nearestHubId,
      areaCode,
      region: opts.region,
      name: item.title,
      lat: undefined,
      lng: undefined,
      mapx: item.mapx,
      mapy: item.mapy,
      contentId: item.contentId,
    },
    {
      hubList,
      utmContentPrefix: opts.utmContentPrefix || 'korea-festival-cross',
    },
  );

  if (!cross.packageCta && packageHubId && packageHubId !== nearestHubId) {
    const pkgOnly = resolveThemeCrossLinks(
      { hubId: packageHubId, areaCode, region: opts.region },
      {
        hubList,
        utmContentPrefix: opts.utmContentPrefix || 'korea-festival-cross',
      },
    );
    if (pkgOnly.packageCta) cross.packageCta = pkgOnly.packageCta;
  }

  if (opts.region) {
    cross.deepLinks = {
      ...cross.deepLinks,
      scenic: `/korea/theme/scenic?region=${encodeURIComponent(String(opts.region))}`,
    };
  }

  return cross;
}
