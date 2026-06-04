# 2026-06-04 프로젝트 일지 — 3D 투어 Summary 데스크톱 풀 카드 복원

**직전**: [`2026-06-03-project-log.md`](2026-06-03-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## 제품 결정

- **모바일(`<lg`)** 3D 투어: Summary 숨김 + 헤더 **`TourMobileBar`** 컴팩트 UI 유지.
- **데스크톱(`lg+`)** 3D 투어: Summary **풀 카드** 복원 — 설명·「3D 투어」·MOONi 버튼 노출 (`isCompact` prop 제거).

## 구현

- [`index.jsx`](../src/pages/Home/index.jsx): `PlaceCardSummary`에서 `isCompact={isTourActive && !isMobileViewport}` 제거.
- [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md): 제품 목표·SSOT 표 갱신.

## QA

- 로컬 Pass: 데스크톱 투어 중 풀 Summary · 모바일 투어 중 `TourMobileBar`만 표시.
