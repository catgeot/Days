# 2026-05-27 프로젝트 일지 — PlaceCard 연관 키워드 갤러리 왕복 버그

**직전**: [`2026-05-26-project-log.md`](2026-05-26-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

- **증상**: 장소카드 갤러리 연관 키워드 클릭 시 최초 장소 ↔ 대상 장소 URL·갤러리 무한 왕복 · `recordInteraction` view 로그 반복.
- **원인**: `cc8f63f`(2026-05-25) canonical slug 통일 — Home URL sync와 `PlaceCardExpanded` canonical URL effect가 race · 연관 클릭은 `navigate`만 호출해 stale location.
- **조치**: `navigateToPlace`(location 선행) · Home route sync `syncId`·`alreadySynced` · PlaceCardExpanded URL effect 제거 · `PlaceChatPanel` → `onNavigateToPlace`.
- **QA**: Vancouver → 노보시비르스크 연관 키워드 — 사용자 확인 Pass.
- **문서**: [`related-destinations-cross-nav-plan.md`](related-destinations-cross-nav-plan.md) §5.3.1 · 릴리스 노트 생략.
- **블레드(bled) 도착 공항**: `LJU` 미등록·toolkit-sync `ZAG` 오탐 → `rentalAirportHubs`·overrides·`generate:airports` · 사용자 QA Pass.
- **지구본 홈 복귀**: `/place/`→`/` 일반 진입 Pass · **연관 키워드 점프 후 홈**은 최초 여행지로 포커스 회귀 — `lastGlobeFocusRef`·`prevPath` slug 우선 수정 착수 · **다음 세션 QA**.
