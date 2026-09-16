# 2026-09-16 프로젝트 일지

직전: [`2026-09-15-project-log.md`](./2026-09-15-project-log.md)

## 팔경 활용 #52 — 대구12경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #52, 대구 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `9004dc15` · PR [#267](https://github.com/catgeot/Days/pull/267)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 대구12경 결손 3건(대구 국채보상운동 기념공원·대구 달성토성·대구 경상감영과 옛골목). 국채보상공원은 9경 동성로·2·28공원이 아니라 중구 국채보상로 670 달구벌대종(8경), 달성토성은 달성군 습지·목포 유달산 달성공원이 아니라 중구 달성공원로 35 사적 62호·관풍루(6경), 경상감영과 옛골목은 상주 태평성대·공주 충청감영·계산예가 2코스가 아니라 중구 경상감영길 99 사적 538호 선화당·징청각과 근대골목 1코스(7경). 대구 순수 누락 3→0 · CID 9/12 유지.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=daegu`
- **잔여**: 사진/개요 순수 누락 **72**/876. 다음 허브 **여수10경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 종각역 숙소 #7 — 거리 Photon 캐시 로딩 (Cloud)

- **세션** `종각역 숙소 #7, Preview OK면 PR 병합` → 실제 작업은 로딩 개선 (병합 보류)
- **브랜치** `cursor/jonggak-first-card-3096` · tip `04735e04` · PR [#266](https://github.com/catgeot/Days/pull/266)
- **원인**: Edge가 호텔마다 Photon(최대 12초)을 기다린 뒤에야 목록을 돌려 숙소 찾기가 느림. 클라 캐시는 sessionStorage 30분·원점 포함이라 탭을 닫으면 사라짐.
- **완료**: 목록은 원점 없이 먼저 표시. 좌표는 localStorage 14일(미스 24시간). 없는 호텔만 `geocodeItems` Photon. 목록 캐시 v23 30분. Edge `fetch-mrt-stays` 배포 `phdjnbfitvmrguqzverm`.
- **VERIFY**: `npm run smoke:mrt-stay` PASS · `npx vite build` PASS
- **Preview** https://days-git-cursor-jonggak-first-card-3096-catgeots-projects.vercel.app/
- **QA**: 홈「종각역」→ **첫 카드** 숙소 찾기 → 카드가 먼저 뜨고 신라스테이 광화문 330m 등 · 네이버 칩 · 재진입은 거의 즉시
- **다음**: `종각역 숙소 #8, Preview OK면 PR 병합`
