# 플래너 공항 배너 — airportsIndex last-resort

**작성**: 2026-07-19  
**상태**: 계획 합의 · **구현은 다음 세션**  
**일지**: [`2026-07-19-project-log.md`](./2026-07-19-project-log.md)  
**관련**: [`.ai-context.md`](../.ai-context.md) 6절 · Heuristic SSOT와 **범위 분리**

---

## 한 줄

배너 cascade **맨 끝**에만 시네마·Trip과 같은 `findNearestAirportInIndex`를 붙인다. SSOT 통합·Supabase 배너 조회·uiPlace 풀머지 원복은 하지 않는다.

---

## 배경 (검토 결론)

- Supabase `airports`/`air_routes` = 항공 **경로**용. Edge `toolkitAirportCoords` = 툴킷 **지리 검증 번들**(DB 행 중복 아님).
- EG 전 배너는 bake JSON + `rentalAirportHubs`만 — 시네마는 이미 `airportsIndex`라 양곤·부탄도 dest가 보임.
- `b528d47` uiPlace 격리 후, 허브 없는 유명 지명(양곤 RGN·부탄 PBH)은 배너 공백. 만달레이(MDL hub)는 정상.
- 같은 `resolveRentalPickupBannerInfo`가 EG **전·후** 재사용 → index는 **항상 last-resort**(curated/EG를 덮지 않음).
- 툴킷 실행 후: EG `primary`(+거리 필터)로 배너 갱신 — **현행 유지**. high curated가 EG보다 앞설 수 있음.

---

## 범위 / 비범위

**범위**: [`rentalAirportMatch.js`](../src/utils/rentalAirportMatch.js) — `resolveRentalAirport` / 배너 cascade 끝단 index 폴백.

**비범위**: spots JSON 직접 수정 · RENTAL_MULTI만 수정 · Heuristic Phase · role bag · Edge/Supabase 재설계 · far uiPlace 풀머지 원복 · 도시마다 hub 수동 나열(주경로).

---

## 완료 기준

- 양곤·부탄: EG 전 배너 IATA · EG 후는 툴킷/curated 우선.
- 만달레이 회귀 없음 · far 오흡수 없음 · 소규모 공백 허용.
- 사용자 QA 전 「완료」 단정 금지.
