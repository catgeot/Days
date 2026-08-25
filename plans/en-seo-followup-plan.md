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

### 1.3 잔여 한계

| # | 한계 | 심각도 |
|---|------|--------|
| L1 | SPA — 초기 HTML 한글 meta 고정 | 높음 |
| L2 | tier2+ EN 템플릿 폴백 | 중 |
| L3 | RSS ko only | 낮~중 |
| L4 | ~~explore·korea/theme hreflang~~ | ✅ (#5) |
| L5 | ~~탭 sitemap~~ | ✅ |
| L6 | `/en/` prefix 없음 (합의 후) | 중 |
| L7 | ~~전역 og:image~~ | ✅ (#10) |
| L8 | GSC baseline 없음 | 운영 |

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

**권장 순서**: #1 → #2 → #3 → #4 → #5 → (#6·#7 연속) → #8. #9·#10은 여유 시.

**Preview**: PROD `?crawler=1` view-source — `www.gateo.kr/place/phuket/gallery` · `/korea` · `/` (배포 후). `/qa/en-seo` → tier1 gallery 샘플.

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

**세션** `검색노출 #10, PROD QA — og:image·ImageGallery`  
**main** `3b1816a8` · 일지 [`2026-08-25-project-log.md`](./2026-08-25-project-log.md)  
**인덱스** [`feature-handoff-index.md`](./feature-handoff-index.md) 「검색노출」행

| | |
|--|--|
| **완료 (#10)** | slug og:image SSOT · gallery ImageGallery/ImageObject · tier1 crawler inject |
| **PROD QA** | view-source `?crawler=1` `/place/tokyo/gallery` PASS(og:image·ImageGallery JSON-LD) · phuket tier2=SPA only |
| **잔여(사람)** | `/place/phuket/gallery` DevTools og:image·JSON-LD 1회 · GSC URL Inspection tier1 gallery |
| **다음 (#11)** | GSC baseline CSV · tier2 pop70–79 EN ~70 slug 백로그 |

**다음 제시어 (#11)**:

```
검색노출 #11, GSC baseline·tier2 EN 잔여
@plans/feature-handoff-index.md
@plans/en-seo-followup-plan.md
@plans/2026-08-25-project-log.md
main · GSC URL Inspection · tier2 pop70–79 ~70 slug
금지: tier2 crawler inject(합의 전)
```
