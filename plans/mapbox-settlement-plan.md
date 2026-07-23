# Mapbox 정착지 지명 리스트화 (A + hubId 큐)

**상태**: Phase 0 ✅ (2026-07-23) · Phase 1a 클라우드 대기  
**큐**: [`mapbox-settlement-queue.md`](./mapbox-settlement-queue.md) · **방법**: [`orchestrator-method.md`](./orchestrator-method.md) §5.3

## 가드

- SSOT = 허브 근처 **정착지** (`place` / `city` / `locality` only). POI·명소 = `cityAttractionHubs` **금지**.
- 뷰포트 라벨 실시간 미러 **아님** (Phase 2).
- 큐 = tip `cityAttractionHubs` **hubId 순서** · hub 밖 임의 지명 금지.
- 개수: **목표 3 · 최대 5 · 최소 2** · &lt;2면 hub 스킵.
- 드롭다운: hub exact 시 settlements **≤3**.
- hub당 **1행만** · 분할 append 금지.
- 1차: 좌표·이름 · `mapboxId` null OK · 1b에서 채움.
- 기본 **미커밋** · commit은 사람 요청 시.

## 파일

| 경로 | 역할 |
|------|------|
| [`mapboxSettlementPlaces.json`](../src/pages/Home/data/mapboxSettlementPlaces.json) | tip SSOT |
| [`mapboxSettlementPlaces.js`](../src/pages/Home/lib/mapboxSettlementPlaces.js) | resolve |
| `npm run audit:mapbox-settlement-places` | 게이트 |
| `npm run smoke:mapbox-settlement-places` | 시드 회귀(+extra) |

검색 우선순위: **여행지 → hub 도시 → hub 명소 → settlements(지역)**.

## VERIFY (매 라운드)

1. tip 직렬 append(A→B)  
2. `npm run audit:mapbox-settlement-places` → issues 0  
3. `npm run smoke:mapbox-settlement-places` [R exact…] → 시드 `설악동`/`베르사유` 포함  
4. 일지 1줄 · 큐 ✅ · FAIL이면 §3.3 (다음 R·이관·commit 금지)

중간 점검(사람): Phase 0 직후 · R10 · R30 · 큐 소진.

## 커밋

라운드마다 자동 commit 없음. Phase 0 = 본 커밋. 데이터는 R10/R30/소진 등 사람 요청 시 묶음.

## 문제

[`orchestrator-method.md`](./orchestrator-method.md) §3.3. 정착지: sparse 스킵은 정상 · 예비 hub 1:1 대체 안 함(순번 고정).

## 클라우드 제시어

```
오케스트레이터 + 맵박스정착지
@plans/orchestrator-method.md @plans/mapbox-settlement-plan.md @plans/mapbox-settlement-queue.md

큐 다음 ⬜ R · 워커2 · tip 직렬 A→B · 매 R audit+스모크 · 목표3/최대5/최소2·미달스킵 · hub당1행 · mapboxId null OK · POI 금지 · 미커밋 · §3.3·§4.2
```
