# 한·영 검색 노출 SEO — 후속 플랜

**세션 표기**: `검색노출 #{N}, {단계}` (구 `영문 SEO`와 동일 주제 · #N 리셋 금지)  
**브랜치 정책** — 아래 **§2 세션표** 「브랜치」열 SSOT:

| 작업 종류 | 브랜치 |
|-----------|--------|
| SSOT·sitemap·overrides·smoke·index 정적 링크·문서 | **`main` 직행** (원격 push는 세션 종료 시 또는 사람 요청) |
| Edge middleware · prerender · `/en/` URL prefix | **`cursor/en-seo`** (+ PR) |

**세션 시작 (필수)** — 동일 계획서·동일 브랜치(`main`) 기준선 맞추기:

```bash
git fetch origin main
git checkout main
git pull --rebase origin main   # 로컬 only 작업 금지 · 스냅샷 구버전 금지
```

세션 종료: VERIFY PASS → `git push origin main` (또는 사람 요청 시).

**선행 완료** (main, 2026-08-25):

- `placeSeoEnOverrides` · Helmet keywords · `/place/*` hreflang
- **`getPlaceTabSeoTitle` · 탭별 keywords** — KO/EN 「지명+여행/갤러리/플래너」 meta
- sitemap **`/place/:slug/gallery`·`/planner`** ×273 · index KO·EN 크롤러 링크

**범위 (명확화)**: **홈 내부 검색**은 지명·지역 매칭만 — 복합 쿼리 파서 **범위外**. 본 플랜 = **외부 검색엔진**(Google·Naver)에서 「여행지명 + 사진/갤러리/여행/여행 계획/photos/travel/planner」 노출.

---

## 0. 한 줄 결론

| 질문 | 답 |
|------|----|
| 세션마다 끝낼 수 있나? | **예** — §2 표: 세션당 **1 산출·1 VERIFY 게이트** (tier2는 40 slug/세션) |
| main에서 하나? | **#1~#5·#8~#9 = main** · **#6~#7만 `cursor/en-seo`+PR** |
| 지금 PROD에 뭐가 올라갔나? | tier1 EN copy · **탭별 SEO title/description/keywords** (KO·EN) · sitemap gallery/planner |
| 아직 약한 이유? | **SPA** — view-source 정적 HTML 한계 · tier2 EN 폴백 · GSC 재크롤·baseline 없음 |
| 다음? | **#1 PROD QA** → **#2 의도 SSOT** → **#3 tier2 EN** → **#4 hreflang** → **#5~#6 크롤러 HTML** |

---

## 1. 현재 상태

### 1.1 완료

| 영역 | SSOT / 산출 |
|------|-------------|
| 여행지 EN copy | [`placeSeoEnOverrides.js`](../src/data/placeSeoEnOverrides.js) — **106 slug** (tier1 + tier2 batch1) |
| locale·탭 SEO | [`placeSeoText.js`](../src/pages/Home/lib/placeSeoText.js) — SSOT [`placeSearchIntent.js`](../src/data/placeSearchIntent.js) 참조 |
| Helmet | [`SEO/index.jsx`](../src/components/SEO/index.jsx) |
| Sitemap | [`generate-sitemap.cjs`](../scripts/generate-sitemap.cjs) — `/place/*` · `/gallery` · `/planner` + hreflang |
| 정적 크롤러 | [`index.html`](../index.html) — KO·EN 숨김 링크 |
| 검증 | `npm run smoke:place-seo-en` · `npm run audit:place-seo-en` |

### 1.2 검색 의도 → URL (SSOT: `placeSearchIntent.js`)

| intentId | KO 예시 쿼리 | EN 예시 쿼리 | tab | URL |
|----------|---------------|--------------|-----|-----|
| `gallery` | 푸켓 사진, 푸켓 갤러리 | phuket photos, phuket gallery | gallery | `/place/:slug/gallery` |
| `travel` | 푸켓 여행, 푸켓 관광 | phuket travel | planner 또는 gallery | `/place/:slug/planner` |
| `planner` | 푸켓 여행 계획 | phuket trip planning | planner | `/place/:slug/planner` |
| `video` | 푸켓 여행 영상 | phuket travel videos | video | `/place/:slug/video` |
| `reviews` | 푸켓 후기 | phuket reviews | reviews | `/place/:slug/reviews` |
| `wiki` | 푸켓 여행 스케치 | phuket travel guide | wiki | `/place/:slug/wiki` |

**백로그 (#13) — 항공 경로 intent** (제안 · 미착수):

| intentId | KO 예시 쿼리 | EN 예시 | tab | 비고 |
|----------|-------------|---------|-----|------|
| `flight-route` | 푸켓 항공, 푸켓 항공 경로, 서울 푸켓 직항 | phuket flights, ICN to HKT | **planner** | 신규 URL 없음 · `travelSpotFlightRoutes`·`flightRouteHubIatas`로 title/desc 보강 |

- **장점**: GATEO 3D 항공 경로·플래너 항공권 카드와 검색 의도 정합 · 「지명+항공」 한국어 쿼리 커버
- **주의**: OTA 키워드 경쟁·실시간 운항과 무관(경로·IATA SSOT만) · crawler description에 `ICN→HKT` 등 **팩트만** (가격·스케줄 금지)
- **1세션 산출**: `placeSearchIntent` flight-route · planner keywords/title · tier1 crawler meta route snippet · smoke

### 1.4 허브·기능 SEO (큐레이션·명승·축제·탐색·팁) — **고려 대상**

여행지(`/place/*`)와 별 트랙. **신규 URL 남발 금지** — 기존 라우트·Helmet·crawler·sitemap 정합.

| 기능 | URL | Helmet(SPA) | sitemap | hreflang | crawler `?crawler=1` | 검색 의도 예시 |
|------|-----|-------------|---------|----------|----------------------|----------------|
| **축제** | `/korea` | ✅ | ✅ | ✅ | ✅ (#7) | 국내 축제, 지역별 축제 |
| **한국의 명승** | `/korea/theme/scenic` | ✅ | ✅ | ✅ | ❌ **갭** | 명승지, 국가유산 명승, ~~선정 명소~~ |
| **Explore·권역** | `/explore`, `/explore/:대륙/:테마` | 기본(홈) | ✅ | ✅ (#5) | ❌ **갭** | 아시아 휴양지, 유럽 문화 여행 |
| **국가·위치** | Explore 필터 + PlaceCard `country` | place SEO 일부 | 카테고리 URL | partial | place 쪽만 | 「태국 여행지」, 「일본 어디」→ explore 또는 place |
| **AI 큐레이션** | `/blog/curation` | ❌ **갭** | ❌ **갭** | ❌ | ❌ | 여행 큐레이션, 숨은 낙원 추천 |
| **로그북** | `/blog` (sitemap은 `/logbook`) | ❌ **갭** | ⚠️ URL 불일치 | ❌ | ❌ | 여행 기록·후기 (자유여행 **기록** 쪽) |

### 1.5 「자유여행」검색 의도 — **다면 랜딩** (합의)

「자유여행」= 정해진 패키지가 아니라 **자유로운 정보 탐색**. 단일 URL·단일 탭으로 묶지 않고, **의도별 1차 랜딩**만 SEO SSOT로 고정.

| 탐색 유형 | 제품 표면 | 1차 SEO URL | meta·keywords 예시 | crawler |
|-----------|-----------|-------------|-------------------|---------|
| 준비·일정·예약 연결 | **플래너** (툴킷·체크리스트·항공·숙소) | `/place/:slug/planner` | 푸켓 자유여행, 여행 준비, 여행 계획 | place crawler |
| 스케치·가이드·읽을거리 | **여행 스케치** (wiki 매거진) | `/place/:slug/wiki` | 푸켓 여행 스케치, 여행 가이드 | (#16) wiki sitemap·inject |
| 실전·현지 팁 | **로컬 왓슨** (wiki 탭 내 AI 팁) | `/place/:slug/wiki` | 푸켓 현지 팁, 로컬 팁, 자유여행 팁 | wiki desc·keywords에 병기 |
| 대화형·궁금증 | **MOONi(무니)** (FAB·채팅, **전용 URL 없음**) | planner 또는 wiki **description**에 「AI 도슨트·무니」 | 크롤러 meta 문장·홈 키워드 | view-source URL **신설 안 함** |

**SSOT 원칙**

- `placeSearchIntent`: `planner`·`wiki` intent에 **자유여행** suffix 공유 (`자유여행`, `배낭`, `free travel`, `independent travel` 등) — **탭은 2개로 유지**
- 로컬 왓슨: **wiki 탭 SEO**에 흡수 (별도 `/local-watson` 라우트 금지)
- 무니: Helmet **description 1문장** + 홈·place JSON-LD `AI docent` — 채팅 UI는 SPA·GSC 렌더링 대상
- 큐레이션(`/blog/curation`): **발견·추천** 축 (자유여행 **입문**) — #15와 분리

**#16 산출 (갱신)**: planner+wiki 자유여행 keywords · wiki title/desc에 로컬 왓슨·스케치 · 선택 wiki sitemap · smoke

**우선순위 (제안)**:

1. **#14 허브 crawler** — `/korea/theme/scenic` · `/explore` view-source (축제·명승·권역 탐색)
2. **#15 큐레이션·로그북** — `/blog/curation` Helmet · sitemap `/blog` canonical · `/logbook`→`/blog` redirect 또는 sitemap 수정
3. **#16 자유여행 intent** — planner+wiki 다면 랜딩(§1.5) · 로컬 왓슨 keywords · 무니는 desc만
4. **#17 explore 대륙·테마** — `/explore/asia/paradise` 등 카테고리별 title·keywords · index 정적 링크 EN

**금지**: 홈 내부 검색 파서 변경 · UI 레이아웃 변경 · `/en/` prefix (합의 전)

### 1.3 잔여 한계

| # | 한계 | 심각도 |
|---|------|--------|
| L1 | SPA — 초기 HTML 한글 meta 고정 | 높음 → **tier1+tier2 pop≥80+pop70–79 top40 crawler** (#11–#12) · 잔여 tier2는 SPA |
| L2 | tier2+ EN 템플릿 폴백 | 중 |
| L3 | RSS ko only | 낮~중 |
| L4 | ~~explore·korea/theme hreflang~~ | ✅ (#5) |
| L5 | ~~탭 sitemap~~ | ✅ |
| L6 | `/en/` prefix 없음 (합의 후) | 중 |
| L7 | ~~전역 og:image~~ | ✅ (#10) |
| L8 | GSC baseline 없음 | 운영 |
| L9 | **허브 crawler** — scenic·explore·curation view-source | 중 (#14–#15) |
| L10 | **큐레이션·/blog** sitemap·Helmet 없음 | 중 (#15) |
| L11 | **자유여행** planner·wiki·로컬왓슨 intent·wiki sitemap | 낮~중 (#16 §1.5) |
| L12 | **/logbook vs /blog** sitemap 불일치 | 낮 (#15) |

---

## 2. 세션별 실행표 (1세션 = 1완료 단위)

**규칙**: 세션 종료 시 **해당 행 VERIFY PASS** · 일지 2~5줄 · §9 제시어 갱신. tier2는 **40 slug/세션** 고정(번역 품질·리뷰 가능 범위).

| #N | 채팅명 (복붙) | 산출 (이번 세션 끝에 있어야 할 것) | VERIFY | 브랜치 |
|----|---------------|--------------------------------------|--------|--------|
| **#0** | (완료) 탭 SEO·sitemap | `getPlaceTabSeoTitle` · gallery/planner sitemap | `smoke:place-seo-en` · `build` | main ✅ |
| **#1** | `검색노출 #1, PROD QA — meta·탭 title` | 사람 QA 체크리스트 완료 · GSC URL Inspection 메모 | 사람 · `smoke:place-seo-en` | main |
| **#2** | `검색노출 #2, 검색의도 SSOT` | [`placeSearchIntent.js`](../src/data/placeSearchIntent.js) · `placeSeoText` import · 플랜 §1.2와 동기 | `smoke:place-seo-en` · `build` | main ✅ |
| **#3** | `검색노출 #3, tier2 EN 배치1` | overrides **+40** (popularity≥80) · `audit:place-seo-en` 스크립트 신규 | audit · smoke · `build` | main ✅ |
| **#4** | `검색노출 #4, tier2 EN 배치2` | overrides **+40** (kobe·okinawa + pop70–79) | audit · smoke · `build` | main ✅ |
| **#5** | `검색노출 #5, explore·korea hreflang` | [`seoUrls.js`](../src/i18n/seoUrls.js) `I18N_HUB_PATHS` 확장 · sitemap 재생성 | sitemap diff · smoke · `build` | main ✅ |
| **#6** | `검색노출 #6, 크롤러 HTML MVP` | Edge middleware · tier1 gallery/planner meta inject | view-source · `build` · PR | main ✅ |
| **#7** | `검색노출 #7, 크롤러 HTML 확장` | `/` · `/korea` · tier1 base path · Googlebot 검증 | GSC 렌더링 · PR | main ✅ |
| **#8** | `검색노출 #8, 정적링크·baseline` | index.html tier1×intent KO 링크 보강 · GSC baseline CSV(사람) | smoke · 일지 | main ✅ |
| **#9** | `검색노출 #9, RSS·canonical` (선택) | `rss-en.xml` 또는 bilingual item · canonical 점검 | RSS validator · smoke | main |
| **#10** | `검색노출 #10, OG·스키마` (백로그) | slug og:image · ImageObject(갤러리) | smoke · build | main ✅ |
| **#11** | `검색노출 #11, tier2 crawler 배치1` | crawler meta **+43** tier2 pop≥80 (phuket 등) · view-source og:image·ImageGallery | `smoke:crawler-place-meta` · `build` | main ✅ |
| **#12** | `검색노출 #12, tier2 crawler 배치2+` | pop70–79 top **40** slug · 107→147 | smoke · view-source | main ✅ |
| **#12+** | `검색노출 #12+, tier2 crawler 배치3` | pop70–79 next **40** slug · 147→187 | smoke · view-source | main ✅ |
| **#13** | `검색노출 #13, tier2 crawler 배치4 마무리` | pop70–79 잔여 **29** slug · 187→**216** · `INCLUDED` 80→109 | smoke · view-source | main ✅ |
| **#14** | `검색노출 #14, 항공 경로 SEO` (제안) | `flight-route` intent → planner · ICN→IATA title/keywords · crawler route snippet | smoke · view-source | main |
| **#15** | `검색노출 #15, 허브 crawler` | middleware **`/korea/theme/scenic`** · **`/explore`** · hub meta SSOT | view-source · smoke | main |
| **#16** | `검색노출 #16, 큐레이션·로그북 SEO` | `/blog/curation` Helmet · sitemap `/blog` · logbook URL 정합 | smoke · build | main |
| **#17** | `검색노출 #17, 자유여행 intent` | §1.5 planner+wiki suffix · 로컬 왓슨 keywords · wiki sitemap(선택) · 무니=desc | smoke | main |
| **#18** | `검색노출 #18, explore 카테고리` | 대륙×테마 title/desc · index EN 링크 | smoke · sitemap | main |

**권장 순서**: #1 → … → #10 → **#11~#13 tier2 crawler**(pop70–79 전수) → #14+. GSC baseline·tier2 EN 잔여는 병행.

**Preview**: PROD `?crawler=1` view-source — `www.gateo.kr/place/phuket/gallery`(tier2 pop≥80) · `/place/tokyo/gallery`(tier1).

---

## 3. Phase 상세 (세션표 보조)

### #1 PROD QA

| URL | 확인 |
|-----|------|
| `/place/phuket/gallery` | title `푸켓 여행 사진 · 갤러리` · 한글 description |
| `/place/phuket/planner?lang=en` | `Phuket travel` · planner intent |
| `/place/angkor-wat/gallery?lang=en` | photos intent |
| `/korea?lang=en` | Korea festivals |
| GSC | URL Inspection — 렌더 전/후 meta 차이 기록 |

### #2 검색 의도 SSOT

- `src/data/placeSearchIntent.js` — intentId · tab · koQuerySuffix[] · enQuerySuffix[] · sitemapPriority · staticLinkTier
- `placeSeoText.js` — title/keyword 템플릿이 SSOT 참조 (중복 상수 제거)
- **금지**: UI 변경 · `travelSpots.js` 직접 편집

### #3·#4 tier2 EN copy

| | |
|--|--|
| SSOT | [`placeSeoEnOverrides.js`](../src/data/placeSeoEnOverrides.js) |
| 배치 | **40 slug/세션** · popularity≥80 우선 |
| 감사 | `npm run audit:place-seo-en` — 커버율 · Hangul 0 · desc 길이 |

### #5 sitemap · hreflang

- `I18N_HUB_PATHS`: `/explore`, `/korea/theme`, `/korea/theme/courses`, …
- `node scripts/generate-sitemap.cjs` → `public/sitemap.xml` 커밋

### #6·#7 크롤러 HTML (L1)

| 옵션 | 적합 |
|------|------|
| C Edge meta shell | **MVP (#6)** |
| A Vercel bot prerender | **확장 (#7)** |
| D full SSR | 금지(합의 전) |

### #11~#13 tier2 crawler (pop70–79)

| | |
|--|--|
| SSOT | [`scripts/generate-crawler-place-meta.mjs`](../scripts/generate-crawler-place-meta.mjs) · 큐 [`scripts/data/tier2-crawler-pop70-79-queue.json`](../scripts/data/tier2-crawler-pop70-79-queue.json) |
| 상수 | `TIER2_CRAWLER_POP70_79_INCLUDED` — **109/109** (전수 완료) |
| **#13 완료** | crawler **216 slug** · smoke bohol assert · santorini(pop&lt;70) null |
| PROD QA | `/place/bohol/gallery?crawler=1` · `/place/galapagos/gallery?crawler=1` view-source |

### #8 이후

- index KO intent 링크 · GSC baseline CSV
- RSS EN · ImageObject · `/en/` prefix — [`i18n-en-plan.md`](./i18n-en-plan.md) 2차 URL과 **동일 결정**

---

## 4. 금지 · 가드

- `travelSpots.js` / spots JSON 직접 `desc_en` 금지 → overrides SSOT
- UI 레이아웃·톤 변경 금지 (`.ai-context` §4.1 5)
- `/en/` prefix **사람 합의 전** 라우트 변경 금지
- tier2 일괄 번역 **검증 없이** push 금지
- 홈 내부 검색·동명 지명 SSOT 변경 금지 (외부 SEO와 별 트랙)

---

## 5. 검증 커맨드

```bash
npm run generate:sitemap              # public/sitemap.xml + rss + rss-en (build 선행)
npm run smoke:place-seo-en
npm run smoke:rss-canonical
npm run build                         # generate-sitemap → vite → verify-sitemap-dist → verify-rss-dist
node scripts/generate-sitemap.cjs   # 수동만 필요할 때
npm run audit:place-seo-en            # #3 이후
```

---

## 9. 핸드오프

**세션** `검색노출 #13, tier2 crawler 배치4 마무리`  
**main** (push 후 SHA) · 일지 [`2026-08-25-project-log.md`](./2026-08-25-project-log.md)  
**인덱스** [`feature-handoff-index.md`](./feature-handoff-index.md) 「검색노출」행

| | |
|--|--|
| **완료 (#13)** | tier2 pop70–79 **109/109** crawler · **216 slug** · bohol·galapagos batch4 |
| **tier2 crawler** | pop≥80 + pop70–79 **전수 완료** — tier2 pop&lt;70은 SPA Helmet만 |
| **다음** | #14 항공 경로 SEO · #15 허브 crawler |

**다음 제시어 (#14)**:

```
검색노출 #14, 항공 경로 SEO
@plans/feature-handoff-index.md
@plans/en-seo-followup-plan.md
@plans/2026-08-25-project-log.md
main · flight-route intent · view-source ?crawler=1
```

**PROD QA (#13)**:

```
view-source ?crawler=1 · /place/bohol/gallery · /place/galapagos/gallery
```
