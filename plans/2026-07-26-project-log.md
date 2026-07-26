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

**상태**: ✅ 클러스터·권역제거 커밋 · 비전 A~E 합의 · 다음=A 셸 · 브랜치 `cursor/korea-festival-proxy`

| 산출 | |
|------|--|
| 지도 | `KoreaFestivalMap` GeoJSON cluster · expansion zoom · 전체화면 |
| 필터 | 시간→취향 · 권역 칩 제거 · 내 주변 80km+flyTo |
| 좌표 | `festivalLngLat` (corridor SSOT 잔존·UI 미노출) |
| 비전 | A 풀맵셸 → B 색인칩 → C 즐겨찾기 → D 도로루트(1선택) → E 시트 숙소/투어 |

**보류**: A~E 미구현분 · releaseNotes · hub 신설 · Cloud 오케 · Edge S4 · main.

### 이어하기

- 다음 구현: **A만** — 전체화면 지도 · 상단 시간/내주변 · 선택 N→좌측 리스트 · 시트
- B~E·축제로드·숙소 마커 금지(이번 세션)

**제시어 (다음 세션)**

```
국내축제-S5-QA
@plans/korea-festival-hub-plan.md S5만
@plans/2026-07-26-project-log.md 「국내축제 — S5」절만
로컬. /korea 전체화면 지도 셸(A) 구현. B~E 금지. releaseNotes 금지.
```
