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

## 범지구적 퍼즐 — 찾기 정답 즉시 필 채움

- **동작**: 문제 리스트(트레이) 피스 선택 → 지구본 해당 위치 탭 → **맞으면 즉시 필(cyan) 채움** → 수도 4지선다로 별 확정.
- **히트**: ISO 벡터 + bbox + 픽셀 스냅 폴백.
- **트레이**: 클리어된 피스는 목록에서 제외(남은 문제만).
- Preview: 고정 브랜치 `/play/geo`.

## 범지구적 퍼즐 — 글로브 fill 미표시 수정

- **원인**: Mapbox GL v3 글로브 조명에서 fill이 어두워져 **라인만** 보임. 힌트/클리어도 윤곽만.
- **수정**: `fill-emissive-strength`/`line-emissive-strength`=1 · cyan opacity↑ · ISO 필터를 홈 하이라이트와 동일(`==`) · 정답 시 힌트 금색이 placed를 덮지 않음.
- 로컬 QA: 한국 탭→cyan 필 · 힌트→금색 필 확인.

## 범지구적 퍼즐 — 초기 MVP 필 경로 복원

- **차이 파악**: `ef6be28`는 정답 시 `setFilledIds` 즉시 → `filledIds` prop → `setFilter(PLACED_FILL)`. 합의 룰(`6799d3b`) 이후 session/cleared 파생·paint try 묶음으로 경로가 달라짐.
- **복원**: 정답 탭 → `filledIds` 즉시 append(초기 `applyCorrect`) · ISO 필터=`ef6be28` match · setFilter와 paint try 분리 · fill-extrusion 보조 · sourcedata 재동기화.
- Preview QA 대기.

## 범지구적 퍼즐 — 모바일 필 (mercator)

- **원인**: 모바일(특히 iOS) 글로브 투영에서 country-boundaries **fill이 안 그려지는** 경우가 많음(라인만 보임). PC 로컬은 OK.
- **수정**: coarse/≤1023px → `projection: mercator` · fill opacity 0.72 · extrusion은 글로브만.
- QA: 고정 Preview `/play/geo` 모바일 — 평면 지도 + cyan 면 채움.

## 범지구적 퍼즐 — 필 미적용 원인 + 화면 배포 로그

- **원인**: `540c5b3`가 `PLACED_FILL_COLOR=#5b21b6` 상수만 추가하고 `setPaint`/`addLayer`는 `#22d3ee` 고정 → 「보라로 바꿨다」고 해도 Preview 변화 없음.
- **수정**: paint·extrusion·syncFills에 상수 실제 연결 · `/play/geo` 우상단 **배포** 패널(수정일·요약·필 개수·투영).
- **에이전트**: tip 올릴 때 `geoPuzzleDeployLog.js` 맨 위 append 필수 — 패널 문구가 안 바뀌면 배포 미반영.
- QA: 고정 Preview `…geography-puzzle-plan-62e0…/play/geo` — 패널에 `2026-07-31 12:30 UTC` · 정답 시 **진 보라** 면.
