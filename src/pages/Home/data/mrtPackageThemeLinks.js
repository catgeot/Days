/**
 * 마이리얼트립 /pkc 패키지 단축 URL SSOT (에디터스 픽 CTA).
 * 트립링크 iframe/모달과 무관 — 새 탭으로만 연다.
 *
 * 드리프트 주의:
 * - MRT 쪽 분류명(「특가」「단거리」등)은 마케팅 용어라 언제든 바뀔 수 있음.
 * - 표시명만 바뀌고 shortUrl이 유지될 수도, 새 페이지·새 단축으로 갈 수도 있음 → 보장 없음.
 * - CTA 문구·URL 불일치 의심 시 단축을 직접 열어 랜딩을 확인하고 이 파일만 갱신.
 * - 일본 섹션 CTA「특가」는 MRT 랜딩 표기를 따른 것(취지는 일본 패키지).
 */

export const MRT_PACKAGE_SHORT_URLS = {
  /** 단거리 가족 (동남아·일본, 4시간 이내) — 랜딩: 가족여행 안성맞춤 */
  familyShortHaul: 'https://myrealt.rip/dVHNd0',
  /** 동남아 패키지 (휴양 등) */
  southeastAsia: 'https://myrealt.rip/dVDy3a',
  /** 유럽 패키지 */
  europe: 'https://myrealt.rip/dVE182',
  /** 일본 패키지 (MRT 표기: 특가) */
  japan: 'https://myrealt.rip/dVEgd5',
  /** 홈 단축 (/pkc) — 보관 */
  home: 'https://myrealt.rip/dUxR7d',
  /** 지방 출발 — 보관만 */
  regionalDeparture: 'https://myrealt.rip/dVEE92',
  /** 홈쇼핑 — 보관만 */
  homeShopping: 'https://myrealt.rip/dVEo96',
};

/**
 * 홈 단축(`home` → myrealt.rip/dUxR7d) 리다이렉트의 mylink_id.
 * 숙소 목록 등 비항공 MRT URL에 `?mylink_id=`로 붙여 제휴 추적.
 * @see https://docs.myrealtrip.com/#/api/partner-api/마이-링크
 */
export const MRT_HOME_MYLINK_ID = '2282829';

/** 에디터스 픽 테마 → CTA 문구 + 단축 URL */
export const MRT_PACKAGE_THEME_LINKS = {
  family: {
    shortUrl: MRT_PACKAGE_SHORT_URLS.familyShortHaul,
    ctaLabel: '동남아·일본 패키지',
  },
  japan: {
    shortUrl: MRT_PACKAGE_SHORT_URLS.japan,
    ctaLabel: '일본 특가 패키지',
  },
  longhaul: {
    shortUrl: MRT_PACKAGE_SHORT_URLS.europe,
    ctaLabel: '유럽 패키지',
  },
  resort: {
    shortUrl: MRT_PACKAGE_SHORT_URLS.southeastAsia,
    ctaLabel: '동남아 휴양 패키지',
  },
};
