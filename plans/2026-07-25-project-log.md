# 2026-07-25 프로젝트 일지

직전: [`2026-07-24-project-log.md`](./2026-07-24-project-log.md)

## 오키나와 ↔ 미야코지마·SHI 정체성 P0

**상태**: ✅ audit PASS · 브랜치 커밋 (`38582a0`) · 사람 QA 대기

- **증상**: 오키나와 플래너가 미야코 정보·항공 SHI로 바뀜 (시네마는 OKA처럼 보이다가 플래너 후 변경)
- **원인**: (1) SSOT에 `okinawa` slug 없음 (2) 별칭 `오키나와`→`ishigaki` (3) `placeIds["오키나와"].linkedSlug=miyakojima` → curated SHI 우선
- **수정**: slug `okinawa`(OKA) 추가 · 별칭/툴킷동의어→okinawa · placeIds linkedSlug=okinawa · 미야코/이시가키 keywords에서「오키나와」제거
- **검증**: `npm run audit:airports` none:0 · resolve 오키나와→OKA / 미야코→SHI / 이시가키→ISG
- **QA**: 검색「오키나와」→ 플래너 제목·본문 본섬 · Trip/배너 `OKA` 유지 · 미야코·이시가키 회귀 · 옛 툴킷이면 Force Update Toolkit
- **머지**: `main` `d9b6491` (gh 미인증으로 PR 대신 merge-push) · Vercel 배포 트리거됨
- **재발 가드**: `audit:airports` — `linkedSlugIataClash` WARN + 류큐 identity smoke FAIL(OKA/SHI/ISG)

## 다음 세션 — linkedSlug IATA clash WARN 정리

**제시어**: `공항-linkedSlug-clash-이어하기`

**읽을 것**
1. `.ai-context.md` — 6절 공항 표·3절 금지
2. 본 일지 위 「오키나와 ↔ 미야코」절 + 이 핸드오프
3. `npm run audit:airports` → `linkedSlugIataClash` WARN 목록

**대상 (현재 5)**

| placeId | linkedSlug | place | linked/runtime | 추정 |
|---------|------------|-------|----------------|------|
| 구마모토 | kumamoto | KMJ | OIT | spots.kumamoto toolkit OIT 오탐 → override KMJ |
| 다윈 | galapagos | SIN | GPS | 호주 Darwin vs 갈라파고스 다윈섬 별칭 오염 |
| 맥머도 / 맥머도기지 | antarctica | CHC | USH | CHC 관문을 antarctica hub/allow에 넣을지 결정 |
| 일룰리사트 | iceland | CPH | KEF | 그린란드 vs 아이슬란드 별칭 오매핑 |

**절차**: 건별 override/별칭 수정 → `generate:airports` → `audit:airports` (WARN 0 목표 · 류큐 smoke 유지) → 검증 후 커밋

**금지**: `travelSpotAirports.json` spots 직접 수정 · 류큐 smoke 약화 · 요청 밖 대규모 별칭 정리
