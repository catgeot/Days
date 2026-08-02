/**
 * 범지구적 퍼즐 Preview QA용 배포 로그 SSOT.
 * 필·히트·룰 등 사람-visible 변경 시 맨 위에 한 줄 append.
 * 화면「배포」패널과 동기 — 커밋만 하고 여기 안 쓰면 QA에 안 보임.
 */
export const GEO_PUZZLE_DEPLOY_LOG = [
  {
    at: '2026-08-02 04:05 UTC',
    summary: 'PC 지도 월드 복제 방지',
    detail: '와이드 mercator에서 남미·남극이 좌우 반복되던 문제. renderWorldCopies off · minZoom · 대륙 fitBounds.',
  },
  {
    at: '2026-08-02 03:55 UTC',
    summary: '오세아니아→유럽 · 완료 대륙 재도전',
    detail: '섬 밀집 오세아니아를 유럽(8국)으로 교체. 완료 ✓ 대륙 칩/안내 탭 시 피스 복구·재도전.',
  },
  {
    at: '2026-08-01 03:55 UTC',
    summary: '접경 빈 틈 메움 — union 필 · disputed 포함',
    detail: '빈 공간=나라 폴리곤 틈(간소화/분쟁띠). 조립 필로 채우고 Mapbox disputed 제외 해제.',
  },
  {
    at: '2026-08-01 03:45 UTC',
    summary: '퍼즐 조각=Mapbox 경계 · 조립 윤곽만 선',
    detail: '나라마다 line 그리면 접경 이중. 필은 country-boundaries, 주황선은 union 외곽 1회.',
  },
  {
    at: '2026-07-31 21:20 UTC',
    summary: '외곽선 정리 — 본토·주요 섬만 · 선 얇게',
    detail: '필·경계는 동일 GeoJSON. 작은 섬 조각·두꺼운 line이 겹쳐 지저분해 보임. 조각 축소·line 1.35.',
  },
  {
    at: '2026-07-31 21:10 UTC',
    summary: '정답 필 = 나라 폴리곤(박스 폴백 제거)',
    detail: '타일 query 실패 시 bbox 사각형이 보이던 버그. 캠페인 GeoJSON 폴리곤 SSOT로 채움.',
  },
  {
    at: '2026-07-31 12:45 UTC',
    summary: '퍼즐 지도 mercator 고정 + GeoJSON 필 폴백',
    detail: 'PC globe에서 위성에 fill이 가려짐. 평면 고정·vector+GeoJSON(bbox) 이중 채움·진단 줄.',
  },
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
