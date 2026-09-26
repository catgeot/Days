# 2026-09-26 프로젝트 일지

직전: [`2026-09-22-project-log.md`](./2026-09-22-project-log.md)

## 팔경 활용 #66 — 홍천9경 미약골·가령폭포 썸네일

- **세션** `팔경 활용 #66, 홍천 썸네일` · feature `cursor/palgyeong-use-e744` · tip `0ac3dc04` · PR [#320](https://github.com/catgeot/Days/pull/320) (#286은 #65에서 병합됨)
- **증상** Preview 홍천 팔경 목록에서 3경 미약골·5경 가령폭포만 랜드마크 아이콘. #2 오버레이는 가리산·금학산·살둔계곡·삼봉약수. 두 곳은 JSON contentId(`2613261`·`125658`)만 있어 Tour firstimage가 비면 사진이 없다.
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 홍천군 문화관광 9경 공식 사진(미약골 1장·가령폭포 3장)과 주소·개요. 순수 사진/개요 누락은 contentId가 있어 **38**/876 유지.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=hongcheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=hongcheon`
- **다음** `팔경 활용 #67, 산청 결손 오버레이` — 황매산 철쭉·남명조식유적지
