/**
 * 범지구적 퍼즐 Preview QA용 배포 로그 SSOT.
 * 필·히트·룰 등 사람-visible 변경 시 맨 위에 한 줄 append.
 * 화면「배포」패널과 동기 — 커밋만 하고 여기 안 쓰면 QA에 안 보임.
 */
export const GEO_PUZZLE_DEPLOY_LOG = [
  {
    at: '2026-07-31 12:30 UTC',
    summary: '보라 필 상수 실제 적용 + 화면 배포 로그',
    detail: 'PLACED_FILL_COLOR가 paint에 안 묶여 cyan 고정이던 버그 수정. 배포 패널로 tip 확인.',
  },
  {
    at: '2026-07-31 11:55 UTC',
    summary: '정답 채움색 진 보라(상수만·미적용)',
    detail: '상수 #5b21b6 선언만 하고 setPaint는 cyan 유지 — 화면 변화 없음(원인).',
  },
  {
    at: '2026-07-31 11:50 UTC',
    summary: '모바일 mercator 투영',
    detail: 'coarse/≤1023px에서 평면 지도로 country fill 안정화.',
  },
  {
    at: '2026-07-31 11:22 UTC',
    summary: 'filledIds→setFilter 경로 복원',
    detail: '정답 탭 즉시 필 · setFilter/paint 분리 · extrusion·sourcedata.',
  },
  {
    at: '2026-07-31 11:01 UTC',
    summary: '글로브 emissive 필',
    detail: 'fill-emissive-strength=1로 조명에서 면이 보이게.',
  },
  {
    at: '2026-07-31 10:39 UTC',
    summary: '찾기 정답 시 즉시 필',
    detail: '수도 퀴즈 전에 filledIds append.',
  },
];

export function getLatestDeployEntry() {
  return GEO_PUZZLE_DEPLOY_LOG[0] || null;
}
