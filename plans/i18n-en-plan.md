# 영문화 (English UI) — 세션별 실행 플랜

**세션 표기**: `영문화 #{N}, {단계}` ([`cloud-preview-continuity.md`](./cloud-preview-continuity.md))  
**고정 브랜치**: `cursor/en`  
**공유 slug**: `/qa/en` → Preview `/` (locale 토글·홈 우선)  
**Cloud 연속성**: [`feature-handoff-index.md`](./feature-handoff-index.md) · [`AGENTS.md`](../AGENTS.md)

### 채팅명 복붙 (Cursor 새 채팅 제목)

| #N | 단계 | 채팅명 (복붙) | 상태 |
|----|------|---------------|------|
| 0 | 문서·브랜치 | `영문화 #0, 문서·브랜치` | ✅ |
| 1 | 기반 | `영문화 #1, locale 기반` | ✅ |
| 2 | 홈·PlaceCard | `영문화 #2, 홈·PlaceCard` | ✅ |
| 3 | 한국 투톱 | `영문화 #3, korea·theme` | ✅ |
| 4 | SEO·릴리스 | `영문화 #4, SEO·릴리스` | ✅ |
| 5 | PROD 병합·QA | `영문화 #5, PROD 병합·QA` | ✅ |
| 6 | PROD QA 확인 | `영문화 #6, PROD QA 확인` | (배포 후 사람) |
| 7 | PlaceCard 세부 | `영문화 #7, PlaceCard 세부 영문화` | ✅ Preview |
| 8 | 한국 테마 나머지 | `영문화 #8, 한국 테마 나머지` | ✅ Preview |
| 9 | 로그북/대시보드 | `영문화 #9, 로그북·대시보드` | ✅ Preview |
| 10 | 잔여·QA | `영문화 #10, 잔여·Preview QA` | ✅ Preview |
| 11 | 병합·PROD | `영문화 #11, 병합·PROD QA` | ✅ merge |
| 12 | PROD 확인 | `영문화 #12, PROD QA 확인` | ✅ 사람 QA |
| 13 | 지구본 칩 | `영문화 #13, 지구본 칩·국가` | ✅ main |
| 14 | 지구본 지명 | `영문화 #14, 지구본 지명·맵` | ✅ main |
| 15 | TourAPI 프록시 | `영문화 #15, TourAPI 프록시 EN` | ✅ |
| 16 | 축제 본문 EN | `영문화 #16, 축제 본문 EN` | ↩ 롤백(A) |
| 17 | 명승 TourAPI 본문 | `영문화 #17, 명승 TourAPI 본문 EN` | ↩ 롤백(A) |
| 18 | 무니 UI·칩 | `영문화 #18, 무니 UI·칩` | ✅ Preview |
| 19 | 무니 프롬프트·대화 | `영문화 #19, 무니 프롬프트·대화 EN` | ✅ Preview |
| 20 | 무니 인트로·탐지 | `영문화 #20, 무니 인트로·탐지` | ✅ Preview |
| 21 | 플래너 배너·UI | `영문화 #21, 플래너 배너·UI EN` | ✅ Preview |
| 22 | 플래너 AI 본문 | `영문화 #22, 플래너 AI 본문 EN` | ✅ Preview |
| 23 | 브라우저 locale | `영문화 #23, 브라우저 locale 자동` | ✅ Preview |
| 24 | PROD QA | `영문화 #24, PROD QA — 브라우저 locale` | ✅ 사람 QA |
| 25 | main 병합 | `영문화 #25, main 병합 — #21~#23` | ✅ merge |
| 26 | 써머리·탐색 EN | `영문화 #26, 써머리·탐색 EN` | ✅ Preview |
| 27 | main 병합 | `영문화 #27, main 병합 — #26 써머리·탐색 EN` | ✅ merge |
| 28 | PROD 확인 | `영문화 #28, PROD QA — #26 써머리·탐색` | (배포 후 사람) |
| 29 | i18n 감사 | `영문화 #29, i18n 커버리지 감사` | ✅ baseline |
| 30~36 | P0·지역칩 | (일지 참고) | ✅ main |
| 38 | PROD QA | `영문화 #38, PROD QA — #29~#36` | ✅ 사람 |
| 39 | 명승·테마 UI·지도 | `영문화 #39, 명승·테마 UI·지도 EN` | ✅ merge |
| 40 | 명승 follow-up | `영문화 #40, Preview QA — 명승 모달·지도 EN` | ✅ merge |
| 41 | 축제 지도·title | `영문화 #41, 축제 지도·title EN` | ✅ merge PR #141 |
| 42 | 테스트·최적화 | `영문화 #42, 테스트·최적화` | ✅ PROD QA |
| 43 | 최적화 | `영문화 #43, 최적화` | ⏳ next |

