/**
 * 테스터용 짧은 QA 링크 SSOT.
 * 사람·에이전트 공유: https://www.gateo.kr/qa/<slug>
 * vercel.json redirects 와 동기화 유지 (slug·destination).
 */
export const CLOUD_QA_SHARE_ORIGIN = 'https://www.gateo.kr';

/** @type {{ slug: string, label: string, branch: string, destination: string, active: boolean }[]} */
export const CLOUD_QA_SHARE_LINKS = [
  {
    slug: 'curation',
    label: 'AI 큐레이션',
    branch: 'cursor/blog-ai-curation-links-5aff',
    destination:
      'https://days-git-cursor-blog-ai-curation-links-5aff-catgeots-projects.vercel.app/blog/curation',
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

export function activeCloudQaShareLinks() {
  return CLOUD_QA_SHARE_LINKS.filter((link) => link.active);
}
