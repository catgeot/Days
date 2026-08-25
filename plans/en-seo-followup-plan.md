# 영문 검색 SEO — 후속 플랜

**세션 표기**: `영문 SEO #{N}, {단계}`  
**브랜치**: 짧은 SSOT·스모크 → **`main` 직행** · prerender/URL prefix 등 구조 변경 → **`cursor/en-seo`** (+ PR)  
**선행 완료**: main `3cd50468` · `22c7e667` · **탭 SEO** (2026-08-25) — `getPlaceTabSeoTitle` · gallery/planner sitemap · KO/EN 「지명+여행/갤러리/플래너」 meta

**범위 (명확화)**: **홈 내부 검색**은 지명·지역 매칭만으로 충분 — **복합 쿼리 파서는 범위外**. 본 플랜 = **외부 검색엔진**(Google·Naver)에서 「여행지명 + 여행/갤러리/플래너/photos/travel」 노출.

---

## 0. 한 줄 결론

| 질문 | 답 |
|------|----|
| 지금 PROD에 뭐가 올라갔나? | tier1+phuket+galapagos EN copy · **탭별 SEO title/description/keywords** (KO·EN) · sitemap **`/place/:slug/gallery`·`/planner`** · index.html 크롤러 링크 |
| 아직 왜 구글에 약한가? | **SPA** — JS 전 정적 HTML 한계 · **tier2+** EN 폴백 · **인덱싱·순위**는 GSC 재크롤 후 확인 |
| 우선순위? | **#1 PROD QA** → **#2 tier2 EN** → **#3 크롤러 HTML(prerender)** → **#4 explore/korea hreflang·RSS** |

---

## 1. 현재 상태 (2026-08-25 · main 반영됨)

### 1.1 완료

| 영역 | SSOT / 산출 |
|------|-------------|
| 여행지 EN copy | [`src/data/placeSeoEnOverrides.js`](../src/data/placeSeoEnOverrides.js) — 66 slug |
| locale 헬퍼 | [`src/pages/Home/lib/placeSeoText.js`](../src/pages/Home/lib/placeSeoText.js) |
| Helmet | [`src/components/SEO/index.jsx`](../src/components/SEO/index.jsx) — keywords · JSON-LD locale |
| UI 써머리 | PlaceCardSummary · Gallery overview — `getLocalizedPlaceDesc` |
| 정적 크롤러 | [`index.html`](../index.html) — EN 숨김 링크 블록 (Phuket · Galapagos · Angkor · Korea) |
| Sitemap | [`scripts/generate-sitemap.cjs`](../scripts/generate-sitemap.cjs) — `/place/:slug` · **`/gallery`** · **`/planner`** + hreflang |
| 탭 SEO | `getPlaceTabSeoTitle` · `getPlaceTabSeoKeywords` — 「푸켓 여행」「푸켓 갤러리」 등 외부 검색어 정렬 |
| 검증 | `npm run smoke:place-seo-en` |

### 1.2 샘플 — **외부 검색** 기대 스니펫 (JS 렌더·재크롤 후)

| 검색 | URL | `<title>` (Helmet) |
|------|-----|---------------------|
| 푸켓 갤러리 | `/place/phuket/gallery` | `푸켓 여행 사진 · 갤러리 \| GATEO` |
| 푸켓 여행 | `/place/phuket/planner` | `푸켓 여행 · 준비 가이드 \| GATEO` |
| Phuket travel photos | `/place/phuket/gallery?lang=en` | `Phuket travel photos · gallery \| GATEO` |
| Angkor Wat photos | `/place/angkor-wat/gallery?lang=en` | `Angkor Wat travel photos · gallery \| GATEO` |
| Korea festivals | `/korea?lang=en` | `Korea festivals \| GATEO` |

### 1.3 잔여 한계 (이 플랜의 대상)

