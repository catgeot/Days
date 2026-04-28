# 2026-04-28 Project Log

이전 일지: [`plans/2026-04-26-project-log.md`](./2026-04-26-project-log.md)

## 오늘 작업 요약

- PlaceCard 플래너 `유심 및 와이파이(connectivity)` 제휴 링크를 `Airalo + Holafly` 2개로 재구성하고, Airalo/Holafly 최신 제휴 URL로 갱신.
- `affiliate.js`의 미사용 Klook Travelpayouts short link를 제거하고, Klook 직접 제휴 딥링크 생성을 `getKlookAffiliateUrl()`로 공통화.
- `교통 및 패스(transport)` 카드의 `글로벌 렌터카` 텍스트 버튼 제거 후 Klook 렌터카 배너 위젯을 추가, `공항 → 항구/목적지 이동(airport_transfer)` 카드에도 동일 728x90 배너 적용.
- 도시별 Klook 렌터카 매핑(`getKlookRentalUrlByLocation`) 추가: 홍콩/마카오/타이베이/이란(Yilan)/도쿄/오사카/교토/홋카이도(훗카이도/북해도)/규슈(후쿠오카·구마모토), 미매칭 시 글로벌 폴백.
- `USE_KLOOK_LOCALE_PATH` 토글 도입 후 `/ko/car-rentals` 경로 테스트(현재 `true`), Travelpayouts linkswitcher(`emrld`)가 최종 URL 파라미터를 재작성할 수 있음을 확인.

## 확인/메모

- 모든 수정 파일 lint 확인 완료(`No linter errors found`).
- Klook이 Travelpayouts에서 분리된 뒤 실제 운영 URL 파라미터 유지 상태는 추가 모니터링 필요.

## 추가 반영 (야간 UI 조정)

- 플래너 `현지 도착 및 이동` 섹션에 Airalo/Holafly 이미지 배너 컴포넌트(`AiraloBannerWidget`, `HolaflyBannerWidget`)를 추가하고, 배너 2종을 `유심 및 와이파이` 카드 **하단**으로 재배치.
- Airalo 배너는 Airalo Press Kit 2페이지 이미지를 추출해 배경으로 적용(`public/airalo-page2.png`), Holafly는 제공받은 리더보드 이미지를 정적 자산으로 반영(`public/holafly-asia-banner.png`).
- 배너 카피는 한국어 기준으로 정리하고 모바일 가독성을 위해 `break-keep`을 적용, Airalo 브랜드 칩 및 `200+ 지원 지역` 배지 대비를 소폭 개선.
- 렌터카 배너 중복 노출을 정리해 `ToolkitCard`에서 `airport_transfer` 카드에만 `KlookCarBannerWidget`을 유지하고 `transport` 노출은 제거.
