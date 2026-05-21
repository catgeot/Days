# 2026-05-21 프로젝트 일지 — 플래너·배너·공항·페리 SSOT

**직전**: [`2026-05-19-project-log.md`](2026-05-19-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

## 페리 SSOT 검증·UI (추가)

- **문서**: [`ferry-ssot-validation.md`](ferry-ssot-validation.md) — SSOT 33곳 전수 검증, 265곳 전수 아님, provider·검수 큐.
- **UI**: 다중 노선 compact 12Go · AI `ferry_booking.url`은 SSOT `routes` 있을 때 버튼 미노출 (`resolveAiFerryExtraBooking`).
- **감사**: `audit:ferries` — gap·medium·DF-only·공항 `bannerNote` 힌트 → `scripts/outputs/ferry-audit.json`.

---

## 배경

「렌터카 · 픽업 · 항공권 기준」배너·검색 힌트·권역 교차 링크가 **상세 여정 플래너**·항공 팁과 어긋나거나, **환승·국제선 관문**이 도착 후보로 노출되어 혼동을 유발함.

---

## 변경 요약

### 허브 추가 (`rentalAirportHubs.js`)

| IATA | 용도 |
|------|------|
| SPU | 흐바르 — 스플리트 직항·페리 |
| NGS | 나가사키 |
| MDZ | 아콩카과 — 멘도사 최종 도착 |
| (기존 CUZ·BWN 등 유지) | |

### curated IATA (`travelSpotAirports.json`)

| slug | 연동 | 비고 |
|------|------|------|
| hvar | SPU | DBV/ZAG는 귀국·bannerNote |
| nagasaki | NGS | FUK 우회 — `searchHintIatas` |
| inca-trail | CUZ | LIM 국제선 — bannerNote |
| aconcagua | MDZ | EZE/SCL — bannerNote |
| borneo | BKI·KCH | KUL 경유 제거(교차 링크·후보) |

### 런타임 (`rentalAirportMatch.js`)

- **`resolveSearchHintIataCodes`** / **`formatSearchHintIataLabel`**: 검색·렌터카·권역 칩 — linkHub 기본, `searchHintIatas` 예외.
- **`resolveBannerPeerAlternateAirports`**: 「다른 도착 후보」는 `searchHintIatas` 2+일 때만.
- 타임라인 구문 매칭: 스플리트·나가사키·멘도사·쿠스코·리마·부에노스아이레스 등.

### UI (`RentalPickupBanner.jsx`)

- 동급 후보 없으면 **단일 공항 레이아웃**(「연동 도착 공항」/「다른 도착 후보」 미표시).
- `bannerNote`는 환승·권역 혼동 안내 유지.

### 권역 (`travelSpotClusters.js`)

- `formatGatewayIataForSlug` → `formatSearchHintIataLabel` (KUL 등 경유 코드 제외).

---

## QA 예시

| 여행지 | 배너 | 검색 힌트 | 교차 링크(borneo-region) |
|--------|------|-----------|--------------------------|
| 아콩카과 | MDZ 단일 + EZE/SCL note | MDZ | — |
| 브루나이 | BWN | BWN | 보르네오 `BKI·KCH` |
| 나가사키 | NGS + 후보 FUK | NGS 또는 FUK | — |

---

## 관련 문서

- [`travel-spots-management.md`](travel-spots-management.md) §3·§4
- [`related-destinations-cross-nav-plan.md`](related-destinations-cross-nav-plan.md)
