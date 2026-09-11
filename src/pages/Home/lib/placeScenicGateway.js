import scenicJson from '../data/koreaScenicSpots.json' with { type: 'json' };
import heritageJson from '../data/koreaHeritageScenic.json' with { type: 'json' };
import hubsJson from '../data/cityAttractionHubs.json' with { type: 'json' };
import { scenicHomePathForHubId } from './koreaThemeCrossLinks.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const toUrlSlug = (nameEn) => {
  if (!nameEn) return '';
  return String(nameEn)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const KOREA_COUNTRY_SET = new Set([
  '대한민국',
  '한국',
  'korea',
  'south korea',
  'republic of korea',
  'kr',
  'kor',
]);

const KOREA_REGIONS = new Set([
  '수도권',
  '강원',
  '전라',
  '경상',
  '충청',
  '제주',
]);

// 1. 한국 허브 세트 구성
const KOREA_HUB_IDS = new Set();
for (const hub of Array.isArray(hubsJson) ? hubsJson : []) {
  const c = String(hub.country || '').trim().toLowerCase();
  const ce = String(hub.country_en || '').trim().toLowerCase();
  if (KOREA_COUNTRY_SET.has(c) || KOREA_COUNTRY_SET.has(ce)) {
    if (hub.hubId) KOREA_HUB_IDS.add(String(hub.hubId).toLowerCase());
  }
}

// 2. koreaScenicSpots 색인
const SCENIC_SPOTS = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];

const spotByPlaceSlug = new Map();
const spotById = new Map();
const spotByContentId = new Map();
const spotsByHubId = new Map();
const spotByNameAndHub = new Map();
const spotByName = new Map();
const spotByAttractionName = new Map();

for (const spot of SCENIC_SPOTS) {
  if (spot.id) {
    const idKey = String(spot.id).toLowerCase();
    spotById.set(idKey, spot);
  }
  if (spot.placeSlug) {
    const psKey = String(spot.placeSlug).toLowerCase();
    spotByPlaceSlug.set(psKey, spot);
  }
  if (spot.contentId) {
    const cidKey = String(spot.contentId).trim();
    if (cidKey) spotByContentId.set(cidKey, spot);
  }
  if (spot.hubId) {
    const hKey = String(spot.hubId).toLowerCase();
    KOREA_HUB_IDS.add(hKey);
    if (!spotsByHubId.has(hKey)) {
      spotsByHubId.set(hKey, []);
    }
    spotsByHubId.get(hKey).push(spot);

    if (spot.name) {
      const nk = normalizeKey(spot.name);
      if (nk) spotByNameAndHub.set(`${nk}|${hKey}`, spot);
    }
    if (spot.attractionName) {
      const ank = normalizeKey(spot.attractionName);
      if (ank) spotByNameAndHub.set(`${ank}|${hKey}`, spot);
    }
  }
  if (spot.name) {
    const nk = normalizeKey(spot.name);
    if (nk && !spotByName.has(nk)) spotByName.set(nk, spot);
  }
  if (spot.attractionName) {
    const ank = normalizeKey(spot.attractionName);
    if (ank && !spotByAttractionName.has(ank)) spotByAttractionName.set(ank, spot);
  }
}

// 3. koreaHeritageScenic 색인
const HERITAGE_SPOTS = Array.isArray(heritageJson?.spots) ? heritageJson.spots : [];

const heritageById = new Map();
const heritageByName = new Map();

for (const hSpot of HERITAGE_SPOTS) {
  if (hSpot.id) {
    heritageById.set(String(hSpot.id).trim(), hSpot);
  }
  if (hSpot.name) {
    const nk = normalizeKey(hSpot.name);
    if (nk && !heritageByName.has(nk)) heritageByName.set(nk, hSpot);
  }
}

/**
 * 장소가 국내(한국) 영역인지 빠르게 검증.
 * 해외 장소(파리, 도쿄, 뉴욕 등)가 우연한 키워드 일치로 명소 연결되는 현상 방지.
 */
