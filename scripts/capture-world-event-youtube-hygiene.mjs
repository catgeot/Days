/**
 * World Events YouTube title hygiene — prod vs local captures.
 * Usage:
 *   npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort
 *   node scripts/capture-world-event-youtube-hygiene.mjs
 *
 * Env:
 *   CAPTURE_PROD_BASE — default https://www.gateo.kr
 *   CAPTURE_LOCAL_BASE — default https://127.0.0.1:4173
 *   CAPTURE_OUT_DIR — default /opt/cursor/artifacts/yt-hardcode-removal
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/yt-hardcode-removal';
const prodBase = (process.env.CAPTURE_PROD_BASE || 'https://www.gateo.kr').replace(/\/$/, '');
const localBase = (process.env.CAPTURE_LOCAL_BASE || 'https://127.0.0.1:4173').replace(/\/$/, '');

mkdirSync(outDir, { recursive: true });

const EVENTS = [
  { slug: 'bali', id: 'bali-galungan-season-2026', hubTitle: /갈룽안/ },
  { slug: 'munich', id: 'munich-oktoberfest-2026', hubTitle: /옥토버페스트/ },
  { slug: 'edinburgh', id: 'edinburgh-fringe-2026', hubTitle: /에든버러 프린지/ },
];

const report = {
  uiPath:
    'Home (/) → link 「세계의 행사」(/world-events) → event hub card → event detail → scroll to 「관련 영상」',
  prodBase,
  localBase,
  captures: [],
  brokenImages: {},
};

async function brokenMainImageCount(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll('main img')];
    return imgs.filter((img) => img.complete && img.naturalWidth === 0).length;
  });
}

async function viewportShot(page, filePath, width) {
  const height = width >= 1280 ? 900 : 844;
  if (width === 390) {
    await page.setViewportSize({ width: 390, height: 844 });
  } else {
    await page.setViewportSize({ width: 1280, height });
  }
  await page.evaluate(() => document.fonts?.ready);
  await page.screenshot({
    path: filePath,
    clip: { x: 0, y: 0, width, height: width === 390 ? 844 : height },
  });
  report.captures.push(filePath);
  console.log(`OK ${filePath}`);
}

async function openEventFromHome(page, baseUrl, hubTitle) {
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const expandQuickLinks = page.getByRole('button', {
    name: /바로가기 메뉴 펼치기|Expand quick links/i,
  });
  try {
    if (await expandQuickLinks.isVisible({ timeout: 3000 })) {
      await expandQuickLinks.click();
    }
  } catch {
    /* desktop layout may show links expanded */
  }
  const worldEventsEntry = page.locator('a[href="/world-events"], a[href="/world-events/"]').first();
  try {
    await worldEventsEntry.waitFor({ state: 'visible', timeout: 45_000 });
    await worldEventsEntry.click();
  } catch {
    await page.goto(`${baseUrl}/world-events`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForURL(/\/world-events/, { timeout: 60_000 });
  await page.getByRole('link', { name: hubTitle }).first().click();
  await page.waitForURL(/\/world-events\//, { timeout: 60_000 });
  const section = page.getByRole('heading', { name: /관련 영상|Related videos/i });
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
}

async function runSuite(browserKind, width, label) {
  const browser =
    browserKind === 'webkit'
      ? await webkit.launch({ headless: true })
      : await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: width === 390 ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  await context.addInitScript(() => {
    window.localStorage.setItem('gateo.locale', 'ko');
  });
  const page = await context.newPage();

  for (const event of EVENTS) {
    for (const [phase, base] of [
      ['prod', prodBase],
      ['local', localBase],
    ]) {
      await openEventFromHome(page, base, event.hubTitle);
      const broken = await brokenMainImageCount(page);
      const key = `${label}-${width}-${phase}-${event.slug}`;
      report.brokenImages[key] = broken;
      const name = `${phase}-${event.slug}-${label}-${width}.png`;
      await viewportShot(page, join(outDir, name), width);
    }

    await openEventFromHome(page, localBase, event.hubTitle);
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (
        /fetch-place-videos|place_videos|supabase\.co.*functions/i.test(url)
      ) {
        return route.abort('failed');
      }
      return route.continue();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const section = page.getByRole('heading', { name: /관련 영상/i });
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const blockedBroken = await brokenMainImageCount(page);
    const blockedKey = `${label}-${width}-local-blocked-${event.slug}`;
    report.brokenImages[blockedKey] = blockedBroken;
    const blockedName = `local-blocked-network-${event.slug}-${label}-${width}.png`;
    await viewportShot(page, join(outDir, blockedName), width);
    await page.unroute('**/*');
  }

  await browser.close();
}

await runSuite('webkit', 390, 'webkit');
await runSuite('chromium', 1280, 'chromium');

writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
writeFileSync(
  join(outDir, 'README.md'),
  `# World Events YouTube title hygiene captures

UI path: ${report.uiPath}

## Broken images (main, \`complete && naturalWidth===0\`)

\`\`\`json
${JSON.stringify(report.brokenImages, null, 2)}
\`\`\`

Prod base: ${prodBase}
Local base: ${localBase}
`,
);
console.log('Wrote', join(outDir, 'report.json'));
