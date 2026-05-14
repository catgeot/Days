// src/utils/affiliate.js

import { supabase } from '../shared/api/supabase';
import { resolveRentalAirport, resolveRentalPickupBannerInfo } from './rentalAirportMatch.js';

// Klook direct affiliate parameters (managed in one place)
export const KLOOK_AID = '118544';
export const KLOOK_DEFAULT_AD_ID = '1256120';
/** 렌터카 랜딩 홈(`/ko/car-rentals/`) 전용 aff_adid. 투어·렌터카 검색어 등 일반 검색은 {@link KLOOK_DEFAULT_AD_ID}. */
export const KLOOK_RENTAL_HOME_AD_ID = '1277252';
// true면 /ko/car-rentals 경로, false면 /car-rentals 경로 사용
export const USE_KLOOK_LOCALE_PATH = true;
export const KLOOK_HK_RENTAL_AD_ID = '1265776';
export const KLOOK_MACAU_RENTAL_AD_ID = '1265778';
export const KLOOK_TAIPEI_RENTAL_AD_ID = '1265784';
export const KLOOK_IRAN_RENTAL_AD_ID = '1265785';
export const KLOOK_TOKYO_RENTAL_AD_ID = '1256101';
export const KLOOK_OSAKA_RENTAL_AD_ID = '1265791';
export const KLOOK_KYOTO_RENTAL_AD_ID = '1265792';
export const KLOOK_HOKKAIDO_RENTAL_AD_ID = '1265795';
export const KLOOK_KYUSHU_RENTAL_AD_ID = '1265796';

/**
 * Travelpayouts 제휴 링크 생성기 (Short Link 방식)
 * 대시보드에서 직접 생성한 단축 링크(`tp.st`)를 기반으로,
 * 클릭 발생 위치 등을 추적하기 위한 파라미터(`sub1`, `sub2`)만 덧붙여 반환합니다.
 *
 * @param {string} originalUrl - 원래 이동하고자 하는 URL (미승인 제휴사 대비 폴백 용도)
 * @param {string} provider - 제휴사 식별자 (예: 'agoda', 'airalo')
 * @param {object} options - 추가 추적 파라미터 { campaign, locationName }
 * @returns {string} - 제휴 코드가 포함된 최종 단축 URL 또는 원본 URL
 */
export const getAffiliateLink = (originalUrl, provider, options = {}) => {
  // Travelpayouts 대시보드에서 각 제휴 프로그램의 [Link Generator]를 통해 발급받은 'Short Link'
  // 현재 승인된 제휴사만 단축 링크를 입력합니다. (미승인된 곳은 빈 문자열로 두면 원본 URL로 연결됨)
  const shortLinks = {
    agoda: '',
    booking: '',
    tripcom: '',
    '12go': '',
    getyourguide: '',
    tiqets: 'https://tiqets.tp.st/U8nE2ydu',
    skyscanner: '',
    airalo: 'https://airalo.tp.st/kx3SEbJQ',
    holafly: 'https://holafly.sjv.io/KBq1zv'
  };

  const shortUrl = shortLinks[provider];

  // 등록된 제휴사의 단축 링크가 있다면 파라미터를 붙여 반환
  if (shortUrl) {
    let tpUrl = shortUrl;
    let hasQuery = shortUrl.includes('?');

    // 파라미터 추가 헬퍼 함수
    const addParam = (key, value) => {
      tpUrl += (hasQuery ? '&' : '?') + `${key}=${encodeURIComponent(value)}`;
      hasQuery = true;
    };

    // sub1: 어떤 도시/장소 카드에서 클릭이 일어났는지 추적
    if (options.locationName) {
      addParam('sub1', options.locationName);
    }

    // sub2: 어디서 클릭했는지 출처 (예: toolkit)
    if (options.campaign) {
      addParam('sub2', options.campaign);
    }

    return tpUrl;
  }

  // 승인되지 않은 제휴사이거나 링크가 없으면 원본 URL을 그대로 반환 (사용자 불편 방지)
  return originalUrl;
};

