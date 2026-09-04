# 지자체 팔경·구경 → 도시 명소 SSOT (오케스트레이터)

**상태**: 📋 P0 ✅ · **I#1** ✅ · **F R01–R03** ✅ 2026-09-02 · **I#2** ✅ · **F R04–R06** ✅ · **I#3** ✅ 2026-09-02 · **F R07–R09** ✅ · **I#4** ✅ 2026-09-02  
**주제 표기**: `지자체 팔경 #{N}, {단계}`  
**고정 브랜치**(착수 시 1회): `cursor/palgyeong`  
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) **§5.6** · 본 플랜  
**큐**: [`korea-local-scenic-lists-queue.md`](./korea-local-scenic-lists-queue.md)

---

## 0. 결정 (사람 · 2026-09-01)

| # | 결정 |
|---|------|
| 1 | **단위 = 기초지자체(시·군·구)** — 홍천팔경·양구구경 등. 관동팔경 같은 광역 리스트는 **1차 범위 밖**(멤버가 시군에 걸치면 각 hub에만 링크, 광역 컬렉션 SSOT는 후속). |
| 2 | **기존 hub 명소 유지** + 지자체 선정분만 **append·멤버십**. 교체·삭제·리디자인 **금지**. |
| 3 | **명소 리스트 UI 변경 없음** — 칩·섹션·레이아웃 손대지 않음. 검색 키워드 매칭만 보강. |
| 4 | `koreaScenicSpots` **자동 승격 금지**. 명승 큐레이션 편입은 **별도 선별 세션**(합의 후). |

**의도**: 지자체 관리 명소는 인프라·홍보가 갖춰진 경우가 많아, 기존 에이전트 선발 목록에 **품질 앵커를 덧붙인다**.

---

## 1. 가능 여부 · 데이터 흐름

**가능.** 기존 인프라에 얹는다.

```mermaid
flowchart LR
  src[지자체_관광페이지] --> worker[워커_초안]
  worker --> lists[koreaLocalScenicLists]
  lists --> merge[메인_직렬머지]
  merge --> hubs[cityAttractionHubs_append]
  merge --> aliases[hub_aliases_팔경명]
  hubs --> globe[지구본홈_검색]
  aliases --> globe
  lists --> scenicQ[명승페이지_검색키워드]
  scenicQ --> curated[기존_koreaScenicSpots_매칭만]
```

| 레이어 | 파일 | 역할 |
|--------|------|------|
| **컬렉션 SSOT** | `src/pages/Home/data/koreaLocalScenicLists.json` | 리스트 메타·멤버십·출처 URL |
| **도시 명소 tip** | `cityAttractionHubs.json` | 없는 멤버만 **attractions append** · 리스트명을 **hub.aliases**에 추가 |
| **명승 큐레이션** | `koreaScenicSpots.json` | **이번 주제에서 쓰기 금지**(자동 승격 X) |
| **검색** | `cityAttractionHubs.js` · `scenicSearch.js` · `searchSuggestions.js` | 팔경/구경 **키워드 → hub·멤버·기존 큐레이션 매칭** |

---

## 2. 스키마 (확정)

### 2.1 `koreaLocalScenicLists.json` (루트 배열)

```json
{
  "listId": "hongcheon-palgyeong",
  "hubId": "hongcheon",
  "title": "홍천팔경",
  "title_en": "Hongcheon Eight Views",
  "listKind": "palgyeong",
  "memberCountClaimed": 8,
  "aliases": ["홍천 팔경", "홍천군 팔경"],
  "sourceUrl": "https://…",
  "sourceOrg": "홍천군",
  "sourceFetchedAt": "2026-09-01",
  "status": "verified",
  "members": [
    {
      "attractionName": "가령폭포",
      "name_en": "Garyeong Falls",
      "kind": "viewpoint",
      "lat": 37.7,
      "lng": 128.1,
      "mapboxId": null,
      "linkStatus": "appended",
      "note": null
    }
  ]
}
```

