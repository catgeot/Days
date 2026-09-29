# 2026-09-29 프로젝트 일지

직전: [`2026-09-28-project-log.md`](./2026-09-28-project-log.md)

## 축제 주변 팔경 — 부산·양산 오탐 (#352 main)

- **세션** 축제 상세 QA 피드백(부산 BPAM · 양산 12경·썸네일) · branch `cursor/festival-palgyeong-nearby-6e7c` · main merge `a2105f85` · PR [#352](https://github.com/catgeot/Days/pull/352)
- **조치** `groupNearbySpotsWithLocalScenic` 거리·Tour 이름 매칭 강화(영동 `천태산` 125907 오매칭 제거). 양산 12경 임시 오버레이 4건·`LOCAL_SCENIC_TOUR_THUMB_BY_CONTENT_ID` 128180. **전수 오버레이는 #88 팔경 세션**.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-festival-nearby` · `vite build` PASS
- **다음** [`feature-handoff-index.md`](./feature-handoff-index.md) **#88 양산 12경**(우선) · 백로그 **#87 영월** 1건

## 팔경 활용 #88, 양산 12경 결손 오버레이

- **세션** `팔경 활용 #88, 양산 12경 결손 오버레이` · branch `cursor/palgyeong-use-e744` · tip `401dfa11` · PR [#353](https://github.com/catgeot/Days/pull/353)
- **조치** `yangsan-other` 12경 전 행 `LOCAL_SCENIC_MEMBER_OVERLAYS`(개요·주소·한국관광공사 공식 사진 ≥3장). 천태산=천태산(양산) 사진 · **125907**(영동) 미연결. 오봉산 임경대=임경대(2782548) 사진·양산타워 혼동 제거. Tour thumb `128180`·`2743856`·`2381381`·`2784427`·`1236556` 보강.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS
- **Preview** `/qa/palgyeong-use` → `/korea/theme/scenic?hub=yangsan` · 검색「양산」
- **다음** 백로그 **#87 영월10경 1**(김삿갓유적지) — [`feature-handoff-index.md`](./feature-handoff-index.md)

## 팔경 활용 #89, 화천 결손 오버레이

- **세션** `팔경 활용 #89, 화천 결손 오버레이` · branch `cursor/palgyeong-use-e744` · tip `299aadf0`
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 화천9경 결손 1건. 비래바위(제6경·상서면 구운리·해발 970m 기암·병풍바위). Tour 미등록 유지. 사진은 화천군 문화관광(`tour.ihc.go.kr`) 공식 3장.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS. 순수 사진/개요 누락 **4**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=hwacheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=hwacheon`
- **다음** 순수 결손 4건 중 **#90 옥천9경 1**(옛37번 국도변 벚꽃길) — [`feature-handoff-index.md`](./feature-handoff-index.md)

## 팔경 활용 #87, 영월 결손 오버레이

- **세션** `팔경 활용 #87, 영월 결손 오버레이` · branch `cursor/palgyeong-use-e744` · tip `f71b691c` · PR [#356](https://github.com/catgeot/Days/pull/356)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 영월10경 결손 1건. 김삿갓유적지(제4경·김삿갓면 김삿갓로 216-22·난고김삿갓문학관·묘역). 화순 김삿갓 문학동산·김삿갓계곡과 구분. 사진은 영월군 문화관광 공식 3장.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS. 순수 사진/개요 누락 **5**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=yeongwol` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=yeongwol`
- **다음** `팔경 활용 #89, 화천 결손 오버레이` — 화천9경 비래바위 1건 · [`feature-handoff-index.md`](./feature-handoff-index.md)
