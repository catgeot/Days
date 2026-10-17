import { mkdir } from 'node:fs/promises';
import { devices } from '@playwright/test';
import { test, expect } from './fixtures.js';

const OUT = '/opt/cursor/artifacts/pr1';
const VIEWPORT = { width: 390, height: 844 };

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

async function shot(page, name) {
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
}

async function openFestivalHubFromHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i })
    .click({ timeout: 180_000 });
  const festivalEntry = page.getByRole('link', {
    name: /한국의 축제로 이동|Go to Korea festivals/i,
  });
  await expect(festivalEntry).toBeVisible({ timeout: 60_000 });
  await festivalEntry.click();
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function openFestivalById(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog;
}

async function nearbySightNames(dialog) {
  const near = dialog.locator('[data-festival-section="nearAttractions"]');
  await expect(near).toBeVisible({ timeout: 120_000 });
  await expect(dialog.getByText(/주변 볼거리 불러오는 중|Loading nearby/i)).toHaveCount(0, {
    timeout: 120_000,
  });
  return near.locator('button').evaluateAll((nodes) =>
    nodes
      .map((node) => {
        const title = node.querySelector('[class*="font-bold"]');
        return (title?.textContent || node.textContent || '').trim().split('\n')[0];
      })
      .filter(Boolean),
  );
}

test.describe('PR1 festival detail — WebKit 390 screenshots', () => {
  test.use({
    ...devices['iPhone 13'],
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test('home → 축제 hub → regional festivals + 명승 인근 축제', async ({ page }) => {
    await openFestivalHubFromHome(page);
    await shot(page, '01-festival-hub');

    const gangneung = await openFestivalById(page, '2930716');
    await expect(gangneung.getByRole('heading', { name: /강릉|국수/i }).first()).toBeVisible({
      timeout: 60_000,
    });
    const gangNames = await nearbySightNames(gangneung);
    const noise = ['기린사우나', '대한노인회', '복지관', '생활문화센터'];
    for (const bad of noise) {
      expect(gangNames.some((n) => n.includes(bad)), `nearby should drop ${bad}`).toBe(false);
    }
    await shot(page, '02-gangneung-nearby');
    await gangneung.locator('[data-festival-section="nearAttractions"]').screenshot({
      path: `${OUT}/02b-gangneung-nearby-section.png`,
    });
    await shot(page, '03-gangneung-close-button');

    await openFestivalById(page, '2989642');
    await shot(page, '04-region-b-festival');

    await openFestivalById(page, '2867579');
    await shot(page, '05-far-dates-festival');

    await page.goto('/korea/theme/scenic?hub=hongcheon', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /한국의 명승|Korea scenic/i }),
    ).toBeVisible({ timeout: 90_000 });
    const scenicCard = page.getByRole('button').filter({ hasText: /가리산|홍천/i }).first();
    await expect(scenicCard).toBeVisible({ timeout: 90_000 });
    await scenicCard.click();
    const scenicDialog = page.getByRole('dialog');
    await expect(scenicDialog).toBeVisible({ timeout: 60_000 });
    await scenicDialog.getByRole('heading', { name: /인근 축제/i }).scrollIntoViewIfNeeded();
    await expect(scenicDialog.getByText(/인근 축제 불러오는 중/i)).toHaveCount(0, {
      timeout: 120_000,
    });
    await shot(page, '06-scenic-near-festivals');
  });
});
