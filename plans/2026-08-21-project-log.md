# 2026-08-21 프로젝트 일지

직전: [`2026-08-20-project-log.md`](./2026-08-20-project-log.md)

## 영문화 #38, PROD QA — 한국 2차 UI·지도명 잔여 확인

- **범위** main `72144c4d` · `/korea?lang=en` · `/korea/theme/scenic?lang=en`
- **PASS** 축제 상단 분류칩 EN · 홈·탐색·PlaceCard P0
- **잔여** 명승 지도 breadcrumb·핀 · `ThemeSpotDetailModal` UI → **#39·#40** · 축제 지도·title → **#41**

## 영문화 #39~#41 — 명승·축제 UI·지도 EN (cursor/en · PR #141)

- **#39** `ThemeSpotDetailModal` UI · 지도 breadcrumb·핀 · `scenicSpotMapTitle`
- **#40** 명승 모달 헤더·인근 축제 크로스 · 내 위치 칩 EN
- **#41** `festivalTitleEnMerge` · `KoreaFestivalMap` · `FestivalDetailSheet` 헤더·크로스 UI
- **VERIFY** `audit:i18n` · `build` · `smoke:festival-detail-locale` · scenic 스모크 PASS
- **잔여(데이터)** EngService2 미등록 축제 핀 ko · TourAPI POI명 ko — 차차

## 영문화 #41, main 병합 — Preview QA OK

- **결정** 사람 Preview QA OK · 잔존 이슈는 차차 · **PR #141 → main `5c8adea5`**
- **다음** **#42 테스트·최적화** — PROD 회귀 · en fetch/캐시 · 알려진 한계 정리

## 영문화 #42, PROD QA — 탐색 크래시·titleEn 캐시

- **크래시** `614ed344` EN 라벨 추가 후 `CardBackgroundImage`가 스코프 밖 `displayName` 참조 → lazy load 시 ReferenceError · **수정** `648fa6bf`
- **성능** ko locale 첫 fetch 시 en window 2nd fetch 생략 · en 전환·캐시 hit lazy merge 유지 · **904c93e7**
- **VERIFY** `audit:i18n` · `build` · `smoke:festival-detail-locale` PASS
- **사람 QA** main push·배포 후 `/?lang=en` → 탐색 진입·Island getaways · `/korea?lang=en` 축제 EN title

## 영문화 #42 — 명승 모달 PACKAGES CTA EN

- **증상** `?lang=en` 명승 상세 PACKAGES 버튼 「강원 패키지」ko 유지
- **수정** `ThemeSpotCrossRail` → `localizedPackageCtaLabel(key)` · EN 「Gangwon packages」
- **VERIFY** `smoke:festival-detail-locale` · `build` PASS

## 영문화 #42 — 명승 모달 상단 지역 EN

- **증상** `?lang=en` 명승 모달 제목 아래 「강원」ko (축제→인근 명승 경로)
- **수정** `localizedSpotModalSubtitle` · `toScenicModalSpot` · `formatScenicSpotPlaceLabel` areaCode 폴백 · `142fb4d9`+`…`
- **VERIFY** node `formatScenicSpotPlaceLabel({region:강원}, en)` → Gangwon

## 영문화 #42b, PROD QA — 로고·About

- **범위** `/?lang=en` · LogoPanel · FooterModal · `footerData` `titleEn`/`contentEn`
- **수정** `resolveFooterBlock` · About/Terms/Privacy/Contact EN 본문 · 패널·모달 UI i18n(`home.logoPanel`·`home.footerModal`)
- **VERIFY** `audit:i18n` · `build` PASS
- **잔여** Credits(`MapboxCreditsPanel`) · Updates(`ReleaseNotesList`) ko · Preview 작업 로그

## 영문화 #42c, PROD QA — 버킷 카드·Credits

- **버킷 카드** `getSavedTripDisplayName` — SSOT·정착지·나라 칩 EN 폴백 (가이아나→Guyana 등)
- **Credits** `resolveMapboxAttribution` — intro·Maxar·Telemetry·tech stack EN
- **VERIFY** `audit:i18n` · `build` PASS
- **잔여** SSOT 미등록 uiPlace(예: 프로비덴시아 섬) · Updates(`ReleaseNotesList`) ko

## 영문화 #42d, PROD QA — Updates·3D투어·항공경로 EN

