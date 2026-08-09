# 2026-08-09 프로젝트 일지

직전: [`2026-08-08-project-log.md`](./2026-08-08-project-log.md)

## 홈 PC 나라칩·LOGIN/LOGBOOK 겹침 (main · 로컬)

**상태**: `main` · 로컬 검증

- **요청**: 오세아니아·중동 등 긴 나라칩이 좌측 하단 LOGIN/LOGBOOK과 겹침
- **한 일**: PC 나라 리스트 높이 `calc(100dvh-14.5rem-8.5rem)`·상한 22rem으로 제한(내부 스크롤) · footer z를 레일 위로
- **VERIFY**: `npm run build`
- **QA**: 로컬 홈 PC → Paradise 등에서 남태평양/중동 펼친 뒤 LOGIN·LOGBOOK과 겹치지 않는지

## 홈 PC 명승·테마 카테고리 겹침 (main · 로컬)

**상태**: `main` · tip `1edfc07`

- **요청**: PROD main 홈에서 축제/명승 투톱과 테마 카테고리·하위칩 겹침 · 스크롤바 없이 · Windows Vite default export 오류
- **한 일**: PC 카테고리 레일 `top-[14.5rem] justify-start`(하위칩 위로 밀림 방지, `overflow-y-auto` 없음) · `App.jsx`에서 `CloudPreviewWorkLog.jsx` 명시 import(Windows 대소문자 충돌)
- **VERIFY**: `npm run build`
- **QA**: 로컬 `npm run dev` → PC 폭 홈 → 테마 클릭 후 명승과 겹침·전체 스크롤바 없는지

## 테마여행 #89, 네이버 검색 쿼리

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `e79b5a1a` · Preview 사람 QA 대기

- **한 일**: 네이버 쿼리 분기 — **맛집만 지역+상호** · 관광지·명소·명승·레포츠·문화는 **고유명만**
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「명소는 고유명 · 맛집만 지역+상호」
- **남은 일**: 사람 Preview QA (명소 vs 맛집 검색 결과 비교)
- **다음 채팅명**:

```
테마여행 #90, 빈 hub 명소 보강
```

## 테마여행 #88, 네이버 링크 확장

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `14c86f3b` · ✅ 쿼리 분기는 #89

- **한 일**: 맛집뿐 아니라 **명승·관광지·레포츠·문화** 상세에도 동일 위치(개요 아래·주소 위) 「네이버 상세정보 보기」 노출
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「레포츠·관광지·문화에도 네이버 칩」

## 테마여행 #87, 네이버 버튼 위치

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `92a6fdfe` · ✅ 확장은 #88

- **한 일**: 네이버 칩을 **개요 아래 · 주소 위**로 이동 (주소·문의·영업시간 흐름 유지)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「개요 아래·주소 위로 이동」

## 테마여행 #86, 네이버 문구·위치

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `963c9cbd` · ✅ 위치 재조정은 #87

- **한 일**: 문구 「네이버 상세정보 보기」 · 상세 본문에서 **전화 바로 아래**로 이동
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「네이버 상세정보 보기 · 전화 아래」

## 테마여행 #85, 네이버 버튼 컴팩트

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `b63883b0` · ✅ 문구·위치는 #86

- **한 일**: 네이버 이동 버튼을 한 줄 칩으로 축소 (보조문구·섹션 라벨 제거)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「네이버로 이동 버튼 축소」

## 테마여행 #84, 네이버 이동 버튼

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `3582e24e` · ✅ 컴팩트 조정은 #85

- **한 일**: 맛집 상세 네이버 링크를 「N · 네이버로 이동 · 새 탭에서 네이버 검색」 CTA 버튼으로 교체 (초록 톤·외부이동 아이콘)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「네이버로 이동 CTA 버튼」

## 테마여행 #83, 맛집 네이버 링크

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `475fdebb` · Preview 사람 QA 대기

- **한 일**: 명승·축제 연계 맛집 상세(`ThemeSpotDetailModal`) 본문에 지역+상호 네이버 검색 링크 「네이버에서 보기」 추가 (TourAPI에 place id 없어 검색 연결)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「맛집 상세 → 네이버에서 보기」
- **남은 일**: ✅ #84 버튼 직관화
