# 출발지 Metro Gateway 승격 계획

**작성**: 2026-06-29  
**상태**: **계획·handoff ✅** · 구현 **다음 세션**  
**배경**: GPS「현재 위치」→ 최근접 rental 허브만 선택 → 서울 **GMP**·상하이 **SHA** 등 국내·단거리 공항이 장거리 국제 경로 출발지로 잡힘  
**관련**: [`flight-route-non-icn-routing-plan.md`](./flight-route-non-icn-routing-plan.md) · 일지 [`2026-06-29-project-log.md`](./2026-06-29-project-log.md)

---

## 문제·목표

| 케이스 | 현재 | 목표 |
|--------|------|------|
| 서울 GPS | **GMP** → Edge graph → 파리 `GMP~PEK~CPH~CDG` | **ICN** → `explicitDirect` · ICN~CDG |
| 상하이 GPS | **SHA** (홍차오) | **PVG** (푸둥) |
| 보홀 GPS | **TAG** → TAG~MNL~… | **유지** — MNL 경유 OK |

**범위**: [`resolveOriginFromGeolocation`](src/pages/Home/lib/flightCinemaOriginSearch.js) 자동 선택만. Bar 검색·수동 GMP/SHA 선택 유지.

**근본 원인**: `findNearestRentalHub`는 거리만 비교. [`seoul`](scripts/data/travel-spot-airport-overrides.mjs) / [`shanghai`](scripts/data/travel-spot-airport-overrides.mjs)의 `preferredLinkIata`는 시네마 GPS가 읽지 않음.

---

## 설계

### SSOT — 신규 [`flightOriginMetroGateways.js`](src/pages/Home/lib/flightOriginMetroGateways.js)

```javascript
export const FLIGHT_ORIGIN_METRO_GATEWAYS = [
  { gatewayIata: 'ICN', feederIatas: ['GMP'] },
  { gatewayIata: 'PVG', feederIatas: ['SHA'] },
];

export function promoteFlightOriginGateway(feederIata, lat, lng, hubs = RENTAL_AIRPORT_HUBS) { ... }
```

**승격 조건**

1. 선택된 IATA가 그룹 `feederIatas`에 포함
2. `(lat, lng)`가 feeder·gateway **둘 다** 해당 허브 `radiusKm` 내
3. → gateway 반환 · 아니면 null

**1차 제외**: TAG→MNL(보홀) · 66개 low-outbound feeder 일괄 승격

### 연동

[`flightCinemaOriginSearch.js`](src/pages/Home/lib/flightCinemaOriginSearch.js) — hub 선택 직후 `promoteFlightOriginGateway` 후처리만. `findNearestRentalHub` 본문 변경 없음.

**경로 로직·Edge deploy**: 1차 변경 없음. ICN/PVG 선택 시 기존 `explicitDirect`·override로 자동 해소.

---

## 구현 체크리스트 (세션 1)

1. `flightOriginMetroGateways.js` + unit 로직
2. `flightCinemaOriginSearch.js` geolocation 후처리
3. `scripts/smoke-flight-origin-gateway.mjs` + `npm run smoke:flight-origin-gateway`
4. `npm run smoke:flight-route-baseline` — **13/13** 회귀

| smoke id | 좌표 | expect |
|----------|------|--------|
| `seoul-myeongdong` | 37.56, 126.99 | GMP nearest → **ICN** |
| `seoul-incheon-airport` | 37.46, 126.44 | ICN · 승격 없음 |
| `shanghai-bund` | 31.24, 121.50 | SHA nearest → **PVG** |
| `bohol-tagbilaran` | 9.66, 123.85 | TAG · 승격 없음 |
| `cebu-city` | 10.32, 123.89 | CEB · 승격 없음 |

---

## 세션 2 (선택)

- 브라우저 GPS QA: 서울→파리 ICN, 상하이 PVG, 보홀 TAG~MNL
- GMP 수동 선택 회귀 메모
- 릴리스 노트 초안(합의 후)

---

## 리스크

- 김포 공항 현장 GPS도 ICN 승격 — GMP 출발은 수동 선택
- 수동 GMP/SHA + 장거리 목적지 오표시 — F(tooltip) 후속

**예상 diff**: ~120줄 · Edge deploy **불필요**