| 필드 | 규칙 |
|------|------|
| `listId` | kebab · 전역 unique · `{hubId}-{listKind}` 기본 (`hongcheon-palgyeong`) |
| `hubId` | tip에 **이미 있는** KR hub만 (없으면 큐 **스킵** · 새 hub 생성은 별도 합의) |
| `listKind` | `palgyeong` \| `gugyeong` \| `sipgyeong` \| `gugok` \| `other` |
| `memberCountClaimed` | 공식 표기 개수(팔=8 등). 실제 `members.length`와 달라도 됨 → audit **WARN** |
| `sourceUrl` | **필수**(verified). 검색·스크랩 실패면 `status: skip_no_source` |
| `members[].attractionName` | tip `attractions[].name`과 **exact** (normalize 후 링크) |
| `linkStatus` | `linked`(기존) · `appended`(신규) · `pending_coord` · `skipped_conflict` |
| `status` | `draft` \| `verified` \| `skip_no_source` \| `skip_ambiguous` |

### 2.2 hub 병합 규칙 (메인만)

1. 멤버명 normalize → tip 기존 attraction과 일치하면 **`linked`만** · 필드 덮어쓰기 **금지**(좌표 공백이면 좌표만 채움 OK).  
2. 없으면 attractions **append** (`name`/`name_en`/`kind`/`lat`/`lng`) · `linkStatus: appended`.  
3. hub `aliases`에 `title` + `aliases[]` **추가**(이미 있으면 스킵).  
4. 전역 명소명 충돌 → 접두(`홍천 …`) 1회 → 불가 시 그 멤버만 `skipped_conflict`.  
5. 시드 hub(`sokcho` 등)도 **append만** 허용 · 기존 명소 삭제 금지.  
6. **UI·releaseNotes·koreaScenicSpots overrides 금지.**

### 2.3 kind 매핑

공식 설명 → 기존 enum만: `viewpoint|landmark|park|temple|beach|museum|market|neighborhood|shrine`.  
애매하면 `landmark`. KR `shrine` 남용 금지(기존 명소 규칙 유지).

---

## 3. 수집 방법 (워커)

| 우선 | 소스 | 사용 |
|------|------|------|
| **1** | 시·군·구 **공식 관광/문화** 페이지(또는 공식 PDF) | 리스트 제목·멤버명·`sourceUrl` |
| **2** | 광역 관광공사·문화관광 해설에 **시군 단위로 명시**된 경우 | 1 부재 시만 · URL 필수 |
| **3** | 좌표 | Mapbox / Nominatim / (후속) TourAPI HIT — **hub 중심 추정 금지** |
| ❌ | 블로그·위키만으로 `verified` 확정 | 참고만 · 공식 URL 없으면 `skip_no_source` |
| ❌ | LLM 기억만으로 멤버 확정 | 출처 없는 8경 날조 금지 |

**워커 출력 최소**

```
역할: koreaLocalScenicLists 워커. 배정 listId/hubId만.
출력: JSON 조각(리스트 1~N) + 멤버별 link 후보 + sourceUrl + 스모크 쿼리(리스트명·대표 명소 1).
금지: tip append, hub 삭제/교체, koreaScenicSpots, UI, releaseNotes, 이관서.
좌표: 지명 매칭 feature만 · 추정 금지 · NO_HIT면 pending_coord.
```

---

## 4. 세션 유형 · 분량 (토큰 절약)

연속 작업이므로 **세션 종류를 고정**한다. 에이전트는 해당 종류 핸드오프만 읽는다.

| 종류 | 채팅명 예 | 한 세션 분량 | 하는 일 | 읽기(최대) |
|------|-----------|--------------|---------|------------|
| **S0 스키마** | `지자체 팔경 #1, 스키마·검색` | 코드 1회 | JSON 시드·audit·검색 브리지·스모크 | 본 플랜 §2·§7·§9 |
| **P 파일럿** | `지자체 팔경 #2, 파일럿 3건` | **리스트 3** | 홍천·양구·(+큐 1) 수집→머지→VERIFY | 플랜 §2.2·§3 · 큐 P0 |
| **I 무결성** | `지자체 팔경 #3, 무결성` | **쓰기 0** | audit+스모크+샘플 exact · 큐/일지 대조 | 플랜 §6 · tip SHA |
| **F 채우기** | `지자체 팔경 오케 Rxx` (**§4.3 자동 오케**) | **라운드 1~2** = 리스트 **6~12** | 워커2 → 직렬 머지 → VERIFY → §3.4 → **다음 R 자동** | 오케 §3.0·§3.3·§5.6 · 큐 다음 ⬜ |
| **I-주기** | `지자체 팔경 I#N` | 쓰기 0 | **F 3R마다** · 큐/일지 대조 · **사람 요약 2~3줄만** | §6.3 |

