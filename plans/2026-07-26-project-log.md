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

## 지구본 나라/지역 탐색 (2차) — PC 카테고리 좌측

**상태**: ✅ 사람 QA OK · **push 완료** · 세션 종료

### 변경

- **PC만** 카테고리 바를 좌측 중세로 이동 (버튼 디자인 유지)
- 선택 시 옆에 나라/지역 칩 · 권역 범례 좌측 · **연관 키워드 우측** (티커 확장 시 숨김)
- **PC**: 장소 카드와 나라 메뉴 병존 · **나라 칩 클릭 시** 써머리만 닫고 flyTo
- **모바일**: 카드↔나라 상호 배타 · 나라 메뉴 하단(카테고리 근접) · **세부 메뉴 토글 노브**(펼침 시에만 목록)
- 모바일 카테고리 바 배포본 클래스 복원

### 파일

- [`HomeUI.jsx`](../src/pages/Home/components/HomeUI.jsx) · [`index.jsx`](../src/pages/Home/index.jsx)

### 다음

- 면별 나라 목록·줌 큐레이션 다듬기 · 릴리스 노트 여부(해당 시)

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

## 세션 종료 (지구본 나라 탐색 2차)

**상태**: ✅ push 완료 · 세션 종료

- PC 카테고리 좌측·연관키워드 우측·나라 포커스 시 카드 닫기 · 모바일 세부메뉴 토글
- 릴리스 노트: 해당 시만(후속 큐레이션 후 검토)
- 다음: 면별 나라 목록·줌 큐레이션

## 지구본 나라 포커스 — fitBounds · 지명 · 하이라이트

**상태**: ✅ 사람 QA OK · **push 완료** · 세션 종료

### 구현

- 나라별 `bbox` / 대형·열도 `hubBbox` · `flyToRegion` → `cameraForBounds` + padding + maxZoom 6.4
- 라벨: `country-label` ≥2.5 · settlement/place ≥4.0
- 선택 나라: Mapbox Streets `admin` 국경 앰버 하이라이트 (bbox 사각형 폐기)
- 파일: `globeFaceRegions.js` · `globeRegionHighlight.js` · `globeZoomPolicy.js` · `globeMapboxLabelPolicy.js` · `HomeGlobeMapbox.jsx` · `index.jsx`

### 세션 종료

- 릴리스 노트: 해당 없음(기존 나라 탐색 UX 보강) · Vercel은 push 후

## 지구본 나라 칩 — 권역 배타 (세션 종료)

**상태**: ✅ 로컬 커밋 · **사람 QA·디자인·push는 다음 세션** · 릴리스 노트 해당 시만

### SSOT (오매칭 금지)

- 카테고리 라벨 = **지리 권역 UX** ≠ `TRAVEL_SPOTS` 테마/휴양지 필터
- 면당 **배타** (중첩 0) · [`globeCountryCatalog.js`](../src/pages/Home/lib/globeCountryCatalog.js) · [`globeFaceRegions.js`](../src/pages/Home/lib/globeFaceRegions.js)
- paradise: 한국 중심 아시아·남태평양(호주 포함) · nature: 아프리카·서인도양(**모리셔스·세이셸**) · urban: 유럽·북극 · culture: 북미·중미·카리브·알래스카 · adventure: 남아메리카(+주변)
- `.ai-context` §3「나라 칩 (권역≠테마)」·§6「나라 칩 권역」에도 동일

### 다음 세션

- 제시어: `지구본-나라칩-이어하기`
- 사람 QA·스크롤/레일 디자인 점검 · `main` ahead 커밋 push 여부

## 지구본 PC 소권역 칩 (면 안 세분화)

**상태**: ✅ 사람 QA OK · **커밋·push 완료** · 세션 종료 · 모바일 미변경(후속)

### 구현

- SSOT [`globeFaceSubregions.js`](../src/pages/Home/lib/globeFaceSubregions.js) — 면·소권역 배타 · ≤12국 면은 칩 생략
- PC: 대면 옆 소권역 칩 → 필터된 나라 칩 · 기본=첫 소권역(「전체」없음)
- 나라 리스트 **고정 높이** · 글라스 스크롤바 · PC 카테고리 `top-[calc(50%+2rem)]`
- 모바일: 현행 flat 나라 레일 유지
- 휴양/자연/도시만 소분류 · 문화·모험 생략 · 5대면·권역≠테마 유지

### 세션 종료

- 릴리스 노트: 해당 없음(소소한 UX) · Vercel은 push 후
- 후속(선택): 모바일 그룹 헤더 또는 소분류 칩

## 나라 포커스 — Countries v1 육지 fill (확정)

