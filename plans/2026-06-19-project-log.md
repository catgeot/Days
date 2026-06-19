# 2026-06-19 프로젝트 일지

**이전**: [`2026-06-18-project-log.md`](./2026-06-18-project-log.md)

## 항공 시네마 — 플래너 여정 hub SSOT ✅

- **런타임**: `flightRouteHubIatas: []` → corridor DXB 생략·**직항** arc (`hasExplicitDirectFlightRoute`) · `generate`·`audit:flight-arcs` 반영
- **overrides + hub/waypoint** (툴킷·사용자 QA):

| slug | arc | 비고 |
|------|-----|------|
| abu-simbel | ICN→DXB→CAI→ASW | Trip·렌터카 ASW · ABS·육로는 bannerNote |
| luxor | ICN→CAI→LXR | CAI·DOH 경유는 bannerNote |
| peninsula-valdes | ICN→LAX→EZE→AEP→PMY | AEP·REL 허브 추가 |
| alaska · denali | ICN→**SEA**→ANC | LAX→SEA 허브 교정 |
| amsterdam | ICN→AMS **직항** | `flightRouteHubIatas: []` + 유럽 waypoint |

- **`audit:airports`** none:0 · **`audit:flight-arcs`** QA slugs Pass (moscow 등 기존 이슈만 잔존)
- **가이드**: [`travel-spots-management.md`](./travel-spots-management.md) §3.1 `flightRouteHubIatas: []` 직항 패턴 추가
