# 2026-05-17 Project Log

이전 일지: [`plans/2026-05-14-project-log.md`](./2026-05-14-project-log.md)

## 여행지–도착 공항 SSOT·스크립트

- **`travelSpotAirports.json`**: slug별 `primaryIatas`·`preferredLinkIata`·`bannerNote`(244 unique slug / `travelSpots` 245행, `berlin` 중복 1건).
- **스크립트**: `generate-travel-spot-airports.mjs`, `audit-rental-airports.mjs`, `enrich-travel-spot-airports-ai.mjs`(리포트만). npm: `generate:airports` · `audit:airports` · `enrich:airports`.
- **오버라이드** `scripts/data/travel-spot-airport-overrides.mjs` 65곳 — low 신뢰 6곳 검수(XCH·HLE·KCH·보르네오 등).
- **운영 가이드**: [`plans/travel-spots-management.md`](./travel-spots-management.md) (대량 여행지 추가·헬스체크).

## 플래너 배너·허브 보정

- **보라카이**: KLO(칼리보)·MPH(카틱란) 다중 공항, MPH 한글명 `카틱란 공항`으로 정리.
- **엘니도·팔라완**: ENI·PPS·MNL, 엘니도 `bannerNote`에 MNL→ENI / PPS 육로 루트 비교.
- **`RentalPickupBanner`**: 단일 공항에도 `bannerNote`·`whitespace-pre-line` 표시.

## Supabase

- **`update-place-toolkit`**: `primary_arrival_airports_iata`·`journey_timeline` (IATA) 프롬프트 — `phdjnbfitvmrguqzverm`에 `--no-verify-jwt`로 배포. 기존 DB 툴킷은 재실행 시에만 반영.

## 후속

- 대륙별 플래너 배너 샘플 5곳 수동 확인, `berlin` slug 중복 정리.
