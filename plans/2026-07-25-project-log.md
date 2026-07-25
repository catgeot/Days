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

## linkedSlug IATA clash WARN 정리

**상태**: ✅ `linkedSlugIataClash: 0` · `none: 0` · 류큐 smoke OK · `main` 머지·푸시

- **브랜치 규약 명시**: `.ai-context` **1.5.2** — 짧은 수정은 `main` 직행 · 대형/장기만 feature+PR

| placeId | 조치 |
|---------|------|
| 구마모토 / kumamoto | spots+placeId override **KMJ** (toolkit OIT 오탐) |
| 다윈 / Darwin | 호주 **DRW** hub 추가 · placeIds-only · galapagos에서 분리(다윈섬만 유지) |
| 맥머도·맥머도기지 | antarctica allow에 **CHC** (USH 크루즈 + CHC 기지) |
| 일룰리사트 | alias/override → **greenland**(CPH/GOH) · iceland(KEF) 해제 |

**검증**: `npm run generate:airports` → `npm run audit:airports`

## 국내 「투어 찾기」→ MyRealTrip TNA

**상태**: ✅ Edge 배포 · LIVE 스모크 PASS · 커밋 대기(사람 QA)

- **증상**: 국내 명소 GYG 오탐(해외 투어)
- **조치**: 국내=`fetch-mrt-tnas`(`tna/search`) 카드 목록 · 해외=GYG 유지 · 플래너 map_poi 동일 분기
- **파일**: Edge `fetch-mrt-tnas` · `mrtTnaQuery.js` · `fetchMrtTnas.js` · `MrtTnaActivitiesWidget` · `GlobeTourStrip` · `ToolkitCard`
- **검증**: `npm run smoke:mrt-tna` · `MRT_TNA_SMOKE_LIVE=1` (제주·부산·성산·경복궁·문경 `n>0`)
- **배포**: `npx supabase functions deploy fetch-mrt-tnas --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`
- **QA**: 국내 명소「투어 찾기」= MRT 한국 상품 · 오사카 등 해외=GYG · 숙소 탭과 상호배타