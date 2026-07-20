// src/pages/Home/lib/geocoding.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Fix] 영문 강제 변환(For Unsplash) 및 재시도(Retry) 로직 유지.
// 2. 🚨 [Fix/New] 역지오코딩(Reverse Geocoding) 로케일 강제: accept-language를 'en,ko'로 변경하여 영문명을 최우선으로 확보.
// 3. 🚨 [Fix/New] name_en 강제 추출: 라우팅에 사용할 수 있도록 응답 데이터에서 영문명을 명시적으로 파싱하여 반환 객체에 추가.

import { KEYWORD_SYNONYMS } from '../data/keywordData';
import { resolveTravelCountryFromAddresses } from './travelRegionCountry.js';

const RETRY_FILTERS = [
  "고원", "섬", "산", "해변", "폭포", "마을", "대륙", "반도", "시", "군", "구",
  "저수지", "댐", "호수",
];
const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;

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
  if (cls === 'highway' || cls === 'office' || cls === 'railway') return false;

  if (HAS_HANGUL_RE.test(query)) {
    const cc = String(result.address?.country_code || '').toLowerCase();
    const display = String(result.display_name || '');
    if (cc && cc !== 'kr') return false;
    if (!cc && !HAS_HANGUL_RE.test(display)) return false;
  }
  return true;
};

// 🚨 [New] 여행지 목적에 맞는 우선순위 스코어링 함수
const calculatePlaceScore = (place) => {
  let score = 0;
  if (!place) return 0;
  const type = place.type || "";
  const category = place.category || "";
  const address = place.address || {};
  const cls = place.class || "";

  // 여행지로 선호되는 키워드에 높은 점수 부여
  if (address.island) score += 50;
  if (address.city || address.town || address.village) score += 30;
  if (category === "tourism" || cls === "tourism") score += 40;
  if (cls === "natural" || cls === "water" || type === "reservoir" || type === "water") score += 45;

  // 단순 행정구역(특히 대도시의 구/동)이나 역 등은 점수를 낮춤
  if (address.suburb || address.borough || address.quarter || address.city_district) score -= 30;
  if (type === "station" || category === "railway") score -= 40;
  if (type === "administrative" && address.borough) score -= 20;

  return score;
};

// 2. 좌표 찾기 (Forward)
export const getCoordinatesFromAddress = async (query) => {
  const hasHangul = HAS_HANGUL_RE.test(query || '');

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
      const plausible = data.filter((row) => isPlausibleForwardHit(searchQuery, row));
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

    // 한글 지명: KR 우선 (횡성 저수지 → 폴란드 Holy Cross 오탐 방지). 실패 시 AI 폴백.
    let data = null;
    if (hasHangul) {
      data = await fetchCoords(cleanQuery, 1, { acceptLanguage: 'ko,en', countrycodes: 'kr' });
      if (!data) {
        data = await fetchCoords(cleanQuery, 1, { acceptLanguage: 'en', countrycodes: 'kr' });
      }
    }
    if (!data) {
      data = await fetchCoords(cleanQuery, 1, { acceptLanguage: 'en' });
    }

    // 2차 패스: 수식어 제거
    if (!data) {
      let retryQuery = cleanQuery;
      RETRY_FILTERS.forEach(filter => {
        if (retryQuery.endsWith(filter)) retryQuery = retryQuery.slice(0, -filter.length).trim();
      });
      if (retryQuery !== cleanQuery && retryQuery.length >= 2) {
        console.log(`🔄 Pass 2: Retrying with "${retryQuery}"`);
        if (hasHangul) {
          data = await fetchCoords(retryQuery, 1, { acceptLanguage: 'ko,en', countrycodes: 'kr' });
        }
        if (!data) {
          data = await fetchCoords(retryQuery, 1, { acceptLanguage: 'en' });
        }
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
    const sortedData = [...data].sort((a, b) => calculatePlaceScore(b) - calculatePlaceScore(a));
    const topResult = sortedData[0];
    const address = topResult.address || {};

    // 지명 우선: OSM name → settlement → query (Unsplash용 영문 확보 위해 en 패스 병행 가능)
    const placeName = topResult.name || address.city || address.town || address.village || address.island || address.state || address.country || cleanQuery;
    const englishName = address.city || address.town || address.village || address.island || address.state || address.country || placeName;
    const travelCountry = resolveTravelCountryFromAddresses(address, null);
    // Nominatim Accept-Language:en → country가 "Argentina" 등 영문만 올 수 있음 → 한글 표기 정규화
    const countryEn = travelCountry.country_en || travelCountry.country || '';
    const countryKo =
      KEYWORD_SYNONYMS[String(countryEn).toLowerCase()] ||
      KEYWORD_SYNONYMS[String(travelCountry.country || '').toLowerCase()] ||
      travelCountry.country ||
      countryEn;

    return {
      lat: parseFloat(topResult.lat),
      lng: parseFloat(topResult.lon),
      name: placeName,
      name_en: englishName || placeName,
      country: countryKo,
      country_en: countryEn || countryKo,
      display_name: topResult.display_name
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

    return {
      fullAddress: dataEn?.display_name || dataKo?.display_name || '',
      city: resolvedCityEn || resolvedCityKo,
      country: travelCountry.country,
      country_en: travelCountry.country_en,
      name_en: placeNameEn || travelCountry.country_en || placeNameKo,
      name_ko: resolvedCityKo,
      feature_type: dataEn?.type || dataEn?.class || dataKo?.type || '',
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};
