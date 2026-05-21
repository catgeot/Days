# 페리 SSOT 검증·운영 가이드

**상태**: 2026-05-21 — SSOT 33곳 `confidence: high`·감사 `review hints: 0` 완료. UI(공항 셔틀·터미널·페리 통합)는 이후 단계.

**관련**: [`travel-spots-management.md`](travel-spots-management.md) 4~5절 · [`destination-airport-identity-plan.md`](destination-airport-identity-plan.md)

---

## 1. 목표

여행자가 사전 조사하기 어려운 **항구·페리·쾌속선 예약**을, 공항 SSOT와 같은 방식으로 구조화한다.

| 원칙 | 설명 |
|------|------|
| **출처 있는 링크만** | `travel-spot-ferry-overrides.mjs`에 검증 후 등록. 임의·AI 단독 URL은 플래너 버튼으로 노출하지 않음 |
| **허용 provider** | `direct`(로컬 운항사 공식) · `direct_ferries` · `twelve_go` · `klook_ferry`(fallback) |
| **Trip.com** | 페리 SSOT에는 아직 미포함. 크루즈·복합 일정은 타임라인 `getTripcomCruiseUrl()`과 역할 분리 후 검토 |
| **JSON 직접 편집 금지** | `travelSpotFerries.json` ← `generate:ferries`로만 갱신 |

---

## 2. 현재 커버리지 (2026-05-21)

| 구분 | 수치 |
|------|------|
| 전체 여행지 (`travelSpots`) | ~265 |
| 페리 SSOT 등록 (`travelSpotFerries.spots`) | **33** (전부 `curated-override`) |
| 플래너 카드 노출 (`required` + `common`) | **29** |
| `confidence: medium` (재검수 큐) | **0** |
| Direct Ferries만 (`twelve_go`·`direct` 없음) | **0** (지중해 9곳 12Go·선사 보강 완료) |
| 다중 노선 (`routes.length > 1`) | **7** |

**265곳 전수 검증은 하지 않는다.** SSOT 33곳은 전수 검증, 나머지는 `generate:ferries` 후보·섬/페리 키워드로 **큐레이션 큐**만 운영한다.

---

## 3. 검증 단계 (권장 순서)

### 3a. 자동 감사

```powershell
cd c:\dev\days
npm run generate:ferries
npm run audit:ferries
```

| 산출물 | 용도 |
|--------|------|
| `scripts/outputs/ferry-audit.json` | gap·DF 불일치·medium·DF-only·URL 누락·공항 배너 힌트·`manualChecklist` 33곳 |
| `scripts/outputs/ferry-candidates.json` | 자동 tier 후보·검수 큐 |

**기대**: `gapCount: 0` (`required`/`common`은 `routes[].bookings` 또는 `fallbacks` 필수).

### 3b. SSOT 33곳 수동 검증 (전수)

노선·링크·소요시간·tier를 체크리스트로 확인 후 `confidence: high` 승격.

| 항목 | 확인 |
|------|------|
| 12Go URL | `/travel/{from}/{to}`가 노선 라벨과 일치 |
| `direct` URL | 해당 노선 운항사 **공식 예약** 도메인 |
| Direct Ferries | DF에 실제 취항·노선이 있을 때만 `direct_ferries` + `directFerries: true` |
| 다중 노선 | 공항 `bannerNote`(KLO/MPH 등)와 노선 스토리 일치 |
| `cruise_only` | 페리 카드 미노출, 크루즈만 Trip.com |

### 3c. 누락 여행지 (기본·신규만)

