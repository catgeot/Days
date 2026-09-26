# 열린 feature — main 핸드오프 인덱스

**역할**: `main`에서 새 Cloud 세션을 열어도 **브랜치·PR·다음 제시어**를 즉시 찾을 수 있게 하는 SSOT.  
**규칙**: [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§1.2** · **§6** · [`AGENTS.md`](../AGENTS.md) Cloud 핸드오프.

| | |
|--|--|
| **에이전트 (시작)** | 사용자 첫 메시지에 **채팅명 형식**(`{주제} #{N}, …`) 또는 **`@plans/feature-handoff-index.md`** 가 있으면 **본 파일 해당 행만** Read → 표의 **다음 제시어**·브랜치 checkout. `.ai-context` 전문·코드베이스 광역 grep **생략**. |
| **에이전트 (종료)** | feature 세션 종료 시 **해당 주제 행 갱신** + 주제 플랜 **§9** + 최신 일지 2~5줄 + **§1.2 다음 제시어 블록** 복붙. **다음 제시어 = 다음 작업**(복잡 로직·토큰 과다만 `사람 Preview QA` 세션) — [`AGENTS.md`](../AGENTS.md) Cloud · [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§5**. |
| **main 동기화** | 위 3파일은 **`main` + `origin/main` 반영 필수** (§1.5.4). feature **종료 시** `merge origin/main` + `audit:docs-handoff-sync` PASS. **feature에 `plans/**` 커밋 금지**. **Plan 아티팩트만 갱신하고 main push 생략 금지** — [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) §1.3. 절차: [`docs-on-main-workflow.md`](./docs-on-main-workflow.md) §충돌 방지.
| **주제 종료** | PR 병합 후 해당 행 **삭제** 또는 `active: false` + 병합 SHA 기록. |

---

## 활성 목록

### 축제-여행지매칭 (숙소·투어 1차 hub)

| | |
|--|--|
| **상태** | **#2 push** · tip `5dc7a8cb` · PR [#291](https://github.com/catgeot/Days/pull/291) (draft) · **사람 Preview** SIEAF 재확인 |
| **브랜치** | `cursor/korea-theme` |
| **플랜** | [`festival-destination-matching-plan.md`](./festival-destination-matching-plan.md) **§5 P3** ✅ · merge 대기 |
| **일지** | [`2026-09-20-project-log.md`](./2026-09-20-project-log.md) |
| **Preview** | `/qa/korea-theme` → git Preview `/korea` |
| **금지** | 축제별 MRT override · `hubIdsForArea('38')` 순서 땜질 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:korea-theme-cross-links` · `smoke:korea-festival-nearby` · `npm run build` PASS |

**다음 제시어**:

```
축제-여행지매칭 #3, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-20-project-log.md
@plans/festival-destination-matching-plan.md
브랜치 cursor/korea-theme · PR #291 · Preview /qa/korea-theme
금지: 축제별 MRT override · hubIdsForArea 순서 땜질 · feature에 plans/** 커밋
작업: Preview 섬진강국제실험예술제 숙소·투어 곡성·여수 패키지 없음 확인 → OK면 PR #291 병합
검증: smoke:korea-theme-cross-links · smoke:korea-festival-nearby · vite build PASS
```

---

### 지구본 마커·flyTo (홈 첫 화면)

| | |
|--|--|
| **상태** | **#2 push** · tip `b8e14b7d` · PR [#298](https://github.com/catgeot/Days/pull/298) (draft) · **사람 Preview** 재현표 A~H |
| **브랜치** | `cursor/globe-marker-reveal-aced` (재사용 — Mapbox Preview URL 고정) |
| **플랜** | [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) **§핸드오프** · [`globeLabelFirstReveal`](../src/pages/Home/lib/globeLabelFirstReveal.js) |
| **일지** | [`2026-09-22-project-log.md`](./2026-09-22-project-log.md) — **「지구본 마커·flyTo — 에이전트 핸드오프」** |
| **소유** | `HomeGlobeMapbox.jsx` · `globeMarkerLayers.js` · `index.jsx` `handleCategorySelect` · `useHomeHandlers` `handleLocationSelect` |
| **Preview** | `https://days-git-cursor-globe-marker-reveal-aced-catgeots-projects.vercel.app/` · PROD `https://www.gateo.kr/` |
| **금지** | reveal retry·hold 타임아웃만 늘리기 · 카테고리별 마커 필터 재도입 · feature에 `plans/**` 커밋 |
| **VERIFY** | `npm run smoke:globe-label-first-reveal` · `npm run build` PASS (#2) |

**다음 제시어**:

```
지구본 마커·flyTo #3, Preview 재현표 A~H
@plans/feature-handoff-index.md
@plans/2026-09-22-project-log.md
@plans/2026-06-02-globe-enrichment-plan.md §핸드오프
브랜치 cursor/globe-marker-reveal-aced · PR #298 · Preview git URL
금지: reveal retry만 추가 · travelSpots 직편집 · feature에 plans/** 커밋
작업: Preview A~H PASS/FAIL 기록 · DEV `[gateo-markers]`·`[globe-fly-skip]` 상관 · 잔여 원인 패치
검증: smoke:globe-label-first-reveal · build · 일지 표 갱신
```

---

### 명승·명소 상세 본문 가독성

| | |
|--|--|
| **상태** | **#1 push** · tip `4590e0a1` · draft PR · **사람 Preview** |
| **브랜치** | `cursor/korea-theme` |
| **플랜** | [`korea-theme-travel-plan.md`](./korea-theme-travel-plan.md) **§9.1** ✅ 구현 |
| **일지** | [`2026-09-21-project-log.md`](./2026-09-21-project-log.md) |
| **참고** | 축제 본문 [#293](https://github.com/catgeot/Days/pull/293) · `src/shared/readableDetail/*` |
| **소유** | `ThemeSpotDetailModal` · `ReadableDetailProse` · `splitTourApiDetailParagraphs` |
| **Preview** | `/qa/korea-theme` → `/korea/theme/scenic?spot=gyeongbokgung` + hub 관광지 카드 1건 |
| **금지** | PlaceCard 갤러리 overview 변경 · 명승 홈 IA·칩 리팩터 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:korea-theme-cross-links` · `smoke:korea-scenic-spots` · `npm run build` PASS |

**다음 제시어**:

```
테마여행 #69, korea-theme prose PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-21-project-log.md
@plans/korea-theme-travel-plan.md §9.1
브랜치 cursor/korea-theme · Preview /qa/korea-theme
금지: PlaceCard 다크 overview · 명승 홈 리팩터 · feature에 plans/** 커밋
작업: Preview 경복궁·긴 개요 관광지 QA OK → prose PR 병합(또는 main 반영 요청)
검증: smoke:korea-theme-cross-links · smoke:korea-scenic-spots · vite build PASS
```

---

### 플래너 3단계

| | |
|--|--|
| **상태** | **#4 push** · tip `977568aa` · PR [#289](https://github.com/catgeot/Days/pull/289) · **사람 Preview** · 단축 **`/qa/planner-stages`** |
| **브랜치** | `cursor/planner-stages-7ee0` |
| **PR** | [#289](https://github.com/catgeot/Days/pull/289) |
| **일지** | [`2026-09-20-project-log.md`](./2026-09-20-project-log.md) |
| **Preview** | `/qa/planner-stages` → git Preview `/place/paris/planner` |
| **소유** | `PlannerTab` · `PlannerStageNav` · `placePlannerFocus` · `TripcomFlightBannerWidget` · `TripcomFlightNativeSearch` |
| **금지** | 트립닷컴 모바일 iframe 재도입 · 위젯을 체크리스트 2열에 넣기 · 유심 탭화 · 복잡도 뱃지 교체 · 픽업·여행사 재배치 · feature에 `plans/**` 커밋 · 검증 없이 main push |
| **VERIFY** | `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `smoke:planner-empty-scroll` PASS · `npx vite build` PASS |

**다음 제시어**:

```
플래너 3단계 #4, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-20-project-log.md
브랜치 cursor/planner-stages-7ee0 · PR #289 · Preview /qa/planner-stages
금지: 트립닷컴 모바일 iframe 재도입 · 위젯을 체크리스트 2열에 넣기 · 픽업·여행사 재배치 · feature에 plans/** 커밋
작업: Preview — 1단계 상단 하이브리드·여행사만 · 「출발 전 필수 준비」 아래 렌터카·픽업·항공권 기준 · 2·3단계 배너 없음. OK면 PR #289 병합.
검증: npm run smoke:tripcom-flight-planner PASS · smoke:trust-disclosure PASS · smoke:planner-empty-scroll PASS · vite build PASS
```

---

### 항공권 검색 — main 병합 완료 ✅

| | |
|--|--|
| **상태** | **#12 merge ✅ · 주제 종료** · main `fb61c9d9` · PR [#288](https://github.com/catgeot/Days/pull/288) |
| **브랜치** | `cursor/tripcom-flight-widget-3ec3` · merge `fb61c9d9` |
| **PR** | [#288](https://github.com/catgeot/Days/pull/288) (MERGED) |
| **일지** | [`2026-09-20-project-log.md`](./2026-09-20-project-log.md) |
| **PROD** | `https://www.gateo.kr/place/paris/planner` — 상단 네이티브 검색 폼 · 써머리 일정 모달 |
| **VERIFY** | `smoke:tripcom-flight-planner` · `smoke:trust-disclosure` · `vite build` PASS |
| **성과** | 트립닷컴 위젯 빈 화면을 네이티브 검색 폼으로 대체. 날짜를 고른 뒤에만 `/tickets-`. 3단계 분리는 후속 주제 `플래너 3단계` |

**다음 제시어 없음** (주제 종료). 확인은 `www.gateo.kr/place/paris/planner`. 3단계 분리는 **플래너 3단계**.

---

### 축제 페이지

| | |
|--|--|
| **상태** | **#6 push** · tip `a5562ba2` · PR [#322](https://github.com/catgeot/Days/pull/322) · **사람 Preview** |
| **브랜치** | `cursor/festival-sheet-ui-ec8b` |
| **PR** | [#322](https://github.com/catgeot/Days/pull/322) |
| **플랜** | [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) **§9** |
| **일지** | [`2026-09-26-project-log.md`](./2026-09-26-project-log.md) |
| **Preview** | `/qa/festival-ui` → git Preview `/korea` — 본문 「지도에서 보기」→ 네이버 지도(장소·주소) |
| **소유** | `FestivalDetailSheet` · `festivalNaverMap.js` · `FestivalMooniFab` |
| **금지** | 축제 시트 리팩터 · 지도 검색어에 축제명 · feature에 `plans/**` 커밋 · 검증 없이 main push |
| **VERIFY** | `npm run smoke:festival-naver-map` PASS · `smoke:korea-festival-nearby` PASS · `npx vite build` PASS. `smoke:korea-festival-personal`은 origin/main과 같이 인천공항→`junggu` FAIL(이 세션 밖) |

**다음 제시어**:

```
축제 페이지 #7, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-26-project-log.md
@plans/korea-festival-hub-plan.md
브랜치 cursor/festival-sheet-ui-ec8b · PR #322 · Preview /qa/festival-ui
금지: 축제 시트 리팩터 · 지도 검색어에 축제명 · feature에 plans/** 커밋 · 검증 없이 main push
작업: Preview /korea 축제 본문 — 주소 아래 지도에서 보기가 네이버 지도의 장소(또는 주소)로 열리는지. 본문 끝까지 스크롤 시 닫기·푸터·무니. OK면 PR #322 병합.
검증: npm run smoke:festival-naver-map PASS · smoke:korea-festival-nearby PASS · vite build PASS
```

---

### 향교 검색

| | |
|--|--|
| **상태** | **#2 push** · tip `24326693` · PR [#285](https://github.com/catgeot/Days/pull/285) · **사람 Preview** (10개 페이지) |
| **브랜치** | `cursor/hyanggyo-search-f9b8` |
| **PR** | [#285](https://github.com/catgeot/Days/pull/285) |
| **일지** | [`2026-09-19-project-log.md`](./2026-09-19-project-log.md) |
| **Preview** | `/qa/hyanggyo` → git Preview `/` — 「향교」10개씩 이전·다음 · 「춘천 향교」≠ 춘천 도시 |
| **소유** | `searchDisambiguationPaging.js` · `SearchSuggestionList.jsx` `SearchDisambiguationCards` · `koreaPoiTypeSearch.js` · `useHomeHandlers.js` |
| **금지** | UI 리디자인 · feature에 `plans/**` 커밋 · 검증 없이 main push |
| **VERIFY** | `npm run smoke:korea-poi-type-search` PASS · `smoke:explore-search-aliases` PASS · `smoke:search-enter-match` PASS · `npx vite build` PASS |

**다음 제시어**:

```
향교 검색 #3, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-19-project-log.md
브랜치 cursor/hyanggyo-search-f9b8 · PR #285 · Preview /qa/hyanggyo
금지: UI 리디자인 · feature에 plans/** 커밋 · 검증 없이 main push
작업: Preview git 홈「향교」엔터 → 한 장에 10개·이전·다음. 「춘천 향교」엔터 → 춘천향교 · 춘천 도시 카드 아님 · 페이지 버튼 없음. 「목포」엔터 → 리스트 유지. OK면 PR #285 병합.
검증: npm run smoke:korea-poi-type-search PASS · smoke:explore-search-aliases PASS · smoke:search-enter-match PASS · vite build PASS
```

---

### 탐색 Enter

| | |
|--|--|
| **상태** | **#1 push** · tip `b8ef3e66` · PR [#283](https://github.com/catgeot/Days/pull/283) · **사람 Preview** |
| **브랜치** | `cursor/search-enter-hub-2018` |
| **PR** | [#283](https://github.com/catgeot/Days/pull/283) |
| **일지** | [`2026-09-19-project-log.md`](./2026-09-19-project-log.md) |
| **Preview** | `/qa/search-enter-hub` → git Preview `/explore` — 목포 Enter → 선택 카드 |
| **소유** | `searchEnterMatch.js` `preferEnterSuggestion` · `SearchDiscoveryModal.jsx` |
| **금지** | UI 리디자인 · feature에 `plans/**` 커밋 · 검증 없이 main push |
| **VERIFY** | `npm run smoke:search-enter-match` PASS · `smoke:explore-choice-overlay` PASS · `npx vite build` PASS |

**다음 제시어**:

```
탐색 Enter #1, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-19-project-log.md
브랜치 cursor/search-enter-hub-2018 · PR #283 · Preview /qa/search-enter-hub
금지: UI 리디자인 · feature에 plans/** 커밋 · 검증 없이 main push
작업: Preview /explore 「목포」엔터 → 써머리 아님, 목포·유달산 등 리스트 카드. 「유달산」엔터 → 유달산. 「광천선굴」엔터 → 평창 광천선굴. OK면 PR #283 병합.
검증: npm run smoke:search-enter-match PASS · smoke:explore-choice-overlay PASS · vite build PASS
```

---

### MOONi 일정 페이스메이커 — main 병합 완료 ✅

| | |
|--|--|
| **상태** | **#3 merge ✅ · 주제 종료** · main `16c8be14` · PR [#281](https://github.com/catgeot/Days/pull/281) |
| **브랜치** | `cursor/mooni-itinerary-concierge-76f0` · merge `16c8be14` |
| **PR** | [#281](https://github.com/catgeot/Days/pull/281) (MERGED) |
| **일지** | [`2026-09-19-project-log.md`](./2026-09-19-project-log.md) |
| **PROD** | `https://www.gateo.kr/place/paris` — 체류·공항·항공시각을 말한 뒤 후속 질문이 같은 전제를 씀 |
| **VERIFY** | `smoke-mooni-ask-bridge` · `smoke-mooni-trip-session` · `vite build` PASS |
| **성과** | #1 페이스메이커·컨시어지 프롬프트. #2 `mooniTripSession` 저장·주입. #3 상황극 QA 후 병합 |

**다음 제시어 없음** (주제 종료). 확인은 `www.gateo.kr/place/paris`.

---

### 여행지 매칭 아키텍처 — main 병합 완료 ✅

| | |
|--|--|
| **상태** | **#14 merge ✅ · 주제 종료** · main `e89de918` · PR [#276](https://github.com/catgeot/Days/pull/276) |
| **브랜치** | `cursor/dest-match-arch` · merge `e89de918` |
| **PR** | [#276](https://github.com/catgeot/Days/pull/276) (MERGED) |
| **플랜** | [`korea-destination-matching-architecture-plan.md`](./korea-destination-matching-architecture-plan.md) **§9** |
| **일지** | [`2026-09-19-project-log.md`](./2026-09-19-project-log.md) |
| **PROD** | `https://www.gateo.kr/` — 동음 지명 다후보 · First-Pass · Geo-Sanity · 갤러리 시설컷 · `koreaPlaceMatchDictionary` SSOT |
| **VERIFY** | `smoke:ko-homonym-ri-search` · `smoke:explore-search-aliases` · `smoke:mrt-stay` · `vite build` PASS |
| **성과** | #1 갤러리 시설컷. #2 Enter 광천선굴. #3 Geo-Sanity. #4 First-Pass. #5 카테고리 파이프. #6~10 동음 다후보·칩. #11 송암 숙소 춘천. #12 사전 SSOT. #14 `/qa/dest-match` → PROD |

**다음 제시어 없음** (주제 종료). 확인은 `www.gateo.kr`. `/qa/dest-match` → PROD `/`.

---

### 종각역 숙소

| | |
|--|--|
| **상태** | **#14 광천선굴 갤러리** · tip `cc707a2c` · PR [#273](https://github.com/catgeot/Days/pull/273) · **사람 Preview** · **PR 미병합** |
| **브랜치** | `cursor/gwangcheon-cave-stay-6560` |
| **플랜** | [`korea-station-stay-plan.md`](./korea-station-stay-plan.md) **§9** |
| **일지** | [`2026-09-17-project-log.md`](./2026-09-17-project-log.md) |
| **Preview** | `/qa/gwangcheon-stay` → git Preview `/` — 평창 핀 · 갤러리 화장실·휠체어 아님 · 숙소 광주 아님 |
| **소유** | `tourApiPhotoRank.js` `keepTourDetailImage` · `usePlaceGallery.js` · `fetchTourApiGallery.js` · `mrtStayQuery.js` · `cityAttractionHubs.json` 평창 광천선굴 |
| **금지** | UI 리디자인 · feature에 `plans/**` 커밋 · 검증 없이 main push |
| **VERIFY** | `npm run smoke:mrt-stay` PASS · `smoke:explore-search-aliases` PASS · `smoke:tourapi` PASS · `npx vite build` PASS |

**다음 제시어**:

```
종각역 숙소 #14, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-17-project-log.md
@plans/korea-station-stay-plan.md
브랜치 cursor/gwangcheon-cave-stay-6560 · PR #273 · Preview /qa/gwangcheon-stay
금지: UI 리디자인 · feature에 plans/** 커밋 · 검증 없이 main push
작업: Preview 홈「광천성굴」「광천동굴」→ 평창 광천선굴. 숙소 찾기 → 광주 호텔 아님. 장소 갤러리에 화장실·휠체어 없고 동굴 전경이 보이는지. OK면 PR #273 병합.
검증: npm run smoke:mrt-stay PASS · smoke:explore-search-aliases PASS · smoke:tourapi PASS · vite build PASS
```

---

### 탐색홈 검색 — main 병합 완료 ✅

| | |
|--|--|
| **상태** | **#6 merge ✅ · 주제 종료** · main `ad333614` · PR [#242](https://github.com/catgeot/Days/pull/242) |
| **브랜치** | `cursor/explore-search-d14b` · merge `ad333614` |
| **PR** | [#242](https://github.com/catgeot/Days/pull/242) (MERGED) · [#239](https://github.com/catgeot/Days/pull/239) merge ✅ |
| **일지** | [`2026-09-13-project-log.md`](./2026-09-13-project-log.md) |
| **PROD** | `https://www.gateo.kr/explore` — 문경 팔경·선정 사진 · 옹진 N경 없음 |
| **VERIFY** | `smoke:explore-choice-overlay` · `smoke:korea-local-scenic-lists` · `smoke:explore-search-aliases` · `vite build` PASS |
| **성과** | #5 `resolveSearchScenicMedia`·TourAPI 드롭다운. #6 쌍용계곡 문경시 공식 사진. 선유동·용추·경천호는 TourAPI 또는 팔경 오버레이 대기. `/qa/explore-search`→PROD는 PR [#241](https://github.com/catgeot/Days/pull/241) |

**다음 제시어 없음** (주제 종료). `/qa/explore-search` PROD 전환은 PR [#241](https://github.com/catgeot/Days/pull/241). 확인은 `www.gateo.kr/explore`.

---

### 방문자 개선 — main 병합 완료 ✅

| | |
|--|--|
| **상태** | **#9 merge ✅ · 주제 종료** · main `e2e8ad20` · PR [#259](https://github.com/catgeot/Days/pull/259) |
| **브랜치** | `cursor/visitor-growth-1f90` · merge `e2e8ad20` |
| **PR** | [#259](https://github.com/catgeot/Days/pull/259) (MERGED) · [#257](https://github.com/catgeot/Days/pull/257) · [#255](https://github.com/catgeot/Days/pull/255) · [#253](https://github.com/catgeot/Days/pull/253) · [#249](https://github.com/catgeot/Days/pull/249) · [#248](https://github.com/catgeot/Days/pull/248) · [#247](https://github.com/catgeot/Days/pull/247) · [#244](https://github.com/catgeot/Days/pull/244) merge ✅ |
| **플랜** | [`visitor-growth-activation-plan.md`](./visitor-growth-activation-plan.md) **§9** |
| **일지** | [`2026-09-15-project-log.md`](./2026-09-15-project-log.md) |
| **PROD** | `https://www.gateo.kr/` — 404·검색 넛지·크롤러 본문·무드검색·신뢰 바·플래너 3단계·EN 개요·가입 혜택 |
| **VERIFY** | `smoke:visitor-locale` · `smoke:trust-disclosure` · `smoke:mood-search-intent` · `smoke:crawler-place-meta` · `audit:i18n` PASS |
| **성과** | #1 404·MOONi. #2 검색+무니 가치제안·지구본 유지. #3 274곳 크롤러 본문. #4 무드/지오코딩 분리. #5 로딩·에러 UX. #6 신뢰·제휴. #7 플래너 3단계. #8 locale·가입·a11y. `/qa/visitor-growth`는 구 Preview |

**다음 제시어 없음** (주제 종료). 확인은 `www.gateo.kr`.

---

### AI 모델

| | |
|--|--|
| **상태** | **#2 push** · tip `7ab5d0fb` · PR [#224](https://github.com/catgeot/Days/pull/224) · Edge 배포됨 · **사람 Preview** |
| **브랜치** | `cursor/gemini-models-df4c` |
| **tip** | `7ab5d0fb` |
| **PR** | [#224](https://github.com/catgeot/Days/pull/224) |
| **일지** | [`2026-09-12-project-log.md`](./2026-09-12-project-log.md) |
| **Preview** | `/qa/gemini` → git Preview `/` |
| **소유** | `geminiModels.js` · `gemini-proxy` · `smoke-health` P0-3 · 위키·툴킷·매거진·무니 |
| **금지** | UI 리디자인 · 최신 Flash(3.6+) 추격 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:gemini-models` · `smoke:health` P0-3 FAST+QUALITY · `vite build` |

**다음 제시어**:

```
AI 모델 #3, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
브랜치 cursor/gemini-models-df4c · PR #224 · Preview /qa/gemini
금지: UI 리디자인 · 최신 Flash 추격 · feature에 plans/** 커밋
작업: 무니 대화가 이전과 같으면 PR #224 병합 후 이 행 삭제. 추가 티어 피드백이면 모델 티어만 수정
```

---

### 한국 투어티켓 — main 병합 완료 ✅

| | |
|--|--|
| **상태** | **#10 merge ✅ · 주제 종료** · main `2374db5f` · PR [#234](https://github.com/catgeot/Days/pull/234) |
| **브랜치** | `cursor/korea-tna-strip-ef65` · merge `2374db5f` |
| **PR** | [#234](https://github.com/catgeot/Days/pull/234) (MERGED) |
| **플랜** | [`korea-tna-strip-plan.md`](./korea-tna-strip-plan.md) |
| **일지** | [`2026-09-13-project-log.md`](./2026-09-13-project-log.md) |
| **PROD** | `https://www.gateo.kr/korea/theme/scenic?spot=gyeongbokgung` — 명승·축제 본문 투어·렌터카·기차표 · 시드 군 숙소 폴백 |
| **VERIFY** | `smoke:korea-tna-strip` · `smoke:korea-theme-cross-links` · `smoke:korea-scenic-stay` · `smoke:korea-festival-personal` · `smoke:mrt-stay` · `smoke:travel-agencies` PASS |
| **성과** | #7 국내 렌터카(마이리얼트립)·기차표. #8 왕가의 산책 인천(룩소르 아님). #9 대청도 등 시드 군 숙소·투어 시도 폴백. `/qa/korea-tna-strip` → PROD |

**다음 제시어 없음** (주제 종료). 해외 이벤트 TNA 공통화(#11)는 별도 요청 시. 확인은 `www.gateo.kr`.

---

### 축제 숙소허브

| | |
|--|--|
| **상태** | **#2 push** · tip `31780152` · PR [#233](https://github.com/catgeot/Days/pull/233) |
| **브랜치** | `cursor/festival-stay-hub-c241` |
| **tip** | `31780152` |
| **PR** | [#233](https://github.com/catgeot/Days/pull/233) |
| **일지** | [`2026-09-13-project-log.md`](./2026-09-13-project-log.md) |
| **Preview** | `/qa/festival-stay-hub` → git Preview `/korea` |
| **소유** | `nearbyFestivalHubs.js` · `resolveFestivalThemeCrossLinks` · `resolveStayTnaHubId` |
| **금지** | UI 리디자인 · 축제 시트 리팩터 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:korea-festival-personal` · `smoke:korea-theme-cross-links` · `smoke:korea-tna-strip` · `vite build` |

**다음 제시어**:

```
축제 숙소허브 #3, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
브랜치 cursor/festival-stay-hub-c241 · PR #233 · Preview /qa/festival-stay-hub
금지: UI 리디자인 · 축제 시트 리팩터 · feature에 plans/** 커밋
작업: 학산마당극놀래 본문 숙소·투어가 인천이고 카드가 보이는지(옹진·빈 미추홀 아님). OK면 PR #233 병합
```

---

### 명승 숙소

| | |
|--|--|
| **상태** | **#2 push** · tip `37097755` · PR [#214](https://github.com/catgeot/Days/pull/214) · **#3 사람 Preview QA** |
| **브랜치** | `cursor/scenic-stay-692c` |
| **tip** | `37097755` |
| **PR** | [#214](https://github.com/catgeot/Days/pull/214) |
| **일지** | [`2026-09-11-project-log.md`](./2026-09-11-project-log.md) |
| **Preview** | `/qa/scenic-stay` → git Preview `/korea/theme/scenic?spot=gyeongbokgung` |
| **소유** | `ScenicStayStrip` · `ThemeSpotDetailModal` · `EventStayStrip` |
| **금지** | UI 리디자인 · 축제 시트 리팩터 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:korea-scenic-stay` · `smoke:korea-festival-stay-url` · `vite build` |

**다음 제시어**:

```
명승 숙소 #3, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
브랜치 cursor/scenic-stay-692c · PR #214 · Preview /qa/scenic-stay
금지: UI 리디자인 · 축제 시트 리팩터 · feature에 plans/** 커밋
작업: 경복궁 본문에서 숙소가 개요·사진 아래·맛집 위인지 · 네이버·구글 칩이 나란히 열리는지
```

---

### 플래너 실행 전 여유

| | |
|--|--|
| **상태** | **#1 push** · tip `93168a4e` · PR [#211](https://github.com/catgeot/Days/pull/211) · **#2 사람 Preview QA** |
| **브랜치** | `cursor/planner-empty-pad-6089` |
| **tip** | `93168a4e` |
| **PR** | [#211](https://github.com/catgeot/Days/pull/211) |
| **일지** | [`2026-09-10-project-log.md`](./2026-09-10-project-log.md) |
| **Preview** | `/qa/planner-empty` → git Preview `/place/yanggu-arboretum/planner` |
| **소유** | `PlannerTab` 실행 전 빈 상태 · `TravelAgencyDirectory` planner details · `placePlannerFocus` |
| **금지** | UI 리디자인 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:planner-empty-scroll` · `smoke:travel-agencies` · `vite build` |

**다음 제시어**:

```
플래너 실행 전 여유 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
브랜치 cursor/planner-empty-pad-6089 · PR #211 · Preview /qa/planner-empty
금지: UI 리디자인 · feature에 plans/** 커밋
작업: 양구 수목원 플래너 실행 전 하단 여유 · 연결된 여행사 펼침 후 상단 스크롤
```

---

### 지구본 프레임 줌 — main 병합 ✅

| | |
|--|--|
| **상태** | **#1 merge ✅** · main `386412ac` · PR [#203](https://github.com/catgeot/Days/pull/203) |
| **브랜치** | `cursor/globe-frame-zoom-7106` · merge `386412ac` |
| **일지** | [`2026-09-08-project-log.md`](./2026-09-08-project-log.md) |
| **PROD** | `https://www.gateo.kr/` |
| **VERIFY** | `smoke:globe-page-zoom-lock` · `vite build` PASS |

**다음 제시어 없음** (주제 종료). 홈 프레임 핀치 후 복귀는 PROD. `/qa/globe-frame-zoom`은 구 Preview — 확인은 `www.gateo.kr`.

---

### 장소카드 갤러리-명소 본문 연계

| | |
|--|--|
| **상태** | **#2 push** · tip `ff60a606` · PR [#208](https://github.com/catgeot/Days/pull/208) · **#2 사람 Preview QA** |
| **브랜치** | `cursor/scenic-gateway-2ced` |
| **tip** | `ff60a606` |
| **PR** | [#208](https://github.com/catgeot/Days/pull/208) |
| **일지** | [`2026-09-10-project-log.md`](./2026-09-10-project-log.md) |
| **소유** | `PlaceScenicGateway.jsx` · `placeScenicGateway.js` · `GalleryInfoView.jsx` · `PlaceGalleryView.jsx` · `ScenicPage.jsx` · `ThemeModuleBackButton.jsx` |
| **금지** | UI 리디자인 · feature에 `plans/**` 커밋 |
| **VERIFY** | `npm run smoke:place-scenic-gateway` (21 passed) · `npm run build` |

**다음 제시어**:

```
장소카드 갤러리-명소 본문 연계 #2, 사람 Preview QA 및 병합 대기
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
브랜치 cursor/scenic-gateway-2ced · PR #208
금지: UI 임의 리디자인 · feature에 plans/** 커밋
작업: 장소카드 갤러리에서 명소 본문 진입 후 모달 닫기 시 원래 갤러리로 정확히 복귀하는지 확인
```

---

### 써머리 닫기

| | |
|--|--|
| **상태** | **#1 push** · tip `f1e040b4` · PR [#202](https://github.com/catgeot/Days/pull/202) · **#2 사람 Android Chrome QA** |
| **브랜치** | `cursor/summary-close-1030` |
| **tip** | `f1e040b4` |
| **PR** | [#202](https://github.com/catgeot/Days/pull/202) |
| **일지** | [`2026-09-07-project-log.md`](./2026-09-07-project-log.md) |
| **Preview** | `/qa/summary-close` → git Preview `/` |
| **소유** | `PlaceCardSummary` · `HomeGlobeMapbox` `suppressOverlayClick` · `globeOverlayClickGuard.js` |
| **금지** | UI 리디자인 · 써머리 X `pointerdown` 닫기 제거 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:summary-close-guard` · `vite build` |

**다음 제시어**:

```
써머리 닫기 #2, Android Chrome QA
@plans/feature-handoff-index.md
@plans/2026-09-07-project-log.md
브랜치 cursor/summary-close-1030 · PR #202 · Preview /qa/summary-close
금지: UI 리디자인 · 써머리 X pointerdown 닫기 제거 · feature에 plans/** 커밋
작업: Android Chrome에서 지구본 써머리 X → 카드만 닫힘 · 다른 여행지 써머리가 바로 안 열림
```

---

### 리뷰 연관 여행지

| | |
|--|--|
| **상태** | **#1 push** · tip `d73ffc19` · PR [#201](https://github.com/catgeot/Days/pull/201) · **#2 사람 Preview QA** |
| **브랜치** | `cursor/reviews-related-b9fa` |
| **tip** | `d73ffc19` |
| **PR** | [#201](https://github.com/catgeot/Days/pull/201) |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **Preview** | `/qa/reviews-related` → git Preview `/place/paris/reviews` |
| **소유** | `PlaceChatPanel` · `relatedPlaceTab.js` · `ReviewsTab` |
| **금지** | UI 리디자인 · 갤러리 칩을 리뷰로 바꾸기 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:reviews-related-tab` · `smoke:gallery-related-scroll` · `vite build` |

**다음 제시어**:

```
리뷰 연관 여행지 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/reviews-related-b9fa · PR #201 · Preview /qa/reviews-related
금지: UI 리디자인 · 갤러리 칩을 리뷰로 바꾸기
작업: 파리 리뷰탭 좌측 칩 → 새 여행지도 리뷰탭 · 글이 없어도 칩으로 이어서 탐색 · 갤러리 칩은 갤러리 유지
```

---

### 갤러리 좌측 패널

| | |
|--|--|
| **상태** | **#1 push** · tip `7495e095` · PR [#200](https://github.com/catgeot/Days/pull/200) · **#2 사람 Preview QA** |
| **브랜치** | `cursor/gallery-panel-032e` |
| **tip** | `7495e095` |
| **PR** | [#200](https://github.com/catgeot/Days/pull/200) |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **Preview** | `/qa/gallery-panel` → git Preview `/place/paris/gallery` |
| **소유** | `GalleryInfoView` · `PlaceChatPanel` |
| **금지** | UI 리디자인 · 연관 칩을 써머리 스크롤 안으로 되돌리기 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:gallery-related-scroll` · `smoke:gallery-photo-manage` · `vite build` |

**다음 제시어**:

```
갤러리 좌측 패널 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-panel-032e · PR #200 · Preview /qa/gallery-panel
금지: UI 리디자인 · 연관 칩을 써머리 스크롤 안으로 되돌리기
작업: PC 파리 갤러리 좌측 — 스크롤 없이 하단 연관 검색어 · 무니 입력창 바로 위
```

---

### 자킨토스 검색

| | |
|--|--|
| **상태** | **#12 push** · tip `795c16ec` · PR [#199](https://github.com/catgeot/Days/pull/199) · **#13 사람 Preview QA** — 그리스 표기·해변 사진 |
| **브랜치** | `cursor/zakynthos-search-e84a` |
| **tip** | `795c16ec` |
| **PR** | [#199](https://github.com/catgeot/Days/pull/199) |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **Preview** | `/qa/zakynthos` → git Preview `/` (방문 카드 그리스 · 해변 사진) |
| **소유** | `visitedPlaceSearch.js` · `visitedPlaceSearchLookup.js` · `galleryPortraitFilter.js` · `useHomeHandlers.js` Smart Search |
| **금지** | UI 리디자인 · 자킨토스 SSOT 재등록 · `orientation=landscape` 재도입 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:visited-place-search` · `smoke:unseen-place-search` · `smoke:zakynthos-search` · `smoke:sabah-search` · `smoke:gallery-portrait-filter` · `vite build` |

**다음 제시어**:

```
자킨토스 검색 #13, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #199 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 자킨토스 재검색 드롭다운·써머리·장소 헤더가 그리스 · 해변 사진 · Global/Explore 아님 · 사바섬 회귀
```

---

### 공항픽업 링크

| | |
|--|--|
| **상태** | **#1 push** · tip `3828b09b` · PR [#193](https://github.com/catgeot/Days/pull/193) · **#2 사람 Preview QA** |
| **브랜치** | `cursor/klook-pickup-d5a5` |
| **tip** | `3828b09b` |
| **PR** | [#193](https://github.com/catgeot/Days/pull/193) |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **Preview** | `/qa/pickup` → git Preview `/place/fukuoka/planner` |
| **소유** | `klookAffiliateUrl.js` · `affiliate.js` `getKlookAffiliateUrl` · PreTravelChecklist 픽업 |
| **금지** | UI 리디자인 · 제휴 aid 변경 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:klook-affiliate` · `smoke:travel-agencies` · `vite build` |

**다음 제시어**:

```
공항픽업 링크 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/klook-pickup-d5a5 · PR #193 · Preview /qa/pickup
금지: UI 리디자인 · 제휴 aid 변경
작업: 후쿠오카 플래너 공항 픽업 → 클룩 웹(GATEO) · iOS 앱 열기 경고 없는지
```

---

### 여행사 목록

| | |
|--|--|
| **상태** | **#3 push** · tip `c6fdd253` · PR [#198](https://github.com/catgeot/Days/pull/198) · **#4 사람 Preview QA** (접힌 방문한 여행사) |
| **브랜치** | `cursor/agencies-85ab` |
| **tip** | `c6fdd253` |
| **PR** | [#198](https://github.com/catgeot/Days/pull/198) · [#192](https://github.com/catgeot/Days/pull/192) merge ✅ |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **Preview** | `/qa/agencies` → git Preview `/` · `/explore` · `/place/paris/planner` |
| **소유** | `travelAgencies.js` · `travelAgencyVisits.js` · `TravelAgencyDirectory` · LogoPanel · SearchDiscovery · PlannerTab |
| **금지** | 로고/탐색/플래너 리디자인 · 예약 대행 카피 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:travel-agencies` · `vite build` |

**다음 제시어**:

```
여행사 목록 #4, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/agencies-85ab · PR #198 · Preview /qa/agencies
금지: 로고/탐색/플래너 리디자인 · 예약 대행 카피
작업: 로고 패널 「방문한 여행사」접힘 · 펼치면 목록 · 탐색창 칩 명칭 · 방문 기록 회귀
```

---

### 릴리스 노트 푸터

| | |
|--|--|
| **상태** | **#1 push** · tip `6dcd5b93` · PR [#191](https://github.com/catgeot/Days/pull/191) · **#2 사람 Preview QA** |
| **브랜치** | `cursor/updates-0e16` |
| **tip** | `6dcd5b93` |
| **PR** | [#191](https://github.com/catgeot/Days/pull/191) |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **Preview** | `/qa/updates` → git Preview `/` |
| **소유** | `SiteUpdateBanner`(배포 새로고침만) · FooterModal Updates · `releaseNotes.js` |
| **금지** | 릴리스 노트 홈 팝업 재도입 · UI 리디자인 · 버그픽스/미세 UI를 Updates에 넣기 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:release-notes-footer` · `vite build` |

**다음 제시어**:

```
릴리스 노트 푸터 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/updates-0e16 · PR #191 · Preview /qa/updates
금지: 릴리스 노트 홈 팝업 재도입 · UI 리디자인 · 버그픽스/미세 UI를 Updates에 넣기
작업: 홈 진입 시 공지 모달 없음 · 로고 패널 푸터 Updates에 기존 내역 · 배포 새로고침 안내는 PROD만
```

---

### 갤러리 연관 스크롤 — main 병합 ✅

| | |
|--|--|
| **상태** | **#1 merge ✅** · main `6b6d7b12` · PR [#190](https://github.com/catgeot/Days/pull/190) |
| **브랜치** | `cursor/gallery-scroll-76a6` · merge `6b6d7b12` |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **PROD** | `https://www.gateo.kr/place/paris/gallery` |
| **VERIFY** | `smoke:gallery-related-scroll` · `vite build` PASS |

**다음 제시어 없음** (주제 종료). 연관 칩 전환 시 갤러리 상단 리셋은 PROD. PC 좌측 패널 공간은 [`갤러리 좌측 패널`](#갤러리-좌측-패널).

---

### 갤러리 캐시 신선도

| | |
|--|--|
| **상태** | **#1 push** · tip `b7ee61e5` · PR [#189](https://github.com/catgeot/Days/pull/189) · **#2 사람 Preview QA** |
| **브랜치** | `cursor/gallery-swr-6b36` |
| **tip** | `b7ee61e5` |
| **PR** | [#189](https://github.com/catgeot/Days/pull/189) |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **Preview** | `/qa/gallery-fresh` → git Preview `/place/paris/gallery` |
| **소유** | `usePlaceGallery` · `galleryCachePolicy.js` · 검색 카드 thumbnailOnly |
| **금지** | `image_url` SWR 덮어쓰기 · Tour 우세 갤러리 스톡 치환 · 더보기 DB upsert · UI 리디자인 · feature에 `plans/**` 커밋 |
| **VERIFY** | `smoke:gallery-cache-policy` · `smoke:place-gallery-pexels` · `smoke:gallery-portrait-filter` · `smoke:gallery-photo-manage` · `vite build` |

**다음 제시어**:

```
갤러리 캐시 신선도 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-swr-6b36 · PR #189 · Preview /qa/gallery-fresh
금지: image_url SWR 덮어쓰기 · Tour 우세 스톡 치환 · 더보기 DB upsert · UI 리디자인
작업: 파리 갤러리 즉시 표시 · 대표 사진 유지 · 새 장이 뒤에 붙는지 · 검색/버킷 썸네일 흔들림 없음
```

---

### 갤러리 사진 관리 — main 병합 ✅

| | |
|--|--|
| **상태** | **#1 merge ✅** · main `d575c9a7` · PR [#188](https://github.com/catgeot/Days/pull/188) |
| **브랜치** | `cursor/gallery-manage-173f` · merge `d575c9a7` |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **PROD** | `https://www.gateo.kr/place/paris/gallery` |
| **VERIFY** | `smoke:gallery-photo-manage` · `vite build` PASS |

**다음 제시어 없음** (주제 종료). 모바일 길게 누르기 제거는 PROD. `/qa/gallery`는 관리 Preview(구 브랜치) — 신선도 QA는 `/qa/gallery-fresh`.

---

### 갤러리 인물 제외 — main 병합 ✅

| | |
|--|--|
| **상태** | **#2 merge ✅** · main `4e748b4b` · PR [#194](https://github.com/catgeot/Days/pull/194) |
| **브랜치** | `cursor/gallery-2-c260` · merge `4e748b4b` |
| **일지** | [`2026-09-06-project-log.md`](./2026-09-06-project-log.md) |
| **PROD** | `https://www.gateo.kr/` — 자킨토스 갤러리 |
| **VERIFY** | `smoke:gallery-portrait-filter` · `smoke:place-gallery-pexels` · `vite build` PASS |

**다음 제시어 없음** (주제 종료). DB 인물 고착 시 LIVE 재조회는 PROD.

---

### 팔경 활용 — 검색·리스트 (A)

| | |
|--|--|
| **상태** | **#67 push** tip `60cb6fcb` · PR [#321](https://github.com/catgeot/Days/pull/321) · 산청9경 2 · **#68 서천 결손 오버레이** |
| **브랜치** | `cursor/palgyeong-use-e744` |
| **tip** | `60cb6fcb` |
| **PR** | [#321](https://github.com/catgeot/Days/pull/321) · [#320](https://github.com/catgeot/Days/pull/320) merge ✅ · [#286](https://github.com/catgeot/Days/pull/286) merge ✅ · [#284](https://github.com/catgeot/Days/pull/284) merge ✅ |
| **플랜** | [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) **§9 A** |
| **일지** | [`2026-09-26-project-log.md`](./2026-09-26-project-log.md) |
| **Preview** | `/qa/palgyeong-use` → git Preview `/korea/theme/scenic?hub=sancheong` 산청9경 3경 황매산 철쭉·7경 남명조식유적지 |
| **소유** | js/jsx · 검색 스모크 · **JSON palgyeong contentId·fill 금지** |
| **금지** | JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 `plans/**` 커밋 · **다음 세션을 Preview QA로 넘기기** |
| **VERIFY** | `npm run smoke:korea-local-scenic-lists` · `npm run smoke:korea-scenic-search` · `npm run smoke:korea-scenic-spots` · `npm run build` |
| **성과** | #10 행 부제(#213). **#12** 축제 인근(#215). **#13–14** 광양·하동(#216). **#15–18** 영동 한천·양산·검색·부제(#217). **#19** 함안 7·사천 6(#219). **#21** 이천 6(#220). **#22–24** 창녕 6·검색·별칭(#221). **#25** 진주 6(#222). **#26** 상산 6(#225). **#27** 구례 5 + GATEO 선정 구례 수목원 공식 사진(#226). **#28** 강진 5(#226 merge) · 12경 제목·청자단지(#228). **#29** 선유8경 5(#229). **#30** 금산10경 5(#231). **#31** 요광리 은행나무 사진·서대산·진악산 빈 썸네일(#231 merge). **#32** 남해12경 5 · 검색 그룹명 「남해 12경」(#232 merge). **#33** 포항12경 5(#235 merge). **#34** 안양9경 4(#236 merge). **#35** 증평구경 4(#237 merge). **#36** 계룡9경 4(#238 merge). **#37** 논산11경 4 + 관광지 검색 빈 썸네일 3(#240). **#38** 천안8경 4(#243). **#39** 담양10경 4(#245). **#40** 밀양8경 4. **#41** 영덕9경 4 + QA 영덕 검색 썸네일 3·투어 오탐. **#42** 진도10경 4 + QA 검색 조도(조도6군도) 553447 썸네일(문경8경은 사진·개요 기완료로 건너뜀). **#43** 함평8경 4 + QA 1경·2경 썸네일 분리(엑스포 `4065063` ≠ 생태 `3536105`). **#44** 해남8경 4. **#45** 홍성12경 4 + QA 검색 오서산·죽도(홍성)·용봉산·11경 홍주의사총 썸네일. **#46** 화순11경 4 + QA 7경 연둔리 숲정이·검색 3014431 썸네일. **#47** 거제9경 3 + QA 검색 공곶이 2536196·식물원·매미성·구조라·지심도터미널 2756617 썸네일. **#48** 동해비경 3(호해정·할미바위·초록봉) + QA 용추·반석 오버레이가 Tour `125673` firstimage를 덮지 않게 함·망상 `125713`·어달 `125708`. **#49** 영광9경 3 + QA 불갑산도립공원 `126248`은 firstimage 공란·사진은 detailImage. **#50** 고흥10경 3 + QA 팔영산 `125426`·영남용바위 `2782706`. **#51** 김해9경 3(#265 merge). **#52** 대구12경 3(#267 merge). **#53** 여수10경 3(#268 merge). **#54** 예천8경 3(금당실→용문면 십승지·469호 송림·곤충생태원→효자면 연구소·무당벌레관·석송령→감천면 294호 부자나무) + QA 검색「예천」신라식물원 `1910438` 빈 썸네일 + QA 용궁시장 회룡포(126734) 항공을 군 공식 시장 사진으로 교체. **#55** 인천9경 3(아라온→계양 장기동 109-1 빛의 거리·씨사이드파크→구읍로 75 레일바이크·강화읍 원도심→용흥궁 도보해설). **#56** 양구9경 3(수목원→동면 숨골로310번길 132 도내 6번째 공립·봉화산→국토정중앙면 죽리 875m 주말 산행·상무룡 출렁다리→간척월명로 1719-21 파로호 335m). **#57** 정읍9경 3(동학→덕천면 동학로 742 황토현 2022 공원·용산호→신정동 132-11 미르샘 642m·월영습지→쌍암동 1029·송산동 산112 2014 습지보호). **#58** 화암8경 3(거북바위→화암리 336-1 약수 진입 절벽 둘레 6m·용마소→화암리 1306-1 그림바위 앞 반석 용사소·화표주→화암리 329-4 화표동 삼거리 돌기둥). **#59** 태백8경 3(화석산지→장성동 산42-2 천연기념물 416호 직운산층·용연굴→태백로 283-29 해발 920m 건식 석회동굴·절골→오투로 116 황지동 캠핑장·본적사지). **#60** 의정부8경 3(도정봉→장암동 526m 만가대·동막골·기차바위·철모바위·경전철→2012 발곡~탑석·시장→시민로121번길 43-2 1978 가나다라동). **#61** 통영팔경 3(남망산공원→동호동 남망공원길 29 1997 조각공원·제승당→한산일주로 70 사적 113호 운주당 터·운하→당동~미수동 1932 3중 교통) + QA 1경 연화도 용머리(`127103` U투어 사진 idx=16550·홈 idx=1660, pstatic 403·badaland 인증서 오류)·이순신공원(`584970` 공사 동상, 팔경 아님). 삼덕항 `2782775`는 공식 사진 없어 건너뜀. 순수 사진/개요 누락 **46**/876. 사람 Preview는 같은 턴 병행. **#62** 광주8경 시 공식 8명 재정비 + QA 관광공사 검색 0건 수정(`경기 광주`→Tour addr `경기도 광주`, type12 40건). 화담숲·곤지암도자공원은 GATEO 선정만. 송정사 제외. 명승 0은 사실(남한산성은 사적). 순수 사진/개요 누락 **44**/876. **#63** 목포9경 2(목포진→만호동 목포진길 11번길 1-5 수군진 역사공원·세종 21년·2014 객사 복원·문화재자료 137호 · 다도해 전경→유달산에서 고하도·외달도 조망). 순수 사진/개요 누락 **42**/876. **#64** 무안9경 2(식영정→몽탄면 호반로 562-15 息營亭·1630 한호 임연·문화재자료 237호 · 느러지→영산강 8경 2경 몽탄노적 · 톱머리·홀통→망운 톱머리길 66·현경 홀통길 198-1) + QA 검색 승달산 `126614` first_image 공란·초의선사탄생지 `127177` DB 미동기화 → 군 공식 사진. **#65** 보성9경 2(일림산 용추계곡→웅치면 용반리 664m 보성강 시원·용추폭포 · 주암호 서재필기념관→문덕면 용암길 8 개화문·생가 가내길 18-35). 순수 사진/개요 누락 **38**/876. **#66** QA 홍천9경 3경 미약골(`2613261`)·5경 가령폭포(`125658`) Tour firstimage 공란 → 홍천군 문화관광 9경 공식 사진. 순수 누락 건수는 contentId가 있어 **38** 유지. **#67** 산청9경 2(황매산 철쭉→차황면 법평리 1,113.1m 5월 철쭉 평전·관광공사 황매산(산청) 사진 · 남명조식유적지→시천면 사리 384 사적·1561 산천재·1576 덕천서원·국가유산청 1628317). 순수 사진/개요 누락 **34**/876(정적 합성 재집계. contentId·선정 사진 행 제외). 다음 허브 **서천9경 2**(장항송림산림욕장과 장항스카이워크·유부도와 서천갯벌) |

**다음 제시어**:

```
팔경 활용 #68, 서천 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-26-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 서천9경 사진·개요 없는 2건(장항송림산림욕장과 장항스카이워크·유부도와 서천갯벌)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=seocheon
```

---

### 팔경 contentId — main 병합 완료 ✅

| | |
|--|--|
| **상태** | **main 병합 완료 ✅** · squash merge `53b21b00` · PR [#185](https://github.com/catgeot/Days/pull/185) |
| **브랜치** | `cursor/palgyeong-cid` · merge commit `53b21b00` |
| **PR** | [#185](https://github.com/catgeot/Days/pull/185) (MERGED) |
| **플랜** | [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) · method **§5.7** |
| **큐** | [`korea-local-scenic-contentid-queue.md`](./korea-local-scenic-contentid-queue.md) — P0·P1·P2 전 라운드 종결 · 잔여 51건 terminal |
| **일지** | [`2026-09-04-project-log.md`](./2026-09-04-project-log.md) |
| **종결 성과** | P0 멤버 579/876 HIT, P1 허브 68 HIT, P2 820/871(94.1%) 충족 · 양구 수목원 자체 큐레이션 반영 완료 |

**다음 제시어 없음** (주제 종료). 후속 자체 큐레이션 작업은 아래 '명소 자체 큐레이션' 트랙에서 이어감.

---

### 명소 자체 큐레이션 — TourAPI 미등재 명소 보강

| | |
|--|--|
| **상태** | **#3 완료 (PR [#207](https://github.com/catgeot/Days/pull/207) open)** · tip `a62f7123` · **51건 전수 자체 큐레이션 100% 종결** (R00 1건, R01 14건, R02 16건, R03 20건) · 사람 PR 검토 및 병합 대기 |
| **브랜치** | `cursor/curated-scenic` |
| **tip** | `a62f7123` |
| **PR** | [#207](https://github.com/catgeot/Days/pull/207) |
| **가이드** | [`korea-curated-spots-guide.md`](./korea-curated-spots-guide.md) |
| **큐** | [`curated-scenic-spots-queue.md`](./curated-scenic-spots-queue.md) (전체 51건 중 51건 100% 완료, 잔여 0건) |
| **도구** | `scripts/report-curated-scenic-candidates.mjs` · `scripts/search-tourapi-photos.mjs` |
| **소유** | `korea-scenic-spots-overrides.mjs` · `korea-scenic-spot-images.json` · `koreaScenicSpots.json` |
| **금지** | AI 허구 본문 창작 금지(공식 팩트 기반 요약) · 저작권 미확인 블로그 사진 금지 · JSON 직접 편집 금지 |
| **VERIFY** | `npm run audit:korea-scenic-spots` · `npm run smoke:korea-scenic-spots` · `npm run build` |

**다음 제시어 없음** (51건 전수 자체 큐레이션 완료 종결, PR #207 검토 및 병합 대기).

---

### 지구본 홈 헤더 (Chrome 주소창 가림) — 종료 · 병합 안 함

| | |
|--|--|
| **상태** | **#12 종료** · 헤더 여백 유지 · PR [#181](https://github.com/catgeot/Days/pull/181) **닫음(미병합)** |
| **배포** | `https://www.gateo.kr/` — PR #175 모바일 `[로고+EN \| 검색]` · `p-4`(16px) **그대로** |
| **한계** | iOS Chrome 완전 종료 후 재실행 때 헤더가 주소창에 가릴 수 있음. 56px overlay 재시도 금지 |
| **일지** | [`2026-09-03-project-log.md`](./2026-09-03-project-log.md) |

**다음 제시어 없음** (주제 종료). 새 채팅에서 이 헤더 overlay를 다시 열지 않음.

---

### 홈 지구본 지명 (첫 로딩)

| | |
|--|--|
| **상태** | **#4 사람 PROD QA** · main `cf63192c` · PR [#182](https://github.com/catgeot/Days/pull/182) merge ✅ |
| **브랜치** | `cursor/globe-labels-ddce` · merge `cf63192c` |
| **일지** | [`2026-09-03-project-log.md`](./2026-09-03-project-log.md) |
| **PROD** | `https://www.gateo.kr/` |
| **VERIFY** | `smoke:globe-label-first-reveal` · `smoke:place-label-slug` · `vite build` |

**게이트**: 사파리 `www.gateo.kr` 첫 진입 — EN 없이 대륙·대양 지명 · 자전 · EN↔KO

**다음 제시어** (#4 사람 PROD QA):

```
홈 지구본 지명 #4, 사파리 PROD QA
@plans/feature-handoff-index.md
@plans/2026-09-03-project-log.md
PROD https://www.gateo.kr/
금지: UI 리디자인 · HomeGlobeMapbox 광역 리팩터 · 코드를 origin/main에 임의 push
작업: 사파리에서 www.gateo.kr 첫 진입(EN 없이) 지명 · 완전 종료 후 재실행 2~3회 · 자전 · EN↔KO
```

---

### 홈 축제칩 (써머리 펼침) — main 병합 ✅

| | |
|--|--|
| **상태** | **#4 merge ✅** · main `7f0f46ca` · PR [#177](https://github.com/catgeot/Days/pull/177) |
| **일지** | [`2026-09-02-project-log.md`](./2026-09-02-project-log.md) |
| **PROD** | `https://www.gateo.kr/` — 모바일 지명 탭 후 접힘 · PC 접힌 칩 라벨 전부 |

**게이트**: 사람 Preview QA PASS · `/qa/home-chip` 종료(PROD `/`) · 작업 로그 `active: false`

---

### 홈 검색바 히트 (EN 토글·검색 겹침) — main 병합 ✅

| | |
|--|--|
| **상태** | **#3 merge ✅** · main `9824bfb8` · PR [#175](https://github.com/catgeot/Days/pull/175) |
| **일지** | [`2026-09-02-project-log.md`](./2026-09-02-project-log.md) |
| **PROD** | `https://www.gateo.kr/` — 모바일 검색·EN 토글 각각 클릭 |

**게이트**: 사람 Preview QA PASS · `/qa/search-hit` 종료(PROD `/`) · 작업 로그 `active: false`

---

### 홈 locale 토글 (EN/KO) — main 병합 ✅

| | |
|--|--|
| **상태** | **#9 merge ✅** · main `a6a5ede7` · PR [#176](https://github.com/catgeot/Days/pull/176) (#174+#176) |
| **일지** | [`2026-09-01-project-log.md`](./2026-09-01-project-log.md) · [`2026-09-02-project-log.md`](./2026-09-02-project-log.md) |
| **잔여** | 검색바 히트 PR #175 merge `9824bfb8` ✅ |

---

### 세계 행사·축제 일정 연동 — 리스트 썸네일 컬러 (#57)

| | |
|--|--|
| **상태** | **#57** 리스트 썸네일 컬러 우선 **push** · tip `e824c37d` · PR [#218](https://github.com/catgeot/Days/pull/218) · 사람 Preview QA |
| **브랜치** | `cursor/world-events-wave3` · tip `e824c37d` |
| **PR** | [#218](https://github.com/catgeot/Days/pull/218) (OPEN) · [#206](https://github.com/catgeot/Days/pull/206) merge ✅ · [#205](https://github.com/catgeot/Days/pull/205) merge ✅ |
| **플랜** | [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) **§9** · [`world-events-management.md`](./world-events-management.md) |
| **일지** | [`2026-09-11-project-log.md`](./2026-09-11-project-log.md) |
| **Preview** | `/qa/world-events` → `/world-events` |
| **소유** | `worldEventListPhoto.js` · `fetchWorldEventListPhotos.js` · `worldEventHeroGalleryMerge.js` · `fetch-event-hero-gallery` |
| **금지** | worldEvents.json 직편집 · UI 리디자인 · 위키 시드를 리스트 사진으로 복구 · 허브에 플래너·숙소 칩 복구 |
| **VERIFY** | `smoke:world-events-hub` · `smoke:world-events-detail` · `audit:world-events` · `build` PASS |

**게이트**: #57 사람 Preview QA — `/world-events` 이스탄불 마라톤·추수감사절 카드가 **컬러**인지 (구 세션 캐시면 하드 리프레시). #56 갤러리 분위기도 같이 보면 됨. **사람 Preview** 전 merge 금지.

**다음 제시어** (#58 Preview QA):

```
세계행사 일정 #58, 리스트 컬러 썸네일 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/world-events-management.md
브랜치 cursor/world-events-wave3 · PR #218 · https://www.gateo.kr/qa/world-events
금지: worldEvents.json 직편집 · UI 리디자인 · 위키 시드를 리스트 사진으로 복구 · 허브에 플래너·숙소 칩 복구
작업: /world-events 이스탄불 마라톤·추수감사절 카드가 컬러인지 (필요하면 하드 리프레시)
```

---

### 축제 로드 — `/korea` 킬러 맵

| | |
|--|--|
| **상태** | **#3-a 진입 QA** · 벨트 스크롤 수정 · 사람 Preview → **#4 leg UI** |
| **브랜치** | `cursor/korea-festival-proxy` · tip `0708af9b` |
| **PR** | [#170](https://github.com/catgeot/Days/pull/170) |
| **플랜** | [`korea-festival-road-plan.md`](./korea-festival-road-plan.md) §9 · [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) S5 벨트 |
| **일지** | [`2026-09-01-project-log.md`](./2026-09-01-project-log.md) |
| **Preview** | `/qa/korea` → `/korea` · **로드** 칩·카드·선택 |
| **순번** | 로드 트랙 **#0~** · 미완 이어하기 **#Na** ([`korea-festival-road-plan.md`](./korea-festival-road-plan.md)) |
| **VERIFY** | `generate:korea-festival-belts` · `audit:korea-festival-belts` · `smoke:korea-festival-belts` · `build` |

**게이트**: #3 belt 진입 smoke·build PASS ✅ · #6·#8 = 사람 Preview QA.

**다음 제시어 (#4 leg UI)**:

```
축제 로드 #4, leg UI
@plans/feature-handoff-index.md
@plans/2026-09-01-project-log.md
@plans/korea-festival-road-plan.md
브랜치 cursor/korea-festival-proxy · PR #170 · Preview /qa/korea
금지: 지도(#5) 착수 · plans/ feature 커밋 · corridor 부활 · 한 세션 leg UI+지도
작업: FestivalBeltLegList · connector · 빈 leg · belt 모드 리스트 전환
```

---

### AI 큐레이션 — 지도·무니 핸드오프

| | |
|--|--|
| **상태** | **main 병합** PR #130 (PC 핸드오프) · PROD 배포 후 **모바일 QA** |
| **main** | PR #130 merge 후 SHA 확인 |
| **플랜** | [`blog-ai-curation-page-plan.md`](./blog-ai-curation-page-plan.md) |
| **일지** | [`2026-08-17-project-log.md`](./2026-08-17-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/blog/curation?debug=curation` — 모바일 「전체 지도」·「무니에게 묻기」 |
| **VERIFY** | `smoke-curation-place-bridge` · `npm run build` |

**다음 제시어**:

```
AI 큐레이션 #10, 모바일 PROD QA
@plans/feature-handoff-index.md
@plans/2026-08-17-project-log.md
www.gateo.kr/blog/curation?debug=curation · iPhone/Android 전체지도·무니
```

---

### 검색노출 (한·영 SEO)

| | |
|--|--|
| **상태** | **#24 RSS·canonical 재점검 PASS** · 에이전트 세션표 **완료** · 잔여 = 사람 GSC baseline · `/en/` prefix(합의 후) |
| **브랜치** | **`main`** |
| **플랜** | [`en-seo-followup-plan.md`](./en-seo-followup-plan.md) §9 |
| **일지** | [`2026-08-25-project-log.md`](./2026-08-25-project-log.md) |
| **제출 URL** | Sitemap `https://www.gateo.kr/sitemap.xml` (1133 URL) · RSS KO `https://www.gateo.kr/rss.xml` · RSS EN `https://www.gateo.kr/rss-en.xml` · `robots.txt`에 sitemap 선언됨 |
| **에이전트 VERIFY** | `smoke:rss-canonical` · `smoke:gsc-baseline` · `smoke:gsc-baseline-prod` · `audit:place-seo-en` · `build` |
| **사람** | GSC·네이버 서치어드바이저 sitemap/RSS 제출 · GSC 173건 baseline CSV(로컬 only) |

**다음 제시어** (백로그·합의 후):

```
검색노출 #25, /en/ URL prefix (합의 후)
@plans/feature-handoff-index.md
@plans/en-seo-followup-plan.md
/en/ prefix 합의 · i18n-en-plan 2차 URL과 동기
```

---

### 해안·해양 탐색
| **상태** | **main 병합 완료** (2026-08-16) · PROD 배포 후 QA |
| **main** | `14cc78ef` — PR #122 병합 + 뷰 폴링 제거 |
| **플랜** | [`coast-sea-explore-plan.md`](./coast-sea-explore-plan.md) §9 |
| **일지** | [`2026-08-16-project-log.md`](./2026-08-16-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/` — 모바일 대양 4 + 해역 리스트 연속 탭 |
| **VERIFY** | `smoke-sea-basin-rail` · `build` |

**다음 제시어**:

```
해안 해양 탐색 #17, PROD QA
@plans/feature-handoff-index.md
@plans/2026-08-16-project-log.md
main · www.gateo.kr 모바일 대양·해역 연속 탭
```

---

### 영문화 (English UI) — 2차 확장

| | |
|--|--|
| **상태** | **main 병합** PR #149 · PROD 배포 후 QA |
| **main** | `452c4c25` |
| **플랜** | [`i18n-en-plan.md`](./i18n-en-plan.md) §9 |
| **일지** | [`2026-08-24-project-log.md`](./2026-08-24-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/place/yap/planner?lang=en` — 배너·MICRONESIA 권역 EN |
| **VERIFY** | `audit:airports` · `audit:i18n` · `build` |

**#45 완료**: 플래너 bannerNote·bookingNote·권역 notesEn — PR #149 merge

**다음 제시어 (#46)**:

```
영문화 #46, PROD QA — 플래너 banner EN
@plans/feature-handoff-index.md
@plans/2026-08-24-project-log.md
@plans/i18n-en-plan.md
main · www.gateo.kr/place/yap/planner?lang=en
금지: GT 일괄 백필
```

---

### 지자체 팔경·구경 → 도시 명소 — 1차 종료 · main 병합 ✅

| | |
|--|--|
| **상태** | **#N merge ✅ · 주제 종료** · main `55194e80` · PR [#184](https://github.com/catgeot/Days/pull/184) |
| **브랜치** | `cursor/palgyeong` · merge `55194e80` |
| **PR** | [#172](https://github.com/catgeot/Days/pull/172) · [#183](https://github.com/catgeot/Days/pull/183) · [#184](https://github.com/catgeot/Days/pull/184) merged |
| **플랜** | [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md) **§9** |
| **큐** | [`korea-local-scenic-lists-queue.md`](./korea-local-scenic-lists-queue.md) — **1차 소진** |
| **일지** | [`2026-09-04-project-log.md`](./2026-09-04-project-log.md) |
| **PROD** | lists **94** · members **876** · I#12 ✅ |
| **잔여(선택)** | `pending_coord` **424**/876 — 좌표 보강은 **새 합의** 전 착수 금지 |
| **VERIFY** | `audit:korea-local-scenic-lists` · `audit:city-attraction-hubs` · `smoke:korea-local-scenic-lists` · `build` PASS |

**다음 제시어 없음** (수집 종료). `오케스트레이터 지자체팔경`을 다시 열지 않음. 검색·contentId는 **팔경 활용**·**팔경 contentId** 행.


## 행 추가 템플릿 (새 Cloud feature)

```markdown
### {주제}

| | |
|--|--|
| **상태** | … |
| **브랜치** | `cursor/…` |
| **tip** | `{sha}` |
| **플랜** | [`…-plan.md`](./…-plan.md) §9 |
| **일지** | [`YYYY-MM-DD-project-log.md`](./…) |
| **Preview** | `https://…-git-…vercel.app/…` |
| **VERIFY** | `npm run …` |

**다음 제시어** (7행 · `작업:` 포함 · [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) §1.2·§1.3):

\`\`\`
{주제} #{N}, {단계}
@plans/feature-handoff-index.md
@plans/YYYY-MM-DD-project-log.md
@plans/{주제}-plan.md
브랜치 cursor/… · PR #… · Preview/QA
금지: … · feature에 plans 커밋
작업: …
\`\`\`

**docs-on-main**: 핸드오프 3종은 **`main` push 필수** — feature에 `plans/**` 커밋 금지.
```