/**
 * Klook 직접 제휴 딥링크 생성기
 *
 * @param {string} targetUrl - 클룩 내 최종 이동 URL
 * @param {string} adId - 클룩 광고 ID (기본값: KLOOK_DEFAULT_AD_ID)
 * @returns {string}
 */
export const getKlookAffiliateUrl = (targetUrl, adId = KLOOK_DEFAULT_AD_ID) => {
  if (!targetUrl) return '';
  return `https://affiliate.klook.com/redirect?aid=${KLOOK_AID}&aff_adid=${adId}&k_site=${encodeURIComponent(targetUrl)}`;
};

function normalizeRentalLocationInput(locationOrName) {
  if (locationOrName == null) return { name: '' };
  if (typeof locationOrName === 'string') return { name: locationOrName };
  if (typeof locationOrName === 'object') return locationOrName;
  return { name: String(locationOrName) };
}

/**
 * 도시별 클룩 렌터카 딥링크 생성기
 * - 홍콩/마카오 등은 기존처럼 city_id 딥링크
 * - 공항 허브 매칭 시 공식 공항 한글명으로 검색어를 구성해 Klook 결과와의 정합성을 높임
 * - 미매칭 시 "여행지명 + 렌터카" 검색 폴백
 *
 * @param {string | { name?: string, name_en?: string, slug?: string, lat?: number, lng?: number, rental_airport_official_ko?: string, rental_airport_iata?: string }} locationOrName
 * @returns {string}
 */
