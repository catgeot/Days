# 2026-06-09 project log

이전: [`2026-06-08-project-log.md`](2026-06-08-project-log.md)

## 홈 지구본 — 3D 투어 후 이동 가능 경계선 (Phase 1i)

- **기능**: `TOUR_READY` 직후 Mapbox Isochrone — 도보 20분(초록 점선)·차량 30분(파란 도달 영역)
- **신규**: `globeReachBoundaries.js` · `HomeGlobeMapbox` 범례·로드/클리어 · `easeCameraForReachReveal`
- **수정**: `globeMapboxLabelPolicy` — `gateo-reach-*` 지명 정책 숨김 제외 (표시 후 즉시 사라짐 fix)
- **스타일(초기)**: 차량 외곽 실선만 · `line-dasharray` paint
- **QA**: 다낭 로컬 Pass (사파·나트랑 동일 흐름)

## Phase 1i 시각·UX 조정 (후속)

- **범례**: 모바일 투어 시네마(`hideTourControls`)에서도 `createPortal`+`z-55`로 좌하단 표시
- **차량 표현**: 거리 원·도로 지그재그 외곽선 폐기 → 업계 표준 **Isochrone 폴리곤 fill**(opacity 16%)+외곽선 · `generalize=500m`
- **차량 시간**: 45분 → **30분** (주변 당일치기 구간 · 도보 20분과 역할 분리)
- **범례 문구**: 도보 보행 경로 · 차량 운전 도달 영역
- **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md) §Phase 1i 갱신

## 클룩 렌터카 홈 검색 안내 (la-reunion)

- **`klookRentalHomeSearchLabel`**: 렌터카 홈·타임라인 — IATA 대신 공항명 안내 (`resolveKlookRentalHomeSearchLabel`)
- **예외**: `la-reunion` → `롤랑 가로스 공항` · `generate:airports`가 `klookRental*` 필드 전달
- **QA**: `npm run audit:airports` — banner none 0

## 다음 (선택)

- Phase 1g gateo 스모크 · slug별 isochrone 분 튜닝 · 릴리스 노트 합의
