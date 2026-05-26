# 2026-05-26 프로젝트 일지 — MOONi M1 slug 해석

**직전**: [`2026-05-25-project-log.md`](2026-05-25-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md) · [AI 채팅 CTA handoff §10-A](2026-05-22-ai-chat-booking-cta-handoff.md)

---

- **MOONi M1 보완**: slug 재바인딩(자카르타 등) · 테마 발화마다 후보 칩 · MOONi FAB 재진입 시 마지막 대화 복원 · 헤더 `{여행지} · MOONi`.
- **M2 S1~S2**: `chatIntentClassifier` · `destinationBookingProfile` · `chatBookingResolver` — intent별 Trip/12Go CTA · 정보성 질문(발리 여행 소개)은 CTA 생략.
- **QA §10-C (에이전트 로컬)**: G1·G2·G5·G6(수정 후) Pass · G3·G7·G4·G8·G9·PlaceCard 링크 재검증 대기.
- **QA 중 수정**: intent·access_route bound · MOONi resume/`mooniChatEntry` · PlaceCard→`chatBookingResolver` · trip id `String` 비교.
- **§10-C 재QA (세션2)**: access_route·`resolveSessionBoundSpot`·출발/목적지 칩 · G1·G6 브라우저 Pass · G2~G4·G8 resolver Pass.
- **G5 재진입**: `mooniChatResume.js` — localStorage(userId별)+DB fetch · 메시지 SSOT `saved_trips.messages` 유지.
- **항공 CTA 라벨**: ICN→DPS SSOT(`formatChatFlightLabel`) · 저장 메시지 `refreshStoredBookingActionLabels`.
- **커밋**: (본 세션) MOONi QA 게이트 보완 2차 — 출발지 분리·재진입·항공 라벨.
- **다음**: G5·G7·G9 사용자 1회 확인 → **M3(S3~S5)** pre_travel·visa·BookingActionCards UI.
