# 2026-09-29 프로젝트 일지

직전: [`2026-09-28-project-log.md`](./2026-09-28-project-log.md)

## 축제 주변 팔경 — 부산·양산 오탐 (#352 main)

- **세션** 축제 상세 QA 피드백(부산 BPAM · 양산 12경·썸네일) · branch `cursor/festival-palgyeong-nearby-6e7c` · main merge `a2105f85` · PR [#352](https://github.com/catgeot/Days/pull/352)
- **조치** `groupNearbySpotsWithLocalScenic` 거리·Tour 이름 매칭 강화(영동 `천태산` 125907 오매칭 제거). 양산 12경 임시 오버레이 4건·`LOCAL_SCENIC_TOUR_THUMB_BY_CONTENT_ID` 128180. **전수 오버레이는 #88 팔경 세션**.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-festival-nearby` · `vite build` PASS
- **다음** [`feature-handoff-index.md`](./feature-handoff-index.md) **#88 양산 12경**(우선) · 백로그 **#87 영월** 1건

## 팔경 활용 — #88 양산 12경 핸드오프 (준비)

- **배경** `listId` `yangsan-other` · hub `yangsan` · SSOT [`koreaLocalScenicLists.json`](../src/pages/Home/data/koreaLocalScenicLists.json). **#16**은 **충북 영동 양산팔경**만 처리 — **경남 양산시 12경**은 허브 단위 전수 오버레이 미완.
- **이미 있음** (main `a2105f85` 이후): 내원사계곡·황산공원(갤러리 2~3장) · 천태산·오봉산 임경대·대운산 휴양림·법기수원지(**임시 1장** — #88에서 **§2.1 ≥3장**으로 승격).
- **#88 작업 범위** (JSON contentId 기입·scenic 승격 금지): 12경 전 행 `LOCAL_SCENIC_MEMBER_OVERLAYS` — 개요·주소·**공식 사진 ≥3장**·상세 갤러리. `pending_coord` 멤버는 시 공식 좌표 반영 검토(오버레이 addr만으로도 가능). Tour id 검증: `128180` 오봉산(양산)·`2743856`·`2381381` DB 없음 → 오버레이 우선. **125907 천태산 금지**(영동).
- **QA** `/qa/palgyeong-use` → `/korea/theme/scenic?hub=yangsan` 12행 썸네일·상세 스와이프 · 검색「양산」 · (선택) 부산 축제 주변 관광지에 양산 팔경 잘못 뜨지 않음(#352)
- **브랜치** `cursor/palgyeong-use-e744` · VERIFY `smoke:korea-local-scenic-lists` 등 팔경 게이트
