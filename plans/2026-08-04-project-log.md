# 2026-08-04 프로젝트 일지

직전: [`2026-08-03-project-log.md`](./2026-08-03-project-log.md)

## 테마여행 #14, 코스 소개 문구

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `fb804dde` · Preview QA 대기

- **한 일**: `/korea/theme/courses` 안내를 「한국관광공사 공개 여행코스입니다.」로 간략화
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/courses`
- **QA**: 상단 제목·한 줄 소개만 보이는지
- **다음**: Preview QA → 폴리시·릴리스

```
테마여행 #15, 폴리시·릴리스
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
