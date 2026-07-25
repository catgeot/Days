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

## 일룰리사트 장소카드 — greenland 편입 해제

**상태**: ✅ audit PASS · `citiesData` slug `ilulissat`로 검색 진입

- **증상**: 검색「일룰리사트」가 그린란드(`greenland`) 장소카드로 열림
- **원인**: `f5bc1e7` 공항 clash 정리 때 place-id alias·toolkit synonym·reconcile `mergeFrom`이 일룰리사트→greenland로 강제(장소카드 slug까지 붕괴). `linkedSlug`는 공항만 영향.
- **조치**(다윈 분리와 동일): alias/synonym/merge 제거 · 공항은 placeIds-only CPH/GOH(KEF 금지, `linkedSlug` 없음) · `citiesData` `ilulissat`가 Enter 경로에서 선택
- **검증**: `generate:airports` · `audit:airports` none:0 · linkedSlugIataClash:0 · resolve 일룰리사트→cities/`ilulissat` · 그린란드→`greenland` · 아이슬란드→`iceland`
- **QA**: 검색「일룰리사트」/Ilulissat → 아이스피오르드 설명 카드 · 「그린란드」는 기존 국가 카드 · 배너 공항 CPH/GOH(아이슬란드 KEF 아님)

## 국내 「투어 찾기」→ MyRealTrip TNA

**상태**: ✅ Edge 배포 · LIVE 스모크 PASS · `main` `ca96f77` (push는 사람 요청 시)

- **증상**: 국내 명소 GYG 오탐(해외 투어)
- **조치**: 국내=`fetch-mrt-tnas`(`tna/search`) 카드 목록 · 해외=GYG 유지 · 플래너 map_poi 동일 분기
- **파일**: Edge `fetch-mrt-tnas` · `mrtTnaQuery.js` · `fetchMrtTnas.js` · `MrtTnaActivitiesWidget` · `GlobeTourStrip` · `ToolkitCard`
- **검증**: `npm run smoke:mrt-tna` · `MRT_TNA_SMOKE_LIVE=1` (제주·부산·성산·경복궁·문경 `n>0`)
- **배포**: `npx supabase functions deploy fetch-mrt-tnas --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`
- **QA**: 국내 명소「투어 찾기」= MRT 한국 상품 · 오사카 등 해외=GYG · 숙소 탭과 상호배타

## 국내 TNA — 양구·두타연 오탐 + 인근 확장

**상태**: ✅ 사람 QA · UI 확정 · push

- **원인**: MRT에 양구/두타연 실재고 거의 없음 · `두타연`→「연」부분일치 · `양구`→중국 노산 동명 · 영문 `Valley`→해외 와인투어
- **조치**: Edge 관련도 필터·해외 노이즈 거절 · 국내 영문 name_en 래더 제외 · hub `yanggu` 인근(춘천·인제·설악·속초) 확장 + UI 안내
- **검증**: `MRT_TNA_SMOKE_LIVE=1 npm run smoke:mrt-tna` · yanggu-dutayeon `used=춘천`
- **QA UI**: 인근 안내 문구·더보기 여백 · 써머리「투어 찾기」탭 시인성 한 단계 상향

## 국내 명소 항공 경로 — ICN↔GMP·PVG↔SHA 오탐

**상태**: ✅ smoke PASS · `main` `c0660a5` · 후속 본토 국내선 억제

- **증상**: 가평·이천 등 수도권 명소에 `ICN→GMP`(및 PVG↔SHA) 항공 경로 노출
- **원인**: rental hub 최근접이 GMP/SHA로 잡히고, 동일 메트로 OD를 시네마가 허용
- **조치**: `areMetroCoterminalAirports` — coterminal OD는 `canPreviewFlightRoute` false

## 국내 명소 항공 경로 — 본토 국내선(YNY/PUS/WJU) 오탐

**상태**: ✅ smoke PASS · `main` `f4a27ca`

- **증상**: 동해 무릉계곡·영금정·고성통일전망타워·화진포=`ICN→YNY` · 민둥산=`ICN→WJU` · 창원 주남=`ICN→PUS`
- **조치**: `isKoreaMainlandDomesticFlightOd` — 본토↔본토 국내선 시네마 숨김 · **제주(CJU)만 유지** · 해외출발(PVG→PUS) 유지
- **검증**: `npm run smoke:flight-route-baseline` 23/23
- **QA**: 위 명소·부산 = ICN 출발 시 항공 경로 없음 · 성산일출봉 = ICN→CJU