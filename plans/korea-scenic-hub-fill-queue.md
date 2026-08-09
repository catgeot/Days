# GATEO 선정 명소 — 권역·시군 hub 보강 큐

**생성**: `npm run report:korea-scenic-empty-hubs -- --write-queue` (이 파일 덮어씀)
**스냅샷**: 빈 hub **32** · 선정 hub **137** · maxOrder **5670**

**완료**: `#77`~`#96` · `#97` 해남·함평·익산·무안·무주 전수 → 아래 표는 잔여 재번호.

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
| **R01** | `yeongam` | — | 전라 | ⬜ |
| **R02** | `geochang` · `ulju` · `gimhae` · `gunwi` · `yangsan` | `changwon` · `cheongdo` · `dalseong` · `gijang` · `goseongnam` | 경상 | ⬜ |
| **R03** | `gumi` · `haman` · `miryang` · `sacheon` · `uiseong` | `yecheon` · `yeongcheon` · `yeongju` · `changnyeong` · `cheongsong` | 경상 | ⬜ |
| **R04** | `chilgok` · `dokdo` · `gimcheon` · `goryeong` · `gwangyang` | `gyeongsan` · `sancheong` · `seongju` · `uiryeong` · `yeongdeok` | 경상 | ⬜ |
| **R05** | `yeongyang` | — | 경상 | ⬜ |

**합계**: 5 라운드 · hub 32.

## 권역별 잔여

### 전라 (1)

- `yeongam` 영암 — attr 4 · Tour contentId 0

### 경상 (31)

- `geochang` 거창 — attr 7 · Tour contentId 0
- `ulju` 울주 — attr 7 · Tour contentId 0
- `gimhae` 김해 — attr 6 · Tour contentId 0
- `gunwi` 군위 — attr 6 · Tour contentId 0
- `yangsan` 양산 — attr 6 · Tour contentId 0
- `changwon` 창원 — attr 5 · Tour contentId 0
- `cheongdo` 청도 — attr 5 · Tour contentId 0
- `dalseong` 달성 — attr 5 · Tour contentId 0
- `gijang` 기장 — attr 5 · Tour contentId 0
- `goseongnam` 경남 고성 — attr 5 · Tour contentId 0
- `gumi` 구미 — attr 5 · Tour contentId 0
- `haman` 함안 — attr 5 · Tour contentId 0
- `miryang` 밀양 — attr 5 · Tour contentId 0
- `sacheon` 사천 — attr 5 · Tour contentId 0
- `uiseong` 의성 — attr 5 · Tour contentId 0
- `yecheon` 예천 — attr 5 · Tour contentId 0
- `yeongcheon` 영천 — attr 5 · Tour contentId 0
- `yeongju` 영주 — attr 5 · Tour contentId 0
- `changnyeong` 창녕 — attr 4 · Tour contentId 0
- `cheongsong` 청송 — attr 4 · Tour contentId 0
- `chilgok` 칠곡 — attr 4 · Tour contentId 0
- `dokdo` 독도 — attr 4 · Tour contentId 0
- `gimcheon` 김천 — attr 4 · Tour contentId 0
- `goryeong` 고령 — attr 4 · Tour contentId 0
- `gwangyang` 광양 — attr 4 · Tour contentId 0
- `gyeongsan` 경산 — attr 4 · Tour contentId 0
- `sancheong` 산청 — attr 4 · Tour contentId 0
- `seongju` 성주 — attr 4 · Tour contentId 0
- `uiryeong` 의령 — attr 4 · Tour contentId 0
- `yeongdeok` 영덕 — attr 4 · Tour contentId 0
- `yeongyang` 영양 — attr 4 · Tour contentId 0