export function isDomesticKoreaLocation(loc) {
  if (!loc || typeof loc !== 'object') return false;

  const rawCountry = String(loc.country || '').trim().toLowerCase();
  const rawCountryEn = String(loc.country_en || '').trim().toLowerCase();

  const isGeneric = !rawCountry || rawCountry === 'explore' || rawCountry === 'global';
  const isGenericEn = !rawCountryEn || rawCountryEn === 'explore' || rawCountryEn === 'global';

  // 명시적 해외 국가인 경우 배제 (예: Japan, France 등)
  if (!isGeneric && !KOREA_COUNTRY_SET.has(rawCountry)) return false;
  if (!isGenericEn && !KOREA_COUNTRY_SET.has(rawCountryEn)) return false;

  // 허브가 국내 허브인 경우
  const hubId = String(loc.hubId || '').toLowerCase();
  if (hubId && KOREA_HUB_IDS.has(hubId)) return true;

  // 권역이 국내 권역인 경우
  if (loc.region && KOREA_REGIONS.has(loc.region)) return true;

  // 좌표가 있을 때 한반도 바운딩 박스 검사 (위도 33.0 ~ 38.9, 경도 124.5 ~ 132.0)
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
    if (lat >= 33.0 && lat <= 38.9 && lng >= 124.5 && lng <= 132.0) {
      return true;
    }
    // 유효한 좌표인데 한국 밖이면 해외
    return false;
  }

  // 좌표가 없지만 나라가 한국이거나 explore/미지정인 경우도 허용
  if (KOREA_COUNTRY_SET.has(rawCountry) || KOREA_COUNTRY_SET.has(rawCountryEn)) {
    return true;
  }

  // 국가가 explore/미지정이고 좌표가 없는 경우, 국내 매칭 후보로 열어둠
  if (isGeneric && isGenericEn) {
    return true;
  }

  return false;
}

function attachReturnTo(deepPath, returnTo) {
  if (!returnTo || typeof returnTo !== 'string' || !returnTo.startsWith('/')) {
    return deepPath;
  }
  const sep = deepPath.includes('?') ? '&' : '?';
  return `${deepPath}${sep}returnTo=${encodeURIComponent(returnTo)}`;
}

/**
 * 장소카드 location 객체로부터 명소/명승 본문 매칭 정보 및 딥링크 생성.
 *
 * @param {object} loc 장소카드 location 객체
 * @param {{ returnTo?: string | null }} [options] 이전 장소카드 복귀 경로
 * @returns {{
 *   type: 'spot' | 'heritage' | 'hub',
 *   spotId?: string,
 *   name: string,
 *   blurb?: string,
 *   region?: string,
 *   hubId?: string,
 *   contentId?: string,
 *   imageUrl?: string | null,
 *   deepPath: string,
 *   badgeLabel: string,
 *   spotCount?: number,
 * } | null}
 */
