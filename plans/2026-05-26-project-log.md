# 2026-05-26 프로젝트 일지 — MOONi M1 slug 해석

**직전**: [`2026-05-25-project-log.md`](2026-05-25-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md) · [AI 채팅 CTA handoff](2026-05-22-ai-chat-booking-cta-handoff.md)

---

- **MOONi M1 보완**: slug 재바인딩 · MOONi FAB 재진입 · 헤더 `{여행지} · MOONi`.
- **M2 S1~S2**: intent·Trip/12Go CTA · §10-C QA 사용자 확인 완료.
- **M3 S3~S4**: `chatPrepBookingLinks` · `useChatEssentialGuide` · visa·관광세·픽업 · planner `/place/:slug/planner` + ChatModal 닫기 후 이동 · 페리 단독 intent(현재 턴만).
- **제품 합의**: MOONi는 홈만이 아니라 **여행 맥락 화면** 유지 · 단일 세션 — 다음 **M4-A 노출 / M4-B Docent 통합** → S5(UI 승인) → S6 QA ([handoff §2.6](2026-05-22-ai-chat-booking-cta-handoff.md)).
- **커밋**: M3 S3~S4 및 플래너 링크·prep CTA (본 세션).
- **다음 세션**: [handoff §10-D](2026-05-22-ai-chat-booking-cta-handoff.md) — M4-A~B.
- **M4-A/B**: `/place/*` FAB 숨김 · PlaceCard MOONi 진입 · `boundSpot`·`mooniPlaceContext` · Docent→`ChatModal` 단일 세션.
- **S5**: BookingActionCards 2섹션 와이어 합의(§2.7 · 1-A·2-A·3-A·4-A) · **구현은 다음 세션** — [handoff §10-E](2026-05-22-ai-chat-booking-cta-handoff.md).
- **커밋**: M4-A/B 코드 + 문서(본 세션).
- **S5**: `BookingActionCards.jsx` 2섹션 구현 — provider A/B · §2.7.
- **S6 QA**: gili-meno MOONi — A(Trip+12Go+direct) · C · E(출발 전 준비 amber) · F(resolver) · 플래너 링크→`/place/gili-meno/planner`+채팅 닫힘 · jakarta flight-only · M4 MOONi 진입(갤러리) Pass. **G(관광세)**: 로컬 essentialGuide 없으면 CTA 없음(툴킷 데이터 의존).
- **버그 수정**: `chatBookingResolver` ferry leg — `aiReplyText` 전달·fallback `resolveFerryActions`.
- **릴리스 노트**: `2026-05-26` MOONi 예약·출발 전 준비 (`releaseNotes.js`).
- **커밋·푸시**: S5·S6·페리 fallback·릴리스 노트·문서(본 세션).
- **다음**: [handoff §10-F](2026-05-22-ai-chat-booking-cta-handoff.md) — gateo.kr G·A~J 잔여 QA · S7+ LOP.
- **기획(문서만)**: handoff **§2.8** PlaceCard MOONi 진입·드래그·크기 · **§2.9** 선택형 대화(S8) · §6 M4-C·S8 · §10-G. **코드 없음** — 다음 §10-F QA Pass 후 §10-G.
- **§10-F gateo.kr QA**: G·B·M4 **Pass** · D Fail → 패치(ferry 출발·PlaceCard slug) **커밋** · H/I 미구현 · J·G8 재QA 필요. **다음**: [handoff §10-H](2026-05-22-ai-chat-booking-cta-handoff.md).
- **커밋**: §10-F D·PlaceCard slug ferry QA 패치·문서(본 세션).
