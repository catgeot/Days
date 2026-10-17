/**
 * WebKit 390 — flag-on default list is the 30-day window with a region-only heading.
 * Regions: 전국 · 서울 · 강릉 · 제주, plus one slow-image placeholder shot.
 * CAPTURE_BASE_URL — VITE_GATEO_FESTIVAL_DATE_CHIP=1 (default http://127.0.0.1:5194)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/qa/festival-hub-default-period');
const onUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5194';

mkdirSync(outDir, { recursive: true });

function pngWidth(path) {
  return readFileSync(path).readUInt32BE(16);
}

async function shoot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  if (pngWidth(path) !== 390) throw new Error(`${name} width mismatch`);
  console.log(`shot ${name}`);
}

async function dismissLocHint(page) {
  const close = page.getByRole('main').getByRole('button', { name: /^닫기$/ }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* */
  }
}

async function gotoKorea(page) {
  await page.goto(`${onUrl}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 90_000 });
  await dismissLocHint(page);
}

async function pickProvince(page, label) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const chip = page
    .locator('[aria-label="세부 칩"]')
    .getByRole('button', { name: new RegExp(`^${label}`) });
  await chip.waitFor({ timeout: 30_000 });
  await chip.click();
}

async function waitSettled(page) {
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
    if (!imgs.length) return true;
    return imgs.every((img) => img.complete && img.naturalWidth > 0);
  }, null, { timeout: 20_000 }).catch(async () => {
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
      return imgs.every((img) => img.complete);
    }, null, { timeout: 8_000 }).catch(() => {});
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForFunction(() => {
    const heading = document.querySelector('[data-festival-list-heading] h2');
    const meta = document.querySelector('[data-festival-list-meta]');
    if (!heading || !meta) return false;
    const hs = getComputedStyle(heading);
    const ms = getComputedStyle(meta);
    return hs.visibility !== 'hidden' && Number.parseFloat(hs.fontSize) > 0
      && ms.visibility !== 'hidden' && Number.parseFloat(ms.fontSize) > 0;
  });
}

async function assertHeading(page, expected) {
  const heading = page.locator('[data-festival-list-heading] h2');
  const text = (await heading.innerText()).replace(/\s+/g, ' ').trim();
  if (text !== expected) throw new Error(`heading ${JSON.stringify(text)} !== ${expected}`);
  if (text.includes('"') || text.includes('축제 리스트') || text.includes('이번 달')) {
    throw new Error(`heading still has a period phrase: ${text}`);
  }
  const lines = await heading.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getClientRects().length;
  });
  if (lines !== 1) throw new Error(`heading wraps (${lines}): ${text}`);
}

const regions = [
  { slug: 'nationwide', province: '', district: '', heading: '전국' },
  { slug: 'seoul', province: '서울', district: '', heading: '서울특별시' },
  { slug: 'gangneung', province: '강원', district: '강릉', heading: '강원도 강릉' },
  { slug: 'jeju', province: '제주', district: '', heading: '제주도' },
];

const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
const notes = [`Capture base: ${onUrl}`];

for (const region of regions) {
  await gotoKorea(page);
  if (region.province) await pickProvince(page, region.province);
  else {
    await page.getByRole('button', { name: /지역 대분류/ }).click();
    const nationwide = page
      .locator('[aria-label="세부 칩"]')
      .getByRole('button', { name: /^전국/ });
    await nationwide.waitFor({ timeout: 30_000 });
    await nationwide.click();
  }
  if (region.district) {
    const district = page
      .locator('[aria-label="지역 구분 칩"]')
      .getByRole('button', { name: new RegExp(region.district) });
    await district.first().waitFor({ timeout: 30_000 });
    await district.first().click();
  }
  await page
    .locator('main [data-festival-id], [data-festival-period-empty]')
    .first()
    .waitFor({ timeout: 90_000 });
  const window30 = page.locator('[data-period-id="window30"]');
  await page.getByRole('button', { name: /시간 대분류/ }).click();
  await window30.waitFor({ timeout: 20_000 });
  if ((await window30.getAttribute('aria-pressed')) !== 'false') {
    throw new Error(`${region.slug} window30 chip should stay unselected`);
  }
  const timeMajor = (await page.getByRole('button', { name: /시간 대분류/ }).innerText())
    .replace(/\s+/g, ' ')
    .trim();
  if (timeMajor !== '기간') {
    throw new Error(`${region.slug} time category should be 기간, got ${timeMajor}`);
  }
  await assertHeading(page, region.heading);
  await waitSettled(page);
  const meta = (await page.locator('[data-festival-list-meta]').innerText()).replace(/\s+/g, ' ').trim();
  if (!/~11\.\d+/.test(meta)) throw new Error(`${region.slug} meta missing ~date: ${meta}`);
  if (meta.startsWith(region.heading)) {
    throw new Error(`${region.slug} meta repeats heading: ${meta}`);
  }
  if (region.slug === 'nationwide') {
    const promo = await page.locator('[data-social-promo-festival-row]').count();
    if (!promo) throw new Error('recommended strip missing on default nationwide screen');
  }
  notes.push(`${region.slug}: ${region.heading} / ${meta}`);
  await shoot(page, `${region.slug}.png`);
}

await context.close();

const slowContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
});
const slow = await slowContext.newPage();
await slow.route('**/*', async (route) => {
  if (route.request().resourceType() === 'image') {
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
  await route.continue();
});
await gotoKorea(slow);
await slow.locator('[data-festival-photo-pending]').first().waitFor({ timeout: 30_000 });
await slow.locator('[data-festival-list-heading] h2').waitFor();
await shoot(slow, 'slow-image-placeholder.png');
const pending = await slow.locator('[data-festival-photo-pending]').count();
notes.push(`slow-image pending frames: ${pending}`);
if (!pending) throw new Error('slow-image shot has no shimmer placeholder');

writeFileSync(
  join(outDir, 'NOTES.md'),
  `# festival hub default period (WebKit 390)\n\n${notes.map((l) => `- ${l}`).join('\n')}\n`,
);
await slowContext.close();
await browser.close();
console.log('captures ok');
