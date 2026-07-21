// src/pages/Home/lib/geocoding.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Fix] 영문 강제 변환(For Unsplash) 및 재시도(Retry) 로직 유지.
// 2. 🚨 [Fix/New] 역지오코딩(Reverse Geocoding) 로케일 강제: accept-language를 'en,ko'로 변경하여 영문명을 최우선으로 확보.
// 3. 🚨 [Fix/New] name_en 강제 추출: 라우팅에 사용할 수 있도록 응답 데이터에서 영문명을 명시적으로 파싱하여 반환 객체에 추가.
// 4. [Free Explore] Mapbox Geocoding 우선 — 지구본 POI 라벨과 동일 소스. 휴게소·세부 장소 검색이 상위 행정구역으로 떨어지지 않게.

import { KEYWORD_SYNONYMS } from '../data/keywordData';
import { resolveTravelCountryFromAddresses } from './travelRegionCountry.js';

const RETRY_FILTERS = [
  "고원", "섬", "산", "해변", "폭포", "마을", "대륙", "반도", "시", "군", "구",
  "저수지", "댐", "호수",
];
const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;
const MAPBOX_TOKEN = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_MAPBOX_TOKEN : '';

/** 세부 시설·명소 쿼리 — 행정구역(군/시)으로 축소·스냅하면 안 되는 입력 */
export const FACILITY_QUERY_RE =
  /휴게소|rest\s*area|\bsa\b|터미널|기차역|지하철역|공항|항구|나들목|톨게이트|\bic\b|박물관|미술관|사찰|성당|교회|리조트|호텔|콘도|펜션|댐|저수지|폭포|해변|해수욕장|시장|마트|카페|공원|타워|전망대|온천|스키장|골프장|캠핑장|유원지|테마파크/i;

/** 유명 랜드마크 — 도시 SSOT·country=kr 우선으로 묶이면 안 됨 */
export const LANDMARK_QUERY_RE =
  /에펠\s*탑|타임\s*스퀘어|콜로세움|콜로세오|피라미드|eiffel|times\s*square|colosseum|coliseum|pyramid/i;

/** 도로·거리명으로 유명한 명소가 가로채지는 패턴 (Eiffel Tower Street 등) */
const STREETISH_LABEL_RE =
  /\b(street|st\.|road|rd\.|avenue|ave\.|lane|ln\.|drive|dr\.|blvd|boulevard|highway|way)\b|(?:거리|도로|로)$/i;

/**
 * 유명 명소 → 본명·국가 고정 쿼리.
 * Mapbox가 동명 도로·카피 시설을 먼저 줄 때 파리 에펠탑 등으로 고정.
 */
function resolveLandmarkGeocodePlan(query) {
  const q = String(query || '').trim();
  if (!q) return null;

  if (/에펠\s*탑|eiffel/i.test(q)) {
    return {
      queries: [
        'Tour Eiffel, Paris',
        'Eiffel Tower, Paris, France',
        'Tour Eiffel',
        'Eiffel Tower',
      ],
      country: 'fr',
      acceptText: /^(tour\s+)?eiffel(\s+tower)?$/i,
      rejectLabel: STREETISH_LABEL_RE,
    };
  }
  if (/타임\s*스퀘어|times\s*square/i.test(q)) {
    return {
      queries: ['Times Square, New York', 'Times Square, Manhattan', 'Times Square'],
      country: 'us',
      acceptText: /^times\s+square$/i,
      rejectLabel: STREETISH_LABEL_RE,
    };
  }
  if (/콜로세움|콜로세오|colosseum|coliseum/i.test(q)) {
    return {
      queries: ['Colosseum, Rome', 'Colosseo, Roma', 'Colosseum'],
      country: 'it',
      acceptText: /^(the\s+)?colosseum$|^colosseo$/i,
      rejectLabel: STREETISH_LABEL_RE,
    };
  }
  if (/피라미드|pyramid/i.test(q) && /기자|기제|giza|cairo|카이로|이집트|egypt/i.test(q)) {
    return {
      queries: ['Pyramids of Giza', 'Great Pyramid of Giza', 'Giza Pyramid Complex'],
      country: 'eg',
      acceptText: /pyramid|giza/i,
      rejectLabel: STREETISH_LABEL_RE,
    };
  }
  return null;
}