| # | 한계 | 영향 | 심각도 |
|---|------|------|--------|
| L1 | **SPA + Helmet** — 초기 HTML은 `lang=ko`·한글 meta | JS 미실행 봇·일부 SNS 스크래퍼 | 높음 |
| L2 | **tier2+ (~207)** — `desc_en` 없으면 짧은 EN 템플릿만 | 롱테일 영문 검색 스니펫 품질 | 중 |
| L3 | **RSS** — ko only · [`generate-sitemap.cjs`](../scripts/generate-sitemap.cjs) | 네이버·피드 구독 EN 미대응 | 낮~중 |
| L4 | **sitemap hreflang** — `/explore/*` · `/korea/theme/*` 등 미포함 | locale alternate 불완전 | 중 |
| L5 | ~~탭 URL sitemap·title~~ | ✅ gallery/planner sitemap · compound title/keywords | — |
| L6 | **URL `?lang=en`** — `/en/place/...` prefix 없음 | 영어권 SEO·공유 URL 직관성 · GSC locale 리포트 | 중 (합의 후) |
| L7 | **OG image** — 전역 `og-image.png` | destination별 SNS 미리보기 | 낮 |
| L8 | **측정** — GSC hreflang·영문 쿼리 baseline 없음 | 개선 검증 불가 | 운영 |

---

## 2. Phase 로드맵

| Phase | 세션 | 목표 | VERIFY | 브랜치 |
|-------|------|------|--------|--------|
| **#1** | PROD QA | 배포 후 meta·써머리·sitemap spot-check | 사람 · `smoke:place-seo-en` | — |
| **#2** | tier2 백필 | tier2 전체 `desc_en`/`keywords_en` 또는 상위 popularity N개 | `smoke:place-seo-en` 확장 · `audit:place-seo-en` | main |
| **#3** | 크롤러 HTML | 봇/정적 레이어 — 아래 §3 옵션 중 1택 | Lighthouse/Google Rich Results · 수동 view-source | feature |
| **#4** | sitemap · RSS EN | explore·korea theme hreflang · EN RSS channel 또는 dual-language item | sitemap diff · RSS validator | main |
| **#5** | 탭·구조화 데이터 | gallery/planner URL canonical 일관 · ImageObject schema(갤러리) | smoke · GSC URL inspection | main/feature |
| **#6** | `/en/` prefix (합의) | i18n-en-plan 2차 URL · redirect `?lang=en` ↔ `/en` | `audit:i18n` · routing smoke | feature + PR |
| **#7** | OG · 모니터링 | slug별 og:image(썸네일) · GSC Search Analytics baseline | 사람 QA | main |

**권장 순서**: #1 → #2 → #3 → #4 → (#5와 병행 가능) → #6은 사람 합의 후.

---

## 3. Phase #3 — 크롤러용 HTML (L1 해결) 옵션

SPA 한계를 없애려면 **크롤러가 JS 없이도 locale별 title/description을 읽어야** 한다.

| 옵션 | 개요 | 장점 | 단점 | gateo 적합 |
|------|------|------|------|------------|
| **A. Vercel prerender (bot UA)** | middleware/edge에서 Googlebot 등에 HTML 스냅샷 | 기존 Vite SPA 유지 · top URL만 | 봇 UA spoof · 유지보수 | **1순위 후보** |
| **B. 빌드 타임 SSG subset** | tier1 `/place/*` + `/` + `/korea` 정적 HTML 생성 | 확실한 초기 meta | 빌드 시간 · 동적 데이터 drift | 2순위 |
| **C. Edge HTML shell** | pathname+`lang`별 `<title>`/`<meta>`만 SSR 삽입 | 구현 작음 | 본문·schema는 여전히 SPA | **MVP** (A/B 전 단계) |
| **D. full SSR (Remix/Next)** | 프레임워크 이전 | 최종 SEO | 대형 마이그레이션 | 장기 · 비권장 단기 |

**#3 MVP 제안 (C → A)**  
1. Vercel Edge Middleware: `Accept-Language: en` 또는 `?lang=en` + 주요 path → `index.html` inject용 meta map ([`placeSeoEnOverrides`](../src/data/placeSeoEnOverrides.js) + i18n `seo.*` + korea keys).  
2. 검증 후 Googlebot UA prerender(A) 또는 빌드 SSG(B)로 확장.  
3. **금지**: 전역 SSR 이전 without 명시 승인.

---

## 4. Phase #2 — tier2 EN copy (L2)

