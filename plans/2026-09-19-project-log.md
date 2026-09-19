# 2026-09-19 프로젝트 일지

직전: [`2026-09-18-project-log.md`](./2026-09-18-project-log.md)

## 항공권 검색 #10 — 검색바를 tickets 항공 결과로 직행 (Cloud)

- **세션** `항공권 검색 #10, 항공 검색 결과로 직행`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `54a5f002` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 일정 없는 검색바가 `/flights/` 홈(항공+호텔 검색박스)으로 열려 출도착이 이전 검색으로 남음.
- **완료**: 출도착 IATA가 있으면 `/tickets-` 항공 검색 결과로 직행. 일정 없으면 +14/+21. **병합 보류**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 검색바 탭 → 항공+호텔 홈이 아니라 ICN→도착 항공 목록인지 · URL에 `/tickets-` 인지.

## 항공권 검색 #9 — 인원 설정 제거 (Cloud)

- **세션** `항공권 검색 #9, Preview OK면 PR 병합`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `131c1830` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: Preview에서 인원을 바꿔도 Trip.com 결과가 1인으로만 열림. 인원 설정 제거 요청.
- **완료**: 모바일 폼 인원 스테퍼 제거. 왕복/편도·출도착·한 달력 일정 유지. 검색은 기본 1인. **병합 보류** — 인원 제거 Preview 후.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 모바일에서 인원 줄이 없는지 · 일정 선택 후 검색 → Trip.com에 같은 날짜·1인인지. OK면 PR #288 병합.

## 항공권 검색 #8 — 출발·도착일을 한 달력에서 선택 (Cloud)

- **세션** `항공권 검색 #8, 한 달력 일정 선택`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `25bb00ed` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 가는 날·오는 날이 입력칸 두 개로 나뉘어 한 화면에서 구간을 고르기 어려움.
- **완료**: 일정 한 줄을 누르면 같은 달력에서 왕복은 가는 날→오는 날, 편도는 하루만 선택. 검색 URL의 ddate/rdate 연동은 유지.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 모바일에서 일정을 눌러 한 달력으로 가는 날·오는 날을 고른 뒤 검색 → Trip.com 결과에 같은 날짜인지.

## 항공권 검색 #7 — 모바일 폼을 Trip.com 검색 결과에 연동 (Cloud)

- **세션** `항공권 검색 #7, 모바일 검색 결과 연동`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `4730aa9a` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 네이티브 폼이 `/flights/?dAirportCode=` 홈으로 열려 출도착·날짜·인원이 Trip.com에 안 들어감. 출도착 입력창이 나뉘어 있고 왕복/편도·인원 선택이 없었음.
- **완료**: 한 줄에서 출발·도착 검색·교체. 왕복/편도·성인 인원. 검색 시 `/flights/{d}-to-{a}/tickets-…` 결과 URL로 ddate·rdate·triptype·quantity 전달.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 모바일에서 왕복·편도·인원·출발·도착·날짜를 고른 뒤 검색 → Trip.com 결과 페이지에 같은 값이 보이는지.

## 항공권 검색 #6 — 모바일 검색 폼 프리미엄 티켓 카드 디자인 (Cloud)

- **세션** `항공권 검색 #6, 모바일 검색 폼 프리미엄 티켓 카드 디자인`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `f047e95b` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 복원된 모바일 검색 폼의 투박한 기본 박스 디자인을 개선하여 플래너 무드와 어울리는 세련된 카드 UI 요청(사용자 1번 옵션 선택).
- **완료**: Trip.com 공식 브랜드 헤더 및 제휴 뱃지 추가, `ICN ✈ ARR` 보딩 패스 티켓형 경로 블록, 부드러운 배경과 포커스 링의 날짜 선택 인풋, 블루 그라데이션 검색 제출 버튼, 라운드/링 테두리(`rounded-2xl border-sky-300/80 ring-sky-900/10`)를 적용.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 모바일에서 파리 플래너 접속 시 티켓 스타일의 세련된 출도착 정보 바, 일자 선택창, 그라데이션 검색 버튼이 깔끔하게 표시되고 탭 시 Trip.com으로 정상 연결되는지 확인.

## 항공권 검색 #6 — 모바일 네이티브 항공권 입력 폼 복원 (Cloud)

