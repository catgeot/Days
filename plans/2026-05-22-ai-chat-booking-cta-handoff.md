# AI 채팅 예약 CTA 2단계 — Handoff (2026-05-22)

**상태**: Phase 1·**Phase M·2a S1~S6 완료** · **§10-F gateo.kr QA Pass** · **§2.10 착수**(맥락·S8 1차) · S7+ LOP  
**기준 여행지**: **길리 메노** (`gili-meno`) — 다구간·다제휴 스트레스 테스트  
**회귀 여행지**: 자카르타 (`jakarta`) — flight-only 단순 케이스  
**MOONi 진입점**: [`MooniAgentFab.jsx`](src/pages/Home/components/MooniAgentFab.jsx) → `handleStartChat('MOONi')` · [`ChatModal.jsx`](src/pages/Home/components/ChatModal.jsx) `isMooniSession`  
**Cursor Plan**: [`.cursor/plans/` 또는 사용자 plans] `ai_채팅_예약_cta_2단계_ef412bcd.plan.md`

---

## 1. 배경·목표

gateo.kr Place Card / **MOONi 홈 채팅** / Home Chat에서 AI 대화 시 **대화 intent에 맞는 예약·준비 링크 CTA**를 자동 노출한다.

- **Phase 1 (완료)**: `bookingIntentResolver.js` — 예약 키워드 → 12Go·페리 SSOT  
- **Phase M (다음·선행)**: MOONi 세션(`dest=MOONi`)에서 **자유 발화 → slug 해석** — 없으면 Phase 2a CTA 불가  
- **Phase 2a**: intent 확장 + **플래너와 동일한 링크 SSOT 재사용** + 복합 여정 stack  
- **Phase 2b**: 12Go API (Guido)  
- **Phase 3**: in-chat checkout vs redirect 정책

**LOP(롬복) 경유 여정**: 발리(DPS) 경유 stack이 QA 통과한 **후** 추가 (Phase 2a 후반 또는 2b). 현재 공항 SSOT는 gili-meno → **DPS 단일**만.

---

## 2. MOONi 홈 채팅 — slug 해석 (Phase M)

### 2.1 현재 갭

| 항목 | PlaceCard / Home(장소 선택) | MOONi 홈 채팅 |
|---|---|---|
| `destination` | 여행지명 · slug 있음 | `'MOONi'` 고정 |
| `resolveSlugFromDestination` | 동작 | **null** → CTA 없음 |
| `resolveBookingActions` | Phase 1 부분 동작 | slug 없어 **무력** |
| place intro / essentialGuide | 장소별 fetch | MOONi는 skip |

**근본 원인**: MOONi는 UI·브랜딩만 있고, **채팅 컨텍스트에 slug가 바인딩되지 않음**.

### 2.2 목표 파이프 (3단)

```
사용자 발화 (MOONi 세션)
  → ① 목적지 해석 (slug + confidence)
  → ② intent 분류 (Phase 2a chatIntentClassifier — M2 이후)
  → ③ 플래너 SSOT CTA (Phase 2a chatBookingResolver — M3 이후)
```

**원칙**

- ①~③은 PlaceCard·MOONi **공통 모듈** — URL·제휴 파라미터 신규 작성 금지 (§4·§5).
- slug confidence **낮으면** 자동 확정·PlaceCard 이동 금지 → **후보 칩 2~3개** UI.
- confidence **높으면** 채팅 세션 `destination`을 `'MOONi'` → `'길리 메노'` 등으로 **갱신** + 「PlaceCard로 이동」 칩.

### 2.3 slug 해석 전략 (M1)

| 단계 | 수단 | 비고 |
|---|---|---|
| 1차 | [`useSearchEngine`](src/pages/Home/hooks/useSearchEngine.js) · [`travelSpotResolve`](src/utils/travelSpotResolve.js) | 홈 검색과 **동일 SSOT** |
| 2차 (애매할 때) | AI structured output(slug 후보 JSON) 또는 clarifying 질문 | Edge `gemini-proxy` 경유 |
| UI | 채팅 내 **목적지 칩** · (선택) `/place/:slug` 핸드오프 | 검색·MOONi·PlaceCard 한 여정 |

**프롬프트**: MOONi system prompt에 「목적지가 정해지면 교통·예약은 GATEO 플래너 링크로 안내, 가격·시간 단정 금지」 명시.

### 2.4 Phase M 세션 분할

| 세션 | 범위 | 산출 | QA |
|---|---|---|---|
| **M1** | MOONi 발화 → slug 해석 · 세션 `destination` 갱신 · 목적지 칩 UI | `resolveDestinationFromChat.js`(가칭) · ChatModal wiring | 「발리」「길리 메노」「자카르타」 |
| **M2** | Phase 2a **S1~S2** — classifier + profile · MOONi·PlaceCard 공통 | §6 S1~S2 산출물 | gili-meno 「서울에서 어떻게 가?」 |
| **M3** | Phase 2a **S3~S4** 완료 · **S5 대기**(섹션 UI 승인) | `chatPrepBookingLinks` · `useChatEssentialGuide` · planner 링크 `/place/:slug/planner` | F·G·E · 페리 단독 CTA |
| **M4** | **여행 맥락 MOONi 단일 세션** — FAB 노출(z-index) · Docent→MOONi 통합 · slug 선바인딩 진입 | §2.6 · §6 M4-A~B | PlaceCard·MOONi 동일 trip·CTA(G9) |

**권장 순서**: **M1 → S1~S6(M2~M3에 매핑) → M4**. LOP·12Go API는 §6 S7+ 그대로 **gili-meno DPS stack QA 후**.

### 2.6 MOONi 존재 영역 (2026-05-26 합의)

**원칙**: 모든 페이지 동일 FAB ❌ · **여행 맥락 화면 + 단일 MOONi 세션**(`ChatModal` · `saved_trips` · `mooniChatResume`) ✅

| 영역 | 현재 | 목표 |
|------|------|------|
| `/` 글로브 | FAB `z-[58]` 노출 | 유지 — 자유 발화·slug 해석 |
| `/place/:slug` | Home 자식으로 FAB **마운트됨** · PlaceCard `z-[100]`에 **가려짐** | **M4-A ✅**: `PlaceMooniFab` 모바일 전용(z-[165]) · 홈 FAB 숨김 유지 |
| PlaceCard 채팅 | **AI Docent** (`PlaceChatView` / `usePlaceChat`) — MOONi와 **이원화** | **M4-B**: Docent → MOONi 세션 핸드오프(slug 선바인딩 · 동일 resolver·CTA) |
| `/explore` | Home 트리 | FAB 유지(선택: 검색 후 slug 바인딩) |
| `/blog` · `/auth` | 없음 | **비대상** (브랜드·목적 상이) |

**UX 모델**

```
MOONi = ChatModal + trip SSOT (재진입·slug·BookingActionCards)
  · 글로브 FAB     → destination 'MOONi'
  · PlaceCard 진입 → slug 선바인딩 · 헤더 「{여행지} · MOONi」
  · 플래너 링크    → onClose + navigate `/place/:slug/planner` (구현됨)
```

**구현 단계 (다음 세션 권장 순서)**

| 단계 | 범위 | 산출 |
|------|------|------|
| **M4-A** | PlaceCard 위 MOONi FAB `z-index`/safe-area · 또는 헤더·플래너 「MOONi에게 물어보기」 | **완료** — `PlaceMooniFab.jsx` · 모바일 헤더 pill 제거 · 데스크톱 footer·헤더 유지 |
| **M4-B** | Docent 채팅 → `handleStartChat('MOONi', { boundSlug })` 또는 trip 통합 · PlaceCard AI 패널 정리 | G9 회귀 · FAB 이중 노출 방지 |
| **S5** | BookingActionCards 2블록(교통·티켓 / 출발 전) — **UI 승인 후** | MOONi·PlaceCard 공통 컴포넌트 |
| **S6** | gili-meno A~J · jakarta flight-only | gateo.kr |

**리스크**: MOONi trip vs 장소명 trip 분리 · FAB와 플래너 scroll-top 버튼 겹침 · Docent/ MOONi 동시 노출.

