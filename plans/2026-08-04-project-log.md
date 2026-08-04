# 2026-08-04 프로젝트 일지

직전: [`2026-08-03-project-log.md`](./2026-08-03-project-log.md)

## 테마여행 #13, 여행코스 보강

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · Preview QA 대기

- **한 일**: TourAPI 코스 대표·구간 사진(`subdetailimg`)·갤러리 스트립을 펼침 UI에 표시 · 목록 썸네일 확대 · https 정규화
- **동영상**: type25 API에 동영상 URL 없음 → 미연동 (YouTube 추정 검색 범위 밖)
- **VERIFY**: `smoke:korea-theme-courses`(+LIVE) · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme` · git Preview `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/courses`
- **QA**: 강원 코스 펼침 → 히어로·구간 사진 · 가로 갤러리
- **다음**: Preview QA → `테마여행 #14, 폴리시·릴리스`

```
테마여행 #14, 폴리시·릴리스
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
