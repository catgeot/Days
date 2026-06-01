# 2026-06-01 프로젝트 일지 — MOONi CTA·플래너 포커스

**직전**: [`2026-05-29-project-log.md`](2026-05-29-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md) · [handoff §2.13](2026-05-22-ai-chat-booking-cta-handoff.md)

---

- **MOONi CTA 정합**: `chatCtaPromptHint` — 턴별 실제 UI(「교통 · 티켓」「출발 전 준비」)만 프롬프트에 주입 · 「예약 · 티켓 검색」 환각 문구 금지·`mooniReplySanitizer` 후처리 · prep-only 시 `MooniPlannerFollowUp`·`BookingActionCards` 플래너 primary 버튼.
- **L2 출발 전 준비**: 비자·입국·서류 / 의료 후송·보험 / 숙소·입국 증빙 / 안전·현지 주의 — 플래너 섹션 정렬 · L2 dock 「주제 바꾸기」 옆 L1 라벨(`getMooniL1ChipLabel`).
- **intent**: `ENTRY_PROOF_PATTERNS` — 「항공 증빙」이 `book_flight`로 오탐하지 않음 · visa+fees leg 병렬 · **st-helena** 숙소·입국 증빙 칩 QA Pass.
- **플래너 포커스**: `placePlannerFocus.js` · `/place/:slug/planner#planner-prep-visa` 등 · `PlannerTab` hash 스크롤 · `routeLocation` prop 충돌 수정.
- **L2 prep 재구성(§2.14)**: 비자·입국·서류 1칩(「비자, 입국 필수 준비…」→ `#planner-prep`) · 항공권/숙소/렌터카·픽업 3칩 · `chipId` 플래너 포커스 · checklist 상시·앵커 확장 — [handoff §2.14](2026-05-22-ai-chat-booking-cta-handoff.md).
- **플래너 관리자 강제 재실행**: `PlannerTab` 하단 **Force Update Toolkit** 복구 — MOONi FAB·scroll-top에 가려지던 모바일 `pb-24` · `handleRemoteUpdate`→`update-place-toolkit` · `#planner-admin-force-update` (DB만 재조회는 상단 「저장된 데이터 새로고침」). `fe78088`
- **공항 픽업 링크**: `getKlookAirportTransferUrl` SSOT — `airport_transfer` 카드 「공항 픽업 검색」이 렌터카 홈과 동일 URL이던 버그 수정 · PreTravelChecklist·MOONi CTA와 `/ko/airport-transfers/` 통일 · st-helena QA Pass · `c4b4249` · **main push 완료** (`32c0008..c4b4249`).
- **다음**: gateo §10-F H·I 합의 · releaseNotes(본 묶음) 합의 시.
- **MOONi 칩 프롬프트**: `mooniChipPrompts.js` — L2 칩별 답변 지침·SSOT 주입 · 버뮤다 `bannerNote` overrides.
- **MOONi CTA 라벨·항공 위젯**: `getMooniPlannerCtaLabel` — 주제별 「{여행지} 항공권/숙소/교통…」 · 채팅 Trip CTA → 검색 위젯 모달(`forceModal`) · 출발=도착 IATA 가드 · [handoff §2.15](2026-05-22-ai-chat-booking-cta-handoff.md).
- **항공 위젯 데스크톱 분기**: `getTripcomFlightAdForModal` — 채팅·모달 `forceModal` 시 데스크톱 900×200(`S17104971`) · 모바일 320×480 유지 · `TripcomFlightSearchModal` 크기 prop.
- **MOONi 교통·티켓 → 플래너 항공**: Trip CTA 아래 `getMooniPlannerFlightGuideLabel` · `#planner-prep-flight` 스크롤 · `chatCtaPromptHint` 반영.
- **MOONi 렌터카·픽업 2링크**: `MooniTransportPlannerLinks` — `#planner-arrival-transfer`(또는 `#planner-rental-pickup`) + `#planner-local-transport` · `BookingActionCards`·`MooniPlannerFollowUp`.
- **문서**: handoff §2.15·`.ai-context` 갱신 — QA Pass.
