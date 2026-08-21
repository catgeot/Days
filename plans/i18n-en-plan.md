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

**인덱스**: [`feature-handoff-index.md`](./feature-handoff-index.md)

**상태 (#31)**: P0-A 투어·탐색 EN · **GYG 위젯 locale 동기** · hangul debt **66**줄 · `en` 누락 **0**

**브랜치**: `cursor/en` · `/qa/en`

**다음 제시어** (`cloud-preview-continuity` §1.2):

```
영문화 #32, P0-B ReviewsTab EN
@plans/feature-handoff-index.md
@plans/2026-08-20-project-log.md
@plans/i18n-en-plan.md
cursor/en · ReviewsTab · audit:i18n
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
2. **TourAPI 본문 (`/korea`·`/korea/theme/*`)** — **KorService2 SSOT** (`TOUR_API_BODY_LOCALE=ko`) · EngService2 본문 EN **롤백(A)**
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

**#30 debt 상위** (다음 세션 P0-B):

1. `ReviewsTab.jsx` — 10줄 (tier B)
2. `HomeUI.jsx` — 1줄 (tier A 잔여)
3. `FestivalDetailSheet.jsx` — 53줄 (tier C · UI EN·본문 ko SSOT)

**제외·참고**: `FestivalDetailSheet` tier C — UI EN·본문 ko SSOT(Chrome 번역) · `missingInKo` 219건은 en-only 지구본 국가 키
