/**
 * 명승 상세 주변 섹션 제목 — QA 스크린샷 (390·1280).
 *
 *   node scripts/capture-scenic-nearby-headings-qa.mjs --base https://www.gateo.kr --label before
 *   node scripts/capture-scenic-nearby-headings-qa.mjs --base http://127.0.0.1:4173 --label after
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = '/opt/cursor/artifacts';

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const labelIdx = args.indexOf('--label');
const baseUrl = (baseIdx >= 0 ? args[baseIdx + 1] : 'https://127.0.0.1:4173').replace(
  /\/$/,
  '',
);
const label = labelIdx >= 0 ? args[labelIdx + 1] : 'after';

const cases = [
  {
    id: 'baengaksan-jongno',
    path: '/korea/theme/scenic?hub=jongno&spot=cha-1351100670000',
    scrollTo: /주변 (레포츠|문화)|Nearby (leisure|culture)/,
  },
  {
    id: 'gyeongbokgung',
    path: '/korea/theme/scenic?spot=gyeongbokgung',
    scrollTo: /주변 (맛집|레포츠)|Nearby (dining|leisure)/,
  },
];

async function openAndScroll(page, scrollTo) {
  const heading = page.getByText(scrollTo).first();
  await heading.waitFor({ state: 'visible', timeout: 120_000 });
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const section = page.locator('[data-scenic-nearby-section-heading]').first();
  if ((await section.count()) > 0) {
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
}

async function captureViewport(page, width, height, filePath) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: filePath,
    clip: { x: 0, y: 0, width, height: Math.min(height, 1200) },
  });
}

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true });

for (const scenario of cases) {
  for (const [width, tag] of [
    [390, '390'],
    [1280, '1280'],
  ]) {
    const page = await context.newPage({
      viewport: { width, height: 844 },
      deviceScaleFactor: 1,
    });
    try {
      await page.goto(`${baseUrl}${scenario.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 120_000,
      });
      await page
        .getByRole('dialog')
        .or(page.locator('[data-theme-spot-detail-modal]'))
        .first()
        .waitFor({ state: 'visible', timeout: 90_000 })
        .catch(() => null);
      await openAndScroll(page, scenario.scrollTo);
      const file = join(
        outDir,
        `scenic-nearby-headings-${label}-${scenario.id}-${tag}.png`,
      );
      await captureViewport(page, width, width === 390 ? 844 : 900, file);
      console.log('saved', file);
    } finally {
      await page.close();
    }
  }
}

await context.close();
await browser.close();
console.log(`done — ${label} @ ${baseUrl}`);
