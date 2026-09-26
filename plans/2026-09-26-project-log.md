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

## 팔경 활용 #68 — 서천9경 장항송림·유부도

- **세션** `팔경 활용 #68, 서천 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `fdfc3ff2` · PR [#321](https://github.com/catgeot/Days/pull/321)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 서천9경 결손 2건. 8경 장항송림산림욕장과 장항스카이워크는 장항읍 장항산단로34번길 122-16(공식명 장항송림자연휴양림, 1954년 곰솔 방풍림·면적 275,703㎡·스카이워크 높이 15m·길이 236m·문의 041-956-5505). 9경 유부도와 서천갯벌은 장항읍 유부도길6번길 3(서천갯벌 약 68.09㎢·2021 유네스코 한국의 갯벌·2009 람사르·검은머리물떼새 천연기념물 326호). 춘장대·금강하굿둑·울돌목 스카이워크·고창·신안·보성순천 갯벌과 구분.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `build` PASS. 순수 사진/개요 누락 **32**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=seocheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=seocheon`
- **다음** `팔경 활용 #69, 안산 결손 오버레이` — 시화호조력발전소·다문화거리
