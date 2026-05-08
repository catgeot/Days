# 2026-05-08 Project Log

이전 일지: [`plans/2026-05-07-project-log.md`](./2026-05-07-project-log.md)

## 플래너 명소/제휴 위젯 운영 정리

- `map_poi` 투어 노출 정책을 위젯 중심으로 정리: 일반 지역은 `KlookTourBannerWidget`, Klook 커버리지 약한 지역은 `GetYourGuideCityWidget` 폴백.
- GYG 도시 매핑 확장: 카나리아 제도(416), 코르시카(1534), 피오르드랜드(32367), 잔지바르(871) 추가.
- Klook 투어 검색어를 `여행지명 어트랙션`에서 `여행지명 투어`로 변경해 검색 품질을 보정.
- 투어 텍스트 링크(클룩)는 제거하고, 투어 CTA는 배너 위젯(클룩/겟유어가이드)만 유지.

## 공항픽업/렌터카 링크 동작 보정

- 렌터카 배너(`KlookCarBannerWidget`)를 목적지 딥링크(`getKlookRentalUrlByLocation`)로 열리도록 오버레이 클릭 처리 추가.
- 공항픽업 링크는 검색 경유 대신 운영 결정에 맞춰 `https://www.klook.com/ko/airport-transfers/` 고정으로 단순화.

## 다이닝 링크 분기 정책 개선

- 다이닝 정책을 `Klook 전략 지역 -> 대안 플랫폼 매핑(TheFork/Tabelog 등) -> 범용 대안` 구조로 재정의.
- Klook 미지원/저효율 지역 키워드 블록리스트를 도입해 빈 결과 유입을 줄이고, 미매칭 시 구글맵 레스토랑 검색으로 폴백.
- 잔지바르는 다이닝 링크를 숨김 처리 유지.

## 유지보수 리팩터링

- 지역별 운영 규칙을 `src/components/PlaceCard/tabs/planner/locationRules.js` 단일 파일로 통합.
- `GetYourGuideCityWidget`/`planner/utils`의 하드코딩 규칙을 제거하고 공통 규칙 파일을 참조하도록 정리.
