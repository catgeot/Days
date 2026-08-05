import { listKoreaTop10Scenic } from './koreaTop10Scenic.js';
import { listKoreaScenicSpots } from './koreaScenicSpots.js';
import { listKoreaThemeRegionAttractions } from './koreaThemeRegions.js';
import { areaCodeForHubId, hubIdsForArea } from '../../Korea/koreaHubSeeds.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { nearbyHubsForFestival } from '../../Korea/nearbyFestivalHubs.js';
import { resolveMrtStayQuery } from '../../../utils/mrtStayQuery.js';
import { resolveMrtTnaQuery } from '../../../utils/mrtTnaQuery.js';
import { resolveMrtPackageThemeHref } from '../../../utils/mrtPackageLinks.js';

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
    out.push({
      placeSlug: row.placeSlug,
      hubId: row.hubId,
      name: row.name,
      modules: row.modules.slice(),
      pathHint: row.top10
        ? '/korea/theme/top10'
        : row.scenic
          ? '/korea/theme/scenic'
          : '/korea/theme/regions',
    });
    if (out.length >= limit) break;
  }
  return out;
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
 * @param {{ hubId?: string, placeSlug?: string, name?: string, nameEn?: string, lat?: number, lng?: number }} spot
 */
export function buildThemeSpotLocation(spot) {
  const hubId = normId(spot?.hubId);
  const placeSlug = normSlug(spot?.placeSlug) || hubId;
  const hub = hubId ? resolveCityAttractionHub(hubId) : null;
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
    parentCity: hub?.name || undefined,
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
    nearbyHubs: nearbyHubs.map((h) => ({
      hubId: String(h.hubId),
      name: String(h.name || h.hubId),
      placePath: `/place/${String(h.hubId).toLowerCase()}`,
    })),
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
