# 2026-06-23 프로젝트 일지

**이전**: [`2026-06-22-project-log.md`](./2026-06-22-project-log.md)

## 항공 경로 Phase 4 UI — **초안** (UX·배포·QA 대기)

**상태**: 기능 골격만 구현 · **확정 UI 스펙 없음** — 다음 세션에서 UX 합의·정리

### 초안 범위 (코드)

| 항목 | 구현 | 비고 |
|------|------|------|
| 출발지 picker | 써머리·Bar IATA 칩 23개 | MOONi §2.12와 **별개** · 칩 수·배치 **미확정** |
| timezone 제안 | `Intl` TZ → 출발 제안 · 경도 시차 힌트 | DST 미반영 근사 |
| 경유 top-N | Edge `topN` · Bar「경유 후보」 | **Edge 재배포 전** 후보 1개만 가능 |
| 불변 | `getTravelSpotAirportRow`·배너 | 미수정 |
| audit | `audit:flight-arcs` **0** · `npm run build` ✅ | |

### 신규 파일

- `flightCinemaOriginOptions.js` · `flightCinemaTimezone.js` · `flightCinemaRouteAlternatives.js`
- Edge: `flightRouteGraph.ts` `resolveGraphFlightRouteTopN` · `resolve-flight-route` `topN` body

### 항공권·배너 세션 — 에이전트 핸드오프 (Phase 4 초안 → UX)

**C-3 ✅** · **Phase 4 = 초안** — 배너·`getTravelSpotAirportRow` 불변 유지

| 읽을 것 | 금지 | 제시어 |
|---------|------|--------|
| 본 절 · [`2026-06-22-project-log.md`](./2026-06-22-project-log.md) C-3 · `.ai-context` 6절 | `travelSpots.js` 전체 · JSON spots 직접 · C-3 재실행 | 아래 **제시어** |

**제시어 (복붙)**:

```
항공권-이어하기 @plans/2026-06-23-project-log.md

Phase 4 UX — 출발지·경유 UI 초안 정리 (Edge topN 배포·브라우저 QA 후):
· UI 스펙 합의 (써머리 vs Bar · 23칩 vs MOONi식 서울/부산/인천+더보기)
· resolve-flight-route topN 재배포
· 브라우저 QA · audit:flight-arcs 0
· 배너·getTravelSpotAirportRow 불변
```

**다음 세션 우선**

1. Edge `resolve-flight-route` **topN 재배포** (`phdjnbfitvmrguqzverm`)
2. 브라우저 QA — SSOT slug · uiPlace · override(함피) · 출발 MNL 전환
3. UX — 출발지 칩 위치·개수 · 경유 후보 표기 · timezone 힌트 노출 여부

**미결 (스펙 없었던 항목)**

- Phase 4 **와이어프레임·컴포넌트 스펙 없음** — [`flight-route-database-plan.md`](./flight-route-database-plan.md)는 「2차 경유·3차 출발」목표만
- 참고만: MOONi [`2026-05-22-ai-chat-booking-cta-handoff.md`](./2026-05-22-ai-chat-booking-cta-handoff.md) §2.12 출발 칩 패턴