### 2.7 S5 BookingActionCards 2섹션 UI (2026-05-26 와이어 합의)

**상태**: 와이어·합의 완료 · **코드 구현은 다음 세션** (`BookingActionCards.jsx` 단일 파일 ~40줄 diff).

| 섹션 | 라벨 | `provider` / `type` | 비고 |
|------|------|---------------------|------|
| **A** | 교통 · 티켓 | `trip_com`, `twelve_go`, `direct`, `klook_ferry` | Trip full-width · 12Go compact(복수) |
| **B** | 출발 전 준비 | `klook`(transfer), `official`(visa), `pre_travel` | amber 톤 · `PreTravelChecklist` 정렬 |

**합의 옵션 (1-A · 2-A · 3-A · 4-A)**

1. 섹션 B: 얇은 amber border + subtle fill (`border-amber-500/15 bg-amber-950/20`)
2. prep 버튼: 모바일 full-width · 데스크톱 wrap chip
3. 순서: A → B → 플래너 링크 (공통 푸터)
4. Trip.com 채팅: **외부 탭 유지** (플래너 Trip modal 재사용 X)

**규칙**: 빈 섹션·헤더 미렌더 · action 상한 6(A 우선) · resolver·URL SSOT **무변경**.

**대상**: `ChatModal`만 (M4-B로 `PlaceChatView` Docent 제거됨).

### 2.8 PlaceCard MOONi 진입·위치 UX (2026-05-27 반영)

**상태**: **M4-C1·C2 구현** — 사용 중 QA·미세 조정

**현재 PlaceCard 진입점** (`PlaceChatPanel` · `PlaceCardSummary`)

| # | 위치 | 크기 | 드래그 |
|---|------|------|--------|
| 1 | 헤더 pill 버튼 | `h-6` | ✗ — **모바일 hidden** |
| 2 | 데스크톱 좌패널 footer | `h-8` | ✗ |
| 3 | 모바일 `PlaceMooniFab` (좌하단 기본) | `h-14` | **✅** `gateo_mooni_place_fab_pos` |
| 4 | Summary 카드 CTA | 텍스트 버튼 | ✗ |

홈 `MooniAgentFab`은 `/place/*`에서 **의도적으로 숨김** (`!isPlaceRoute`). PlaceCard FAB는 `placeMooniFabPosition.js` — scroll-top(플래너·위키) 예약 구역·갤러리 연관 칩 `minBottom` clamp.

**구현 산출**

| 단계 | 범위 | 산출 |
|------|------|------|
| **M4-C1** | 모바일 헤더 pill 제거 · 진입 2~3곳(데스크톱 header+footer · 모바일 FAB) | `PlaceChatPanel.jsx` |
| **M4-C2** | 모바일 Place FAB 드래그 · 위치 persist · scroll-top 충돌 clamp | `PlaceMooniFab.jsx` · `placeMooniFabPosition.js` |

**추가**: 헤더 지명 탭 → 미디어 패널 상단 스크롤 — `handleHeaderScrollTap` `currentTarget` self-match 수정.

**금지**: 홈·PlaceCard FAB **동시 노출** · Docent 잔존 UI 재도입.

### 2.9 선택형 대화 — 타이핑 최소화 (Phase 2c · S8)

**상태**: **계획 신규** (2026-05-26) · S6·배포 QA·§2.8 이후

**배경**: 여행지가 정해지면 GATEO가 `destinationBookingProfile` · `essentialGuide` · 플래너 SSOT로 **필요 정보·링크를 이미 알고 있음**. 자유 입력은 「무엇을 물어봐야 하는지 모름」·오타·intent 분류 노이즈를 만든다.

**이미 있는 것 (부분 커버)**

| 기능 | 범위 | 한계 |
|------|------|------|
| `DestinationResolutionChips` | 목적지 **미확정** · 후보 2~3 · 출발지 표시 | slug bound 후 **다음 단계** 없음 |
| `BookingActionCards` | AI **응답 후** CTA | 사용자가 먼저 질문해야 노출 |
| §7 QA A~J | 발화 예시는 **타이핑 문장** | 선택 UI 아님 |

**목표**: slug **확정(bound)** 후 대화를 **선택형(quick reply chip)** 으로 유도 — 칩 탭 = `handleSend(chipText)` → 기존 `chatIntentClassifier` · `chatBookingResolver` **재사용** (resolver·URL SSOT 무변경).

**대화 흐름 (와이어)**

```
[MOONi intro — bound slug]
  「{여행지} 여행, 무엇부터 도와드릴까요?」
  ┌─────────────┬─────────────┬─────────────┐
  │ ✈️ 어떻게 가? │ 🚢 페리·배   │ 🛂 비자·입국 │
  └─────────────┴─────────────┴─────────────┘
  ┌─────────────┬─────────────┬─────────────┐
  │ 🚐 공항 픽업 │ 💰 관광세 등  │ 📋 플래너   │
  └─────────────┴─────────────┴─────────────┘

[「어떻게 가?」 선택]
  「어디서 출발하세요?」
  │ 서울 │ 부산 │ 인천 │ 직접 입력… │  ← 출발지 칩 → resolveDepartureIataFromChat

[응답 + BookingActionCards] — 기존 S5
```

**칩 SSOT (1차 — profile·intent 매핑)**

| 칩 라벨 | 전송 텍스트(내부) | intent / leg |
|---------|-------------------|--------------|
| 어떻게 가? | `서울에서 어떻게 가?` (출발 칩 선행) | `access_route` |
| 페리·배 예약 | `페리 예약` | `book_ferry` |
| 공항 픽업 | `공항 픽업` | `book_transfer` |
| 비자·입국 | `비자 필요해?` | `info_visa` |
| 관광세·준비 | `관광세?` | `info_fees` |
| 숙소 | `숙소 추천` | `book_hotel` |
| 플래너 보기 | navigate only | `/place/:slug/planner` |

- **slug별 가변**: `getDestinationBookingProfile(slug).legs` · `ferryRequired` · `noCarOnIsland` — 없는 leg 칩 **숨김** (예: jakarta → 페리 칩 없음).
- **홈 MOONi(unbound)**: 기존 intro + 목적지 자유 입력 유지 · bound 되면 위 칩 세트로 **전환**.
- **직접 입력**: 입력창 **유지** — power user·예외 질문용. placeholder 「또는 직접 입력…」.

**구현 (S8)**

| # | 산출 | 파일(가칭) |
|---|------|-------------|
| 1 | slug → 칩 목록 | `mooniQuickReplies.js` (+ profile 연동) |
| 2 | intro·턴 후 칩 UI | `MooniQuickReplyChips.jsx` · `ChatModal` |
| 3 | 출발지 서브 칩 | `resolveDepartureIataFromChat` + ICN/PUS/BUS 등 상수 |
| 4 | bound 전환 시 intro 교체 | `ChatModal` empty state |

**QA (gili-meno bound)**

| # | 동작 | 기대 |
|---|------|------|
| Q1 | PlaceCard MOONi 진입 | intro 아래 **6칩 이내** · 페리·관광세 포함 |
| Q2 | 「어떻게 가?」→ 「서울」 | Trip ICN→DPS + ferry CTA (A 시나리오) · **타이핑 0** |
| Q3 | jakarta bound | 페리 칩 없음 · 「항공편」칩만 |
| Q4 | 칩 + 자유 입력 혼용 | 회귀 · intent 분류 정상 |

**Phase 배치**: **S8 = Phase 2c** (S7+ LOP·12Go API와 **병렬 가능** — UI·기존 resolver만).

### 2.10 MOONi 맥락·선택형 대화 — 우선 해결 (2026-05-27)

**상태**: **§2.10 1차 구현·QA Pass(퀸스타운 dock)** · **§2.11(S8-1 2단 칩) 다음 세션**

**사용자 비전 (제품 목표)**

