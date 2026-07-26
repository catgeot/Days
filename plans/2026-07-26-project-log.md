# 2026-07-26 프로젝트 일지

직전: [`2026-07-24-project-log.md`](./2026-07-24-project-log.md)

## 국내축제 — areaHub QA (`국내축제-areaHub-QA`)

**상태**: ✅ PASS · 코드 변경 없음 · 브랜치 `cursor/korea-festival-proxy`  
**VERIFY**: `audit:korea-area-codes` · `smoke:korea-area-codes` · `TOURAPI_SMOKE_LIVE=1 smoke:tourapi` PASS

| # | 항목 | 결과 |
|---|------|------|
| 1 | 전체 + default hub 가로 | PASS (서울·부산·제주·강릉·경주·전주·속초·여수) |
| 2 | 도 칩 → 축제·hub | PASS (전남→여수/순천/목포/담양 · 경북→경주/안동/포항 · 충북→청주) |
| 3 | 시/군 칩 | PASS (여수시 9→2건 · hub 도 기준 유지) |
| 4 | hub → `/place/:hubId` | PASS (`/place/yeosu`) |
| 5 | 상세 시트 detailIntro + hub | PASS (장소·시간·요금·주최·문의 · 시트 hub→`/place/seoul`) |
| 6 | 내 주변 | PASS (전주 GPS 스텁 → 전북·전주시 · hub 전주/군산) |
| 7 | 세종(8) | PASS (DEFAULT hub 폴백 · 빈 가로·크래시 없음) |

**메모**: 전남 addr에 `전남광주통합특별시` 표기·광주 동구/북구 일부 혼입 — TourAPI addr 노이즈. areaHub SSOT와 무관 · 이번 세션 미수정.

**다음**: S4 캐시는 **쿼터·지연 보일 때만**. 없으면 MVP(LIVE+sessionStorage) 유지. Cloud 오케·releaseNotes·국내 지도·hub 신설 금지.

**제시어 (S4 필요 시)**

```
국내축제-S4-캐시
@plans/korea-festival-hub-plan.md S4만
@plans/2026-07-26-project-log.md 「국내축제 — areaHub QA」절만
로컬. 쿼터·지연 대응 캐시만. UI 리디자인 금지.
```

## 국내축제 — S5 (`국내축제-S5-지도권역`)

**상태**: ✅ 구현 · VERIFY PASS · **사람 UI QA 대기** · 브랜치 `cursor/korea-festival-proxy`

| 산출 | |
|------|--|
| 권역 SSOT | `src/pages/Korea/data/koreaFestivalCorridors.json` · `koreaFestivalCorridors.js` |
| 시간·연간 | `festivalTimeFilter.js` · `fetchKoreaFestivalsRolling12` (sessionStorage v1) |
| 취향 | `festivalTasteTags.js` (결과 title · 건수≥2) |
| UI | `/korea` — 지금/주말/달/시즌 · 하이라이트 카드 · `KoreaFestivalMap` · 권역칩 · 결과 패널 · 도칩 제거 |
| VERIFY | `audit:korea-area-codes` · `smoke:korea-area-codes` · `TOURAPI_SMOKE_LIVE=1 smoke:tourapi` PASS |

**보류**: releaseNotes · hub 신설 · Cloud 오케 · Edge S4 · main 머지는 QA 후.

**QA 체크**

1. `/korea` 첫 화면이 전체 리스트가 아니라 카드+지도인가
2. 권역 칩에 0건이 없는가 · 대구 등 빈 행정구역 칩이 뜨지 않는가
3. 「지금」「이번 주말」필터가 기간 교집합만 보여주는가
4. 지도 클러스터 클릭 → 선택 결과 패널
5. Mapbox 토큰 없을 때 폴백(카드+권역) · 상세시트·hub 이동

**제시어 (QA)**

```
국내축제-S5-QA
@plans/korea-festival-hub-plan.md S5만
@plans/2026-07-26-project-log.md 「국내축제 — S5」절만
로컬. /korea 지도·권역·지금/주말 QA. releaseNotes 금지.
```