| | |
|--|--|
| **범위** | `travelSpots.js` tier=2 (약 175) + hub 명소 tier3 중 `showOnGlobe` |
| **SSOT** | 기존 [`placeSeoEnOverrides.js`](../src/data/placeSeoEnOverrides.js) 확장 (spots JSON 직편집 금지) |
| **우선순위** | `popularity >= 80` → 동남아·한국 inbound 핫스팟 → 나머지 |
| **폴백 유지** | override 없으면 현재 `Discover {name}, {country}...` |
| **감사** | `npm run audit:place-seo-en` — override 커버율 · desc 길이 · Hangul 잔존 0 |

**배치 예**: popularity 상위 40 → smoke PASS → main 커밋 → 잔여 135.

---

## 5. Phase #4 — sitemap · RSS (L3·L4)

### Sitemap

- [`I18N_HUB_PATHS`](../src/i18n/seoUrls.js) 확장 후보: `/explore`, `/korea/theme`, `/korea/theme/courses`, …  
- `/place/:slug/gallery` 등 **탭 URL**은 Phase #5 canonical 정책 확정 후 추가 (중복 URL 주의).

### RSS

- **Option 1**: `rss.xml` `<language>ko</language>` 유지 + `rss-en.xml` 신규 (tier1 EN desc)  
- **Option 2**: item `<title>` bilingual · `<link>?lang=en`  
- 네이버는 ko SSOT 유지 — EN은 Google·Feedly 대상.

---

## 6. Phase #5 · #6 — URL · 탭 (L5·L6)

[`routing-seo-optimization.md`](./archive/misc/routing-seo-optimization.md)와 정합:

- PlaceCard 탭은 이미 `/place/:slug/:tab` — **canonical**이 tab path와 Helmet `url` prop 일치 확인 (#5).  
- `/en/place/phuket/gallery` prefix (#6)는 [`i18n-en-plan.md`](./i18n-en-plan.md) 「2차 URL」과 **동일 결정** — redirect table + `buildLocalePageUrl` 일괄 변경.

---

## 7. 검증 · 운영 (L8)

| 시점 | 액션 |
|------|------|
| #1 PROD QA | GSC URL Inspection: `/`, `/place/phuket/gallery?lang=en`, `/korea?lang=en` |
| #3 이후 | Rich Results Test · `site:gateo.kr phuket` 수동 |
| #7 | GSC Performance — country US/UK/AU · query `phuket`, `angkor wat`, `korea festival` baseline CSV |

**에이전트 VERIFY (매 Phase)**  
`npm run smoke:place-seo-en` · `npm run build` · (해당 시) `node scripts/generate-sitemap.cjs`

---

## 8. 금지 · 가드

- `travelSpots.js` / spots JSON **직접** `desc_en` 필드 추가 금지 → overrides SSOT  
- UI 레이아웃·톤 변경 금지 (`.ai-context` §4.1 5)  
- `/en/` prefix **사람 합의 전** 라우트 변경 금지  
- tier2 일괄 번역 **검증 없이** main push 금지

---

## 9. 핸드오프

**세션** `영문 SEO #1, PROD QA — meta·써머리`  
**main** `22c7e667` (push 완료 · Vercel PROD 배포 대기)  
**일지** [`2026-08-25-project-log.md`](./2026-08-25-project-log.md)

| | |
|--|--|
| **완료** | tier1+phuket+galapagos EN SEO · sitemap place hreflang · smoke |
| **PROD QA** | view-source / Elements — `/?lang=en` · `/place/phuket/gallery?lang=en` · `/korea?lang=en` |
| **다음 Phase** | #2 tier2 백fill 또는 #3 크롤러 HTML MVP |

**다음 제시어**:

```
영문 SEO #1, PROD QA — meta·써머리
@plans/en-seo-followup-plan.md
@plans/2026-08-25-project-log.md
www.gateo.kr/place/phuket/gallery?lang=en · angkor-wat · korea?lang=en
금지: /en/ prefix·SSR 이전 without 합의
```

**#2 tier2 시작 제시어**:

```
영문 SEO #2, tier2 desc_en 백필
@plans/en-seo-followup-plan.md
main · popularity≥80 우선 · audit:place-seo-en
금지: travelSpots.js 직접 desc_en
```