export const isFacilityQuery = (query) => {
  const q = String(query || '');
  return FACILITY_QUERY_RE.test(q) || LANDMARK_QUERY_RE.test(q);
};

/**
 * 숙박·브랜드 검색어 → OSM/Mapbox에 잘 잡히는 별칭.
 * 「제주 신라호텔」은 버스정류장만 맞고 「호텔신라 제주」는 tourism=hotel.
 */
export function expandForwardQueryAliases(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const out = [];
  const add = (s) => {
    const t = String(s || '').trim();
    if (!t || t === q || out.includes(t)) return;
    out.push(t);
  };

  if (/신라\s*호텔|호텔\s*신라|the\s*shilla/i.test(q)) {
    if (/제주|jeju/i.test(q)) {
      add('호텔신라 제주');
      add('The Shilla Jeju');
      add('제주 호텔신라');
    } else if (/서울|seoul/i.test(q)) {
      add('서울신라호텔');
      add('호텔신라 서울');
      add('The Shilla Seoul');
    } else {
      add('서울신라호텔');
      add('호텔신라 제주');
    }
  }

  if (/대명|비발디|vivaldi|소노\s*펠리체|sono\s*felice/i.test(q)) {
    add('소노펠리체 비발디파크');
    add('비발디파크');
    add('소노펠리체');
    if (/홍천/.test(q)) add('홍천 비발디파크');
  }

  // 유명 명소 — 도시로 축소하지 않고 POI 영문명으로 Mapbox/Nominatim 히트
  const landmarkPlan = resolveLandmarkGeocodePlan(q);
  if (landmarkPlan) {
    for (const preferred of landmarkPlan.queries) add(preferred);
  }

  return out;
}

// 1. 내부 통역 함수
const standardizeName = (rawName) => {
  if (!rawName) return "";
  // 불필요한 공백 제거 및 소문자화
  const lowerName = rawName.toLowerCase().trim();
  if (KEYWORD_SYNONYMS[lowerName]) return KEYWORD_SYNONYMS[lowerName];
  return rawName;
};

// 한국어 입력 -> 사전에서 영어 Key 찾아내기 (역추적)
const findEnglishKey = (koreanName) => {
  const entry = Object.entries(KEYWORD_SYNONYMS).find(([, ko]) => ko === koreanName);
  return entry ? entry[0] : null;
};

// 🚨 [New] 딜레이 유틸리티 (API 차단 방지용)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** 한글 쿼리 → 폴란드/도로명 "T" 등 Nominatim 오탐 걸러내기 */
const isPlausibleForwardHit = (query, result) => {
  if (!result) return false;
  const name = String(result.name || '').trim();
  if (name.length <= 1) return false;
  const cls = String(result.class || '');
  const type = String(result.type || '');
  const facilityQ = isFacilityQuery(query);

  if (cls === 'office' || cls === 'railway') return false;
  // 고속도로 휴게소(OSM: highway=services|rest_area)는 시설 검색에서만 허용
  if (cls === 'highway') {
    const allowRest = facilityQ && /services|rest_area|fuel/.test(type);
    if (!allowRest) return false;
  }

  if (HAS_HANGUL_RE.test(query)) {
    const cc = String(result.address?.country_code || '').toLowerCase();
    const display = String(result.display_name || '');
    if (cc && cc !== 'kr') return false;
    if (!cc && !HAS_HANGUL_RE.test(display)) return false;
  }
  return true;
};

/** 시설 검색인데 행정구역·시청·광역만 맞은 경우 — 상위 지명으로 떨어뜨리지 않음 */
const isAdminOnlyHitForFacility = (query, result) => {
  if (!isFacilityQuery(query) || !result) return false;
  const cls = String(result.class || '');
  const type = String(result.type || '');
  const addresstype = String(result.addresstype || '');
  const name = String(result.name || '');
  if (cls === 'boundary' || type === 'administrative') return true;
  if (type === 'townhall' || /시청|구청|도청|군청|청사/.test(name)) return true;
  if (/^(county|state|region|municipality|city|town|village|suburb)$/.test(addresstype)) return true;
  return false;
};

