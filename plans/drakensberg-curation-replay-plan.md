# 드라켄즈버그 — 큐레이션 재실행 계획 (의도 스펙)

**세션 계열**: `드라켄즈버그 #N` · 고정 브랜치 `cursor/drakensberg-geocode-03a1` · PR #115  
**공유**: `https://www.gateo.kr/qa/drakensberg`  
**Preview**: `https://days-git-cursor-drakensberg-geocode-03a1-catgeots-projects.vercel.app/`

**현재 (기준점)**: tip = `main`과 동일 코드. 오늘 R1–R3·클릭 패치 **전부 취소**.  
사람 QA로 아래 재현식을 tip=main Preview에서 먼저 판정한 뒤에만 R1→R2→R3를 하나씩 올린다. 추정 패치·일괄 재적용 금지.

원천 클릭/네비 버그를 고친 뒤(또는 tip=main에서 미재현이면 도입 커밋 격리 후), 아래 순서만 깨끗이 재적용한다. SHA·추정 패치 나열 금지.

## 고정 재현식 (회귀 게이트)

1. 큐레이션(또는 홈)에서 장소 → 장소카드  
2. 지구본 홈 복귀  
3. 써머리 **X** (닫기 자체 OK)  
4. **AI 큐레이션** 클릭  
5. **Pass**: `/blog/curation` 진입만 (지도 포커스·써머리 없음)  
6. 써머리가 떠도 닫기 후 확장 장소카드로 갖히지 않음  

추가 Pass: 장소카드 ← → 큐레이션 · 무니 닫기 → 큐레이션

## R1 — 산맥 지오코딩 · 갤러리 한 문단

**의도**

- Mapbox 비시설 검색에서 `place` > `address` (Pretoria Central Drakensberg 오탐 방지)
- 산맥·국립공원 쿼리에서 address 강등 · Mountains/산맥 별칭으로 place 히트 보강
- 짧은 PLACE_OVERVIEW(큐레이션 2~3문장)는 문장 쪼개기 없이 한 문단

**파일**

- `src/pages/Home/lib/geocoding.js`
- `src/components/PlaceCard/common/placeOverviewText.js` (`splitOverviewParagraphs`)
- `scripts/smoke-geocode-natural-place.mjs`
- `package.json` → `smoke:geocode-natural-place`

**VERIFY**: `npm run smoke:geocode-natural-place` · `npm run build`  
**사람 QA**: 큐레이션에서 드라켄즈버그 재추천 → 3D 투어가 산맥권 · 갤러리 overview 한 문단

## R2 — 큐레이션 써머리 제목

**의도**

- 큐레이션 박스 제목 「이 곳을 추천한 이유」
- 검색 연결 시 기존 「검색어」문구 유지
- 아래 무니 여행지 요약과 시각적으로 구분 (PC/모바일 갤러리)

**파일**

- `src/components/PlaceCard/common/placeOverviewText.js` (`curationOverviewHeading`)
- `src/components/PlaceCard/views/GalleryInfoView.jsx`
- `src/components/PlaceCard/views/PlaceGalleryView.jsx`

**VERIFY**: `npm run smoke:geocode-natural-place` · `npm run build`  
**사람 QA**: 큐레이션→장소카드 갤러리 — 보라 박스에 제목, 무니 요약과 구분

## R3 — 큐레이션 복귀 네비

**의도**

- 큐레이션에서 연 장소카드 뒤로가기 → `/blog/curation`
- 큐레이션→무니 닫기 → `/blog/curation` (`mooniReturnTo` 분리)
- 장소카드 returnTo에 `/blog/curation` 허용

**파일**

- `src/pages/Home/lib/placeReturnTo.js` (`CURATION_PLACE_RETURN_PATH`, mooni helpers)
- `src/pages/DailyReport/components/CurationHub.jsx`
- `src/components/PlaceCard/panels/PlaceChatPanel.jsx`
- `src/pages/Home/index.jsx` (무니 닫기 시 `consumeMooniReturnTo`)
- `scripts/smoke-curation-return-to.mjs`
- `package.json` → `smoke:curation-return-to`

**VERIFY**: `npm run smoke:curation-return-to` · `npm run build`  
**사람 QA**: 장소카드 ← → 큐레이션 · 무니 닫기 → 큐레이션 · **재현식 전체 Pass**

## 재적용 금지 (폐기)

다음을 “클릭 투과·갖힘” 치료로 **다시 쓰지 않는다**.

- HomeUI `z-[58]` 올리기
- `onChromePointerDown` + 800ms 지도 클릭 타임가드
- `cancelPendingGlobeClick` / `globeClickEpochRef` epoch 무효화
- `goHomeFromPlace`의 `navigate('/', { replace: true })` + `placeRouteSyncRef` 무효화를 투과 치료로 쓰는 방식

루트 수정 후 네비에 **정말** 필요한 최소분만 R3에 흡수한다. z-index·타임가드·epoch는 최후 수단이며 위 폐기 목록과 동일하면 채택하지 않는다.

## 적용 순서

1. 원천 버그 수정 (재현식 Pass)  
2. R1 → 사람 QA  
3. R2 → 사람 QA  
4. R3 → 사람 QA (재현식 포함)  
