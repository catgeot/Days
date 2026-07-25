# 국내 MRT TNA — 인근 여행지 확장

**상태**: ⏳ 다음 세션 · **스펙 합의 · 미구현**  
**제시어**: `MRT-TNA-인근확장-이어하기`  
**일지**: [`2026-07-25-project-log.md`](./2026-07-25-project-log.md) 「국내 TNA 인근 확장 — 다음 세션」

---

## 0. 전제

- 국내 명소 **대부분**은 전용 투어가 없거나 1~2건뿐.
- 온천·워터파크·명승 등은 **인근 여행지로의 이동이 자연스러움** → 목록을 인근 hub 키워드로 보강.
- 숙소 `MRT_STAY_LOW_COUNT=5`는 **Trip CTA**용. 투어 인근 확장은 **별 임계·별 UX**.
- 클룩/트립 투어 목록 API 대체는 **비권장**(문경 기준 클룩 유의미 재고≈1·트립은 POI 안내 위주). OTA는 후속 CTA 후보만.

---

## 1. 합의 스펙 (2026-07-25)

### 임계

| 항목 | 값 | 동작 |
|------|-----|------|
| 인근 확장 게이트 | **≤3** | 상위 키워드(보통 `parentCity`/hub명) 관련도 통과 건수가 3개 이하일 때만 인근 검색 |
| ≥4 | — | 인근 API·더보기 불필요 |

### 호출 효율 (목표)

명소명·중간 키워드를 일일이 돌리지 **않음**.

1. 상위지 1회 (예: `문경`) → n≤3이면  
2. SSOT 인근 **첫 키워드** 1회 보강 (예: `안동`)  
3. UI「인근지역 더보기」→ **다음** 인근 키워드 앱 내 로드 (예: `단양`)

현 Edge는 `relevant.length > 0`이면 래더 중단 → **≤3이어도 인근까지 안 감**. 구현 시 이 게이트를 바꿔야 함.

### UX

| 단계 | 내용 |
|------|------|
| **A. SSOT** | hubId → 인근 한글 키워드 **2~4개** 순서 고정 (큐레이션). 전국 자동 이웃 계산·임의 도시 검색 **금지** |
| **B. 자동 보강** | n≤3 → 첫 인근으로 목록 채움 (+ 기존 양구식「인근 ○○ 투어」안내 유지·확장) |
| **C. 더보기** | 「인근지역 더보기」= **앱 안**에서 다음 인근 키워드 fetch·목록 append/교체 (외부 MRT 링크 아님) |
| **D. 칩 (후속)** | 같은 SSOT 위 선택 UI (`안동` \| `단양`) — A~C 안정 후 |

### 문경 예시 (시드)

```text
mungyeong / 문경: ['안동', '단양']  // 상주 등은 목록 작업 때 검토
문경석탄박물관: 문경(1) → 안동 보강 → 더보기 → 단양
```

기존 시드: `yanggu` → `춘천`, `인제`, `설악산`, `속초` ([`mrtTnaQuery.js`](../src/utils/mrtTnaQuery.js) `MRT_TNA_NEARBY_EXPAND`).

---

## 2. 다음 세션 작업 순서 (필수)

### Phase 0 — 인근 도시 목록 SSOT (먼저)

전제: 명소 대부분 투어 없음 → **구현 전 목록부터**.

1. 국내 hub(또는 TNA 희소 hub) 후보를 표로 정리.
2. hub당 인근 **2~4** 키워드(한글·MRT 검색에 먹히는 지명). 거리·온천/워터파크/명승 동선 감각으로 큐레이션.
3. LIVE 샘플: `MRT_TNA_SMOKE_LIVE=1` 또는 Edge로 인근 키워드 `n` 확인(0이면 교체).
4. 문서/코드 SSOT에 반영 위치 확정(아래 §3).

**완료 조건**: 사람 또는 에이전트가 초안 표 → 사람 한 줄 확인(또는 배치 승인) 후 Phase 1.

### Phase 1 — 데이터 + 게이트

- `MRT_TNA_NEARBY_EXPAND`(또는 분리 JSON)에 Phase 0 목록 반영.
- Edge 또는 클라: 상위 결과 **≤3**이면 인근 키워드로 이어 검색·머지(중복 gid 제거).
- 스모크: 문경석탄박물관·양구 회귀 · `npm run smoke:mrt-tna` (+ LIVE).

### Phase 2 — 「인근지역 더보기」

- `MrtTnaActivitiesWidget`(·필요 시 `GlobeTourStrip`): 저재고·인근 사용 시 버튼.
- 클릭 = 다음 SSOT 인근 키워드로 **앱 내** 추가 로드.
- 인근 소진 시 버튼 숨김 또는 비활성.

### Phase 3 — 칩 선택 (후속)

- SSOT 길이 ≥2일 때 칩으로 인근 택1. Phase 1~2와 동일 SSOT.

---

## 3. 건드릴 파일 (예상)

| 파일 | 역할 |
|------|------|
| [`src/utils/mrtTnaQuery.js`](../src/utils/mrtTnaQuery.js) | `MRT_TNA_NEARBY_EXPAND` · resolve |
| [`supabase/functions/fetch-mrt-tnas/index.ts`](../supabase/functions/fetch-mrt-tnas/index.ts) | ≤3 시 다음(인근) 키워드 · 또는 클라 다회 호출 설계 |
| [`src/utils/fetchMrtTnas.js`](../src/utils/fetchMrtTnas.js) | 클라 fetch/머지·캐시 |
| [`MrtTnaActivitiesWidget.jsx`](../src/components/PlaceCard/tabs/planner/components/MrtTnaActivitiesWidget.jsx) | 더보기 버튼·안내 |
| [`scripts/smoke-mrt-tna-queries.mjs`](../scripts/smoke-mrt-tna-queries.mjs) | 문경·인근 케이스 |

Edge 재배포 시: `npx supabase functions deploy fetch-mrt-tnas --project-ref <ref> --no-verify-jwt`

---

## 4. 금지·비범위

- 전국 자동 이웃 그래프 / 사용자 임의 도시 검색 (Phase 0~2)
- 클룩·트립 투어 목록을 MRT 대체로 넣기
- 해외 GYG 경로 변경
- 숙소 Trip CTA 로직과 숫자·동작 혼동(`5` ≠ 투어 `3`)

---

## 5. 검증

```bash
npm run smoke:mrt-tna
MRT_TNA_SMOKE_LIVE=1 npm run smoke:mrt-tna
```

**QA**: 문경석탄박물관 ≤3 → 안동 보강 노출 · 더보기→단양 · 양구 인근 안내 회귀 · 경주 등 n≥4는 인근 미호출.
