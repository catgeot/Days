// 플래너 지역별 제휴/노출 규칙 단일 관리 파일

export const GYG_CITY_CONFIGS = [
    { locationId: '2008', keys: ['mount-everest', '에베레스트', 'everest'] },
    { locationId: '168995', keys: ['costa-rica', '코스타리카', 'costa rica'] },
    { locationId: '204933', keys: ['galapagos', 'galápagos', '갈라파고스'] },
    { locationId: '2794', keys: ['patagonia', '파타고니아'] },
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
    '인도네시아', '발리', '자카르타',
    'philippines', 'manila', 'cebu', 'boracay',
    'japan', 'tokyo', 'osaka', 'kyoto', 'fukuoka', 'sapporo', 'okinawa',
    'korea', 'seoul', 'busan', 'jeju',
    'taiwan', 'taipei', 'taichung', 'kaohsiung',
    'hong kong', 'macau',
    'thailand', 'bangkok', 'phuket', 'chiang mai', 'pattaya',
    'vietnam', 'danang', 'hanoi', 'ho chi minh', 'nha trang',
    'singapore',
    'malaysia', 'kuala lumpur', 'penang',
    'indonesia', 'bali', 'jakarta'
];

// Klook 다이닝 미지원(또는 전환 비효율) 지역 키워드
const DINING_KLOOK_UNSUPPORTED_KEYS = [
    'zanzibar', '잔지바르',
    'fiordland', 'fjordland', '피오르드랜드',
    'mount-everest', 'everest', '에베레스트'
];

const getLocationSearchFields = (location) => {
    const slug = (location?.slug || '').toLowerCase();
    const nameKo = (location?.name || '').toLowerCase();
    const nameEn = (location?.name_en || location?.curation_data?.locationEn || '').toLowerCase();
    return { slug, nameKo, nameEn };
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
