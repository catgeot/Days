/**
 * PR #544 runtime evidence — run against local preview or prod.
 * SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/capture-place-reviews-qa-544.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';

const BASE = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/$/, '');
const OUT = process.env.QA544_OUT || '/opt/cursor/artifacts/place-reviews-qa-544';
const CITIES = ['jeju', 'gangneung', 'busan'];
const ignoreHttps = BASE.includes('127.0.0.1') || BASE.includes('localhost');

mkdirSync(OUT, { recursive: true });

async function countReviewCardMarkdown(page) {
  return page.locator('[data-review-id]').evaluateAll((cards) => {
    let stars = 0;
    let linkMd = 0;
    for (const card of cards) {
      const t = card.textContent || '';
      stars += (t.match(/\*\*/g) || []).length;
      linkMd += (t.match(/\]\(/g) || []).length;
    }
    return { cardCount: cards.length, stars, linkMd };
  });
}

async function countBrokenImages(page) {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    let broken = 0;
    const brokenSrc = [];
    for (const img of imgs) {
      if (img.complete && img.naturalWidth === 0 && img.src) {
        broken += 1;
        brokenSrc.push(img.src);
      }
    }
    return { broken, brokenSrc };
  });
}

async function waitForReviews(page) {
  await page.goto(`${BASE}/place/jeju/reviews?lang=en`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.waitForTimeout(12_000);
  const cards = await page.locator('[data-review-id]').count();
  return cards;
}

async function testSpaReviewsTab(browserName, browserType) {
  const browser = await browserType.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: ignoreHttps,
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/place/jeju?lang=en`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(6_000);

  const reviewsLink = page.locator('a[href="/place/jeju/reviews"]').first();
  await reviewsLink.waitFor({ state: 'visible', timeout: 30_000 });

  const beforeNav = await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.type || 'unknown');
  await reviewsLink.click({ timeout: 30_000 });
  await page.waitForTimeout(4_000);
  const urlAfter = page.url();
  const afterNav = await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.type || 'unknown');

  await page.goBack({ timeout: 30_000 });
  await page.waitForTimeout(2_000);
  const urlBack = page.url();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(OUT, `spa-tab-${browserName}-390.png`),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });

  await browser.close();
  return {
    beforeNav,
    afterNav,
    urlAfter,
    urlBack,
    reviewsInUrl: /\/reviews/.test(urlAfter),
    backLeftReviews: !/\/reviews/.test(urlBack),
    noFullReload: afterNav !== 'reload' || beforeNav === afterNav,
  };
}

async function testThumbFallback(browserName, browserType) {
  const browser = await browserType.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: ignoreHttps,
  });
  await context.route(/tong\.visitkorea\.or\.kr/i, (route) => route.abort());
  const page = await context.newPage();
  await waitForReviews(page);

  const tripStoryImgs = await page.locator('img').evaluateAll((nodes) =>
    nodes
      .filter((n) => /visitkorea/i.test(n.src))
      .map((n) => ({ src: n.src, w: n.naturalWidth })),
  );

  const broken = await countBrokenImages(page);
  const hasBookFallback = await page.locator('svg.lucide-book-open').count();

  await page.screenshot({
    path: join(OUT, `thumb-fallback-${browserName}-390.png`),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });

  await browser.close();
  return { tripStoryImgs, broken, hasBookFallback };
}

async function testCityMarkdown(browserName, browserType, slug) {
  const browser = await browserType.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: ignoreHttps,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/place/${slug}/reviews?lang=en`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.waitForTimeout(18_000);

  const counts = await countReviewCardMarkdown(page);
  await page.screenshot({
    path: join(OUT, `${slug}-reviews-${browserName}-390.png`),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });

  const editorial = page.locator('[data-review-id]').first();
  let expandOk = false;
  if (await editorial.count()) {
    const expandBtn = editorial.getByRole('button', { name: /more|더|expand|펼/i }).first();
    if (await expandBtn.count()) {
      await expandBtn.click();
      await page.waitForTimeout(500);
      const link = editorial.locator('a[href^="https://"]').first();
      expandOk = (await link.count()) > 0;
      await page.screenshot({
        path: join(OUT, `${slug}-editorial-expanded-${browserName}-390.png`),
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
    }
  }

  await browser.close();
  return { ...counts, expandOk };
}

const BROKEN_VISITKOREA_THUMB =
  'https://tong.visitkorea.or.kr/cms/resource/08/3585608_image2_1.jpg';

async function findVisitKoreaThumbSource() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto('https://www.gateo.kr/place/jeju/reviews?lang=en', {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.waitForTimeout(12_000);

  const meta = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[class*="w-56"] img, .group img'));
    const hits = [];
    for (const img of cards) {
      if (/visitkorea/i.test(img.src)) {
        hits.push({
          src: img.src,
          alt: img.alt,
          parentText: img.closest('.group')?.querySelector('h5')?.textContent?.trim() || '',
        });
      }
    }
    return hits;
  });

  await browser.close();
  return {
    note: 'Trip stories load from Supabase `reports` via useRelatedBlogs(location.name) — see relatedBlogsQuery.js',
    liveThumbs: meta,
  };
}

const report = {
  base: BASE,
  capturedAt: new Date().toISOString(),
  spaTab: {},
  thumbFallback: {},
  cityMarkdown: {},
  visitKoreaSource: await findVisitKoreaThumbSource(),
};

for (const [name, type] of [
  ['chromium', chromium],
  ['webkit', webkit],
]) {
  report.spaTab[name] = await testSpaReviewsTab(name, type);
  report.thumbFallback[name] = await testThumbFallback(name, type);
  report.cityMarkdown[name] = {};
  for (const slug of CITIES) {
    report.cityMarkdown[name][slug] = await testCityMarkdown(name, type, slug);
  }
}

const mdPath = join(OUT, 'report.md');
const lines = [
  `# PR #544 QA capture`,
  ``,
  `Base: ${BASE}`,
  ``,
  `## (a) SPA reviews tab (jeju)`,
  ...Object.entries(report.spaTab).map(
    ([b, r]) =>
      `- **${b}**: url has /reviews=${r.reviewsInUrl}, back ok=${r.backLeftReviews}, nav type after click=${r.afterNav}, urlAfter=${r.urlAfter}`,
  ),
  ``,
  `## (b) Thumbnail fallback (visitkorea blocked)`,
  ...Object.entries(report.thumbFallback).map(
    ([b, r]) => `- **${b}**: broken imgs=${r.broken.broken}, book icons=${r.hasBookFallback}`,
  ),
  ``,
  `## (c) Review card textContent markdown markers`,
];
for (const [b, cities] of Object.entries(report.cityMarkdown)) {
  for (const [slug, c] of Object.entries(cities)) {
    lines.push(`- **${b} / ${slug}**: cards=${c.cardCount}, \`**\`=${c.stars}, \`](\`=${c.linkMd}`);
  }
}
lines.push('', '## (d) Editorial expand + https link', '');
for (const [b, cities] of Object.entries(report.cityMarkdown)) {
  lines.push(`- **${b} / jeju**: expandOk=${cities.jeju?.expandOk}`);
}
lines.push('', '## VisitKorea thumb (data fix)', '', '```json');
lines.push(JSON.stringify(report.visitKoreaSource, null, 2));
lines.push('```');

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
writeFileSync(mdPath, lines.join('\n'));
console.log(`Wrote ${mdPath}`);
console.log(lines.join('\n'));
