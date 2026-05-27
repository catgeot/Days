# 2026-05-27 프로젝트 일지 — PlaceCard 연관 키워드 갤러리 왕복 버그

**직전**: [`2026-05-26-project-log.md`](2026-05-26-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

- **증상**: 장소카드 갤러리 연관 키워드 클릭 시 최초 장소 ↔ 대상 장소 URL·갤러리 무한 왕복 · `recordInteraction` view 로그 반복.
- **원인**: `cc8f63f`(2026-05-25) canonical slug 통일 — Home URL sync와 `PlaceCardExpanded` canonical URL effect가 race · 연관 클릭은 `navigate`만 호출해 stale location.
- **조치**: `navigateToPlace`(location 선행) · Home route sync `syncId`·`alreadySynced` · PlaceCardExpanded URL effect 제거 · `PlaceChatPanel` → `onNavigateToPlace`.
- **QA**: Vancouver → 노보시비르스크 연관 키워드 — 사용자 확인 Pass.
- **문서**: [`related-destinations-cross-nav-plan.md`](related-destinations-cross-nav-plan.md) §5.3.1 · 릴리스 노트 생략.
- **블레드(bled) 도착 공항**: `LJU` 미등록·toolkit-sync `ZAG` 오탐 → `rentalAirportHubs`·overrides·`generate:airports` · 사용자 QA Pass.
- **지구본 홈 복귀**: `pendingGlobeHomeFocusRef`·`goHomeFromPlace`·150ms deferred flyTo — 로컬 QA Pass · 릴리스 노트 생략.
- **쿠스코(cusco) 도착 공항**: CUZ 단독·`bannerNote` 없음 → 여정(LIM 국제선→CUZ 국내선)과 배너 불일치. `overrides`·`PLACE_ID_OVERRIDES`(쿠스코·마추픽추)·`generate:airports` · `machu-picchu`·`inca-trail` SSOT 정리.
- **PlaceCard MOONi UX**: 모바일 헤더 pill 제거 · `PlaceMooniFab` 드래그·`gateo_mooni_place_fab_pos` · scroll-top 예약 구역 clamp · 헤더 지명 탭 상단 스크롤 회귀 수정(`role=button` self-match).
