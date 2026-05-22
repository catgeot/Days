# AI 채팅 예약 CTA 2단계 — Handoff (2026-05-22)

**상태**: Phase 1 완료(12Go·페리 CTA) · **Phase 2a 설계 완료 · 구현 대기**  
**기준 여행지**: **길리 메노** (`gili-meno`) — 다구간·다제휴 스트레스 테스트  
**회귀 여행지**: 자카르타 (`jakarta`) — flight-only 단순 케이스  
**Cursor Plan**: [`.cursor/plans/` 또는 사용자 plans] `ai_채팅_예약_cta_2단계_ef412bcd.plan.md`

---

## 1. 배경·목표

gateo.kr Place Card / Home Chat에서 AI 대화 시 **대화 intent에 맞는 예약·준비 링크 CTA**를 자동 노출한다.

- **Phase 1 (완료)**: `bookingIntentResolver.js` — 예약 키워드 → 12Go·페리 SSOT  
- **Phase 2a (다음)**: intent 확장 + **플래너와 동일한 링크 SSOT 재사용** + 복합 여정 stack  
- **Phase 2b**: 12Go API (Guido)  
- **Phase 3**: in-chat checkout vs redirect 정책

**LOP(롬복) 경유 여정**: 발리(DPS) 경유 stack이 QA 통과한 **후** 추가 (Phase 2a 후반 또는 2b). 현재 공항 SSOT는 gili-meno → **DPS 단일**만.

---

## 2. Phase 1 한계 (재현 버그)

| 발화 (gili-meno) | 현재 | 기대 |
|---|---|---|
| 서울에서 어떻게 가? | CTA 없음 · INSPIRER | flight(DPS) + ferry + (선택) transfer |
| 페리 예약 | 키워드 있을 때만 12Go | ferry SSOT bali-gili / lombok-gili |
| 공항 픽업 / 비자 / 관광세 | 없음 | 플래너와 동일 링크 |

근본 원인: `detectBookingIntent`가 **예약 키워드만** 인식 · Trip.com·Klook·툴킷 pre_travel 미연동.

---

## 3. 플래너 = 링크 SSOT (채팅 resolver가 재사용할 것)

**원칙**: 채팅용 URL·제휴 파라미터를 새로 만들지 말고, 아래 플래너 경로를 **import·호출**한다.

### 3.1 UI·진입점 ([`PlannerTab.jsx`](src/components/PlaceCard/tabs/PlannerTab.jsx))

| 플래너 영역 | 컴포넌트 | 링크 종류 |
|---|---|---|
| 상단 | [`TripcomFlightBannerWidget`](src/components/PlaceCard/tabs/planner/components/TripcomFlightBannerWidget.jsx) | Trip.com 항공 (ad iframe / `/flights/`) |
| 상단 | [`RentalPickupBanner`](src/components/PlaceCard/tabs/planner/components/RentalPickupBanner.jsx) | 도착 IATA · 렌터카 hub |
| 출발 전 | [`PreTravelChecklist`](src/components/PlaceCard/tabs/planner/components/PreTravelChecklist.jsx) | **툴킷 pre_travel**(비자·관광세 등) + 항공·숙소·**Klook 픽업** |
| 여정 | [`JourneyTimeline`](src/components/PlaceCard/tabs/planner/components/JourneyTimeline.jsx) | 다구간 설명 |
| 카드 | [`ToolkitCard`](src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx) + [`getMultiLinks`](src/components/PlaceCard/tabs/planner/utils.js) | visa · transport · accommodation · … |
| 페리 | [`FerryBookingWidget`](src/components/PlaceCard/tabs/planner/components/FerryBookingWidget.jsx) | [`ferryBookingMatch.js`](src/utils/ferryBookingMatch.js) |

### 3.2 URL·제휴 함수

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

### 3.3 gili-meno 데이터 SSOT (JSON 직접 수정 금지)

| SSOT | 값 |
|---|---|
| 공항 | DPS 단일 ([`travelSpotAirports.json`](src/pages/Home/data/travelSpotAirports.json)) |
| 페리 | tier `required` · bali-gili · lombok-gili ([`travel-spot-ferry-overrides.mjs`](scripts/data/travel-spot-ferry-overrides.mjs)) |
| transport | slug 없음 (bali SSOT에 jakarta-bali만) |

---

## 4. Phase 2a 아키텍처 (구현 청사진)

```
userText + chatHistory + location + essentialGuide
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

## 5. 구현 일정 (세션 분할)

| 세션 | 범위 | 산출 | QA |
|---|---|---|---|
| **S1** | `chatIntentClassifier` · `destinationBookingProfile` · `resolveDepartureIataFromChat` | intent + gili-meno profile | classifier 단위 |
| **S2** | `chatBookingResolver` — flight·ferry·planner URL 위임 | Trip DPS + ferry SSOT | B·C intent |
| **S3** | essentialGuide 연동 — pre_travel·visa·transfer·getMultiLinks 추출 | prep·pickup CTA | F·G·E (gili-meno) |
| **S4** | persona·prompts · `usePlaceChat`/`ChatModal` wiring | AI CTA 안내 | A 복합 stack |
| **S5** | BookingActionCards 섹션 UI (**사용자 UI 승인 후**) | 다섹션 CTA | 모바일 Trip modal |
| **S6** | gili-meno A~J QA · jakarta 회귀 | — | gateo.kr |
| **S7+** | **LOP 경유** · 12Go API | 발리 stack 안정 후 | lombok-gili + LOP flight |

---

## 6. 길리 메노 QA 매트릭스 (A~J)

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

## 7. 기존 Phase 1 파일

| 파일 | 역할 |
|---|---|
| [`bookingIntentResolver.js`](src/utils/bookingIntentResolver.js) | 12Go·페리 (Phase 2a에서 ground 전담 또는 내부화) |
| [`BookingActionCards.jsx`](src/components/chat/BookingActionCards.jsx) | 채팅 CTA UI |
| [`usePlaceChat.js`](src/components/PlaceCard/hooks/usePlaceChat.js) · [`ChatModal.jsx`](src/pages/Home/components/ChatModal.jsx) | resolver 호출 |
| [`prompts.js`](src/pages/Home/lib/prompts.js) | BOOKING_RULES (PLANNER) |

---

## 8. 금지·제약

- `travelSpotFerries.json` · `travelSpotTransport.json` · `travelSpotAirports.json` **직접 수정 금지**
- UI 레이아웃 대变更 **사용자 승인 후**
- commit·배포 **요청 시만**
- AI **URL 환각 금지** — resolver·툴킷 pre_travel·OFFICIAL_VISA_LINKS만

---

## 9. 다음 세션 제시어

아래 블록을 새 Cursor 채팅에 붙여넣으면 된다.

```
@.ai-context.md
@plans/2026-05-22-ai-chat-booking-cta-handoff.md

## 목표
AI 채팅 예약 CTA Phase 2a — **세션 S1~S2** 구현.

## Handoff 요약
- 기준 여행지: gili-meno (복합). 자카르타는 회귀만.
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