### 4.1 오케 라운드 분량 (F)

| | 값 |
|--|-----|
| 워커당 | **리스트 3** (조사 비용↑ · hub 10보다 작게) |
| 라운드 | 워커A **3** + 워커B **3** = **6 리스트** |
| 같은 메인 세대 | 라운드 **1~2** 후 이관(§4.2) |
| 한 Cloud 세션 상한 | **F 라운드 2** 또는 **리스트 ~12** · 그 다음 I 또는 이관 |

파일럿·무결성 세션은 **워커 오케 생략**(메인 솔로 OK). **F = 자동 오케**(§4.3) · 워커2 필수.

### 4.3 자동 오케스트레이터 모드 (F · 확정 2026-09-02)

**배경**: append-only SSOT · UI·scenic 승격 금지 → **매 F 라운드 사람 Preview QA 불필요**. 게이트 = audit·smoke·build.

| | 자동 오케 (F) | 사람 개입 |
|--|---------------|-----------|
| **루프** | 큐 다음 ⬜ R → 워커2 → 직렬 머지 → VERIFY → feature push → **다음 R**(컨텍스트 부족 시 **후임 Task** §4.2) | **§6.2 정지** · **I#** · 주제 종료·PR merge |
| **QA** | **없음** (에이전트 VERIFY만) | I# 종료 시 일지 **2~3줄 요약** (선택) |
| **제시어** | **최초·복구 1회** — §9·오케 §5.6 오케 제시어. **VERIFY 후 사람 제시어 대기 금지** | escalate·Task 실패 복구 |
| **핸드오프 문서** | I#·세대 종료·정지 시 **main** 갱신 | 매 R마다 index 갱신 **필수 아님** (tip·큐·일지로 추적) |

**금지**: F 라운드마다 「Preview QA 해주세요」·「다음 제시어 주세요」·VERIFY PASS 후 정지.

**I 주기**: R01–R03 → I#1 … **3R마다** §6.3(쓰기 0). I PASS면 **즉시 다음 F** (사람 대기 없음).

### 4.5 오케 연속성 — 단절 원인·에이전트 필수 절차 (2026-09-02)

**증상**: F 라운드 VERIFY·push까지 했는데 **후임 Task 없이 턴 종료** → 사람이 새 채팅·제시어로 다시 열어야 함. 로컬/스냅샷 문서는 **R04**인데 feature tip은 **R06**처럼 **main docs 미동기화**도 동반.

#### A. 근본 원인 (우선순위)