export const getKlookRentalUrlByLocation = (locationOrName) => {
  const loc = normalizeRentalLocationInput(locationOrName);
  const pickupBanner = resolveRentalPickupBannerInfo(loc);
  const resolved =
    pickupBanner?.kind === 'multi'
      ? pickupBanner.linkHub
      : pickupBanner?.kind === 'single'
        ? { officialKo: pickupBanner.officialKo, iata: pickupBanner.iata }
        : resolveRentalAirport(loc);
  const airportKo = resolved?.officialKo || '';

  const normalized = [loc.rental_airport_official_ko, airportKo, loc.name, loc.name_en]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const rentalPath = USE_KLOOK_LOCALE_PATH ? 'ko/car-rentals' : 'car-rentals';

  const cityRentalConfigs = [
    {
      keywords: ['홍콩', 'hong kong'],
      cityId: '2',
      adId: KLOOK_HK_RENTAL_AD_ID
    },
    {
      keywords: ['마카오', 'macau'],
      cityId: '3',
      adId: KLOOK_MACAU_RENTAL_AD_ID
    },
    {
      keywords: ['타이베이', 'taipei'],
      cityId: '19',
      adId: KLOOK_TAIPEI_RENTAL_AD_ID
    },
    {
      keywords: ['이란', 'yilan'],
      cityId: '42',
      adId: KLOOK_IRAN_RENTAL_AD_ID
    },
    {
      keywords: ['도쿄', 'tokyo'],
      cityId: '28',
      adId: KLOOK_TOKYO_RENTAL_AD_ID
    },
    {
      keywords: ['오사카', 'osaka'],
      cityId: '29',
      adId: KLOOK_OSAKA_RENTAL_AD_ID
    },
    {
      keywords: ['교토', 'kyoto'],
      cityId: '30',
      adId: KLOOK_KYOTO_RENTAL_AD_ID
    },
    {
      keywords: ['홋카이도', '훗카이도', '북해도', 'hokkaido'],
      cityId: '32',
      adId: KLOOK_HOKKAIDO_RENTAL_AD_ID
    },
    {
      keywords: ['규슈', '후쿠오카', '구마모토', 'kyushu', 'fukuoka', 'kumamoto'],
      cityId: '10000006',
      adId: KLOOK_KYUSHU_RENTAL_AD_ID
    }
  ];

  const matched = cityRentalConfigs.find((config) =>
    config.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (matched) {
    return getKlookAffiliateUrl(
      `https://www.klook.com/${rentalPath}/?city_id=${matched.cityId}`,
      matched.adId
    );
  }

  const searchLabel = (airportKo || loc.name || '').trim();
  const query = encodeURIComponent(`${searchLabel} 렌터카`.trim());
  return getKlookAffiliateUrl(`https://www.klook.com/ko/search/result/?query=${query}`, KLOOK_DEFAULT_AD_ID);
};

/**
 * 클룩 렌터카 섹션 홈(검색어 없음). 위젯·자동 검색어가 목적지와 맞지 않을 때 직접 검색용.
 *
 * @returns {string}
 */
export const getKlookRentalHomeUrl = () => {
  const rentalPath = USE_KLOOK_LOCALE_PATH ? 'ko/car-rentals' : 'car-rentals';
  return getKlookAffiliateUrl(`https://www.klook.com/${rentalPath}/`, KLOOK_RENTAL_HOME_AD_ID);
};

/**
 * 마이리얼트립 검색 결과 페이지에 대한 동적 제휴 링크(Short URL)를 발급받습니다.
 * Edge Function(mrt-link-generator)을 경유하여 발급하며, 실패 시 원본 검색 URL을 그대로 반환합니다.
 *
 * @param {string} query - 검색어 (예: '로마 한인민박', '파리 교통패스')
 * @returns {Promise<string>} - 마이리얼트립 제휴 단축 URL 또는 원본 URL
 */
export const generateMrtLink = async (query) => {
  if (!query) return 'https://www.myrealtrip.com';

  const encodedQuery = encodeURIComponent(query);
  const originalUrl = `https://www.myrealtrip.com/search?q=${encodedQuery}`;

  try {
    const { data, error } = await supabase.functions.invoke('mrt-link-generator', {
      body: { originalUrl }
    });

    if (error) {
      console.warn('[MRT Link] Edge Function 오류로 원본 URL을 반환합니다.', error);
      return originalUrl;
    }

    return data?.shortLink || originalUrl;
  } catch (err) {
    console.error('[MRT Link] 네트워크/서버 오류로 원본 URL을 반환합니다.', err);
    return originalUrl;
  }
};

/**
 * 플래너 호텔 버튼 기본값은 마이리얼트립 동적 검색(`generateMrtLink`).
 * 마이리얼트립에서 호텔 검색이 빈약한 여행지만 여기에 제휴에서 받은 트립닷컴 호텔 목록 URL 전체를 등록한다.
 *
 * 키: `travelSpots`의 `slug`(소문자) 또는 한글 `name`과 정확히 일치.
 *
 * @example
 * PLANNER_TRIPCOM_HOTEL_OVERRIDES.fukuoka = 'https://kr.trip.com/hotels/list?city=248&…';
 */
export const PLANNER_TRIPCOM_HOTEL_OVERRIDES = {
  // fukuoka: 'https://kr.trip.com/hotels/list?...',
  // '가나자와': 'https://kr.trip.com/hotels/list?...',
};

/**
 * 등록된 여행지만 트립닷컴 호텔 목록으로 연결. 없으면 null → 마이리얼트립 사용.
 *
 * @param {{ slug?: string, name?: string } | null | undefined} location
 * @returns {string | null}
 */
export function getTripcomHotelOverrideUrlForLocation(location) {
  if (!location) return null;

  const slug = (location.slug || '').toLowerCase();
  if (slug && Object.prototype.hasOwnProperty.call(PLANNER_TRIPCOM_HOTEL_OVERRIDES, slug)) {
    const u = PLANNER_TRIPCOM_HOTEL_OVERRIDES[slug];
    return typeof u === 'string' && u.startsWith('http') ? u : null;
  }

  const name = (location.name || '').trim();
  if (name && Object.prototype.hasOwnProperty.call(PLANNER_TRIPCOM_HOTEL_OVERRIDES, name)) {
    const u = PLANNER_TRIPCOM_HOTEL_OVERRIDES[name];
    return typeof u === 'string' && u.startsWith('http') ? u : null;
  }

  return null;
}