1. **장소카드 → MOONi**: 해당 장소 **인트로로 대화 시작** · 인트로에 여행 정보·**예약까지 이어질 수 있음** 암시.
2. **타이핑 최소화**: 클릭만으로 대화가 이어지는 **선택지(quick reply)** 중심.
3. **첫 방문 주제 설계**: 장소카드 진입 후 「무엇을 물어볼지」를 사용자가 고민하지 않도록 — **slug별 주제 칩**을 첫 화면에 노출 (표현·순서가 핵심).

**현재 갭 (코드 기준 · §2.10 1차 조치)**

| # | 증상 | 조치 | 상태 |
|---|------|------|------|
| **P1** | PlaceCard MOONi 클릭 시 장소 인트로·주제 맥락 없음 | bound slug → `placeChatIntro` fetch · MOONi 버블 | **완료** |
| **P2** | PlaceCard 진입인데 범용 MOONi trip 복원 | `boundSpot` 있으면 `resolveMooniResumeTrip` **건너뜀** | **완료** |
| **P3** | 「조용한 섬」→ 후보 전 AI 범용 답변 | `confidence: low` 시 AI **보류** · 칩만 | **완료** |
| **P4** | 목적지 칩 선택 후 맥락 단절 | 선택 → intro + MOONi ack | **완료** |
| **P5** | slug bound 후 주제 칩 없음 | `mooniQuickReplies.js` · `MooniQuickReplyChips` | **1차 완료** |
| **P6** | 턴 후 칩 사라짐 | 입력창 **위 고정 dock** · 「다른 주제도 골라보세요」 | **완료** · 퀸스타운 QA Pass |
| **P7** | 칩이 「출발 준비」만 강조 · 탐색 질문 부재 | **§2.11 2단 계층** · 플래너 3섹션 정렬 | **다음 세션** |

**첫 방문 주제 칩 (1차 SSOT · §2.9 — §2.11에서 2단으로 대체 예정)**

bound slug 확정 직후 MOONi가 보여줄 **주제 라벨** (내부 전송문은 intent 분류용):

| 칩 (사용자-facing) | 조건 | 전송 텍스트 |
|--------------------|------|-------------|
| ✈️ 어떻게 가? | `legs`에 flight | `서울에서 어떻게 가?` (출발 서브칩은 2차) |
| 🚢 페리·배 | `ferryRequired` | `페리 예약` |
| 🛂 비자·입국 | essentialGuide/항상 | `비자 필요해?` |
| 🚐 공항 픽업 | `legs`에 transfer | `공항 픽업` |
| 💰 관광세·준비 | prep 항목 있을 때 | `관광세?` |
| 📋 플래너 보기 | slug 있음 | navigate `/place/:slug/planner` |

- **인트로 톤**: `placeChatIntro` 본문 + 한 줄 「교통·비자·예약은 아래에서 골라보셔도 좋아요.」
- **홈 MOONi(unbound)**: 기존 자유 intro 유지 → slug 확정(칩·발화) 후 위 세트로 **전환**.
- **직접 입력**: 입력창 유지 · placeholder 「또는 직접 입력…」
- **주제 칩 지속**: slug bound 중 입력창 **위 고정 dock** — 턴 후에도 「다른 주제도 골라보세요」 칩 유지 (2026-05-27 · QA Pass)

**§2.10 1차 구현 (2026-05-27 커밋)**

| 파일 | 역할 |
|------|------|
| [`mooniQuickReplies.js`](src/pages/Home/lib/mooniQuickReplies.js) | slug → 1차 주제 칩 SSOT · intro hint |
| [`MooniQuickReplyChips.jsx`](src/components/chat/MooniQuickReplyChips.jsx) | dock·버블 칩 UI |
| [`ChatModal.jsx`](src/pages/Home/components/ChatModal.jsx) | intro fetch · defer · dock · follow-up |
| [`useHomeHandlers.js`](src/pages/Home/hooks/useHomeHandlers.js) | boundSpot resume 가드 |

**이번 세션 구현 (완료)**

1. P2 — boundSpot resume 가드  
2. P1+P5 — intro · MOONi 버블 · quick replies  
3. P3+P4 — low-confidence defer · 칩 선택 follow-up  
4. P6 — 고정 topic dock  
5. QA — 퀸스타운 PlaceCard MOONi · 비자 칩 후 dock 유지 Pass  

**QA 게이트 (§2.10 Pass)**

| # | 시나리오 | 기대 |
|---|----------|------|
| T1 | `/place/gili-meno` → MOONi | 길리 메노 인트로 + 예약 암시 + 주제 칩(페리 포함) · 범용 MOONi trip **미복원** |
| T2 | 홈 MOONi 「조용한 섬」 | AI 답변 **전** 후보 3칩 · 선택 후 intro+주제 칩 |
| T3 | T2에서 「페리 예약」칩 | 기존 A·D CTA · gili-meno slug |
| T4 | jakarta bound | 페리 칩 **없음** |

### 2.11 MOONi 주제 칩 2단 계층 (S8-1)

**상태**: **구현·로컬 UI QA Pass** (2026-05-29) · 커밋 `23de3e7`+모바일 입력 UX

**배경 (2026-05-27)**: 1차 칩(비자·관광세·픽업 등)은 「곧 출발」 편향 · 장소카드 진입자는 **탐색·판단**(치안·매력·역사·즐길거리)도 많음. 한 줄에 전부 나열하면 선택 피로 → **2단 drill-down**.

**원칙**

- **1단(dock)**: 4~5개 — 여행 **의도**만 (플래너 3섹션 + 탐색)
- **2단(dock 교체)**: 1단 선택 후 3~4개 구체 질문 · **← 주제 바꾸기**로 1단 복귀
- 칩 탭 = `handleSend(내부문)` · classifier·CTA **재사용**
- persona: 탐색·즐기기 → `INSPIRER` · 가는 방법·준비 → `PLANNER`

**1단 칩 (플래너 정렬)**

| 1단 | 사용자 마음 | 플래너 |
|-----|-------------|--------|
| 🌍 **이곳이 궁금해** | 어떤 곳·치안·역사·매력 | 위키·갤러리·intro 보완 |
| ✈️ **가는 방법** | 교통·경로 | JourneyTimeline · 항공 배너 |
| 🛫 **출발 전 준비** | 비자·입국·관광세·보험 **묶음** | PreTravelChecklist · §출발 전 |
| 🌴 **즐길거리·일정** | 액티비티·맛집·코스 | §현지 100% · map_poi |
| 📋 **플래너 보기** | navigate | `/place/:slug/planner` |

**2단 예시**

- **이곳이 궁금해** → 어떤 곳? / 분위기·치안 / 역사·문화 / 왜 가볼 만해?
- **가는 방법** → 서울·부산·인천 출발 · (ferryRequired) 페리·배
- **출발 전 준비** → 비자·입국·서류 · 항공권 · 숙소 · 렌터카·픽업 (§2.14)
- **즐길거리·일정** → 액티비티 / 맛집 / 2~3일 일정 / 동행별 추천

**인트로 문구 (§2.11 반영 시)**

- 현재: 「교통·비자·예약은 아래에서…」(출발 편향)
- 목표: 「이곳이 어떤 곳인지부터, 가는 방법·준비·즐길거리까지… 예약은 답변 아래 버튼으로」

**구현 순서 (S8-1~3)**

1. `mooniQuickReplies.js` — L1/L2 SSOT · `getMooniQuickReplies(slug, level, parentId?)`
2. `ChatModal` — dock drill-down state · 「← 주제 바꾸기」
3. `essentialGuide`/`profile` 기반 2단 가변(페리·pre_travel 없으면 숨김)
4. QA — 퀸스타운(탐색) · gili-meno(페리·준비) · jakarta(페리 없음) · A1/A2 — **Pass**

### 2.11.2 모바일 bound dock — 입력창 지연 노출 (S8-1.6)

**상태**: **폐기** — §2.11.3에서 입력 상시 노출로 대체 (2026-05-29)

### 2.11.3 MOONi dock — 칩·입력 레이아웃 (S8-1.7)

**상태**: **구현·사용자 QA Pass** (2026-05-29)

