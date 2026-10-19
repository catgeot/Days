/**
 * WebKit evidence for festival tab rename (읽을거리 → 영상).
 *   BASE=https://www.gateo.kr VARIANT=before node scripts/capture-festival-tab-videos-rename.mjs
 */
import { webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = (process.env.BASE || 'https://www.gateo.kr').replace(/\/$/, '');
const VARIANT = process.env.VARIANT || 'after';
const OUT = '/opt/cursor/artifacts/tab-videos-rename';

const FESTIVALS = [
  {
    key: 'yanggu-punchbowl',
    regionChip: /강원|Gangwon/i,
    search: null,
    directId: '1122739',
  },
  {
    key: 'hampyeong',
    regionChip: /전라남도|전남|South Jeolla/i,
    search: /함평|Hampyeong/i,
    directId: '638576',
  },
  {
    key: 'gangneung',
    regionChip: /강원|Gangwon/i,
    search: /강릉|Gangneung/i,
    directId: '2930716',
  },
  {
    key: 'zero-video-probe',
    regionChip: /서울|Seoul/i,
    search: null,
    directId: null,
  },
];

const WIDTHS = [390, 1280];

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

async function shot(page, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(500);
  const path = join(OUT, VARIANT, `${name}-${width}.png`);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width, height },
  });
  console.log('saved', path);
}

async function festivalDialog(page) {
  const dialog = page.locator('[role="dialog"]').filter({
    has: page.locator('#korea-festival-sheet-title'),
  });
  await dialog.waitFor({ state: 'visible', timeout: 90_000 });
  return dialog;
}

async function openFestivalViaHub(page, fest) {
  const hubPath = '/festival';
  await page.goto(`${BASE}${hubPath}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await dismissLocHint(page);

  const onKorea =
    /\/korea/.test(page.url()) ||
    (await page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }).count()) > 0;
  if (!onKorea) {
    await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await dismissLocHint(page);
  }

  if (fest.regionChip) {
    const chip = page.getByRole('button', { name: fest.regionChip }).first();
    if (await chip.isVisible().catch(() => false)) {
      await chip.click({ timeout: 15_000 });
      await page.waitForTimeout(600);
    }
  }

  if (fest.search) {
    const card = page
      .getByRole('main')
      .getByRole('button')
      .filter({ hasText: fest.search })
      .first();
    if (await card.isVisible().catch(() => false)) {
      await card.click({ timeout: 30_000 });
      return festivalDialog(page);
    }
  }

  if (fest.directId) {
    await page.goto(`${BASE}/korea/?festival=${fest.directId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
  }

  return festivalDialog(page);
}

async function captureTabBar(page, dialog, festKey, tabPattern) {
  const tab = dialog.getByRole('tab', { name: tabPattern });
  const tablist = dialog.locator('[role="tablist"]');
  await dialog.evaluate((el) => {
    const list = el.querySelector('[role="tablist"]');
    if (list) list.scrollIntoView({ block: 'center' });
    const scroller = el.querySelector('[data-festival-sheet-content]');
    if (scroller) scroller.scrollTop = Math.min(320, scroller.scrollHeight);
  });
  await tablist.waitFor({ state: 'visible', timeout: 60_000 });

  const hasTab = await tab.first().isVisible().catch(() => false);
  for (const w of WIDTHS) {
    await shot(page, `${festKey}-tabbar`, w);
    if (hasTab) {
      await tab.first().click({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(1200);
      await shot(page, `${festKey}-videos-pane`, w);
    }
  }
  return hasTab;
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

  const tabBefore = /읽을거리/;
  const tabAfter = /^(영상|Videos)$/;

  for (const fest of FESTIVALS) {
    if (fest.key === 'zero-video-probe' && VARIANT === 'before') continue;
    try {
      const dialog = await openFestivalViaHub(page, fest);
      const pattern = VARIANT === 'before' ? tabBefore : tabAfter;
      const hasTab = await captureTabBar(page, dialog, fest.key, pattern);
      notes.push(`${fest.key}: tab visible=${hasTab} url=${page.url()}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    } catch (err) {
      notes.push(`${fest.key}: ERROR ${err.message}`);
      console.error(fest.key, err);
    }
  }

  await writeFile(
    join(OUT, `capture-${VARIANT}.log`),
    `${notes.join('\n')}\nbase=${BASE}\n`,
    'utf8',
  );
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
