# 2026-05-18 Project Log

이전 일지: [`plans/2026-05-17-project-log.md`](./2026-05-17-project-log.md)

## 플래너 Trip.com 항공권 제휴 (완료)

### 배경

- 항공권 CTA가 Travelpayouts 화이트라벨(`flights.gateo.kr`) 기반이라 플래너 탭 이탈·검색 UX가 다소 딱딱함.
- 트립닷컴 제휴 마이그레이션 중 — 항공부터 Trip.com으로 전환.

### 구현

- **`affiliate.js`**: `buildTripcomPlannerFlightUrl`, `getPlannerFlightArrivalIata`, `TRIPCOM_FLIGHT_AD`(S17104971). 출발 `dAirportCode=ICN`, 도착 `aAirportCode`는 `resolveRentalPickupBannerInfo` SSOT.
- **`TripcomFlightBannerWidget`**: 제휴 ad iframe 900×200, 카드 폭 스케일, `data-tripcom-arrival-iata` 디버그 속성.
- **`PlannerTab`**: 스마트 툴킷 상단 **트립링크 패키지 배너** → Trip.com 항공 배너(모바일 포함). 뱃지 **「제휴링크」** 우측 상단.
- **`WhiteLabelWidget`**: Trip.com 항공 홈 새 탭, 여행지별 URL. 미사용 `hotel` 분기·iframe 모달·`HotelWidget.jsx` 제거.
- **`ToolkitCard` / `PreTravelChecklist`**: 항공 버튼만 유지(배너는 툴킷 상단 단일 노출).

### QA (당일)

- 배너·전체 화면 링크 모두 **도착지 자동 입력** 및 검색 정상 확인.

### 다음 세션

- **여행지–공항 매칭** 전수·엣지 검수(`travelSpotAirports.json`, live 툴킷, `audit:airports`) — 완성도 핵심.