| 구분 | dock | 입력 |
|------|------|------|
| **모바일** (`max-md`) | L1 `mobileLabel` 단축 · wrap · 좌 **70%** | 우 **30%** · `입력…`/`출발지…` |
| **데스크톱** (`md+`) | 전폭 wrap · 풀 L1 라벨 | dock **아래** 전폭 · `또는 직접 입력…` |

- **플래너**: L1 칩 제거 → 헤더 **📋 플래너 보기** 상시 (`omitPlanner`).
- **L2**: 「세부 질문을 골라보세요」 제거 · **← 주제 바꾸기** cyan pill.
- **access L2**: placeholder `ACCESS_DEPARTURE_INPUT_PLACEHOLDER` (데스크톱) / `출발지…` (모바일).

### 2.12 채팅·Trip CTA 출발지 확대 — (Phase 2d · S8+)

**상태**: **구현·gili-meno QA Pass** (2026-05-29)

**배경**

- 해외 거주·재방문 사용자 존재. **도착 공항**은 `travelSpotAirports.json` + `getPlannerFlightArrivalIata` + `rentalAirportHubs`로 대부분 커버(오지 일부 제외).
- **출발**만 `resolveDepartureIataFromChat` 한국 도시 상수 + 미매칭 시 **ICN 고정** → 해외 출발 시 Trip 라벨·`dAirportCode`가 맞지 않음.

**원칙 (도착 데이터 ≠ 출발 자동 치환)**

| 구분 | SSOT | 비고 |
|------|------|------|
| **도착** | slug → `travelSpotAirports` / 툴킷 → IATA | 여행지별 1곳(또는 multi 허브) |
| **출발** | 사용자 발화·칩·히스토리 → IATA | **목적지 slug의 도착 공항을 출발로 쓰지 않음** (예: 방콕 여행 ≠ 방콕 출발) |

**출발지는 도착 JSON을 “참조”하는 게 아니라, 같은 허브 레지스트리를 씀**

- [`rentalAirportHubs.js`](src/utils/rentalAirportHubs.js) `RENTAL_AIRPORT_HUBS` — 이미 `iata` · `officialKo` · `aliases`(`bangkok`, `london`, `singapore`, `방콕` 등) 보유.
- [`formatChatFlightLabel`](src/utils/chatBookingResolver.js) 라벨 한글명도 동일 허브 Map 사용 중.
- **확대 작업**: [`resolveDepartureIataFromChat.js`](src/utils/resolveDepartureIataFromChat.js)를 허브 `aliases` 단어경계 매칭으로 확장 → `chatBookingResolver` · Trip `dAirportCode` · MOONi 「가는 방법」칩·직접입력과 연동.

**구현 스케치 (후순위 세션)**

1. `resolveDepartureIataFromChat` — `RENTAL_AIRPORT_HUBS` 기반 출발 IATA (한국 도시 상수는 유지·병합).
2. 출발·도착 동일 허브일 때(예: 「방콕에서 방콕」) — `access_route`·목적지 바인딩 가드와 함께 오탐 방지.
3. MOONi 2단 「가는 방법」 — 주요 출발 허브 칩(선택) + 기존 직접 입력 · 기본값 미매칭 시 **ICN 유지**(gateo 주 사용자).
4. (선택·후순) locale / 최근 출발 저장 — 채팅 SSOT 안정 후.

**QA (착수 시)**

| # | 발화 | 기대 |
|---|------|------|
| O1 | London에서 Bangkok 가는 방법 | 라벨·Trip **LHR → BKK** (또는 허브 한글명) |
| O2 | 방콕만 목적지 bound · 출발 미언급 | 도착 **BKK** · 출발 **ICN** (현행 유지) |
| O3 | Singapore에서 Bali | **SIN → DPS** |

**Phase 배치**: **2d / S8+** — §2.11·S8·§10-F 잔여 QA **Pass 후**.

### 2.11.1 「가는 방법」출발 직접입력 — 목적지 오인 방지 (S8-1.5)

**상태**: **구현** (2026-05-29)

**증상**: bound 후 「가는 방법」→ 직접 입력에 `마닐라`만 입력 → `resolveDestinationFromChat`이 **목적지**로 재바인딩.

**조치**

| # | 내용 |
|---|------|
| 1 | `normalizeAccessDepartureUserText` — `topicDockParent===access` 또는 출발 placeholder 활성 시 `마닐라`→`마닐라에서 어떻게 가?` |
| 2 | `DEPARTURE_HUB_SLUGS` 확대(manila·singapore·bangkok 등) — 출발 허브 slug 목적지 후보 제외 |
| 3 | `ChatModal.handleSend` — bound + access dock에서 전송 전 보정 |

**QA**

| # | 시나리오 | 기대 |
|---|----------|------|
| A1 | 길리 메노 bound → 가는 방법 → 직접 입력 `마닐라` | 헤더·slug **길리 메노 유지** · access_route CTA |
| A2 | 동일 `서울` | `서울에서 어떻게 가?` · ICN→DPS |

**선행**: §2.12(허브 기반 출발 IATA·Trip 라벨)는 **본 패치 이후** — 직접입력 맥락 없이는 허브만으로 오인 해소 안 됨.

### 2.13 MOONi CTA·플래너 포커스 (2026-06-01)

**상태**: **구현·st-helena QA Pass**

**배경**

- AI 본문이 「예약 · 티켓 검색」·「GATEO 플래너」를 언급하나 UI 섹션명은 「교통 · 티켓」「출발 전 준비」뿐 → 버튼 불일치.
- 「숙소·항공 증빙」 발화가 `/항공/`으로 `book_flight` 오탐 → Trip CTA만 노출.
- 플래너 CTA 클릭 시 탭만 열리고 **비자 및 서류** 카드까지 스크롤되지 않음.

**조치**

| # | 내용 |
|---|------|
| 1 | `chatCtaPromptHint` — AI 호출 전 CTA 미리보기 → system prompt |
| 2 | `mooniReplySanitizer` · `BOOKING_RULES` — 「예약 · 티켓 검색」 금지 |
| 3 | `ENTRY_PROOF_PATTERNS` · visa leg **flight보다 우선** |
| 4 | L2 `L2_PREP` · L2 dock L1 라벨 — **§2.14**에서 4칩 SSOT로 정리 |
| 5 | `placePlannerFocus` — hash·`chipId` · `PlannerTab` 스크롤 |

**산출**

| 파일 | 역할 |
|------|------|
| [`chatCtaPromptHint.js`](../src/utils/chatCtaPromptHint.js) | 턴별 CTA UI 힌트 |
| [`mooniReplySanitizer.js`](../src/utils/mooniReplySanitizer.js) | 가짜 링크·환각 버튼명 제거 |
| [`placePlannerFocus.js`](../src/utils/placePlannerFocus.js) | hash·발화·`chipId`→포커스·스크롤 (§2.14) |
| [`MooniPlannerFollowUp.jsx`](../src/components/chat/MooniPlannerFollowUp.jsx) | 탐색형 답변 플래너 버튼 |

### 2.14 MOONi L2 「출발 전 준비」칩·플래너 앵커 (2026-06-01)

**상태**: **구현** (문서·커밋 동일 세션)

**원칙**

- **비자·입국·서류** 1칩 — 증빙·관광세·보험·치안 등은 AI가 개괄 답변 · 세부·공식 링크는 플래너 **「출발 전 필수 준비」** 섹션(`#planner-prep`).
- **예약·교통** 3칩 — 항공·숙소·렌터카/픽업·현지 교통은 칩별 AI 질문 + 플래너 **해당 카드·체크리스트**로 스크롤.

**L2 SSOT** (`mooniQuickReplies.js`)

| 칩 | sendText | 플래너 hash (`resolvePlannerFocusFromPrepChipId`) |
|----|----------|---------------------------------------------------|
| 비자·입국·서류 | 비자, 입국 필수 준비 사항을 설명해줘 | `#planner-prep` |
| 항공권 | 항공권 예약을 어떻게 해야 하지? | `#planner-pre-travel-checklist` (없으면 `#planner-prep-flight`) |
| 숙소 | 여행지의 숙소는 어디가 좋을까? | `#planner-prep-accommodation` |
| 렌터카·픽업 | 현지 교통은 어떻게 이용하는 것이 좋을까? | `#planner-arrival-transfer` → `#planner-local-transport` → `#planner-rental-pickup` → `#planner-arrival` |

