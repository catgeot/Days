/**
 * 마이리얼트립 /pkc 패키지 SSOT.
 * 목록 API 없음 → 웹 검색·기획전·홈 딥링크 + mylink 추적.
 *
 * 2026-08-02: myrealt.rip 테마 단축 중 일본(dVEgd5)이 교원 기획전(KYOWON_JAPAN2606)으로만
 * 이어져 일반 일본 패키지와 어긋남 → `/pkc/search?q=`·검증된 promotionGroupId로 재연결.
 * 홈 단축(fOey96)의 mylink_id는 숙소·검색 추적 SSOT로 유지.
 */

/** 패키지 허브 */
export const MRT_PKC_HOME_URL = 'https://www.myrealtrip.com/pkc';

/**
 * 단축 URL이 랜딩하던 기획전 ID (2026-08-02 리다이렉트 확인).
 * 일본은 캠페인 프로모션이라 검색어로 대체.
 */
export const MRT_PKC_PROMOTION_GROUP_IDS = {
  familyShortHaul: '5',
  southeastAsia: '6',
  europe: '28',
  regionalDeparture: '14',
};

/** @deprecated 보관 — 테마 CTA는 {@link MRT_PACKAGE_THEME_LINKS} 의 target 사용 */
export const MRT_PACKAGE_SHORT_URLS = {
  familyShortHaul: 'https://myrealt.rip/dVHNd0',
  southeastAsia: 'https://myrealt.rip/dVDy3a',
  europe: 'https://myrealt.rip/dVE182',
  japan: 'https://myrealt.rip/dVEgd5',
  home: 'https://myrealt.rip/fOey96',
  regionalDeparture: 'https://myrealt.rip/dVEE92',
  homeShopping: 'https://myrealt.rip/dVEo96',
};

/**
 * 홈 단축(`home` → myrealt.rip/fOey96) 리다이렉트의 mylink_id.
 * 검색·숙소 목록 등 비항공 MRT URL에 `?mylink_id=`+`utm_source=mktpartner`로 제휴 추적.
 * @see https://docs.myrealtrip.com/#/api/partner-api/마이-링크
 */
export const MRT_HOME_MYLINK_ID = '2640202';

/**
 * 에디터스 픽·써머리 테마 → 안정 딥링크 스펙.
 * kind: promotionGroup | search | home
 */
export const MRT_PACKAGE_THEME_TARGETS = {
  family: {
    kind: 'promotionGroup',
    promotionGroupId: MRT_PKC_PROMOTION_GROUP_IDS.familyShortHaul,
    searchFallback: '가족여행',
    ctaLabel: '동남아·일본 패키지',
  },
  japan: {
    kind: 'search',
    q: '일본',
    ctaLabel: '일본 패키지',
  },
  longhaul: {
    kind: 'promotionGroup',
    promotionGroupId: MRT_PKC_PROMOTION_GROUP_IDS.europe,
    searchFallback: '유럽',
    ctaLabel: '유럽 패키지',
  },
  resort: {
    kind: 'promotionGroup',
    promotionGroupId: MRT_PKC_PROMOTION_GROUP_IDS.southeastAsia,
    searchFallback: '동남아',
    ctaLabel: '동남아 휴양 패키지',
  },
};

/**
 * @deprecated {@link resolveMrtPackageThemeHref} 사용. 하위 호환용 shortUrl 필드.
 * 런타임에 affiliate 빌더로 채우려면 SearchDiscovery에서 resolve 호출.
 */
export const MRT_PACKAGE_THEME_LINKS = {
  family: {
    shortUrl: `${MRT_PKC_HOME_URL}/search?promotionGroupId=${MRT_PKC_PROMOTION_GROUP_IDS.familyShortHaul}`,
    ctaLabel: MRT_PACKAGE_THEME_TARGETS.family.ctaLabel,
  },
  japan: {
    shortUrl: `${MRT_PKC_HOME_URL}/search?q=${encodeURIComponent('일본')}`,
    ctaLabel: MRT_PACKAGE_THEME_TARGETS.japan.ctaLabel,
  },
  longhaul: {
    shortUrl: `${MRT_PKC_HOME_URL}/search?promotionGroupId=${MRT_PKC_PROMOTION_GROUP_IDS.europe}`,
    ctaLabel: MRT_PACKAGE_THEME_TARGETS.longhaul.ctaLabel,
  },
  resort: {
    shortUrl: `${MRT_PKC_HOME_URL}/search?promotionGroupId=${MRT_PKC_PROMOTION_GROUP_IDS.southeastAsia}`,
    ctaLabel: MRT_PACKAGE_THEME_TARGETS.resort.ctaLabel,
  },
};
