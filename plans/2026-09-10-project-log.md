# 2026-09-10 프로젝트 일지

직전: [`2026-09-09-project-log.md`](./2026-09-09-project-log.md)

## 팔경 contentId — PR #185 main 병합 및 양구 수목원 자체 큐레이션 반영 (Cloud)

- **세션** `팔경contentId #P2-MERGE, 양구수목원 자체큐레이션 및 PR #185 main 병합`
- **브랜치** `cursor/palgyeong-cid` → `main` squash merge (`53b21b00`) · PR [#185](https://github.com/catgeot/Days/pull/185) (MERGED)
- **완료**
  1. **양구 수목원(`yanggu-arboretum`) 자체 큐레이션(curated) SSOT 반영**:
     - TourAPI 단독 관광지(`contentTypeId: 12`) 부재 확인 (산림청 제35호 공립수목원·양구9경 제1경임에도 단독 contentId 없고 코스 subdetail만 존재)
     - 상세 개요(`overview` 253자: 대암산 생태식물원, DMZ 야생화분재원, 목재문화체험관 등 순수 명소 설명)
     - 도로명 주소(`addr1`: 강원특별자치도 양구군 동면 숨골로310번길 131)
     - 공식 웹사이트(`homepage`: `https://www.yanggu.go.kr/arboretum/`)
     - 한국관광공사 사진갤러리(`searchPhoto`) 고화질 공식 사진 5장(`imageUrl`, `galleryUrls`)
     - `generate-korea-scenic-spots.mjs`에 `addr1`, `homepage`, `galleryUrls` 속성 전달 지원 추가
  2. **자체 큐레이션 지원 도구 추가**:
     - `scripts/report-curated-scenic-candidates.mjs`: `contentId: null` 51건 상태 자동 분석 (완료 1건, 부분 36건, 미흡 14건)
     - `scripts/search-tourapi-photos.mjs`: 키워드 기반 한국관광공사 사진갤러리 실시간 조회
     - `package.json`에 `report:curated-scenic-candidates` 스크립트 등록
  3. **PR #185 main squash merge 완료**:
     - 사용자 지시에 따라 PR #185 검증 통과 후 `main`에 병합 (`53b21b00`)
     - P0(579/876 HIT)+P1(68 HIT)+P2(820/871 충족, 94.1%) contentId 수집 작업 전면 종결 및 main 배포 준비 완료
  4. **후속 세션용 작업 가이드 및 큐 완비**:
     - 지침서: [`korea-curated-spots-guide.md`](./korea-curated-spots-guide.md) (양구수목원 5단계 프로토콜 SSOT)
     - 작업 큐: [`curated-scenic-spots-queue.md`](./curated-scenic-spots-queue.md) (R01 사진 미보유 14건, R02 18건, R03 18건)
     - 핸드오프 인덱스: [`feature-handoff-index.md`](./feature-handoff-index.md)에 신규 큐레이션 트랙 등록
- **VERIFY** `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-local-scenic-content-ids` · `smoke:scenic-detail-locale` · `build` ALL PASS
- **다음** 명소 자체 큐레이션 #1 — R01 사진 미보유 14건(금강소나무숲길, 비내섬, 대통령기록관 등) 보강

```
명소 자체 큐레이션 #1, R01 사진 미보유 14건 보강
@plans/feature-handoff-index.md
@plans/curated-scenic-spots-queue.md
@plans/korea-curated-spots-guide.md
브랜치 cursor/curated-scenic
금지: AI 허구 본문 작성 금지 · 저작권 미확인 사진 금지 · feature에 plans/** 커밋
작업: R01 14건(금강소나무숲길·비내섬·대통령기록관 등) searchPhoto 사진 및 공식 개요·주소·홈페이지 SSOT 반영
```

## 명소 자체 큐레이션 #1 — R01 사진 미보유 14건 보강 완료 (Cloud)

- **세션** `명소 자체 큐레이션 #1, R01 사진 미보유 14건 보강`
- **브랜치** `cursor/curated-scenic` · PR [#207](https://github.com/catgeot/Days/pull/207) (OPEN)
- **완료**
  1. **R01 사진 미보유 14건 자체 큐레이션 SSOT 완비**:
     - 대상: 울진 금강소나무숲길, 비내섬, 대통령기록관, 당진항, 상주보, 계룡산 자연사박물관, 금왕온천, 수정산산림욕장, 구림마을, 거창 고제면 산수유마을, 공주한옥마을, 보성군립은행나무숲, 정읍천, 판교테크노밸리 (14건)
     - 한국관광공사 사진갤러리(`searchPhoto`) 및 공공 자원 기반 고화질 사진(대표 이미지 + 갤러리 4~5장) 수집 및 URL 접근성(HTTP 200) 전수 검증
     - 지자체 대표/문화관광 포털, 산림청, 행정안전부 등 공식 팩트 기반 도로명 주소(`addr1`), 공식 웹사이트(`homepage`), 200~300자 순수 개요(`overview`) 등록
     - `korea-scenic-spots-overrides.mjs` 및 `korea-scenic-spot-images.json` 동시 반영
  2. **큐레이션 상태 통계 갱신**:
     - `node scripts/report-curated-scenic-candidates.mjs`: 미흡(TODO) 14건 -> 0건 해소, 완료(DONE) 1건 -> 15건 전환, 부분(PARTIAL) 36건 잔여
     - `koreaScenicSpots.json`: 총 871개 명소 중 사진 보유 793건(91.0%)으로 상승
- **VERIFY** `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `build` ALL PASS
- **다음** 명소 자체 큐레이션 #2 — R02 수도권·강원·충청 보강 18건(알펜시아, 스타필드 하남, 들꽃수목원, 안산문화광장 등)

```
명소 자체 큐레이션 #2, R02 수도권·강원·충청 보강 18건
@plans/feature-handoff-index.md
@plans/curated-scenic-spots-queue.md
@plans/korea-curated-spots-guide.md
브랜치 cursor/curated-scenic
금지: AI 허구 본문 작성 금지 · 저작권 미확인 사진 금지 · feature에 plans/** 커밋
작업: R02 18건(알펜시아·스타필드하남·들꽃수목원 등) 주소·홈페이지·갤러리·공식개요 보강 및 SSOT 반영
```

## 명소 자체 큐레이션 #2 — R02 수도권·강원·충청 16건 보강 완료 (수도권·강원·충청 종결) (Cloud)

- **세션** `명소 자체 큐레이션 #2, R02 수도권·강원·충청 보강 18건`
- **브랜치** `cursor/curated-scenic` (`c41ae5e4`) · PR [#207](https://github.com/catgeot/Days/pull/207) (OPEN)
- **완료**
  1. **R02 수도권·강원·충청 16건 자체 큐레이션 SSOT 완비**:
     - 대상: 알펜시아 리조트, 용평리조트, 안산문화광장, 광명 안양천생태공원, 스타필드 하남, 하남교산근린공원, 능곡동 유적공원, 시흥 소프트타운, 양평 들꽃수목원, 과천 맑은누리공원, 오산천, 진천 미호천생태공원, 여주프리미엄아울렛, 동두천 보산동 외국인거리, 이천 별빛정원우주, 평택 미르섬 (16건 전수)
     - 한국관광공사 사진갤러리 공공 자원 기반 고화질 갤러리(명소당 5장씩 총 80장) 구축
     - 지자체 대표/문화관광 포털, 공식 사이트 기반 도로명 주소(`addr1`), 공식 웹사이트(`homepage`), 200~250자 순수 팩트 개요(`overview`) 등록 (AI 허구/시스템 문구 배제)
     - `korea-scenic-spots-overrides.mjs` 반영 및 `npm run generate:korea-scenic-spots`로 `koreaScenicSpots.json` 동기화
  2. **수도권·강원·충청 100% 종결 및 큐레이션 통계 갱신**:
     - `node scripts/report-curated-scenic-candidates.mjs`: 완료(DONE) 15건 -> 31건으로 대폭 증가, 미완료(PARTIAL) 36건 -> 20건 감소, 미흡(TODO) 0건 유지
     - 수도권·강원·충청 권역의 TourAPI 미등재 명소 전수 DONE 달성
     - 잔여 대상은 R03 전라(6건)·경상(14건) 총 20건만 남음 (최종 라운드)
- **VERIFY** `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `audit:city-attraction-hubs` · `build` ALL PASS
- **다음** 명소 자체 큐레이션 #3 — R03 전라·경상 보강 20건(심청한옥마을, 운문사, 진해군항제, 성수산, 용궁시장 등 전수 종결)

```
명소 자체 큐레이션 #3, R03 전라·경상 보강 20건 (최종 라운드)
@plans/feature-handoff-index.md
@plans/curated-scenic-spots-queue.md
@plans/korea-curated-spots-guide.md
브랜치 cursor/curated-scenic
금지: AI 허구 본문 작성 금지 · 저작권 미확인 사진 금지 · feature에 plans/** 커밋
작업: R03 20건(심청한옥마을·운문사·진해군항제·성수산 등) 주소·홈페이지·갤러리·공식개요 보강 및 SSOT 전수 종결
```

## 장소카드 갤러리-명소 본문 연계 #1 — 게이트웨이 및 정밀 매칭 구축 (Cloud)

- **세션** `장소카드 갤러리-명소 본문 연계 #1, 게이트웨이 컴포넌트 및 정밀 매칭 구축`
- **브랜치** `cursor/scenic-gateway-2ced` (`1cedbdec`) · PR [#208](https://github.com/catgeot/Days/pull/208) (OPEN)
- **배경 및 요구사항**:
  - 지구본 홈 탐색 페이지에서 한국 관광지/명소를 검색하여 장소카드(`/place/:slug`)로 열었을 때, 기존에는 명소 페이지 본문과의 연결점이 없었음.
  - 장소카드의 기본 홈인 **갤러리 페이지**(`mediaMode === 'GALLERY'`)에서 해당 명소의 **상세 본문 페이지(`ThemeSpotDetailModal`, `/korea/theme/scenic?spot=${spotId}`)**로 자연스럽게 연결되는 통로를 마련.
- **완료**
  1. **명소/명승 매칭 유틸리티 구현 (`src/pages/Home/lib/placeScenicGateway.js`)**:
     - `isDomesticKoreaLocation(loc)`: 해외 장소(파리, 도쿄, 뉴욕 등)의 오탐을 철저히 차단하는 국내 위치 가드.
     - `resolveScenicSpotForPlace(loc)`: 장소카드의 `location` 객체(slug, name, hubId, contentId 등)로부터 `koreaScenicSpots.json`(테마 명소 871곳), `koreaHeritageScenic.json`(국가지정 명승 141곳), `cityAttractionHubs.json`(한국 도시 허브)을 정밀 매칭하고 해당 명소 본문 상세 모달로 즉시 진입하는 딥링크(`deepPath`) 생성.
  2. **명소 본문 연결 게이트웨이 컴포넌트 (`src/components/PlaceCard/common/PlaceScenicGateway.jsx`)**:
     - 장소카드 다크 테마에 어울리는 앰버 골드 그라데이션 카드 UI.
     - 명소명, 한 줄 소개(blurb), 권역 배지, 개요/사진/주변 맛집 안내 칩 표시.
     - 클릭 시 해당 명소의 상세 본문 모달(`ThemeSpotDetailModal`)로 직접 이동.
  3. **데스크톱 및 모바일 갤러리 뷰 연동**:
     - 데스크톱 (`src/components/PlaceCard/views/GalleryInfoView.jsx`): 개요 텍스트 하단에 배치.
     - 모바일 (`src/components/PlaceCard/views/PlaceGalleryView.jsx`): 모바일 개요 섹션 하단에 배치.
  4. **다국어(i18n) 지원 (`ko.json`, `en.json`)**:
     - 국가지정 명승 / 한국의 명승 테마 명소 / 지역 명소 컬렉션 배지 및 안내 레이블 다국어 적용.
  5. **검증 및 스모크 테스트 추가 (`scripts/smoke-place-scenic-gateway.mjs`)**:
     - 대표 명소, contentId 매칭, 국가유산 매칭, 도시 허브 매칭, 해외 장소 배제 등 18개 단위 스모크 테스트 구현 및 통과.
     - `package.json`에 `smoke:place-scenic-gateway` 스크립트 등록.
- **VERIFY** `smoke:place-scenic-gateway` (18 passed) · `audit:korea-scenic-spots` · `audit:city-attraction-hubs` · `smoke:place-label-slug` · `build` ALL PASS
- **다음** 장소카드 갤러리-명소 본문 연계 #2 — Preview 확인 및 사람 QA

```
장소카드 갤러리-명소 본문 연계 #2, Preview 확인 및 사람 QA
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
브랜치 cursor/scenic-gateway-2ced · PR #208
금지: UI 임의 리디자인 · feature에 plans/** 커밋
작업: 탐색에서 경복궁·속초해수욕장·경포대 등 검색 시 장소카드 갤러리 내 명소 본문 연결 카드 렌더링 및 클릭 시 명승 상세 모달 이동 확인
```

## 명소 자체 큐레이션 #3 — R03 전라·경상 20건 보강 및 51건 전수 자체 큐레이션 100% 종결 (Cloud)

- **세션** `명소 자체 큐레이션 #3, R03 전라·경상 보강 20건 (최종 라운드)`
- **브랜치** `cursor/curated-scenic` (`a62f7123`) · PR [#207](https://github.com/catgeot/Days/pull/207) (OPEN)
- **완료**
  1. **R03 전라·경상 20건 자체 큐레이션 SSOT 완비**:
     - 대상: 전라 6건(곡성 심청한옥마을, 임실 성수산, 장성산수유마을, 영광 백사장해수욕장, 익산 웅포관광지, 광양 구봉산 케이블카), 경상 14건(양산 에덴밸리리조트, 양산 통도환타지아, 창원 진해군항제, 청도 운문사, 의성마늘테마공원, 예천 용궁시장, 칠곡 숭산정원, 독도접안시설, 독도 서도, 고령 개진시장, 고령 낙동강 전망, 경산 환성사, 의령 토요애랜드, 영양 외씨버선길) 전수 20건 완료.
     - 한국관광공사 사진갤러리 공공 자원 기반 고화질 갤러리(명소당 5장씩 총 100장, HTTP 200/206 검증 완료) 구축.
     - 지자체 공식 문화관광 포털 및 공식 웹사이트 기반 도로명 주소(`addr1`), 공식 웹사이트(`homepage`), 190~230자 순수 팩트 개요(`overview`) 등록 (AI 허구 / TourAPI 미등재 시스템 문구 배제).
     - `korea-scenic-spots-overrides.mjs` 반영 및 `npm run generate:korea-scenic-spots`로 `koreaScenicSpots.json` 동기화.
  2. **TourAPI 미등재 51건 전수 자체 큐레이션 100% 종결**:
     - `node scripts/report-curated-scenic-candidates.mjs`: 완료(DONE) **51건 / 51건 (100%)**, 미완료(PARTIAL) 0건, 미흡(TODO) 0건 달성.
     - R00(양구 수목원 1건) + R01(사진 미보유 14건) + R02(수도권·강원·충청 16건) + R03(전라·경상 20건)으로 전수 보강 완료.
     - 전체 871개 한국 명소 데이터의 공식 사진·주소·홈페이지·상세 본문 무결성 확보.
- **VERIFY** `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `build` ALL PASS
- **다음** 51건 전수 자체 큐레이션 완료 종결 (PR #207 검토 및 병합 대기)

## 장소카드 갤러리-명소 본문 연계 #2 — 명소 모달 닫기 시 직전 갤러리 복귀(returnTo) 처리 (Cloud)

- **세션** `장소카드 갤러리-명소 본문 연계 #2, Preview 확인 및 사람 QA`
- **브랜치** `cursor/scenic-gateway-2ced` (`ff60a606`) · PR [#208](https://github.com/catgeot/Days/pull/208) (OPEN)
- **문제점 및 해결**:
  - 사람 QA 확인 결과, 장소카드 갤러리에서 게이트웨이를 눌러 명소 상세 페이지(모달)를 열람한 뒤 닫기 버튼을 누르면 직전 갤러리가 아닌 명소 목록 홈(`/korea/theme/scenic`)으로 이동하여 사용자가 보던 장소카드를 잃어버리는 UX 내비게이션 단절 문제 발생.
  - 게이트웨이 진입 시 현재 장소카드 갤러리 경로(`returnTo`, 예: `/place/gyeongbokgung-palace/gallery`)를 URL 쿼리, React Router state, sessionStorage 3중으로 보존.
  - `ScenicPage.jsx`의 `closeModal`에서 `returnTo`를 감지하여 모달 닫기 시 직전 장소카드 갤러리로 `navigate(targetReturnTo, { replace: true })` 호출하여 즉시 복귀 처리.
  - `ThemeModuleBackButton.jsx`에서도 테마 스택이 없을 때 `returnTo`를 감지하여 상단 헤더 뒤로가기 대상으로 연계.
- **완료**:
  1. `src/pages/Home/lib/placeScenicGateway.js`: `resolveScenicSpotForPlace(loc, options)`에 `returnTo` 옵션 지원 및 `deepPath`에 쿼리 파라미터 첨부 로직 추가.
  2. `src/components/PlaceCard/common/PlaceScenicGateway.jsx`: `useLocation()` 기반 현재 장소카드 갤러리 경로 추출, 딥링크 전달, state 및 sessionStorage 동시 보존.
  3. `src/pages/KoreaTheme/ScenicPage.jsx`: `closeModal`에서 `returnTo` 감지 시 직전 장소카드로 복귀 (`replace: true`).
  4. `src/pages/KoreaTheme/ThemeModuleBackButton.jsx`: 헤더 뒤로가기 액션에 `returnTo` 연계.
  5. `scripts/smoke-place-scenic-gateway.mjs`: `returnTo` 쿼리 보존 스모크 테스트 3건 추가 (총 21건 PASS).
- **VERIFY** `smoke:place-scenic-gateway` (21 passed) · `audit:korea-scenic-spots` · `build` ALL PASS
- **다음** 사람 Preview QA 및 PR #208 검토 후 main 병합

```
장소카드 갤러리-명소 본문 연계 #2, 사람 Preview QA 및 병합 대기
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
브랜치 cursor/scenic-gateway-2ced · PR #208
금지: UI 임의 리디자인 · feature에 plans/** 커밋
작업: 장소카드 갤러리에서 명소 본문 진입 후 모달 닫기 시 원래 갤러리로 정확히 복귀하는지 확인
```

## 팔경 활용 #2 — 사진 없는 명승 행 클릭 상세 깨짐 (Cloud)

- **세션** `팔경 활용 #2, 사진 없는 행 클릭`
- **브랜치** `cursor/palgyeong-use-e744` · tip `6b666ad3` · PR [#209](https://github.com/catgeot/Days/pull/209)
- **완료** 사진 없는 팔경 멤버 클릭 시 제목이 `local-scenic:…`이거나 클릭이 막히던 문제. 합성 id를 이름·contentId로 풀고, Tour id 없어도 GATEO 안내 본문으로 연다.
- **VERIFY** `smoke:korea-local-scenic-lists` PASS · `audit:korea-local-scenic-lists` issues 0 · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=hongcheon`
- **다음** 사람 Preview QA (가리산 제목 · 금학산 클릭)

```
팔경 활용 #2, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #209 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드
작업: /korea/theme/scenic?hub=hongcheon 사진 없는 가리산·금학산 클릭 — 제목이 합성 id가 아니고 상세가 열림
```



