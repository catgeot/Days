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

