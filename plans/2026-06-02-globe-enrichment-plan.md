# 홈 지구본 풍부화 마스터 계획 (2026-06-02)

**맥락**: [`.ai-context.md`](../.ai-context.md) · **일지**: [`2026-06-02-project-log.md`](2026-06-02-project-log.md)

---

## 목표 (4+2)

| # | 기능 | 상태 |
|---|------|------|
| **0-A** | 마커·지명 통합 (GeoJSON, jitter 제거) | **완료** |
| **0-B** | 지구본 지명 한글화 | **완료** |
| **1** | 3D 투어 (Summary 버튼 → 랜드마크 항공샷) | 대기 |
| **2** | 탐색 내비 (구글 지도형) | 대기 |
| **3** | 클러스터 경계·명소 POI | 대기 |
| **4** | 숙소 탐색 (MRT 시험 → 플래너 연동) | 장기 |

---

## Phase 0 구현 SSOT (완료)

| 파일 | 역할 |
|------|------|
| [`globeMarkerLayers.js`](../src/pages/Home/lib/globeMarkerLayers.js) | GeoJSON source · dot/label/active-ring 레이어 · hit-test |
| [`globeZoomPolicy.js`](../src/pages/Home/lib/globeZoomPolicy.js) | zoom tier · merge/collision 임계값 |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | 레이어 bootstrap · 한글 지명 분기 |

**한글 지명 분기**

- `globeTheme === 'bright'` (Mapbox Standard): `MapboxLanguage` + `setConfigProperty('basemap','language','ko')`
- `deep` / `neon` (satellite-streets): place-label `text-field` → `coalesce(name_ko, name_kr, name:ko, name)`

**선택(active) 마커**: dot·label 유지 + `gateo-spots-active` 반투명 링 (HTML pin 대체 아님).

---

## Phase 1~4 진행 원칙

1. **한 커밋 = 한 검증 가능 단위** — Gate QA 통과 후 다음 커밋.
2. **3D 투어는 flyTo-only 금지** — 투어 버튼 시에만 terrain·pitch ON, `idle` 후 키프레임 ([`PlaceMiniMap.jsx`](../src/components/PlaceCard/common/PlaceMiniMap.jsx) 참고).
3. **일괄 WIP merge 금지** — 이전 `globeTourEngine` 일괄 통합은 폐기.

### Phase 1 로드맵 (다음)

1. `globeMode` 상태 머신 스켈레톤
2. `globe3dBootstrap` — on-demand DEM
3. `globeLandmarks.json` POC 5~8 slug
4. `globeTourTemplates.js` 키프레임 베이스
5. `globeTourEngine` — 3D ready 후 실행
6. `PlaceCardSummary` 「3D 투어」버튼
7. 종료·skip·2D 복귀

### Phase 2~4

- **2**: explore + `NavigationControl`
- **3**: [`travelSpotClusters.json`](../src/pages/Home/data/travelSpotClusters.json) hull 경계선
- **4**: MRT `fetch-mrt-products` · `HotelExploreSheet` (API 합의 후)

---

## 폐기·참고만

- [`plans/archive/globe/globe-optimization-plan.md`](archive/globe/globe-optimization-plan.md) — legacy three-globe
- 2026-06-02 WIP 일괄 (`globeTourEngine` flyTo-only) — reset 후 본 계획으로 재작성
