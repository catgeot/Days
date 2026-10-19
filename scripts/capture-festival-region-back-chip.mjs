/**
 * WebKit — festival hub parent-region back control evidence.
 *   VARIANT=before BASE=https://www.gateo.kr node scripts/capture-festival-region-back-chip.mjs
 */
import { webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = (process.env.BASE || 'https://www.gateo.kr').replace(/\/$/, '');
const VARIANT = process.env.VARIANT || 'after';
const OUT = '/opt/cursor/artifacts/region-back-chip';
const WIDTHS = [390, 1280];

const DRILLS = [
  { key: 'gangwon-yanggu', province: /^강원/, city: '양구군' },
  { key: 'jeonnam-yeosu', province: /^전남/, city: '여수시' },
  { key: 'gyeongnam-changwon', province: /^경남/, city: '창원시' },
  { key: 'jeju-jeju', province: /^제주/, city: '제주시' },
];

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function closeFestivalSheet(page) {
  if (/festival=/.test(page.url())) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
  const dialog = page.locator('[role="dialog"]').filter({
    has: page.locator('#korea-festival-sheet-title'),
  });
  if (await dialog.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
}

async function openFestivalHub(page) {
  await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await dismissLocHint(page);
  await closeFestivalSheet(page);
  await page.getByRole('button', { name: /지역|Region/i }).first().click({ timeout: 30_000 });
  await page.waitForTimeout(500);
}

async function drill(page, { province, city }) {
  const detailRow = page.locator('[aria-label="세부 칩"], [aria-label="Detail chips"]');
  await detailRow.getByRole('button', { name: province }).first().click({ timeout: 30_000 });
  await page.waitForTimeout(800);
  const subRow = page.locator('[aria-label="지역 구분 칩"], [aria-label="Region chips"]');
  const cityName = typeof city === 'string' ? new RegExp(`^${city}`) : city;
  const cityBtn = subRow.getByRole('button', { name: cityName }).first();
  await cityBtn.scrollIntoViewIfNeeded({ timeout: 30_000 });
  await cityBtn.click({ timeout: 30_000 });
  await page.waitForTimeout(900);
}

async function shot(page, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(450);
  const path = join(OUT, VARIANT, `${name}-${width}.png`);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  console.log('saved', path);
}

async function captureRow(page, key) {
  const row = page.locator('[aria-label="지역 구분 칩"], [aria-label="Region chips"]').first();
  await row.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  for (const w of WIDTHS) {
    await shot(page, `${key}-chip-row`, w);
  }
}

async function main() {
  await mkdir(join(OUT, VARIANT), { recursive: true });
  const browser = await webkit.launch();
  const context = await browser.newContext({
    locale: 'ko-KR',
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const notes = [];

  for (const scenario of DRILLS) {
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await openFestivalHub(page);
      await drill(page, scenario);
      await captureRow(page, scenario.key);
      const back =
        VARIANT === 'before'
          ? page.getByRole('button', { name: /전체로|강원도$|전라남도$|경상남도$|충청북도$/ }).first()
          : page.getByRole('button', { name: /전체로 돌아가기/ }).first();
      notes.push(`${scenario.key}: backVisible=${await back.isVisible().catch(() => false)}`);
      await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded' });
    } catch (err) {
      notes.push(`${scenario.key}: ERROR ${err.message}`);
      console.error(scenario.key, err);
    }
  }

  await writeFile(join(OUT, `capture-${VARIANT}.log`), `${notes.join('\n')}\nbase=${BASE}\n`, 'utf8');
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
