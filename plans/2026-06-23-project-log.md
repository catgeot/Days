# 2026-06-23 프로젝트 일지

**이전**: [`2026-06-22-project-log.md`](./2026-06-22-project-log.md)

## 항공 경로 — 영향 분석·글로벌 출발 UX 확정

**상태**: Phase 4 초안 → **UX v1** · baseline smoke **8/8** · `audit:flight-arcs` **0** · Edge topN 배포 대기/실행

### 파이프라인 영향 (합의 SSOT)

| 영역 | SSOT | C-3~Phase3 영향 | Phase 4 UX |
|------|------|-----------------|------------|
| 플래너 배너·렌터카·픽업 | `getTravelSpotAirportRow` | **없음** | **없음** |
| Trip `dAirportCode` | 동일 | **없음** | 시네마 Bar 플래너 링크만 (Trip 연동 **Phase D**) |
| 시네마 arc/Bar | `getFlightRouteAirportRow` + Edge gate | uiPlace 50km 밖·비-ICN → Edge | 출발 picker·topN |
| 동기 graph | `graphFlightRouteHubIatas` (193 slug) | precompute merge | Edge 트리거 시 null |

**prod vs local (2026-06-23)**: Phase 4 초안 `00df674` · UX v1 본 세션 · Edge `topN` **배포 ✅** — prod smoke ICN→BOB `alternatives: 3`

### 글로벌 출발 UX v1 (확정)

| 항목 | 결정 |
|------|------|
| 기본 출발 | `localStorage` last-used → `Intl` timezone → ko locale ICN fallback |
| 써머리 | ICN/GMP/PUS/CJU 4칩 + timezone 제안 링크 · 시차 힌트 **Bar만** |
| Bar | 4칩 + 「더보기」19 허브 · 시차(경도 근사) · 경유 topN=3 |
| geolocation | **Phase B2** — opt-in 「내 위치」버튼 (미구현) |
| Trip 연동 | **Phase D** — 시네마 출발 → `dAirportCode` (다음) |

**신규**: `flightOriginPreference.js` · `smoke:flight-route-baseline` (8유형)

### baseline QA (`npm run smoke:flight-route-baseline`)

8/8 PASS — 보라보라·함피·Tahaa·Manihiki override·원격 uiPlace Edge·사이판 직항·MNL 출발·서울 no-preview

### 항공권·배너 세션 — 핸드오프

| 읽을 것 | 금지 |
|---------|------|
| 본 절 · [`flight-route-database-plan.md`](./flight-route-database-plan.md) Phase D·5 | `travelSpots.js` 전체 · JSON spots 직접 |

**다음**: Edge topN prod smoke · Trip `dAirportCode` 연동 · geolocation opt-in · graph-direct 78건 검수(병행 가능)

---

## (아카이브) Phase 4 UI 초안

- 출발 23칩 양쪽 노출 → **UX v1로 대체** (위 절)
- Edge topN · QA는 본 세션 baseline smoke로 1차 완료
