# 국내 역·랜드마크 숙소 매핑 및 인근 추천 계획 (2026-09-15)

**문서 위치**: `plans/korea-station-stay-plan.md`  
**맥락**: [`.ai-context.md`](../.ai-context.md) · [`plans/feature-handoff-index.md`](./feature-handoff-index.md) · [`plans/docs-on-main-workflow.md`](./docs-on-main-workflow.md)  
**배경**: 
1. 사용자가 `종각역` 근처 모임 참석차 숙소를 찾을 때, 단순 시 단위(`서울`) 매칭으로 인해 서울 전역(강남·용산·송파 등)의 호텔이 섞여 노출되어 도보/인근 숙소 탐색에 한계가 발생.
2. `종각`처럼 역명을 줄여 검색할 때 대구 국채보상공원 달구벌대종 '종각' 광장으로 지오코딩되어 대구 호텔(브라운도트 봉덕점 등)이 노출되는 오탐 발생.
3. 이를 해결하고 gateo.kr만의 독자적인 위치·숙소 탐색 자산으로 내재화하기 위한 4단계 이행 계획.

---

## 1. 현황 및 핵심 병목 분석

| 구분 | 네이버 지도 / 야놀자 | gateo.kr 현황 | 목표 지향점 (gateo 자산) |
|---|---|---|---|
| **검색어 처리** | `종각`, `종각역` 모두 수도권 1호선 종각역 최우선 매칭 | `종각역`은 서울 인식 성공, `종각`은 대구 공원 광장 오탐 | 역·랜드마크 약칭 및 station 유형 복합 가산으로 정확한 POI 중심점 포착 |
| **숙소 매칭 권역** | 반경 500m~1km 필터 | 마이리얼트립 `CITY: 서울` (4,563건 광역 노출) | `NEIGHBORHOOD: 종로` (632건) 우선 매칭 + 자치구/생활권 래더 |
| **정렬 기준** | 역 중심 도보/직선거리 순 정렬 | 제휴사 추천순 / 가격순 (거리 무관) | 검색 중심점 기준 Haversine 직선거리 계산 및 인접 숙소 우선 정렬 |
| **상황별 대안** | 지도 핀 기반 자체 예약 | OTA 카드 단일 노출 | 상세 지도 비교를 위한 네이버 지도 / 아고다 맵뷰 딥링크 칩 제공 |

---

## 2. 4단계(Phase) 세부 실행 계획

### [Phase 1] 지오코딩 정밀화 및 역·번화가 약칭 사전 보강 (P0)
- **목표**: `종각`처럼 `~역`이 생략된 검색어 입력 시에도 철도/지하철역 POI가 일반 광장·지명보다 높은 우선순위로 매칭되도록 보장.
- **대상 파일**:
  - `src/pages/Home/lib/geocoding.js`
  - `src/utils/mrtStayQuery.js`
- **구체적 구현**:
  1. `isPlausibleForwardHit` & `calculatePlaceScore`:
     - 결과의 `type === 'station' || type === 'subway' || type === 'halt' || type === 'tram_stop'` 또는 `class === 'railway'`인 경우, 검색어 끝이 `역`이 아니더라도 후보 이름(`result.name`)과 검색어가 정확히 일치하면 점수 가산(+60).
     - 동명 광장(`class === 'place' && type === 'square'`)보다 대중교통 거점 역사를 우선.
  2. 주요 번화가/역 약칭(`종각`, `강남`, `홍대`, `신촌`, `여의도`, `을지로` 등)을 `isMrtStayPointLabel` 및 래더 사전으로 지원.

### [Phase 2] 서울 및 대도시 세부 자치구·생활권(NEIGHBORHOOD) 래더 연계 (P0)
- **목표**: 서울 전역(4,500건)으로 분산되지 않고, 종각역의 경우 종로/인사동/광화문 인근 숙소(632건)가 바로 노출되도록 개선.
- **대상 파일**:
  - `src/utils/mrtStayQuery.js`
  - `supabase/functions/fetch-mrt-stays/index.ts`
- **검증된 마이리얼트립 NEIGHBORHOOD ID**:
  - 종로: `regionId: 14133` (632건 — 서머셋팰리스 서울, 신라스테이 광화문, 나인트리 인사동 등)
  - 중구: `regionId: 41112` (716건)
  - 강남: `regionId: 41115` (354건)
  - 마포: `regionId: 14135` (329건)
  - 해운대: `regionId: 43106` (845건)
