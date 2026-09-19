# 국내 여행지·숙소·갤러리 매칭 아키텍처 혁신 및 다세션 실행 계획

**상태**: 준비 완료 (Draft Plan) · 다세션 실행 대기  
**역할**: Mapbox/Nominatim 의존과 개별 하드코딩 오버라이드 누적으로 인한 오탐(예: 광천선굴→광주 광천동, 종각역→대구 종각네거리, 화장실/휠체어 갤러리 노출)을 근본적으로 해소하고, 지자체·TourAPI·MRT 숙소 매칭 파이프라인을 체계화하는 다세션 로드맵.  
**기반 분석**: 직전 분석 세션 보고서 (`gateo.kr 국내 여행지·지명·숙소·갤러리 매칭 파이프라인 심층 분석 및 아키텍처 혁신 보고서`)  
**연관 규칙**: [`plans/docs-on-main-workflow.md`](./docs-on-main-workflow.md) · [`plans/cloud-preview-continuity.md`](./cloud-preview-continuity.md) · [`.ai-context.md`](../.ai-context.md)

---

## 1. 배경 및 핵심 문제 진단

gateo.kr은 "여행지 중심 정보 제공" 사이트로서 사용자가 여행지를 검색하거나 내 위치 주변을 탐색할 때 최적의 숙소, 갤러리, 관광 정보를 제공해야 한다.  
그러나 현재 파이프라인은 다음과 같은 구조적 한계와 기술 부채를 안고 있다.

### 1.1 주요 증상과 원인
1. **해외 엔진(Mapbox, OSM/Nominatim) 기반 지오코딩의 국내 지명 한계**:
   - 한국어 자연명소, 동굴, 계곡, 정자 등은 글로벌 OSM 데이터셋에 없거나 동음이의어(행정구역 `동/리/읍/면`)에 밀려 엉뚱한 광역시/도 단위로 튀는 현상 발생 (예: 평창 「광천선굴」 검색 시 광주 서구 「광천동」으로 오탐).
   - 약칭(대포, 종각, 연신내, 강원대 등) 검색 시 전국 각지의 동음이의어 또는 상가/광장으로 스냅되어 수백 km 떨어진 숙소가 추천됨.
2. **파편화된 하드코딩 사전의 증식 및 회귀 위험**:
   - `KO_STATION_ALIASES`, `KO_UNIVERSITY_ALIASES`, `KO_SCENIC_POI_ALIASES`, `MRT_STAY_KEYWORD_OVERRIDES`, `GALLERY_QUERY_OVERRIDES` 등 여러 파일에 산재한 예외 처리로 인해 특정 버그 수정 시 다른 지명이 깨질 위험 상존.
3. **파이프라인 간 맥락(Context) 단절**:
   - 지오코딩(`geocoding.js`) 단계에서 파악된 여행지 카테고리(자연명소, 지하철역, 대학교)나 검증된 `tourapi_content_id`가 숙소 검색(`mrtStayQuery.js`)과 갤러리(`usePlaceGallery.js`)로 온전히 전달되지 못함.
4. **TourAPI 갤러리 저품질 및 시설 사진 노출**:
   - 한국관광공사 TourAPI의 `detailImage` API 중 무장애 여행 정보(BF) 시설 사진(화장실, 휠체어 리프트, 점자블록, 개찰구 등)이 풍경 사진으로 오인되어 갤러리에 노출됨.

---

## 2. 목표 및 아키텍처 혁신 방향

1. **국내 지명 First-Pass 리졸버 도입**:
   - Supabase `tourapi_attraction` 및 국가지명 DB / 명소 허브 DB를 Mapbox 전면에 배치하여 국내 검색어에 대한 정확한 좌표·행정구역·카테고리를 1차 확정.
2. **숙소 매칭 거리·행정구역 가드(Geo-Sanity Check)**:
   - 검색 중심점과 MRT 숙소 후보지 간 거리(기본 반경 15~20km 이내) 및 시/군/구 일치 여부를 검증하여, 타 광역시나 다른 도의 숙소가 섞이지 않도록 차단.
3. **갤러리 이미지 품질 정밀 필터링 및 시각적 폴백**:
   - TourAPI 메타데이터(`imgname`, `title`) 및 정규식 기반 부정 필터를 강화하여 시설물·비풍경 컷을 원천 배제하고, 고화질 랜드스케이프 스톡/기본 비주얼로 매끄럽게 연결.
4. **동음이의어 사용자 선택 UI (지오코딩 다후보 시스템)**:
   - 전국 단위 동음이의어(예: 종각네거리 vs 종각역, 광천선굴 vs 광천동)에 대해 시스템이 임의로 단정하지 않고 사용자에게 위치 선택 시트를 제공.

---

## 3. 세션별 실행 계획 및 복붙표