// 🚨 [New] 여행지 목적에 맞는 우선순위 스코어링 함수
const calculatePlaceScore = (place, query = '') => {
  let score = 0;
  if (!place) return 0;
  const type = place.type || "";
  const category = place.category || "";
  const address = place.address || {};
  const cls = place.class || "";
  const facilityQ = isFacilityQuery(query);

  // 여행지로 선호되는 키워드에 높은 점수 부여
  if (address.island) score += 50;
  if (address.city || address.town || address.village) score += 30;
  if (category === "tourism" || cls === "tourism") score += 40;
  if (cls === "natural" || cls === "water" || type === "reservoir" || type === "water") score += 45;
  if (facilityQ && (cls === 'amenity' || /services|rest_area|fuel/.test(type))) score += 60;
  // 숙박 POI 우선 (호텔·리조트·콘도)
  if (facilityQ && (type === 'hotel' || type === 'resort' || type === 'guest_house' || cls === 'leisure')) {
    score += 90;
  }
  if (facilityQ && cls === 'building' && type === 'hotel') score += 90;

  // 단순 행정구역(특히 대도시의 구/동)이나 역 등은 점수를 낮춤
  if (address.suburb || address.borough || address.quarter || address.city_district) score -= 30;
  if (type === "station" || category === "railway") score -= 40;
  if (type === "administrative" && address.borough) score -= 20;
  if (facilityQ && (cls === 'boundary' || type === 'administrative')) score -= 80;
  if (facilityQ && (type === 'townhall' || /시청|구청|도청|군청/.test(String(place.name || '')))) {
    score -= 100;
  }

  return score;
};

const mapboxPlaceTypeScore = (placeTypes = [], facilityQ = false) => {
  const types = Array.isArray(placeTypes) ? placeTypes : [];
  if (types.includes('poi')) return facilityQ ? 100 : 80;
  if (types.includes('address')) return 50;
  if (types.includes('neighborhood') || types.includes('locality')) return 35;
  if (types.includes('place')) return facilityQ ? 5 : 40;
  if (types.includes('district') || types.includes('region')) return facilityQ ? -40 : 20;
  if (types.includes('country')) return -80;
  return 0;
};

/** Mapbox feature 순위 — 명소는 Street/동명 도로 페널티, 본명·국가 가산 */
const scoreMapboxFeature = (feature, searchQuery, facilityQ, landmarkPlan = null) => {
  let score = mapboxPlaceTypeScore(feature?.place_type, facilityQ);
  const text = String(feature?.text || '').trim();
  const placeName = String(feature?.place_name || '').trim();
  const label = `${text} ${placeName}`;

  if (typeof feature?.relevance === 'number') {
    score += feature.relevance * 12;
  }

  // 「Eiffel Tower Street」(필리핀 등) — 명소 검색에서 도로명 배제
  if (STREETISH_LABEL_RE.test(text) || STREETISH_LABEL_RE.test(placeName)) {
    score -= 160;
  }

  if (landmarkPlan) {
    if (landmarkPlan.rejectLabel?.test(label)) score -= 200;
    if (landmarkPlan.acceptText?.test(text)) score += 160;
    if (landmarkPlan.country) {
      const ctx = Array.isArray(feature?.context) ? feature.context : [];
      const countryCtx = ctx.find((c) => String(c?.id || '').startsWith('country.'));
      const short = String(countryCtx?.short_code || feature?.properties?.short_code || '')
        .toLowerCase()
        .replace(/^us-/, '');
      if (short === landmarkPlan.country) score += 90;
      else if (short) score -= 40;
    }
  }

  return score;
};

const countryFromMapboxFeature = (feature) => {
  const ctx = Array.isArray(feature?.context) ? feature.context : [];
  const countryCtx = ctx.find((c) => String(c?.id || '').startsWith('country.'));
  const short = String(countryCtx?.short_code || feature?.properties?.short_code || '')
    .toLowerCase()
    .replace(/^us-/, '');
  const textEn = countryCtx?.text || '';
  const addressLike = {
    country: textEn,
    country_code: short.length === 2 ? short : '',
  };
  return resolveTravelCountryFromAddresses(addressLike, null);
};