- **세션** `항공권 검색 #6, 모바일 항공권 입력 폼 복원`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `b72f2bcf` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 직전 커밋(067a276a)에서 모바일 배너가 단순 링크 버튼(FlightSearchCta)으로 전환되어 있었음. 사용자의 요청에 따라 이전 브랜치(39e44fef)의 네이티브 검색 폼(`TripcomFlightNativeSearch`)으로 복원.
- **완료**: 모바일 환경(≤767px)에서 단순 링크 버튼 대신 출발·도착 공항 및 가는 날·오는 날 일자 입력창이 포함된 네이티브 폼을 제공. 폼 제출 시 선택한 일정 및 공항 정보와 함께 Trip.com 항공 검색 페이지로 직결. 데스크톱 900x200 iframe 배너 유지.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 모바일에서 파리 플래너 접속 시 단순 버튼이 아닌 출발(ICN)·도착(CDG) 및 날짜 선택 입력 폼이 보이고, 검색 탭 시 선택된 날짜와 함께 Trip.com 검색 페이지가 열리는지 확인.

## 항공권 검색 #5 — 모바일 네이티브 항공 검색 카드 적용 (Cloud)

- **세션** `항공권 검색 #5, 모바일 네이티브 항공 검색 카드 적용`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `067a276a` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: Trip.com 제휴 광고 서버 자체의 `Authentication failed` 오류로 인해 모바일에서 iframe이 빈 박스로 남아 작동하지 않음.
- **완료**: 모바일 환경(≤767px)에서는 빈 iframe 대신 출발지·도착지 IATA가 명시된 네이티브 검색 배너 카드(`FlightSearchCta`)로 즉시 전환. 탭 시 Trip.com 항공 검색 페이지로 직결(모달 해제). PC 환경은 기존 900x200 가로형 iframe 배너 유지.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 모바일에서 파리·로포텐 플래너 접속 시 빈 박스 없이 깔끔한 항공권 검색 카드가 보이고, 탭 시 Trip.com으로 정상 연결되는지 확인.

## 항공권 검색 #4 — 모바일 위젯 공식 발급 태그 1:1 일치 (Cloud)

- **세션** `항공권 검색 #4, 모바일 위젯 태그 일치`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `98cf2a72` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 사용자가 Trip.com에서 직접 재발급받은 iframe 태그의 파라미터(`Allianceid`, `SID`, `trip_sub1`)와 게이트오 내부 URL 생성 로직 간 차이(추가 전달되던 `aAirportCode` 등)를 확인하여 공식 규격으로 동기화.
- **완료**: `buildTripcomPlannerFlightUrl` ad 모드에서 공식 파라미터만 전달하도록 정비. iframe id(`S17158794`) 및 인라인 스타일 동기화.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 모바일에서 재발급된 Trip.com 태그 규격으로 위젯이 정상 로드되어 표시되는지 확인.

## 항공권 검색 #4 — 모바일 위젯 진단 패널 및 로그 복사 (Cloud)

- **세션** `항공권 검색 #4, 모바일 진단 로그`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `99a41ed1` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 롤백 후에도 모바일에서 위젯이 보이지 않는 증상의 원인(실제 DOM 크기, iframe 이벤트, 뷰포트 등)을 모바일 기기에서 직접 추출·확인하기 위함.
- **완료**: `FlightDebugPanel` 및 `flightDebug.js` 추가. 화면 좌하단 플로팅 버튼 및 배너 캡션 하단에 [로그 복사] 버튼을 두어 원클릭으로 모바일 상태를 클립보드로 복사할 수 있게 지원.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 모바일에서 화면 접속 시 좌하단 [모바일 위젯 로그] 버튼 클릭 → [📋 로그 복사] 터치로 진단 로그 복사 가능 확인.

## 항공권 검색 #3 — 플래너 3단 분리 이전 단일 스크롤 복귀 (Cloud)

- **세션** `항공권 검색 #3, 3단 분리 이전 복귀`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `c95d2b43` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 3단 점진적 노출(필수·이동·즐기기) 탭 구조 도입 이후 모바일 배너 iframe 표시 문제 및 내비게이션 복잡도가 누적되어 롤백 결정.
- **완료**: 플래너 구조를 3단 분리 이전의 단일 스크롤(출발 전 필수 준비·현지 도착 및 이동·현지 100% 즐기기)로 복귀. 상단 Trip.com 항공 배너 위젯 및 체크리스트 기존 규격 복원. `PlannerStageNav` 제거.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **QA**: 파리 플래너가 단일 스크롤로 모든 섹션(출발 전 준비·도착 및 이동·즐기기)이 한 번에 펼쳐지는지 · 상단 항공 위젯 및 체크리스트 정상 동작 확인.
- **다음**: Preview OK면 PR #288 병합

