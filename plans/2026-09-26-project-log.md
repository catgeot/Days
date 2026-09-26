# 2026-09-26 프로젝트 일지

직전: [`2026-09-22-project-log.md`](./2026-09-22-project-log.md)

## 팔경 활용 #66 — 홍천9경 미약골·가령폭포 썸네일

- **세션** `팔경 활용 #66, 홍천 썸네일` · feature `cursor/palgyeong-use-e744` · tip `0ac3dc04` · PR [#320](https://github.com/catgeot/Days/pull/320) (#286은 #65에서 병합됨)
- **증상** Preview 홍천 팔경 목록에서 3경 미약골·5경 가령폭포만 랜드마크 아이콘. #2 오버레이는 가리산·금학산·살둔계곡·삼봉약수. 두 곳은 JSON contentId(`2613261`·`125658`)만 있어 Tour firstimage가 비면 사진이 없다.
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 홍천군 문화관광 9경 공식 사진(미약골 1장·가령폭포 3장)과 주소·개요. 순수 사진/개요 누락은 contentId가 있어 **38**/876 유지.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=hongcheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=hongcheon`
- **다음** `팔경 활용 #67, 산청 결손 오버레이` — 황매산 철쭉·남명조식유적지

## 팔경 활용 #67 — 산청9경 황매산 철쭉·남명조식유적지

- **세션** `팔경 활용 #67, 산청 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `60cb6fcb` · PR [#321](https://github.com/catgeot/Days/pull/321) (#320은 #66에서 병합됨)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 산청9경 결손 2건. 3경 황매산 철쭉은 차황면 법평리 1,113.1m·5월 철쭉제(한국관광공사 황매산(산청) 사진). 7경 남명조식유적지는 시천면 사리 384 사적·1561 산천재·1576 덕천서원(국가유산청 `1628317`·관광공사 산천재 남명매). 합천8경 황매산·일림산 철쭉·도산서원·남사예담촌과 구분.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `build` PASS. 순수 사진/개요 누락 **34**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=sancheong` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=sancheong`
- **다음** `팔경 활용 #68, 서천 결손 오버레이` — 장항송림산림욕장과 장항스카이워크·유부도와 서천갯벌

## 축제 페이지 #6 — 본문 네이버 지도

- **세션** `축제 페이지 #6, 본문 네이버 지도` · feature `cursor/festival-sheet-ui-ec8b` · tip `a5562ba2` · PR [#322](https://github.com/catgeot/Days/pull/322)
- **조치** 축제 본문 주소 아래 「지도에서 보기」. 네이버 지도 검색어는 축제명이 아니라 행사 장소(예: 인천광역시 부평구 신트리공원). 장소가 일대·도로뿐이면 도로명 주소. 좌표가 있으면 지도 카메라만 맞춘다.
- **VERIFY** `smoke:festival-naver-map` PASS · `smoke:korea-festival-nearby` PASS · `vite build` PASS. `smoke:korea-festival-personal`은 origin/main과 같이 인천공항→`junggu` FAIL(범위 밖).
- **Preview** https://www.gateo.kr/qa/festival-ui → `/korea` · git `https://days-git-cursor-festival-sheet-ui-ec8b-catgeots-projects.vercel.app/korea`
- **다음** `축제 페이지 #7, Preview OK면 PR 병합`

## 팔경 활용 #68 — 서천9경 장항송림·유부도

- **세션** `팔경 활용 #68, 서천 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `fdfc3ff2` · PR [#321](https://github.com/catgeot/Days/pull/321)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 서천9경 결손 2건. 8경 장항송림산림욕장과 장항스카이워크는 장항읍 장항산단로34번길 122-16(공식명 장항송림자연휴양림, 1954년 곰솔 방풍림·면적 275,703㎡·스카이워크 높이 15m·길이 236m·문의 041-956-5505). 9경 유부도와 서천갯벌은 장항읍 유부도길6번길 3(서천갯벌 약 68.09㎢·2021 유네스코 한국의 갯벌·2009 람사르·검은머리물떼새 천연기념물 326호). 춘장대·금강하굿둑·울돌목 스카이워크·고창·신안·보성순천 갯벌과 구분.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `build` PASS. 순수 사진/개요 누락 **32**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=seocheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=seocheon`
- **다음** `팔경 활용 #69, 안산 결손 오버레이` — 시화호조력발전소·다문화거리

## 팔경 활용 #69 — 안산9경 시화호조력·다문화거리

- **세션** `팔경 활용 #69, 안산 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `e45292e1` · PR [#323](https://github.com/catgeot/Days/pull/323) (#321은 #67에서 병합됨)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 안산9경 결손 2건. 1경 시화호조력발전소는 단원구 대부황금로 1927(2011년 8월 준공·연 약 5억 5천만 kWh·달전망대·문의 032-890-6524). 8경 다문화거리는 단원구 다문화길 16 일대(2009년 다문화마을특구·외국인주민지원본부 1666-1234). 대부도·안산갈대습지·안산 시화호·시흥 오이도·인천차이나타운과 구분. 사진은 안산시 문화관광 12경 공식 사진.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `build` PASS. 순수 사진/개요 누락 **30**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=ansan` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=ansan`
- **다음** `팔경 활용 #70, 화성 결손 오버레이` — 용주사 범종·입파홍암

## 축제 페이지 #7 — 본문은 홈 지도

- **세션** `축제 페이지 #7, 본문은 홈 지도` · feature `cursor/festival-sheet-ui-ec8b` · tip `481d4b61` · PR [#322](https://github.com/catgeot/Days/pull/322)
- **조치** 본문 「이 축제 위치로」는 네이버 지도 직링크를 빼고 축제 홈 지도를 열어 그 핀(줌 13)으로 이동. 본문은 닫힘. 장소 정보·길찾기는 읽을거리 네이버 검색에 유지. 좌표 없는 축제는 버튼 없음. 지역·시간 필터를 바꾸거나 지도를 닫으면 핀 고정 해제.
- **VERIFY** `smoke:festival-home-map` PASS · `smoke:korea-festival-nearby` PASS · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/festival-ui → `/korea` · git `https://days-git-cursor-festival-sheet-ui-ec8b-catgeots-projects.vercel.app/korea`
- **다음** `축제 페이지 #8, Preview OK면 PR 병합`

## 축제 페이지 #8 — 검색 링크 표면

- **세션** `축제 페이지 #8, 검색 링크 표면` · feature `cursor/festival-sheet-ui-ec8b` · tip `44256af7` · PR [#322](https://github.com/catgeot/Days/pull/322)
- **조치** 읽을거리의 네이버 검색·구글 검색을 주소 아래 표면으로 이동. 칩 모양은 그대로. 「이 축제 위치로」와 홈 지도 핀 고정은 제거. 읽을거리는 관련 영상만.
- **VERIFY** `smoke:festival-surface-search` PASS · `smoke:korea-festival-nearby` PASS · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/festival-ui → `/korea` · git `https://days-git-cursor-festival-sheet-ui-ec8b-catgeots-projects.vercel.app/korea`
- **다음** `축제 페이지 #9, Preview OK면 PR 병합`
