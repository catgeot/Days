# 2026-11-01 프로젝트 일지

이전: [`2026-10-26-project-log.md`](./2026-10-26-project-log.md)

## 탐색 월별 여행지 검색 #1, 자동 연동

- 원인: 탐색홈 「11월의 여행지」행은 `MONTHLY_PICKS`만 읽고 탐색 검색은 그 목록을 읽지 않아, 「11월 여행」 검색 시 신설 픽이 색인에 없었음(로컬 검색 0건 재현).
- 조치: 신규 `exploreMonthlyPickSearchSuggestions.js`가 `MONTHLY_PICKS` 전 monthKey에서 검색 카드를 자동 파생해 `buildLocalSearchSuggestions` 앞에 삽입. 새 달·새 픽을 추가하면 검색 등록 없이 자동 반영. `11월 해외여행`은 제주 제외, 월+여행 의도 없는 쿼리(`교토 11월`)는 오탐 방지, 히트 시 Mapbox 보강 생략.
- 검증: 신규 테스트 7개 + `npm run test:health` 929 PASS · `npm run build` PASS. `scripts/site-search-open.test.mjs` 실패 1건은 main에서도 재현되는 기존 실패.
- 브랜치 `cursor/explore-monthly-search-4c7d` · tip `f44cc299` · PR [#635](https://github.com/catgeot/Days/pull/635). 사람 체크: Preview 탐색 검색창에 `11월 여행` → 6곳, `11월 해외여행` → 제주 제외 5곳.
