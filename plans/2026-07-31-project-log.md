# 2026-07-31 프로젝트 일지

직전: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)

## 범지구적 퍼즐 — UI #31 고정 + 합의 룰

- **결정**: 인터페이스 = PR #31 `/play/geo` 셸(헤더·전용 글로브·대륙 칩·실루엣 트레이). 홈 지구본 카테고리/면 메뉴 재사용은 **판단 철회**.
- **룰**: 대륙 → 나라 피스 선택 → 지구본 찾기 탭 → 수도 4지선다 → 별/재도전 (힌트=fitBounds·하이라이트, 별 −1).
- **브랜치**: `cursor/global-puzzle-ui31-rules-154b` (base = #31 tip `88c9da9`) · tip `6799d3b` · PR [#41](https://github.com/catgeot/Days/pull/41).
- **VERIFY**: `audit:geo-puzzle` · `smoke:global-puzzle` · `build` PASS.
- **QA (Preview)**: `/play/geo` — 실루엣 트레이·슬롯 아웃라인 유지 · 나라 선택 후 미리 포커스 없음 · 힌트·수도·별 · 홈 카테고리 회귀 없음.
