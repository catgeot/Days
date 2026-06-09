# 2026-06-09 project log

이전: [`2026-06-08-project-log.md`](2026-06-08-project-log.md)

## 홈 지구본 — 3D 투어 후 이동 가능 경계선 (Phase 1i)

- **기능**: `TOUR_READY` 직후 Mapbox Isochrone — 도보 20분(초록 점선)·차량 45분(파란 실선 외곽)
- **신규**: `globeReachBoundaries.js` · `HomeGlobeMapbox` 범례·로드/클리어 · `easeCameraForReachReveal`
- **수정**: `globeMapboxLabelPolicy` — `gateo-reach-*` 지명 정책 숨김 제외 (표시 후 즉시 사라짐 fix)
- **스타일**: fill 제거 · 차량 `polygons=true`+generalize(지그재그 외곽 완화) · `line-dasharray` paint
- **QA**: 다낭 로컬 Pass (사파·나트랑 동일 흐름)
- **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md) §Phase 1i

## 다음 (선택)

- Phase 1g gateo 스모크 · slug별 isochrone 분 튜닝 · 릴리스 노트 합의
