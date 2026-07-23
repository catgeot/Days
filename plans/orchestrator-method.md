# 오케스트레이터 (gateo 공식 작업 방식)

**상태**: ✅ 공식 · 2026-07-23 (**v2.1** — 이관=현 메인이 후임 Task로 지휘권 이양, 사람 제시어 대기 금지)  
**역할**: 다배치·동일 SSOT를 **메인(오케스트레이터) + 워커 2**로 돌리며 tip을 깨지 않고 확장.  
**제시어**(최초·복구용): `오케스트레이터` · 주제 붙임 예) `오케스트레이터` + `명소` / `명소-오케스트레이터`

사람이 세션을 매번 여닫지 않고, **한 세대(메인 1 + 워커 2)** 가 초안 병렬 → tip 직렬 머지 → (필요 시) **현 메인이 후임 메인에게 지휘권을 넘겨** 이어간다.

---

## 1. 역할

| 역할 | 하는 일 | 금지 |
|------|---------|------|
| **오케스트레이터(메인)** | 배치표(워커당 1) · **워커 정확히 2** 호출 · 감사 · tip **직렬** append · VERIFY · 이관서 | 워커 없이 **본인 런**으로 배치 소화(기본) · tip 병렬 머지 · 워커 JSON 전문 장문 재읽기 |
| **워커(서브)** | **배정된 1배치** 초안 JSON 조각 + 스모크 쿼리 요약만 반환 | tip/`main` 직접 push · SSOT 전면 rewrite · 다른 워커 tip 건드림 · 이관서 작성 |
| **후임 메인** | 인수인계로 **오케스트레이터 역할**을 받음 → 아래 §3.0 **필수 루프** | 배치 1개 솔로 계주 · Task만 띄우고 tip 미append |

### 1.1 승격·이관 (고정)

- Cursor 채팅 UI의 「메인」과 **역할명 오케스트레이터**는 별개다. 초안 **워커**가 UI 메인·오케스트레이터로 자동 승격되지는 않는다.
- **이관 = 지휘권 이양**. 현 메인이 **사람 제시어를 기다리지 않고** 후임에게 넘긴다.
- **이관 실행(필수 순서)**  
  1. 일지에 이관 절(§4) 기록 · 큐 다음 ⬜ R 확인  
  2. **Task로 후임 오케스트레이터 1명** 기동 — 프롬프트에 「당신은 후임 메인(오케스트레이터)」·일지 이관 절·**다음 배치표 2개**·`§3.0` 즉시 수행  
  3. 후임은 받은 **즉시** `워커 2 재기동 → 직렬 머지 → VERIFY → (상한 내) 다음 세대 또는 재이관`  
  4. 현 메인은 tip 추가 append·추가 워커 기동 **중단**(후임에게 넘긴 뒤 감지만)
- **같은 메인 세대 연장**(§3.0 Yes): 컨텍스트 여유 시 후임 Task 없이 현 메인이 워커2만 재기동. 이것도 **사람 제시어 불필요**.
- **사람이 제시어를 넣는 경우(한정)**: (a) 최초 착수 (b) §3.3 E escalate·사용자 명시 중단 후 재개 (c) 후임 Task 기동 실패로 파이프 단절 시 복구.  
  **금지**: 세대 VERIFY 후 「제시어 대기」만 하고 멈추기.
- **본인 런 예외**(한시): 워커 실패 후 **1회 재시도**도 실패했고, 사용자가 중단하지 않았을 때만. 일지에 `본인 런 예외: 사유` 1줄.

### 1.2 #22~#47에서 배운 금지 (재발 방지)

| 퇴화 패턴 | 왜 안 되나 | 대신 |
|-----------|------------|------|
| 후임이 **본인 런**만 반복 | 초반 「워커2」처리량 소멸 | 후임 메인 = 워커2 필수 |
| **배치마다** 이관 | 이관서·토큰 낭비, 세대 미완성 | **세대**(워커2 머지+VERIFY) 끝난 뒤 이관 |
| Task만 띄우고 **tip 미append** | tip 정체·유령 작업 | 메인이 직렬 머지까지 완료 후에만 이관 |
| 채우기 쉬운 후보만 연속 (KR 구·DE/UK 중소) | 검색 가치↓ | 주제 §5 우선순위표 따름 |