| # | 원인 | 왜 끊기나 |
|---|------|-----------|
| 1 | **「자동 오케」≠ 「한 R 하고 끝」** | §4.3은 사람 QA·제시어 **대기**만 금지. **다음 R 또는 후임 Task**는 필수. VERIFY 후 요약만 쓰고 종료 = **버그**. |
| 2 | **Task 이양 미실행** | 오케 §4.2: VERIFY·§3.4 직후 **같은 턴**에 `Task(generalPurpose)` 후임 기동. `run_in_background: true`로 워커만 띄우고 **머지·VERIFY 전 종료** 금지. |
| 3 | **세션 모델 혼동 (#0–#8 vs F)** | 초기는 `지자체 팔경 #N` **사람 새 채팅** 모델. F 전환 후에도 에이전트가 **#N+1 제시어만 남기고** Task를 안 띄움. |
| 4 | **docs-on-main 지연** | 코드=`cursor/palgyeong` · 문서=`main`. feature에 `plans/**` 금지 → **세대 종료 시 main push 필수**. 미push면 다음 에이전트가 **옛 큐**로 착수. |
| 5 | **고정 브랜치 vs Cloud 기본 브랜치 규칙** | Cloud 일반 지시는 `cursor/<topic>-51b9` 신규 생성. 본 주제는 **`cursor/palgyeong` 고정** — 새 브랜치·새 PR **금지**. |
| 6 | **설계상 보고 단절** | 오케 이관 후 **첫 메인은 역할 종료**([`orchestrator-3tier-draft.md`](./orchestrator-3tier-draft.md) §4). 후임이 또 이관 없이 끝나면 **어느 채팅에도 진행이 안 보임**. |
| 7 | **본인 런만 반복** | 워커2 없이 메인 솔로 1R → 일지 한 줄 → 종료. 처리량·컨텍스트 모두 낭비. |

#### B. 에이전트 — 세션 시작 (3분)

1. `git fetch origin main cursor/palgyeong` → **`checkout cursor/palgyeong`** · `merge origin/main`
2. Read: `feature-handoff-index` **본 행** · 본 플랜 **§9** · 큐 **다음 ⬜ R 한 블록** · 오케 **§3.0·§3.3·§5.6** · 일지 **마지막 R 절 1개**
3. `npm run audit:docs-handoff-sync` (FAIL이면 main merge 먼저)
4. tip SHA = index §9와 일치 확인 · 불일치면 **코드 tip·일지 기준**으로 착수

#### C. 세대 루프 (한 메인이 할 일)

```
큐 Rnn 배치표 확정 (워커A 3 + 워커B 3)
  → Task 워커 2 (병렬 · tip 미터치)
  → 직렬 머지 A→B → koreaLocalScenicLists + cityAttractionHubs append
  → VERIFY (audit×2 + smoke + build)
  → §3.4 commit + push cursor/palgyeong
  → 컨텍스트 여유 & ⬜ R 남음?
       Yes(같은 세대 2R 미만): 위 루프 반복
       No 또는 2R 완료: §D 이관 (같은 턴)
```

**한 세대 상한**: F **1~2 라운드**(6~12 리스트) 후 **반드시** §D.

#### D. 턴 종료 전 필수 분기 (이것을 안 하면 단절)

⬜ R이 **남아 있고** §6.2 정지가 **아니면** 아래 **둘 중 하나를 같은 턴에** 실행. **둘 다 안 하고 final 응답 금지.**

| 조건 | 행동 |
|------|------|
| 컨텍스트 **~40% 이하** 여유 | **같은 메인**이 큐 다음 R 즉시 착수 (§C 반복) |
| 컨텍스트 **부족** 또는 이번 세대 **2R 완료** | **후임 Task** `run_in_background: false` · 프롬프트 = §E |

**후임 Task 띄운 뒤** 현 메인은 tip 추가 작업 중단. Task 완료 알림까지 **기다리거나** 최소한 Task 기동 성공을 확인한 뒤 턴 종료.

#### E. 후임 Task 프롬프트 (복붙 골격)

```
역할: 후임 메인(오케스트레이터) — 지자체 팔경 F. 사람 제시어 대기 금지. §3.0 즉시 수행.

Read: plans/orchestrator-method.md §1·§3.0·§3.3·§3.4·§4.2
      plans/korea-local-scenic-lists-plan.md §4.5·§9
      plans/korea-local-scenic-lists-queue.md (다음 ⬜ R만)
      plans/feature-handoff-index.md (지자체 팔경 행)

브랜치: cursor/palgyeong (고정 · 새 브랜치 금지) · PR #172
tip SHA: {방금 push SHA}
배치표: R{nn} 워커A(3) / R{nn} 워커B(3) — 큐 표에서 복사

즉시: 워커2 → 직렬 머지 → VERIFY → push → (여유 있으면 다음 R · 없으면 다시 §4.2 이관)
금지: UI · scenic승격 · plans/ feature 커밋 · VERIFY 후 정지 · 솔로 1R만 하고 종료
VERIFY: audit:korea-local-scenic-lists · audit:city-attraction-hubs · smoke:korea-local-scenic-lists · build
```

#### F. main 문서 동기화 (세대·I#·정지·사람 채팅 종료 시)

feature push와 **별도**로 `main`에서:

1. 일지 `2026-09-01-project-log.md` — 완료 R 1절 + 다음 R
2. 큐 `korea-local-scenic-lists-queue.md` — ✅/skip 갱신
3. 본 플랜 **§9** · `feature-handoff-index` 행
4. `git commit` → **`git push origin main`** (docs-only · 허가 불필요)
5. `checkout cursor/palgyeong` → `merge origin/main` → `audit:docs-handoff-sync`

**I# 주기**: R04–R06=I#3 ✅ · **R07–R09 누적 후 I#4** (쓰기 0 · §6.3).

#### G. 복구 (파이프 단절 시 · 사람 1회)

코드 tip이 문서보다 앞서 있거나 Task 체인이 끊겼을 때:

```
오케스트레이터 지자체팔경
@plans/korea-local-scenic-lists-plan.md §4.5·§9
@plans/korea-local-scenic-lists-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong · git fetch 후 tip SHA 확인
작업: 큐 다음 ⬜ R · 워커2 · VERIFY → 다음 R 또는 Task 이관 · main docs 동기화
```

#### H. 남은 작업 로드맵 (2026-09-04 갱신)

| 단계 | 내용 | 완료 조건 |
|------|------|-----------|
| **즉시** | **R10–R12** 경남 18 hub | I#5 |
| **이어서** | **R13–R16** 전남 22 hub | I#6–#7 |
| **이어서** | **R17–R19** 전북 14 hub | I#8 |
| **이어서** | **R20–R22** 충남 15 hub | I#9 |
| **이어서** | **R23–R28** 경기 31 hub | I#10–#11 |
| **이어서** | **R29** 제주 2 hub | I#11 |
| **백로그** | 광역시·서울 11 hub | R29 후 합의 · 큐 추가 |
| **종료** | index `active: false` | R29+백로그 소진 또는 §6.2 |

**정지만 하는 경우**: §6.2 · 동일 hub FAIL 2회 · audit 롤백 후에도 ≠0.

### 4.2 이어하기 — 토큰 최소화 (필수)

**첫 메시지에 세션 표기 + index + 일지 + 본 플랜 §9만.**

| Read OK | Read 금지 |
|---------|-----------|
| `.ai-context` **1·3절만** | tip JSON **전문** 스캔 |
| `feature-handoff-index` **본 행** | `travelSpots.js` · 해외 hub 큐 |
| 본 플랜 **§9** (+ F면 오케 §3.0·§3.3·§5.6) | `koreaScenicSpots` overrides 전체 |
| 큐 **다음 ⬜ 구간만** | 닫힌 일지·무관 플랜 |
| 대상 hub **grep 단건** | 광역 codebase 탐색 |

---

## 5. 검색 (UI 변경 없이)

### 5.1 지구본 홈

1. hub `aliases`에 리스트 title/aliases → `resolveCityAttractionHub("홍천팔경")`  
2. 멤버 `attractionName` → 기존 `resolveHubAttraction` / prefix  
3. (S0) `resolveLocalScenicList(q)` — exact면 제안 행에 hub + 멤버 요약(기존 suggestion 패턴 재사용 · **새 페이지 UI 금지**)

### 5.2 한국의 명승 페이지

1. `scenicSearch`에 컬렉션 title/aliases exact·includes  
2. 매칭 시 **이미 curated인** 멤버 spot만 결과(목록 구조 동일)  
3. curated에 없는 신규 hub 멤버는 **명승 리스트에 안 뜸**(의도) · 지구본/place 검색으로만 도달  
4. 키워드 「홍천팔경」→ 홍천 관련 curated 멤버가 있으면 노출

---

## 6. 무결성 · 정지 규칙

### 6.0 사람 QA (F vs I)

| 단계 | 사람 Preview QA | 에이전트 게이트 |
|------|-----------------|-----------------|
| **F 라운드** | **생략** (§4.3) | audit 쌍 + smoke + build |
| **I# 무결성** | **불필요** · 일지 요약 2~3줄만 | §6.3 전항 |
| **주제 종료·PR merge** | 검색 키워드 spot-check **선택** | 최종 I + audit 0 |

### 6.1 매 F 라운드 VERIFY (필수)

```bash
npm run audit:city-attraction-hubs
npm run audit:korea-local-scenic-lists   # S0에서 추가
# 스모크: 리스트명 exact + 회귀 속초/낙산사 + 이번 R 대표 1~2
```

issues **0** · 스모크 PASS 전에 커밋·이관·다음 R **금지**.

### 6.2 정지·escalate (사람 보고 후 대기)

오케 [`§3.3`](./orchestrator-method.md)에 더해:

| 조건 | 조치 |
|------|------|
| 동일 listId/hub **FAIL 2회** | 추가 라운드 금지 · 보고 |
| 공식 출처 URL **없음**이 한 라운드 **≥3** | 소스 전략 재검토 · 사람 |
| `memberCountClaimed` 대비 확보율 **&lt;50%**가 연속 2 리스트 | 스킵 정책 확인 · 사람 |
| tip 롤백 후에도 audit ≠ 0 | §3.3 E |
| 시드/대량 손상 의심 | 즉시 정지 |
| UI·명승 자동승격이 필요해 보임 | **구현 금지** · 사람에게 범위 확인 |
| 광역 팔경(관동팔경 등)을 큐에 넣고 싶음 | 1차 범위 밖 · 사람 합의 전 금지 |

**묻지 않고 진행**: EXISTS 스킵 · `skip_no_source` · 명소 접두 1회 · 워커 1회 재시도 · VERIFY PASS A-only · §3.4 커밋.

### 6.3 I(무결성) 세션 체크리스트

1. `audit:city-attraction-hubs` · `audit:korea-local-scenic-lists` → 0  
2. tip hub 수·list 수 = 일지/큐  
3. 샘플 exact: 파일럿 3 + 최근 R 2 — 지구본 resolve · 명승 scenicSearch  
4. `_tmp*` 잔여 없음 · 미VERIFY ⬜ 정리  
5. PASS면 큐에 `I✅` 날짜 · FAIL이면 §6.2

---

## 7. 단계 로드맵

| Phase | 세션 | 산출 | 게이트 |
|-------|------|------|--------|
| **0** | S0 스키마·검색 | 빈/시드 JSON · lib · audit · smoke · 검색 브리지 | audit 0 · build |
| **1** | P 파일럿 3 | 홍천·양구·큐1 verified | VERIFY + I |
| **2** | I 무결성 #1 | 보고서 줄만 | §6.3 PASS |
| **3+** | F 채우기 (강원→전국) | 라운드당 6 리스트 | 매 R VERIFY · **3R마다 I** |
| **후속(합의)** | 명승 선별 승격 | overrides 일부 | 별 주제 · 본 플랜 범위 밖 |
| **후속(합의)** | 광역 팔경 컬렉션 | 별 SSOT | 본 플랜 범위 밖 |

권역 우선: **강원 시·군** → 충북·경북 관광 시군 → 나머지. 큐 순서만 따름(임의 지명 금지).

---

## 8. Git · Cloud

| | |
|--|--|
| 코드·SSOT | feature `cursor/palgyeong` · 매 턴 push · PR 1개 |
| 핸드오프 문서 | **main** docs-only · 세션 종료 시 push |
| feature에 `plans/**` 커밋 | **금지** |
| 최소 검증 | 해당 audit + 스모크 · 없으면 `build` |
| **F 사람 QA** | **생략** (§4.3) · Preview 링크는 PR·일지 참고용 |
| **자동 오케** | VERIFY PASS → 다음 R · **제시어 대기 금지** · 오케 §3.0·§4.2 Task 이양 |

---

## 9. 핸드오프 (에이전트 · 매 세션 갱신)

| | |
|--|--|
| **운영** | **자동 오케** (§4.3) · F=VERIFY 후 다음 R · **3R마다 I#** |
| **지금** | PR #172 **main merge** ✅ · lists **30** · **R10–R29** 큐 확정 ⬜ |
| **다음** | **R10** 경남 — 자동 오케 F · R29+광역시 백로그까지 연속 |
| **브랜치** | `cursor/palgyeong` (고정) · main `367ca0b0` |
| **금지** | UI · scenic 승격 · 광역 팔경 · tip rewrite · **매 R 사람 QA·제시어 대기** |
| **VERIFY** | `audit:korea-local-scenic-lists` · `audit:city-attraction-hubs` · `smoke:korea-local-scenic-lists` · `build` |

### §1.2 오케 제시어 (최초 · 복구 · 사람이 새 채팅 열 때)

```
오케스트레이터 지자체팔경
@plans/orchestrator-method.md
@plans/korea-local-scenic-lists-plan.md
@plans/korea-local-scenic-lists-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong · main merge ✅
금지: UI · scenic승격 · 광역팔경 · feature plans 커밋 · 매R 사람QA · VERIFY후 제시어대기
작업: R10–R29 자동 오케 — VERIFY PASS→다음R · 3R마다 I# · §6.2만 정지
```

**정상 F 진행 중**: 후임 메인이 **Task 이양**(오케 §4.2) — 사람이 매 R 제시어를 넣을 필요 **없음**.
