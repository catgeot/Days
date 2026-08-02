/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: 'MRT 패키지 연결',
  sessionNo: 3,
  sessionPhase: '숙소·투어 패키지 CTA',
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
    id: '2026-08-02-mrt-package-stay-tour-cta',
    session: 'MRT 패키지 연결 #3, 숙소·투어 패키지 CTA',
    title: '숙소·투어 「패키지 상품보기」 CTA',
    detail:
      '투어 모달 문구를 「{지역} 패키지 상품보기」로 바꿨고, 숙소 모달 하단에도 같은 CTA를 넣었습니다. 더블린 등 해외 장소에서 숙소·투어 모달 하단에 「더블린 패키지 상품보기」가 보이는지 확인해 주세요.',
    at: '2026-08-02',
  },
  {
    id: '2026-08-02-mrt-package-summary-revert',
    session: 'MRT 패키지 연결 #2, 써머리 탭·모달 폐기',
    title: '써머리 패키지 탭·모달 제거',
    detail:
      '패키지 목록 API가 없어 써머리 「패키지」탭과 모달을 폐기했습니다. 탐색 홈 CTA 재연결과 투어 모달 패키지 딥링크는 유지됩니다.',
    at: '2026-08-02',
  },
  {
    id: '2026-08-02-mrt-package-strip',
    session: 'MRT 패키지 연결 #1, 써머리·탐색 재연결',
    title: '탐색 CTA 재연결 · (이후 써머리 탭 폐기)',
    detail:
      '탐색 홈 테마 CTA를 /pkc 검색·기획전·패키지 홈으로 재연결했습니다. 써머리 패키지 탭·모달은 #2에서 폐기.',
    at: '2026-08-02',
  },
];
