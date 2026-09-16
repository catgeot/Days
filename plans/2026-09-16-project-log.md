# 2026-09-16 프로젝트 일지

직전: [`2026-09-15-project-log.md`](./2026-09-15-project-log.md)

## 종각역 숙소 #9 — 검색 카드 검은 화면 (Cloud)

- **세션** `종각역 숙소 #9, 검색 카드 검은 화면`
- **브랜치** `cursor/jonggak-yeonsinnae-cacc` · tip `bcf25dab` · PR [#269](https://github.com/catgeot/Days/pull/269)
- **원인**: `GlobeStayStrip`이 `const fetchKey`보다 먼저 `useRef(fetchKey)`를 써서 장소 카드 오픈 즉시 TDZ `ReferenceError`. 홈이 언마운트되고 작업 로그만 남음.
- **완료**: `fetchKeyRef`는 빈 문자열로 초기화하고 선언 뒤에 할당. 스모크가 같은 패턴을 막음.
- **VERIFY**: `npm run smoke:mrt-stay` PASS · `npx vite build` PASS
- **Preview** https://days-git-cursor-jonggak-yeonsinnae-cacc-catgeots-projects.vercel.app/
- **QA**: 검색「연신내역」카드 → 지구본·써머리(검은 화면 아님) · 첫 카드 숙소 찾기 거리.
- **다음**: `종각역 숙소 #10, Preview OK면 PR 병합`

## 종각역 숙소 #8 — 최초 진입 거리 (Cloud)

- **세션** `종각역 숙소 #8, 최초 진입 거리`
- **브랜치** `cursor/jonggak-yeonsinnae-cacc` · tip `584b35fd` · PR [#269](https://github.com/catgeot/Days/pull/269)
- **원인**: 첫 진입은 목록만 그리고 Photon은 뒤에서 붙이는데, `location` 리렌더가 fetch를 취소해 거리가 안 붙음. 재진입은 좌표 캐시라 됨. `연신내역`은 `내역` 접미 오탐으로 역이 아니라고 나와 광화문 호텔이 뜸.
- **완료**: 역 오탐을 전체 일치만 제외. Photon은 fetchKey가 같으면 첫 진입에도 반영. 보이는 20곳부터 지오코딩.
- **VERIFY**: `npm run smoke:mrt-stay` PASS · `npx vite build` PASS
- **Preview** https://days-git-cursor-jonggak-yeonsinnae-cacc-catgeots-projects.vercel.app/
- **QA**: 홈「연신내역」→ **첫 카드** 숙소 찾기 → **첫 진입**에도 거리·가까운순. 광화문 330m처럼 보이면 실패.
- **다음**: `종각역 숙소 #9, Preview OK면 PR 병합`

## 팔경 활용 #53 — 여수10경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #53, 여수 결손 오버레이` → 탐색홈 빈 썸네일 후속
- **브랜치** `cursor/palgyeong-use-e744` · tip `4b9c7468` · PR [#268](https://github.com/catgeot/Days/pull/268)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 여수10경 결손 3건(여수세계박람회장·여수 밤바다와 산단 야경·여수해상케이블카). 박람회장은 2026 섬박람회·함평엑스포가 아니라 덕충동 박람회길 1 2012 엑스포장(빅오·스카이타워), 밤바다·산단은 광양만 야경이 아니라 종화동 해양공원·돌산공원과 화치동 국가산단전망대(7경), 케이블카는 목포·사천·송도가 아니라 돌산로 3600-1~오동도로 116 돌산~자산 1.5km(9경). 여수 순수 누락 3→0.
- **탐색홈 후속**: Preview 검색「여수」에서 진남관(6경, Tour `126386`)·여수 이순신대교(10경, `2778041` 이순신대교홍보관)가 first_image 공란이라 랜드마크 플레이스홀더. JSON contentId 유지한 채 여수시 관광 10경 진남관 전경·이순신대교 항공 공식 사진 오버레이. 광양9경 광양이순신대교 사진·홍보관 실내와 구분.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview 검색「여수」· `/korea/theme/scenic?hub=yeosu`
- **잔여**: 사진/개요 순수 누락 **69**/876. 다음 허브 **예천8경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

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