- **증상** `?lang=en` Updates 탭·3D투어 상태창·항공경로 바 한글 유지 (#42b~c 잔여)
- **수정** `releaseNotes` EN 오버레이(최근 12건) · `ReleaseNotesList` · `TourMobileBar` · `HomeGlobeMapbox` 투어 범례 · `FlightCinemaBar` 전체 UI
- **VERIFY** `audit:i18n` · `build` PASS · **main `fa22be18` push**
- **잔여** 오래된 릴리즈 노트(12건 이전) KO 폴백 · `SiteUpdateBanner` ko

---

## 영문화 #42e — 에이전트 핸드오프 (다음 세션)

**세션 표기**: `영문화 #42e, PROD QA — SiteUpdateBanner·릴리즈 노트 EN`

| | |
|--|--|
| **브랜치** | `main` (`bd46b688` · tip `fa22be18` i18n) |
| **PROD QA** | `https://www.gateo.kr/?lang=en` |
| **이전 완료** | #42d — Updates 탭·3D투어·항공경로 바 EN (`fa22be18`) |

### 읽을 것 (3)

1. 본 절 + 아래 **작업 표**
2. [`feature-handoff-index.md`](./feature-handoff-index.md) — 영문화 행
3. [`i18n-en-plan.md`](./i18n-en-plan.md) **§9만** (전문 Read 금지)

### Read 금지

- `travelSpots.js` 전체 · `i18n-en-plan` §1~8·§13 전문
- 닫힌 일지 · `.ai-context` 5절 이력

### #42e 작업 (우선순위)

| P | 작업 | 파일 | 메모 |
|---|------|------|------|
| **1** | 홈 업데이트 **팝업** EN | `SiteUpdateBanner.jsx` | `release?.title`/`items` 직접 표시 → `resolveReleaseNote(release, i18n.language)` · `useTranslation` 이미 있음 |
| **2** | 신규 릴리즈 노트 **EN 동시 추가** 규칙 | `releaseNotes.js` | `RELEASE_NOTES` 맨 앞 + `RELEASE_NOTES_EN_BY_ID` **동일 id** (파일 상단 주석 참고) |
| **3** | (선택) 구형 노트 EN | `releaseNotes.js` | 12건 이전 id — Updates 탭 KO 폴백만; 필요 시 점진 추가 |
| 백로그 | 항공 metro tooltip ko | `flightOriginMetroGateways.js` `getFlightOriginMetroHint` | Bar info tooltip 한 줄 |
| 백로그 | Preview 작업 로그 ko | `CloudPreviewWorkLog.jsx` | PROD 비노출 · Cloud 전용 |
| 백로그 | 버킷 SSOT 미등록명 | `placeRouteHydrate.js` | 예: 프로비덴시아 섬 — 데이터 이슈 |

### 구현 힌트 (#42e P1)

```jsx
// SiteUpdateBanner.jsx — release 모드 본문
import { resolveReleaseNote } from '../../data/releaseNotes';
const { title, items } = resolveReleaseNote(release, i18n.language);
// title / items 로 교체 (isRefresh 분기는 layout.siteNotice.* 유지)
```

### VERIFY

```bash
npm run audit:i18n && npm run build
```

**사람 QA** (`?lang=en`): 홈 첫 방문(또는 localStorage `gateo_seen_release` 삭제) → 팝업 제목·항목 EN · About → Updates 최신 카드 EN 일치.

### 금지

- UI 임의 리디자인 · `RELEASE_NOTES` 사용자 합의 없이 추가 · browser/computerUse QA

**다음 제시어 (#42e)**:

```
영문화 #42f, PROD QA — 배포 후 회귀
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
main · ?lang=en · SiteUpdateBanner EN · 숙소 제목 EN
```

## 영문화 #42e, PROD QA — SiteUpdateBanner·릴리즈 노트·숙소 찾기 EN

- **SiteUpdateBanner** `resolveReleaseNote(release, i18n.language)` — 팝업 제목·항목 EN
- **숙소 찾기** `getLocalizedPlaceName` — 헤더·일정바 「로키 산맥」→ Rocky Mountains
- **MRT 목록** Edge `Accept-Language: en-US` · 클라 `locale` 캐시 분리
- **VERIFY** `audit:i18n` · `build` PASS
- **사람 QA** `?lang=en` · localStorage `gateo_seen_release` 삭제 후 팝업 EN · Rocky Mountains 숙소 목록

## 영문화 #42e — Edge deploy

- **명령** `npx supabase functions deploy fetch-mrt-stays --project-ref phdjnbfitvmrguqzverm --no-verify-jwt` ✅
- **VERIFY** `smoke:health` P0-4 PASS · `MRT_STAY_SMOKE_LIVE=1` PASS
