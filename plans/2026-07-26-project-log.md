# 2026-07-26 프로젝트 일지

직전: [`2026-07-25-project-log.md`](./2026-07-25-project-log.md)

## 써머리 숙소↔투어 하단 전환 CTA

**상태**: ✅ 사람 QA OK · **push 완료** · 세션 종료

### 구현

- 숙소 모달 하단「주변 즐길거리를 탐색해 보세요」→ 투어 모달 (`openTourSignal`)
- 투어 모달 하단「편하게 묵을 숙소를 알아보세요」→ 숙소 모달 (`openStaySignal`)
- 기존 `peerOpen` 상호배타로 상대 닫힘 · 인라인 상품 목록 없음
- 상대 스트립 비대상이면 CTA 숨김 (TNA/GYG · `canShowMrtStayStrip`)

### 파일

- [`HomePlaceCardSummary.jsx`](../src/pages/Home/components/HomePlaceCardSummary.jsx)
- [`GlobeStayStrip.jsx`](../src/pages/Home/components/GlobeStayStrip.jsx)
- [`GlobeTourStrip.jsx`](../src/pages/Home/components/GlobeTourStrip.jsx)

### 세션 종료

- 릴리스 노트: 해당 없음(소소한 UX 연결) · Vercel 배포는 push 후

## 지구본 나라/지역 탐색 (1차)

**상태**: ✅ 로컬 커밋 · **push 완료** (`9b79793` 포함 · `main` `4502de2`) · 다음 세션에서 PC 배치·UX 이어가기

### 구현

- 카테고리 탭 → 면 pan + 좌측 나라/지역 칩 · 칩 클릭 시 `flyToRegion`(pitch 0)
- 같은 카테고리 재탭·우주 복귀 → 나라 목록 접기
- **카테고리 바 위치/스타일 = 배포본 유지** (모바일 좌하단 · PC 우측 상단) — 좌측 이동안은 보류

### 파일

- [`globeFaceRegions.js`](../src/pages/Home/lib/globeFaceRegions.js) · [`GlobeFaceRegionRail.jsx`](../src/pages/Home/components/GlobeFaceRegionRail.jsx)
- [`HomeUI.jsx`](../src/pages/Home/components/HomeUI.jsx) · [`index.jsx`](../src/pages/Home/index.jsx) · [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx)

### 다음

- PC에서 카테고리·나라 칩 배치 재검토 (배포 카테고리 유지 vs 좌측 통합)
- 면별 나라 목록·줌 큐레이션 다듬기 · 사람 QA 후 push/릴리스 노트 여부

## 에이전트 규칙 — UI 임의 변경 vs 커밋 보류 분리

**상태**: ✅ 문서 반영

- `.ai-context` **§4.1 5** · **1.5.1** · `AGENTS.md` · `gateo-project-context.mdc` · 커밋 `23d6545`
- Cursor User Rule「Git commit/push — verification gate」Design carve-out도 동일 취지로 갱신 (커밋 타이밍 only · 미승인 리디자인 불가)
- 「커밋 보류」는 **합의된 디자인 조율의 커밋 타이밍**일 뿐, 기능 작업 중 기존 버튼·레이아웃 교체 허가가 아님
- 계기: 탐색 범위 작업에서 버튼 디자인이 임의 교체되어 원복에 시간 소모

## 세션 종료 (규칙·Cloud 시크릿)

**상태**: ✅ push 완료 · 세션 종료

- UI 임의 변경 vs 커밋 보류 분리 · User Rule carve-out 정합 · `main` push
- Cloud Secrets: `VITE_SUPABASE_*` · `VITE_MAPBOX_TOKEN` · `TOUR_API_SERVICE_KEY` · **`SUPABASE_ACCESS_TOKEN` 검증 OK** (Edge 배포 가능)
- 다음: 지구본 PC 나라 칩 배치 QA · 릴리스 노트 해당 시만
