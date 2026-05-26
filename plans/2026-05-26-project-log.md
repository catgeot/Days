# 2026-05-26 프로젝트 일지 — MOONi M1 slug 해석

**직전**: [`2026-05-25-project-log.md`](2026-05-25-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md) · [AI 채팅 CTA handoff §10-A](2026-05-22-ai-chat-booking-cta-handoff.md)

---

- **MOONi M1 보완**: slug 재바인딩(자카르타 등) · 테마 발화마다 후보 칩 · MOONi FAB 재진입 시 마지막 대화 복원 · 헤더 `{여행지} · MOONi`.
- **M2 S1~S2**: `chatIntentClassifier` · `destinationBookingProfile` · `chatBookingResolver` — intent별 Trip/12Go CTA · 정보성 질문(발리 여행 소개)은 CTA 생략.
- **QA §10-C (에이전트 로컬)**: G1·G2·G5·G6(수정 후) Pass · G3·G7·G4·G8·G9·PlaceCard 링크 재검증 대기.
- **QA 중 수정**: intent·access_route bound · MOONi resume/`mooniChatEntry` · PlaceCard→`chatBookingResolver` · trip id `String` 비교.
- **다음 세션**: 「서울에서 어떻게 가?」→ trip `destination`·PlaceCard URL이 서울로 남는 현상(항공 CTA는 ICN→DPS 정상) · 칩 UI(출발지/PlaceCard 라벨) 개선 후 G1~G9 재QA → M3.