- **구체적 구현**:
  - `resolveMrtStayQuery`에서 `stayAdmin.district`('종로구')가 존재할 경우:
    - 축약형('종로')을 키워드 래더에서 상위 시(`서울`)보다 **앞선 1차 키워드**로 공급.
    - 래더: `종로` -> `종각역` -> `서울`.
    - MRT가 `종로` NEIGHBORHOOD를 우선 매칭하여 도보/인근 호텔이 상단에 배치됨.

### [Phase 3] 좌표 기반 반경 거리(Haversine) 계산 및 인접도 뱃지 노출 (P1)
- **목표**: 검색 중심점(예: 종각역 위도 37.5701, 경도 126.9829)으로부터 각 호텔까지의 실제 거리를 표기하고, 인접 숙소를 우선 배치.
- **대상 파일**:
  - `src/utils/fetchMrtStays.js`
  - `src/pages/Home/components/GlobeStayStrip.jsx`
- **구체적 구현**:
  1. API 응답의 호텔 위/경도(또는 상세 주소 역지오)를 기반으로 중심점과의 거리(km) 산출.
  2. 숙소 카드 뱃지에 `종각역 350m`, `종각역 1.1km` 등 거리 안내 표기.
  3. 기본 정렬 모드에 거리 가중치(추천순 + 거리 페널티) 적용.

### [Phase 4] 네이버 지도 / 아고다 맵뷰 포털 비교 딥링크 (P1)
- **목표**: 특정 역 근처 초정밀 탐색을 원하는 사용자에게 이탈이 아닌 유용한 부가 기능 제공.
- **대상 파일**:
  - `src/pages/Home/components/GlobeStayStrip.jsx`
- **구체적 구현**:
  - 숙소 목록 하단 또는 툴바에 `[네이버 지도에서 주변 숙소 보기]` 딥링크 칩 배치.
  - 검색 위치의 좌표 및 키워드를 전달하여 사용자가 즉시 상세 지도를 열 수 있도록 보조.

---

## 3. 세션 분할 계획

| 세션 | 주제 | 단계 | 브랜치 | 주요 작업 |
|---|---|---|---|---|
| **#1** | `종각역 숙소 #1` | 역 POI 시·군 선두 | `cursor/jonggak-stay-5f4f` | 0건 방지, 서울 CITY 매칭 (완료 ✅) |
| **#2** | `종각역 숙소 #2` | 서울 좌표·서울 CITY | `cursor/jonggak-stay-5f4f` | 원주 오탐 수정, 철도역 허용 (완료 ✅) |
| **#3** | `종각역 숙소 #3` | Preview OK면 PR 병합 | `cursor/jonggak-stay-5f4f` | 1단계 PR [#260](https://github.com/catgeot/Days/pull/260) 병합 및 종합 계획 수립 (완료 ✅) |
| **#4** | `종각역 숙소 #4` | 종각 약칭 지오코딩 및 종로 권역 매핑 | `cursor/jonggak-stay-5f4f` | [Phase 1 + 2] `종각`→종각역 · 래더 `종로` 선두 · PR [#263](https://github.com/catgeot/Days/pull/263) (사람 Preview) |
| **#5** | `종각역 숙소 #5` | 거리 정렬 및 지도 딥링크 | `cursor/jonggak-stay-5f4f` | [Phase 3 + 4] Haversine 거리 표기 + 네이버 지도 인근 숙소 칩 |

---

## 9. 에이전트 핸드오프

### 다음 세션 제시어

```
종각역 숙소 #5, 거리 정렬 및 지도 딥링크
@plans/feature-handoff-index.md
@plans/2026-09-15-project-log.md
@plans/korea-station-stay-plan.md
브랜치 cursor/jonggak-stay-5f4f · PR #263 · Preview /
금지: UI 리디자인 · feature에 plans/** 커밋 · 검증 없이 main push
작업: Preview에서 종각이 서울 종각역이고 숙소가 종로·광화문이면 Phase 3+4 — 종각역 좌표 거리 표기 + 네이버 지도 인근 숙소 칩. 서울 광역이면 Edge fetch-mrt-stays 배포 후 재확인
검증: npm run smoke:mrt-stay PASS · vite build PASS
```
