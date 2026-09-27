# 2026-09-27 프로젝트 일지

직전: [`2026-09-26-project-log.md`](./2026-09-26-project-log.md)

## 팔경 활용 #72 — 울산12경 가지산 사계·반구대암각화

- **세션** `팔경 활용 #72, 울산 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `5ea23cc8` · PR [#327](https://github.com/catgeot/Days/pull/327)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 울산12경 결손 2건. 3경 가지산 사계는 울주군 상북면 해발 1,241m(1979년 경상남도 도립공원·천연기념물 제462호 철쭉·824년 석남사). 6경 반구대암각화는 언양읍 대곡리 991-3(국보 285호·그림 312점·2025년 7월 12일 반구천의 암각화 세계유산·문의 052-254-5724). 신불산 억새평원·황매산 철쭉·천전리 각석·울산암각화박물관과 구분. 사진은 울산광역시 문화관광 12경 공식 사진.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `vite build` PASS. 순수 사진/개요 누락 **24**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=ulsan` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=ulsan`
- **다음** `팔경 활용 #73, 영천 결손 오버레이` — 영천댐 벚꽃 백리길·영천 별별미술마을

## 명소홈 #1, 본문 무니 FAB

- **세션** `명소홈 #1, 본문 무니 FAB` · feature `cursor/scenic-mooni-b353` · tip `f8757bad` · PR [#326](https://github.com/catgeot/Days/pull/326)
- **조치** 명소홈 상세 본문의 「무니에게 묻기」를 제거. 축제 본문과 같은 오른쪽 무니 버튼. 위로가 보이면 그 위로. 10대 절경·지역 목록은 본문 버튼 유지.
- **VERIFY** `smoke:korea-theme-spot-modal` 무니 단언 PASS · `vite build` PASS. contentId 커버리지 2건은 origin/main과 같은 기존 FAIL.
- **Preview** https://www.gateo.kr/qa/scenic-mooni (main 병합 후) · git `https://days-git-cursor-scenic-mooni-b353-catgeots-projects.vercel.app/korea/theme/scenic?spot=gyeongbokgung`
- **다음** `명소홈 #2, Preview OK면 PR 병합`

## 로그북 #12, 공개 피드 읽음

- **세션** `로그북 #12, 공개 피드 읽음` · feature `cursor/logbook-reads-af3f` · tip `b0d732fc` · PR [#325](https://github.com/catgeot/Days/pull/325)
- **조치** 공개 피드 카드 하단에 읽은 수. 공개 글을 열면 세션당 1회 `increment_report_view`. 내 기록 탭에는 없음. 컬럼이 없으면 숫자를 숨김.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS. migration `20260927120000_reports_view_count.sql` 적용됨 — `view_count` integer default 0, 기존 49행 0, `increment_report_view(text)` security definer, anon·authenticated EXECUTE, 트리거 `reports_guard_view_count`.
- **Preview** https://www.gateo.kr/qa/logbook-reads (main 병합 후) · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog`
- **다음** `로그북 #13, 읽는 시간·같은 장소 수` — 카드에 읽는 시간, 같은 장소 기록 수. 좋아요·댓글 수는 기능이 생긴 뒤.
