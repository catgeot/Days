# 2026-07-12 프로젝트 일지

**직전**: [`2026-07-11-project-log.md`](./2026-07-11-project-log.md)

---

## 홈 모바일 — 관문 권역 범례·로고 패널 레이어

**상태**: ✅ QA 확인 (2026-07-12)

- 모바일: 3D 투어 2D 복귀 후에도 고줌이면 `GlobeClusterLegend`가 남던 문제 → `TOUR_READY`에서만 범례 UI (`showClusterLegend`)
- 로고 패널 z-index를 써머리·항공 경로 바(`z-120`) 위로 (`z-130`/`z-140`) · `FooterModal` `z-150`
- 파일: `HomeGlobeMapbox.jsx` · `LogoPanel.jsx` · `FooterModal.jsx`

---

## 카바라티 Trip 도착공항 누락 · 시네마/Trip SSOT 정렬

**상태**: ✅ QA 확인 (2026-07-12)

- **원인**: 시네마는 `airportsIndex`만으로 AGX 표시 가능 · Trip은 `rentalAirportHubs` 필수 → `aAirportCode` 누락
- **케이스**: 허브 AGX·COK · placeId `카바라티`/`kavaratti`/`아가티` — Trip `COK` · 최종·픽업 `AGX`
- **재발 방지**: `resolvePlannerFlightArrivalIata` airportsIndex last-resort · `audit:airports` `cinemaTripGap` · 가이드 §6
- `generate:airports` · `audit:airports` — `none: 0`, `cinemaTripGap: 0`

---

## 항공경로 Heuristic·dest 코퍼스 — 전면 revert

**상태**: ✅ revert (2026-07-12)

- **유지**: 카바라티 Trip SSOT(`d7c5eb7`) · 모바일 범례/로고 레이어(`56886b0`)
- **취소**: destArrivalProfile·Heuristic S1~S6·GATN seed·SEA/Americas 핫픽스 (`2a2d067`…`6c69180`)
- 런타임 복귀: **override → graph → corridor** (heuristic 제거)
- 사유: 출발지 변경·ICN 경로가 기대(플래너·기존 라인 적용)와 어긋남 → 스택 전면 취소
