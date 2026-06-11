# 2026-06-11 프로젝트 일지

**이전**: [`2026-06-09-project-log.md`](./2026-06-09-project-log.md)

## 도착 공항 매칭 (플래너 배너·Trip.com)

- **미야코지마**: `SHI`·`MMY` 다중공항, 직항 기본 SHI (`overrides` + `generate:airports`)
- **랄리벨라**: `preferredLinkIata` ADD→**LLI** (국제선 경유·최종 분리)
- **아이투타키·티라나 등 툴킷-only**: 허브 **AIT**·**TIA** 추가; 파서 오탐 보정(`티라(?!나)`, `(?<![로])통가`)
- **추가 검수(동일 일)**: `costa-rica` SJO·LIR · `la-spezia` FCO·MXP·FLR·PSA · `cape-verde` SID·RAI · `콘다오` SGN→**VCS** (허브 LIR·PSA·RAI·VCS)
- **`generate:airports`**: `TRAVEL_SPOT_PLACE_ID_OVERRIDES` → JSON `placeIds` 병합 · `linkedSlug` curated 폴백
- `audit:airports` **none: 0** · 가이드 [`travel-spots-management.md`](./travel-spots-management.md) §3·§5·§6 갱신
- **다음 세션**: 항공권·배너 매칭 세부 조정 이어감 (릴리스 노트는 합의 후)
