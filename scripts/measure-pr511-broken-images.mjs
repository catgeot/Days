#!/usr/bin/env node
/**
 * PR511 QA: broken vs loading vs OK image counts + loaded screenshots.
 * node scripts/measure-pr511-broken-images.mjs
 *
 * Local fix preview: build with prod public flags, e.g.
 *   VITE_GATEO_PLACE_TRAVELOGUE_CARD=1 npm run build
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { webkit } from 'playwright';

const PROD = 'https://www.gateo.kr/';
const LOCAL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = process.env.PR511_QA_OUT || '/opt/cursor/artifacts/pr511-qa';
const STORE = '/cursor/stores/self/artifacts/pr511-qa';

const PLACES = [
  { slug: 'bangkok', query: '방콕', result: '방콕' },
  { slug: 'rio-de-janeiro', query: '리우', result: '리우데자네이루' },
  { slug: 'gyeongbokgung', query: '경복궁', result: '경복궁' },
  { slug: 'yanggu', query: '양구', result: '양구' },
  { slug: 'gangneung', query: '강릉', result: '강릉' },
];

const SCREENSHOT_PLACES = PLACES.filter((p) => p.slug !== 'gangneung');
const VIEWPORTS = [
  { width: 390, height: 844, tag: '390' },
  { width: 1280, height: 900, tag: '1280' },
];

async function openFromSearch(page, base, query, resultText) {
  await page.goto(`${base}?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('button', { name: /여행지 검색|여행지 탐색/i }).first().click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  await page.locator('input[placeholder]:visible').first().fill(query);
  await page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: resultText })
    .first()
    .click();
  await page.waitForURL(/\/place\//, { timeout: 60_000 });
}

async function loadGalleryFully(page) {
  await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
  const loadMore = page.getByRole('button', { name: /더 많은 사진/ });
  for (let i = 0; i < 3; i++) {
    if (!(await loadMore.isVisible().catch(() => false))) break;
    await loadMore.scrollIntoViewIfNeeded();
    await loadMore.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
  }
  let lastHeight = 0;
  for (let step = 0; step < 14; step++) {
    await page.evaluate(() => {
      window.scrollBy(0, Math.max(400, window.innerHeight * 0.85));
    });
    await page.waitForTimeout(400);
    const h = await page.evaluate(() => document.body.scrollHeight);
    if (h === lastHeight && step > 4) break;
    lastHeight = h;
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(5000);
}

async function countImages(page) {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    let broken = 0;
    let loading = 0;
    let ok = 0;
    for (const img of imgs) {
      if (!img.complete) loading += 1;
      else if (img.naturalWidth === 0) broken += 1;
      else ok += 1;
    }
    return { total: imgs.length, broken, loading, ok };
  });
}

async function screenshotLoaded(page, placeSlug, envTag, viewportTag, width, height) {
  const name = `pr511-${placeSlug}-${envTag}-${viewportTag}-loaded.png`;
  await page.screenshot({
    path: join(OUT, name),
    clip: { x: 0, y: 0, width, height },
  });
  return name;
}

async function measurePlace(base, envTag, place, captureShots) {
  const resultsByVp = {};
  for (const vp of VIEWPORTS) {
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'ko-KR',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await openFromSearch(page, base, place.query, place.result);
    await loadGalleryFully(page);
    resultsByVp[vp.tag] = await countImages(page);
    if (captureShots && SCREENSHOT_PLACES.some((p) => p.slug === place.slug)) {
      await screenshotLoaded(page, place.slug, envTag, vp.tag, vp.width, vp.height);
    }
    await browser.close();
  }
  return resultsByVp;
}

function fmtCounts(c) {
  return `broken ${c.broken} / loading ${c.loading} / ok ${c.ok} / total ${c.total}`;
}

function buildMd(rows, extras) {
  const lines = [
    '# PR511 broken image count (WebKit, search path, full gallery scroll + 5s settle)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Blocking — image states at 390px',
    '',
    'After full scroll, network idle, and ~5s wait: **broken** = `complete && naturalWidth===0`; **loading** = `!complete`; **ok** = loaded with natural width.',
    '',
    '| place | main (broken / loading / ok / total) | fix (broken / loading / ok / total) |',
    '|-------|--------------------------------------|-------------------------------------|',
  ];
  for (const r of rows) {
    const m = r.main390;
    const f = r.fix390;
    lines.push(
      `| ${r.place} | ${m.broken} / ${m.loading} / ${m.ok} / ${m.total} | ${f.broken} / ${f.loading} / ${f.ok} / ${f.total} |`,
    );
  }
  lines.push('', '### One-line summary (390 broken/total)', '');
  for (const r of rows) {
    lines.push(
      `- **${r.place}**: main ${r.main390.broken}/${r.main390.total} | fix ${r.fix390.broken}/${r.fix390.total}`,
    );
  }
  lines.push(
    '',
    '### Gray tiles vs broken vs loading',
    '',
    'Empty gray gallery cells in screenshots are usually **lazy `<img>` still `!complete`** (counted as *loading*), not `naturalWidth===0` broken. Overseas pages often keep many off-viewport tiles in loading state even after scroll + 5s; domestic hubs (yanggu) tend toward all *ok* on PROD.',
    '',
    '### 1280px broken/loading/ok (reference)',
    '',
    '| place | main 1280 | fix 1280 |',
    '|-------|-----------|----------|',
  );
  for (const r of rows) {
    const m = r.main1280;
    const f = r.fix1280;
    lines.push(
      `| ${r.place} | ${m.broken}/${m.loading}/${m.ok}/${m.total} | ${f.broken}/${f.loading}/${f.ok}/${f.total} |`,
    );
  }
  lines.push('', '### Screenshots (full load)', '');
  lines.push(
    'Naming: `pr511-<place>-<main|fix>-<390|1280>-loaded.png` (bangkok, rio-de-janeiro, gyeongbokgung, yanggu).',
    '',
  );
  if (extras?.screenshots?.length) {
    for (const s of extras.screenshots) lines.push(`- ${s}`);
  }
  lines.push('', '---', '', '## Non-blocking', '', extras?.nonBlocking || '(see below)');
  return lines.join('\n');
}

async function cairoVisitStoryCheck() {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const countStories = async (base, label) => {
    const page = await context.newPage();
    await openFromSearch(page, base, '카이로', '카이로');
    await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
    const n = await page.locator('[data-visit-story-kind]').count();
    await page.close();
    return { label, n };
  };
  const prod = await countStories(PROD, 'prod');
  const fix = await countStories(LOCAL, 'local-fix');
  await browser.close();
  return { prod, fix };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(STORE, { recursive: true });

  const rows = [];
  for (const place of PLACES) {
    console.log(`Measuring ${place.slug}...`);
    const mainByVp = await measurePlace(PROD, 'main', place, true);
    const fixByVp = await measurePlace(LOCAL, 'fix', place, true);
    rows.push({
      place: place.slug,
      main390: mainByVp['390'],
      fix390: fixByVp['390'],
      main1280: mainByVp['1280'],
      fix1280: fixByVp['1280'],
    });
    console.log(
      `${place.slug} 390: main ${fmtCounts(mainByVp['390'])} | fix ${fmtCounts(fixByVp['390'])}`,
    );
  }

  const { prod: cairoProd, fix: cairoFix } = await cairoVisitStoryCheck();

  const regression = rows.some((r) => r.fix390.broken > r.main390.broken);

  const nonBlocking = [
    '### Yanggu stock ordering / beach mismatch',
    '',
    '**Observation:** PROD often shows mountain/village KTO or curated imagery; fix builds may show beach/high-rise stock at the top.',
    '',
    '**PR diff analysis (`usePlaceGallery.js` vs `main`):** Domestic stock **merge order is unchanged**. Changes are limited to `shouldUseTourApiGalleryForPlace` gating (replacing hangul-name overseas leak fix), `filterGalleryForTourApiPolicy` for overseas `place_stats`, and renaming `isDomesticKorea` → `allowTourApiGallery` in existing branches. No reorder of Unsplash before/after TourAPI for domestic hubs.',
    '',
    '**Likely cause:** Unsplash/Pexels query variance per session (`resolveGalleryStockQuery` / random API page results) and/or different `place_stats` short-circuit vs live refetch timing — not a deliberate ordering change in this PR. **No code change in this PR per reviewer.**',
    '',
    '### Bangkok — Russian onion-dome church (stock mismatch)',
    '',
    '**GitHub issue draft (do not fix in #511):**',
    '',
    '**Title:** Bangkok place gallery: Unsplash/Pexels returns non-Bangkok stock (Russian church onion domes)',
    '',
    '**Repro:**',
    '1. Open https://www.gateo.kr/ (or Preview), search 방콕 → 방콕 place page.',
    '2. Scroll gallery; note stock photo with Russian Orthodox-style onion domes.',
    '3. Repeat on fresh session — may appear intermittently depending on stock API results.',
    '',
    '**Root cause:** Generic stock query for Bangkok (`resolveGalleryStockQuery` / Latin name) returns globally tagged “travel” or “temple” hits without geo negative filters; no Thailand/Bangkok constraint on Unsplash/Pexels ranking.',
    '',
    '**Suggested fix:** Tighten `resolveGalleryStockQuery` or gallery fetch for `bangkok` with `Thailand`, `Southeast Asia`, negative keywords (`Russia`, `Moscow`, `onion dome`, `Orthodox`), and/or prefer curated hero + map bbox metadata when available.',
    '',
    '### Yanggu — beach/city stock (issue draft)',
    '',
    '**Title:** Yanggu hub gallery: stock API matches foreign “Yanggu”/generic city/beach instead of 강원 양구군',
    '',
    '**Repro:** Search 양구 → 양구 hub; top tiles may show beach or high-rise city (no sea in Yanggu-gun).',
    '',
    '**Root cause:** Latin/romanized `Yanggu` on Unsplash collides with unrelated places; curated TourAPI path can be skipped when `place_stats` is stock-heavy and session cache serves stale stock order. PR #511 did **not** change domestic merge ordering.',
    '',
    '**Suggested fix:** Force curated hub query (`photoKeyword` / valley name in Korean), block latin-only `Yanggu` without `Gangwon`, extend `GALLERY_UNSPLASH_EXTRA_QUERIES.yanggu`, or pin KTO-first for `tourMapping.curated` hubs.',
    '',
    '### Cairo visit stories (#513)',
    '',
    `PROD visit story nodes (\`[data-visit-story-kind]\`): **${cairoProd.n}**. Local fix build: **${cairoFix.n}**.`,
    '',
    cairoProd.n === cairoFix.n
      ? 'Counts match on this run — #513 `place_reviews` data present on branch (merged main).'
      : 'Counts differ — likely env (Supabase URL/keys), timing, or moderation filter; branch includes merge from main with #513. Re-check Supabase anon and live row count for cairo slug.',
    '',
    regression
      ? '## Regression flag\n\nFix has **more** broken images than main at 390 for at least one place — investigate before merge.'
      : '## Regression flag\n\nFix broken count ≤ main for all five places at 390.',
  ].join('\n');

  const md = buildMd(rows, { nonBlocking, screenshots: [] });
  const fullMd = md;
  await writeFile(join(OUT, 'broken-image-count.md'), fullMd, 'utf8');
  await writeFile(join(STORE, 'broken-image-count.md'), fullMd, 'utf8');

  console.log('\n' + fullMd);
  if (regression) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