본 계획은 기존 운영 중인 사이트의 안정성을 해치지 않도록 **4단계 8세션**으로 분할하여 순차 진행한다.

| 세션 | 세션 채팅명 | 주요 작업 내용 | 검증 기준 및 게이트 | 브랜치 |
|---|---|---|---|---|
| **#1** | `여행지 매칭 #1, 갤러리 시설컷 정밀 필터` | `tourApiPhotoRank.js` 및 프록시 이미지 메타데이터(`imgname`) 기반 시설물/비풍경 제외 필터 고도화 및 스모크 테스트 구축 | `npm run smoke:tourapi` PASS, 화장실/휠체어 100% 차단 · PR [#276](https://github.com/catgeot/Days/pull/276) · tip `854f0a43` | `cursor/dest-match-arch` |
| **#2** | `여행지 매칭 #2, 숙소 거리 가드(Geo-Sanity)` | `mrtStayQuery.js` 및 Edge `fetch-mrt-stays`에서 검색 중심점 기준 30km 초과 타 시도 숙소 자동 배제 가드 구현 | `npm run smoke:mrt-stay` PASS, 평창/춘천 검색 시 광주/양양 숙소 0건 | `cursor/dest-match-arch` |
| **#3** | `여행지 매칭 #3, 국내 지명 First-Pass 리졸버` | Mapbox 지오코딩 전 `tourapi_attraction` 및 `cityAttractionHubs.json` 통합 First-Pass 리졸버 모듈화 | `npm run smoke:explore-search-aliases` PASS, 주요 명소 1차 히트율 95%+ | `cursor/dest-match-arch` |
| **#4** | `여행지 매칭 #4, 카테고리 맥락 파이프라인 전달` | 지오코딩 결과의 `placeCategory`(자연, 역사, 역, 대학)를 `mrtStay` 및 `usePlaceGallery`에 컨텍스트로 전달 | `npx vite build` PASS, 자연명소 검색 시 도심 호텔 래더 방지 | `cursor/dest-match-arch` |
| **#5** | `여행지 매칭 #5, 동음이의어 다후보 리스트업` | 전국 동음 지명(리/읍/면/자연명소/역) 매핑 사전 및 다후보 구조화 (`disambiguationCandidates`) | `npm run smoke:ko-homonym-ri-search` PASS | `cursor/dest-match-arch` |
| **#6** | `여행지 매칭 #6, 동음이의어 사용자 선택 UI` | 모바일/데스크톱 검색창 및 장소 시트에서 "어느 지역의 [지명]을 찾으시나요?" 다후보 선택 칩 UI 연동 | Preview `/qa/dest-match` 사람 QA (동음 지명 탭 선택 동작) | `cursor/dest-match-arch` |
| **#7** | `여행지 매칭 #7, 하드코딩 사전 정리 및 SSOT 일원화` | 5개로 분산된 `*_ALIASES`, `*_OVERRIDES`를 `koreaPlaceMatchDictionary.js` 단일 SSOT로 통합 리팩토링 | 통합 audit 스크립트 PASS, 기존 회귀 0건 | `cursor/dest-match-arch` |
| **#8** | `여행지 매칭 #8, 종합 QA 및 메인 병합 준비` | 전국 20개 대표 지명·자연명소·대학·역 스모크 테스트 및 성능/빌드 최종 점검 | 전체 smoke PASS, `npm run build` PASS, PR 최종 생성 | `cursor/dest-match-arch` |

\*2026-09-18 Preview: 원 로드맵 #2(Geo-Sanity) 앞에 **검색 Enter 제안 불일치**를 #2로 삽입. Geo-Sanity는 **#3**.

---

## 4. 세부 기술 구현 내역

### Phase 1: 즉시 안정화 (세션 #1 ~ #2)
- **갤러리 네거티브 필터 강화 (`tourApiPhotoRank.js`)**:
  - `TOURAPI_FACILITY_TITLE_RE` 패턴 대폭 확장: 화장실, 세면대, 변기, 소변기, 휠체어, 점자, 유도블록, 주차구역, 리프트, 개찰구, 소화기, 복도, 엘리베이터, 승강기, 피난안내도 등.
  - TourAPI 프록시(`supabase/functions/tourapi-proxy`) 응답의 `imgname` 필드가 누락되지 않고 클라이언트로 전달되도록 보완.
- **숙소 Geo-Sanity Check (`mrtStayQuery.js` & Edge `fetch-mrt-stays`)**:
  - Geocoded coordinate와 숙소 Photon 좌표 간 Haversine 거리 계산.
  - 중심 좌표 기준 30km 초과 및 도/시 경계 불일치 항목 필터링.