1. `travelSpots.js` / 신규 slug 추가  
2. [5a tier 판단](travel-spots-management.md#5a-페리-tier-판단-신규-slug마다-1회)  
3. `travel-spot-ferry-overrides.mjs` 등록  
4. `generate:ferries` → 3b와 동일 검증  

페리 irrelevant 지역은 overrides에 넣지 않거나 `tier: none` / `cruise_only`로 오탐 방지.

---

## 4. AI 툴킷 vs SSOT

| 필드 | 출처 | UI |
|------|------|-----|
| `categories.ferry_booking.advice` | Gemini `update-place-toolkit` | ToolkitCard 본문(팁·요금 안내) |
| `categories.ferry_booking.url` | AI (검증 없음) | **SSOT `routes`가 있으면 버튼 미노출** |

런타임: `resolveAiFerryExtraBooking()` — `profile.routes`가 있으면 AI URL 버튼 숨김. SSOT 없을 때만 `[@업체명@]`에서 라벨 추출, 없으면 「추천 예약 링크」.

**「공식 예약」 하드코딩 라벨은 사용하지 않음** (출처 불명 문제).

---

## 5. 플래너 UI (페리 카드)

| 모드 | 조건 | 표시 |
|------|------|------|
| 카드 노출 | `tier` `required`·`common`만 | `shouldShowFerryCard` — AI `ferry_booking`만으로 카드 미노출 |
| 단일 노선 | `routes.length === 1` | 카드 1개 · 12Go **full** 배너(노선명 포함) |
| 다중 노선 | `routes.length > 1` | 노선별 카드 · 12Go **compact** 배너(노선명은 카드 헤더만) · Powered by 12Go **목록 하단 1회** |
| 12Go | `provider: twelve_go` | 노선 URL `/travel/{from}/{to}` — 제휴 `get12GoAffiliateUrl` |
| Direct Ferries | `provider: direct_ferries` | **탐색 홈만** (`getDirectFerriesAffiliateUrl`) · **버튼** — 항구명 딥링크·노선 배너 **사용 안 함** |
| 선사 | `provider: direct` | 12Go 배너 아래 「기타 페리 예약」 버튼 (예: `Jadrolinija · 크로아티아 국영 페리`) |
| 기타 | `fallbacks` | Klook 페리 |

**두브로브니크 예시**: 주 노선 12Go `dubrovnik/split` 1카드 · DF·Jadrolinija 버튼 · `dfRecommendations`에 스타리 그라드(4h) 텍스트 안내.

공항 셔틀·터미널 단계와 한 카드에 묶는 UI는 **데이터 정합 후** 검토.

---

## 6. 공항 SSOT와의 정합 (다음 단계)

지금은 **느슨한 연동**만 권장:

- 공항 `bannerNote`에 「버스·페리」「KLO/MPH」 → 페리 overrides에 대응 노선 추가  
- 보라카이: `travelSpotAirports` KLO·MPH ↔ `caticlan-boracay` / `kalibo-boracay`  

필드 `arrivalAirports`·`steps` 등은 스키마 확장 시 overrides에 추가.

---

## 7. 파일·스크립트

| 파일 | 역할 |
|------|------|
| [`travel-spot-ferry-overrides.mjs`](../scripts/data/travel-spot-ferry-overrides.mjs) | SSOT 입력 |
| [`travelSpotFerries.json`](../src/pages/Home/data/travelSpotFerries.json) | generate 산출물 |
| [`generate-travel-spot-ferries.mjs`](../scripts/generate-travel-spot-ferries.mjs) | 병합·후보 생성 |
| [`audit-ferry-routes.mjs`](../scripts/audit-ferry-routes.mjs) | 감사 리포트 |
| [`ferryBookingMatch.js`](../src/utils/ferryBookingMatch.js) | resolve·AI URL 정책 |
| [`FerryBookingWidget.jsx`](../src/components/PlaceCard/tabs/planner/components/FerryBookingWidget.jsx) | 플래너 UI |

---

## 8. 자주 하는 실수

- AI `ferry_booking.url`만 믿고 overrides 생략 → 중복·불명 「공식 예약」 버튼  
- `direct`에 출처 없는 제3자 URL  
- DF만 넣고 12Go·로컬 선사 미검증 → 유럽 지중해 등에서 실용성 낮음  
- Direct Ferries **항구명 노선 URL** 기대 → 매칭 안 됨. **홈 버튼**만 사용  
- `direct` 라벨에 「공식 선사」만 쓰고 **국영·대표** 맥락 없음 → Jadrolinija 등은 「크로아티아 국영 페리」 권장  
- 공항만 맞추고 페리 tier 생략 → 카드 미노출  
- 265여행지 일괄 전수 → 비용 대비 효율 낮음 (**33곳 + 신규 큐만**)