## 항공권 검색 #2 — Preview 단축 `/qa/flight` (Cloud)

- **세션** `항공권 검색 #2, 로컬 위젯 진단`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `4e53af1f` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: `/qa/tripcom-flight`가 feature에만 있어 www.gateo.kr에서 Preview로 안 넘어감(PROD 200 SPA).
- **완료**: PROD 단축을 `/qa/flight`로 등록. 옛 `/qa/tripcom-flight`는 같은 Preview alias.
- **Preview** https://www.gateo.kr/qa/flight → git Preview `/place/paris/planner`
- **다음**: Preview OK면 PR #288 병합

## 항공권 검색 #2 — 필수 단계 전체 폭 위젯 (Cloud)

- **세션** `항공권 검색 #2, 로컬 위젯 진단`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `ec937298` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 방문자 개선 #7이 900×200 iframe을 체크리스트 2열 칸에 넣어 PC 스케일 ~0.4. 모바일 320×480은 카드 안에서 빈 박스.
- **완료**: 3단계 탭 유지. 위젯만 필수 단계 전체 폭. 체크리스트 항공 CTA 중복 생략.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/tripcom-flight → git Preview `/place/paris/planner`
- **QA**: 파리 필수 단계 위젯이 전체 폭 · PC 공항·날짜 읽힘 · 모바일 검색 폼(빈 화면 아님) · ICN→CDG
- **다음**: Preview OK면 PR #288 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 항공권 검색 #1 — 기존 iframe 배너·모바일 모달 복구 (Cloud)

- **세션** `항공권 검색 #1, 기존 위젯 복구`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `8bdcaaf4` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: `/flights/` 직링크는 도착이 이전 검색(LPB)으로 남음. 5-22 모바일 SSOT는 partners/ad iframe 모달(ICN→도착).
- **완료**: 새 CTA 착지 제거. iframe 배너·모바일 모달 복구. #7에서 뺀 항공권 카드 배너만 유지. PR 미병합.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/tripcom-flight → git Preview `/place/paris/planner`
- **QA**: 파리 위젯 ICN→CDG · 탭 시 앱 안 검색(CDG, 빈 화면·LPB 아님) · 항공권 카드 배너
- **다음**: Preview OK면 PR #288 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 항공권 검색 #1 — 클릭을 /flights/ 직링크로 (Cloud)

- **세션** `항공권 검색 #1, Preview OK면 PR 병합`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `5780a341` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 사람 Preview에서 「항공권 실시간 검색」탭 시 `kr.trip.com` 빈 화면. 모바일 클릭이 iframe용 `partners/ad`를 전체 페이지로 염.
- **완료**: 상위 이동은 항상 `/flights/`. 플래너 배너는 네이티브 `<a>`. PR은 Preview 재확인 후 병합.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/tripcom-flight → git Preview `/place/paris/planner`
- **QA**: 파리·이비사 배너 탭 → Trip.com 항공 검색 폼 (`kr.trip.com` 빈 화면 아님)
- **다음**: Preview OK면 PR #288 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 항공권 검색 #1 — 플래너 트립닷컴 위젯·배너 복구 (Cloud)

- **세션** `항공권 검색 #1, 위젯·배너 복구`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `40213e5a` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: Trip.com `partners/ad` iframe이 3rd-party에서 `queryToolDetail` 실패 → 빈 흰 박스. #7에서 항공권 카드 `FlightSearchCta` 생략.
- **완료**: iframe 끄고 필수 툴킷 CTA. 항공권 카드 배너 복구. 탭하면 Trip.com 검색(빈 모달 아님).
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/tripcom-flight → git Preview `/place/paris/planner`
- **QA**: 파리·이비사 필수 단계 흰 박스 없음 · ICN→도착 CTA · 항공권 카드 배너 · 탭 시 Trip.com
- **다음**: Preview OK면 PR #288 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 축제 페이지 #5 — 푸터·무니 겹침 (Cloud)

