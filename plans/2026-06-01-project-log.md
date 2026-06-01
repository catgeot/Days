# 2026-06-01 프로젝트 일지 — MOONi CTA·플래너 포커스

**직전**: [`2026-05-29-project-log.md`](2026-05-29-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md) · [handoff §2.13](2026-05-22-ai-chat-booking-cta-handoff.md)

---

- **MOONi CTA 정합**: `chatCtaPromptHint` — 턴별 실제 UI(「교통 · 티켓」「출발 전 준비」)만 프롬프트에 주입 · 「예약 · 티켓 검색」 환각 문구 금지·`mooniReplySanitizer` 후처리 · prep-only 시 `MooniPlannerFollowUp`·`BookingActionCards` 플래너 primary 버튼.
- **L2 출발 전 준비**: 비자·입국·서류 / 의료 후송·보험 / 숙소·입국 증빙 / 안전·현지 주의 — 플래너 섹션 정렬 · L2 dock 「주제 바꾸기」 옆 L1 라벨(`getMooniL1ChipLabel`).
- **intent**: `ENTRY_PROOF_PATTERNS` — 「항공 증빙」이 `book_flight`로 오탐하지 않음 · visa+fees leg 병렬 · **st-helena** 숙소·입국 증빙 칩 QA Pass.
- **플래너 포커스**: `placePlannerFocus.js` · `/place/:slug/planner#planner-prep-visa` 등 · `PlannerTab` hash 스크롤 · `routeLocation` prop 충돌 수정.
- **다음**: gateo §10-F H·I 합의 · releaseNotes(본 묶음) 합의 시.
