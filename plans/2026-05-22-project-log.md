# 2026-05-22 프로젝트 일지 — 홈 Mapbox 글로브 모바일 배포 수정

**직전**: [`2026-05-21-project-log.md`](2026-05-21-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

## 배경

gateo.kr 모바일 홈에서 Mapbox가 아닌 **legacy 지구본**(`react-globe.gl`, blue-marble 텍스처)이 로드됨. 데스크톱은 Mapbox 정상.

---

## 원인

배포 번들(`index-CTrugvuC.js`)의 `HomeGlobeAdapter`가 **모바일 User-Agent에서 무조건 `legacy`**를 선택하는 구버전 로직이었음.

```javascript
// 배포된 문제 코드 (PROD/DEV 구분 없음)
if (/android|iphone|ipad|ipod|mobile/i.test(ua)) return 'legacy';
```

`4586c17`(2026-05-08)에서 `import.meta.env.PROD`일 때 Mapbox 우선으로 수정됐으나, **프로덕션 번들에는 반영되지 않은 상태**였음. Mapbox 토큰(`VITE_MAPBOX_TOKEN`)은 빌드에 포함되어 있었음.

---

## 변경 (`a7e4eef`, gateo.kr 배포·모바일 QA 통과)

| 파일 | 내용 |
|------|------|
| `resolveHomeGlobeEngine.js` | 엔진 선택 분리 — **PROD + 토큰 있음 → 항상 mapbox**, DEV 모바일만 legacy |
| `HomeGlobeAdapter.jsx` | 위 resolver 사용 |
| `scripts/verify-globe-engine-build.mjs` | `npm run build` 후 프로덕션 번들에 모바일 legacy 분기 잔존 시 **빌드 실패** |
| `package.json` | build 스크립트에 검증 연결 |

로컬 프로덕션 빌드: `useMemo(()=>Cl({mapboxToken:...}))` → `return t?i?"mapbox":...` (PROD-first).

---

## QA (모바일)

- gateo.kr 홈 — Mapbox 위성 지구본 · 우측 상단 공유/GPS/우주 복귀 버튼 확인 완료.

---

## 운영 메모

- **DEV 모바일 → legacy**는 유지 (LAN QA 시 Mapbox 토큰 URL 제한 403/CORS). 배포 경로만 Mapbox.
- 재발 방지: `npm run build` 시 `[verify-globe-engine] OK` 필수. esbuild minify 변경 시 `scripts/verify-globe-engine-build.mjs` 패턴 동기화.

---

## 플래너 Trip.com 모바일 항공 검색 (완료·배포 대기)

### 배경

5-19 `edf1408` 이후 모바일 **「항공권 실시간 검색」** CTA가 Trip.com 항공 홈으로만 연결되고 **도착지(`aAirportCode`) 자동입력**이 빠짐. 배너 iframe(ad URL)은 정상. 원인: 모바일 CTA가 `/flights/` 직링크 + `_self` 이동(`location.assign` Referer) — `ce2ee7a`의 `noreferrer`만으로는 `/flights/` 경로에서 미해결.

### 구현

| 파일 | 내용 |
|------|------|
| `partnerNavigation.js` | `buildTripcomPlannerNavigationUrl` · 모바일 ad URL · `buildTripcomPlannerFlightModalSrc` |
| `TripcomFlightSearchModal.jsx` | 모바일 전체화면 — iframe 320×480 **중앙 정렬** · `createPortal` + `z-[9999]`(PlaceCard 헤더 `z-[150]` 위) |
| `TripcomFlightSearchContext.jsx` | `TripcomFlightSearchProvider` · CTA·배너·필수준비에서 모달 오픈 |
| `WhiteLabelWidget` · `PreTravelChecklist` · `TripcomFlightBannerWidget` | 모바일 → 외부 Trip.com 대신 앱 내 모달 |
| `PlannerTab` | Provider 래핑 |

데스크톱: 기존 `/flights/` 새 탭 + Referer(gateo 복귀 링크) 유지.

### QA (gateo.kr·실기기)

- Trip.com 모바일 CTA·전체 화면 모달 · ICN→도착 IATA · 헤더·닫기 **OK**.
- Vercel Production `e840a1e` 배포 · `verify-globe-engine` 빌드 **OK**.

### 운영

- 모바일 Trip.com **항공 홈(`/flights/`) 직진**은 Trip 측 Referer·URL 정책상 어려움 — ad iframe 모달이 현재 SSOT.

---

## 빌드 hotfix (`e840a1e`)

- `verify-globe-engine-build.mjs`: esbuild minify `return t?a?"mapbox"` 패턴 추가 — Vercel build 실패 해소.

---

## 보로부두르 도착 공항 (JOG → YIA)

- **원인**: `travel-spot-airport-overrides`·`rentalAirportHubs`가 구 **아디수치프토(JOG)** 고정, 툴킷 여정은 **족자카르타(YIA)** 최종 도착.
- **수정**: `YIA` 허브 추가, `borobudur` 오버라이드 `preferredLinkIata: YIA`, `generate:airports` · `audit:airports` **none:0**.
- **정리**: 배너·후보에서 **JOG 제외** — `primaryIatas: ['YIA']` 단일, `bannerNote`는 CGK/DPS 경유·YIA 도착만 안내.

## 핏케언 제도 배너·여정 정렬

- **연동 공항 PPT 유지** — 국제선·타히티 대기·렌터카 제휴 기준. GMR은 렌터카 후보에 넣지 않음.
- **GMR** `rentalAirportHubs` 추가, `bannerNote`에 PPT→GMR→페리·전용선 여정 명시.

## 라로통가 도착 공항 (TBU → RAR)

- **원인**: `toolkit-sync`가 통가(TBU)를 `preferredLinkIata`로 잡음 — 플래너·항공 팁은 RAR·AKL 경유.
- **수정**: `rarotonga` curated `RAR` 단일, AKL·날짜변경선은 `bannerNote`만.

## 흐바르 도착 공항 재발 (DBV → SPU)

- **원인**: `travel-spot-airport-overrides.mjs` 맨 앞 `hvar` 행이 **DBV**로 남아 `generate:airports`가 5/21 SPU 수정을 덮음.
- **수정**: `hvar` → `SPU` 단일, DBV·ZAG는 `bannerNote`(귀국 아웃)만.

## 로포텐 다중 공항 재발

- **원인**: `toolkit-sync`(BOO·EVE·OSL, `bannerNote` 없음)가 `RENTAL_MULTI_AIRPORT_DESTINATIONS`보다 우선 — `overrides.mjs`에 `lofoten` 없음.
- **수정**: curated `BOO·EVE·LKN·SVJ`, 연동 **EVE**, `searchHintIatas` 4종, 권역 `bannerNote`·OSL은 경유만 안내.

---

## 페리 SSOT·플래너 UI (흐바르·바르셀로나·몰타·로포텐)

- **다중 노선**: `hvar`·`barcelona`에 12Go 검증 URL별 `routes` 2개 — `dfRecommendations`만으로는 배너 미생성이던 패턴 정리.
- **몰타**: `고zo` 오타 → 고조, 발레타·슬리에마·치르케우아 노선 3개 + `tips` 노선 카드 표시.
- **로포텐**: `lofoten` 페리 SSOT 신규(Torghatten 18-782) — 12Go·Direct Ferries·Klook **미등록**이라 공식 링크만. `dfRecommendations` 중복 제거·경유/직항 `tips` 통합.
- **UI**: `FerryBookingWidget` — SSOT 노선 있으면 「추천 노선」 박스 숨김(설명 2줄 이상 `tips` 시), 「예약·시간표 노선」 제목·`tips` 렌더. `ToolkitCard` — SSOT 있을 때 AI `advice` 없으면 「관련 정보…」 오류 문구 숨김.
- **명령**: `npm run generate:ferries` · `audit:ferries` **0 gap** (34 spots, multiRoute 10).

---

## AI 채팅 예약 CTA Phase 2 — 설계·handoff (구현 대기)

- **Phase 1**: `bookingIntentResolver` · `BookingActionCards` · PlaceChat/ChatModal (12Go·페리, 예약 키워드 gate).
- **Phase 2a 설계**: 기준 **gili-meno**(항공·픽업·페리·비자·관광세·렌터카). 링크 SSOT = **플래너 재사용** (`getMultiLinks`, `PreTravelChecklist`, Trip.com, `pre_travel[]`). **LOP 경유는 발리 stack QA 후**.
- **Handoff**: [`2026-05-22-ai-chat-booking-cta-handoff.md`](2026-05-22-ai-chat-booking-cta-handoff.md) · `.ai-context` 5·6절 갱신 · 구현 S1~S6 세션 분할.
