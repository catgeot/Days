// 플래너 지역별 제휴/노출 규칙 단일 관리 파일

import { isPlaceholderCountry } from '../../../../utils/travelSpotResolve';

export const GYG_CITY_CONFIGS = [
    { locationId: '2008', keys: ['mount-everest', '에베레스트', 'everest'] },
    { locationId: '168995', keys: ['costa-rica', '코스타리카', 'costa rica'] },
    { locationId: '204933', keys: ['galapagos', 'galápagos', '갈라파고스'] },
    { locationId: '2794', keys: ['patagonia', '파타고니아', 'bariloche', '바릴로체'] },
    { locationId: '2859', keys: ['arequipa', '아레키파'] },
    { locationId: '416', keys: ['canary-islands', 'canary islands', '카나리아 제도', '카나리아제도'] },
    { locationId: '1534', keys: ['corsica', '코르시카'] },
    { locationId: '32367', keys: ['fiordland', 'fjordland', '피오르드랜드'] },
    { locationId: '871', keys: ['zanzibar', '잔지바르'] },
];

// 지도/명소 카드에서 Klook 커버리지가 약해 GYG를 우선 노출할 여행지.
const MAP_POI_GYG_ONLY_LOCATION_KEYS = GYG_CITY_CONFIGS.flatMap((item) => item.keys);

// 지도/명소 카드에서 레스토랑 예약 링크를 숨길 여행지 (다이닝 제휴 미지원/효율 낮음)
const MAP_POI_HIDE_DINING_LOCATION_KEYS = [
    'zanzibar',
    '잔지바르'
];

// 지도/명소 카드에서 Klook 다이닝을 우선 노출할 전략 지역 키워드
const DINING_KLOOK_PRIORITY_KEYS = [
    '한국', '대한민국', '서울', '부산', '제주',
    '일본', '도쿄', '오사카', '교토', '후쿠오카', '삿포로', '오키나와',
    '대만', '타이베이', '타이중', '가오슝',
    '홍콩', '마카오',
    '태국', '방콕', '푸켓', '치앙마이', '파타야',
    '베트남', '다낭', '하노이', '호치민', '나트랑',
    '싱가포르',
    '말레이시아', '쿠알라룸푸르', '페낭',
    // 인도네시아는 국가명만으로 매칭하지 않음(자바·술라웨시 등 Klook 다이닝 약한 지역 오탐 방지). 발리·자카르타 허브 및 관광 소도시.
    '발리', '자카르타', '우붓', 'ubud', '쿠타', 'kuta', '누사두아', 'nusa dua', '스미냑', 'seminyak',
    'philippines', 'manila', 'cebu', 'boracay',
    'japan', 'tokyo', 'osaka', 'kyoto', 'fukuoka', 'sapporo', 'okinawa',
    'korea', 'seoul', 'busan', 'jeju',
    'taiwan', 'taipei', 'taichung', 'kaohsiung',
    'hong kong', 'macau',
    'thailand', 'bangkok', 'phuket', 'chiang mai', 'pattaya',
    'vietnam', 'danang', 'hanoi', 'ho chi minh', 'nha trang',
    'singapore',
    'malaysia', 'kuala lumpur', 'penang',
    'bali', 'jakarta', 'seminyak', 'nusa dua'
];

// Klook 다이닝 미지원(또는 전환 비효율) 지역 키워드
const DINING_KLOOK_UNSUPPORTED_KEYS = [
    'zanzibar', '잔지바르',
    'fiordland', 'fjordland', '피오르드랜드',
    'mount-everest', 'everest', '에베레스트',
    // 중앙자바 권역: Klook 레스토랑 카테고리 커버리지 약함
    'borobudur', '보로부두르', 'prambanan', '프람바난', 'yogyakarta', 'jogja', '조그자카르타', 'magelang', '마겔랑',
];

const getLocationSearchFields = (location) => {
    const slug = (location?.slug || '').toLowerCase();
    const nameKo = (location?.name || '').toLowerCase();
    const nameEn = (location?.name_en || location?.curation_data?.locationEn || '').toLowerCase();
    return { slug, nameKo, nameEn };
};

/** GYG Search q용 — 한글/CJK만 있으면 false (영문 City, Country 기대) */
const isGygSearchSafeLabel = (value) => {
    const s = String(value || '').trim();
    if (!s) return false;
    if (/[\uAC00-\uD7A3\u3040-\u30ff\u3400-\u9fff]/.test(s)) return false;
    return /[A-Za-z\u00C0-\u024F]/.test(s);
};

/**
 * Manual Activities 위젯 data-gyg-q.
 * 우선: name_en + country_en → "City, Country" · 도시만 · 한글명만이면 null(City/Klook 폴백).
 * @returns {string|null}
 */
export const buildGygActivitiesSearchQuery = (location) => {
    const cityEn = String(
        location?.name_en || location?.curation_data?.locationEn || ''
    ).trim();
    const countryEnRaw = String(
        location?.country_en || location?.curation_data?.country_en || location?.country || ''
    ).trim();
    const countryEn =
        !isPlaceholderCountry(countryEnRaw) && isGygSearchSafeLabel(countryEnRaw)
            ? countryEnRaw
            : '';

    if (isGygSearchSafeLabel(cityEn) && countryEn) {
        return `${cityEn}, ${countryEn}`;
    }
    if (isGygSearchSafeLabel(cityEn)) {
        return cityEn;
    }
    return null;
};

const matchesLocationKeys = (location, keys) => {
    const { slug, nameKo, nameEn } = getLocationSearchFields(location);
    return keys.some((key) =>
        slug.includes(key) || nameKo.includes(key) || nameEn.includes(key)
    );
};

export const getGygLocationIdByLocation = (location) => {
    const matchedConfig = GYG_CITY_CONFIGS.find((config) => matchesLocationKeys(location, config.keys));
    return matchedConfig?.locationId || null;
};

export const isMapPoiGygOnlyLocation = (location) =>
    matchesLocationKeys(location, MAP_POI_GYG_ONLY_LOCATION_KEYS);

export const isMapPoiDiningHiddenLocation = (location) =>
    matchesLocationKeys(location, MAP_POI_HIDE_DINING_LOCATION_KEYS);

export const isKlookDiningPriorityLocation = (searchTarget) =>
    DINING_KLOOK_PRIORITY_KEYS.some((kw) => searchTarget.includes(kw.toLowerCase()));

export const isKlookDiningUnsupportedLocation = (location) =>
    matchesLocationKeys(location, DINING_KLOOK_UNSUPPORTED_KEYS);
