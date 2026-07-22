# `plans/` 폴더

## 지금 쓰는 것

- **프로젝트 컨텍스트(매 세션 권장)**: 루트의 [`.ai-context.md`](../.ai-context.md)
- **오케스트레이터 (다배치 SSOT)**: [`orchestrator-method.md`](./orchestrator-method.md) · 제시어 `오케스트레이터`
- **명소 hub 사전 큐**: [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md) (R48~ · 워커A5+B5)
- **여행지·도착 공항 운영**: [`travel-spots-management.md`](./travel-spots-management.md) (추가·헬스체크·공항 매핑)
- **항공 경로 DB (우선)**: [`flight-route-database-plan.md`](./flight-route-database-plan.md) · **Heuristic SSOT (다음)**: [`flight-route-heuristic-ssot-plan.md`](./flight-route-heuristic-ssot-plan.md) · **비-ICN 라우팅**: [`flight-route-non-icn-routing-plan.md`](./flight-route-non-icn-routing-plan.md) (OurAirports·Supabase · **Phase 0~4 v2.2 ✅** · **Heuristic+GATN seed ⏳**)
- **사이트 점검·헬스 모니터링**: [`site-health-monitoring-plan.md`](./site-health-monitoring-plan.md) (스모크·E2E·Billing 알림·구현 Phase 0~3)
- **일별 작업 로그**: `YYYY-MM-DD-project-log.md`  
  - 최신: [`2026-07-23-project-log.md`](./2026-07-23-project-log.md) · 직전 [`2026-07-22-project-log.md`](./2026-07-22-project-log.md)  
  - **홈 지구본 풍부화 계획**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md)
  - **AI 채팅 예약 CTA Phase 2 handoff**: [`2026-05-22-ai-chat-booking-cta-handoff.md`](./2026-05-22-ai-chat-booking-cta-handoff.md)
  - 새로운 날 작업이면 `plans/` **루트**에 **새** 파일로 추가하면 됩니다.
- **slug-first DB 마이그레이션 (완료)**: [`2026-05-21-slug-first-migration-handoff.md`](./2026-05-21-slug-first-migration-handoff.md) — Wave 0~S5 완료 · apply 리포트·검증 체크리스트

## 2026-04까지의 문서 (아카이브)

2026-04-26 정리: 루트에 흩어져 있던 **일지·기획·가이드·JSON**은 한곳에 모았습니다.

- [`archive/legacy-2026-04-root/`](./archive/legacy-2026-04-root/) — `2026-04-*.md` 프로젝트 로그, triplink/phase/클릭·지도·SEO 등 **기획·분석** 문서, `phase2-*.json`  
- [`archive/`](./archive/) — 기존 세션/글로브/툴킷 등 **하위 주제** 아카이브 (그대로 유지)

상세 **히스토리·의사결정**이 필요하면 위 폴더를 검색하거나 `git log`를 쓰면 됩니다. AI·사람 모두, **최우선 맥락**은 [`.ai-context.md`](../.ai-context.md)에만 맞추는 것이 토큰·유지보수에 유리합니다.