**PlannerTab id** (hash 1:1): `planner-pre-travel-checklist` · `planner-prep` · `planner-prep-visa` · `planner-prep-flight` · `planner-prep-accommodation` · `planner-prep-safety` · `planner-rental-pickup` · `planner-arrival` · `planner-arrival-transfer` · `planner-local-transport`

**연동**

- 칩 탭 → `MooniQuickReplyChips` → `handleSend(text, persona, { chipId })` → `resolvePlannerFocusFromUserText` **chipId 우선**.
- 툴킷 로드 시 **PreTravelChecklist**(항공·숙소·픽업) 상시 노출 · 타임라인만 있을 때 2열.
- `chatCtaPromptHint` — 포커스별 cyan 플래너 버튼 안내 문구 분기.

**제거(통합)**

- L2 단독 칩: 숙소·입국 증빙 · 관광세·입국비 · 보험·안전·주의 · 필수 예약(단일) — 비자·입국·서류 + prep 섹션으로 커버.

### 2.15 MOONi 칩 프롬프트·주제별 CTA·채팅 항공 위젯 (2026-06-01)

**상태**: **구현** (버뮤다 QA 기준)

**배경**

- L2 「항공권」 등 prep 칩에서 AI가 플래너·Trip 링크만 안내하고 실질 정보(도착 IATA·환승·비자·예약 팁) 부족.
- `MooniPlannerFollowUp`·prep CTA가 주제와 무관하게 「{여행지} 항공·입국 정보 (플래너)」로 통일.
- 채팅 「교통 · 티켓」 Trip CTA — 외부 `/flights/` 직링크 시 모바일 검색 불안·출발=도착 IATA 오입력(BDA 등 목적지 오인).

**조치**

| # | 내용 |
|---|------|
| 1 | [`mooniChipPrompts.js`](../src/pages/Home/lib/mooniChipPrompts.js) — L2 칩 id별 답변 지침 SSOT · `getMooniChipPromptHint` → `ChatModal` system prompt |
| 2 | [`getMooniPlannerCtaLabel`](../src/utils/placePlannerFocus.js) — `{여행지} 항공권 예약 정보` / `숙소 예약` / `현지 교통 안내` / `비자·입국 정보` |
| 3 | `MooniPlannerFollowUp` · `BookingActionCards` prep primary — 주제별 라벨 · `chipId`/`plannerFocus`/`userText` |
| 4 | 채팅 Trip 항공 — `TripcomFlightSearchProvider` in `ChatModal` · `forceModal: true` 위젯(플래너와 동일 iframe) · 직링크 제거 |
| 5 | `buildTripcomPlannerFlightUrl` — `dAirportCode === aAirportCode` → ICN 폴백 · `resolveDepartureFromChat` `excludeIata`(도착 공항) |
| 6 | `bermuda` [`travel-spot-airport-overrides.mjs`](../scripts/data/travel-spot-airport-overrides.mjs) — ICN 직항 없음·미국/유럽 경유·BDA `bannerNote` |

**칩 → CTA 라벨 (예: 버뮤다)**

| 칩/포커스 | follow-up·prep 버튼 |
|-----------|---------------------|
| `prep_flight` | 버뮤다 항공권 예약 정보 (+ routeHint: ICN→BDA) |
| `prep_hotel` | 버뮤다 숙소 예약 |
| `prep_transport` | 버뮤다 현지 교통 안내 |
| `visa_docs` | 버뮤다 비자·입국 정보 |

**QA (로컬 · bermuda bound)**

| # | 시나리오 | 기대 |
|---|----------|------|
| P1 | 「항공권」칩 | 본문에 BDA·환승·ESTA 등 실질 가이드 · CTA 「버뮤다 항공권 예약 정보」→ **위젯 모달** |
| P2 | 「숙소」칩 | follow-up 「버뮤다 숙소 예약」 (항공·입국 문구 X) |
| P3 | 「렌터카·픽업」칩 | follow-up 「버뮤다 현지 교통 안내」 |
| P4 | 위젯 내 출발·도착 | ICN / BDA (동일 코드 X) |

### 2.5 MOONi 관련 파일

| 파일 | 역할 |
|---|---|
| [`MooniAgentFab.jsx`](src/pages/Home/components/MooniAgentFab.jsx) | FAB · `mooniLines.js` peek/idle/react · 드래그 위치 |
| [`mooniLines.js`](src/pages/Home/lib/mooniLines.js) | MOONi 말풍선 SSOT (intro/peek/idle/react/easterEgg) |
| [`Home/index.jsx`](src/pages/Home/index.jsx) | `handleStartChat('MOONi', payload)` |
| [`ChatModal.jsx`](src/pages/Home/components/ChatModal.jsx) | `isMooniSession` · topic dock · destination defer |
| [`mooniQuickReplies.js`](src/pages/Home/lib/mooniQuickReplies.js) | L1/L2 주제 칩 SSOT · `getMooniL1ChipLabel` |
| [`MooniQuickReplyChips.jsx`](src/components/chat/MooniQuickReplyChips.jsx) | dock·주제 칩 UI · L1 라벨 |
| [`chatCtaPromptHint.js`](src/utils/chatCtaPromptHint.js) | MOONi CTA↔프롬프트 정합 (§2.13) |
| [`mooniChipPrompts.js`](src/pages/Home/lib/mooniChipPrompts.js) | L2 칩별 AI 답변 지침·SSOT 주입 (§2.15) |
| [`placePlannerFocus.js`](src/utils/placePlannerFocus.js) | 플래너 hash 포커스 · `getMooniPlannerCtaLabel` (§2.13·§2.15) |
| [`TripcomFlightSearchContext.jsx`](src/components/PlaceCard/tabs/planner/TripcomFlightSearchContext.jsx) | 채팅·플래너 Trip 항공 위젯 모달 · `forceModal` (§2.15) |
| [`useHomeHandlers.js`](src/pages/Home/hooks/useHomeHandlers.js) | `handleStartChat` · boundSpot resume 가드 |
| [`placeChatIntro.js`](src/pages/Home/lib/placeChatIntro.js) | `INVALID_DESTINATIONS`에 `mooni` 포함 |

---

## 3. Phase 1 한계 (재현 버그)

| 발화 (gili-meno) | 현재 | 기대 |
|---|---|---|
| 서울에서 어떻게 가? | CTA 없음 · INSPIRER | flight(DPS) + ferry + (선택) transfer |
| 페리 예약 | 키워드 있을 때만 12Go | ferry SSOT bali-gili / lombok-gili |
| 공항 픽업 / 비자 / 관광세 | 없음 | 플래너와 동일 링크 |

근본 원인: `detectBookingIntent`가 **예약 키워드만** 인식 · Trip.com·Klook·툴킷 pre_travel 미연동.

---

## 4. 플래너 = 링크 SSOT (채팅 resolver가 재사용할 것)

**원칙**: 채팅용 URL·제휴 파라미터를 새로 만들지 말고, 아래 플래너 경로를 **import·호출**한다.

### 4.1 UI·진입점 ([`PlannerTab.jsx`](src/components/PlaceCard/tabs/PlannerTab.jsx))