### Phase 2: 지명 리졸버 및 컨텍스트 파이프라인 (세션 #3 ~ #4)
- **First-Pass 리졸버 (`resolveKoreaDestinationFirstPass.js`) 신설**:
  - 검색어 유입 시 Mapbox 호출 전 Supabase `tourapi_attraction` 및 `cityAttractionHubs`에서 Exact/Fuzzy 검색 수행.
  - 히트 시 정확한 WGS84 좌표, 표준 행정구역(시도, 시군구, 읍면동), TourAPI `contentId`, 카테고리(`tourCategory`)를 `uiPlace` 객체에 바인딩.
- **파이프라인 컨텍스트 주입**:
  - `uiPlace.category`가 `NATURE_SCENIC`인 경우 MRT 숙소 래더에서 엉뚱한 대도시(예: 광주, 대구) 키워드로 승격되는 것을 차단하고 인근 군/읍 단위 펜션/자연휴양림 키워드 매핑.

### Phase 3: 동음이의어 다후보 처리 시스템 (세션 #5 ~ #6)
- **동음이의어 감지기 (`detectHomonymLocation.js`)**:
  - `종각`, `광천`, `강원대`, `봉화산`, `용산`, `대포` 등 전국에 2개 이상 존재하는 지명 식별.
- **다후보 선택 UI 인터랙션**:
  - 기존 UI를 파괴하지 않고, 검색창 하단 또는 모달 상단에 작은 선택 칩(`서울 종로 종각역`, `대구 중구 종각네거리`)을 노출하여 사용자가 1클릭으로 선택 가능하도록 구현.

### Phase 4: SSOT 통합 및 회귀 방지 체계 (세션 #7 ~ #8)
- **사전 일원화 (`src/pages/Home/data/koreaPlaceMatchSSOT.js`)**:
  - 산재된 오버라이드 객체들을 통합하고 스키마(query, standardName, coords, mrtRegionHint, tourContentId) 표준화.
- **회귀 방지 E2E 스모크 스크립트 (`scripts/smoke-korea-destination-matching.mjs`)**:
  - 20대 대표 엣지 케이스(광천선굴, 종각역, 연신내, 강원대 춘천/삼척, 정선 화암8경 등)의 지오코딩 좌표, 숙소 지역, 갤러리 퀄리티를 한 번에 검증하는 CI 게이트 마련.

---

## 5. 작업 원칙 및 금지 사항

1. **로직 = feature (`cursor/dest-match-arch`) · 문서 = main**:
   - 코드 작업은 고정 feature 브랜치에서 진행하며 매 턴 push한다.
   - 핸드오프 문서(`plans/**`, `feature-handoff-index.md`, 일지)는 `main` 브랜치에서만 커밋/push한다.
2. **UI 임의 변경 금지**:
   - 사이트 기존 톤앤매너, 컬러, 컴포넌트 배치를 유지하며, 기능 연결 및 자연스러운 선택 칩만 최소한으로 적용한다.
3. **브라우저 QA는 사람 전용**:
   - 에이전트는 `computerUse`나 화면 클릭 QA를 수행하지 않고, audit/smoke/build 통과 후 `/qa/…` Preview 링크를 사람에게 전달한다.
4. **허가 요청 금지**:
   - 검증 커맨드 PASS 시 "커밋해도 될까요?"를 묻지 않고 즉시 규칙에 맞춰 커밋/push를 완료한다.

---

## 6. 에이전트 핸드오프 및 다음 세션 제시어

### 다음 세션 제시어

```
여행지 매칭 #13, 종합 QA 및 메인 병합 준비
@plans/feature-handoff-index.md
@plans/2026-09-19-project-log.md
@plans/korea-destination-matching-architecture-plan.md
브랜치 cursor/dest-match-arch · PR #276 · Preview /qa/dest-match
금지: UI 리디자인 · feature에 plans/** 커밋 · 검증 없이 main push
작업: Preview에서 주요 지명(종각, 광천, 송암, 강원대 등) 검색 및 숙소·갤러리 확인 후 이상 없으면 PR #276 병합 준비
검증: npm run smoke:ko-homonym-ri-search PASS · npm run smoke:explore-search-aliases PASS · npm run smoke:mrt-stay PASS · npx vite build PASS
```

---

## 9. 에이전트 핸드오프

| | |
|--|--|
| **세션** | **#12 완료** · 하드코딩 사전 정리 및 SSOT 일원화 · tip `04b69655` · PR [#276](https://github.com/catgeot/Days/pull/276) |
| **브랜치** | `cursor/dest-match-arch` |
| **Preview** | `/qa/dest-match` → git Preview `/` |
| **다음** | `#13 종합 QA 및 메인 병합 준비` |
| **잔여** | Preview 사람 QA 확인 후 PR #276 메인 병합. Edge `fetch-mrt-stays` 배포는 선택. |