---

## 2. 언제 쓰는가

**적합**
- 같은 파일에 **append만** 하는 대량 SSOT (예: [`cityAttractionHubs.json`](../src/pages/Home/data/cityAttractionHubs.json))
- 배치가 많고 세션을 사람이 매번 새로 열기 부담일 때
- 초안 조사는 병렬 가능, 파일 반영은 충돌 나기 쉬울 때

**비적합**
- 단일 버그픽스·UI 한 화면
- 서로 다른 파일을 독립 PR로 나누는 일반 feature (기존 PR 흐름 유지)

---

## 3. 운영 루프

### 3.0 세대 루프 (필수 · 후임 메인 포함)

```
인수인계/배치표 확인 (메인)
    ↓
워커 정확히 2 기동 (각 1배치 초안 · tip 미터치)
    ↓
메인: 조각 수신 → EXISTS/충돌 보정 → tip 직렬 append (워커A→워커B 순)
    ↓
감사 게이트 (audit + 필요 시 resolve 스모크) = VERIFY
    ↓
컨텍스트 여유 있고 배치표 남음?
  · Yes → 워커 2 다시 기동 (같은 메인 세대 연장, 권장 상한 아래)
  · No  또는 ~50% → 일지 이관 절 → **현 메인이 Task로 후임 메인 기동**(사람 제시어 대기 금지)
후임 메인 → 이 루프를 처음부터 (워커 2 재기동 필수) → 세대 후 다시 Task 이관…
```

**세대 권장 상한 (같은 메인)**  
- 워커2 라운드 **1~2회**(보통 hub **20~40**) 후 **이관 실행**(후임 Task).  
- **배치 1개 끝나자마자 이관 금지**(솔로 계주 방지).  
- 큐가 비거나 §3.3 E일 때만 **사람 보고 후 정지**.

### 3.1 감사 게이트 (공통) · 무결성

합본(직렬 append) **직후마다**(라운드/턴 단위) 최소 확인:

- 키 중복 0 (`hubId` 등)
- 표기 normalize 충돌 0 (명소명 등)
- 필수 필드·enum·좌표
- 도메인 resolve/스모크 (해당 SSOT 런타임)

