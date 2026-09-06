# 2026-09-06 작업 로그

직전: [`2026-09-05-project-log.md`](./2026-09-05-project-log.md)

## 자킨토스 검색 #11, GLOBAL 대신 그리스

- **브랜치** `cursor/zakynthos-search-e84a` · tip `03a07a7c` · **PR [#199](https://github.com/catgeot/Days/pull/199)**
- #11 사람 QA: Explore를 비운 뒤 헤더가 Global. Search Box 객체 context + 방문 좌표 역지오로 그리스·Zakynthos를 붙임. 인물 썸네일 그리드 사용 안 함
- **VERIFY** `smoke:visited-place-search` · `smoke:unseen-place-search` · `smoke:zakynthos-search` · `smoke:sabah-search` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — 드롭다운·써머리·장소 헤더 그리스 · 해변 사진

```
자킨토스 검색 #12, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #199 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 자킨토스 재검색 드롭다운·써머리·장소 헤더가 그리스 · 해변 사진 · Global/Explore 아님 · 사바섬 회귀
```

## 자킨토스 검색 #10, 방문 요약 카드 — 그리스 · 사진

- **브랜치** `cursor/zakynthos-search-e84a` · tip `6c47ed6a` · **PR [#199](https://github.com/catgeot/Days/pull/199)**
- #10 사람 QA: 방문 요약은 뜨지만 Explore(익스플로러) 표기·사진 미호출. 방문 카드에 지도 히트의 그리스·Zakynthos를 겹침. 그리드는 저장 썸네일. SSOT 재등록 없음
- **VERIFY** `smoke:visited-place-search` · `smoke:unseen-place-search` · `smoke:zakynthos-search` · `smoke:sabah-search` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — 재검색 요약 그리스·해변 사진 · 사바 회귀

```
자킨토스 검색 #11, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #199 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 자킨토스 재검색 요약에 그리스 · 해변 사진 · Explore 아님 · 사바섬 회귀
```

## 자킨토스 검색 #9, 지도 우선 · 방문 요약 카드

- **브랜치** `cursor/zakynthos-search-e84a` · tip `cffe174f` · **PR [#199](https://github.com/catgeot/Days/pull/199)**
- #9 사람 Preview QA PASS. 「AI 탐색」표시는 지오코딩 실패가 아니라 Enter 공통 문구 → 지도 우선 카피로 수정. 방문 시 `place_stats`에 한글·영문·좌표를 남기고, 다음 검색부터 드롭다운·그리드·선택 카드에 요약이 뜸. AI는 지도 실패 후만. SSOT 재등록 없음
- **VERIFY** `smoke:visited-place-search` · `smoke:unseen-place-search` · `smoke:zakynthos-search` · `smoke:sabah-search` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — Enter 지도 로딩 · 방문 후 재검색 요약 카드 · 사바 회귀

```
자킨토스 검색 #10, 방문 요약 카드 QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #199 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: Enter 로딩이 지도 찾기인지 · 자킨토스 방문 후 재검색 시 요약/썸네일 카드 · 사바섬 회귀
```

## 자킨토스 검색 #8, 미등록 지명 Geocoding 보강

- **브랜치** `cursor/zakynthos-search-e84a` · tip `c03f3e5c` · **PR [#199](https://github.com/catgeot/Days/pull/199)**
- 자킨토스·사바 별칭이 아니라 검색 성능. Search Box ko 공백 `.every` 구멍 + 한글 쿼리를 해외 지명이 못 덮으면 Geocoding ko+en을 드롭다운 앞에 붙임. 지명별 SSOT 없음
- **VERIFY** `smoke:unseen-place-search` LIVE · `smoke:zakynthos-search` · `smoke:sabah-search` · `smoke:explore-search-aliases` · `vite build` PASS · 에이전트 QA: 케팔로니아·시프노스·포르멘테라·파로스·자킨토스
- **다음** 사람 Preview `/qa/zakynthos` — 미등록 한글 지명 드롭다운·영문 부제 · 자킨토스·사바 회귀
- **한계** 밀로스·코르푸·앙귈라·쿠라사오·스코펠로스는 Mapbox 인덱스 오탐/공백일 수 있음

```
자킨토스 검색 #9, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #199 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 탐색창 케팔로니아·시프노스·포르멘테라·파로스 → 해외 핀·영문 부제 · 자킨토스·사바섬 회귀
```

## 리뷰 연관 여행지 #1, 탭 유지

- **브랜치** `cursor/reviews-related-b9fa` · tip `d73ffc19` · **PR [#201](https://github.com/catgeot/Days/pull/201)**
- 리뷰탭 좌측 연관 칩 클릭이 탭을 안 넘겨 기본 갤러리로 열리던 문제. 리뷰에서 누르면 `/reviews` 유지 · 목록 맨 위 · 모바일 하단 칩도 리뷰에서 사용
- **VERIFY** `smoke:reviews-related-tab` · `smoke:gallery-related-scroll` · `vite build` PASS
- **다음** 사람 Preview `/qa/reviews-related` · git Preview `/place/paris/reviews`

**다음 제시어**:

```
리뷰 연관 여행지 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/reviews-related-b9fa · PR #201 · Preview /qa/reviews-related
금지: UI 리디자인 · 갤러리 칩을 리뷰로 바꾸기
작업: 파리 리뷰탭 좌측 칩 → 새 여행지도 리뷰탭 · 글이 없어도 칩으로 이어서 탐색 · 갤러리 칩은 갤러리 유지
```

## 갤러리 좌측 패널 #1, 공간 조정

- **브랜치** `cursor/gallery-panel-032e` · tip `7495e095` · **PR [#200](https://github.com/catgeot/Days/pull/200)**
- PC 갤러리 좌측 써머리가 길어지면 400px 안쪽 스크롤에 연관 검색어가 숨고, 무니 입력창 위는 비어 있었음. 본문만 남은 높이를 쓰고 칩은 무니 바로 위(스크롤 밖)
- **VERIFY** `smoke:gallery-related-scroll` · `smoke:gallery-photo-manage` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery-panel` · git Preview `/place/paris/gallery`

**다음 제시어**:

```
갤러리 좌측 패널 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-panel-032e · PR #200 · Preview /qa/gallery-panel
금지: UI 리디자인 · 연관 칩을 써머리 스크롤 안으로 되돌리기
작업: PC 파리 갤러리 좌측 — 스크롤 없이 하단 연관 검색어 · 무니 입력창 바로 위
```

## 자킨토스 검색 #7, 타이핑 드롭다운 복구

- **브랜치** `cursor/zakynthos-search-e84a` · tip `13aaffb4` · **PR [#197](https://github.com/catgeot/Days/pull/197)**
- Preview QA: 좌측 자킨토스 카드는 맞음. 드롭다운이 사라지고 타이핑 자동완성이 없음 → **의도 아님**. #6이 선택 카드 있으면 검색바 재오픈을 막음
- 포커스·클릭·타이핑은 다시 열고, Enter 선택 카드와 드롭다운은 같은 Zakynthos 핀. 라틴 hydrate 유지
- **VERIFY** `smoke:zakynthos-search` · `smoke:sabah-search` · `smoke:explore-search-aliases` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — 자킨토스 타이핑 시 드롭다운 · 좌측 카드 해변 · 사바섬 회귀

```
자킨토스 검색 #8, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #197 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 자킨토스 타이핑 자동완성 드롭다운 · 좌측 카드 동일 핀(Zakynthos 해변) · 사바섬 말레이시아 앞·카리브 둘째 · 한국 사원 아님
```

## 자킨토스 검색 #6, 드롭다운·선택 카드 동일 핀

- **브랜치** `cursor/zakynthos-search-e84a` · tip `a6ef54b4` · **PR [#197](https://github.com/catgeot/Days/pull/197)** (#196은 main 병합됨)
- Preview QA: 우측 드롭다운「자킨토스」와 좌측 선택 카드가 다른 핀. 드롭다운은 Search Box 한글 도시 → 한글 place_id 인물 갤러리. 좌측은 지오코딩 Zakynthos
- ko/en을 좌표로도 병합 · 선택 전 retrieve(en) · Enter 영문을 동명 히트에 이식 · 선택 카드가 있으면 드롭다운 재오픈 금지
- **VERIFY** `smoke:zakynthos-search` · `smoke:sabah-search` · `smoke:explore-search-aliases` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — 드롭다운·좌측 카드 모두 (Zakynthos) 해변 · 사바섬 말레이시아 앞·카리브 둘째

```
자킨토스 검색 #7, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #197 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 자킨토스 드롭다운·좌측 카드 동일 핀(Zakynthos 해변) · 사바섬 말레이시아 앞·카리브 둘째 · 한국 사원 아님
```

## 자킨토스 검색 — PR #196 merge ✅

- **PR [#196](https://github.com/catgeot/Days/pull/196)** FF merge → main `9299f3e8` (사람 요청)
- **PROD** `https://www.gateo.kr/` — 사바섬 Enter: 말레이시아 사바 앞 · 카리브 Saba 둘째
- **주제 종료** — 작업 로그 `active: false` · `/qa/zakynthos` → PROD `/`
- 자킨토스는 여행지 SSOT가 아님. #1(`b651`)에서 등록했다가 #2(`e84a`)에서 되돌림. 검색은 Mapbox uiPlace 카드(영문 Zakynthos)

## 자킨토스 검색 #5, 사바섬 카리브 Saba 둘째

- **브랜치** `cursor/zakynthos-search-e84a` · tip `75979aa7` · **PR [#196](https://github.com/catgeot/Days/pull/196)**
- Preview QA: 사바섬 Enter가 말레이시아 사바만. Mapbox ko「사바」가 SSOT와 이름 충돌. 카리브 네덜란드 Saba를 고정 동명으로 둘째 카드에 유지
- **VERIFY** `smoke:sabah-search` · `smoke:explore-search-aliases` · `smoke:zakynthos-search` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — 사바섬 → 사바(말레이시아) 앞 · 사바섬(Saba, 네덜란드) 둘째

```
자킨토스 검색 #6, 사바섬 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #196 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 탐색창 사바섬 Enter → 사바(말레이시아) 앞 · 사바섬(Saba, 네덜란드) 둘째 · 한국 사원 아님 · 자킨토스 회귀
```

## 자킨토스 검색 #4, 사바섬 말레이시아 여행지

- **브랜치** `cursor/zakynthos-search-e84a` · tip `82c2acfb` · **PR [#196](https://github.com/catgeot/Days/pull/196)**
- 사람 QA: 사바섬 카드가 카리브 Saba만. 여행 프로「사바섬」= 말레이시아 사바주. SSOT `sabah` + Mapbox 카리브는 동명 카드
- **VERIFY** `smoke:sabah-search` · `smoke:explore-search-aliases` · `smoke:zakynthos-search` · `audit:airports` none: 0 · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — 사바섬 → 사바(말레이시아) 여행지 앞 · 카리브 Saba 둘째(있으면)

```
자킨토스 검색 #5, 사바섬 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #196 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 탐색창 사바섬 Enter → 사바(말레이시아) 여행지 앞 · (있으면) 카리브 Saba 둘째 · 한국 사원 아님 · 자킨토스 회귀
```

## 자킨토스 검색 #3, 사바섬 Search Box region

- **브랜치** `cursor/zakynthos-search-e84a` · tip `5d708a67` · **PR [#196](https://github.com/catgeot/Days/pull/196)**
- 자킨토스 사람 Preview PASS. 「사바섬」= 카리브 네덜란드 Saba. Search Box region 누락 → 사보섬. Enter는 region 점수 미달·Nominatim KR 필터 → AI가 서울 구르두와라 시리 싱 사바 사헤브로 교정
- 섬 쿼리: region 가산·POI 감점·KR 우선 생략·「섬」strip 생략 · Search Box `region,place,city`
- **VERIFY** `smoke:explore-search-aliases` · `smoke:zakynthos-search` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — 사바섬 Enter → `(Saba)` · 한국 사원 1순위 아님

```
자킨토스 검색 #4, 사바섬 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #196 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 탐색창 사바섬 Enter → 카리브 네덜란드 (Saba) · 한국 시크 사원·사보섬 1순위 아님 · 자킨토스 회귀
```

## 자킨토스 검색 #2, Preview QA — 맵박스 영문명 uiPlace

- **브랜치** `cursor/zakynthos-search-e84a` · tip `14f0b204` · **PR [#196](https://github.com/catgeot/Days/pull/196)**
- #195 SSOT 등록을 되돌림. 자킨토스는 검색·DB uiPlace. Mapbox ko+en으로 라틴 `name_en` → 카드 부제·갤러리·영상. 캐시 v1.21
- **VERIFY** `smoke:zakynthos-search` · `smoke:gallery-portrait-filter` · `smoke:place-gallery-pexels` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` — 탐색창 자킨토스 → `(Zakynthos)` · 해변 갤러리 · 영상·플래너 · 여행지 뱃지 아님

```
자킨토스 검색 #3, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-e84a · PR #196 · Preview /qa/zakynthos
금지: UI 리디자인 · 자킨토스 SSOT 재등록 · orientation=landscape 재도입
작업: 탐색창 자킨토스 → (Zakynthos) 부제 · 해변 갤러리 · 영상 · 플래너 · 여행지 SSOT 뱃지 아님
```

## 자킨토스 검색 #1, SSOT 등록

- **브랜치** `cursor/zakynthos-search-b651` · tip `3a27c4dc` · **PR [#195](https://github.com/catgeot/Days/pull/195)**
- 배포본 탐색창「자킨토스」가 Mapbox 한글 도시(영문 없음·인물 갤러리)로 열리던 문제 → SSOT 여행지 + 자킨토시/잔테/Zante 별칭
- **VERIFY** `smoke:zakynthos-search` · `audit:airports` none: 0 · `audit:ferries` · `vite build` PASS
- **다음** 사람 Preview `/qa/zakynthos` · git Preview `/place/zakynthos`

```
자킨토스 검색 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/zakynthos-search-b651 · PR #195 · Preview /qa/zakynthos
금지: UI 리디자인 · orientation=landscape 재도입
작업: 탐색창 자킨토스·자킨토시 → (Zakynthos) 영문·여행지 뱃지·해변 갤러리
```

## 갤러리 인물 제외 #1, 단일 인물 필터

- **브랜치** `cursor/gallery-c260` · tip `7decd79c` · **PR [#187](https://github.com/catgeot/Days/pull/187)**
- Unsplash/Pexels에 인물 제외 파라미터 없음 · `orientation=landscape` 미사용(세로 전경 유지)
- [`galleryPortraitFilter.js`](../src/utils/galleryPortraitFilter.js) — 셀카·헤드샷·세로 단일 인물만 제외, 전경 속 사람 유지 · 캐시 v1.19
- **VERIFY** `smoke:gallery-portrait-filter` · `smoke:place-gallery-pexels` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery` · `/place/paris/gallery`

## 갤러리 인물 제외 — PR #187 merge ✅

- **PR [#187](https://github.com/catgeot/Days/pull/187)** squash merge → main `eb1189b6`
- **PROD** `https://www.gateo.kr/place/paris/gallery`
- **한계** DB에 인물만 쌓인 곳은 빈 갤러리 가드·island/travel 태그로 필터가 통과함 (자킨토스)

## 갤러리 인물 제외 #2, DB 고착 수정

- **브랜치** `cursor/gallery-2-c260` · tip `0dee0daa` · **PR [#194](https://github.com/catgeot/Days/pull/194)**
- 캡션에 전경이 있을 때만 사람 컷 유지 · 필터 후 0장이면 `place_stats` 건너뛰고 LIVE · 캐시 v1.20
- **VERIFY** `smoke:gallery-portrait-filter` · `smoke:place-gallery-pexels` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery-portrait` · 자킨토스 갤러리

## 갤러리 인물 제외 — PR #194 merge ✅

- **PR [#194](https://github.com/catgeot/Days/pull/194)** FF merge → main `4e748b4b` (사람 요청)
- **PROD** `https://www.gateo.kr/` — 자킨토스 갤러리
- **주제 종료** — DB 인물 고착 시 LIVE 재조회

**다음 제시어 없음** (주제 종료).

## 갤러리 사진 관리 #1, 모바일 길게 누르기

- **브랜치** `cursor/gallery-manage-173f` · tip `36992c74` · **PR [#188](https://github.com/catgeot/Days/pull/188)**
- 모바일 그리드·확대 보기 **길게 누르기** → 확인 시트 → 기존 `handleRemoveImage`로 `place_stats`에서 제거. PC Ctrl/⌘+더블클릭 유지. 상시 휴지통 버튼 없음.
- **VERIFY** `smoke:gallery-photo-manage` · `smoke:gallery-portrait-filter` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery` · git Preview `/place/paris/gallery`

**다음 제시어**:

```
갤러리 사진 관리 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-manage-173f · PR #188 · Preview /qa/gallery
금지: 상시 휴지통 버튼 · PC Ctrl+더블클릭 제거 · UI 리디자인
작업: 모바일 타일 꾹 → 제거 확인 · 짧은 탭은 확대 · 확대 보기도 길게 누르기 · PC Ctrl+더블클릭 유지
```

## 갤러리 사진 관리 — PR #188 merge ✅

- **PR [#188](https://github.com/catgeot/Days/pull/188)** squash merge → main `d575c9a7`
- **PROD** `https://www.gateo.kr/place/paris/gallery`
- **주제 종료** — 모바일 길게 누르기 제거는 PROD

## 갤러리 캐시 신선도 #1, DB 즉시 + 스톡 SWR

- **브랜치** `cursor/gallery-swr-6b36` · tip `b7ee61e5` · **PR [#189](https://github.com/catgeot/Days/pull/189)**
- DB/세션 **즉시 표시** · 갤러리 탭만 **7일 Unsplash SWR**(hero·`image_url` 유지) · 검색 카드 `thumbnailOnly` · 제거 사진은 SWR 재유입 금지
- **VERIFY** `smoke:gallery-cache-policy` · `smoke:place-gallery-pexels` · `smoke:gallery-portrait-filter` · `smoke:gallery-photo-manage` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery-fresh` · git Preview `/place/paris/gallery`

**다음 제시어**:

```
갤러리 캐시 신선도 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-swr-6b36 · PR #189 · Preview /qa/gallery-fresh
금지: image_url SWR 덮어쓰기 · Tour 우세 스톡 치환 · 더보기 DB upsert · UI 리디자인
작업: 파리 갤러리 즉시 표시 · 대표 사진 유지 · 새 장이 뒤에 붙는지 · 검색/버킷 썸네일 흔들림 없음
```

## 갤러리 연관 스크롤 #1, 여행지 전환 상단

- **브랜치** `cursor/gallery-scroll-76a6` · tip `41b747c1` · **PR [#190](https://github.com/catgeot/Days/pull/190)**
- 하단 연관 칩 클릭 시 이전 갤러리 스크롤이 남아 새 여행지 중간부터 보이던 UX → 장소 전환 시 중첩 스크롤 즉시 상단 · 갤러리 탭 유지
- **VERIFY** `smoke:gallery-related-scroll` · `smoke:gallery-photo-manage` · `smoke:gallery-portrait-filter` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery-related` · git Preview `/place/paris/gallery`

**다음 제시어**:

```
갤러리 연관 스크롤 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-scroll-76a6 · PR #190 · Preview /qa/gallery-related
금지: UI 리디자인 · 더보기 스크롤 리셋 · 헤더 탭 smooth 제거
작업: 파리 갤러리 중간 스크롤 → 하단 연관 칩 → 새 여행지 상단(소개·첫 사진) · 한 번 더 전환
```

## 릴리스 노트 푸터 #1, 자동 팝업 제거

- **브랜치** `cursor/updates-0e16` · tip `6dcd5b93` · **PR [#191](https://github.com/catgeot/Days/pull/191)**
- 홈·Preview 진입 릴리스 노트 모달 제거. 내역은 로고 패널 푸터 Updates만. 배포 새로고침 안내는 유지. §1.7 = 푸터만·자동 팝업 금지.
- **VERIFY** `smoke:release-notes-footer` · `vite build` PASS
- **다음** 사람 Preview `/qa/updates` · git Preview `/`

**다음 제시어**:

```
릴리스 노트 푸터 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/updates-0e16 · PR #191 · Preview /qa/updates
금지: 릴리스 노트 홈 팝업 재도입 · UI 리디자인 · 버그픽스/미세 UI를 Updates에 넣기
작업: 홈 진입 시 공지 모달 없음 · 로고 패널 푸터 Updates에 기존 내역 · 배포 새로고침 안내는 PROD만
```

## 여행사 목록 #1, 재접속 경로

- **브랜치** `cursor/agencies-85ab` · tip `8ed679af` · **PR [#192](https://github.com/catgeot/Days/pull/192)**
- 로고 패널(비로그인 포함)·탐색 「여행사」칩·플래너에 연결된 제휴 여행사 + 이 기기 방문 기록(마지막 URL). MRT 예약 후 사이트 미저장 이탈 시 재접속 경로.
- **VERIFY** `smoke:travel-agencies` · `vite build` PASS
- **다음** 사람 Preview `/qa/agencies` · git Preview `/` · `/explore` · `/place/paris/planner`

**다음 제시어**:

```
여행사 목록 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/agencies-85ab · PR #192 · Preview /qa/agencies
금지: 로고/탐색/플래너 리디자인 · 예약 대행 카피
작업: 로고 패널에서 마이리얼트립 · 숙소 연 뒤 방문 기록 · 탐색 여행사 칩 · 파리 플래너 접힌 목록
```

## 여행사 목록 #2, 겟유어가이드 방문 기록

- **브랜치** `cursor/agencies-85ab` · tip `779ea69b` · **PR [#192](https://github.com/catgeot/Days/pull/192)**
- 사람 QA: MRT·트립닷컴 방문 기록 OK · 겟유어가이드는 iframe 위젯이라 투어를 눌러도 안 남음. 위젯 포커스 시 제휴 검색/홈 URL 저장.
- **VERIFY** `smoke:travel-agencies` · `vite build` PASS
- **다음** 사람 Preview `/qa/agencies` — 파리 플래너·투어 찾기 GYG → 로고 패널 방문 기록

**다음 제시어**:

```
여행사 목록 #3, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/agencies-85ab · PR #192 · Preview /qa/agencies
금지: 로고/탐색/플래너 리디자인 · 예약 대행 카피
작업: 파리 플래너·투어 찾기에서 겟유어가이드 투어 연 뒤 로고 패널 방문 기록 · MRT·트립닷컴 회귀
```

## 여행사 목록 #3, 방문한 여행사 접힘

- **브랜치** `cursor/agencies-85ab` · tip `c6fdd253` · **PR [#198](https://github.com/catgeot/Days/pull/198)** (#192 merge ✅)
- 로고 패널 목록이 패널을 가득 채우던 UX → 「방문한 여행사」**접힌 기본값**. 탐색창 칩 명칭만 「여행사」→「방문한 여행사」.
- **VERIFY** `smoke:travel-agencies` · `vite build` PASS
- **다음** 사람 Preview `/qa/agencies` — 로고 패널 접힘·펼침 · 탐색 칩 명칭 · 방문 기록 회귀

**다음 제시어**:

```
여행사 목록 #4, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/agencies-85ab · PR #198 · Preview /qa/agencies
금지: 로고/탐색/플래너 리디자인 · 예약 대행 카피
작업: 로고 패널 「방문한 여행사」접힘 · 펼치면 목록 · 탐색창 칩 명칭 · 방문 기록 회귀
```

## 공항픽업 링크 #1, OneLink 우회

- **브랜치** `cursor/klook-pickup-d5a5` · tip `3828b09b` · **PR [#193](https://github.com/catgeot/Days/pull/193)**
- 배포본이 괜찮아 보여도 `affiliate.klook.com/redirect` 는 Referer 무관하게 `klook.onelink.me` + `klook://` — 첫 방문·사파리에서 동일 경고 가능. Preview에서 더 잘 드러남.
- `klook.com?aid=118544` 웹 직행. UI 변경 없음.
- **VERIFY** `smoke:klook-affiliate` · `smoke:travel-agencies` · `vite build` PASS
- **다음** 사람 Preview `/qa/pickup` · git Preview `/place/fukuoka/planner`

**다음 제시어**:

```
공항픽업 링크 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/klook-pickup-d5a5 · PR #193 · Preview /qa/pickup
금지: UI 리디자인 · 제휴 aid 변경
작업: 후쿠오카 플래너 공항 픽업 → 클룩 웹(GATEO) · iOS 앱 열기 경고 없는지
```
