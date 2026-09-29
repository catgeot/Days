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
