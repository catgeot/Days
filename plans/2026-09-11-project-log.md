# 2026-09-11 프로젝트 일지

직전: [`2026-09-10-project-log.md`](./2026-09-10-project-log.md)

## 명승 숙소 #1 — 명소 본문 숙소 섹션 (Cloud)

- **세션** `명승 숙소 #1, 본문 숙소 섹션`
- **브랜치** `cursor/scenic-stay-692c` · tip `31c92c70` · PR [#214](https://github.com/catgeot/Days/pull/214) (OPEN)
- **완료**: 명승 홈에서 숙소를 보려면 지구본 장소 카드를 열어야 했던 흐름을, 축제 `FestivalStayStrip`과 같은 `EventStayStrip`으로 명소 본문(`ThemeSpotDetailModal`)에 넣음. 행사 프리셋 없이 MRT 기본 일정(+14일·3박). 맛집·레포츠·문화 중첩 모달에는 숨김.
- **VERIFY** `smoke:korea-scenic-stay` PASS · `smoke:korea-festival-stay-url` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/scenic-stay → `/korea/theme/scenic?spot=gyeongbokgung`
- **다음** 사람 Preview QA — 본문 숙소 카드·일정·MRT 목록

```
명승 숙소 #2, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
브랜치 cursor/scenic-stay-692c · PR #214 · Preview /qa/scenic-stay
금지: UI 리디자인 · 축제 시트 리팩터 · feature에 plans/** 커밋
작업: /korea/theme/scenic?spot=gyeongbokgung 본문에 축제와 같은 숙소 카드·일정·MRT 목록이 있는지
```

## 명승 숙소 #2 — 숙소 위치·구글 링크 (Cloud)

- **세션** `명승 숙소 #2, 사람 Preview QA`
- **브랜치** `cursor/scenic-stay-692c` · tip `37097755` · PR [#214](https://github.com/catgeot/Days/pull/214) (OPEN)
- **완료**: 숙소 섹션을 본문 하단(주변 맛집·축제 다음)에서 **개요·주소·사진 다음 · 주변 맛집 위**로 옮김. 네이버 상세정보 옆에 같은 검색어의 구글 버튼 추가. 맛집·레포츠·문화 중첩 모달에는 스트립 없음.
- **VERIFY** `smoke:korea-scenic-stay` PASS · `smoke:korea-festival-stay-url` PASS · `smoke:korea-theme-cross-links` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/scenic-stay → `/korea/theme/scenic?spot=gyeongbokgung`
- **다음** 사람 Preview QA — 숙소 위치 · 네이버·구글 칩

```
명승 숙소 #3, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
브랜치 cursor/scenic-stay-692c · PR #214 · Preview /qa/scenic-stay
금지: UI 리디자인 · 축제 시트 리팩터 · feature에 plans/** 커밋
작업: 경복궁 본문에서 숙소가 개요·사진 아래·맛집 위인지 · 네이버·구글 칩이 나란히 열리는지
```

## 팔경 활용 #8 — 빙계팔경 경승별 사진 다양화 (Cloud)

- **세션** `팔경 활용 #8, 빙계 팔경 사진 다양화`
- **브랜치** `cursor/palgyeong-use-e744` · tip `b0f0766e` · PR [#212](https://github.com/catgeot/Days/pull/212) (OPEN)
- **완료**: 빙계팔경 7행이 같은 VisitKorea 계곡 항공 사진(`3542362`)을 쓰던 문제를 고침. 의성군 문화관광(빙혈 입구·절벽 계류·인암 각자·출렁다리·석탑 단풍)과 TourAPI 빙계계곡·빙계서원 갤러리로 8행 썸네일·본문 갤러리를 경승마다 다르게 연결. JSON contentId는 채우지 않음.
- **VERIFY** `smoke:korea-local-scenic-lists` PASS (썸네일 8장 서로 다름 · 갤러리 URL 중복 없음) · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=uiseong`
- **다음** 사람 Preview QA — 8행 썸네일·본문 갤러리가 경승에 맞는지

```
팔경 활용 #9, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #212 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic?hub=uiseong 빙계팔경 8행 썸네일이 서로 다른지 · 행을 열어 본문 갤러리가 경승(빙혈 입구·절벽·바위·서원·다리·석탑·봉우리·용소)에 맞는지
```

## 팔경 활용 #9 — Preview QA 후 PR #212 merge

- 사람 Preview QA 후 PR [#212](https://github.com/catgeot/Days/pull/212) squash merge `25ea5579`
- 피드백: 8행 부제가 모두 「의성 팔경」이라 번호가 필요 → #10

## 팔경 활용 #10 — 팔경 행 부제 번호 (Cloud)

- **세션** `팔경 활용 #10, 팔경 번호`
- **브랜치** `cursor/palgyeong-use-e744` · tip `6e3c4f4b` · PR [#213](https://github.com/catgeot/Days/pull/213) merge ✅ `d28b4733`
- **완료**: 멤버 행 부제를 `의성 1경`~`의성 8경`으로 붙임. 그룹 칩은 `의성 팔경` 유지. JSON contentId 없음.
- **VERIFY** `smoke:korea-local-scenic-lists` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=uiseong`

## 팔경 활용 #11 — #213 merge 후 결손 큐 정리

- PR [#213](https://github.com/catgeot/Days/pull/213) squash merge `d28b4733`
- 사진·개요 없는 순수 결손 **237명**. 다음 오버레이 허브: 광양9경 6건 · 하동10경 7건. 그다음 영동 한천팔경·함안9경.
- `#12`는 축제 인근 썸네일·번호(PR [#215](https://github.com/catgeot/Days/pull/215))가 이미 씀 → 결손 오버레이는 **#13**

## 팔경 활용 #12 — 축제 인근 명소 썸네일·팔경 번호 (Cloud)

- **세션** `팔경 활용 #12, 축제 인근 썸네일·번호`
- **브랜치** `cursor/palgyeong-use-e744` · tip `a5b683e1` · PR [#215](https://github.com/catgeot/Days/pull/215) merge ✅ `b929e7fd`
- **완료**: 축제 상세 「인근 명소」에 GATEO 선정 썸네일. 「주변 관광지」 팔경 행에 명소 페이지와 같은 `{시군} N경` 부제(`원주 1경`)와 Tour/큐레이션 사진. 그룹 칩은 `원주 팔경` 유지. 광양·하동 결손 오버레이는 **#14**로 미룸.
- **VERIFY** `smoke:korea-local-scenic-lists` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea` 원주 축제 상세
- **다음** 사람 Preview QA — 인근 명소 사진 · 원주 팔경 1경~8경

```
팔경 활용 #13, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #215 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea 원주 축제 상세 — 인근 명소 썸네일 · 원주 팔경 행이 원주 1경~8경인지 · 그룹 제목이 원주 팔경인지
```

## 팔경 활용 #13 — 광양·하동 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #13, 광양·하동 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `e29213bb` · PR [#216](https://github.com/catgeot/Days/pull/216) (OPEN)
- **완료**: `LOCAL_SCENIC_MEMBER_OVERLAYS`에 광양9경 결손 6건·하동10경 결손 7건 공공 공식 팩트 개요·주소·사진. JSON contentId·scenic 승격 없음. 금오산 일출은 하동케이블카, 형제봉 철쭉은 평사리들판 조망(의도적 근사). **검색**: 명승 검색 `하동`/`하동 십경`에 십경 10행 주입(표시명 exact + 명소 풀 멤버 주입).
- **VERIFY** `smoke:korea-local-scenic-lists` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic` 검색 하동 · `?hub=gwangyang` · `?hub=hadong`
- **다음** 사람 Preview QA — 검색 하동 십경 · 결손 13행 썸네일·개요 · 행마다 다른 사진

```
팔경 활용 #14, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #216 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic 검색 하동·하동 십경에 그룹 하동 십경 10행이 있는지 · ?hub=gwangyang 결손 6행·?hub=hadong 결손 7행 썸네일·개요 · 행마다 사진이 다른지
```

## 팔경 활용 #14 — 하동 검색 십경·대표 명소 그룹 분리 (Cloud)

- **세션** `팔경 활용 #14, 하동 검색 그룹 묶기`
- **브랜치** `cursor/palgyeong-use-e744` · tip `91c3301d` · PR [#216](https://github.com/catgeot/Days/pull/216) (OPEN)
- **완료**: 사람 Preview QA에서 검색 「하동」리스트가 십경·대표 명소가 한 줄씩 엇갈리며 소제목이 반복됨. `sortScenicSpotsByPlaceCluster`가 `groupTitle`을 깨서, 팔경 그룹은 1경→10경 한 덩어리·대표 명소는 그 뒤로. JSON contentId·scenic 승격 없음.
- **VERIFY** `smoke:korea-local-scenic-lists` PASS · `smoke:korea-scenic-place-cluster` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic` 검색 하동 · `?hub=gwangyang` · `?hub=hadong`
- **다음** 사람 Preview QA — 검색 하동 십경 한 덩어리 · 소제목 반복 없음 · 결손 13행 썸네일·개요

```
팔경 활용 #15, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #216 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic 검색 하동 — 하동 십경 10행이 한 덩어리인지, 그 다음 지역 대표 명소인지 · 소제목이 반복되지 않는지 · ?hub=gwangyang 결손 6행·?hub=hadong 결손 7행 썸네일·개요 · 행마다 사진이 다른지
```

## 팔경 활용 #14 — PR #216 main 병합 · 다음 결손 영동

- **세션** `팔경 활용 #14` Preview QA PASS · PR [#216](https://github.com/catgeot/Days/pull/216) merge ✅ `210d8a56`
- **잔여**: 사진/개요 순수 누락 **224**/876. 큐 다음 허브 **영동**(한천팔경 7 + 양산팔경 6) · 그다음 함안9경 7 · 사천9경 6
- **다음** 영동 한천·양산 결손 오버레이

```
팔경 활용 #15, 영동 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 영동 한천팔경 사진·개요 없는 7건(화헌악·용연대·산양벽·청학굴·법존암·사군봉·냉천정)과 양산팔경 6건(비봉산·봉황대·함벽정·여의정·자풍서당·용암)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=yeongdong
```

## 팔경 활용 #15 — 영동 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #15, 영동 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `4b354407`
- **완료**: `LOCAL_SCENIC_MEMBER_OVERLAYS`에 한천팔경 결손 7건·양산팔경 결손 6건 영동군 공식 팩트 개요·주소·한국관광공사 공개 사진. JSON contentId·scenic 승격 없음. 사군봉·용암 등 일부는 지역 근사 Tour 사진(의도적 근사).
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` · `npm run build` PASS
- **잔여**: 사진/개요 순수 누락 **211**/876. 다음 허브 **함안9경 7** · 사천9경 6
- **다음** 사람 Preview QA — `?hub=yeongdong` 한천·양산 결손 13행 썸네일·개요 · 행마다 다른 사진

## 팔경 활용 #16 — 사람 Preview QA 피드백 반영 (Cloud)

- **세션** `팔경 활용 #16, 사람 Preview QA 피드백 반영`
- **브랜치** `cursor/palgyeong-use-e744` · tip `64e018c8`
- **완료**:
  1. `scenicSearch.js`: 검색창에 「한천」입력 시 `matchLocalScenicListForScenicSearch`와 연계하여 한천팔경 8행이 GATEO 명소 풀에 정상 주입되도록 수정 (기존 월류봉 1건 단독 노출 문제 해결).
  2. `koreaLocalScenicLists.js`: 허브 지명(고성·양산 등) 단독 검색 시 팔경 리스트 오매칭 가드 추가.
  3. `LOCAL_SCENIC_MEMBER_OVERLAYS`: 경남 양산 12경(`yangsan-other`)의 사진 누락 멤버인 **내원사 계곡(3경)** 과 **황산공원(9경)** 에 한국관광공사 공공 팩트 개요·주소·공식 사진을 보강. 영동 양산팔경 제2경 **강선대**도 실사진을 보강하여 영동 2개 팔경 16행 썸네일이 모두 고유하게 노출되도록 보장.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **잔여**: 사진/개요 순수 누락 **208**/876. 다음 허브 **함안9경 7** · 사천9경 6
- **다음** 사람 Preview QA — 영동 16행 및 「한천」검색 8행, 「양산」검색 내원사계곡·황산공원 썸네일·개요 확인

```
팔경 활용 #17, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic?hub=yeongdong 16행 사진·개요 고유한지 · 검색창 「한천」입력 시 한천팔경 8행 주입되는지 · 「양산」검색 시 내원사계곡·황산공원 썸네일·개요 뜨는지
```

## 세계행사 일정 #55 — 상세 갤러리 Unsplash 우선 배치 및 시드 정비 (Cloud)

- **세션** `세계행사 일정 #55, 상세 갤러리 Unsplash 우선 배치`
- **브랜치** `cursor/world-events-wave3` · tip `b52f148b` · PR [#218](https://github.com/catgeot/Days/pull/218) (OPEN)
- **완료**:
  1. 상세 히어로 갤러리(`EventDetailHero`)에서 생생한 축제 분위기의 Unsplash 사진을 최상단 슬롯(0~N)에 우선 배치하도록 머지 유틸(`mergeWorldEventHeroGalleryImages`) 및 Edge Function(`fetch-event-hero-gallery`) 로직을 개선.
  2. Unsplash 고유 ID가 `galleryNearDupKey`에서 과잉 축약되어 탈락하지 않도록 unplash 도메인 예외 가드 추가.
  3. `heroGallerySeedCacheMatches`가 순서에 의존하지 않고 Set 기반으로 시드 유효성을 체크하도록 개선하여 기존 DB 캐시와 신규 Unsplash 우선 순서가 모두 안정적으로 동작하도록 처리.
  4. 옥토버페스트 시드에 포함되어 있던 지하철역 에스컬레이터 비상레버 사진을 실제 축제 개막(`O'zapft is!`) 및 텐트 내부(`Hofbraudedans`) 사진으로 교체하고, 빈 국립오페라 중복 외관 시드를 대극장 객석(`Zuschauerraum`) 사진으로 정비.
- **VERIFY**: `smoke:world-events-hub` PASS · `audit:world-events` PASS · `smoke:world-events-detail` PASS · `build` PASS
- **Preview** https://www.gateo.kr/qa/world-events → `/world-events/munich-oktoberfest-2026`
- **다음** 사람 Preview QA — 옥토버페스트 및 세계행사 상세 진입 시 생생한 축제 사진이 첫 화면과 썸네일 전면에 나오는지 확인

```
세계행사 일정 #56, 상세 갤러리 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/world-events-management.md
브랜치 cursor/world-events-wave3 · PR #218 · https://www.gateo.kr/qa/world-events
금지: worldEvents.json 직편집 · UI 리디자인 · 위키 시드를 리스트 사진으로 복구 · 허브에 플래너·숙소 칩 복구
작업: /world-events/munich-oktoberfest-2026 등 상세 본문 갤러리 1~3번에 생생한 축제 사진이 나오는지 · 지하철 비상레버 등 무관 사진이 없는지 확인
```

## 세계행사 일정 #56 — 상세 갤러리 축제 분위기 QA (Cloud)

- **세션** `세계행사 일정 #56, 상세 갤러리 축제 분위기 QA`
- **브랜치** `cursor/world-events-wave3` · tip `bc7ff714` · PR [#218](https://github.com/catgeot/Days/pull/218) (OPEN)
- **완료**:
  1. 사람 Preview: 빈 오페라·두바이가 시드 3장(건물·스카이라인)만 표시. `heroGallerySearchQueryEn`이 generate에서 빠져 JSON에 없었고, Edge 타임아웃 시 Unsplash 폴백이 끊김.
  2. 분위기 영문 검색어를 스키마·23개 행사 JSON에 통과. 갤러리 랭킹으로 군중·객석·마라톤을 스카이라인·파사드보다 앞에 둠.
  3. 빈 오페라 시드를 대극장·무대로, 두바이 시드를 마라톤·사이클링으로 교체.
- **VERIFY**: `smoke:world-events-hub` PASS · `audit:world-events` PASS · `smoke:world-events-detail` PASS · `build` PASS
- **Preview** https://www.gateo.kr/qa/world-events → 빈 오페라 · 두바이 피트니스 · 옥토버페스트
- **다음** 사람 Preview QA — 갤러리 1~3번이 객석·러닝·축제 현장인지, 시드 3장만 남았는지

```
세계행사 일정 #57, 상세 갤러리 분위기 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/world-events-management.md
브랜치 cursor/world-events-wave3 · PR #218 · https://www.gateo.kr/qa/world-events
금지: worldEvents.json 직편집 · UI 리디자인 · 위키 시드를 리스트 사진으로 복구 · 허브에 플래너·숙소 칩 복구
작업: /world-events/vienna-staatsoper-season-2026 · /world-events/dubai-fitness-challenge-2026 · /world-events/munich-oktoberfest-2026 갤러리 1~3번이 객석·마라톤·축제 현장인지 · 시드 3장(건물/스카이라인)만 남았는지
```



