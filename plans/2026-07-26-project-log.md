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

**상태**: ✅ A QA PASS · ✅ B 색인 칩 코드 · 사람 QA 대기 · 브랜치 `cursor/korea-festival-proxy`

| 산출 | |
|------|--|
| 셸 | `/korea` 뷰포트 풀맵 · 상단 홈/시간/내주변 오버레이 |
| 지도 | cluster · leaves→리스트 · 뷰 스택 **뒤로** · X=전국 |
| 리스트 | 선택 N건 좌측(모바일 하단) · 행/점 → `FestivalDetailSheet` |
| B | 시도·시/군 색인(`festivalRegionTags`) · 테마 칩(`festivalTasteTags`) · 지도·리스트 교집합 필터 · corridor 금지 |
| 비전 | A ✅ → B ✅코드 → C 즐겨찾기 → D 도로루트(1선택) → E 시트 숙소/투어 |

**보류**: C~E · releaseNotes · hub 신설 · Edge S4 · main · **B 사람 QA**.

### 이어하기

- B QA: 시간탭 → 시도 칩 → 시/군 → 테마 → 지도·색인 리스트 · X 전국 · A 회귀
- OK 후 C 또는 톤 조율

**제시어 (다음 · B QA 후)**

```
국내축제-S5-C
@plans/korea-festival-hub-plan.md S5만
@plans/2026-07-26-project-log.md 「국내축제 — S5」절만
브랜치 cursor/korea-festival-proxy. C 즐겨찾기·본 항목. A·B 회귀 금지 범위 밖 확장 금지. releaseNotes 금지.
```
