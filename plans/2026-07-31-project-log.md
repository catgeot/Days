# 2026-07-31 프로젝트 일지

직전: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)

## 범지구적 퍼즐 — UI #31 고정 + 합의 룰

- **결정**: 인터페이스 = PR #31 `/play/geo` 셸(헤더·전용 글로브·대륙 칩·실루엣 트레이). 홈 지구본 카테고리/면 메뉴 재사용은 **판단 철회**.
- **룰**: 대륙 → 나라 피스 선택 → 지구본 찾기 탭 → 수도 4지선다 → 별/재도전 (힌트=fitBounds·하이라이트, 별 −1).
- **브랜치**: 고정 `cursor/geography-puzzle-plan-62e0` (PR [#31](https://github.com/catgeot/Days/pull/31)) · tip은 #41 내용을 fast-forward. 세션용 `cursor/global-puzzle-ui31-rules-154b`([#41](https://github.com/catgeot/Days/pull/41))는 동일 tip 백업.
- **Mapbox Preview (1회 등록)**: `https://days-git-cursor-geography-puzzle-plan-62e0-catgeots-projects.vercel.app` + `/play/geo` — 해시 URL(`days-xxxxx-…`) 등록 금지.
- **Cloud 규칙 일반화**: `AGENTS.md` Cloud「고정 브랜치 · Mapbox Preview URL」· `.ai-context` 1.5.2 · Rule — **전 주제** 이어하기 시 열린 feature 브랜치 재사용(세션마다 새 Preview 브랜치 금지).
- **VERIFY**: `audit:geo-puzzle` · `smoke:global-puzzle` · `build` PASS.
- **QA (Preview)**: 고정 브랜치 URL `/play/geo` — 실루엣 트레이·슬롯 · 찾기→수도→별 · 홈 카테고리 회귀 없음.