export function resolveScenicSpotForPlace(loc, options = {}) {
  if (!loc || typeof loc !== 'object') return null;
  if (!isDomesticKoreaLocation(loc)) return null;

  const returnTo =
    typeof options?.returnTo === 'string' && options.returnTo.startsWith('/')
      ? options.returnTo
      : null;

  const slug = String(loc.slug || loc.canonical_slug || loc.placeSlug || '')
    .trim()
    .toLowerCase();
  const rawId = String(loc.id || '').trim();
  const contentId = loc.contentId ? String(loc.contentId).trim() : null;
  const hubId = String(loc.hubId || '').trim().toLowerCase();
  const name = loc.name || loc.name_ko || '';
  const nameKey = normalizeKey(name);
  const nameEnSlug = toUrlSlug(loc.name_en);

  // 1. koreaScenicSpots 매칭
  let matchedSpot = null;

  if (contentId && spotByContentId.has(contentId)) {
    matchedSpot = spotByContentId.get(contentId);
  } else if (slug && spotByPlaceSlug.has(slug)) {
    matchedSpot = spotByPlaceSlug.get(slug);
  } else if (slug && spotById.has(slug)) {
    matchedSpot = spotById.get(slug);
  } else if (rawId) {
    if (spotById.has(rawId.toLowerCase())) {
      matchedSpot = spotById.get(rawId.toLowerCase());
    } else if (rawId.startsWith('hub-attr-')) {
      // hub-attr-{hubId}-{nameKey}
      const parts = rawId.split('-');
      if (parts.length >= 4) {
        const h = parts[2];
        const restName = parts.slice(3).join('');
        const compound = `${restName}|${h.toLowerCase()}`;
        if (spotByNameAndHub.has(compound)) {
          matchedSpot = spotByNameAndHub.get(compound);
        }
      }
    }
  }

  if (!matchedSpot && nameKey && hubId) {
    const compound = `${nameKey}|${hubId}`;
    if (spotByNameAndHub.has(compound)) {
      matchedSpot = spotByNameAndHub.get(compound);
    }
  }

  if (!matchedSpot && nameKey) {
    if (spotByName.has(nameKey)) {
      matchedSpot = spotByName.get(nameKey);
    } else if (spotByAttractionName.has(nameKey)) {
      matchedSpot = spotByAttractionName.get(nameKey);
    }
  }

  if (!matchedSpot && nameEnSlug && spotByPlaceSlug.has(nameEnSlug)) {
    matchedSpot = spotByPlaceSlug.get(nameEnSlug);
  }

  if (matchedSpot) {
    const sHubId = matchedSpot.hubId || hubId || null;
    let deepPath = '/korea/theme/scenic';
    if (sHubId && resolveCityAttractionHub(sHubId)) {
      const base = scenicHomePathForHubId(sHubId);
      deepPath = `${base}&spot=${encodeURIComponent(matchedSpot.id)}`;
    } else {
      const params = new URLSearchParams();
      if (matchedSpot.region) {
        params.set('cregion', matchedSpot.region);
        params.set('hregion', matchedSpot.region);
        params.set('tregion', matchedSpot.region);
      }
      params.set('spot', matchedSpot.id);
      deepPath = `/korea/theme/scenic?${params.toString()}`;
    }

    return {
      type: 'spot',
      spotId: matchedSpot.id,
      name: matchedSpot.name || matchedSpot.attractionName || name,
      blurb: matchedSpot.blurb || '',
      region: matchedSpot.region || '',
      hubId: sHubId || '',
      contentId: matchedSpot.contentId || '',
      imageUrl: matchedSpot.imageUrl || null,
      deepPath: attachReturnTo(deepPath, returnTo),
      badgeLabel: '한국의 명승 · 테마 명소',
    };
  }

  // 2. koreaHeritageScenic (국가지정 명승) 매칭
  let matchedHeritage = null;

  if (rawId && heritageById.has(rawId)) {
    matchedHeritage = heritageById.get(rawId);
  } else if (slug && heritageById.has(slug)) {
    matchedHeritage = heritageById.get(slug);
  } else if (nameKey) {
    if (heritageByName.has(nameKey)) {
      matchedHeritage = heritageByName.get(nameKey);
    } else {
      // 명칭 부분 일치 (예: '경포대' -> '강릉 경포대와 경포호')
      for (const hSpot of HERITAGE_SPOTS) {
        const hKey = normalizeKey(hSpot.name);
        if (
          hKey &&
          nameKey.length >= 3 &&
          (hKey.includes(nameKey) || nameKey.includes(hKey))
        ) {
          matchedHeritage = hSpot;
          break;
        }
      }
    }
  }

  if (matchedHeritage) {
    let deepPath = `/korea/theme/scenic?spot=${encodeURIComponent(matchedHeritage.id)}`;
    if (hubId && resolveCityAttractionHub(hubId)) {
      const base = scenicHomePathForHubId(hubId);
      deepPath = `${base}&spot=${encodeURIComponent(matchedHeritage.id)}`;
    } else if (matchedHeritage.region) {
      const params = new URLSearchParams();
      params.set('cregion', matchedHeritage.region);
      params.set('hregion', matchedHeritage.region);
      params.set('tregion', matchedHeritage.region);
      params.set('spot', matchedHeritage.id);
      deepPath = `/korea/theme/scenic?${params.toString()}`;
    }

    return {
      type: 'heritage',
      spotId: matchedHeritage.id,
      name: matchedHeritage.name || name,
      blurb: matchedHeritage.blurb || matchedHeritage.content || '',
      region: matchedHeritage.region || '',
      hubId: hubId || '',
      contentId: '',
      imageUrl: matchedHeritage.imageUrl || null,
      deepPath: attachReturnTo(deepPath, returnTo),
      badgeLabel: '국가지정 명승',
    };
  }

  // 3. 한국 도시 허브 자체 매칭
  const targetHubId = (hubId || slug || '').toLowerCase();
  if (targetHubId && spotsByHubId.has(targetHubId)) {
    const hubSpots = spotsByHubId.get(targetHubId);
    const resolvedHub = resolveCityAttractionHub(targetHubId);
    const hubName = resolvedHub?.name || loc.name || targetHubId;
    const base = scenicHomePathForHubId(targetHubId);

    return {
      type: 'hub',
      name: hubName,
      spotCount: hubSpots.length,
      blurb: `${hubName}의 대표 명승·명소 ${hubSpots.length}곳 둘러보기`,
      region: hubSpots[0]?.region || '',
      hubId: targetHubId,
      imageUrl: hubSpots[0]?.imageUrl || null,
      deepPath: attachReturnTo(base, returnTo),
      badgeLabel: '한국의 명승 · 지역 컬렉션',
    };
  }

  return null;
}
