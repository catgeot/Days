# 클룩 렌터카 검색어·제휴 데이터 운영 가이드

**작성**: 2026-05-19  
**상태**: 배너 검색어 **여행지명 우선** 적용 완료. `travelSpotAirports` 예외 필드·대량 검수는 **여행지 DB·공항 매칭 작업 완료 후** 진행.

**관련**: [`.ai-context.md`](../.ai-context.md) 6절 · [`travel-spots-management.md`](./travel-spots-management.md) · [`destination-airport-identity-plan.md`](./destination-airport-identity-plan.md)

---

## 1. 왜 역할을 나누는가

클룩 한국어 UI에서 **렌터카 검색**은 다음이 서로 다르게 동작합니다.

| 검색어 유형 | 클룩 적합도 | 예 |
|-------------|-------------|-----|
| **여행지·도시명** | 높음 | `호놀룰루`, `오사카` |
| **정식 공항 전체명** | 낮음 | `다니엘 K. 이누우에국제공항` |
| **IATA 3자리** | 사이트 내 직접 입력용 | `HNL` (배너 URL 자동완성에는 부적합) |

**도착 공항 배너**(`RentalPickupBanner`)·Trip.com·여정 타임라인 IATA 안내는 **항공·픽업** 기준이므로 `rentalAirportHubs` / `travelSpotAirports` SSOT를 그대로 씁니다.

**렌터카 배너**만 검색어를 **여행지 표시명**(`location.name`) 우선으로 둡니다.

---

## 2. UI·URL 역할 (현재 구현)

| UI | 링크·검색 | 코드 |
|----|-----------|------|
| **Klook 렌터카 배너** (공항 이동 카드) | 여행지명(+ `city_id` 딥링크 지역) → `getKlookRentalUrlByLocation` | [`affiliate.js`](../src/utils/affiliate.js), [`ToolkitCard`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx) |
| **공항 픽업 검색** / **렌터카 홈** 버튼 | 렌터카 홈 (`KLOOK_RENTAL_HOME_AD_ID` 1277252) | [`utils.js`](../src/components/PlaceCard/tabs/planner/utils.js) `airport_transfer` |
| **여정 플래너** 렌터카 버튼 | 렌터카 홈 + IATA 보조 문구 | [`JourneyTimeline.jsx`](../src/components/PlaceCard/tabs/planner/components/JourneyTimeline.jsx) |
| **도착 공항 배너** | 표시·복사만 (검색 URL 아님) | [`RentalPickupBanner.jsx`](../src/components/PlaceCard/tabs/planner/components/RentalPickupBanner.jsx) |

배너 하단 문구: [`KLOOK_CAR_BANNER_FOOTER_HINT`](../src/components/PlaceCard/tabs/planner/components/klookBannerLayout.js) — 「여행지명으로 검색… 렌터카 검색 링크 이용」.

---

## 3. 검색어 결정 순서 (배너·`getKlookRentalUrlByLocation`)

런타임 함수: **`resolveKlookRentalBannerSearchLabel`** ([`rentalAirportMatch.js`](../src/utils/rentalAirportMatch.js))

1. **`travelSpotAirports.json`** 해당 slug/placeId 행의 **`klookRentalSearchLabel`** (문자열이 있으면 최우선)
2. 같은 행의 **`klookRentalSearchMode: 'airport'`** → 연동 도착 공항 **한글 공식명** (`resolveRentalPickupBannerInfo` / 허브)
3. **기본**: `location.name` → 없으면 `location.name_en`

그 다음 [`getKlookRentalUrlByLocation`](../src/utils/affiliate.js):

- 홍콩·도쿄·오사카 등 → 기존 **`city_id` 딥링크** (키워드 매칭, 변경 없음)
- 그 외 → `https://www.klook.com/ko/search/result/?query={검색어} 렌터카`

---

## 4. 예외 데이터 스키마 (향후 — JSON에 추가)

여행지·공항 매칭 작업이 끝난 뒤 `travelSpotAirports.json`의 **`spots.{slug}`** 또는 해당 **`placeIds`** 항목에만 넣습니다.

```json
{
  "primaryIatas": ["NRT"],
  "klookRentalSearchLabel": "나리타",
  "klookRentalSearchMode": "destination"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `klookRentalSearchLabel` | `string` | 클룩 검색에 쓸 **고정 문자열** (최우선) |
| `klookRentalSearchMode` | `'airport'` | 명시 시에만 공항 **정식 한글명** 사용. 생략 시 여행지명 |

**권장 예외 후보** (수동 QA 후 추가):

- 공항·짧은 지명이 도시명보다 나은 경우 → `klookRentalSearchLabel: "나리타"` 등
- 공항명이 클룩에서 잘 잡히는 소수 지역만 → `klookRentalSearchMode: "airport"`

**비권장**: 전역 기본을 공항명으로 되돌리기 (오탐 공항 + 클룩 미인덱스 이슈 재발).

### 참고 사례: 호놀룰루

- `rentalAirportHubs`: `HNL` / `다니엘 K. 이누우에국제공항`
- 클룩: **`호놀룰루`** 검색 ✅ · 정식 공항명 검색 ❌  
→ 기본 **여행지명**이 맞음. 별도 필드 없이 `location.name`으로 충분.

---

## 5. 작업 순서 (공항·여행지 DB 완료 후)

1. **QA 샘플** — 지역별로 배너 클릭 → 클룩 검색 결과가 여행지와 맞는지 확인 (유럽·미주·일본·동남아·다중 공항).
2. **예외만 JSON 추가** — §4 필드. `npm run audit:airports` 유지 (`none: 0`).
3. **허브·오버라이드와 분리** — `primaryIatas`·`bannerNote`는 **항공·배너 표시**용; 렌터카 검색어는 **`klookRental*`** 만 수정.
4. **문서·컨텍스트** — 예외 추가 시 이 파일 §6 표에 1줄 기록(선택).

---

## 6. 변경 이력 (요약)

| 날짜 | 내용 |
|------|------|
| 2026-05-19 | 배너 검색어 **여행지명 우선** (`resolveKlookRentalBannerSearchLabel`). 배너 하단 문구 여행지명 기준으로 수정. 링크 버튼은 렌터카 홈 유지. |

---

## 7. AI 세션에서 참고할 명령

```powershell
cd c:\dev\days
npm run audit:airports
npm run sync:airports-from-toolkit
```

렌터카 배너만 손볼 때는 **`affiliate.js`의 `searchLabel`** 과 **`resolveKlookRentalBannerSearchLabel`** 을 함께 볼 것. 공항 배너·Trip.com IATA는 **`resolveRentalPickupBannerInfo`** 를 건드리지 말 것(목적이 다름).
