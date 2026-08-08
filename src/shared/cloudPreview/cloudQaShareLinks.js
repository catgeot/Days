/**
 * 테스터용 짧은 QA 링크 SSOT.
 * 사람·에이전트 공유: https://www.gateo.kr/qa/<slug>
 * vercel.json redirects 와 동기화 유지 (slug·destination).
 */
export const CLOUD_QA_SHARE_ORIGIN = 'https://www.gateo.kr';

/** @type {{ slug: string, label: string, branch: string, destination: string, active: boolean }[]} */
export const CLOUD_QA_SHARE_LINKS = [
  {
    slug: 'scenic-hub-fill',
    label: '빈 hub 명소 보강 (평창·남해)',
    branch: 'cursor/scenic-yangyang-b772',
    destination:
      'https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=pyeongchang',
    active: true,
  },
  {
    slug: 'scenic-yangyang',
    label: '양양 GATEO 선정 명소',
    branch: 'cursor/scenic-yangyang-b772',
    destination:
      'https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=yangyang',
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
    slug: 'scenic-chip',
    label: '명승 분류칩 스크롤 고정',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea/theme/scenic',
    active: true,
  },
  {
    slug: 'scenic-nearby',
    label: '명승 내주변 관내 관광지',
    branch: 'main',
    destination: 'https://www.gateo.kr/korea/theme/scenic',
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