/** Mapbox Geocoding — 지구본 라벨·POI와 같은 인덱스 */
const fetchMapboxForward = async (
  searchQuery,
  { countrycodes = '', landmarkPlan = null } = {},
) => {
  if (!MAPBOX_TOKEN || !searchQuery) return null;
  try {
    const encoded = encodeURIComponent(searchQuery);
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      language: 'ko',
      limit: '6',
      autocomplete: 'false',
    });
    // place·poi·address 등 — 자유 탐색. types를 너무 좁히면 휴게소가 빠짐.
    if (countrycodes) params.set('country', countrycodes);
    // 유명 명소는 POI 우선 (도로·주소 히트 억제)
    if (landmarkPlan) params.set('types', 'poi');

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?${params}`,
    );
    if (!response.ok) return null;
    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    if (!features.length) return null;

    const facilityQ = isFacilityQuery(searchQuery) || Boolean(landmarkPlan);
    const plan = landmarkPlan || resolveLandmarkGeocodePlan(searchQuery);
    const ranked = [...features]
      .map((f) => ({
        feature: f,
        score: scoreMapboxFeature(f, searchQuery, facilityQ, plan),
      }))
      .sort((a, b) => b.score - a.score);

    // 도로명만 남으면 거부 → 다음 쿼리/Nominatim
    const best = ranked.find((row) => {
      if (!row || row.score < 40) return false;
      const text = String(row.feature?.text || '');
      const placeName = String(row.feature?.place_name || '');
      if (STREETISH_LABEL_RE.test(text) || STREETISH_LABEL_RE.test(placeName)) return false;
      if (plan?.rejectLabel?.test(`${text} ${placeName}`)) return false;
      if (plan?.acceptText && !plan.acceptText.test(text) && plan.country) {
        // 국가 고정 쿼리인데 본명도 아니면 스킵 (카피 시설 완화)
        const ctx = Array.isArray(row.feature?.context) ? row.feature.context : [];
        const countryCtx = ctx.find((c) => String(c?.id || '').startsWith('country.'));
        const short = String(countryCtx?.short_code || '')
          .toLowerCase()
          .replace(/^us-/, '');
        if (short && short !== plan.country) return false;
      }
      return true;
    });
    if (!best) return null;

    // 시설 검색인데 POI/주소가 없고 행정구역만이면 거부 → Nominatim·AI로 이어감
    if (facilityQ && best.score < 40) return null;

    const feature = best.feature;
    const label = `${feature.text || ''} ${feature.place_name || ''}`;
    if (facilityQ && /시청|구청|도청|군청|town\s*hall|city\s*hall/i.test(label)) {
      return null;
    }

    const [lng, lat] = feature.center || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const travelCountry = countryFromMapboxFeature(feature);
    const countryEn = travelCountry.country_en || travelCountry.country || '';
    const countryKo =
      KEYWORD_SYNONYMS[String(countryEn).toLowerCase()] ||
      KEYWORD_SYNONYMS[String(travelCountry.country || '').toLowerCase()] ||
      travelCountry.country ||
      countryEn;
    const placeName = feature.text || feature.place_name || searchQuery;
    const placeNameEn =
      feature.properties?.name_preferred ||
      feature.text ||
      placeName;
    const stayAdmin = buildStayAdminFromMapboxFeature(feature);

    return {
      lat,
      lng,
      name: placeName,
      name_en: placeNameEn,
      country: countryKo,
      country_en: countryEn || countryKo,
      display_name: feature.place_name || placeName,
      source: 'mapbox',
      place_types: feature.place_type || [],
      ...(stayAdmin ? { stayAdmin } : {}),
    };
  } catch (error) {
    console.warn('Mapbox forward geocoding failed:', error);
    return null;
  }
};

// 2. 좌표 찾기 (Forward) — Mapbox(지구본 POI) 우선, Nominatim 폴백
export const getCoordinatesFromAddress = async (query) => {
  const facilityQ = isFacilityQuery(query);

  // 🚨 [New] 재시도 로직이 포함된 Fetcher
  const fetchCoords = async (searchQuery, attempt = 1, { acceptLanguage = 'en', countrycodes = '' } = {}) => {
    try {
      const params = new URLSearchParams({
        format: 'json',
        q: searchQuery,
        limit: '5',
        addressdetails: '1',
      });
      if (countrycodes) params.set('countrycodes', countrycodes);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'User-Agent': 'ProjectDays/1.0 (contact: project.days.dev@gmail.com)',
            'Accept-Language': acceptLanguage,
          },
        }
      );

      if (!response.ok) {
        // 429(Too Many Requests)나 5xx 에러 시 재시도
        if (attempt < 3) {
          console.warn(`⚠️ Network error (${response.status}). Retrying... (${attempt}/3)`);
          await delay(1000 * attempt); // 점진적 딜레이
          return fetchCoords(searchQuery, attempt + 1, { acceptLanguage, countrycodes });
        }
        return null;
      }

      const data = await response.json();
      if (!data?.length) return null;
      const plausible = data.filter(
        (row) => isPlausibleForwardHit(searchQuery, row) && !isAdminOnlyHitForFacility(searchQuery, row)
      );
      return plausible.length > 0 ? plausible : null;

    } catch {
      // 네트워크 끊김(ERR_INTERNET_DISCONNECTED) 등 잡기
      console.warn(`⚠️ Connection failed. Retrying... (${attempt}/3)`);
      if (attempt < 3) {
        await delay(1000 * attempt);
        return fetchCoords(searchQuery, attempt + 1, { acceptLanguage, countrycodes });
      }
      return null;
    }
  };

  try {
    const cleanQuery = standardizeName(query);
    const landmarkQ = LANDMARK_QUERY_RE.test(cleanQuery);

    const tryMapboxBundle = async (q) => {
      if (!MAPBOX_TOKEN) return null;
      let mapboxHit = null;
      // 해외 명소 한글명(에펠탑 등)은 KR 우선이 오탐·무응답을 낳음 → 글로벌만
      if (HAS_HANGUL_RE.test(q) && !LANDMARK_QUERY_RE.test(q)) {
        mapboxHit = await fetchMapboxForward(q, { countrycodes: 'kr' });
      }
      if (!mapboxHit) {
        mapboxHit = await fetchMapboxForward(q);
      }
      return mapboxHit;
    };

    const tryNominatimBundle = async (q) => {
      let rows = null;
      if (HAS_HANGUL_RE.test(q) && !LANDMARK_QUERY_RE.test(q)) {
        rows = await fetchCoords(q, 1, { acceptLanguage: 'ko,en', countrycodes: 'kr' });
        if (!rows) {
          rows = await fetchCoords(q, 1, { acceptLanguage: 'en', countrycodes: 'kr' });
        }
      }
      if (!rows) {
        rows = await fetchCoords(q, 1, { acceptLanguage: 'en' });
      }
      return rows;
    };

    // 0) Mapbox — 지구본에서 보이는 POI·세부 지명과 동일 소스
    // 명소: 본명+국가 고정 쿼리 우선 (Eiffel Tower Street 필리핀 오탐 방지)
    const landmarkPlan = landmarkQ ? resolveLandmarkGeocodePlan(cleanQuery) : null;
    if (landmarkPlan) {
      for (const preferred of landmarkPlan.queries) {
        const pinned = await fetchMapboxForward(preferred, {
          countrycodes: landmarkPlan.country || '',
          landmarkPlan,
        });
        if (pinned) return pinned;
      }
      // country 필터로 못 찾으면 동일 쿼리 글로벌(도로명 페널티 유지)
      for (const preferred of landmarkPlan.queries) {
        const globalHit = await fetchMapboxForward(preferred, { landmarkPlan });
        if (globalHit) return globalHit;
      }
    }

    const primaryMapbox = await tryMapboxBundle(cleanQuery);
    if (primaryMapbox) return primaryMapbox;

    // 한글 지명: KR 우선 (횡성 저수지 → 폴란드 Holy Cross 오탐 방지). 실패 시 AI 폴백.
    let data = await tryNominatimBundle(cleanQuery);

    // 1.5) 숙박·명소 별칭 (제주 신라호텔→호텔신라 제주, 에펠탑→Eiffel Tower)
    if (!data) {
      for (const alt of expandForwardQueryAliases(cleanQuery)) {
        const altMapbox = await tryMapboxBundle(alt);
        if (altMapbox) return altMapbox;
        data = await tryNominatimBundle(alt);
        if (data) {
          console.log(`🔄 Alias geocode: "${cleanQuery}" → "${alt}"`);
          break;
        }
      }
    }

    // 2차 패스: 수식어 제거 — 시설 쿼리(휴게소 등)는 행정구역으로 축소되지 않게 스킵
    if (!data && !facilityQ) {
      let retryQuery = cleanQuery;
      RETRY_FILTERS.forEach(filter => {
        if (retryQuery.endsWith(filter)) retryQuery = retryQuery.slice(0, -filter.length).trim();
      });
      if (retryQuery !== cleanQuery && retryQuery.length >= 2) {
        console.log(`🔄 Pass 2: Retrying with "${retryQuery}"`);
        data = await tryNominatimBundle(retryQuery);
      }
    }

    // 3차 패스: 사전 역추적
    if (!data) {
      const englishKey = findEnglishKey(cleanQuery);
      if (englishKey) {
        console.log(`🔄 Pass 3: Reverse Mapping found! Retrying with "${englishKey}"`);
        data = await fetchCoords(englishKey);
      }
    }

    if (!data) return null;

    // 🚨 [New] 반환된 결과 중 여행지에 적합한 것을 우선순위로 정렬 (예: '구'보다 '섬'을 우선)
    const sortedData = [...data].sort(
      (a, b) => calculatePlaceScore(b, cleanQuery) - calculatePlaceScore(a, cleanQuery)
    );
    const topResult = sortedData[0];
    const address = topResult.address || {};

    // 지명 우선: OSM name → settlement → query
    // name_en에 address.city를 쓰면 성산일출봉 → 서귀포시 → SSOT 서귀포로 풀머지됨 → 금지
    const placeName =
      topResult.name ||
      address.city ||
      address.town ||
      address.village ||
      address.island ||
      address.state ||
      address.country ||
      cleanQuery;
    const namedFeature =
      Boolean(topResult.name) &&
      (/^(natural|tourism|leisure|historic|amenity|waterway|building)$/i.test(String(topResult.class || '')) ||
        /^(peak|volcano|attraction|viewpoint|beach|hot_spring|reservoir|waterfall|hotel|resort|guest_house)$/i.test(
          String(topResult.type || '')
        ));
    const englishName = namedFeature
      ? placeName
      : address.city ||
        address.town ||
        address.village ||
        address.island ||
        address.state ||
        address.country ||
        placeName;
    const travelCountry = resolveTravelCountryFromAddresses(address, null);
    // Nominatim Accept-Language:en → country가 "Argentina" 등 영문만 올 수 있음 → 한글 표기 정규화
    const countryEn = travelCountry.country_en || travelCountry.country || '';
    const countryKo =
      KEYWORD_SYNONYMS[String(countryEn).toLowerCase()] ||
      KEYWORD_SYNONYMS[String(travelCountry.country || '').toLowerCase()] ||
      travelCountry.country ||
      countryEn;

    const stayAdmin = buildStayAdminFromOsmAddress(address, address);

    return {
      lat: parseFloat(topResult.lat),
      lng: parseFloat(topResult.lon),
      name: placeName,
      name_en: englishName || placeName,
      country: countryKo,
      country_en: countryEn || countryKo,
      display_name: topResult.display_name,
      source: 'nominatim',
      ...(stayAdmin ? { stayAdmin } : {}),
    };
  } catch (error) {
    console.error("Forward Geocoding error:", error);
    return null;
  }
};

/** Prefer named features (POI / industrial / natural) over settlement-only reverse results. */
const FEATURE_NAME_ADDRESS_KEYS = [
  'attraction',
  'tourism',
  'industrial',
  'factory',
  'natural',
  'peak',
  'water',
  'bay',
  'beach',
  'cliff',
  'hamlet',
  'isolated_dwelling',
  'neighbourhood',
  'suburb',
  'amenity',
  'building',
  'shop',
  'historic',
  'man_made',
];

const pickFeaturePlaceName = (data, address) => {
  const named = typeof data?.name === 'string' ? data.name.trim() : '';
  if (named) return named;
  if (!address) return '';
  for (const key of FEATURE_NAME_ADDRESS_KEYS) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const pickOsmAddr = (address, keys) => {
  if (!address) return '';
  for (const key of keys) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

/**
 * MRT 숙소 쿼리 사다리용 행정 계층 (표시 지명과 분리).
 * 한글 address 우선, 영문은 cityEn 등.
 */
export const buildStayAdminFromOsmAddress = (addressKo, addressEn = null) => {
  const ko = addressKo || addressEn;
  const en = addressEn || addressKo;
  if (!ko && !en) return null;

  const neighbourhood =
    pickOsmAddr(ko, ['neighbourhood', 'suburb', 'quarter', 'residential']) ||
    pickOsmAddr(en, ['neighbourhood', 'suburb', 'quarter', 'residential']);
  const district =
    pickOsmAddr(ko, ['borough', 'city_district', 'district']) ||
    pickOsmAddr(en, ['borough', 'city_district', 'district']);
  const city =
    pickOsmAddr(ko, ['city', 'town', 'village', 'municipality']) ||
    pickOsmAddr(en, ['city', 'town', 'village', 'municipality']);
  const cityEn = pickOsmAddr(en, ['city', 'town', 'village', 'municipality']);
  const county =
    pickOsmAddr(ko, ['county']) || pickOsmAddr(en, ['county']);
  const state =
    pickOsmAddr(ko, ['state', 'province', 'region']) ||
    pickOsmAddr(en, ['state', 'province', 'region']);

  if (!neighbourhood && !district && !city && !county && !state) return null;

  return {
    neighbourhood: neighbourhood || '',
    district: district || '',
    city: city || '',
    cityEn: cityEn || '',
    county: county || '',
    state: state || '',
  };
};

/** Mapbox forward context → stayAdmin */
export const buildStayAdminFromMapboxFeature = (feature) => {
  if (!feature) return null;
  const ctx = Array.isArray(feature.context) ? feature.context : [];
  const pick = (prefix) => {
    const hit = ctx.find((c) => String(c?.id || '').startsWith(prefix));
    return typeof hit?.text === 'string' ? hit.text.trim() : '';
  };
  const types = Array.isArray(feature.place_type) ? feature.place_type : [];
  const selfText = typeof feature.text === 'string' ? feature.text.trim() : '';

  const neighbourhood =
    pick('neighborhood.') ||
    (types.includes('neighborhood') ? selfText : '');
  const locality = pick('locality.') || (types.includes('locality') ? selfText : '');
  const city =
    pick('place.') ||
    locality ||
    (types.includes('place') ? selfText : '');
  const district = pick('district.');
  const state = pick('region.');

  if (!neighbourhood && !district && !city && !state) return null;

  return {
    neighbourhood: neighbourhood || '',
    district: district || '',
    city: city || '',
    cityEn: '',
    county: '',
    state: state || '',
  };
};

// 3. 주소 찾기 (Reverse) — zoom=14로 POI·산업·자연 지명까지 확보
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const reverseBaseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const headers = {
      'User-Agent': 'ProjectDays/1.0 (contact: project.days.dev@gmail.com)'
    };

    const [responseEn, responseKo] = await Promise.all([
      fetch(`${reverseBaseUrl}&accept-language=en`, { headers }),
      fetch(`${reverseBaseUrl}&accept-language=ko`, { headers })
    ]);

    if (!responseEn.ok && !responseKo.ok) throw new Error("Geocoding failed");

    const dataEn = responseEn.ok ? await responseEn.json() : null;
    const dataKo = responseKo.ok ? await responseKo.json() : null;

    const addressEn = dataEn?.address || null;
    const addressKo = dataKo?.address || null;

    // 비관적 방어: 데이터가 없거나 바다 클릭 시
    if (!addressEn && !addressKo) return null;

    const featureEn = pickFeaturePlaceName(dataEn, addressEn);
    const featureKo = pickFeaturePlaceName(dataKo, addressKo);
    const cityRawEn = addressEn?.city || addressEn?.town || addressEn?.village || addressEn?.municipality || addressEn?.island || addressEn?.state || "";
    const cityRawKo = addressKo?.city || addressKo?.town || addressKo?.village || addressKo?.municipality || addressKo?.island || addressKo?.state || "";
    const travelCountry = resolveTravelCountryFromAddresses(addressEn, addressKo);

    const placeNameEn = featureEn || cityRawEn;
    const placeNameKo = featureKo || cityRawKo;
    const resolvedCityEn = standardizeName(placeNameEn) || standardizeName(travelCountry.country_en);
    const resolvedCityKo = standardizeName(placeNameKo) || travelCountry.country;
    const stayAdmin = buildStayAdminFromOsmAddress(addressKo, addressEn);

    return {
      fullAddress: dataEn?.display_name || dataKo?.display_name || '',
      city: resolvedCityEn || resolvedCityKo,
      country: travelCountry.country,
      country_en: travelCountry.country_en,
      name_en: placeNameEn || travelCountry.country_en || placeNameKo,
      name_ko: resolvedCityKo,
      feature_type: dataEn?.type || dataEn?.class || dataKo?.type || '',
      ...(stayAdmin ? { stayAdmin } : {}),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};
