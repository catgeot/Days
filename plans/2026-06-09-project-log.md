# 2026-06-09 project log

이전: [`2026-06-08-project-log.md`](2026-06-08-project-log.md)

## 홈 지구본 — 3D 투어 후 이동 가능 경계선 (Phase 1i)

- **기능**: `TOUR_READY` 직후 Mapbox Isochrone — 도보 20분(초록 점선)·차량 30분(파란 도달 영역)
- **신규**: `globeReachBoundaries.js` · `HomeGlobeMapbox` 범례·로드/클리어 · `easeCameraForReachReveal`
- **수정**: `globeMapboxLabelPolicy` — `gateo-reach-*` 지명 정책 숨김 제외
- **QA**: 다낭 로컬 Pass

## Phase 1i 시각·UX 조정

- 차량 fill 16% · 30분 · 범례 모바일 시네마 표시 · 계획 §1i 갱신

## 클룩 렌터카 홈 검색 안내 (la-reunion)

- `klookRentalHomeSearchLabel` · `audit:airports` none 0

## 홈 지구본 Phase 2~3 — 탐색 내비 · 권역 hull·POI (초안 커밋 a25f237)

- **Phase 3**: `globeClusterBoundaries.js` · amber hull + sibling POI · `focusSlug`
- **Phase 2 초안**: +/−/나침반 · flyTo 3.0 시도 — 이후 아래 세션에서 정리

## Phase 2 정리 — 탐색 내비 UI 폐기 (2026-06-09)

- **결정**: +/−/나침반 불필요(pinch·휠 충분) — `GlobeExploreNavControls.jsx` 삭제 · 우상단 **공유·GPS·우주**만
- **유지**: 공유 URL `?lat=&lng=&zoom=` **복원**(링크 열 때 카메라 1회 jumpTo)
- **복귀**: `executeFocus` flyTo min **`GLOBE_VIEW.flyZoom`(2.35)** — 시행착오 확정값 · **변경 금지** (`.ai-context` 3절·계획 §Phase 2)
- **제거**: explore auto-rotate guard · `shouldShowGlobeExploreNav` · `hasPlaceSummary` prop
- **UI fix**: GPS(초록)·우주(파랑) 버튼 색상 Tailwind 충돌 복구
- **빌드**: `npm run build` Pass · 사용자 QA Pass

## 모바일 3D 투어 — TOUR_READY pivot · TourMobileBar (2026-06-09)

- **`TOUR_READY` pivot**: 다른 지명 클릭 시 `pivotTourExplore` — center만 `easeTo`(flyTo 없음) · isochrone 갱신 · `tourPivoted` 시 **3D 투어** 버튼
- **`TourMobileBar`**: 우측 **X** 탈출(`endTour`+선택 해제) · Skip/2D/3D 투어 분기
- **우주 버튼**: 3D 투어 중 클릭 시 `endTour` 선행(terrain 해제·`globe2d`) 후 우주 뷰 — 2D 복귀 버튼·경계 범례 함께 제거
- **QA**: 모바일 pivot·X · PC 우주 복귀 — 사용자 Pass

## 다음 (선택)

- Phase 3 hull smoke(patagonia·iceland) · Phase 1g gateo 스모크 · 릴리스 노트 합의
