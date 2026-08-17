/**
 * 테스터용 짧은 QA 링크 SSOT.
 * 사람·에이전트 공유: https://www.gateo.kr/qa/<slug>
 * vercel.json redirects 와 동기화 유지 (slug·destination).
 */
export const CLOUD_QA_SHARE_ORIGIN = 'https://www.gateo.kr';

/** @type {{ slug: string, label: string, branch: string, destination: string, active: boolean }[]} */
export const CLOUD_QA_SHARE_LINKS = [
  {
    slug: 'chrome-hit',
    label: '지구본 홈 Chrome 칩 히트',
    branch: 'main',
    destination: 'https://www.gateo.kr/',
    active: true,
  },
  {
    slug: 'logbook-curation',
    label: '로그북 큐레이션 페이지',
    branch: 'main',
    destination: 'https://www.gateo.kr/blog/curation',
    active: false,
  },
  {
    slug: 'korea-recent-search',
    label: '축제·명승 최근 검색어',
    branch: 'cursor/korea-recent-search-972e',
    destination:
      'https://days-git-cursor-korea-recent-search-972e-catgeots-projects.vercel.app/korea',
    active: true,
  },
  {
    slug: 'scenic-hwaeomsa',
    label: '명승 검색 화엄사',
    branch: 'cursor/scenic-hwaeomsa-search-8838',
    destination: 'https://www.gateo.kr/korea/theme/scenic',
    active: false,
  },
  {
    slug: 'logbook-cta',
    label: '로그북 공개피드 CTA',
    branch: 'main',
    destination: 'https://www.gateo.kr/blog',
    active: false,
  },
  {
    slug: 'aitutaki-tour',
    label: '아이투타키 투어 오탐',
    branch: 'cursor/aitutaki-gyg-tour-b09e',
    destination:
      'https://days-git-cursor-aitutaki-gyg-tour-b09e-catgeots-projects.vercel.app/',
    active: true,
  },
  {
    slug: 'curation',
    label: 'AI 큐레이션',
    branch: 'cursor/curation-globe-android-0ba2',
    destination:
      'https://days-git-cursor-curation-globe-android-0ba2-catgeots-projects.vercel.app/blog/curation?debug=curation',
    active: true,
  },

  {
    slug: 'summary-bottom',
    label: '모바일 써머리 하단',
    branch: 'cursor/summary-mobile-bottom-f024',
    destination:
      'https://days-git-cursor-summary-mobile-bottom-f024-catgeots-projects.vercel.app/',
    active: true,
  },
  {
    slug: 'zermatt-flight',
    label: '체르마트 항로·플래너',
    branch: 'cursor/flight-cinema-zermatt-f4d1',
    destination:
      'https://days-git-cursor-flight-cinema-zermatt-f4d1-catgeots-projects.vercel.app/',
    active: true,
  },
  {
    slug: 'summary-planner',
    label: '써머리 플래너 보기',
    branch: 'cursor/summary-planner-bd48',
    destination:
      'https://days-git-cursor-summary-planner-bd48-catgeots-projects.vercel.app/',
    active: false,
  },
  {
    slug: 'festival-samehub',
    label: '축제→같은 도시 명소 중첩',
    branch: 'cursor/festival-samehub-8585',
    destination:
      'https://days-git-cursor-festival-samehub-8585-catgeots-projects.vercel.app/korea',
    active: true,
  },
  {
    slug: 'page-end-pad',
    label: '페이지 스크롤 끝 하단 여백',
    branch: 'cursor/page-end-pad-1e22',
    destination:
      'https://days-git-cursor-page-end-pad-1e22-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'korea-seo',
    label: '축제·명승 SEO 허브',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea',
    active: true,
  },
  {
    slug: 'scenic-list',
    label: '명승 홈 리스트 크게',
    branch: 'cursor/scenic-list-large-a55c',
    destination:
      'https://days-git-cursor-scenic-list-large-a55c-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'brand',
    label: '브랜드 SEO Days→GATEO',
    branch: 'main',
    destination: 'https://www.gateo.kr/',
    active: true,
  },
  {
    slug: 'scenic-map',
    label: '명승 홈 지도 내 위치',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-favorites',
    label: '명승 홈 즐겨찾기',
    branch: 'cursor/scenic-favorites-492c',
    destination:
      'https://days-git-cursor-scenic-favorites-492c-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-search-focus',
    label: '검색 아이콘 즉시 포커스',
    branch: 'cursor/scenic-search-focus-9792',
    destination:
      'https://days-git-cursor-scenic-search-focus-9792-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-food-naver',
    label: '맛집 상세 네이버 링크',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-hub-fill',
    label: '소량 hub 명소 보강',
    branch: 'cursor/scenic-thin-hubs-beea',
    destination:
      'https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-yangyang',
    label: '양양 GATEO 선정 명소',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea/theme/scenic?hub=yangyang',
    active: true,
  },
  {
    slug: 'scenic-detail-overflow',
    label: '관광지 상세 가로 스크롤',
    branch: 'cursor/scenic-detail-overflow-3f84',
    destination:
      'https://days-git-cursor-scenic-detail-overflow-3f84-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-empty-chips',
    label: '빈 hub 선정 칩·제목 아이콘',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-search-clear',
    label: '인근 여행지→검색 잔존 해제',
    branch: 'cursor/scenic-search-clear-f5a5',
    destination:
      'https://days-git-cursor-scenic-search-clear-f5a5-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-home-scroll',
    label: '인근 여행지→명승 홈 스크롤',
    branch: 'cursor/scenic-home-scroll-8482',
    destination:
      'https://days-git-cursor-scenic-home-scroll-8482-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-mid-cluster',
    label: '명소 세권(동서남북) 칩',
    branch: 'cursor/scenic-mid-cluster-67a8',
    destination:
      'https://days-git-cursor-scenic-mid-cluster-67a8-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-default-chip',
    label: '명승 분류칩 기본 중·소분류',
    branch: 'cursor/scenic-default-chip-6098',
    destination:
      'https://days-git-cursor-scenic-default-chip-6098-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-chip',
    label: '명승 분류칩 스크롤 고정',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-nearby',
    label: '명승 내주변 관내 관광지(양구)',
    branch: 'cursor/scenic-nearby-yanggu-7658',
    destination:
      'https://days-git-cursor-scenic-nearby-yanggu-7658-catgeots-projects.vercel.app/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'home-korea',
    label: '홈·축제 헤더 간소화',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea',
    active: true,
  },
  {
    slug: 'korea-theme',
    label: '한국의 명승',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'dokdo',
    label: '독도 검색',
    branch: 'cursor/dokdo-search-a849',
    destination:
      'https://days-git-cursor-dokdo-search-a849-catgeots-projects.vercel.app/',
    active: true,
  },
  {
    slug: 'korea',
    label: '축제 페이지',
    branch: 'cursor/korea-photo-swipe-7d94',
    destination:
      'https://days-git-cursor-korea-photo-swipe-7d94-catgeots-projects.vercel.app/korea',
    active: true,
  },
  {
    slug: 'package',
    label: 'MRT 패키지 연결',
    branch: 'cursor/mrt-package-strip-18d2',
    destination:
      'https://days-git-cursor-mrt-package-strip-18d2-catgeots-projects.vercel.app/',
    active: true,
  },
  {
    slug: 'globe',
    label: '지구본 나라 목록',
    branch: 'cursor/globe-neighbor-list-15b3',
    destination:
      'https://days-git-cursor-globe-neighbor-list-15b3-catgeots-projects.vercel.app/',
    active: true,
  },
  {
    slug: 'puzzle',
    label: '퍼즐 게임',
    branch: 'cursor/geography-puzzle-plan-62e0',
    destination:
      'https://days-git-cursor-geography-puzzle-plan-62e0-catgeots-projects.vercel.app/play/geo',
    active: true,
  },
];

export function cloudQaShareUrl(slug) {
  return `${CLOUD_QA_SHARE_ORIGIN}/qa/${slug}`;
}

/**
 * @param {string | null | undefined} slug
 * @returns {{ slug: string, label: string, branch: string, destination: string, active: boolean } | null}
 */
export function resolveCloudQaShareLink(slug) {
  const key = String(slug || '')
    .trim()
    .toLowerCase();
  if (!key) return null;
  return (
    CLOUD_QA_SHARE_LINKS.find((link) => link.active && link.slug === key) ||
    null
  );
}

export function activeCloudQaShareLinks() {
  return CLOUD_QA_SHARE_LINKS.filter((link) => link.active);
}
