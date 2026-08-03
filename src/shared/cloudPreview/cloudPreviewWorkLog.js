/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: '지구본 나라 목록',
  sessionNo: 4,
  sessionPhase: '중분류 좌우 스크롤',
  branch: 'cursor/globe-neighbor-list-15b3',
  previewPath: '/',
  qaShareSlug: 'globe',
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
    id: '2026-08-03-globe-mid-hscroll-full',
    session: '지구본 나라 목록 #4, 중분류 좌우 스크롤',
    title: '중분류 스크롤 바를 화면 거의 전체 폭으로',
    detail:
      '중분류 바가 좌측 절반에 묶이던 것을 뷰포트 폭으로 풀었습니다. 나라·카테고리 칩은 왼쪽 그대로입니다. 홈(모바일)→도시에서 중분류 바가 화면 가로로 넓게 보이는지 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-globe-mid-hscroll',
    session: '지구본 나라 목록 #4, 중분류 좌우 스크롤',
    title: '모바일 중분류 칩 좌우 스크롤 복구',
    detail:
      '중분류 칩이 가로로 늘어나 잘리던 문제를 min-w-0·너비 고정으로 고쳤습니다. 홈→도시(유럽)에서 서유럽~소국·공국 칩을 좌우로 밀어 끝까지 보이는지 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-globe-mid-microstates',
    session: '지구본 나라 목록 #3, 중분류·소국 재편',
    title: '중분류를 직관 권역으로 나누고 소국·공국 분리',
    detail:
      '유럽은 서유럽·영국·남유럽·북유럽·중동유럽·소국·공국·북극으로 나누고, 아시아도 동남아/남아시아·중동/중앙아시아로 쪼갰습니다. 중분류 안 나열은 인접국 연쇄를 유지합니다. 홈→도시(유럽)에서 소국·공국 칩과 흐름을 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-02-country-scroll-top',
    session: '지구본 나라 목록 #2, 스크롤 상단 시작',
    title: '나라 리스트 스크롤을 상단에서 시작',
    detail:
      '나라가 많아 스크롤이 생길 때 기본 위치를 하단이 아니라 상단으로 맞췄습니다. 짧은 목록의 하단 고정 배치는 그대로입니다. 홈→권역→중분류에서 긴 나라 목록이 위에서부터 보이고 아래로 스크롤되는지 확인해 주세요.',
    at: '2026-08-02',
  },
  {
    id: '2026-08-02-neighbor-chain',
    session: '지구본 나라 목록 #1, 인접국 연쇄 정렬',
    title: '중분류 나라 목록을 인접국 연쇄로 정렬',
    detail:
      '중분류 나라 목록을 인기·시드 순이 아니라 좌표 기준 인접국 연쇄로 이어 보이게 바꿨습니다. 홈→권역→중분류에서 목록이 이웃 나라끼리 이어지는지 확인해 주세요.',
    at: '2026-08-02',
  },
];
