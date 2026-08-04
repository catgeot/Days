# 2026-08-04 프로젝트 일지

직전: [`2026-08-03-project-log.md`](./2026-08-03-project-log.md)

## 테마여행 #19, 크로스 레일

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · Preview QA 대기

- **한 일**: `ThemeSpotDetailModal` 하단 크로스 레일(§2.5.4) · top10/scenic/regions에 hub·좌표 전달 · regions/courses/`/korea` `?area=` 수신(축제 칩·지도 미개편) · 작업로그 #19
- **VERIFY**: `npm run smoke:korea-theme-cross-links` · `npm run smoke:korea-theme-spot-modal` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/top10`
- **QA**: top10 한라산 모달 스크롤 → 테마 칩·같은 도시·인근·숙소/투어·축제/코스 · 축제 링크는 `?from=theme&area=` · 제주면 패키지 CTA
- **다음**: 폴리시·릴리스(#20)

```
테마여행 #20, 폴리시·릴리스
```

## 테마여행 #18, 테마 연결

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `d113fae8` · Preview QA(전략·매처 · UI는 #19)

- **한 일**: 플랜 **§2.5·S12** 잠금 · `koreaThemeCrossLinks.js`(멤버십·sameHub·nearby·stay/tna·package·deep-link) · `smoke:korea-theme-cross-links` · 채팅명표 #18 전략/#19 레일/#20 폴리시
- **조인키**: hubId+placeSlug > hubId > areaCode > lat/lng · 권역 라벨은 폴백만
- **VERIFY**: `npm run smoke:korea-theme-cross-links` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/top10`
- **QA**: Preview UI 변화 없음(레일은 #19) · 전략 문서 §2.5 · smoke PASS
- **다음**: 크로스 레일 UI(#19)

```
테마여행 #19, 크로스 레일
```

## 테마여행 #17, 상세 정보 전수보강

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `1456073b` · Preview QA 대기

- **전수**: scenic **34/34** · top10 **10/10**(null 5 채움·교체 불필요) · regions **149/196**(76%) Tour contentId
- **한 일**: top10 overrides 5곳 · `koreaThemeRegionTour` SSOT+fill 스크립트 · RegionsPage contentId 연결 · detailIntro type12/14 대응 · 빈 모달 카피·Place CTA · 대안 경로 플랜 §S11.2
- **MISS 47**: Tour 공백/오탐 위험 → GATEO blurb+「장소 카드 보기」(홍대·레고랜드 등)
- **VERIFY**: `generate/audit:korea-theme-region-tour` · `smoke:korea-theme-spot-modal` · `smoke:korea-theme-regions` · top10/scenic audit·smoke · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/regions`
- **QA**: top10 순천만·주상절리·보성 · regions 서울 경복궁·부산 자갈치 · MISS는 Place CTA
- **다음**: 테마 연결(#18) → 완료 · 이어서 크로스 레일(#19)

## 테마여행 #16, 명승 contentId 보강

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `a533a627` · Preview QA 대기

- **한 일**: scenic overrides null 20곳 → TourAPI `searchKeyword`+`detailCommon` 검증 후 contentId 채움 (**34/34**) · generate/audit/smoke · 작업로그 #16
- **확정 예**: 경복궁 `126508` · 창덕궁 `127642` · 수원화성 `125555` · 전주한옥마을 `264284` · 남이섬 `128019`
- **VERIFY**: `generate:korea-scenic-spots` · `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-theme-spot-modal` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **QA**: 명승 목록→경복궁·남이섬·수원화성 모달 Tour 개요·사진 · 「Tour 상세 없음」사라짐
- **다음**: 폴리시·릴리스(#17) · (여유) top10 null 5곳

```
테마여행 #17, 폴리시·릴리스
```

## 테마여행 #15, 명승 contentId 핸드오프

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · 플랜·일지만 · Preview 불변

- **이슈**: 명승 모달「Tour 상세 없음」= API 부재가 아니라 **scenic overrides `contentId` null**(20/34)
- **한 일**: 플랜 **§S11.1** + 채팅명표 **#16 보강 / #17 폴리시** · null 20곳 표·절차·가드 잠금
- **다음 세션 읽을 것**: 플랜 S11.1만 · overrides `korea-scenic-spots-overrides.mjs` · (힌트) `travelSpotTourApi.json`
- **금지 3**: runtime 대량 searchKeyword · JSON spots 직접 편집 · `/korea` 축제 수정
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`

```
테마여행 #16, 명승 contentId 보강
```

## 테마여행 #15, 테마 상세 모달

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `35d1df8b` · Preview QA 대기

- **한 일**: `ThemeSpotDetailModal` · `fetchTourApiAttractionDetail`(type12) · top10/scenic/regions 목록→모달 · Place=2차 CTA · `smoke:korea-theme-spot-modal`
- **VERIFY**: `npm run smoke:korea-theme-spot-modal` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/top10`
- **QA**: top10 한라산→모달·Tour 개요 · contentId 없는 항목은 SSOT만 · scenic/regions 동일 · 「장소 카드 보기」→place→테마 복귀 · Esc/닫기
- **다음**: 명승 contentId 보강(#16) → 폴리시(#17)

```
테마여행 #16, 명승 contentId 보강
```

## 테마여행 #14, 테마 상세 페이지 (플랜)

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `1dac3266` · 플랜만 · Preview 불변

- **요청**: 10대·명승·방방곡곡도 여행코스/축제처럼 목록 클릭→상세 모달 · Place/지구본 1차 금지
- **한 일**: `korea-theme-travel-plan.md` **§2.4·S11** 잠금 · 채팅명표 #15 구현·#16 폴리시 · README 갱신
- **방향**: `ThemeSpotDetailModal` 공유 · Tour type12 LIVE(있으면) · Place=2차 CTA · `/korea` 미수정
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme`
- **다음**: 구현 세션

```
테마여행 #15, 테마 상세 모달
```

## 테마여행 #14, 코스 지역칩 정리

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `347e6b2f` · Preview QA 대기

- **요청**: 0건 칩 숨김 · 소량 코스 권역은 별도 칩으로 묶기
- **한 일**: 권역별 rawCount 조회 → 0건 제외 · ≥3 단독 · 1~2「기타」병합 · `koreaThemeCourseChips.js`
- **VERIFY**: `smoke:korea-theme-courses` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/courses`
- **QA**: 서울·제주 칩 없음 · 기타에 충북·경북·대구·부산 · 단독은 경기·강원 등
- **다음**: (플랜) S11 테마 상세 모달 → 폴리시 #16

```
테마여행 #15, 테마 상세 모달
```

## 테마여행 #14, 코스 소개 문구

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `fb804dde` · Preview QA 대기

- **한 일**: `/korea/theme/courses` 안내를 「한국관광공사 공개 여행코스입니다.」로 간략화
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/courses`
- **QA**: 상단 제목·한 줄 소개만 보이는지
- **다음**: 지역칩 0건/소량 정리

```
테마여행 #14, 코스 지역칩 정리
```

## 테마여행 #14, 모달 전면·하단 버튼

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `9df5f2cd` · Preview QA 대기

- **요청**: 모바일 전면 활용 · 사방 패딩으로 뒤 목록 인지 · 하단 닫기·위로
- **한 일**: 모달 `h-full` + 사방 ~10px/safe-area 패딩 · 하단 「위로」「닫기」 · 상단 X 유지
- **VERIFY**: `smoke:korea-theme-courses` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/courses`
- **QA**: 모바일에서 모달 가장자리로 목록 비침 · 위로 스크롤 · 하단 닫기
- **다음**: 소개 문구 간략화

```
테마여행 #14, 코스 소개 문구
```

## 테마여행 #14, 코스 상세 모달

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `7bdf3516` · Preview QA 대기

- **요청**: 인라인 펼침으로 목록·본문이 이어져 읽기 피로 → 리스트와 상세 분리
- **한 일**: `/korea/theme/courses` — 목록 클릭 → 모달(개요·사진·구간) · 닫기/배경/Esc → 목록 복귀 · 인라인 accordion 제거
- **VERIFY**: `smoke:korea-theme-courses` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/courses`
- **QA**: 강원 코스 클릭→모달 · 닫기 후 목록 유지 · 스크롤 피로감 감소
- **다음**: 모달 전면·하단 버튼 조율

```
테마여행 #14, 모달 전면·하단 버튼
```

## 테마여행 #13, 여행코스 보강

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `ba38e569` · Preview QA 대기

- **한 일**: 옆 썸네일 제거 → 카드 상단 전폭(16:9) 매거진 사진 + 제목 · 펼침 시 구간도 전폭 사진→명→설명 · TourAPI 이미지/https
- **동영상**: type25 API에 동영상 URL 없음 → 미연동
- **VERIFY**: `smoke:korea-theme-courses`(+LIVE) · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme` · git Preview `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/courses`
- **QA**: 강원 코스 카드 — 사진이 제목 위 전폭인지 · 펼침 구간 전폭 사진
- **다음**: #14 모달 분리 반영

```
테마여행 #14, 코스 상세 모달
```

## 테마여행 #12, 여행코스·명승확장

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `a795a2f6` · Preview QA 대기

- **여행코스**: TourAPI `contentTypeId=25` 라이브 → `/korea/theme/courses` (시도 칩·목록·개요/구간 펼침) · 모듈 타일 `courses`
- **명승**: TourAPI `searchKeyword`(12) 검증 후 14곳 추가 → **34곳** (상한 40) · contentId 기록
- **proxy**: `tourapi-proxy`에 코스 필드(`subname`·`theme` 등) normalize 추가 · **Edge 배포 완료**
- **VERIFY**: `audit:korea-theme-modules` · `audit/smoke:korea-scenic-spots` · `smoke:korea-theme-courses`(+LIVE) · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme` · git Preview `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme`
- **QA**: 랜딩「여행코스」·강원 코스 펼침 · 명승 북촌·감천·석굴암·성인봉
- **다음**: #13 코스 사진 보강 → 폴리시 #14

## 테마여행 #11, 투어 API (리서치)

- type **25** 여행코스 ≈49건(권역별, 서울·제주 0에 가까움) · type **12**/키워드로 명승 contentId 검증 가능
- 제품 방향: courses 모듈 + 명승 curated 확장 → #12에서 구현
