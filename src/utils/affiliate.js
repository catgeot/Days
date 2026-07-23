// src/utils/affiliate.js

import {
  MRT_HOME_MYLINK_ID,
  MRT_PACKAGE_SHORT_URLS,
} from '../pages/Home/data/mrtPackageThemeLinks.js';
import { buildMrtStayListUrl } from './fetchMrtStays.js';
import {
  resolveKlookRentalBannerSearchLabel,
  resolvePlannerFlightArrivalIata,
  resolveRentalPickupBannerInfo,
} from './rentalAirportMatch.js';

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
/** Klook 페리 통합 페이지 전용 aff_adid */
export const KLOOK_FERRY_AD_ID = '1281898';
export const KLOOK_FERRY_TARGET =
  'https://www.klook.com/ko/transport/?target_slug=/ko/transport/ttd/ferries/';
/** Klook 공항 픽업·셔틀 홈 — PreTravelChecklist·airport_transfer 카드 SSOT */
export const KLOOK_AIRPORT_TRANSFER_TARGET =
  'https://www.klook.com/ko/airport-transfers/';

/** 12Go 직접 제휴 파트너 ID */
export const TWELVE_GO_PARTNER_ID = '15927471';

/**
 * 12Go 제휴 딥링크 — `z`·`sub_id` 파라미터 부착.
 *
 * @param {string} targetUrl
 * @param {{ subId?: string }} [options]
 * @returns {string}
 */
export function get12GoAffiliateUrl(targetUrl, options = {}) {
  if (!targetUrl) return '';
  try {
    const url = new URL(targetUrl);
    url.pathname = url.pathname.replace(/^\/en(\/|$)/, '/ko$1');
    url.searchParams.set('z', TWELVE_GO_PARTNER_ID);
    if (options.subId) {
      url.searchParams.set('sub_id', options.subId);
    }
    return url.toString();
  } catch {
    return targetUrl;
  }
}

/** 12Go 한국어 홈 (노선 SSOT 없을 때 폴백) */
export function get12GoHomeUrl(options = {}) {
  return get12GoAffiliateUrl('https://12go.asia/ko/', options);
}

/** Bounce 짐 보관 — 플래너 배너·스마트 링크 홈 SSOT */
export const BOUNCE_AFFILIATE_HOME_URL =
  'https://go.bounce.com/GATEO951904439302671';

/** BikesBooking 오토바이/스쿠터 — 플래너·스마트 링크 홈 SSOT */
export const BIKESBOOKING_AFFILIATE_HOME_URL =
  'https://bikesbooking.tp.st/HymHjnL8';

/** 마이리얼트립 사이트 홈 (검색 없이 진입할 때) */
export const MRT_HOME_URL = 'https://www.myrealtrip.com';

/** Klook 한국어 사이트 홈 (스마트 링크·일반 랜딩) */
export const KLOOK_SITE_HOME_TARGET = 'https://www.klook.com/ko/';

/** GetYourGuide 제휴 파트너 ID — 위젯·스마트 링크 홈 공통 */
export const GYG_PARTNER_ID = 'LRKVVU4';
export const GYG_LOCALE = 'ko-KR';
/** 스마트 링크·홈 진입 기본 cmp (광고 파라미터 제외한 클린 추적) */
export const GYG_DEFAULT_CMP = 'gateo_planer';

/**
 * GetYourGuide 제휴 홈 (단축 URL 불필요 — partner_id 직접).
 * @param {{ cmp?: string }} [options]
 * @returns {string}
 */
export function getGygHomeUrl(options = {}) {
  const params = new URLSearchParams({
    partner_id: GYG_PARTNER_ID,
    utm_medium: 'online_publisher',
    cmp: options.cmp || GYG_DEFAULT_CMP,
  });
  return `https://www.getyourguide.com/?${params.toString()}`;
}

const DIRECT_FERRIES_AFFILIATE_BASE =
  'https://www.directferries.co.kr/?dfpid=7263&affid=1001';

/**
 * Direct Ferries 제휴 URL — 노선 페이지는 rurl로 래핑, 홈은 기본 제휴 링크.
 *
 * @param {string} [targetUrl] - 예: https://www.directferries.co.kr/dubrovnik_split_ferry.htm
 * @returns {string}
 */