| 플래너 영역 | 컴포넌트 | 링크 종류 |
|---|---|---|
| 상단 | [`TripcomFlightBannerWidget`](src/components/PlaceCard/tabs/planner/components/TripcomFlightBannerWidget.jsx) | Trip.com 항공 (ad iframe / `/flights/`) |
| 상단 | [`RentalPickupBanner`](src/components/PlaceCard/tabs/planner/components/RentalPickupBanner.jsx) | 도착 IATA · 렌터카 hub |
| 출발 전 | [`PreTravelChecklist`](src/components/PlaceCard/tabs/planner/components/PreTravelChecklist.jsx) | **툴킷 pre_travel**(비자·관광세 등) + 항공·숙소·**Klook 픽업** |
| 여정 | [`JourneyTimeline`](src/components/PlaceCard/tabs/planner/components/JourneyTimeline.jsx) | 다구간 설명 |
| 카드 | [`ToolkitCard`](src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx) + [`getMultiLinks`](src/components/PlaceCard/tabs/planner/utils.js) | visa · transport · accommodation · … |
| 페리 | [`FerryBookingWidget`](src/components/PlaceCard/tabs/planner/components/FerryBookingWidget.jsx) | [`ferryBookingMatch.js`](src/utils/ferryBookingMatch.js) |

### 4.2 URL·제휴 함수

| 용도 | 파일·함수 |
|---|---|
| Trip.com 항공 | [`affiliate.js`](src/utils/affiliate.js) `buildTripcomPlannerFlightUrl` · [`partnerNavigation.js`](src/components/PlaceCard/common/partnerNavigation.js) `buildTripcomPlannerNavigationUrl` |
| 도착 IATA | `getPlannerFlightArrivalIata` · [`rentalAirportMatch.js`](src/utils/rentalAirportMatch.js) |
| 12Go | [`affiliate.js`](src/utils/affiliate.js) `get12GoAffiliateUrl` · sub_id `{slug}-planner` |
| Klook 픽업 | PreTravelChecklist: `getKlookAffiliateUrl('https://www.klook.com/ko/airport-transfers/')` |
| Klook 렌터카·교통 | `getMultiLinks` cases · `getKlookRentalHomeUrl` |
| 비자 공식 | [`constants.js`](src/components/PlaceCard/tabs/planner/constants.js) `OFFICIAL_VISA_LINKS` → `getMultiLinks` `visa` case |
| **관광세·입국 준비** | **툴킷 `essential_guide.categories.pre_travel[]`** — `{ title, url, cost }` (DB). 인도네시아/발리 예: `https://lovebali.baliprov.go.id/` (툴킷 생성·[`update-place-toolkit`](supabase/functions/update-place-toolkit/index.ts) 프롬프트) |
| e-VOA | `OFFICIAL_VISA_LINKS` 키워드 `e-VOA`+`길리` → `https://molina.imigresi.go.id/` |

**관광세는 constants에 고정 URL을 두지 않음** — 플래너 [`PreTravelChecklist`](src/components/PlaceCard/tabs/planner/components/PreTravelChecklist.jsx)가 `items`(pre_travel) URL을 그대로 렌더. 채팅도 **essentialGuide fetch 후 동일 items** 사용.

### 4.3 gili-meno 데이터 SSOT (JSON 직접 수정 금지)

| SSOT | 값 |
|---|---|
| 공항 | DPS 단일 ([`travelSpotAirports.json`](src/pages/Home/data/travelSpotAirports.json)) |
| 페리 | tier `required` · bali-gili · lombok-gili ([`travel-spot-ferry-overrides.mjs`](scripts/data/travel-spot-ferry-overrides.mjs)) |
| transport | slug 없음 (bali SSOT에 jakarta-bali만) |

---

## 5. Phase 2a 아키텍처 (구현 청사진)

MOONi 세션은 **§2 slug 해석(M1) 완료 후** 동일 파이프에 합류한다.

```
userText + chatHistory + location(slug) + essentialGuide
  → chatIntentClassifier.js
  → destinationBookingProfile.js (slug legs)
  → chatBookingResolver.js
       ├─ flight: buildTripcomPlannerFlightUrl (planner 동일)
       ├─ ferry: ferryBookingMatch (기존)
       ├─ transfer: PreTravelChecklist Klook URL
       ├─ prep: pre_travel[] + OFFICIAL_VISA_LINKS (getMultiLinks 로직 추출)
       ├─ rental/hotel/transport: getMultiLinks cases
       └─ planner fallback: /place/{slug}?tab=planner
  → BookingActionCards (섹션 UI — 승인 후)
```

### Intent (요약)

`access_route` · `book_flight` · `book_ferry` · `book_transfer` · `book_ground` · `book_hotel` · `book_rental` · `info_visa` · `info_fees`(→ pre_travel) · `book_general` · `none`

### sub_id / tracking

| 채널 | 12Go | Trip.com |
|---|---|---|
| 플래너 | `{slug}-planner-route-{id}` | trip_sub1 플래너 계열 |
| 채팅 | `{slug}-chat-route-{id}` | trip_sub1 `채팅 항공권` (신규 sub3) |

---

## 6. 구현 일정 (세션 분할)

### Phase M (MOONi — §2)

| 세션 | 범위 | QA |
|---|---|---|
| **M1** | slug 해석 · destination 갱신 · 목적지 칩 | 발리 · gili-meno · jakarta |
| **M2** | = **S1~S2** | gili-meno access + ferry intent |
| **M3** | **S3~S4 완료** · S5 UI 승인 대기 | prep CTA · planner 링크 fix |
| **M4** | §2.6 M4-A~B · Docent 통합 | PlaceCard MOONi 노출 · G9 |

### Phase 2a (PlaceCard + MOONi 공통)

| 세션 | 범위 | 산출 | QA |
|---|---|---|---|
| **S1** | `chatIntentClassifier` · `destinationBookingProfile` · `resolveDepartureIataFromChat` | intent + gili-meno profile | classifier 단위 |
| **S2** | `chatBookingResolver` — flight·ferry·planner URL 위임 | Trip DPS + ferry SSOT | B·C intent |
| **S3** | essentialGuide 연동 — pre_travel·visa·transfer·getMultiLinks 추출 | prep·pickup CTA | F·G·E (gili-meno) |
| **S4** | persona·prompts · `usePlaceChat`/`ChatModal` wiring | AI CTA 안내 | A 복합 stack |
| **S5** | BookingActionCards 2섹션 UI — [§2.7](2026-05-22-ai-chat-booking-cta-handoff.md) | A교통·B출발전 | gili-meno A·C·E·F |
| **S6** | gili-meno A~J QA · jakarta 회귀 | — | 로컬 Pass · **gateo.kr G·잔여 시나리오** |
| **S7+** | **LOP 경유** · 12Go API | 발리 stack 안정 후 | lombok-gili + LOP flight |
| **S8** | **선택형 대화** — [§2.9](2026-05-22-ai-chat-booking-cta-handoff.md) | `mooniQuickReplies` · `MooniQuickReplyChips` | gili-meno Q1~Q4 · jakarta Q3 |
| **M4-C** | PlaceCard MOONi 진입 정리·크기·(선택) 드래그 — [§2.8](2026-05-22-ai-chat-booking-cta-handoff.md) | `PlaceChatPanel` · drag hook | scroll-top·연관 칩 non-overlap |

---

## 7. 길리 메노 QA 매트릭스 (A~J)

| # | 발화 | 기대 CTA |
|---|---|---|
| A | 서울에서 어떻게 가? | Trip ICN→DPS + ferry bali-gili (+ transfer) |
| B | 항공편 넣을 수 있나요? | Trip flight |
| C | 페리 예약 | 12Go + direct (Eka Jaya 등) |
| D | 롬복에서 배 | lombok-gili 12Go (**LOP 항공은 S7+**) |
| E | 공항 픽업 | Klook airport-transfers |
| F | 비자 필요? | molina e-VOA |
| G | 관광세? | pre_travel URL (lovebali 등) · 금액 AI 단정 금지 |
| H | 렌터카? | Klook DPS · 섬 내 차량 없음 힌트 |
| I | 숙소 | MRT / Trip hotel override |
| J | 예약 방법 (모호) | 복합 stack + planner 링크 |

---

## 8. 기존 Phase 1 파일