**상태**: ✅ 사람 QA OK · **커밋·push 완료**

### 결정

- fill **딥 보라 `#7c3aed`** + 국경선 **앰버 `#fbbf24`** (Streets admin0)
- 톤 다운 = **fit 도착 줌 상대**(소국 고줌 fit도 도착 시 peak) · 추가 확대 시에만 옅어짐
- 우주 복귀·나라 전환 시 clear

### 세션 종료

- 릴리스 노트: 해당 없음(기존 나라 탐색 UX 보강)

## 지구본 모바일 소권역 칩 (하단 선택바)

**상태**: ✅ 사람 QA OK · **커밋·push 완료**

### 구현 (로컬 조율 후)

- 모바일: 소권역을 **하단 가로 선택바** (`GlobeFaceSubregionBar`) · 카테고리 바 바로 위
- 하단 스택: 나라 리스트(토글 기준 하단 정렬) → 세부 메뉴 토글 → 세부칩 → 카테고리(세이프영역)
- 세부 메뉴 토글이 나라 리스트·세부칩을 함께 여닫음
- 스크롤 가능 시 커스텀 스크롤바 항시 표시(나라=좌측 · 세부칩=하단) · 「더보기」앰버 힌트
- 툴 버튼과 안 겹치게 세부칩은 내용 폭 · PC 세로 칩 유지
- PR #28 브랜치 로컬 merge 후 조율 · `main` push

### 파일

- [`GlobeFaceRegionRail.jsx`](../src/pages/Home/components/GlobeFaceRegionRail.jsx) · [`HomeUI.jsx`](../src/pages/Home/components/HomeUI.jsx) · [`globeFaceSubregions.js`](../src/pages/Home/lib/globeFaceSubregions.js)

### 세션 종료

- 릴리스 노트: 해당 없음(소소한 UX) · Vercel은 push 후

## 모바일 세부메뉴 토글 · UK 구성국 칩

**상태**: ✅ 사람 QA OK · **커밋·push 완료** (`4f5457f`) · 세션 종료

### 변경

- **모바일**: 세부 메뉴 토글 세션 전역 — OFF 시 카테고리로 나라 리스트 재오픈 안 함 · OFF 시인성(앰버 `메뉴 숨김`) · 진입 시 기본 ON · PC 무변경
- **영국 구성국**: 영국(전체) + 잉글랜드·스코틀랜드·웨일스·북아일랜드 · `iso3166_2` GeoJSON fill
- urban 서·남유럽 소권역·우선순위에 구성국 포함

### 파일

- [`HomeUI.jsx`](../src/pages/Home/components/HomeUI.jsx) · [`globeRegionHighlight.js`](../src/pages/Home/lib/globeRegionHighlight.js) · [`globeCountryCatalog.js`](../src/pages/Home/lib/globeCountryCatalog.js) · [`globeSubdivisionUk.json`](../src/pages/Home/data/globeSubdivisionUk.json) · [`globeFaceRegions.js`](../src/pages/Home/lib/globeFaceRegions.js) · [`globeFaceSubregions.js`](../src/pages/Home/lib/globeFaceSubregions.js) · [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx)

### 세션 종료

- 릴리스 노트: 해당 없음(소소한 UX) · Vercel은 push 후

## 에스와티니·레소토 — 항공경로/투어 누락

**상태**: ✅ smoke 25/25 · 로컬 커밋 `ac6dc43`·`b339cfb` · **세션 종료** · push 미실시(사람 요청 시)

### 원인

- **에스와티니**: 본토 국내선 억제의 `KOREA_AIRPORT_IATAS`에 `SHO` 포함 → ICN→SHO 국내선 오인·버튼 숨김 (`SHO`=에스와티니 · 구 속초는 YNY)
- **레소토 투어**: 나라 단위 핀에 `name_en` 없으면 GYG q null
- **둘 다 직항 arc**: hub 조회 `topN:1`이 직항을 고르면 경유 후보가 있어도 직항으로 그림 · SHO는 OF 미연결 · MSU/SHO=`large_airport`라 장거리 graph-direct 필터 미적용

### 조치

- `SHO` 제거 · 써머리 Edge hub 선행 조회 · GYG `country_en` 폴백(나라 단위 핀만)
- dest hub 폴백 `MSU/SHO → DXB·JNB` · hub 조회 topN:3 + 경유 우선 · 장거리 graph-direct(≥8h) 폐기
- smoke: `ICN → DXB → JNB → MSU/SHO`

### QA

- 에스와티니·레소토: 항공 경로 버튼 · **경유 arc(DXB→JNB)** · 레소토 투어 찾기
- Edge `resolve-flight-route` geo 필터는 재배포 시 서버에도 동일 적용
