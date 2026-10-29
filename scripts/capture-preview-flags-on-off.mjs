#!/usr/bin/env node
/**
 * OFF = https://www.gateo.kr · ON = PREVIEW_BASE_URL (preview branch deploy).
 * Artifacts: /opt/cursor/artifacts/<feature>-<off|on>-<390|1280>.png
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { webkit } from 'playwright';

const PROD = 'https://www.gateo.kr';
const PREVIEW = (process.env.PREVIEW_BASE_URL || '').replace(/\/$/, '');
const OUT = '/opt/cursor/artifacts';

const VIEWPORTS = [
  { tag: '390', width: 390, height: 844 },
  { tag: '1280', width: 1280, height: 800 },
];

const FEATURES = [
  {
    key: 'scenic',
    path: '/korea/theme/scenic?hub=gangneung&spot=gyeongpodae',
    async ready(page) {
      await page.locator('[data-scenic-spot-detail], [data-theme-scenic-modal]').first().waitFor({
        state: 'visible',
        timeout: 120_000,
      });
    },
  },
  {
    key: 'nearby',
    path: '/korea/?festival=825295',
    async ready(page) {
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ state: 'visible', timeout: 120_000 });
      const section = dialog.locator('[data-festival-section="nearAttractions"]');
      await section.scrollIntoViewIfNeeded().catch(() => {});
      await section.waitFor({ state: 'visible', timeout: 120_000 }).catch(() => {});
    },
  },
  {
    key: 'photo-credit',
    path: '/place/venice/gallery',
    async ready(page) {
      await page.locator('img[alt^="place-img-"]').first().waitFor({
        state: 'visible',
        timeout: 120_000,
      });
      const gallery = page.locator('[data-place-gallery-scroll]').first();
      if (await gallery.count()) {
        await gallery.evaluate((el) => {
          el.scrollTop = Math.min(el.scrollHeight, 900);
        });
      }
    },
  },
  {
    key: 'review-deeplink',
    path: '/place/cairo/reviews?review=1&lang=ko',
    async ready(page) {
      await page.getByRole('heading', { name: /카이로|Cairo/i }).first().waitFor({
        state: 'visible',
        timeout: 120_000,
      }).catch(() => {});
      await page.locator('[data-place-reviews-scroll], main').first().waitFor({
        state: 'visible',
        timeout: 120_000,
      });
    },
  },
  {
    key: 'freshness',
    path: '/place/paris?lang=ko',
    async ready(page) {
      await page.getByText('파리').first().waitFor({ state: 'visible', timeout: 120_000 });
      const facts = page.getByRole('button', { name: /현지 정보|Local info/i }).first();
      await facts.waitFor({ state: 'visible', timeout: 60_000 });
      await facts.click();
      const row = page.locator('[data-local-info-row]').first();
      await row.waitFor({ state: 'visible', timeout: 60_000 });
      await row.locator('button').first().click();
      await page.locator('[data-fact-freshness-tier]').first().waitFor({
        state: 'visible',
        timeout: 30_000,
      }).catch(() => {});
    },
  },
];

async function dismissHints(page) {
  const close = page.getByRole('button', { name: /^닫기$|^Close$/i }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2000 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function captureBase(base, mode, feature, vp) {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const url = `${base}${feature.path}`;
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const status = response?.status() ?? 0;
  await dismissHints(page);
  try {
    await feature.ready(page);
  } catch (e) {
    console.warn(`ready() warn ${feature.key} ${mode} ${vp.tag}:`, e.message);
  }
  const fileName = `${feature.key}-${mode}-${vp.tag}.png`;
  const path = join(OUT, fileName);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: vp.width, height: vp.height },
  });
  console.log(`OK ${fileName} status=${status} url=${url}`);
  await browser.close();
  return { fileName, status, url };
}

async function main() {
  if (!PREVIEW) {
    console.error('Set PREVIEW_BASE_URL to the Vercel preview origin (no trailing slash).');
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });
  const results = [];
  for (const feature of FEATURES) {
    for (const vp of VIEWPORTS) {
      results.push(await captureBase(PROD, 'off', feature, vp));
      results.push(await captureBase(PREVIEW, 'on', feature, vp));
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
