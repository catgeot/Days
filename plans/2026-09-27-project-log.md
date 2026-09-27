# 2026-09-27 프로젝트 일지

직전: [`2026-09-26-project-log.md`](./2026-09-26-project-log.md)

## 팔경 활용 #74 — 청도 관광 9경 새마을운동발상지·섶마리한옥마을

- **세션** `팔경 활용 #74, 청도 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `49b6b0be` · PR [#329](https://github.com/catgeot/Days/pull/329)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 청도 관광 9경 결손 2건. 2경 새마을운동발상지기념공원은 청도읍 새마을1길 34(2009년 4월 14일 기념관 개관·2011년 8월 27일 발상지 공원·대통령 전용 열차·신거역·문의 054-372-5500). 5경 섶마리한옥마을은 금천면 신지리(운강고택 선암로 474·1809 건립·1824 증축·만화정 1856·국가민속문화유산). 구미 새마을운동테마공원·신화랑풍류마을·하회·양동마을과 구분. 사진은 디지털청도문화대전 공식 사진.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `vite build` PASS. 순수 사진/개요 누락 **20**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=cheongdo` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=cheongdo`
- **다음** `팔경 활용 #75, 의령 결손 오버레이` — 백산안희제선생 생가·호암이병철선생 생가

## 로그북 #15, 좋아요·댓글 연동

- **세션** `로그북 #15, 좋아요·댓글 시스템 연동` · feature `cursor/logbook-reads-af3f` · tip `4f05357b` · PR [#325](https://github.com/catgeot/Days/pull/325)
- **조치** 공개 피드 카드 하단 슬롯(읽는 시간·읽은 수 옆)에 하트·댓글 수. 하트는 로그인 후 `report_likes` 토글, 댓글 수는 글 하단 등록·삭제. 집계 컬럼은 트리거만 기록. 내 기록 탭에는 없음. 컬럼이 없으면 아이콘을 숨김.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS. migration `20260927150000_reports_likes_comments.sql` 적용됨 — 49행 `like_count`·`comment_count` 0, `view_count` 합 4 유지. 직접 `like_count` 갱신은 가드가 버리고, 좋아요 행은 집계만 올린 뒤 롤백 확인.
- **Preview** https://www.gateo.kr/qa/logbook-reads · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog` (로그인 시 `?tab=public`)
- **다음** `로그북 #16, Preview OK면 PR 병합` — 카드 하트·댓글 수와 글 하단 댓글 확인 후 PR #325.

## 팔경 활용 #73 — 영천9경 벚꽃 백리길·별별미술마을

- **세션** `팔경 활용 #73, 영천 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `416b7596` · PR [#328](https://github.com/catgeot/Days/pull/328)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 영천9경 결손 2건. 7경 영천댐 벚꽃 백리길은 임고면 신방로 19 일원(영천호 일주 40km·1980년 12월 준공·높이 42m·총저수량 9,640만 톤·문의 054-330-6585). 9경 별별미술마을은 화산면 가상리 649(2011년 마을미술프로젝트·다섯 길·작품 62점·문의 054-330-6067). 임고강변공원 벚꽃길·보현산천문대·시안미술관·한의마을과 구분. 사진은 한국관광공사 공식 사진.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `vite build` PASS. 순수 사진/개요 누락 **22**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=yeongcheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=yeongcheon`
- **다음** `팔경 활용 #74, 청도 결손 오버레이` — 청도 새마을운동발상지기념공원·청도 섶마리한옥마을

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

## 로그북 #14, 피드 카드 디자인 리뉴얼

- **세션** `로그북 #14, 피드 카드 디자인 리뉴얼` · feature `cursor/logbook-reads-af3f` · tip `133bdc68` · PR [#325](https://github.com/catgeot/Days/pull/325)
- **조치** 이미지 위 큰 날짜 배지를 본문 상단 메타(에디터 뱃지 / 작성자 + 발행일)로 자연스럽게 통합. 사진 추가 배지(+N)는 썸네일 우측 하단 뱃지로 정돈. 하단에 2행으로 분산되어 복잡했던 메타정보를 [좌측 장소 / 우측 읽는 시간·조회수] 단일 행으로 통합하여 향후 좋아요·댓글 확장을 위한 인라인 슬롯 구조를 확보. 모바일 2열 그리드 패딩 및 행간 최적화.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/logbook-reads · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog` (로그인 시 `?tab=public`)
- **다음** `로그북 #15, 좋아요·댓글 시스템 연동` — 리뉴얼된 카드 슬롯에 좋아요 및 댓글 데이터/인터랙션 연동.

## 로그북 #13, 읽는 시간·같은 장소 수

- **세션** `로그북 #13, 읽는 시간·같은 장소 수` · feature `cursor/logbook-reads-af3f` · tip `636f38a6` · PR [#325](https://github.com/catgeot/Days/pull/325)
- **조치** 카드와 글 본문 머리(날짜·장소 줄)에 읽는 시간·같은 장소 기록 수. 공개 본문에는 읽은 수도 표시. 같은 장소는 공백을 맞춘 이름, 위치 미상 제외. 본문 숫자는 그 장소 피드로 이동. 내 기록·내 글에는 읽은 수 없음. 내 글의 같은 장소 수는 내 기록 기준.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/logbook-reads · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog` (로그인 시 `?tab=public`)
- **다음** `로그북 #14, Preview OK면 PR 병합` — 카드·본문 확인 후 PR #325. 좋아요·댓글 수는 기능이 생긴 뒤.

## 로그북 #12, 공개 피드 읽음

- **세션** `로그북 #12, 공개 피드 읽음` · feature `cursor/logbook-reads-af3f` · tip `b0d732fc` · PR [#325](https://github.com/catgeot/Days/pull/325)
- **조치** 공개 피드 카드 하단에 읽은 수. 공개 글을 열면 세션당 1회 `increment_report_view`. 내 기록 탭에는 없음. 컬럼이 없으면 숫자를 숨김.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS. migration `20260927120000_reports_view_count.sql` 적용됨 — `view_count` integer default 0, 기존 49행 0, `increment_report_view(text)` security definer, anon·authenticated EXECUTE, 트리거 `reports_guard_view_count`.
- **Preview** https://www.gateo.kr/qa/logbook-reads (main 병합 후) · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog`
- **다음** `로그북 #13, 읽는 시간·같은 장소 수` — 카드에 읽는 시간, 같은 장소 기록 수. 좋아요·댓글 수는 기능이 생긴 뒤.
