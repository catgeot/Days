/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: 'AI 큐레이션',
  sessionNo: 3,
  sessionPhase: '홈 진입 연결',
  branch: 'cursor/blog-ai-curation-links-5aff',
  previewPath: '/blog/curation',
  qaShareSlug: 'curation',
};

/** @returns {string} 예: Cloud 작업 규칙 #1, 이어하기·Preview 고정 */
export function cloudPreviewSessionLabel(project = cloudPreviewProject) {
  return `${project.title} #${project.sessionNo}, ${project.sessionPhase}`;
}

/**
 * @type {{ id: string, session: string, title: string, detail: string, at: string }[]}
 * 최신이 배열 앞.
 */
export const cloudPreviewWorkLog = [
  {
    id: '2026-08-02-curation-home-entry',
    session: 'AI 큐레이션 #3, 홈 진입 연결',
    title: '홈 → AI 큐레이션 바로가기',
    detail:
      '홈 로고 아래 「AI 큐레이션」칩으로 /blog/curation에 바로 들어갈 수 있습니다. 낙원 탐색·리치 팁·나의 목록·「전체 지도에서 보기」홈 복귀를 확인해 주세요.',
    at: '2026-08-02',
  },
  {
    id: '2026-07-31-curation-hub-bc',
    session: 'AI 큐레이션 #2, 인페이지 허브',
    title: '/blog/curation 인페이지 허브',
    detail:
      '전용 페이지에서 낙원 탐색·whyHidden/bestSeason/tips·나의 큐레이션 목록 복원을 담았습니다. 지구본·장소카드 CTA는 보조입니다.',
    at: '2026-07-31',
  },
  {
    id: '2026-07-31-curation-phase-a',
    session: 'AI 큐레이션 #1, 연결·비로그인',
    title: '지구본·장소카드·무니 연결',
    detail:
      '큐레이션 결과를 홈 써머리·장소카드·무니로 넘기고, 비로그인 탐색·이미지/좌표 로직을 고쳤습니다.',
    at: '2026-07-31',
  },
];
