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

**상태**: ✅ 구현 · UI 조율 중 · 브랜치 `cursor/korea-festival-proxy`

| 산출 | |
|------|--|
| 권역 SSOT | `src/pages/Korea/data/koreaFestivalCorridors.json` · `koreaFestivalCorridors.js` |
| 시간·연간 | `festivalTimeFilter.js` · `fetchKoreaFestivalsRolling12` (sessionStorage v1) |
| 취향 | `festivalTasteTags.js` (결과 title · 건수≥2) |
| UI | 좌측 세로 지도 · 개별 축제 칩(클러스터 아님) · 전체화면 · 호박색 칩 · 권역/취향 사이드 |
| VERIFY | `audit:korea-area-codes` · `smoke:korea-area-codes` · `TOURAPI_SMOKE_LIVE=1 smoke:tourapi` PASS |

**보류**: releaseNotes · hub 신설 · Cloud 오케 · Edge S4 · main 머지는 QA 후.

### UI 조율 메모 (이어하기)

- 지도 **좌측 sticky** · 개별 Marker 칩(상한 180) · **전체화면** 버튼 · Esc/X 닫기
- 칩 색: 호박 배경+어두운 글자(백색 대비 개선)
- 다음: 사람 테스트로 로드 가독성·칩 겹침·전체화면 UX 이어서 조율

**제시어 (다음 세션)**

```
국내축제-S5-QA
@plans/korea-festival-hub-plan.md S5만
@plans/2026-07-26-project-log.md 「국내축제 — S5」절만
로컬. /korea 지도 칩·전체화면·좌측 배치 QA·UI 이어가기. releaseNotes 금지.
```
