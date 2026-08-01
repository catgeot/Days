/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: 'Cloud 작업 규칙',
  sessionNo: 1,
  sessionPhase: '짧은 QA 링크',
  branch: 'cursor/cloud-preview-continuity-8320',
  previewPath: '/korea',
  /** 테스터 공유용 — www.gateo.kr/qa/<slug> (main 반영 후) */
  qaShareSlug: 'cloud-rules',
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
    id: '2026-08-01-qa-short-link',
    session: 'Cloud 작업 규칙 #1, 짧은 QA 링크',
    title: '테스터용 짧은 QA 링크',
    detail:
      '긴 Vercel 주소 대신 www.gateo.kr/qa/<slug> 로 공유합니다. 예: /qa/puzzle → 퍼즐 Preview. 목록은 /qa · SSOT는 cloudQaShareLinks.js · vercel.json redirects와 동기화.',
    at: '2026-08-01',
  },
  {
    id: '2026-08-01-cloud-continuity',
    session: 'Cloud 작업 규칙 #1, 이어하기·Preview 고정',
    title: 'Cloud 이어하기·작업 로그 규칙',
    detail:
      '같은 주제는 고정 브랜치·동일 git Preview URL을 재사용합니다. 세션 표기는 「주제 #N, 단계」형식입니다. Preview 우측 「작업 로그」에 이번 적용분을 남기고, 턴 종료 시 Preview 링크를 제공합니다.',
    at: '2026-08-01',
  },
];
