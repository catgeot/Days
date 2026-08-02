/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: 'MRT 패키지 연결',
  sessionNo: 1,
  sessionPhase: '써머리·탐색 재연결',
  branch: 'cursor/mrt-package-strip-18d2',
  previewPath: '/',
  qaShareSlug: 'package',
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
    id: '2026-08-02-mrt-package-strip',
    session: 'MRT 패키지 연결 #1, 써머리·탐색 재연결',
    title: '패키지 탭·투어 더보기·탐색 CTA 재연결',
    detail:
      '써머리 좌측에 「패키지」탭(투어 찾기 위)과 모달을 추가했습니다. 투어 모달 하단에 「패키지 더보기」가 있습니다. 탐색 홈 테마 CTA는 만료·캠페인 단축 대신 /pkc 검색·기획전·패키지 홈으로 이어집니다. 해외 장소 카드에서 패키지 탭·투어 하단 CTA를, 탐색에서 일본·가족·유럽·휴양 CTA를 확인해 주세요.',
    at: '2026-08-02',
  },
];