| 파일 | 역할 |
|---|---|
| [`bookingIntentResolver.js`](src/utils/bookingIntentResolver.js) | 12Go·페리 (Phase 2a에서 ground 전담 또는 내부화) |
| [`BookingActionCards.jsx`](src/components/chat/BookingActionCards.jsx) | 채팅 CTA UI |
| [`usePlaceChat.js`](src/components/PlaceCard/hooks/usePlaceChat.js) · [`ChatModal.jsx`](src/pages/Home/components/ChatModal.jsx) | resolver 호출 |
| [`MooniAgentFab.jsx`](src/pages/Home/components/MooniAgentFab.jsx) | MOONi FAB (Phase M 진입) |
| [`prompts.js`](src/pages/Home/lib/prompts.js) | BOOKING_RULES (PLANNER) · MOONi prompt |

---

## 9. 금지·제약

- `travelSpotFerries.json` · `travelSpotTransport.json` · `travelSpotAirports.json` **직접 수정 금지**
- UI 레이아웃 대变更 **사용자 승인 후**
- commit·배포 **요청 시만**
- AI **URL 환각 금지** — resolver·툴킷 pre_travel·OFFICIAL_VISA_LINKS만

---

## 10. 다음 세션 제시어

### A. MOONi M1 (slug 해석 — **권장 첫 세션**)

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md

## 목표
MOONi 홈 채팅 Phase **M1** — 자유 발화 → slug 해석 · 세션 destination 갱신 · 목적지 칩 UI.

## Handoff 요약
- MOONi: `handleStartChat('MOONi')` · `isMooniSession` · 현재 slug=null → CTA 불가.
- 1차: useSearchEngine / travelSpotResolve (홈 검색 SSOT). 애매하면 후보 칩 2~3개.
- slug 확정 시 trip/chat `destination` 갱신. PlaceCard URL·예약 CTA는 M2~M3.

## 이번 세션 작업 (코드)
1. `src/utils/resolveDestinationFromChat.js`(가칭) — 발화+히스토리 → { slug, name, confidence, candidates[] }
2. `ChatModal` / `useHomeHandlers` — MOONi 세션 destination 갱신 · onUpdateChat
3. 채팅 UI — 목적지 확인 칩 · (선택) `/place/:slug` 링크
4. MOONi prompt — 목적지·플래너 위임 규칙 1~2문장

## QA (로컬)
MOONi: 「길리 메노 가고 싶어」「발리 여행」→ slug·칩 표시. 「조용한 섬」→ 후보 제시(자동 확정 X).

## 금지
ferry/transport/airports JSON 직접 수정 · UI 대变更 · commit 없이 완료 단정 X
```

### B. Phase 2a S1~S2 (M2 — slug 바인딩 후)

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md

## 목표
AI 채팅 예약 CTA Phase 2a — **세션 S1~S2** 구현 (MOONi·PlaceCard 공통).

## Handoff 요약
- **M1(slug) 완료 후** 진행 권장. 기준 여행지: gili-meno (복합). 자카르타는 회귀만.
- 링크 SSOT는 **플래너 재사용** (Trip.com·ferryBookingMatch·PreTravelChecklist·getMultiLinks·essential_guide.pre_travel). 관광세는 constants 신규 X — pre_travel URL.
- LOP 경유는 **발리(DPS) stack QA 후** (S7+).

## 이번 세션 작업 (코드)
1. `src/utils/chatIntentClassifier.js` — access_route, book_flight, book_ferry, info_visa, info_fees(pre_travel), book_transfer
2. `src/utils/destinationBookingProfile.js` — gili-meno legs: flight→transfer→ferry, noCarOnIsland
3. `src/utils/resolveDepartureIataFromChat.js` — 서울→ICN
4. `src/utils/chatBookingResolver.js` — flight(Trip DPS) + ferry(기존 resolver 위임) skeleton
5. `usePlaceChat` / `ChatModal` — facade hookup (essentialGuide fetch는 S3에서도 OK, stub 가능)

## QA (로컬)
Place Card gili-meno: 「서울에서 어떻게 가?」「페리 예약」→ Trip+ferry CTA 노출.

## 금지
ferry/transport/airports JSON 직접 수정 · UI 대变更 · commit 없이 완료 단정 X
```

### C. MOONi QA 게이트 + M2 수정 (**다음 세션 권장**)

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md
@plans/2026-05-26-project-log.md

## 목표
MOONi **M1·M2(S1~S2) 사용자 QA** — 아래 게이트 전부 통과 후에만 M3(S3~S5) 착수.

## 선행 코드 (이미 반영됨 · 수정만)
- `resolveDestinationFromChat.js` · `ChatModal` · `DestinationResolutionChips`
- `chatIntentClassifier.js` · `destinationBookingProfile.js` · `chatBookingResolver.js`
- `updateTripDestination` · MOONi FAB 재진입(`gateo_mooni_last_chat_id`)

## QA 게이트 (전부 Pass = M3 진입 OK)

| # | 시나리오 | 기대 |
|---|----------|------|
| G1 | MOONi → 「길리메노 가고싶어」 | slug high · **후보 선택 UI 없음** · 확인 칩만 · 헤더 `길리 메노 · MOONi` |
| G2 | 「조용한 섬」 | **후보 칩 2~3** · 자동 확정 X · (길li bound 상태여도 칩 표시) |
| G3 | 「발li 여행」 | 발li 바인딩 · **CTA 없음**(정보성) |
| G4 | 「자카르타 가고 싶어」 | jakarta 바인딩 · **발li→길li 페리 CTA 없음** |
| G5 | PlaceCard → MOONi FAB | **이전 대화 복원** · generic intro 아님 · 헤더에 여행지명 |
| G6 | gili-meno bound → 「서울에서 어떻게 가?」 | **Trip ICN→DPS** + **12Go 페리**(bali-gili) |
| G7 | gili-meno → 「페리 예약」 | 12Go 페리 CTA |
| G8 | jakarta bound → 「항공편」 | Trip **CGK** · 페리 CTA 없음 |
| G9 | PlaceCard gili-meno 동일 발화 | MOONi와 **동일 CTA SSOT** (회귀) |

## 실패 시 우선 수정
- G1/G2: `resolveDestinationFromChat` · 칩 UI 조건(`destinationPrompt`)
- G3~G4/G8: `chatBookingResolver` intent gating · slug 재바인딩
- G5: `useHomeHandlers` MOONi resume · `sessionStorage`
- G6~G7: `chatIntentClassifier` · `destinationBookingProfile` · Trip sub_id `채팅 항공권`

## Pass 후 다음
M3 — essentialGuide pre_travel·visa · BookingActionCards UI(§6 S3~S5)