export function getDirectFerriesAffiliateUrl(targetUrl) {
  if (!targetUrl?.trim()) {
    return `${DIRECT_FERRIES_AFFILIATE_BASE}`;
  }
  try {
    const url = new URL(targetUrl);
    if (url.searchParams.has('dfpid')) return targetUrl;
    if (url.hostname.includes('directferries.co.kr') && url.pathname && url.pathname !== '/') {
      return `${DIRECT_FERRIES_AFFILIATE_BASE}&rurl=${encodeURIComponent(targetUrl)}`;
    }
    return targetUrl;
  } catch {
    return `${DIRECT_FERRIES_AFFILIATE_BASE}&rurl=${encodeURIComponent(targetUrl)}`;
  }
}

/** 12Go 제휴 검색 폼 위젯 (Form code) */
export const TWELVE_GO_FORM = {
  partnerId: TWELVE_GO_PARTNER_ID,
  scriptSrc: `https://cdn0.trainbusferry.com/tools/form/ko/?id=${TWELVE_GO_PARTNER_ID}&domain=12go.asia`,
  domain: '12go.asia',
  language: 'ko',
  currency: 'KRW',
};

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
 * Airalo eSIM 제휴 홈.
 * 목적지 검색바 딥링크 불가 → 홈(단축 링크)만 사용.
 * @param {{ locationName?: string, campaign?: string }} [options]
 * @returns {string}
 */
export function getAiraloHomeUrl(options = {}) {
  return getAffiliateLink('https://www.airalo.com/ko/', 'airalo', options);
}

/**
 * Holafly eSIM 제휴 홈.
 * 목적지 검색바 딥링크 불가 → 홈(단축 링크)만 사용.
 * @param {{ locationName?: string, campaign?: string }} [options]
 * @returns {string}
 */
export function getHolaflyHomeUrl(options = {}) {
  return getAffiliateLink('https://esim.holafly.com/ko/', 'holafly', options);
}

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

/** Klook 페리 통합 페이지 제휴 URL */
export const getKlookFerryUrl = () =>
  getKlookAffiliateUrl(KLOOK_FERRY_TARGET, KLOOK_FERRY_AD_ID);

/**
 * Trip.com 크루즈 제휴 URL (페리 아님 — 여정 플래너 크루즈 키워드용)
 * @param {{ campaign?: string, locationName?: string }} [options]
 */
