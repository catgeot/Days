# 2026-08-19 프로젝트 일지

직전: [`2026-08-18-project-log.md`](./2026-08-18-project-log.md)

## 영문화 #12, PROD QA 확인 — 사람 QA OK

- **PROD** `www.gateo.kr/qa/en` → `/?lang=en` · `/blog?lang=en` · `/korea/theme/*` — **사람 QA OK**
- **1차 UI** (#0~#11) **완료** · main `097ecc59`
- **플랜** [`i18n-en-plan.md`](./i18n-en-plan.md) — 2차 #13~#22 로드맵·§10 가드 반영
- **다음** #13 지구본 중분류·국가·해양 칩 EN (`cursor/en`)

## 영문화 #13, 지구본 칩·국가 — Preview push

- **지구본 칩** `GlobeFaceRegionRail` — 소권역·나라·대양·해역 칩 label·aria en
- **i18n** `globeUi.js` · `home.globe.country`(219) · `subregion`(면별) · `ocean` · `oceanChipAria`
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · PR #135
- **Preview** `/qa/en` · `?lang=en` — 홈 지구본 칩·나라 목록

## 영문화 #13 보정 — 동해 en 표기

- **동해** `name_en` Sea of Japan → **East Sea** (한국 표기 관례)
- **검색 alias** `East Sea` 추가 · `Sea of Japan`은 검색용 alias 유지
- **동중국해** alias에서 `동해` 오탐 제거
- **VERIFY** `generate:sea-basins` · `smoke:sea-basin-rail` · `build` PASS

## 영문화 #13, Preview QA PASS

- **사람 QA** `/qa/en` · `?lang=en` — 지구본 칩·나라·동해(East Sea) **통과**
- **tip** `022d1848` · PR [#135](https://github.com/catgeot/Days/pull/135)

## 영문화 #14, 지구본 지명·맵 — Preview push

- **핀** `localizedMarkerPinLabel` · `globeMarkerLayers` locale별 label
- **Mapbox** `map.setLanguage(en|ko)` · satellite `MapboxLanguage` · label 클릭 en 우선
- **클러스터** `GlobeClusterLegend` — `labelEn` · `getPlaceTitleLinesForLocale`
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS

## 영문화 #19, 무니 프롬프트·대화 EN — Preview push

- **프롬프트 SSOT** `mooniPromptBundles.js` — ko/en system·칩·CTA·인트로 지시
- **연동** `prompts.js` · `mooniChipPrompts.js` · `chatCtaPromptHint.js` · `placeChatIntro.js`
- **인트로 캐시** `destination_key@en` 접미사로 ko/en 분리
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — MOONi 칩 탭 시 AI 답변 영문
- **다음** #20 무니 인트로·탐지

## 영문화 #20, 무니 인트로·탐지 — Preview push

- **인트로 캐시** `formatPlaceChatLabel`·`buildPlaceChatIntroKeys` — en일 때 `name_en`·`country_en` 라벨 + `@en` 키
- **탐지** `resolveDestinationFromChat` EN 발화 패턴 · `normalizeAccessDepartureUserText` locale=en
- **합성 desc** `placeDescText` EN placeholder 탐지
- **VERIFY** `smoke:place-label-slug` · `npm run build` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — bound 장소 MOONi 인트로·써머리 EN
- **다음** #21 플래너 배너·UI EN

## 영문화 #20 보정 — MOONi 항공 CTA·검색 모달 EN

- **배너** `BookingActionCards` · `chatBookingResolver` — Transport·항공 라벨·route hint locale
- **모달** `TripcomFlightSearchModal` — 헤더·aria·제휴 배지 EN
- **VERIFY** `smoke:place-label-slug` · `build` PASS

## 영문화 #20 보정 — Trip.com ad locale=en-US 시험

- **항공 iframe** `buildTripcomPlannerFlightUrl` — `?lang=en` → URL `locale=en-US` (동일 ad ID)
- **VERIFY** `smoke-tripcom-flight-locale` · `build` PASS

## 영문화 #20, Preview QA PASS — MOONi·Trip.com EN

- **사람 QA** `/qa/en` · `?lang=en` — MOONi 인트로·항공 CTA·Trip.com 검색 모달(왕복·편도·검색) **영문 OK**
- **Trip.com** 별도 EN ad 불필요 — `locale=en-US` 쿼리로 기존 ad ID EN UI 확인
- **tip** `6bca488c` · **다음** main 병합·PROD QA

## 영문화 #21, 메인 병합 — #15~#20

- **범위** TourAPI locale(#15) · #16·#17 본문 롤백(A) · 무니 UI·프롬프트·인트로(#18~#20) · Trip.com `locale=en-US`
- **VERIFY** `npm run build` · `smoke:place-label-slug` · `smoke:tourapi` PASS (`cursor/en` tip `66f5bf17`)
- **PR** [#136](https://github.com/catgeot/Days/pull/136) → **main** `9157f772`
- **PROD QA** `www.gateo.kr/qa/en` → `/?lang=en` — MOONi FAB·채팅·항공 CTA·Trip.com 모달
- **다음** PROD QA OK 후 #21 플래너 배너·UI EN (`cursor/en`)

## 영문화 #21 보정 — MOONi 채팅 잔여 한글 EN

- **MOONi** 헤더·목적지 칩 `localizeMooniPlaceLabel` · 출발지 `FlightOriginSelector` i18n
- **UI** 다른 주제·물어보기·출발·출발지 검색 · `flightOrigin.*` 키
- **VERIFY** `build` · `smoke:place-label-slug` PASS

## 영문화 #18, 무니 UI·칩 — Preview push

- **무니 UI** `ChatModal` · `MooniAgentFab` · 목적지 칩 · 플래너 follow-up — `mooni.*` i18n 키
- **주제 칩** L1/L2 라벨·sendText · FAB 말풍선 · 로딩·placeholder en
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — 홈 MOONi FAB·채팅·bound slug 칩
- **다음** #19 무니 프롬프트·대화 EN


## 영문화 #15, TourAPI 프록시 EN — Preview push

- **Edge** `tourapi-proxy` — `locale` ko/en · en=`EngService2` · 캐시 키 locale 분리
- **클라** `tourApiProxy.js` — `getTourApiLocale()` → invoke body `locale`
- **VERIFY** `smoke:tourapi` · `npm run build` PASS
- **남은 일** Edge `tourapi-proxy` deploy(사람) 후 LIVE `TOURAPI_SMOKE_LIVE=1` · Preview QA
- **다음** #16 축제 본문 EN (`cursor/en`)

## 영문화 #15, Edge deploy · LIVE PASS

- **Secrets** Cloud·Supabase 모두 `TOUR_API_SERVICE_KEY` 등록 확인
- **배포** `npx supabase functions deploy tourapi-proxy --no-verify-jwt` 완료
- **LIVE** `TOURAPI_SMOKE_LIVE=1 npm run smoke:tourapi` — `locale=en` EngService2 **PASS**
- **다음** Preview `/qa/en` 사람 QA · #16 축제 본문 EN

## 영문화 #16, 축제 본문 EN — Preview push

- **목록** `festivalWindow` 항상 `locale=ko` (KorService2 SSOT · 「지금」45건 유지)
- **상세** `fetchTourApiFestivalDetailLocalized` — EN 본문 + KO 필드 폴백 · `displayTitle`
- **캐시** sessionStorage `rolling12:ko` · `mergeTourApiFestivalDetail.js`
- **VERIFY** `smoke:festival-detail-locale` · `build` · `smoke:place-label-slug` PASS
- **Preview** `/qa/en` · `/korea?lang=en` — 축제 카드·상세 본문

## 영문화 #17, 명승 TourAPI 본문 EN — Preview push

- **상세** `fetchTourApiAttractionDetailLocalized` — EN 본문 + KO 필드 폴백 · `displayTitle`
- **병합** `mergeTourApiAttractionDetail.js` — overview·intro·infoItems
- **모달** `ThemeSpotDetailModal` — TourAPI만(CHA·선정 제외) · `i18n.language` 재fetch
- **VERIFY** `smoke:scenic-detail-locale` · `build` · `smoke:place-label-slug` PASS
- **Preview** `/qa/en` · `/korea/theme/scenic?lang=en` — 명승 카드→상세 본문

## 영문화 #16·#17 롤백(A) — TourAPI 본문 EN 철회

- **결정** — 사람 합의: 축제·명승 EngService2 본문 실익 낮음 → **KorService2 SSOT**
- **코드** — `TOUR_API_BODY_LOCALE=ko` · localized fetch·merge·Eng contentId 해석 제거
- **유지** — `/korea`·`/korea/theme/*` **UI i18n** · Edge locale(#15) · 주변 POI ko
- **VERIFY** `smoke:festival-detail-locale` · `smoke:scenic-detail-locale` · `build` PASS
- **다음** #18 무니 UI·칩 EN
