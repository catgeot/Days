# 2026-09-20 프로젝트 일지

직전: [`2026-09-19-project-log.md`](./2026-09-19-project-log.md)

## 축제-여행지매칭 #1, P1 주소 SSOT (Cloud)

- **세션** `축제-여행지매칭 #1, P1 주소 SSOT`
- **브랜치** `cursor/korea-theme` · tip `16c0d166`
- **완료**: `koreaTourAddrNormalize`(전남광주통합특별시) · locality sigungu · 축제 addr→곡성 hub · 여수 패키지 CTA 가드 · `smoke:korea-theme-cross-links` SIEAF fixture
- **VERIFY**: `smoke:korea-theme-cross-links` · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/korea-theme → `/korea` · git Preview `days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **QA (사람)**: `/korea` 축제 **섬진강국제실험예술제** 상세 — 숙소·투어 기본 **곡성** · 여수 패키지 없음

## 파리 플래너 — 나비고 주간권 구매·제휴 (Cloud)

- **브랜치** `cursor/paris-navigo-links-7027` · tip `0f8d71ee` · PR [#290](https://github.com/catgeot/Days/pull/290)
- **확인**: Navigo Semaine는 **제휴 온라인 SKU 없음**(역 매표소·Découverte 카드). Klook **Paris Visite**만 제휴 연결(나비고와 별도).
- **완료**: 교통·패스 카드에 공식 구매 안내 + Klook Paris Visite 버튼 · 툴킷 프롬프트 파리 Navigo 규칙 · `smoke:paris-transit-planner-links`
- **피드백**: 전용 CTA 버튼 제거 → 본문 `나비고 주간권(Navigo Semaine)` **클릭→구글 검색** 스마트 링크
- **VERIFY**: smoke + `npm run build` PASS · **병합 보류**
- **QA**: `/place/paris/planner` 교통·패스 — 나비고 공식 · Klook 파리 비지트 링크

## 플래너 3단계 #4 — 렌터카·픽업·항공권 기준 위치 (Cloud)

- **세션** `플래너 3단계 #4, Preview QA`
- **브랜치** `cursor/planner-stages-7ee0` · tip `977568aa` · PR [#289](https://github.com/catgeot/Days/pull/289)
- **완료**: 「렌터카 · 픽업 · 항공권 기준」을 1단계 **출발 전 필수 준비** 섹션 상단으로 이동. 2·3단계·탭 위 공통 영역에서는 제거. `#planner-rental-pickup` → 필수 단계. **병합 보류**.
- **VERIFY**: `smoke:tripcom-flight-planner` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/planner-stages → `/place/paris/planner`
- **QA**: 1단계 상단 슬림(하이브리드·여행사만) · 출발 전 준비 아래 배너 · 2·3단계 배너 없음

## 플래너 3단계 #3 — 상단 공지·여행사·하이브리드 고지 (Cloud)

- **세션** `플래너 3단계 #3, Preview QA`
- **브랜치** `cursor/planner-stages-7ee0` · tip `3402d5ae` · PR [#289](https://github.com/catgeot/Days/pull/289)
- **완료**: 1단계만 하이브리드 고지(제목 아래)·방문한 여행사·연관 여행지. 2·3단계는 렌터카·픽업 배너+탭만 상단, 하이브리드 고지는 단계 하단 1회. **병합 보류**.
- **피드백**: 렌터카 배너 sticky 제거 · 하이브리드 고지 i18n 원문 복원.
- **VERIFY**: `smoke:tripcom-flight-planner` · `smoke:trust-disclosure` · `smoke:planner-empty-scroll` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/planner-stages → `/place/paris/planner`
- **QA**: 1단계 여행사·하이브리드 상단 · 2·3단계 상단 슬림·하이브리드 하단

## 플래너 3단계 #2 — 네이티브 검색 폼 (Cloud)

- **세션** `플래너 3단계 #2, Preview QA`
- **브랜치** `cursor/planner-stages-7ee0` · tip `c04252b9` · PR [#289](https://github.com/catgeot/Days/pull/289)
- **원인**: 항공권 카드에 트립닷컴 모바일 iframe이 빈 공간으로 남고, 「항공권 실시간 검색」링크 버튼만 보임. 그 위젯은 작동하지 않음.
- **완료**: 1단계 항공권 카드에 출발·도착·일정 입력 폼만 둠. iframe·실시간 검색 버튼 제거. **병합 보류**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `smoke:planner-empty-scroll` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/planner-stages → git Preview `/place/paris/planner`
- **QA**: 항공권 카드 입력 폼 · 빈 iframe 없음 · 실시간 검색 버튼 없음

## 플래너 3단계 #2 — 항공 검색 폼을 항공권 파트로 (Cloud)

- **세션** `플래너 3단계 #2, Preview QA`
- **브랜치** `cursor/planner-stages-7ee0` · tip `53248157` · PR [#289](https://github.com/catgeot/Days/pull/289)
- **원인**: 상단 항공 검색 폼이 1·2·3단계마다 보여 무겁고, 저장된 데이터 새로고침 버튼은 불필요.
- **완료**: 검색 폼을 1단계 항공권 카드 아래로 이동. 새로고침 버튼 제거. 픽업·유심 2열·복잡도 n/100 유지. **병합 보류**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `smoke:planner-empty-scroll` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/planner-stages → git Preview `/place/paris/planner`
- **QA**: 1단계 항공권 아래 검색 폼 · 2·3단계 상단 폼 없음 · 새로고침 없음

## 플래너 3단계 #1 — 배너 유지한 채 섹션만 분리 (Cloud)

- **세션** `플래너 3단계 #1, 배너 유지 분리`
- **브랜치** `cursor/planner-stages-7ee0` · tip `ce1e1e45` · PR [#289](https://github.com/catgeot/Days/pull/289)
- **원인**: 이전 3단계 분리는 위젯을 체크리스트 칸에 넣고 UI를 많이 바꿔 보기가 좋지 않았고, 실제 항공 검색 문제는 트립닷컴 위젯이었다.
- **완료**: 상단 항공·픽업 배너·유심 2열·복잡도 점수는 유지. 기존 세 섹션(필수 준비·도착 이동·즐기기)만 단계 탭으로 전환. **병합 보류**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `smoke:planner-empty-scroll` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/planner-stages → git Preview `/place/paris/planner`
- **QA**: 1·2·3단계 전환 · 상단 배너 유지 · 유심 2열 · 복잡도 n/100

## 항공권 검색 #12 — 써머리 검색은 일정 폼 모달 (Cloud)

- **세션** `항공권 검색 #12, Preview QA`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `2fda0eb0` · PR [#288](https://github.com/catgeot/Days/pull/288) · **merge `fb61c9d9` ✅**
- **원인**: 써머리·시네마 「항공권 검색」이 위젯 무력화 이후 일정 없이 Trip.com `/tickets-` 로 떨어짐.
- **완료**: 네이티브 검색 폼 모달. 날짜를 고른 뒤에만 검색. 플래너 폼도 기본 +14/+21 없음. **main 병합**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview 홈 써머리·`/place/paris/planner`
- **QA**: 써머리 항공권 검색 → 일정 폼 · 날짜 선택 후 `/tickets-` · 날짜 없이 검색하면 달력

## 축제·여행지 숙소 매칭 — 분석 (로직 미수정)

- **질문**: 섬진강국제실험예술제(곡성) 숙소·투어가 여수로 연결되는지.
- **결론**: **오매칭**. 주변 Tour API는 좌표 기준이나 `resolveFestivalThemeCrossLinks` 는 `전남광주통합특별시` addr 파싱 실패 → 전남 시드 1번(여수) 승격.
- **산출**: [`festival-destination-matching-plan.md`](./festival-destination-matching-plan.md) · `main` docs `0e8e26c3`
- **다음**: P1 addr SSOT + P2 matcher + 스모크 fixture (제시어 플랜 §8)