export const getTripcomCruiseUrl = (options = {}) => {
  const params = new URLSearchParams({
    locale: 'ko-KR',
    curr: 'KRW',
    Allianceid: '8182427',
    SID: '309563143',
    trip_sub3: 'D17217482',
  });
  if (options.campaign) params.set('trip_sub1', options.campaign);
  else params.set('trip_sub1', '플래너 크루즈');
  if (options.locationName) params.set('trip_sub2', options.locationName);
  return `https://kr.trip.com/cruises?${params.toString()}`;
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
 * - 배너·검색 URL 검색어는 여행지명 우선 (`resolveKlookRentalBannerSearchLabel`)
 * - 미매칭 시 "여행지명 + 렌터카" 검색. 예외는 `travelSpotAirports`의 `klookRentalSearchLabel` / `klookRentalSearchMode`
 *
 * @param {string | { name?: string, name_en?: string, slug?: string, lat?: number, lng?: number, rental_airport_official_ko?: string, rental_airport_iata?: string }} locationOrName
 * @param {{ essentialGuide?: Record<string, unknown> | null }} [options] 플래너 툴킷이 있으면 도착 공항을 AI 여정과 맞춤
 * @returns {string}
 */
export const getKlookRentalUrlByLocation = (locationOrName, options = {}) => {
  const loc = normalizeRentalLocationInput(locationOrName);
  const normalized = [loc.rental_airport_official_ko, loc.name, loc.name_en]
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

  const searchLabel = resolveKlookRentalBannerSearchLabel(loc, options);
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
 * Klook 공항 픽업·셔틀 홈. 렌터카 홈({@link getKlookRentalHomeUrl})과 URL·aff_adid가 다름.
 *
 * @returns {string}
 */
export const getKlookAirportTransferUrl = () =>
  getKlookAffiliateUrl(KLOOK_AIRPORT_TRANSFER_TARGET, KLOOK_DEFAULT_AD_ID);

/**
 * MRT 비항공 URL에 공식 마이링크 트래킹 파라미터를 붙입니다.
 * API 호출 없음 — docs: mylink_id 필수 · utm_source=mktpartner(랜딩 관례).
 *
 * @param {string} targetUrl
 * @param {{ mylinkId?: string, utmContent?: string }} [options]
 * @returns {string}
 */
export function buildMrtMylinkUrl(targetUrl, options = {}) {
  if (!targetUrl) return getMrtHomeAffiliateUrl();
  try {
    const url = new URL(targetUrl);
    const mylinkId = String(options.mylinkId ?? MRT_HOME_MYLINK_ID).trim();
    if (mylinkId) url.searchParams.set('mylink_id', mylinkId);
    url.searchParams.set('utm_source', 'mktpartner');
    const utmContent = String(options.utmContent ?? '').trim();
    if (utmContent) url.searchParams.set('utm_content', utmContent.slice(0, 100));
    return url.toString();
  } catch {
    return targetUrl;
  }
}

/** 마이리얼트립 제휴 홈 — 파트너 단축 URL SSOT */
export function getMrtHomeAffiliateUrl() {
  return MRT_PACKAGE_SHORT_URLS.home || buildMrtMylinkUrl(MRT_HOME_URL);
}

/**
 * 마이리얼트립 검색 결과 제휴 URL (동기 · Edge 불필요).
 * 사이트 통합 검색(`/search`) — PreTravelChecklist「숙소 실시간 검색」등.
 *
 * @param {string} query - 검색어 (예: '로마 한인민박', '파리 숙소')
 * @returns {string}
 */
export function getMrtSearchUrl(query) {
  const q = String(query ?? '').trim();
  if (!q) return getMrtHomeAffiliateUrl();
  return buildMrtMylinkUrl(`${MRT_HOME_URL}/search?q=${encodeURIComponent(q)}`);
}

/**
 * 숙소 도메인 키워드 검색 제휴 URL (`accommodation…/union/products`).
 * 플래너 숙소 툴킷(지역별·한인민박) — 장소카드「숙소 찾기」목록과 동일 패턴.
 *
 * @param {string} query
 * @param {{ isDomestic?: boolean }} [options]
 * @returns {string}
 */
export function getMrtAccommodationSearchUrl(query, options = {}) {
  const keyword = String(query ?? '').trim();
  if (!keyword) return getMrtHomeAffiliateUrl();
  const url = buildMrtStayListUrl({
    keyword,
    isDomestic: Boolean(options.isDomestic),
    mylinkId: MRT_HOME_MYLINK_ID,
  });
  return url || getMrtHomeAffiliateUrl();
}

/**
 * @deprecated {@link getMrtSearchUrl} 사용 — 동기 마이링크.
 * @param {string} query
 * @returns {string}
 */
export const generateMrtLink = (query) => getMrtSearchUrl(query);

/**
 * 플래너 호텔 버튼 기본값은 마이리얼트립(`getMrtAccommodationSearchUrl` / `getMrtSearchUrl`).
 * MRT 미취급·빈약 지역만 Trip.com `city` ID를 등록한다 (목록 API 아님).
 * 전체 URL이 필요하면 {@link PLANNER_TRIPCOM_HOTEL_OVERRIDES}에 http URL을 둔다.
 *
 * 키: `travelSpots`의 `slug`(소문자) 또는 한글 `name`과 정확히 일치.
 */
export const PLANNER_TRIPCOM_HOTEL_CITY_IDS = {
  'hong-kong': '58',
  macau: '206',
  /** 바티칸 — Trip 허브는 로마 */
  vatican: '725',
  istanbul: '301',
  /** 베네수엘라 — 카라카스 (606=중국 난핑, 오류) */
  venezuela: '811',
  /** 스발바르 — 롱이어비엔 */
  svalbard: '7398',
  /** 페로 제도 — 토르스하운 */
  'faroe-islands': '38171',
  /** 포클랜드 — Stanley */
  'falkland-islands': '76974',
  /** 사모아 — 아피아 (국가명 Samoa만으로는 city 미확정·세션 잔존) */
  samoa: '4371',
  /** 폰페이 — 콜로니아(Pohnpei) · Yap 콜로니아(75099)와 별개 */
  pohnpei: '321825',
  /** 코스라에 — 토폴 */
  kosrae: '321824',
  /**
   * 야프 — 콜로니아(Yap). 목록 실재고 0(오늘·+14·+60) · city 유지(세션 잔존 방지) · sparse
   */
  yap: '75099',
  /**
   * 키리바시 — 타라와. 목록 실재고 0(오늘·+14·+60) · city 유지(세션 잔존 방지) · sparse
   */
  kiribati: '6121',
  /**
   * 나우루 — 로나베. 목록 실재고 0(오늘·+14·+60) · city 유지(세션 잔존 방지) · sparse
   */
  nauru: '681951',
  /** 통가 — 누쿠알로파 */
  tonga: '36478',
  /** 바누아투 — 포트빌라 */
  vanuatu: '4115',
  /** 라로통가 — 아바루아 */
  rarotonga: '36473',
  /** 아이투타키 */
  aitutaki: '6707',
  /** 피지 — 난디(관문) */
  fiji: '791',
  /** 팔라우 — 코로르 */
  palau: '5780',
  /**
   * 코코스(킬링) — 웨스트 아일랜드.
   * city 없으면 직전 세션(통가 등) 잔존 · sparse 유지(재고 극소·예약 어려움)
   */
  'cocos-islands': '77705',
  /** 그린란드 — 누크 (시드 stay-agency · city 없으면 세션 잔존) */
  greenland: '6838',
  /** 솔로몬 제도 — 호니아라 */
  'solomon-islands': '6909',
  /** 버뮤다 — 해밀턴(Bermuda) */
  bermuda: '59607',
  /**
   * 밀포드 사운드 — 티아나우(관문). 당일 크루즈 거점 ≠ 사운드 자체 숙소
   */
  'milford-sound': '3716',
  /**
   * 티칼 — 플로레스(과테말라·관문). 유적지 당일 투어 거점
   */
  tikal: '6760',
  /** 야쿠츠크 */
  yakutsk: '4224',
  /** 아이슬란드 — 레이캬비크 (city 없으면 직전 세션 잔존) */
  iceland: '831',
  /**
   * CTA 후보 gap 배치 (2026-07-23 LIVE size50 · bookable≤5/total≤5)
   * — kr.trip.com/hotels/list?city= 제목·hreflang 검증
   */
  /** 대마도 — 쓰시마 시 */
  tsushima: '95255',
  /** 몰타 — 섬 허브(발레타 1214 아님) */
  malta: '1264',
  /** 롬복 — 섬 허브(마타람 단독 아님) */
  lombok: '1392',
  /** 보라보라 */
  'bora-bora': '61019',
  /** 요세미티 — 요세미티 밸리(숙소 거점) */
  yosemite: '346626',
  /** 아바나 */
  havana: '690',
  /** 모스크바 (RU · moscow-2; 미국 Moscow 28751 아님) */
  moscow: '366',
  /** 블레드 */
  bled: '4102',
  /** 코르시카 — 아작시오(관문) */
  corsica: '1712',
  /** 토레스 델 파이네 — 푸에르토 나타레스(관문) */
  'torres-del-paine': '10149',
  /** 보르네오 — 코타키나발루(관문). MRT 골프장 POI 오탐과 분리 */
  borneo: '1393',
  /** 치첸이트사 — 바야돌리드(유카탄·관문) */
  'chichen-itza': '36428',
  /** 에베레스트 BC — 루클라(관문) */
  'everest-base-camp': '7380',
  /** 울루루 — 율라라(관문) */
  uluru: '61767',
  /** 발데스 반도 — 푸에르토 마드린(관문) */
  'peninsula-valdes': '5624',
  /** 블라디보스토크 */
  vladivostok: '628',
  /** 이르쿠츠크 */
  irkutsk: '672',
  /** 캄차카 — 페트로파블로프스크 캄차츠키(관문) */
  kamchatka: '56415',
  /** 캄차카 반도 — 동일 관문 */
  'kamchatka-peninsula': '56415',
  /**
   * 성수기 선제 배치 (2026-07-23) — MRT total>5이나 bookable 급감 워치
   * — kr.trip.com/hotels/list?city= 제목·hreflang 검증
   */
  /** 아조레스 — 폰타 델가다(관문·상미겔) */
  azores: '3737',
  /** 타히티 — 섬 허브(파페에테 포함 · 보라보라 61019 아님) */
  tahiti: '61672',
};

/**
 * MRT·Trip 모두 일반 호텔 재고가 사실상 없거나 CTA 오매핑 위험 — empty UX 기대치 하향.
 * (군사·무인·크루즈/연구 · 오매핑 city · 예약 불가 단건 등)
 * QA 2026-07-22: christmas `93327` 오매핑 · chuuk · persepolis(시라즈 포함 Trip 0) · timbuktu
 * · nauru/kiribati/yap/cocos — 허브 city 확정·목록 0~극소 (세션 잔존 방지용 city 유지)
 */
export const TRIPCOM_HOTEL_SPARSE_INVENTORY_SLUGS = new Set([
  'antarctica',
  'diego-garcia',
  'midway-atoll',
  'pitcairn-islands',
  'kerguelen-islands',
  'chuuk',
  'christmas-island',
  'cocos-islands',
  'persepolis',
  'timbuktu',
  'nauru',
  'kiribati',
  'yap',
]);

/**
 * @param {{ slug?: string } | null | undefined} location
 * @returns {string}
 */
function getLocationSlugKey(location) {
  return String(location?.slug || '')
    .trim()
    .toLowerCase();
}

/**
 * @param {{ slug?: string } | null | undefined} location
 * @returns {boolean}
 */
export function isTripcomHotelSparseInventoryLocation(location) {
  const slug = getLocationSlugKey(location);
  return Boolean(slug) && TRIPCOM_HOTEL_SPARSE_INVENTORY_SLUGS.has(slug);
}

/**
 * Summary 숙소 empty 문구 · CTA 라벨 (MRT 결과 0건).
 * API 장애는 {@link getTripcomHotelErrorCopy}.
 *
 * @param {{ slug?: string } | null | undefined} location
 * @returns {{ title: string, subtitle: string, cta: string }}
 */
export function getTripcomHotelEmptyCopy(location) {
  const slug = getLocationSlugKey(location);
  if (slug === 'persepolis') {
    return {
      title: '보통 시라즈에 묵고 당일 투어로 다녀와요',
      subtitle:
        '다만 트립닷컴·마이리얼트립에서는 이란 숙소 예약이 거의 안 돼요. 이란 전문·현지 예약을 확인해 보세요',
      cta: '트립닷컴에서 확인하기',
    };
  }
  if (isTripcomHotelSparseInventoryLocation(location)) {
    return {
      title: '이 지역은 온라인 숙소 예약이 거의 없어요',
      subtitle:
        '트립닷컴에도 재고가 없거나 예약이 어려울 수 있어요. 현지·전문 여행사를 확인해 보세요',
      cta: '트립닷컴에서 확인하기',
    };
  }
  return {
    title: '이 여행지 숙소를 마이리얼트립에서 찾지 못했어요',
    subtitle: '위쪽 일정·인원을 바꾼 뒤 트립닷컴으로 검색해 보세요',
    cta: '트립닷컴에서 숙소 검색',
  };
}

/**
 * Summary 숙소 error 문구 · CTA 라벨 (Edge/MRT 호출 실패).
 * 지역 특수 empty override는 적용하지 않음 — 장애 ≠ 재고 없음.
 *
 * @returns {{ title: string, subtitle: string, cta: string }}
 */
export function getTripcomHotelErrorCopy() {
  return {
    title: '숙소 검색을 잠시 불러오지 못했어요',
    subtitle: '잠시 후에 다시 시도해 주세요. 트립닷컴에서 바로 검색할 수도 있어요',
    cta: '트립닷컴에서 숙소 검색',
  };
}

/**
 * 제휴에서 받은 트립닷컴 호텔 목록 URL 전체 (선택).
 * city ID만으로 충분하면 {@link PLANNER_TRIPCOM_HOTEL_CITY_IDS}를 쓴다.
 *
 * @example
 * PLANNER_TRIPCOM_HOTEL_OVERRIDES.fukuoka = 'https://kr.trip.com/hotels/list?city=248&…';
 */
export const PLANNER_TRIPCOM_HOTEL_OVERRIDES = {
  // fukuoka: 'https://kr.trip.com/hotels/list?...',
};

/** Trip.com KR 제휴 — Alliance / SID */
export const TRIPCOM_KR_PARTNER = {
  allianceId: '8182427',
  sid: '309563143',
};

/**
 * Trip.com KR 사이트 홈 (항공/호텔 딥링크 아님).
 * @param {{ campaign?: string, locationName?: string }} [options]
 * @returns {string}
 */
export function getTripcomHomeUrl(options = {}) {
  const params = new URLSearchParams({
    locale: 'ko-KR',
    curr: 'KRW',
    Allianceid: TRIPCOM_KR_PARTNER.allianceId,
    SID: TRIPCOM_KR_PARTNER.sid,
  });
  if (options.campaign) params.set('trip_sub1', options.campaign);
  if (options.locationName) params.set('trip_sub2', options.locationName);
  return `https://kr.trip.com/?${params.toString()}`;
}

/** Klook 사이트 홈 제휴 URL */
export function getKlookSiteHomeUrl() {
  return getKlookAffiliateUrl(KLOOK_SITE_HOME_TARGET);
}

/** 플래너 항공권 추적 (trip_sub1·trip_sub3) */
export const TRIPCOM_FLIGHT_TRACKING = {
  sub1PlannerFlight: '플래너 항공권',
  sub1PlannerFlightMobile: '플래너 항공권 모바일',
  sub1PlannerPreTravelFlight: '플래너 필수준비 항공권 검색 일반',
  sub1ChatFlight: '채팅 항공권',
  sub1GlobeFlightCinema: '홈 항공 시네마',
  sub3PlannerFlight: 'D17104488',
  sub3PlannerPreTravelFlight: 'D17159522',
  sub3ChatFlight: 'D17104488',
};

/** 제휴 항공 검색 배너 (iframe) — 데스크톱 900×200 / 모바일 320×480 */
export const TRIPCOM_FLIGHT_AD = {
  adId: 'S17104971',
  mobileAdId: 'S17158794',
  width: 900,
  height: 200,
  mobileWidth: 320,
  mobileHeight: 480,
};

/** 제휴 호텔 검색 배너 (iframe) — 데스크톱 900×200 / 모바일 320×480 */
export const TRIPCOM_HOTEL_AD = {
  adId: 'S18836274',
  mobileAdId: 'S18836330',
  width: 900,
  height: 200,
  mobileWidth: 320,
  mobileHeight: 480,
};

/** 숙소 찾기 Trip.com 추적 (trip_sub1) */
export const TRIPCOM_HOTEL_TRACKING = {
  emptyResult: '숙소찾기 빈결과',
  emptyResultMobile: '숙소찾기 빈결과 모바일',
  lowInventory: '숙소찾기 저재고',
  fullScreen: '숙소찾기 전체화면',
  plannerOverride: '플래너 숙소 오버라이드',
};

/** 선택 일정에 요금 있는 MRT 숙소가 이 개수 이하면 목록 하단 Trip.com CTA (≤5) */
export const MRT_STAY_LOW_COUNT = 5;

/** 한국 출발 기본 공항 — Trip `dAirportCode` */
export const TRIPCOM_DEFAULT_DEPARTURE_AIRPORT = 'ICN';

/**
 * 플래너·배너용 도착 IATA (단일 또는 복수 공항의 linkHub).
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null }} [options]
 * @returns {string | null}
 */
export function getPlannerFlightArrivalIata(location, options = {}) {
  return resolvePlannerFlightArrivalIata(location, options);
}

function resolveTripcomFlightTracking(options = {}) {
  const { tracking } = options;

  if (tracking === 'chat-flight') {
    return {
      sub1: TRIPCOM_FLIGHT_TRACKING.sub1ChatFlight,
      sub3: TRIPCOM_FLIGHT_TRACKING.sub3ChatFlight,
    };
  }

  if (tracking === 'planner-pre-travel') {
    return {
      sub1: TRIPCOM_FLIGHT_TRACKING.sub1PlannerPreTravelFlight,
      sub3: TRIPCOM_FLIGHT_TRACKING.sub3PlannerPreTravelFlight,
    };
  }

  if (tracking === 'planner-flight-mobile') {
    return {
      sub1: TRIPCOM_FLIGHT_TRACKING.sub1PlannerFlightMobile,
      sub3: TRIPCOM_FLIGHT_TRACKING.sub3PlannerFlight,
    };
  }

  if (tracking === 'globe-flight-cinema') {
    return {
      sub1: TRIPCOM_FLIGHT_TRACKING.sub1GlobeFlightCinema,
      sub3: TRIPCOM_FLIGHT_TRACKING.sub3PlannerFlight,
    };
  }

  return {
    sub1: TRIPCOM_FLIGHT_TRACKING.sub1PlannerFlight,
    sub3: TRIPCOM_FLIGHT_TRACKING.sub3PlannerFlight,
  };
}

/**
 * Trip.com 항공 제휴 URL (항공 홈 또는 제휴 ad iframe).
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null, mode?: 'flights' | 'ad', adId?: string, departureIata?: string, tracking?: 'planner-flight-mobile' | 'planner-pre-travel' | 'globe-flight-cinema' | 'chat-flight' }} [options]
 * @returns {string}
 */
export function buildTripcomPlannerFlightUrl(location, options = {}) {
  const { mode = 'flights', adId = TRIPCOM_FLIGHT_AD.adId, departureIata } = options;
  const arrival = getPlannerFlightArrivalIata(location, options);
  const { sub1, sub3 } = resolveTripcomFlightTracking(options);

  const params = new URLSearchParams({
    Allianceid: TRIPCOM_KR_PARTNER.allianceId,
    SID: TRIPCOM_KR_PARTNER.sid,
    trip_sub1: sub1,
    locale: 'ko-KR',
    curr: 'KRW',
    trip_sub3: sub3,
  });

  let depart = String(departureIata || TRIPCOM_DEFAULT_DEPARTURE_AIRPORT)
    .trim()
    .toUpperCase();
  const arriveCode = arrival ? String(arrival).trim().toUpperCase() : null;
  if (arriveCode && depart === arriveCode) {
    depart = TRIPCOM_DEFAULT_DEPARTURE_AIRPORT;
  }
  if (depart) {
    params.set('dAirportCode', depart);
  }
  if (arriveCode) {
    params.set('aAirportCode', arriveCode);
  }

  if (mode === 'ad') {
    return `https://kr.trip.com/partners/ad/${adId}?${params.toString()}`;
  }

  return `https://kr.trip.com/flights/?${params.toString()}`;
}

/** 도착 공항 미지정 시 기본 항공권 URL (하위 호환) */
export const PLANNER_TRIPCOM_FLIGHTS_URL = buildTripcomPlannerFlightUrl(null);

/**
 * @param {{ slug?: string, name?: string } | null | undefined} location
 * @returns {string | null} Trip.com city ID
 */
export function getTripcomHotelCityIdForLocation(location) {
  if (!location) return null;
  const slug = (location.slug || '').toLowerCase();
  if (slug && Object.prototype.hasOwnProperty.call(PLANNER_TRIPCOM_HOTEL_CITY_IDS, slug)) {
    const id = PLANNER_TRIPCOM_HOTEL_CITY_IDS[slug];
    return id != null && String(id).trim() ? String(id).trim() : null;
  }
  const name = (location.name || '').trim();
  if (name && Object.prototype.hasOwnProperty.call(PLANNER_TRIPCOM_HOTEL_CITY_IDS, name)) {
    const id = PLANNER_TRIPCOM_HOTEL_CITY_IDS[name];
    return id != null && String(id).trim() ? String(id).trim() : null;
  }
  return null;
}

/**
 * @param {{ slug?: string, name?: string } | null | undefined} location
 * @returns {string | null} 등록된 전체 http URL
 */
function getTripcomHotelFullOverrideUrl(location) {
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

/**
 * 기존 호텔 URL에 날짜·인원·제휴 파라미터를 병합 (오버라이드 전체 URL용).
 * @param {string} baseUrl
 * @param {{ checkIn?: string, checkOut?: string, campaign?: string, adultCount?: number, childCount?: number }} options
 */
function mergeTripcomHotelStayParams(baseUrl, options = {}) {
  try {
    const url = new URL(baseUrl);
    if (!url.searchParams.has('Allianceid')) {
      url.searchParams.set('Allianceid', TRIPCOM_KR_PARTNER.allianceId);
    }
    if (!url.searchParams.has('SID')) {
      url.searchParams.set('SID', TRIPCOM_KR_PARTNER.sid);
    }
    if (!url.searchParams.has('locale')) url.searchParams.set('locale', 'ko-KR');
    if (!url.searchParams.has('curr')) url.searchParams.set('curr', 'KRW');
    if (options.campaign) url.searchParams.set('trip_sub1', options.campaign);
    if (options.checkIn) url.searchParams.set('checkIn', String(options.checkIn));
    if (options.checkOut) url.searchParams.set('checkOut', String(options.checkOut));
    const adults = Number(options.adultCount);
    if (Number.isFinite(adults) && adults > 0) {
      url.searchParams.set('adult', String(Math.min(8, adults)));
    }
    const children = Number(options.childCount);
    if (Number.isFinite(children) && children >= 0) {
      url.searchParams.set('children', String(Math.min(8, children)));
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/**
 * MRT 숙소 빈 결과·미취급·저재고 시 Trip.com 호텔 검색 (목록 API 아님).
 * `mode: 'list'` → `/hotels/list` 딥링크 · `mode: 'ad'` → partners/ad iframe.
 * city ID({@link PLANNER_TRIPCOM_HOTEL_CITY_IDS}) · `cityName` · 날짜·인원 주입.
 *
 * @param {{ slug?: string, name?: string, name_en?: string, name_ko?: string } | null | undefined} location
 * @param {{
 *   mode?: 'list' | 'ad',
 *   adId?: string,
 *   checkIn?: string,
 *   checkOut?: string,
 *   campaign?: string,
 *   adultCount?: number,
 *   childCount?: number,
 * }} [options]
 * @returns {string}
 */
export function buildTripcomHotelSearchUrl(location, options = {}) {
  const {
    mode = 'list',
    adId = TRIPCOM_HOTEL_AD.adId,
    campaign = TRIPCOM_HOTEL_TRACKING.emptyResult,
  } = options;

  if (mode !== 'ad') {
    const fullOverride = getTripcomHotelFullOverrideUrl(location);
    if (fullOverride) {
      return mergeTripcomHotelStayParams(fullOverride, { ...options, campaign });
    }
  }

  const displayName = String(
    location?.name || location?.name_ko || location?.name_en || '',
  ).trim();
  /** Trip 검색은 영문명·짧은 지명이 더 잘 맞는 경우가 많음 */
  const searchName = String(
    location?.name_en || location?.name || location?.name_ko || '',
  ).trim();
  const cityId = getTripcomHotelCityIdForLocation(location);
  const params = new URLSearchParams({
    locale: 'ko-KR',
    curr: 'KRW',
    Allianceid: TRIPCOM_KR_PARTNER.allianceId,
    SID: TRIPCOM_KR_PARTNER.sid,
    trip_sub1: campaign,
  });
  if (cityId) params.set('city', cityId);
  if (searchName) {
    params.set('cityName', searchName);
    params.set('searchWord', searchName);
  }
  if (displayName) params.set('trip_sub2', displayName);
  if (options.checkIn) params.set('checkIn', String(options.checkIn));
  if (options.checkOut) params.set('checkOut', String(options.checkOut));
  const adults = Number(options.adultCount);
  if (Number.isFinite(adults) && adults > 0) params.set('adult', String(Math.min(8, adults)));
  const children = Number(options.childCount);
  if (Number.isFinite(children) && children >= 0) {
    params.set('children', String(Math.min(8, children)));
  }
  // Trip 호텔 목록 관례 — 객실 1
  if (mode === 'list') params.set('crn', '1');

  if (mode === 'ad') {
    return `https://kr.trip.com/partners/ad/${adId}?${params.toString()}`;
  }
  return `https://kr.trip.com/hotels/list?${params.toString()}`;
}

/**
 * 등록된 여행지만 트립닷컴 호텔 목록으로 연결. 없으면 null → 마이리얼트립 사용.
 * city ID 또는 전체 URL 오버라이드가 있을 때 list URL을 반환한다.
 *
 * @param {{ slug?: string, name?: string } | null | undefined} location
 * @returns {string | null}
 */
export function getTripcomHotelOverrideUrlForLocation(location) {
  if (!location) return null;
  if (getTripcomHotelFullOverrideUrl(location) || getTripcomHotelCityIdForLocation(location)) {
    return buildTripcomHotelSearchUrl(location, {
      mode: 'list',
      campaign: TRIPCOM_HOTEL_TRACKING.plannerOverride,
    });
  }
  return null;
}

