# 2026-08-20 프로젝트 일지

직전: [`2026-08-19-project-log.md`](./2026-08-19-project-log.md)

## 영문화 #21, 플래너 배너·UI EN — Preview push

- **범위** `place.planner.banners` · timeline · flight/rental hint · 비자 링크 `labelEn` — RentalPickup · Trip.com · 12Go · Klook · GYG · MRT TNA · JourneyTimeline · FlightSearchCta · cinema notice
- **유틸** `getFlightDestinationSearchHint` · `getRentalCarHomeSearchSubtext` · `getFlightTripDisclaimer` — i18n 연동
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — 장소 카드 플래너 탭 배너·제휴 UI
- **다음** #22 플래너 AI 본문 EN (`essential_guide_en`)

## 영문화 #22, 플래너 AI 본문 EN — Preview push

- **DB** `place_toolkit.essential_guide_en` · en 없으면 ko 폴백
- **Edge** `update-place-toolkit` — `locale=en` EN 프롬프트·컬럼 분리 저장
- **클라** `getEssentialGuide`·PlannerTab·MOONi CTA locale 연동
- **VERIFY** `smoke:essential-guide-locale` · `smoke:place-label-slug` · `build` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — 플래너 탭 AI 본문(타임라인·카드 advice)
- **남은 일** Edge `update-place-toolkit` deploy(사람) · Preview QA

## 영문화 #22, Edge·DB 배포

- **Edge** `update-place-toolkit` — `phdjnbfitvmrguqzverm` · `--no-verify-jwt` 배포 완료
- **DB** migration `20260820120000_place_toolkit_essential_guide_en.sql` 적용 (`essential_guide_en`)
- **Preview QA** `/qa/en` · `?lang=en` — Planner → Run AI toolkit → EN 본문 저장·표시

## 영문화 #21 보완, 플래너 배너·유틸 locale — Preview push

- **A** Airalo · Holafly · Direct Ferries 위젯 i18n · 제휴 뱃지
- **B** 렌터카 픽업 공항 EN 표기(`getRentalAirportDisplayName`) · MRT 검색어 suffix · PreTravel 숙소 쿼리 · TNA 가격 locale · planner bannerNote i18n
- **VERIFY** `build` · `smoke:place-label-slug` · `smoke:essential-guide-locale` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en`

## 영문화 #23, 브라우저 locale 자동 — Preview push

- **LocaleProvider** `resolveInitialLocale` 연동 — `?lang=` → `gateo.locale` → `navigator.languages` → ko
- **config.js** `resolveBootLocale` 동기화 · 첫 방문 EN 브라우저 시 `?lang=en`·storage persist
- **축제** EN UI에서 TourAPI 한글 제목·주소·썸네일 alt에 `lang="ko"` — Chrome 번역 인식(포스터 이미지 내 한글은 번역 불가 · #16 롤백으로 목록 ko SSOT 유지)
- **VERIFY** `smoke:browser-locale-hint` · `smoke:festival-detail-locale` · `smoke:place-label-slug` · `smoke:essential-guide-locale` · `build` PASS
- **브랜치** `cursor/en` · `/qa/en` · 시크릿 창 EN 브라우저 → `/` EN UI 자동

## 영문화 #24, PROD QA — 브라우저 locale

- **범위** #23 브라우저 locale 자동 · 축제 `lang="ko"` 마크업 · #21~#22 플래너 EN (PR #138)
- **VERIFY** `smoke:browser-locale-hint` · `smoke:festival-detail-locale` · `smoke:essential-guide-locale` · `smoke:place-label-slug` · `build` PASS
- **브랜치** `cursor/en` · tip `be20b6c7` · PR [#138](https://github.com/catgeot/Days/pull/138)
- **Preview** `https://days-git-cursor-en-catgeots-projects.vercel.app/` · `/qa/en`
- **PROD QA** (사람 · 시크릿 EN Chrome):
  1. `www.gateo.kr/` — `gateo.locale` 없음 · UI 자동 EN·`?lang=en`
  2. `/korea` — UI EN · 축제 카드 한글 제목 Chrome 번역 제안
  3. 축제 상세 — overview·info 한글 본문 번역 (포스터 이미지 내 한글 제외)
  4. 헤더 KO → 한글 UI · 재방문 유지
- **다음** PROD QA OK → #25 main 병합

**다음 제시어**:

```
영문화 #25, main 병합 — #21~#23
@plans/feature-handoff-index.md
@plans/2026-08-20-project-log.md
@plans/i18n-en-plan.md
cursor/en · PR #138 · PROD QA OK 후 merge
```

## 영문화 #26, PROD QA — 써머리·탐색 EN 보완

- **범위** PlaceCard 써머리「숙소 찾기」「투어 찾기」·검색바 탐색(`/explore`) UI EN
- **키** `place.summary.findStays/findTours` · `home.explore.*` · `exploreUi.js`
- **VERIFY** `build` · `smoke:browser-locale-hint` · `smoke:place-label-slug` · `smoke:essential-guide-locale` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en`
- **남은 일** Preview QA → main 병합 · 숙소/투어 **펼친 패널** 내부 카피는 후속

**다음 제시어**:

```
영문화 #27, main 병합 — #26 써머리·탐색 EN
@plans/feature-handoff-index.md
@plans/2026-08-20-project-log.md
@plans/i18n-en-plan.md
cursor/en · Preview QA 후 main
```

## 영문화 #23 준비 — 브라우저 locale 자동 (다음 세션)

### 핸드오프

| | |
|--|--|
| **결정** | IP geo **아님** · **`navigator.languages`** — `ko*` → ko · 그 외 → en |
| **우선순위** | `?lang=` → `gateo.locale` → 브라우저 추론 → ko |
| **헬퍼** | `src/i18n/browserLocaleHint.js` (`resolveInitialLocale`) — **Provider 미연동** |
| **스모크** | `npm run smoke:browser-locale-hint` |
| **연동** | `LocaleProvider.jsx` · `config.js` `resolveBootLocale` — `readStoredLocale` null 구분 |
| **금지** | Google Translate · 저장 locale 덮어쓰기 |

**다음 제시어**:

```
영문화 #23, 브라우저 locale 자동
@plans/feature-handoff-index.md
@plans/2026-08-20-project-log.md
@plans/i18n-en-plan.md
cursor/en · LocaleProvider 연동 · smoke:browser-locale-hint
금지: Google 번역 · IP geo · travelSpots.js 전체 Read
```
