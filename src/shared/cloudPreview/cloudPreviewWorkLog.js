/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: '축제 페이지',
  sessionNo: 1,
  sessionPhase: '시간 탭 실제 건수',
  branch: 'cursor/korea-time-list-16a3',
  previewPath: '/korea',
  qaShareSlug: 'korea',
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
    id: '2026-08-03-korea-time-list-actual-counts',
    session: '축제 페이지 #1, 시간 탭 실제 건수',
    title: '시간 탭 목록·건수 실제 반영',
    detail:
      '목록 48건 상한을 제거해 지금·주말·이번 달·계절 탭이 필터 결과 전체를 보여 줍니다. 메타·시간 칩에 실제 건수, 리스트는 시작일 순입니다. /korea에서 탭을 바꿔 건수가 달라지는지 확인해 주세요.',
    at: '2026-08-03',
  },
];
