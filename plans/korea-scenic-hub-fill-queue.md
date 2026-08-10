# GATEO 선정 명소 — 권역·시군 hub 보강 큐

**생성**: `npm run report:korea-scenic-empty-hubs -- --write-queue` (이 파일 덮어씀)
**스냅샷**: 빈 hub **0** · 선정 hub **169** · tip spots **819**

**완료**: `#77`~`#104` 시·군 빈 hub 큐 **소진** (`#104` 영덕·영양).  
**소량 hub** (= 빈 hub 큐에서 **제외된** curated>0 · 건수 적은 hub만 · **빈 hub 졸업지 재팽창 금지** · **명소 억지 추가 금지**, 기존 `attractions` 미등재만):  
- `#130` 춘천·속초·동해·삼척  
- `#131` 강릉 기존 미등재 2곳(오죽헌·주문진항)만 · ~~원주·횡성·화천 재보강~~ **되돌림**(빈 hub #87·#89 졸업지)  
- `#132` 포항·목포·울릉·가평 curated1 → 미등재 draft **+23**(754→777)  
- `#133` 공주·합천·태안·부여 curated1 → 미등재 draft **+22**(777→799)  
- `#134` 보성·부안·남원·하동 curated1 → 미등재 draft **+20**(799→819)  
**contentId**: `#107` 10곳 · `#114` searchKeyword **88곳** · `#116` +18 · `#132`–`#134` DB/수동 일부(Tour 미등재·429 잔여).

## 사용법

1. 아래 **다음 미완료 라운드**의 hubId를 워커 A/B에 전달 (각 최대 5 hub · **명소 개수 상한 아님**).
2. 초안: `npm run draft:korea-scenic-hub-batch -- --hubs=<A목록>` → scenic overrides에 append · blurb·contentId 검수.
   - **기본 = hub `attractions` 전수** (개수 기본 상한 없음 · `--per-hub=4` 같은 기본값 금지).
   - `--per-hub=N`은 사람이 **의도적으로** 줄일 때만.
   - 이미 선정된 hub를 다시 넣으면 **미등재 명소만** append.
3. **시도 색인(필수)**: hubId가 [`korea-area-code-overrides.mjs`](../scripts/data/korea-area-code-overrides.mjs) `areas.*.hubIds`에 없으면 해당 시도에 append → `npm run generate:korea-area-codes` → `smoke:korea-area-codes`. 없으면 명소 중·소분류 칩에 hub가 안 뜸.
4. `npm run generate:korea-scenic-spots` → `fill:korea-scenic-spot-images` → `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill`.
5. 완료 라운드는 표에서 ✅ · 이 파일을 `--write-queue`로 재생성하면 잔여만 남음.
6. **제외**: 자치구(…구) hub · (빈 hub 큐 목록에서만) 이미 선정 있는 hub.

## 라운드 (워커A 5 + 워커B 5)

| R | 워커A | 워커B | 권역 | 상태 |
|---|-------|-------|------|------|

**합계**: 0 라운드 · hub 0.

## 권역별 잔여

