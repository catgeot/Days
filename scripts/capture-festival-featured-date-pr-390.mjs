/**
 * WebKit 390×844 — PR #510 QA captures (local/preview, real TourAPI).
 * CAPTURE_BASE_URL — default http://127.0.0.1:5194 (VITE_GATEO_FESTIVAL_DATE_CHIP=1)
 * CAPTURE_OUT_DIR — default docs/qa/festival-featured-date-pr
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir =
  process.env.CAPTURE_OUT_DIR ||
  join(root, 'docs/qa/festival-featured-date-pr');
const onUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5194';
const KST_MON = new Date('2026-10-19T03:00:00.000Z');

mkdirSync(outDir, { recursive: true });

async function shoot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
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
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function pickSido(page, label) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const chip = page
    .locator('[aria-label="세부 칩"]')
    .getByRole('button', { name: new RegExp(`^${label}`) });
  await chip.waitFor({ timeout: 30_000 });
  await chip.click();
}

async function waitListImages(page, timeoutMs = 45_000) {
  await page
    .waitForFunction(() => {
      const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
      if (!imgs.length) return true;
      return imgs.every((img) => img.complete && img.naturalWidth > 0);
    }, null, { timeout: timeoutMs })
    .catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
}

async function waitPromoRegionLabels(page) {
  await page.locator('[data-social-promo-region]').first().waitFor({ timeout: 60_000 });
}

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
const notes = [`Capture base: ${onUrl}`, `Clock anchor: 2026-10-19 KST (Mon)`];

for (const region of [
  { slug: 'nationwide', pick: async () => {
    await page.getByRole('button', { name: /지역 대분류/ }).click();
    await page.locator('[aria-label="세부 칩"]').getByRole('button', { name: /^전국/ }).click();
  } },
  { slug: 'seoul', pick: () => pickSido(page, '서울') },
  { slug: 'gangwon', pick: () => pickSido(page, '강원') },
  { slug: 'gyeongnam', pick: () => pickSido(page, '경남') },
]) {
  await gotoKorea(page);
  await region.pick();
  await page
    .locator('[data-social-promo-festival-row], main [data-festival-id]')
    .first()
    .waitFor({ timeout: 120_000 });
  await waitPromoRegionLabels(page);
  await waitListImages(page);
  await shoot(page, `featured-${region.slug}-region-labels.png`);
}

await gotoKorea(page);
await page.clock.install({ time: KST_MON });
await page.reload();
await dismissLocHint(page);
await page.getByRole('button', { name: /시간 대분류/ }).click();
await page.locator('[data-period-id="date"]').click();
const sheet = page.locator('[data-festival-date-sheet]');
await sheet.waitFor();
await shoot(page, 'date-sheet-open-mon-2026-10-19.png');

await sheet.locator('[data-week-shortcut="0"]').click();
await expectRange(page, '10.19', '10.25');
await sheet.getByRole('button', { name: '이 기간 보기' }).click();
await sheet.waitFor({ state: 'hidden', timeout: 15_000 });
await waitListImages(page);
await shoot(page, 'list-after-ibenju-2026-10-19.png');
notes.push('이번주 applied: meta should show 10.19–10.25');

await page.locator('[data-period-id="date"]').click();
await sheet.waitFor();
await sheet.locator('[data-week-shortcut="1"]').click();
await expectRange(page, '10.26', '11.1');
await shoot(page, 'date-sheet-daeumju-2026-10-19.png');
await sheet.getByRole('button', { name: '이 기간 보기' }).click();
await sheet.waitFor({ state: 'hidden', timeout: 15_000 });
await waitListImages(page);
await shoot(page, 'list-after-daeumju-2026-10-19.png');
notes.push('다음주 applied: meta should show 10.26–11.1');

await gotoKorea(page);
await pickSido(page, '경남');
await waitPromoRegionLabels(page);
await waitListImages(page);
const masanInPromo = page.locator('[data-social-promo-card]').filter({ hasText: '마산가고파' });
await masanInPromo.waitFor({ timeout: 60_000 });
const masanInList = page.locator('main [data-festival-id]').filter({ hasText: '마산가고파국화축제' });
await page.evaluate(() => {
  const row = document.querySelector('[data-social-promo-festival-row]');
  row?.scrollIntoView({ block: 'start' });
});
await shoot(page, 'gyeongnam-promo-masan-in-strip.png');
const listCount = await masanInList.count();
notes.push(`경남: 마산가고파 in list below promo (expect 0): ${listCount}`);
await page.evaluate(() => {
  const cards = [...document.querySelectorAll('main [data-festival-id]')];
  const target = cards.find((el) => el.textContent?.includes('양산'));
  target?.scrollIntoView({ block: 'center' });
});
await waitListImages(page);
await shoot(page, 'gyeongnam-list-scrolled-dedupe.png');

for (const region of ['gangwon', 'gyeongnam']) {
  await gotoKorea(page);
  await pickSido(page, region === 'gangwon' ? '강원' : '경남');
  await waitListImages(page, 60_000);
  const gray = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
    const broken = imgs.filter((img) => !img.naturalWidth || !img.complete).length;
    const total = imgs.length;
    return { broken, total };
  });
  notes.push(`PR build ${region} list images: ${gray.total} total, ${gray.broken} not loaded`);
  await shoot(page, `thumbs-pr-${region}-after-load.png`);
}

const mainUrl = process.env.CAPTURE_MAIN_BASE_URL || 'https://www.gateo.kr';
for (const region of ['gangwon', 'gyeongnam']) {
  await page.goto(`${mainUrl}/korea/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 120_000 });
  await dismissLocHint(page);
  await pickSido(page, region === 'gangwon' ? '강원' : '경남');
  await waitListImages(page, 60_000);
  const gray = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('main [data-festival-id] img')];
    const broken = imgs.filter((img) => !img.naturalWidth || !img.complete).length;
    return { broken, total: imgs.length };
  });
  notes.push(`PROD main ${region} list images: ${gray.total} total, ${gray.broken} not loaded`);
  await shoot(page, `thumbs-main-${region}-after-load.png`);
}
notes.push('Gray placeholders: compare thumbs-pr-* vs thumbs-main-* (same broken count ⇒ pre-existing).');

writeFileSync(join(outDir, 'NOTES.md'), `# festival-featured-date-pr\n\n${notes.map((l) => `- ${l}`).join('\n')}\n`);

await context.close();
await browser.close();
console.log(`captures ok → ${outDir}`);

async function expectRange(page, startFrag, endFrag) {
  const range = page.locator('[data-festival-date-range]');
  const text = await range.innerText();
  if (!text.includes(startFrag) || !text.includes(endFrag)) {
    throw new Error(`range expected ${startFrag}–${endFrag}, got ${text}`);
  }
}
