#!/usr/bin/env node
/**
 * Review card expand/collapse QA — WebKit @390 and Chromium @1280.
 *   npm run build && npm run preview &
 *   SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/capture-place-review-expand-evidence.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = process.env.PLACE_REVIEW_EXPAND_OUT || '/opt/cursor/artifacts/place-review-expand';
const PHASE = process.env.PLACE_REVIEW_EXPAND_PHASE || 'after';

const PLACES = ['cairo', 'paris'];

async function openReviews(page, slug) {
  await page.goto(`${baseURL}place/${slug}/reviews?lang=ko`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  const card = page.locator('[data-review-id]').first();
  await card.waitFor({ state: 'visible', timeout: 120_000 });
  const toggle = page.getByRole('button', { name: /^(더보기|접기)$/ }).first();
  await toggle.waitFor({ state: 'visible', timeout: 60_000 });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  return { card, toggle };
}

async function clipShot(page, fileName) {
  const { width = 390, height = 844 } = page.viewportSize() || {};
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width, height },
  });
}

async function capturePlace(browserType, engineName, vp, slug) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const { card, toggle } = await openReviews(page, slug);

  const collapsed = `${slug}-${PHASE}-${engineName}-collapsed-${vp.tag}.png`;
  await clipShot(page, collapsed);

  const expanded = `${slug}-${PHASE}-${engineName}-expanded-${vp.tag}.png`;
  await toggle.click();
  await page.waitForTimeout(300);
  await card.scrollIntoViewIfNeeded();
  await clipShot(page, expanded);

  await browser.close();
  return [collapsed, expanded];
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const viewports = [
    { width: 390, height: 844, tag: '390', browsers: [{ type: webkit, name: 'webkit' }] },
    {
      width: 1280,
      height: 800,
      tag: '1280',
      browsers: [{ type: chromium, name: 'chromium' }],
    },
  ];
  const files = [];
  for (const vp of viewports) {
    for (const { type, name } of vp.browsers) {
      for (const slug of PLACES) {
        try {
          const captured = await capturePlace(type, name, vp, slug);
          files.push(...captured);
          console.log(`OK ${slug} ${name} ${vp.tag}`);
        } catch (err) {
          console.error(`FAIL ${slug} ${name} ${vp.tag}:`, err.message);
        }
      }
    }
  }
  console.log(`Wrote ${files.length} files to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
