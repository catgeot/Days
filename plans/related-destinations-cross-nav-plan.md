# 연관 여행지·세부 slug 분리 계획

**작성**: 2026-05-19  
**선행 작업(완료 전 실행 금지)**: [`destination-airport-identity-plan.md`](./destination-airport-identity-plan.md) — 공항 매칭·`place_toolkit` DB 정리(`skippedNoIata`·`unmapped` 잔여)  
**관련**: [`.ai-context.md`](../.ai-context.md) 6절 · [`travel-spots-management.md`](./travel-spots-management.md)

---

## 1. 배경

광역 여행지(파타고니아·보르네오·발리 등)는 **하나의 slug**에 여러 관문 공항·서로 다른 일정이 섞이면 배너(IATA)와 **상세 여정 플래너**가 어긋나 사용자 혼동이 큽니다.

**1차 조치(2026-05-19, 배포 대상)** — 파타고니아 권역 3-slug 역할 분리:

| slug | 범위 | 관문 IATA |
|------|------|-----------|
| `patagonia` | 아르헨티나 **북부**(바릴로체·호수·안데스) | BRC · EZE |
| `ushuaia` | 티에라델푸에고·남극 크루즈 | USH |
| `torres-del-paine` | 칠레 토레스 델 파이네 | PUQ |

이후 동일 패턴을 **데이터(SSOT) → 공항 → DB → UI(연관 탐색)** 순으로 확장합니다.

---

## 2. 목표 (TO-BE)

1. **세부 slug** — 광역·모호한 slug는 관문·일정 단위로 쪼개거나, 역할을 desc·좌표·IATA로 명확히 구분.
2. **연관 여행지 클러스터** — 같은 권역·다른 관문인 slug끼리 **양방향 링크**로 교차 탐색.
3. **플래너·장소카드 UX** — 「이 관문과 다른 파타고니아 여행지」 등 **연관 카드**를 플래너 상단(배너 아래) 또는 PlaceCard 요약/확장 영역에 노출.
4. **공항·툴킷 정합** — 클러스터 내 slug마다 curated IATA·`place_toolkit`·여정 타임라인이 **각각** 일치.

---

## 3. 선행 조건 (Gate)

아래가 충족되기 전에는 **UI(연관 탐색) 구현을 시작하지 않습니다**.

| # | 조건 | 확인 |
|---|------|------|
| G1 | `npm run audit:airports` → `none: 0` | |
| G2 | `toolkit:audit-place-id` → `duplicateSlug 0` · `geoMismatch 0` | |
| G3 | `skippedNoIata`·`unmapped` 잔여 — 우선 slug 배치 검수 완료(목표: skippedNoIata ≤20) | ✅ 12 (2026-05-19) |
| G4 | 클러스터 후보 slug마다 배너 IATA = 툴킷 `primary_arrival_airports_iata` = 여정 타임라인 (gateo.kr QA 3경로) | |

---

## 4. 데이터 모델 (안)

### 4.1 연관 클러스터 SSOT

신규 파일(안): `src/pages/Home/data/travelSpotClusters.json` (또는 `scripts/data/travel-spot-clusters.mjs`)

```json
{
  "patagonia-region": {
    "labelKo": "파타고니아 권역",
    "labelEn": "Patagonia",
    "slugs": ["patagonia", "ushuaia", "torres-del-paine"],
    "notes": "북부 BRC/EZE · 남부 USH · 칠레 PUQ — 관문이 다름"
  }
}
```

- **`slugs`**: `travelSpots.js`에 존재하는 slug만.
- **확장 후보 클러스터**: `borneo-region`(borneo·…), `bali-region`, `iceland-region`(iceland·reykjavik) 등 — 공항·DB 정리 후 단계 추가.

### 4.2 세부 slug 추가 절차 (체크리스트)

[`travel-spots-management.md`](./travel-spots-management.md) 2절 + 아래:

1. `travelSpots.js` — slug·좌표·desc(「별도 여행지」 문구) · `name_en` 구분
2. `travel-spot-airport-overrides.mjs` — curated `high` + `bannerNote`
3. `rentalAirportHubs.js` — 신규 IATA·alias(타 slug와 중복 alias 제거)
4. `travel-spot-place-id-aliases.mjs` · `TRAVEL_SPOT_TOOLKIT_SYNONYMS`
5. `regionalGatewayIatas.ts`(Edge) · `patch-place-toolkit-guide-iata.mjs`(DB)
6. `node scripts/extract-travel-spots-list.cjs` · `generate:airports` · `sync:airports-from-toolkit` · `audit:airports`
7. 클러스터 JSON에 slug 등록
8. gateo.kr QA — 지구본·한글 검색·영문 검색

