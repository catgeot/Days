# 2026-06-23 프로젝트 일지

**이전**: [`2026-06-22-project-log.md`](./2026-06-22-project-log.md)

## 항공 경로 — 영향 분석·글로벌 출발 UX 확정

**상태**: Phase 4 **v2.1 ✅** · baseline smoke **8/8** · 릴리스 노트 `2026-06-23`

### Phase 4 v2.1 — 써머리·Bar UI/UX ✅

- `FlightOriginSelector` — portal 드롭다운·44px 터치 · bar collapsed 칩 · summary GPS 인라인
- `PlaceCardSummary` — 경로·시간 미리보기 · blurb 축소 · CTA grid 2+1 · 갱신 로딩
- `FlightCinemaBar` — 목적지 헤더 · relaunch Loader2 · 경유 `aria-current`
- smoke **8/8** · build ✅ · `releaseNotes.js` `2026-06-23`

### Phase 4 v2 — 출발지 검색·내 위치 ✅

| 항목 | 구현 |
|------|------|
| UI | `FlightOriginSelector` — 써머리·Bar 공통 · IATA 칩·「더보기」제거 |
| 검색 | `flightCinemaOriginSearch.js` · `matchDepartureInText` export · last-used 유지 |
| 내 위치 | GPS → 허브 200km → index 120km · 권한 거부 UX |
| 경유 전환 | `relaunch` — 레이어 유지·Bar 낙관적 갱신 · 써머리 복귀 버그 수정 |

**QA**: 서울→ICN 선택 · 보라보라+MNL · 경유 후보 1클릭 arc 전환 ✅

---

## (아카이브) Phase 4 v2 구현·핸드오ff

**배경**: IATA 칩 → 도시·공항 검색 + 「내 위치에서 출발」.

| 항목 | 결정 |
|------|------|
| UI 배치 | **써머리·Bar 동일** — `FlightOriginSelector` |
| 검색 SSOT | `RENTAL_AIRPORT_HUBS` + `matchDepartureInText` |
| 불변 | `getTravelSpotAirportRow`·배너 · Edge topN |

- IATA 칩·Bar「더보기」→ `FlightOriginSelector` · `flightCinemaOriginSearch.js`
- 경유 `relaunch` · `onClickCapture` 검색 선택 버그 · smoke **8/8** · build ✅

---

## (아카이브) Phase 4 UX v1·초안

**다음(백로그)**: Trip `dAirportCode` Phase D · graph-direct 78 검수

### 글로벌 출발 UX v1 (v2로 대체됨)

| 항목 | 결정 |
|------|------|
| 기본 출발 | `localStorage` last-used → `Intl` timezone → ko locale ICN fallback |
| 써머리 | ~~4칩~~ → **v2 검색** |
| Bar | ~~4칩+더보기~~ → **v2 검색** · 시차 · 경유 topN=3 |

**신규**: `flightOriginPreference.js` · `smoke:flight-route-baseline` (8유형)

### baseline QA (`npm run smoke:flight-route-baseline`)

8/8 PASS — 보라보라·함피·Tahaa·Manihiki override·원격 uiPlace Edge·사이판 직항·MNL 출발·서울 no-preview

---

## (아카이브) Phase 4 UI 초안

- 출발 23칩 양쪽 노출 → **UX v1→v2로 대체**
- Edge topN · QA는 baseline smoke로 1차 완료