**1차 (#0~#12)**: UI 카피 · **2차 (#13~#22)**: 지구본 데이터 · TourAPI 본문 · 무니 · 플래너 AI·배너 · **#23**: 첫 방문 브라우저 언어 → locale.

세션마다 `#1` 리셋 금지 · `#N` = Cloud 순번.

---

## 0. 한 줄 결론

| 질문 | 답 |
|------|----|
| 목표? | **UI 카피 영문화** — 기존 레이아웃·톤 유지, 문자열만 locale별 분기 |
| SSOT? | 신규 `src/i18n/` (키·ko/en JSON) · 컴포넌트는 키 참조 |
| URL? | **1차**: 쿼리 `?lang=en` + `localStorage` · **2차(합의 후)**: `/en/…` prefix |
| 데이터? | `travelSpots` 등 **표시명**은 `name_en`/`country_en` 우선 · JSON spots **직접 편집 금지** |
| 한국 전용? | `/korea` · `/korea/theme/*` · TourAPI·축제 SSOT — **Phase 3+** · 1~2차는 글로벌 홈·PlaceCard |
| VERIFY | `npm run build` · (추가) `smoke:place-label-slug` · locale smoke는 #1 이후 |

---

## 1. 현재 상태 (2026-08-18 · #0)

- **i18n 라이브러리 없음** — `react-i18next`/`i18next` 미도입
- **한글 하드코딩** — 홈·PlaceCard·공통 레이아웃·affiliate `locale: ko-KR`
- **영문 데이터 일부 존재** — `name_en`, `country_en`, geocoding `accept-language=en`
- **Mapbox** — `@mapbox/mapbox-gl-language` (지도 라벨 한글) · locale 연동은 #1+
- **금지** · `travelSpots.js` 전체 Read · UI 리디자인 · spots JSON 직편집

---

## 2. Phase 로드맵

| Phase | 세션 | 산출 | VERIFY |
|-------|------|------|--------|
| **#0** | 문서·브랜치 | 플랜 · `cursor/en` · `/qa/en` · 핸드오프 3종 | `build` |
| **#1** | locale 기반 | `i18next` · `LocaleProvider` · `?lang=` · 헤더 토글 · 공통 레이아웃 키 | `build` |
| **#2** | 홈·PlaceCard | 지구본·검색·탭·툴킷 주요 카피 en | `build` · `smoke:place-label-slug` |
| **#3** | 한국 투톱 | `/korea` · `/korea/theme/scenic` — **사람 합의 후** 범위 | `build` |
| **#4** | SEO·릴리스 | `hreflang` · sitemap · 릴리스 노트(승인 후) | `build` |
| **#5** | PROD 병합 | PR #132 → `main` | `build` |
| **#7+** | 세부·확장 | PlaceCard 세부 · 한국 테마 · 로그북/대시보드 | `build` |
| **#13** | 지구본 칩·국가 | 중분류·국가·해양 칩 EN (`globeUi.js`) | `build` |
| **#14** | 지구본 지명 | 핀·Mapbox `name_en` · 클러스터 범례 | `build` · `smoke:place-label-slug` |
| **#15** | TourAPI 프록시 | `EngService2` + locale 캐시 | `build` · Edge deploy |
| **#16** | 축제 본문 | ↩ **롤백(A)** — TourAPI 본문 ko SSOT | — |
| **#17** | 명승 TourAPI | ↩ **롤백(A)** — ThemeSpotDetailModal ko SSOT | — |
| **#18~20** | 무니 | UI·칩 → 프롬프트·대화 → 인트로 캐시 | `build` |
| **#21~22** | 플래너 | 배너·제휴 UI → `essential_guide_en` | `build` · Edge |

**우선순위 (2차)**: 지구본 홈 → 한국 TourAPI 본문 → 무니 → 플래너.

---

## 3. 기술 가드

1. **기존 비주얼 유지** — 버튼·레이아웃·색 교체 금지 (`.ai-context` §4.1 5)
2. **키 네이밍** — `domain.section.key` (예: `home.globe.chip.paradise`)
3. **폴백** — en 키 없으면 ko · ko 없으면 키 문자열(개발만)
4. **Affiliate** — Trip.com·**GYG** `resolve*Locale` ↔ `LocaleProvider` 동기 ✅ · Klook/12Go 등 후속
5. **E2E** — 한글 accessibility name 의존 테스트는 키/라벨 변경 시 동기 ([`site-health-monitoring-plan.md`](./site-health-monitoring-plan.md))

---

## 4. Preview · QA

| | |
|--|--|
| **브랜치** | `cursor/en` |
| **git Preview** | `https://days-git-cursor-en-catgeots-projects.vercel.app/` |
| **공유** | `https://www.gateo.kr/qa/en` |
| **QA 경로** | Preview `/` · `?lang=en` ( #1 이후 ) · PlaceCard 샘플 slug 2~3 |
| **Mapbox** | git Preview URL **1회** 등록 (사람) |

---

## 9. 핸드오프

**세션** `영문화 #45, 플래너 bannerNote·권역 EN`  
**main** PR #149 merge · `452c4c25`  
**일지** [`2026-08-24-project-log.md`](./2026-08-24-project-log.md)

| | |
|--|--|
| **완료** | 플래너 bannerNoteEn · bookingNoteEn · 권역 notesEn · relatedSpotsSubtitle |
| **PROD QA** | `/place/yap/planner?lang=en` |
| **VERIFY** | `audit:airports` · `audit:i18n` · `build` |

**다음 제시어**:

```
영문화 #46, PROD QA — 플래너 banner EN
@plans/feature-handoff-index.md
@plans/2026-08-24-project-log.md
@plans/i18n-en-plan.md
main · www.gateo.kr/place/yap/planner?lang=en
금지: GT 일괄 백필
```

### #23 브라우저 locale 자동 — 완료

| | |
|--|--|
| **목표** | `gateo.locale`·`?lang=` 없는 **첫 방문**에 `navigator.languages`로 ko/en 선택 |
| **규칙** | `ko*` 포함 → **ko** (재외 한국인) · 그 외(en·ja·zh…) → **en** |
| **우선순위** | ① `?lang=` ② `localStorage` `gateo.locale` ③ `inferLocaleFromBrowserLanguages` ④ `ko` |
| **헬퍼** | [`src/i18n/browserLocaleHint.js`](../src/i18n/browserLocaleHint.js) — `resolveInitialLocale` |
| **스모크** | `npm run smoke:browser-locale-hint` |
| **연동 파일** | [`LocaleProvider.jsx`](../src/i18n/LocaleProvider.jsx) · [`config.js`](../src/i18n/config.js) `resolveBootLocale` |
| **금지** | Google Translate · IP geolocation · 저장된 locale 덮어쓰기 |

**LocaleProvider 변경 요지**:

1. `readStoredLocale()` → 키 **없으면 `null`** 반환 (지금은 무조건 `ko` — 구분 불가)
2. 초기 state: `urlLang ?? stored ?? resolveInitialLocale({ languages })`
3. 자동 `en`이면 `setLocale('en')`과 동일하게 `?lang=en`·storage persist (헤더 토글과 일치)
4. EN/KO 토글 UI 유지 — 사용자 선택이 항상 최우선

**사람 QA**: 시크릿 창 · Chrome 언어 `English` → `/` EN UI · 언어 목록에 `한국어` 추가 → KO · `?lang=en` URL 우선

---

### #22 완료 요약

**상태**: Preview push · `essential_guide_en` · Edge `locale=en` · ko 폴백 · #21 보완(A+B)

**다음 제시어 (대체 — #23로 이관)**:

```
영문화 #22, PROD QA — #21~#22
```

### #16·#17 롤백(A) — 사람 합의

| | |
|--|--|
| **결정** | `/korea` · `/korea/theme/*` **TourAPI 본문 EngService2 호출 중단** |
| **유지** | UI i18n(버튼·섹션·헤더) · Edge locale 인프라(#15) · 주변 POI ko SSOT |
| **코드** | `TOUR_API_BODY_LOCALE=ko` · localized fetch·merge·Eng id 해석 제거 |

### #17 (롤백 전) 참고

| 파일 | 작업 |
|------|------|
| ~~localized detail~~ | EngService2 coverage·contentId 불일치로 철회 |

### #16 (롤백 전) 참고

| 파일 | 작업 |
|------|------|
| `fetchTourApiFestivals.js` | 목록 `locale=ko` · `fetchTourApiFestivalDetailLocalized` |
| `mergeTourApiFestivalDetail.js` | EN 필드 우선 · KO 폴백 |
| `FestivalDetailSheet` | localized detail · `displayTitle` |
| `fetchKoreaFestivalsWindow.js` | sessionStorage `rolling12:ko` |

### #15 완료 요약

| 파일 | 작업 |
|------|------|
| TourAPI Edge 프록시 | ko=`KorService2` · en=`EngService2` |
| 캐시 키 | locale 분리 |
| 클라이언트 호출부 | `getTourApiLocale()` → API locale 전달 |

---

## 10. 2차 콘텐츠 영문화 가드

1. **spots JSON 직편집 금지** — `name_en`은 overrides → `generate:*`
2. **TourAPI 본문 (`/korea`·`/korea/theme/*`)** — **KorService2 SSOT** (`TOUR_API_BODY_LOCALE=ko`) · EngService2 본문 EN **롤백(A)** · **예외(#39)**: 지도 핀·상세 **헤더 title**만 `titleEn` 병합(목록 ko·본문 ko 유지)
3. **TourAPI Edge** — locale 인프라 유지(#15) · 갤러리 등 다른 경로는 별도
4. **CHA·선정 명승** — TourAPI 아님 · `overview_en`은 추후
5. **AI 캐시** — `place_chat_intro`·`essential_guide` locale별 키/컬럼 분리
6. **기존 비주얼 유지** — 카피·locale 분기만

---

## 11. i18n 커버리지 감사 (`audit:i18n`)

| | |
|--|--|
| **명령** | `npm run audit:i18n` |
| **SSOT** | P0 목록 [`scripts/data/i18n-audit-p0.mjs`](../scripts/data/i18n-audit-p0.mjs) |
| **리포트** | `scripts/outputs/i18n-audit-baseline.json` (gitignore · 실행 시 생성) |
| **게이트** | `en.json` 누락 키 **0** · P0 파일 존재 — **PASS** |
| **debt** | P0 한글 리터럴 줄 수 — baseline 추적만(아직 fail 조건 아님) |

### P0 tier (Preview `/qa/en` · #29 baseline)

| Tier | 범위 | 파일 수 | hangul 줄(#29) |
|------|------|---------|----------------|
| **A** | 홈·탐색·PlaceCard 써머리/펼침 | 11 | 15 |
| **B** | 무니·플래너·리뷰·공항 | 7 | 10 |
| **C** | Auth·공지·한국 UI 셸 | 5 | 55 |

**#35 완료** — P0 debt **0** (tier A·B·C). TourAPI 본문 ko SSOT·Chrome 번역 가드 유지.

**제외·참고**: `missingInKo` 219건은 en-only 지구본 국가 키

---

## 12. #39·#40 — 한국 2차 UI·지도 표시명 EN (PROD QA 후속 · 2세션)

**배경 (#38 PROD QA)**: 본문(TourAPI·blurb) 한글은 정책 유지 OK · **UI 셸·상단 명칭·지도 핀 라벨**은 EN 필요(번역 없이 맥락 파악).

### 세션 분할 (확정)

| 세션 | 트랙 | 범위 | 채팅명 |
|------|------|------|--------|
| **#39** | A·B·C·D₁ | 명승·테마 — 지도 breadcrumb·명소 핀 · `ThemeSpotDetailModal` UI · 상단 title(subtitle) | `영문화 #39, 명승·테마 UI·지도 EN` |
| **#40** | D₂·E | 축제 — 지도 핀 · `FestivalDetailSheet` 헤더 title · `titleEn` join | `영문화 #40, 축제 지도·title EN` |

**#39 종료 후 제시어 → #40**:

```
영문화 #40, 축제 지도·title EN
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
cursor/en · /korea?lang=en · KoreaFestivalMap · titleEn join
```

### 범위 (EN) vs 제외 (ko SSOT)

| EN (#39·#40) | ko 유지 (본문·데이터) |
|--------------|----------------------|
| `ThemeSpotDetailModal` 버튼·섹션·aria·푸터 | overview·blurb·맛집/POI **이름** |
| 상세 **헤더 title**·subtitle(권역) | TourAPI info/program 본문 |
| 지도 **breadcrumb**·드릴 칩 | 축제 **목록 카드** 제목(한글+`lang=ko`) |
| 지도 **핀 라벨** `titleShort` | 포스터·이미지 내 한글 |
| `FestivalDetailSheet` **헤더 title**만 (#40) | |

### 작업 트랙

| ID | 세션 | 작업 | 파일 | 데이터 |
|----|------|------|------|--------|
| **A** | #39 | 명승 지도 breadcrumb EN | `KoreaScenicMap.jsx` · `koreaUi.js` | `localizeMapDrillCrumb` · `displayChipLabel` |
| **B** | #39 | 명승 지도 핀 EN | `koreaScenicMapData.js` | curated `attractionNameEn` **871/871** · heritage **ko 폴백** |
| **C** | #39 | `ThemeSpotDetailModal` UI EN | `ThemeSpotDetailModal.jsx` · `ThemeSpotCrossRail` | `korea.festival.detail.*` 재사용 + `korea.theme.spotDetail.*` |
| **D₁** | #39 | 명승 상단 title·subtitle | `ThemeSpotDetailModal` | `getLocalizedPlaceName` · `formatScenicSpotPlaceLabel` |
| **D₂** | #40 | 축제 상단 title | `FestivalDetailSheet.jsx` | `titleEn` 우선 · 본문 ko |
| **E** | #40 | 축제 지도 핀 EN | `KoreaFestivalMap.jsx` · `fetchKoreaFestivalsWindow.js` | Edge `festivalWindow` locale=en · `contentId` join |

### 구현 메모

1. **#39 먼저** — 축제 파일(`KoreaFestivalMap`·`fetchKoreaFestivalsWindow`) **건드리지 않음**.
2. **#40 titleEn**: `fetchTourApiFestivalWindow({ locale: 'en' })` → ko `items`에 `titleEn`만 merge · 카드/본문 `title`(ko) 유지.
3. **명승 핀**: `buildScenicMapGeoJson(items, locale)` — en이면 `attractionNameEn || name`.
4. **금지**: TourAPI detail `locale=en` · spots JSON 직편집 · UI 리디자인.

### VERIFY

**#39 게이트**:

```bash
npm run audit:i18n && npm run build
npm run smoke:korea-scenic-place-label
npm run smoke:place-label-slug
```

**#40 게이트** (#39 위 +):

```bash
npm run smoke:festival-detail-locale
npm run smoke:browser-locale-hint
```

**사람 Preview QA**:

| 세션 | 경로 |
|------|------|
| #39 | `/korea/theme/scenic?lang=en` — breadcrumb·명소 핀 EN · 모달 UI·헤더 EN · 본문 ko |
| #40 | `/korea?lang=en` — 축제 지도 핀·상세 헤더 EN · 목록·본문 ko |

---

## 13. #42 — 테스트·최적화 (main 병합 후)

**전제**: PR #141 병합 · Preview QA OK · 잔존(EngService2 미등록 축제 핀 ko 등)은 **백로그** — 본 세션에서 일괄 해결 금지.

### A. 회귀 테스트 (PROD · `?lang=en`)

| 경로 | 확인 |
|------|------|
| `/` | locale 토글 · 홈·탐색 EN |
| `/korea?lang=en` | 축제 칩·상세 헤더·크로스 UI EN · 목록·본문 ko |
| `/korea/theme/scenic?lang=en` | 지도 breadcrumb·핀 · 모달 UI·헤더 EN |
| PlaceCard | P0 탭·써머리 EN (#28 잔여) |

### A′. 홈 locale 토글 (Cloud · PR #174 · `cursor/locale-toggle-smooth-92b6`)

| 세션 | 상태 | 메모 |
|------|------|------|
| #5 | ✅ | 위성 `name_ko` 강제 해제 · locale별 text-field |
| #6 | ✅ tip `3fe6077c` | 이중 깜박임 — satellite `setLanguage` 제거 · coalesce 1회 |
| #7 | ✅ 사람 QA PASS | 깜박임 없음 · EN↔KO ≤3초 — **merge 수용** |
| #8 | ✅ main `053a4587` | PR [#174](https://github.com/catgeot/Days/pull/174) merge · 검색바 히트는 §13 A′′ |
| #9 | tip `e2214bdb` · Preview | 모바일 지명 EN 고착 — suppress+레이어 ID · **사람 모바일 QA** |

### A′′. 홈 검색바·locale 히트 (Cloud · PR #175 · `cursor/search-locale-hit-5f5c`)

| 세션 | 상태 | 메모 |
|------|------|------|
| #1 | ✅ tip `4dff1699` | 브랜치·`/qa/search-hit`·작업 로그 준비 |
| #2 | 다음 | `HomeUI.jsx`만 — flex `[로고+EN \| 검색 flex-1]` · 바로가기 2행 |

**증상**: 모바일 `left-[7.75rem]` 검색바 ↔ chrome 실드 `z-[110]` → 검색 클릭 무력화  
**참고(롤백됨)**: `f3ec61d7` / `0ba69445` (#173) — **통째 cherry-pick 금지** · 현재 main `HomeUI`에 재적용  
**금지**: `HomeGlobeMapbox` · LocaleProvider Mapbox · UI 리디자인  
**배경**: #173은 #4에서 Mapbox 연쇄와 함께 revert · #174 지구본은 main → UI만 분리 가능

**다음 제시어 (#2)**:

```
홈 검색바 히트 #2, HomeUI flex
@plans/feature-handoff-index.md
@plans/2026-09-02-project-log.md
@plans/i18n-en-plan.md
```

**에이전트 VERIFY**:

```bash
npm run audit:i18n && npm run build
npm run smoke:festival-detail-locale
npm run smoke:browser-locale-hint
npm run smoke:korea-scenic-place-label
npm run smoke:korea-scenic-map
npm run smoke:scenic-detail-locale
npm run smoke:place-label-slug
```

### B. 성능·최적화 후보

| 항목 | 파일 | 메모 |
|------|------|------|
| 축제 en window 2nd fetch | `fetchKoreaFestivalsWindow.js` | ko fetch 후 en merge — locale=ko 첫 방문 시 skip 검토 |
| sessionStorage v2 | `CACHE_KEY` | titleEn 포함 · TTL 6h · quota |
| locale 전환 | `Korea/index.jsx` | `loadFestivals` locale deps · 캐시 hit 시 titleEn lazy merge |
| bundle | `build` 출력 | i18n JSON·한국 페이지 chunk |

### C. 백로그 (차차 · #42에서 스코프 밖)

- EngService2 미등록 축제 지도 핀 ko (~75%)
- Preview 「작업 로그」패널 한글 (`CloudPreviewWorkLog.jsx`)
- `#28` PROD QA — 써머리·탐색
- `/en/…` URL prefix (2차 합의 후)
- 릴리즈 노트 12건 이전 EN 오버레이 (`RELEASE_NOTES_EN_BY_ID`)
- `getFlightOriginMetroHint` 항공 바 tooltip ko
- 버킷 SSOT 미등록 uiPlace (예: 프로비덴시아 섬)

**다음 제시어 (#42)**:

```
영문화 #42, 테스트·최적화
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
main · PROD ?lang=en · audit:i18n · 축제 titleEn 캐시
```