## 금지
게이트 미통과 M3 · ferry JSON 직접 수정 · 배포·릴리스 노트(합의 전)
```

### D. MOONi M4-A~B + S5 준비 (**다음 세션 권장**)

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md
@plans/2026-05-26-project-log.md

## 목표
MOONi **여행 맥락 확장** — PlaceCard에서 MOONi 노출(M4-A) · AI Docent → MOONi 단일 세션(M4-B). S5 UI는 승인 후.

## 선행 (이미 반영)
- M3 S3~S4: essentialGuide · visa·pre_travel·픽업 CTA · `placePlannerPath` · ChatModal 닫기 후 `/place/:slug/planner`
- §10-C QA 사용자 확인 · 페리 단독 intent(현재 턴만 분류)

## Handoff §2.6 요약
- `/place/*`에 FAB는 마운트되나 PlaceCard z-[100]에 가려짐 → **노출·진입점** 우선
- Docent(`PlaceChatView`) vs MOONi(`ChatModal`) 이원화 → **trip·resolver·CTA SSOT 통합**
- `/blog`·`/auth` MOONi 비대상

## 이번 세션 작업 (코드)
1. **M4-A**: `MooniAgentFab` z-index/PlaceCard safe-area **또는** PlaceCard 헤더·플래너 MOONi 진입 — slug 선바인딩 `handleStartChat`
2. **M4-B**: PlaceCard 채팅 → MOONi 세션 핸드오프(메시지·trip 정책 합의) · Docent UI 축소/대체 · FAB 이중 노출 제거
3. **(선택) S5**: BookingActionCards 2섹션 초안 — **레이아웃 변경 전 사용자 승인**

## QA
- `/place/gili-meno` 갤러리·플래너 탭에서 MOONi 진입·가시성
- bound 상태 「페리 예약」→ 12Go만 · MOONi vs PlaceCard **동일 CTA**(G9)
- MOONi → 플래너 링크: 채팅 닫힘 + planner 탭
- jakarta 「항공편」 flight-only 회귀

## 금지
ferry/airports JSON 직접 수정 · S5 대형 UI 승인 없이 · releaseNotes 합의 전 · `/blog` MOONi 확장
```

### E. S5 BookingActionCards 2섹션 + S6 QA (**다음 세션 권장**)

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md
@plans/2026-05-26-project-log.md

## 목표
AI 채팅 CTA **S5 구현** — BookingActionCards 2섹션(교통·티켓 / 출발 전 준비) · **S6 QA** (gili-meno A~J · jakarta 회귀).

## 선행 (이미 반영)
- M4-A/B: PlaceCard MOONi 진입 · Docent→MOONi · `mooniPlaceContext` · `/place/*` FAB 숨김
- S5 와이어 합의: handoff **§2.7** — 1-A·2-A·3-A·4-A (Trip 외부 탭 유지)

## 이번 세션 작업 (코드)
1. **`BookingActionCards.jsx`** — provider 기준 A/B 분리 · 섹션 헤더(emerald/amber) · B subtle border · 빈 섹션 숨김
2. **S6 QA**: `/place/gili-meno` MOONi — A「서울에서 어떻게 가?」·C「페리」·E·F·G · jakarta「항공편」 flight-only
3. M4 QA 미완 시: 갤러리·플래너 MOONi 가시성 · G9 동일 CTA · planner 링크 닫기 후 `/place/:slug/planner`

## 금지
resolver·ferry/airports JSON 변경 · Trip modal 채팅 연동(4-A) · releaseNotes 합의 전 · UI 합의 외 레이아웃 변경
```

### F. gateo.kr 배포 QA + S7 준비 (**다음 세션 — 1순위**)

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md
@plans/2026-05-26-project-log.md

## 목표
MOONi Phase 2a **배포 후 QA** — gateo.kr gili-meno **G(관광세)** · A~J 잔여(B·D·H·I·J) · jakarta 회귀.

## Handoff 맥락 (2026-05-26 문서 합의 · 코드 미착수)
- **§2.8 M4-C**: PlaceCard MOONi 진입 3→1~2곳 · 아이콘 소폭 확대 · (선택) 모바일 드래그 — **§10-F Pass 후 §10-G**
- **§2.9 S8**: slug bound 후 **선택형 대화**(quick reply 칩) — 타이핑 최소화 · classifier·resolver 재사용 — **§10-F Pass 후 §10-G**
- 본 세션은 **QA·버그 수정만**. S8·M4-C 구현은 §10-G.

## 선행 (이미 반영·푸시됨)
- S5 BookingActionCards 2섹션 · S6 로컬 QA · ferry CTA fallback · releaseNotes 2026-05-26
- M4-A/B: PlaceCard MOONi 진입 · `/place/*` 홈 FAB 숨김 · Docent→ChatModal 단일 세션

## 이번 세션 작업
1. **배포 확인** 후 `/place/gili-meno` MOONi — **G**「관광세?」(툴킷 `pre_travel` URL · essentialGuide) · **F·E** 회귀
2. QA 매트릭스 **§7** 잔여: **B** · **D**(lombok-gili 12Go만 · **LOP 항공 X**) · **H** · **I** · **J**
3. **jakarta** 회귀: 「항공편」→ Trip CGK · 페리 CTA 없음 (G8)
4. M4 스모크: PlaceCard MOONi 진입 · G9 동일 CTA · planner 링크 닫기 후 `/place/:slug/planner`
5. (선택·**gili-meno A~J Pass 후**) **S7** LOP 경유 flight leg — `destinationBookingProfile`·overrides만 · JSON 직접 수정 금지

## QA 게이트 (Pass = §10-G S8·M4-C 착수 OK)
| # | 시나리오 | 기대 |
|---|----------|------|
| G | gili-meno 「관광세?」 | 출발 전 준비(amber) · pre_travel URL |
| B | 「항공편 넣을 수 있나요?」 | Trip flight |
| D | 「롬복에서 배」 | lombok-gili 12Go · LOP 항공 CTA 없음 |
| H | 「렌터카?」 | Klook DPS · 섬 내 차량 없음 힌트 |
| I | 「숙소」 | hotel CTA |
| J | 「예약 방법」(모호) | 복합 stack + planner 링크 |

## Pass 후 다음
[handoff §10-G](2026-05-22-ai-chat-booking-cta-handoff.md) — S8 선택형 대화 · M4-C PlaceCard MOONi UX

## 금지
ferry/airports JSON 직접 수정 · Trip modal 채팅 연동 · LOP stack gili-meno QA 전 착수 · §10-F 미Pass S8·M4-C 코드 · UI 대형 변경(§2.8·§2.9)
```

### G. 선택형 대화 S8 + PlaceCard MOONi UX M4-C (**§10-F Pass 후 — 2순위**)

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md
@plans/2026-05-26-project-log.md

## 선행
**§10-F gateo.kr QA 전부 Pass** (G·B·D·H·I·J · jakarta · M4·G9)

## 목표
1. **S8** — slug bound 후 quick reply 칩으로 타이핑 최소화 (§2.9)
2. **M4-C** — PlaceCard MOONi 진입 1~2곳 · 아이콘 소폭 확대 · (합의 시) 모바일 드래그 (§2.8)

## Handoff 요약
- 기존 classifier·resolver·BookingActionCards **재사용** — 칩 탭 = user message 주입
- PlaceCard 진입 3중 → footer(데스크) + FAB(모바ile) 상한 · 헤더 pill 제거 검토
- 홈 MooniAgentFab 드래그 로직 공유 가능 · `gateo_mooni_place_fab_pos` 분리

## 이번 세션 작업 (코드)
1. `mooniQuickReplies.js` — profile.legs 기반 칩 SSOT
2. `MooniQuickReplyChips.jsx` + ChatModal intro·턴 하단
3. 출발지 서브 칩 (access_route)
4. (합의 후) PlaceChatPanel 진입점 축소 · MOONi `h-14`→`h-16`

## QA
- gili-meno bound: 칩만으로 A·C·E·F·G 시나리오 · jakarta 페리 칩 없음
- PlaceCard: scroll-top·연관 칩과 FAB non-overlap

## 금지
resolver URL SSOT 변경 · ferry/airports JSON · 진입점 3곳 이상 유지 · UI 합의 없이 대형 레이아웃 변경
```

### H. D 패치 배포 + §10-F 잔여 QA (**다음 세션 — 1순위**)

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md
@plans/2026-05-26-project-log.md

## 목표
§10-F **Full Pass** — D·J·G8 재QA · (합의 시) H/I 구현 또는 §10-G 착수.

## 선행 (본 세션 커밋)
- D: `isFerryRouteQuery` · lombok/bali 출발허브 · lombok-gili ferry 노선 매칭
- PlaceCard: `mooniPlaceContext.slug` 우선 · ferry/access bound 칩

## 이번 세션
1. **배포** 후 gateo.kr — **D**「롬복에서 배」·**J**「예약 방법」·**G8** jakarta「항공편」(CGK·페리 X) · **새 채팅** 또는 PlaceCard 진입
2. **H·I**: 미구현 — `book_rental`/`book_hotel` **구현 착수 여부 사용자 합의** (Klook DPS · hotel CTA · noCarOnIsland 힌트)
3. Full Pass → [handoff §10-G](2026-05-22-ai-chat-booking-cta-handoff.md) S8·M4-C

## QA 게이트 (§10-F 잔여)
| # | 시나리오 | 기대 |
|---|----------|------|
| D | 롬복에서 배 | lombok-gili 12Go · slug=gili-meno · LOP X |
| J | 예약 방법 | flight+ferry stack + planner |
| G8 | jakarta 항공편 | Trip CGK · 페리 X |

## 금지
§10-F 미Pass S8·M4-C · ferry/airports JSON · LOP(S7) gili A~J Pass 전
```
