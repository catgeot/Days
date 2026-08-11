# 2026-08-11 프로젝트 일지

직전: [`2026-08-10-project-log.md`](./2026-08-10-project-log.md)

## 테마여행 #141, 지도 내 위치

**상태**: feature `cursor/scenic-locate-1064` · PR [#99](https://github.com/catgeot/Days/pull/99) · tip `84295e3c` · Preview QA 대기  
**세션**: `테마여행 #141, 지도 내 위치`

- **한 일**: 명승홈 지도(`KoreaScenicMap`)에 **내 위치** 버튼·파란 점 마커·flyTo 추가(우상단). 목록「내 주변」·필터 해제·TourAPI 호출은 없음
- **VERIFY**: `npm run smoke:korea-scenic-map` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **Preview**: `https://days-git-cursor-scenic-locate-1064-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「명승 지도 — 내 위치 버튼」
- **남은 일**: 사람 Preview QA(위치 허용→파란 점·카메라)
- **다음 채팅명**:

```
테마여행 #142, 지도 내 위치 QA
```

## 테마여행 #140, 페이지 하단 여백

**상태**: feature `cursor/page-end-pad-1e22` · Preview QA 대기  
**세션**: `테마여행 #140, 페이지 하단 여백`

- **증상**: 명승홈 명소 리스트 끝에서 국가유산 명승·지역 관광지 접힘 버튼이 화면 하단에 붙어 시인성·클릭 접근성 부족
- **한 일**: `.page-scroll-end-pad`(≈50vh) SSOT · 명승홈·테마 셸·축제 목록에 적용(짧은 관광지 목록 전용 조건 제거)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/page-end-pad`
- **Preview**: `https://days-git-cursor-page-end-pad-1e22-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「스크롤 끝 하단 여백(중앙 착지)」
- **남은 일**: 사람 Preview QA(명소 끝→접힘 버튼이 중앙 부근)
- **다음 채팅명**:

```
테마여행 #141, 하단 여백 QA
```
