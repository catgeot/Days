# `plans/` 폴더

## 지금 쓰는 것

- **프로젝트 컨텍스트(매 세션 권장)**: 루트의 [`.ai-context.md`](../.ai-context.md)
- **로직=feature · 문서=main (Cloud 필수)**: [`docs-on-main-workflow.md`](./docs-on-main-workflow.md) · §1.5.4 · **Plan 아티팩트 → `plans/` main 반영** [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) §1.3
- **Cloud 이어하기 · Preview 연속성**: [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) · [`AGENTS.md`](../AGENTS.md) Cloud (세션 표기·**§1.2 제시어 핀 3개**·**§1.3 다세션 플랜=표준 제시어 필수**·고정 Preview·작업 로그)
- **열린 feature main 핸드오프**: [`feature-handoff-index.md`](./feature-handoff-index.md) — 브랜치·PR·다음 제시어 복붙표
- **오케스트레이터 (다배치 SSOT)**: [`orchestrator-method.md`](./orchestrator-method.md) · 제시어 `오케스트레이터`
- **명소 hub 사전 큐**: [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md) (R48–R61 **소진** · tip 550 hub)
- **GATEO 선정 명소 권역 보강 큐 ✅ 소진 (main #108)**: [`korea-scenic-hub-fill-queue.md`](./korea-scenic-hub-fill-queue.md) · 잔여 TODO = Tour contentId(~75) · `fill:korea-scenic-spot-content-ids`
- **여행지·도착 공항 운영**: [`travel-spots-management.md`](./travel-spots-management.md) (추가·헬스체크·공항 매핑)
- **항공 경로 DB (우선)**: [`flight-route-database-plan.md`](./flight-route-database-plan.md) · **Heuristic SSOT (다음)**: [`flight-route-heuristic-ssot-plan.md`](./flight-route-heuristic-ssot-plan.md) · **비-ICN 라우팅**: [`flight-route-non-icn-routing-plan.md`](./flight-route-non-icn-routing-plan.md) (OurAirports·Supabase · **Phase 0~4 v2.2 ✅** · **Heuristic+GATN seed ⏳**)
- **사이트 점검·헬스 모니터링**: [`site-health-monitoring-plan.md`](./site-health-monitoring-plan.md) (스모크·E2E·Billing 알림·구현 Phase 0~3)
- **TourAPI 국내 관광 (3단계 ⏳ · 시드40·v1.7 · UI/릴리스 합의)**: [`tourapi-edge-proxy-plan.md`](./tourapi-edge-proxy-plan.md) · 제시어 `TourAPI-이어하기` · 일지 핸드오프
- **국내 축제·지역 허브 `/korea` (리스트 우선 · tip `d32894e`)** : [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) · 일지 `2026-07-29`
- **세계 행사·축제 일정 연동 (P2 MVP · main 병합 PR #150)** : [`world-events-plan.md`](./world-events-plan.md) · 상세 UX **Wave 1.5** [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) Phase F-0.5 · Q&A [`world-events-qa-index.md`](./world-events-qa-index.md) · 운영 [`world-events-management.md`](./world-events-management.md) · **#23 D1** 대기
- **한국의 명승 · 축제 투톱 ✅ main** (`/korea` + `/korea/theme/scenic` · PR [#58](https://github.com/catgeot/Days/pull/58) MERGED): [`korea-theme-travel-plan.md`](./korea-theme-travel-plan.md) · 일지 `2026-08-07` #63 · 다음 폴리시·릴리스
- **명소 세권(중분류) 칩 방안**: [`korea-scenic-mid-cluster-plan.md`](./korea-scenic-mid-cluster-plan.md) · **경기=동서남북 4세권 합의** · 타 시도·UI 대기 · 일지 `2026-08-09` #111
- **해안·해양 탐색 (플랜+SSOT Phase 1–2 ✅)**: [`coast-sea-explore-plan.md`](./coast-sea-explore-plan.md) · `seaBasins`/`travelSpotCoast` · `audit:sea-basins` · 일지 `2026-08-16`  
- **국내 MRT 읍·면 감사·city=리 군선두 ✅**: [`mrt-stay-admin-gap-audit-plan.md`](./mrt-stay-admin-gap-audit-plan.md) §5.1–§5.2 · `npm run audit:mrt-stay-admin-gaps` · RISK **0** · keyword 군 선두
- **동명 리/읍/면/동·bare 화이트리스트 검색 다후보 ✅**: [`ko-homonym-ri-search-disambiguation-plan.md`](./ko-homonym-ri-search-disambiguation-plan.md) · [`ko-homonym-search-expand-plan.md`](./ko-homonym-search-expand-plan.md) · PR [#37](https://github.com/catgeot/Days/pull/37) MERGED · `smoke:ko-homonym-ri-search`
- **국내 명소 tip 좌표 TourAPI 보정 (다음 세션)**: [`city-attraction-tourapi-coord-plan.md`](./city-attraction-tourapi-coord-plan.md) · 제시어 `TourAPI-명소좌표-이어하기`
- **국내 MRT TNA 인근 (Phase 4 ✅ · C표 32)**: [`mrt-tna-nearby-expand-plan.md`](./mrt-tna-nearby-expand-plan.md) · 일지 `2026-07-30`
- **블로그 AI 큐레이션 인페이지 허브 (Phase B+C tip · Preview QA)**: [`blog-ai-curation-page-plan.md`](./blog-ai-curation-page-plan.md) · 제시어 `큐레이션-이어하기` · 일지 `2026-07-31`
- **한·영 검색 노출 (외부 SEO)**: [`en-seo-followup-plan.md`](./en-seo-followup-plan.md) · 세션 `검색노출 #{N}` · [`feature-handoff-index.md`](./feature-handoff-index.md)
- **일별 작업 로그**: `YYYY-MM-DD-project-log.md`  
  - 최신: [`2026-09-03-project-log.md`](./2026-09-03-project-log.md) · 직전 [`2026-09-02-project-log.md`](./2026-09-02-project-log.md)  
- **해안·해양 탐색 칩 (플랜+SSOT)**: [`coast-sea-explore-plan.md`](./coast-sea-explore-plan.md) · Phase 1–2 ✅ · `audit:sea-basins` · 일지 `2026-08-16`


  - **홈 지구본 풍부화 계획**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md)
  - **AI 채팅 예약 CTA Phase 2 handoff**: [`2026-05-22-ai-chat-booking-cta-handoff.md`](./2026-05-22-ai-chat-booking-cta-handoff.md)
  - 새로운 날 작업이면 `plans/` **루트**에 **새** 파일로 추가하면 됩니다.
- **slug-first DB 마이그레이션 (완료)**: [`2026-05-21-slug-first-migration-handoff.md`](./2026-05-21-slug-first-migration-handoff.md) — Wave 0~S5 완료 · apply 리포트·검증 체크리스트

## 2026-04까지의 문서 (아카이브)

2026-04-26 정리: 루트에 흩어져 있던 **일지·기획·가이드·JSON**은 한곳에 모았습니다.

- [`archive/legacy-2026-04-root/`](./archive/legacy-2026-04-root/) — `2026-04-*.md` 프로젝트 로그, triplink/phase/클릭·지도·SEO 등 **기획·분석** 문서, `phase2-*.json`  
- [`archive/`](./archive/) — 기존 세션/글로브/툴킷 등 **하위 주제** 아카이브 (그대로 유지)

상세 **히스토리·의사결정**이 필요하면 위 폴더를 검색하거나 `git log`를 쓰면 됩니다. AI·사람 모두, **최우선 맥락**은 [`.ai-context.md`](../.ai-context.md)에만 맞추는 것이 토큰·유지보수에 유리합니다.