**명소 hub**: `npm run audit:city-attraction-hubs` (+ resolve 스모크 — 해당 R hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑`).

**무결성 모델**: 매 라운드 VERIFY(audit issues **0** + 스모크 PASS)를 통과한 tip만 「정상 tip」이다.  
스모크를 돌린다는 것만으로 자동 보장되지 **않는다** — **issues > 0이거나 스모크 FAIL이면 §3.3으로 tip을 정상 상태로 되돌린 뒤** 다음 라운드로 간다. VERIFY 전에 이관·커밋·다음 R 착수 금지.

### 3.2 병렬 vs 직렬

| 단계 | 병렬? |
|------|-------|
| 워커 2 초안 | ✅ **필수** (기본 2) |
| 단일 tip SSOT append / 머지 | ❌ 메인 **직렬만** (워커A 반영 후 워커B) |
| 감사 VERIFY | 메인, 라운드당 1회 이상 |

### 3.3 문제 조치 (필수)

#### A. audit `issues > 0` 또는 스모크 FAIL

1. **다음 라운드·이관·commit 금지.**  
2. 원인 분류: (a) 방금 append한 hub/명소만 · (b) tip 전체에 영향.  
3. **조치 우선순위**  
   | 상황 | 조치 |
   |------|------|
   | 방금 R에서 넣은 hub/명소가 원인 | 해당 hub(또는 충돌 명소) **부분 제거**(append 롤백) → audit·스모크 재VERIFY |
   | A만 넣고 B 넣기 전 FAIL | **A분도 제거**해 R 시작 전 tip으로 복귀(기본). 원인 명확·A분 audit 단독 PASS면 A 유지+B만 재작업은 **예외**(일지 1줄) |
   | 원인 불명·제거 후에도 FAIL | tip을 **직전 VERIFY 성공 시점**으로 복귀(`git checkout -- <SSOT>` 등) · **사람에게 보고** 후 대기 |
4. 복구 후 audit **0**·스모크 PASS 확인. 큐 해당 R은 ✅가 아니라 **재시도/스킵** 표기(§3.3 D).

#### B. 워커A 성공 · 워커B 실패 (초안 단계)

| 단계 | 조치 |
|------|------|
| tip에 **아직 아무것도 append 전** | A 초안은 메인 버퍼에만 보관. B **1회 재시도**. 재실패 시 B 배정 5개를 예비로 1:1 대체해 워커 재기동 **또는** A5만 머지+VERIFY 후 R의 B5는 다음 턴(큐에 `B 잔여` 표기). |
| **A만 tip에 append된 상태**에서 B 초안 실패 | B 재시도 1회 → 실패 시 A분 VERIFY. PASS면 A 유지·B는 예비 대체/다음 턴. FAIL이면 §3.3 A로 A분 롤백. |
| **기본 원칙** | 「한쪽만 머지」는 **VERIFY PASS한 쪽만** 허용. FAIL 조각은 tip에 남기지 않음. |

#### C. 사용자 중단 직후 체크리스트

에이전트(또는 재개 세션)가 **즉시**:

1. `npm run audit:city-attraction-hubs` → issues **0**인가?  
2. tip 건수 = 일지/큐 기대와 맞는가? (부분 append 의심 시 마지막 hubId 확인)  
3. `_batch*` / `_tmp*` / 미머지 초안 파일 잔여 삭제  
4. 큐: 진행 중 R이 ✅인지 ⬜인지 — **미VERIFY면 ⬜ 유지** · 부분 반영 hub는 제거 또는 완료로 정리  
5. 결과 요약 후: 정상 → 큐 다음 R · 비정상 → §3.3 A · 불명이면 **사람에게 물음**(§3.3 E)

#### D. 같은 hub 재작업 / 스킵

| 기준 | 조치 |
|------|------|
| tip에 `hubId` **이미 있음**(EXISTS) | **스킵** · 큐 예비로 1:1 대체 · 큐·일지 1줄 |
| 초안만 실패·tip 미반영 | **재시도 1회** → 실패 시 예비 대체 또는 스킵 |
| append 후 audit/스모크 FAIL로 제거함 | 같은 R에서 **예비로 교체 재시도 1회** · 또 실패하면 해당 hub **스킵**하고 R 잔여만 VERIFY |
| 시드·보호 대상 (`sokcho`/`paris` 등) | **재작업·덮어쓰기 금지** |
| 명소명 normalize 전역 충돌 | 접두/개명으로 1회 보정 → 불가 시 그 명소만 제외 또는 hub 스킵 |

#### E. 멈추고 사람에게 물을 때

다음이면 **추가 라운드 금지** · 일지 2~5줄 + 채팅으로 보고:

- tip 롤백 후에도 audit ≠ 0  
- 시드/대량 데이터 의심 손상  
- 큐·스키마·KIND(`shrine` 등) 규칙을 바꿔야 해결 가능할 때  
- commit/push·`releaseNotes`·UI 변경이 필요할 때  
- 사용자 중단 직후 상태가 §3.3 C로도 판단 안 될 때  
- 동일 hub/유형 FAIL이 **2회 연속**

**사람에게 묻지 않고 진행 가능**: EXISTS 스킵·예비 1:1·명소 접두 보정·워커 1회 재시도·VERIFY PASS한 A-only 머지(B 잔여 표기).

---

## 4. 컨텍스트 50% — 오케스트레이터 이관 (지휘권 이양)

트리거: 대화가 대략 **절반**을 넘었거나, **세대**(워커2 머지+VERIFY)를 1~2회 끝낸 뒤.

### 4.1 일지 이관 절 (남길 것)

1. **tip 건수** · (가능하면) tip SHA/커밋  
2. **다음 세대 배치표 2개**(워커A·워커B hubId 목록) — 후임이 바로 워커2 띄울 수 있게  
3. **우선순위/제외** 3줄  
4. **금지 3** · 스키마 1줄  
5. **복구용 제시어** (§6) — 후임 Task 실패·새 채팅 복구용. **정상 이관의 트리거가 아님**

### 4.2 지휘권 이양 (현 메인이 실행)

1. §4.1을 일지에 쓴 직후, **같은 턴에** Task로 **후임 오케스트레이터**를 기동한다.  
2. 후임 프롬프트 최소 골격:

```
역할: 후임 메인(오케스트레이터). 명소 SSOT. §3.0 즉시 수행.
읽기: plans/orchestrator-method.md §1·§3.0·§3.3·§4 · plans/city-attraction-hub-queue.md 다음 ⬜ · 일지 이관 절만.
배치표: (Rxx A5 / B5) (Ryy A5 / B5)
할 일: 워커 정확히 2 → tip 직렬 A→B → audit+스모크 VERIFY → 상한 내 다음 R 또는 §4.2로 재이관.
금지: 사람 제시어 대기 · 솔로 계주 · tip 병렬 · 본인 런(기본) · 워커 로그 전체 Read · tip JSON 전문 스캔.
```

3. 후임이 VERIFY까지 끝내면 **후임이 다시** §4.2로 다음 후임을 띄운다(체인). 큐 소진·§3.3 E만 사람 보고.  
4. 이전 워커 로그 전체 Read 금지 · tip JSON 전문 스캔 금지.  
5. **후임·메인 공통 금지**: 워커 2를 `run_in_background`로 띄운 뒤 **초안 수신·머지·VERIFY 전에 턴을 종료**하거나 `final_summary`로 「완료」 처리하는 것.  
   백그라운드 워커는 **완료 알림을 받은 뒤** 직렬 머지까지 같은 에이전트가 이어서 한다.  
6. **파이프 단절 복구**(현 메인/상위): 후임이 워커만 띄우고 종료·tip 미반영이면 tip 건수·`_tmp*`를 확인한 뒤 **후임 resume** 또는 현 메인이 워커2 루프를 재개(사람 제시어 불필요).

---

## 5. 명소 SSOT 적용 (1호 사례)

| 항목 | 값 |
|------|-----|
| SSOT | `src/pages/Home/data/cityAttractionHubs.json` |
| resolver | `src/pages/Home/lib/cityAttractionHubs.js` |
| 워커당 배치 | **8~12 hub** (관례 10) · **라운드당 워커 2** → 보통 20 hub/라운드 |
| 규칙 | append only · `shrine` KIND 유지 · 시드 `sokcho`/`paris` 덮어쓰기 금지 · 명소명 전역 unique |
| audit | `npm run audit:city-attraction-hubs` |
| 상태(2026-07-23) | **630 hub / 4390 명소** · R48–R69 ✅ · **큐 소진** |

상세 배치 이력: [`2026-07-22-project-log.md`](./2026-07-22-project-log.md) · 방향: [`2026-07-23-project-log.md`](./2026-07-23-project-log.md).

### 5.1 사전 배치 큐 (필수 · 임의 지명 금지)

**SSOT 큐**: [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md)

| 규칙 | 값 |
|------|-----|
| 라운드 | **10 hub** = 워커A **5** + 워커B **5** |
| 지명 선택 | 큐 **순서만** (에이전트 임의 선택 금지) |
| EXISTS 시 | 큐 하단 **예비**에서 1:1 대체 후 큐·일지 1줄 |
| 한 세션 | 기본 **R 2개**(20 hub) · 상한 3~4 R 후 이관 |

| 우선 | 대상 |
|------|------|
| ✅ | 큐에 있는 **해외** hubId |
| ⬇ | DE/UK **중소도시** 연속 추가 |
| ❌ | 국내 **구·군 세분** · 큐 밖의 임의 지명 |

### 5.2 커버리지 요약

큐가 비기 전까지 §5.1만 따른다.

**워커 프롬프트 최소 골격**

```
역할: cityAttractionHubs 워커. 배정 hubId 목록만 초안 (1배치).
출력: JSON 배열 조각 + hub/exact 스모크 쿼리 목록 + 주의(동명 분리).
금지: tip append, main push, JSON 전면 rewrite, shrine 제거, releaseNotes, UI 변경, 이관서 작성.
스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng,mapboxId|null}]
kind: beach|market|temple|shrine|viewpoint|landmark|museum|neighborhood|park
좌표: Mapbox(또는 Nominatim) 지명 매칭 시 그 feature만 · hub 중심 추정 금지 · KR km 허용 금지 · §5.4
```

**오케스트레이터 체크 (라운드)**

1. 큐에서 다음 R의 워커A5·B5 확정 → 워커 2 병렬  
2. 조각 수신 → tip **직렬** append (A→B)  
3. `audit:city-attraction-hubs` + 스모크 = VERIFY · 큐 R ✅  
4. 여유 있으면 **큐 다음 R** 반복(상한 내) · 아니면 이관서에 **다음 R번호 2개**

### 5.3 Mapbox 정착지 SSOT (2호 사례)

| 항목 | 값 |
|------|-----|
| SSOT | `src/pages/Home/data/mapboxSettlementPlaces.json` |
| resolver | `src/pages/Home/lib/mapboxSettlementPlaces.js` |
| 큐 | [`mapbox-settlement-queue.md`](./mapbox-settlement-queue.md) · 계획 [`mapbox-settlement-plan.md`](./mapbox-settlement-plan.md) |
| 라운드 | **최대 10 hub** = 워커A **5** + 워커B **5** |
| 개수 | **목표 3 · 최대 5 · 최소 2** · &lt;2면 hub **스킵** (억지 금지) |
| 규칙 | hub당 **1행** · `place`\|`city`\|`locality` only · POI 금지 · 시드 `sokcho`/`paris` 덮어쓰기 금지 · 1차 `mapboxId` null OK |
| audit | `npm run audit:mapbox-settlement-places` |
| smoke | `npm run smoke:mapbox-settlement-places` (+ R exact) |
| 상태(Phase 0) | 시드 2 hub · R01–R63 ⬜ |

**워커 프롬프트 최소 골격**

```
역할: mapboxSettlementPlaces 워커. 배정 hubId만. hub당 1행.
출력: JSON 조각(스킵 제외) + skip/partial + exact 스모크 쿼리.
금지: tip append, hubId 분할, POI/명소, hub 밖 지명, mapboxId 필수화, UI/releaseNotes.
개수: 목표3 · 최대5 · 최소2 · 미달 스킵
스키마: hubId, settlements[2..5] of {placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases}
featureType: place|city|locality
```

**오케스트레이터 체크 (라운드)** — §5.1과 동일 루프 · 게이트만 `audit:mapbox-settlement-places` + `smoke:mapbox-settlement-places`.

### 5.4 명소 좌표 수리 (Mapbox/Nominatim 스냅)

| 항목 | 값 |
|------|-----|
| SSOT | `cityAttractionHubs.json` **필드 패치**(append 아님) |
| 게이트 | `npm run audit:city-attraction-hubs` · `npm run audit:city-attraction-coords` · `npm run verify:city-attraction-coords` |
| 등급 | **NAMED** = 지명/POI 매칭 → feature 좌표 + `mapboxId`(있으면) · tip과 **>50m** = SNAP |
| | **AREA** = beach/park/neighborhood · KR soft 300m / hard 800m |
| | **NO_HIT** = drop · rename · 주소 수동 — **추정 유지 금지** |
| KR | km급 허용 오차 **금지** · hub 중심 추정 **금지** |
| 폴백 | Mapbox Search Box KR POI가 비면 **Nominatim** (캐시 `scripts/.cache/`) |
| P0 | `yanggu` · `chuncheon` · `hanam` · `jindo` (사람 재현) |

**워커 프롬프트 최소 골격 (좌표 수리)**

```
역할: cityAttractionHubs 좌표 수리 워커. 배정 hub의 SNAP/NO_HIT만.
출력: [{hubId,name,lat,lng,mapboxId|null,action:snap|drop|rename}]
금지: tip 직접 append, hub 중심 추정, 시드 덮어쓰기, UI/releaseNotes.
NAMED: Mapbox(또는 verify 큐 suggested) 좌표 그대로 · mapboxId 가능하면 필수.
KR: >50m면 반드시 snap. NO_HIT는 drop/rename만.
```

**오케스트레이터 체크**

1. `verify:city-attraction-coords -- --hubs=…` 또는 전수 큐  
2. 워커2 패치 조각 → tip **직렬** 필드 패치  
3. audit hubs + audit coords(--soft-only OK mid-repair) + smoke 재현 exact  
4. §4.2 이관

제시어: `오케스트레이터` + `명소좌표수리`

### 5.5 국내 명소 TourAPI 좌표 (KR mapy/mapx)

| 항목 | 값 |
|------|-----|
| SSOT | `cityAttractionHubs.json` **필드 패치** · **KR만** |
| 계획 | [`city-attraction-tourapi-coord-plan.md`](./city-attraction-tourapi-coord-plan.md) |
| 소스 | TourAPI `mapy`/`mapx` · Edge `tourapi-proxy` 또는 `TOUR_API_SERVICE_KEY` |
| 등급 | **HIT**만 snap · AMBIG/MISS/FAR 스킵·큐 |
| 분리 | `tourapi-content-id-overrides` = 갤러리 slug — **좌표 혼용 금지** |
| P0 | 김유정 `127933` 회귀 금지 · 양구·덕풍·진도타워 |
| G0 | 메인만 — 스크립트+스모크 |
| G1+ | 워커2 초안 → tip 직렬 · §4.2 |

**권장 환경**: Cursor Cloud (Secrets + 장시간 LIVE).

제시어: `오케스트레이터` + `TourAPI-명소좌표` · 계획 §6 복붙 블록.

---

## 6. 제시어 (복붙 · 최초·복구용)

정상 세대 이관은 **§4.2 Task 체인**이 담당한다. 아래는 사람이 넣는 경우만.

| 용도 | 문장 |
|------|------|
| 일반 시작 | `오케스트레이터` + `@plans/orchestrator-method.md` · 「배치표부터 · 워커2」 |
| 명소 재개/복구 | `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「큐 다음 R · 워커2 · §3.3·§4.2 준수」 |
| 명소 좌표 수리 | `오케스트레이터` + `명소좌표수리` · 「§5.4 · verify 큐 · P0 또는 전수 SNAP 배치」 |
| 국내 명소 TourAPI 좌표 | `오케스트레이터` + `TourAPI-명소좌표` + [`city-attraction-tourapi-coord-plan.md`](./city-attraction-tourapi-coord-plan.md) **§6** · Cloud 권장 · 「G0 스크립트 → G1+ 워커2 · KR HIT만」 |
| 정착지 재개/복구 | `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「큐 다음 R · 워커2 · 목표3/최대5/최소2 · §3.3·§4.2」 |
| 파이프 단절 복구 | `오케스트레이터` · 「후임 Task 실패 복구 · 큐 다음 R · 워커2 재기동」 |

---

## 7. 문서 위치

| 문서 | 담는 것 |
|------|---------|
| **본 파일** | 방법론 SSOT (**공식 v2.1**) |
| [`.cursor/rules/gateo-orchestrator.mdc`](../.cursor/rules/gateo-orchestrator.mdc) | 세션 트리거·짧은 강제 규칙 |
| [`orchestrator-3tier-draft.md`](./orchestrator-3tier-draft.md) | 3단(컨트롤러→지휘자→워커2) **검토안·미적용** · 첫 메인 완료보고 구멍 설명 |
| [`.ai-context.md`](../.ai-context.md) | 스냅샷 1줄 + 링크 |
| [`AGENTS.md`](../AGENTS.md) | 클라우드·로컬 공통 한 줄 |
| 일지 | 라운드 VERIFY·건수·다음 배치표 2개·제시어만 |