- **세션** `축제 페이지 #5, 푸터·무니 겹침`
- **브랜치** `cursor/festival-sheet-ui-ec8b` · tip `89d7049a` · PR [#287](https://github.com/catgeot/Days/pull/287)
- **원인**: 본문 하단 닫기가 Trust 푸터와 겹침. 우측 무니와 「위로」가 겹침. 무니 채팅이 어두움.
- **완료**: 상세·목록 하단 패딩. 「위로」를 푸터 위로, 무니는 「위로」 위로. 무니 FAB·채팅을 하늘·민트 톤으로.
- **VERIFY**: `npm run smoke:korea-festival-personal` PASS · `smoke:korea-festival-nearby` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/festival-ui → git Preview `/korea`
- **QA**: 본문 끝 닫기·푸터 · 무니/위로 분리 · 밝은 무니 채팅
- **다음**: Preview OK면 PR #287 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 향교 검색 #2 QA — 목록 10개 (Cloud)

- **세션** `향교 검색 #2, 목록 페이지`
- **브랜치** `cursor/hyanggyo-search-f9b8` · tip `24326693` · PR [#285](https://github.com/catgeot/Days/pull/285)
- **완료**: 사람 피드백으로 한 장 8개 → 검색 표준 10개. 카드 UI 유지. PROD `/qa`에는 아직 향교 행 없음 → git Preview URL.
- **VERIFY**: `npm run smoke:korea-poi-type-search` PASS · `smoke:explore-search-aliases` PASS · `smoke:search-enter-match` PASS · `npx vite build` PASS
- **Preview** https://days-git-cursor-hyanggyo-search-f9b8-catgeots-projects.vercel.app/
- **QA**: 「향교」엔터 → 한 장 10개·다음. 「춘천 향교」엔터 → 춘천향교. 「목포」엔터 리스트 유지.
- **다음**: Preview OK면 PR #285 병합

## 향교 검색 #2 — 목록 8개 페이지 (Cloud)

- **세션** `향교 검색 #2, Preview OK면 PR 병합`
- **브랜치** `cursor/hyanggyo-search-f9b8` · tip `74c1f31d` · PR [#285](https://github.com/catgeot/Days/pull/285)
- **원인**: 「향교」엔터 전국 목록이 한 화면에 다 나와 스크롤하다 포기하게 됨.
- **완료**: 기존 선택 카드 유지. 9장 이상이면 8개씩 이전·다음. 춘천 향교·목포처럼 짧은 목록은 페이지 버튼 없음. PR은 Preview 후 병합.
- **VERIFY**: `npm run smoke:korea-poi-type-search` PASS · `smoke:explore-search-aliases` PASS · `smoke:search-enter-match` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/hyanggyo → git Preview `/`
- **QA**: 「향교」엔터 → 한 장 8개·다음. 「춘천 향교」엔터 → 춘천향교 · 도시 카드 아님. 「목포」엔터 리스트 유지.
- **다음**: Preview OK면 PR #285 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #65 — 보성9경 일림산 용추계곡·주암호 서재필기념관 오버레이 (Cloud)

- **세션** `팔경 활용 #65, 보성 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `9d09f967` · PR [#286](https://github.com/catgeot/Days/pull/286)
- **완료**: JSON contentId 없이 LOCAL_SCENIC_MEMBER_OVERLAYS로 보성9경 결손 2건 보강. 일림산 용추계곡(7경)은 웅치면 용반리 일림산 664m·보성강 시원·용추폭포(선녀탕·용바위). 주암호 서재필기념관(9경)은 문덕면 용암길 8 기념관·가내길 18-35 생가(1864 가내마을·1992 조성·개화문). 보성군 문화관광 9경 공식 사진. 문경 용추계곡·가평·동해 용추폭포·제암산자연휴양림·서울 독립문·순천 주암댐·주암호생태습지·대원사와 구분. 순수 누락 **38**/876.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=boseong`
- **잔여**: 사진/개요 순수 누락 **38**/876. 다음 허브 **산청9경 2**(황매산 철쭉·남명조식유적지)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #64 QA — 무안 검색 승달산·초의 빈 썸네일 (Cloud)

- **세션** `팔경 활용 #64, 무안 결손 오버레이` (같은 턴 Preview 피드백)
- **브랜치** `cursor/palgyeong-use-e744` · tip `83dc35a4` · PR [#284](https://github.com/catgeot/Days/pull/284)
- **원인**: 「무안」검색 8경 승달산 랜드마크 아이콘. Tour `126614` first_image 공란. 4경 초의선사탄생지 `127177`은 tourapi_attraction 미동기화.
- **완료**: JSON contentId 없이 무안군 문화관광 공식 사진 오버레이. 승달산 산나리 조망(`seungdalsan_8.jpg`)·초의길 30 전경(`/9/01.jpg`). 도리포·낙지공원·백로 번식지는 Tour first_image 있어 유지. 법천사 무안과 구분.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview 「무안」검색 8경·4경 썸네일
- **잔여**: 사진/개요 순수 누락 **40**/876. 다음 허브 **보성9경 2**(일림산 용추계곡·주암호 서재필기념관)
- **QA**: 「무안」검색 승달산·초의선사탄생지 사진인지. 도리포·낙지공원·법천사 무안 기존 썸네일 유지인지.

## 향교 검색 #1 — TourAPI 다후보 (Cloud)

- **세션** `향교 검색 #1, TourAPI 다후보`
- **브랜치** `cursor/hyanggyo-search-f9b8` · tip `c873bce1` · PR [#285](https://github.com/catgeot/Days/pull/285)
- **원인**: 허브 prefix가 「춘천향교」를 춘천 도시로 스냅. 허브 SSOT 향교는 4곳뿐. TourAPI에는 춘천향교(125780)·향교 제목 168건.
- **완료**: 도시명 뒤 나머지가 시·군이 아니면 허브 히트 아님. 향교·서원은 TourAPI 제목 다후보. 시설 쿼리에 향교·서원.
- **VERIFY**: `npm run smoke:korea-poi-type-search` PASS · `smoke:explore-search-aliases` PASS · `smoke:search-enter-match` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/hyanggyo → git Preview `/`
- **QA**: 「향교」엔터 → 춘천·나주 등 여러 장. 「춘천 향교」엔터 → 춘천향교 · 춘천 도시 아님. 「목포」엔터 리스트 유지.
- **다음**: Preview OK면 PR #285 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #64 — 무안9경 식영정·느러지·톱머리·홀통 오버레이 (Cloud)

- **세션** `팔경 활용 #64, 무안 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `5eb2785b` · PR [#284](https://github.com/catgeot/Days/pull/284)
- **완료**: JSON contentId 없이 LOCAL_SCENIC_MEMBER_OVERLAYS로 무안9경 결손 2건 보강. 식영정(3경)은 몽탄면 호반로 562-15 息營亭(1630 한호 임연·문화재자료 237호)와 영산강 느러지 곡강. 톱머리·홀통(5경)은 망운면 톱머리길 66·현경면 홀통길 198-1 백사장·해송. 무안군 문화관광 공식 사진. 담양 息影亭·나주 느러지전망대·영월 한반도지형·도리포·조금나루와 구분. 순수 누락 **40**/876.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=muan`
- **잔여**: 사진/개요 순수 누락 **40**/876. 다음 허브 **보성9경 2**(일림산 용추계곡·주암호 서재필기념관)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 탐색 Enter #1 — 도시 허브 리스트 (Cloud)

- **세션** `탐색 Enter #1, 도시 허브 리스트`
- **브랜치** `cursor/search-enter-hub-2018` · tip `b8ef3e66` · PR [#283](https://github.com/catgeot/Days/pull/283)
- **원인**: 여행지 매칭 #2가 타이핑 제안 이름 일치를 Enter에서 바로 고름. 「목포」드롭다운의 도시 카드가 써머리 장소 카드로 열림.
- **완료**: `preferEnterSuggestion`이 도시 허브 exact면 null. Enter는 도시+명소 선택 카드. 유달산·광천선굴 명소 exact는 유지.
- **VERIFY**: `npm run smoke:search-enter-match` PASS · `smoke:explore-choice-overlay` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/search-enter-hub → git Preview `/explore`
- **QA**: 「목포」엔터 → 리스트 카드. 「유달산」엔터 → 유달산. 「광천선굴」엔터 → 평창 광천선굴.
- **다음**: Preview OK면 PR #283 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA.

## 팔경 활용 #63 — 목포9경 목포진·다도해 전경 오버레이 (Cloud)

- **세션** `팔경 활용 #63, 목포 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `593fdee0` · PR [#282](https://github.com/catgeot/Days/pull/282)
- **완료**: JSON contentId 없이 LOCAL_SCENIC_MEMBER_OVERLAYS로 목포9경 결손 2건 보강. 목포진(6경)은 만호동 목포진길 11번길 1-5 수군진 역사공원(세종 21년 설치·2014 객사 복원·문화재자료 137호). 다도해 전경(8경)은 유달산에서 고하도·외달도 조망. 목포시 문화관광 9경 공식 사진. 해남 구 목포구등대·목포대교 일몰·유달산 산봉·외달도 섬·진도 다도해해상국립공원과 구분. 순수 누락 **42**/876.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=mokpo`
- **잔여**: 사진/개요 순수 누락 **42**/876. 다음 허브 **무안9경 2**(영산강 식영정과 느러지·톱머리·홀통 해수욕장)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## MOONi 일정 페이스메이커 #3 — PR #281 메인 병합 (Cloud)

- **세션** `MOONi 일정 페이스메이커 #3, Preview OK면 PR 병합`
- **브랜치** `cursor/mooni-itinerary-concierge-76f0` · merge `16c8be14` · PR [#281](https://github.com/catgeot/Days/pull/281) (MERGED)
- **완료**: 컴포저 상황극 QA(체류·공항·항공시각 전제 유지 · 턴당 ~1.4ms)와 `smoke-mooni-ask-bridge`/`build` PASS 후 PR #281을 main에 병합. 인덱스 주제 종료. Preview 작업 로그는 팔경 활용을 활성으로 유지.
- **VERIFY**: `node scripts/smoke-mooni-ask-bridge.mjs` PASS · `npm run build` PASS
- **PROD** https://www.gateo.kr/place/paris
- **QA**: 「오를리 공항 도착 3박 4일」 후 「둘째 날은?」이 3박·ORY를 유지하는지. 「KE901 오후 2시 CDG」 후 일정 질문이 CDG·14:00을 쓰는지. 도시명 「파리」만으로는 공항을 안 잡는지.
- **다음**: 없음 (주제 종료)

## 팔경 활용 #62 QA — 경기 광주 관광공사 검색 0건 (Cloud)

- **세션** `팔경 활용 #62, 경기 광주 결손 오버레이 QA`
- **브랜치** `cursor/palgyeong-use-e744` · tip `0979bf47` · PR [#280](https://github.com/catgeot/Days/pull/280)
- **완료**: 「경기 광주」관광공사 전무는 사실이 아님. TourAPI type12 `경기도 광주시` 40건. 허브명「경기 광주」ilike가「경기도 광주시」와 안 맞아 0건. Tour DB 검색만 `scenicTourSearchQuery`→「경기도 광주」. 명승 0은 사실(남한산성은 사적).
- **VERIFY**: `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-local-scenic-lists` PASS · `npx vite build` PASS · DB `경기 광주`=0 · `경기도 광주`=40
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview 검색 「경기 광주」
- **잔여**: 다음 허브 **목포9경 2**(목포진·다도해 전경)
- **QA**: 검색 「경기 광주」한국관광공사 목록이 비어 있지 않은지(개원사·한옥마을·경안천). 명승 0은 정상.

## 여행지 매칭 #14 — PR #276 메인 병합 및 배포 (Cloud)

- **세션** `여행지 매칭, PR #276 메인 병합 및 배포`
- **브랜치** `cursor/dest-match-arch` · merge `e89de918` · PR [#276](https://github.com/catgeot/Days/pull/276) (MERGED)
- **완료**: 검증 게이트 PASS 후 PR #276을 main에 병합. 작업 로그 `active: false`. `/qa/dest-match` → PROD `https://www.gateo.kr/`. 인덱스·플랜 §9 주제 종료.
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `npm run smoke:explore-search-aliases` PASS · `npm run smoke:mrt-stay` PASS (33) · `npx vite build` PASS
- **PROD** https://www.gateo.kr/ · `/qa/dest-match` → PROD `/`
- **QA**: 홈「종각」「광천」「송암」「강원대」동음 분기 · 광천선굴 숙소 평창 · 송암스포츠타운 숙소 춘천(양주 아님)
- **다음**: 없음 (주제 종료)

## MOONi 일정 페이스메이커 #2 — 여행지 세션 맥락 저장 및 실전 응답 튜닝 (Cloud)

- **세션** `MOONi 일정 페이스메이커 #2, 사용자 피드백 반영 및 실전 응답 튜닝`
- **브랜치** `cursor/mooni-itinerary-concierge-76f0` · tip `7c2c083d` · PR [#281](https://github.com/catgeot/Days/pull/281)
- **점검**: 대화 기록(`saved_trips.messages`)은 여행지별로 남지만, 체류·항공편·현재 동선은 구조화되어 있지 않아 후속 질문이 카탈로그 기본값으로 덮일 수 있었음.
- **완료**: `mooniTripSession.js`로 체류 일수·도착/출발 공항·항공편 번호·도착 시각·컨디션·현재 권역을 추출해 해당 여행지 세션(`curation_data.mooniSession` + localStorage)에 저장. 매 턴 system prompt `[이번 여행 세션]`으로 주입. 사용자 도착 공항이 GATEO 카탈로그보다 우선.
- **VERIFY**: `node scripts/smoke-mooni-ask-bridge.mjs` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/place/paris
- **QA**: 「오를리 공항 도착 3박 4일」 후 「둘째 날은?」이 체류·오를리를 다시 묻지 않는지. 「KE901 오후 2시 CDG 도착」 후 일정이 그 시각·공항을 쓰는지.
- **다음**: `MOONi 일정 페이스메이커 #3, Preview OK면 PR 병합` (완료 · merge `16c8be14`)

## MOONi 일정 페이스메이커 #1 — 기행문 묘사 기반 맞춤 일정 및 컨시어지 기능 강화 (Cloud)

- **세션** `MOONi 일정 페이스메이커 #1, 기행문 묘사 기반 맞춤 일정 및 컨시어지 기능 강화`
- **브랜치** `cursor/mooni-itinerary-concierge-76f0` · tip `ac868a8a` · PR [#281](https://github.com/catgeot/Days/pull/281)
- **완료**: 파리 기행문 초안에 묘사된 MOONi(AI 도슨트 겸 페이스메이커) 기능에 맞춰, 체류 일수·동행·도착 공항·컨디션에 따른 맞춤형 일정 조율 및 실전 여행 컨시어지 기능을 대폭 강화.
  1) `bookingIntentResolver.js`: `detectItineraryIntent` 추가로 일정/루트/코스/동선 발화 시 전문 `PLANNER` 페르소나 자동 전환.
  2) `mooniPromptBundles.js`: 과밀 방지(Slow Travel), 오전/오후 권역 분할, 첫날 시차 배려(공항→숙소 체크인→가벼운 산책→휴식), 컨디션 맞춤(첫날 가볍게, 다리 아픔, 비오는 날), 솅겐 90/180일 무비자 원칙, EES/ETIAS 최신 변동 주의, 다중 공항(CDG/ORY 등) 시내 이동 요령, 루브르 등 명소 시간대별 예약/가방 규정 가이드 명문화.
  3) `mooniChipPrompts.js`: 일정/루트/코스/동선/첫날/컨디션 발화 패턴 정규식 확장 매핑.
  4) `mooniQuickReplies.js` & `locales/*.json`: 기존 고정형 "2~3일 일정" 칩을 "추천 일정·동선" (모바일 "추천 일정", EN "Suggested itinerary")으로 개선하고, 전송 문구를 "무리 없는 추천 일정과 동선 짜줘"로 유연화.
- **VERIFY**: `node scripts/smoke-mooni-ask-bridge.mjs` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/place/paris (파리 장소 페이지에서 MOONi 대화 열기)
- **QA**: 파리 페이지에서 MOONi에게 "첫날은 가볍게 일정 짜줘" 또는 "오를리 공항 도착 3박 4일 일정" 질문 시 완급 조절된 현실적 동선 및 실전 팁이 나오는지 확인.
- **다음**: `MOONi 일정 페이스메이커 #2, 사용자 피드백 반영 및 실전 응답 튜닝`

## 팔경 활용 #62 QA — 경기 광주 8경 공식 목록 재정비 (Cloud)

- **세션** `팔경 활용 #62, 경기 광주 결손 오버레이 QA`
- **브랜치** `cursor/palgyeong-use-e744` · tip `293a5c1a` · PR [#280](https://github.com/catgeot/Days/pull/280)
- **완료**: 사람 Preview에서 팔경 목록에 없는 곳이 팔경에 들어가 있었다. 광주시 문화관광 공식 8경으로 멤버를 맞춤(1 남한산성·2 분원도요지&팔당물안개공원·3 경안천습지생태공원·4 앵자봉&천진암·5 무갑산·6 태화산·7 경기도자박물관·8 중대물빛공원). 화담숲·곤지암도자공원은 GATEO 선정만 유지. 송정사 제외. JSON contentId 없이 2·4·6·7경 시 공식 사진·개요 오버레이. 광주 순수 누락 0. 전체 **44**/876.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=gwangju_gi`
- **잔여**: 사진/개요 순수 누락 **44**/876. 다음 허브 **목포9경 2**(목포진·다도해 전경)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 여행지 매칭 #11 — 송암스포츠타운 숙소 양주 오탐 (Cloud)

- **세션** `여행지 매칭 #11, 송암스포츠타운 숙소 양주 오탐`
- **브랜치** `cursor/dest-match-arch` · tip `954338a3` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: 홈「송암」→ 춘천 송암스포츠타운 → 숙소 찾기가 검색어「송암」을 1차 키워드로 써서 양주 장흥 펜션이 나왔다. 짧은 동음 토큰은 시·군(춘천) 선두, Geo-Sanity에 양주 추가. **#14에서 PR [#276](https://github.com/catgeot/Days/pull/276) 병합.**
- **VERIFY**: `npm run smoke:mrt-stay` PASS (`chuncheon-songam-sports-town` kw=춘천) · `smoke:ko-homonym-ri-search` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「송암」→ 송암스포츠타운 → 숙소 찾기 → 춘천. 양주 비타민펜션·장흥유원지면 실패.
- **다음**: `여행지 매칭 #12, 하드코딩 사전 정리 및 SSOT 일원화`

## 여행지 매칭 #13 — 종합 QA 및 메인 병합 준비 (Cloud)

- **세션** `여행지 매칭 #13, 종합 QA 및 메인 병합 준비`
- **브랜치** `cursor/dest-match-arch` · tip `cf1eb018` · PR [#276](https://github.com/catgeot/Days/pull/276) (Ready for Review)
- **완료**: 서브에이전트(컴포져) 및 전체 스모크 기반으로 종각·광천·송암·강원대 등 주요 지명의 동음이의어 분기, First-Pass 고유 매칭, 숙소 래더(Geo-Sanity 가드 포함), 갤러리 시설 컷 필터링에 대한 심층 QA를 완료. 모든 시나리오 PASS 확인 후 PR #276을 Draft 해제(Ready for Review)하여 메인 병합 준비를 완료.
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `npm run smoke:explore-search-aliases` PASS · `npm run smoke:mrt-stay` PASS (33개 케이스) · `npx vite build` PASS (빌드 에러 0건)
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 종각(서울/대구 분기), 광천(평창/광주/홍성 분기, 광천선굴 숙소 평창), 송암(고양/춘천/광주 분기, 송암스포츠타운 숙소 춘천), 강원대(춘천/삼척 분기) 정상 동작 확인.
- **다음**: `여행지 매칭 #14, PR #276 메인 병합 및 배포` (완료 · merge `e89de918`)

## 여행지 매칭 #12 — 하드코딩 사전 정리 및 SSOT 일원화 (Cloud)

- **세션** `여행지 매칭 #12, 하드코딩 사전 정리 및 SSOT 일원화`
- **브랜치** `cursor/dest-match-arch` · tip `04b69655` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: `mrtStayQuery.js`, `exploreSearchAliases.js`, `usePlaceGallery.js`, `koreaHomonymDictionary.js` 등에 분산되어 있던 `KO_STATION_ALIASES`, `KO_UNIVERSITY_ALIASES`, `KO_UNIVERSITY_SATELLITE_ALIASES`, `KO_EXPLORE_SEARCH_ALIASES`, `KO_GALLERY_QUERY_OVERRIDES`, `KOREA_HOMONYM_GROUPS`를 `src/pages/Home/lib/koreaPlaceMatchDictionary.js` 단일 SSOT 파일로 통합 일원화. `resolveKoreaPlaceMatch` 통합 리졸버 및 helper 함수 모듈화. 기존 모듈 re-export로 하위 호환성 100% 유지. `scripts/smoke-explore-search-aliases.mjs`에 SSOT 무결성 검증 추가. 기존 회귀 0건. **#14에서 PR [#276](https://github.com/catgeot/Days/pull/276) 병합.**
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `npm run smoke:explore-search-aliases` PASS · `npm run smoke:mrt-stay` PASS (33개 케이스) · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈 검색에서 종각, 광천, 송암스포츠타운, 강원대 등이 정상 동작하고, 숙소 찾기 및 갤러리가 깨짐 없이 노출되는지 확인.
- **다음**: `여행지 매칭 #13, 종합 QA 및 메인 병합 준비`

