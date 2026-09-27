# 2026-09-27 프로젝트 일지

직전: [`2026-09-26-project-log.md`](./2026-09-26-project-log.md)

## 프로필 #5, 헤더 터치 가림

- **세션** `프로필 #5, 헤더 터치 가림` · feature `cursor/profile-a231` · tip `28bfe727` · draft PR [#338](https://github.com/catgeot/Days/pull/338)
- **원인** 모바일 `/blog` 본문 `flex-1 h-full` 스크롤이 헤더 영역과 겹쳐 우상단 프로필 탭이 막힘. Preview 「모바일 위젯 로그」 `blog.header.layout overlap:true`로 확인 가능.
- **조치** `min-h-0`·sticky `z-[100]` 헤더. Preview 진단 `blog.header.layout` / `blog.header.tap` / `blog.header.profile.open`.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/profile · git `https://days-git-cursor-profile-a231-catgeots-projects.vercel.app/blog`
- **다음** Preview에서 overlap false·프로필 탭 OK면 PR #338 병합.

## 프로필 #5, 헤더 프로필 탭

- **세션** `프로필 #5, 헤더 프로필 탭` · feature `cursor/profile-a231` · tip `07ce723d` · draft PR [#338](https://github.com/catgeot/Days/pull/338)
- **조치** `/blog` 모바일 헤더 프로필은 `/account` 이동 대신 body 포털로 바로 연다. 닫기·사진 라이트박스 닫기 터치 영역·z-index 보강. 대표 사진 탭은 보기(장 수는 라이트박스·카드 위), 변경은 아래 버튼.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/profile · git `https://days-git-cursor-profile-a231-catgeots-projects.vercel.app/blog`
- **다음** `프로필 #6, Preview OK면 PR 병합` — 헤더·패널 프로필 탭 OK면 PR #338 병합.

## 프로필 #4, 헤더 사진 숫자

- **세션** `프로필 #4, 헤더 사진 숫자` · feature `cursor/profile-a231` · tip `8073fc78` · draft PR [#338](https://github.com/catgeot/Days/pull/338)
- **조치** 로그북 홈 우측 상단과 공개 글·댓글 작성자 이름 옆의 사진 숫자를 뺐다. 숫자는 프로필 사진을 열었을 때와 프로필 사진 위에만 남긴다. 헤더의 프로필 글자는 줄지 않는다.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/profile · git `https://days-git-cursor-profile-a231-catgeots-projects.vercel.app/blog`
- **다음** `프로필 #5, Preview OK면 PR 병합` — 헤더 프로필이 바로 열리고, 숫자는 사진을 볼 때만. OK면 PR #338 병합.

## 프로필 #3, 패널 안 프로필

- **세션** `프로필 #3, 패널 안 프로필` · feature `cursor/profile-a231` · tip `5a5d5d57` · draft PR [#338](https://github.com/catgeot/Days/pull/338)
- **조치** 로고 패널 프로필은 `/account`로 나가지 않고 패널 안에서 열고 닫는다. 스크롤은 세로만. 사진은 최대 8장, 장 수는 본인·공개 글 작성자에 표시. 공개를 끄면 다른 사람에게 사진과 장 수가 안 보인다. `profiles.avatar_urls`·`profile_public` 적용. 기존 대표 사진 4건을 목록에 넣음. 프로필 13건은 공개. 로고 패널 Updates에 `2026-09-27` 릴리스 노트.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS · 컬럼 조회 PASS.
- **Preview** https://www.gateo.kr/qa/profile · git `https://days-git-cursor-profile-a231-catgeots-projects.vercel.app/blog`
- **다음** `프로필 #4, Preview OK면 PR 병합` — 패널 유지·세로 스크롤·사진 장 수·공개 스위치 OK면 PR #338 병합.

## E2E Health, 보이는 입력칸

- **세션** `E2E Health #1, 입력칸 타임아웃` · feature `cursor/e2e-health-1fbd` · tip `8247297c` · draft PR [#337](https://github.com/catgeot/Days/pull/337)
- **원인** 2026-09-12 성공 이후 `main` 일정 실행이 연속 실패. E2E-3만 실패. 칩 도크가 켜지면 placeholder `메시지 입력...` 칸은 hidden이고, 보이는 칸은 `직접 입력…`. `getByPlaceholder`가 숨은 칸에서 180초 타임아웃.
- **조치** `e2e/helpers.js`가 보이는 textbox role로 입력. 채팅 UI는 그대로.
- **VERIFY** `SMOKE_SITE_URL=https://gateo.kr npx playwright test` — 3 passed (13.9s).
- **다음** PR #337 병합. 일 1회 cron은 `main`을 checkout하므로 병합 전엔 실패가 계속된다.

## 프로필 #2, 사진 카드

- **세션** `프로필 #2, 사진 카드` · feature `cursor/profile-a231` · tip `498a2e1c` · draft PR [#336](https://github.com/catgeot/Days/pull/336)
- **조치** 로고 패널은 왼쪽 프로필 카드, 오른쪽 방문한 여행사·나의 여행 기록, 아래 버킷리스트. 카드는 `/account`. 헤더의 작은 사진은 뺌. 프로필 사진 영역과 무니 질문 옆 사진을 키움. 공개 글 작성자 사진을 누르면 원본.
- **VERIFY** `smoke:logbook-view-count` PASS · `smoke:travel-agencies` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/profile · git `https://days-git-cursor-profile-a231-catgeots-projects.vercel.app/blog` · 프로필 `/account`
- **다음** `프로필 #3, Preview OK면 PR 병합` — 좌우 배치·사진 크기·원본 보기 OK면 PR #336 병합.

## 프로필 #1, 프로필 페이지

- **세션** `프로필 #1, 프로필 페이지` · feature `cursor/profile-a231` · tip `6f104728` · draft PR [#336](https://github.com/catgeot/Days/pull/336)
- **조치** 기록 보관소 기본 배치를 1열로. 로그북 헤더·사이드바·로고 패널의 비밀번호 변경은 프로필(`/account`)로. 필명·사진·비밀번호·Google/Kakao 계정 추가. 사진은 무니 질문·로고 패널·로그북 작성자(피드·글·댓글)에 표시.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/profile · git `https://days-git-cursor-profile-a231-catgeots-projects.vercel.app/blog` · 프로필 `/account`
- **다음** `프로필 #2, Preview OK면 PR 병합` — 1열·프로필 사진이 헤더·로고 패널·무니 질문·로그북에 보이면 PR #336 병합.

## 로그북 #21, 한국 주소는 도시 칩

- **세션** `로그북 #21, 한국 주소는 도시 칩` · feature `cursor/logbook-reads-af3f` · tip `1b0e7f3c` · PR [#334](https://github.com/catgeot/Days/pull/334)
- **조치** 칩 줄은 하나. 현재 위치 주소의 시·군은 칩에서 도시로 모은다. 춘천·춘천시 소양로3가·춘천시 퇴계동은 「춘천」. 보라카이·아이슬란드·길리 메모는 그대로. 파리 근교와 춘천시 근교는 도시로 안 넣는다. 카드 주소 문자열은 유지.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/logbook-reads · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog` (로그인 시 `?tab=public`)
- **다음** `로그북 #22, Preview OK면 PR 병합` — 춘천 칩 하나·카드 주소 유지·파리 근교 분리 확인 후 PR #334 병합.

## 로그북 #20, 칩 검토 — PR 보류

- **세션** `로그북 #20, Preview OK면 PR 병합` · feature `cursor/logbook-reads-af3f` · tip `654f4404` · PR [#334](https://github.com/catgeot/Days/pull/334) **병합 안 함**
- **Preview** 칩은 사진과 같다. 한 줄이고, 글 수 많은 순. 왼쪽은 전체·길리 메모 2·보라카이 2·아이슬란드 2. 가로로 넘기면 춘천 1·춘천시 소양로3가 1·춘천시 퇴계동 1. 앞쪽 「지정」은 잘린 장소 이름이지 분류 단계가 아니다.
- **판단** 중분류 칩 줄은 만들지 않는다. 보라카이·아이슬란드·길리 메모는 작성자가 넣은 여행지 이름이고, 그게 필터 단위다. 나라·광역 부모 필드가 없고, 아이슬란드는 나라이면서 여행지라 한 줄이 더 생기면 같은 말이 겹친다.
- **춘천** 도시로 안 뭉친다. `logbookPlaceKey`는 공백만 없앤다. 「춘천」「춘천시 소양로3가」「춘천시 퇴계동」은 칩 3개다. 「파리 근교」를 「파리」에 넣지 않는 것과 같다. 현재 위치 저장은 시와 동을 한 문자열로 넣고, 칩은 그 문자열을 자르지 않는다. 카드에 적힌 주소는 그대로 둔다.
- **다음** `로그북 #21, 한국 주소는 도시 칩` — 칩 줄은 하나. 여행지 이름은 유지. 춘천시 퇴계동·춘천시 소양로3가·춘천만 칩 「춘천」으로 합친 뒤 Preview. PR #334는 그 다음.

## 팔경 활용 #78 — 고성8경 마산봉설경

- **세션** `팔경 활용 #78, 고성 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `430d0be9` · PR [#335](https://github.com/catgeot/Days/pull/335)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 고성8경 결손 1건. 마산봉설경은 간성읍 흘리의 제8경(진부령 인근 백두대간·금강산 1만 2천봉의 남한 제2봉·군내 대간 23.4km 미시령~향로봉·흘리 숲길 6.1km·약 2시간·산림과 033-680-3382). 경남 고성·창원 마산·울산바위·통일전망대와 구분. 사진은 고성군 문화관광 8경 공식 설경.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `vite build` PASS. 순수 사진/개요 누락 **14**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=goseong` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=goseong`
- **다음** `팔경 활용 #79, 공주 결손 오버레이` — 창벽

## 로그북 #18, 여행지 분류

- **세션** `로그북 #18, 여행지 분류` · feature `cursor/logbook-reads-af3f` · tip `c5a8fade` · PR [#334](https://github.com/catgeot/Days/pull/334)
- **조치** 기록 보관소 검색 아래에 여행지 칩. 전체·장소별 글 수. 칩은 그 장소만, 다시 누르거나 전체로 복귀. 위치 미상은 칩에서 제외. 글이 늘면 가로 스크롤.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/logbook-reads · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog` (로그인 시 `?tab=public`)
- **다음** `로그북 #19, Preview OK면 PR 병합` — 여행지 칩으로 장소만 남고 전체로 돌아오면 PR #334 병합.

## 팔경 활용 #77 — 경주8怪 나원백탑

- **세션** `팔경 활용 #77, 경주 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `81a15bcf` · PR [#333](https://github.com/catgeot/Days/pull/333)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 경주8怪 결손 1건. 나원백탑은 현곡면 라원리 676의 경주 나원리 오층석탑(1962년 12월 20일 국보·2층 기단 5층 탑신·1995년 11월~1996년 7월 해체수리·무구정광대다라니경). 장항리 오층석탑·나원사·남산부석·불국영지·백율사와 구분. 사진은 국가유산청 국립문화재연구소 2007년 전경.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `vite build` PASS. 순수 사진/개요 누락 **15**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=gyeongju` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=gyeongju`
- **다음** `팔경 활용 #78, 고성 결손 오버레이` — 마산봉설경

## 팔경 활용 #76 — 장흥9경 선학동마을·하늘빛수목정원

- **세션** `팔경 활용 #76, 장흥 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `adf413a6` · PR [#332](https://github.com/catgeot/Days/pull/332)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 장흥9경 결손 2건. 7경 선학동마을은 회진면 가학회진로 1212(산저·2005 개설·『천년학』 주막·2006 유채·메밀 23㏊·2017 장흥 9경·문의 061-860-8350). 9경 하늘빛수목정원은 용산면 장흥대로 2746(2019년 1월 1일 전남 제8호 민간정원·함지봉·문의 061-862-2000). 이청준 생가·소등섬·편백숲 우드랜드·완도수목원과 구분. 사진은 디지털장흥문화대전 공식 사진.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `vite build` PASS. 순수 사진/개요 누락 **16**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=jangheung` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=jangheung`
- **다음** `팔경 활용 #77, 경주 결손 오버레이` — 나원백탑

## 팔경 활용 #75 — 의령9경 백산안희제·호암이병철 생가

- **세션** `팔경 활용 #75, 의령 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `f6c3518e` · PR [#330](https://github.com/catgeot/Days/pull/330)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 의령9경 결손 2건. 8경 백산안희제선생 생가는 부림면 입산로2길 37(1885년 출생·1993년 1월 8일 문화유산자료·1915년 중수·안채 6칸 팔작·사랑채 4칸 초가·문의 055-570-2444). 9경 호암이병철선생 생가는 정곡면 호암길 22-4(1851년 조부 한옥·대지 1,907㎡·10–17시·월요일 휴관·문의 055-573-0723). 곽재우 생가·부산 백산상회·용인 호암미술관과 구분. 사진은 국가유산청·호암재단 공식 사진.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `vite build` PASS. 순수 사진/개요 누락 **18**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=uiryeong` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=uiryeong`
- **다음** `팔경 활용 #76, 장흥 결손 오버레이` — 선학동마을·하늘빛수목정원

## 로그북 #17, 본문 반응 문구

- **세션** `로그북 #17, 본문 반응 문구` · feature `cursor/logbook-reads-af3f` · tip `87a92125` · PR [#325](https://github.com/catgeot/Days/pull/325)
- **조치** 카드의 조회수는 눈 대신 그래프, 하트는 누르기 전에도 붉은 테두리. 글을 열면 머리의 좋아요·댓글은 아이콘 대신 단어. 카드의 좋아요·댓글 아이콘은 유지.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/logbook-reads · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog` (로그인 시 `?tab=public`)
- **다음** `로그북 #18, Preview OK면 PR 병합` — 카드 그래프·붉은 하트, 본문 좋아요·댓글 단어 확인 후 PR #325.

## 로그북 #16, 1열 그리드

- **세션** `로그북 #16, 1열 그리드` · feature `cursor/logbook-reads-af3f` · tip `e908d8cc` · PR [#325](https://github.com/catgeot/Days/pull/325)
- **조치** 기록 보관소 검색 옆 배치를 자세히·1열·그리드 세 버튼으로. 1열은 사진 위 카드를 한 줄에 하나, 제목·요약을 넓게. 기본은 그리드. 좋아요 `window.confirm`의 긴 주소는 브라우저가 붙이는 프리뷰 호스트이고, 본문은 그대로.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS.
- **Preview** https://www.gateo.kr/qa/logbook-reads · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog` (로그인 시 `?tab=public`)
- **다음** `로그북 #17, Preview OK면 PR 병합` — 1열·하트·댓글 확인 후 PR #325.

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
