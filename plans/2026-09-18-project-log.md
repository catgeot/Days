# 2026-09-18 프로젝트 일지

직전: [`2026-09-17-project-log.md`](./2026-09-17-project-log.md)

## 여행지 매칭 #2 — 검색 Enter 제안 불일치 (Cloud)

- **세션** `여행지 매칭 #2, 검색 Enter 제안 불일치`
- **브랜치** `cursor/dest-match-arch` · tip `7e5fc984` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **원인**: 「광천선굴」「광천성굴」타이핑 목록은 Mapbox·허브 후보로 광천선굴이 보이는데, 엔터는 지오코딩 실패 후 `search_dictionary`·AI가 정선 화암동굴로 교정함.
- **완료**: 평창 허브 명소 SSOT·별칭. 엔터는 보이는 제안·Search Box 이름 일치를 AI보다 앞세움. 이름 불일치 교정 캐시 무시. **PR 미병합**.
- **VERIFY**: `npm run smoke:search-enter-match` PASS · `smoke:explore-search-aliases` PASS · `smoke:explore-choice-overlay` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「광천성굴」「광천선굴」엔터 → 평창 광천선굴. 화암동굴 교정 카드 아님.
- **다음**: `여행지 매칭 #3, 숙소 거리 가드(Geo-Sanity)`
