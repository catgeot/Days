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

**상태**: ✅ 로컬 커밋 · **push 대기** · 다음 세션에서 PC 배치·UX 이어가기

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