### 4.3 파타고니아 후속 세부 slug (백로그)

| 후보 slug | 관문 | 비고 |
|-----------|------|------|
| `el-calafate` | FTE | 페리토 모레노·남부 아르헨티나 빙하 |
| `peninsula-valdes` | PMY | (기존 slug) PMY·BRC와 클러스터 연결만 |
| (신규 없음) | — | 북부는 현재 `patagonia`(바릴로체)로 유지 |

---

## 5. UI — 연관 여행지 교차 탐색 (Phase R)

**실행 시점**: §3 Gate 통과 후.

### 5.1 노출 위치

| 위치 | 내용 |
|------|------|
| **PlannerTab** | 공항 배너·Trip.com 배너 **아래**, 툴킷 본문 **위** — 「같은 권역 · 다른 관문」 |
| **PlaceCardSummary / Expanded** | (선택) 헤더 하단 칩 또는 1줄 링크 — 「우수아이아 · 토레스 델 파이네」 |

### 5.2 컴포넌트 (안)

- `RelatedTravelSpots.jsx` — `clusterId` 또는 현재 `slug`로 클러스터 조회 → **자기 slug 제외** · `mergeCanonicalTravelSpot` 후 `/place/:slug/planner` 링크
- 카드 1줄: 한글명 · `name_en` · **관문 IATA**( `travelSpotAirports.json` `preferredLinkIata` )
- 카피 예: 「파타고니아는 관문이 나뉩니다. 다른 관문 여행지 →」

### 5.3 동작

- 클릭 → React Router `/place/{slug}/planner` (기존 PlaceCard 전환·지구본 핀 정규화 재사용)
- SEO: 클러스터 페이지 신설 없음 — 기존 `/place/:slug` 유지
- 모바일: 가로 스크롤 칩 2~3개, `break-keep` 유지

### 5.4 구현 파일 (예상)

| 파일 | 변경 |
|------|------|
| `src/pages/Home/data/travelSpotClusters.json` | 신규 |
| `src/utils/travelSpotClusters.js` | `getClusterForSlug` · `getRelatedSpots` |
| `src/components/PlaceCard/RelatedTravelSpots.jsx` | 신규 |
| `src/components/PlaceCard/tabs/PlannerTab.jsx` | 배너 아래 `<RelatedTravelSpots location={…} />` |
| (선택) `PlaceCardSummary.jsx` | 축약 칩 |

---

## 6. 단계별 실행 (Cursor 세션 권장)

| 세션 | 내용 | 산출 |
|------|------|------|
| **R0** | Gate 확인 · 파타고니아 3-slug QA 재확인 | 체크리스트 |
| **R1** | `travelSpotClusters.json` + util · patagonia-region 1클러스터 | 데이터·단위 테스트(선택) |
| **R2** | `RelatedTravelSpots` + PlannerTab 배치 | UI · 로컬 QA |
| **R3** | borneo 등 2번째 클러스터 · PlaceCard 요약 칩(선택) | 확장 |
| **R4** | `el-calafate` 등 세부 slug 추가(제품 승인 시) | travelSpots + 공항 + 클러스터 |

---

## 7. QA 체크리스트 (클러스터·연관 UI)

- [ ] `/place/patagonia/planner` — 연관: ushuaia(USH), torres-del-paine(PUQ) 링크·IATA 표기
- [ ] `/place/ushuaia/planner` — 연관: patagonia(BRC), torres-del-paine(PUQ)
- [ ] 연관 클릭 후 플래너·배너 IATA가 **대상 slug** 기준으로 전환
- [ ] `audit:airports` `none: 0` 회귀 없음

---

## 8. 진행 상태

| 항목 | 상태 |
|------|------|
| 파타고니아 3-slug 역할 분리·BRC/EZE | ✅ 2026-05-19 |
| `travelSpotClusters.json` | ✅ patagonia·iceland 2클러스터 |
| PlannerTab 연관 UI | ✅ R2 (배포 대기) |
| el-calafate 등 세부 slug | ⬜ 백로그 |

*완료 시 [`2026-05-19-project-log.md`](./2026-05-19-project-log.md) · [`.ai-context.md`](../.ai-context.md) 6절만 갱신.*
