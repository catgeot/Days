/**
 * One-off discovery: nearby cards with official home on prod preview.
 * node e2e/discover-external-return-prod.mjs
 */
import { webkit, expect } from '@playwright/test';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';
import { installReadOnlyGuard } from './readOnlyGuard.js';

const BASE = process.env.SMOKE_SITE_URL || 'http://127.0.0.1:4173';
const CANDIDATES = [
  { id: '1122739', query: '양구 시래기' },
  { id: '2930716', query: '강릉 국수' },
  { id: '637693', query: '마산 국화' },
  { id: '825295', query: '강릉 커피' },
  { id: '638576', query: '함평 나비' },
  { id: '1998564', query: '서울' },
];

async function waitForKoreaHome(page) {
  await page.goto(`${BASE}/korea/`, { waitUntil: 'networkidle', timeout: 180_000 });
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function openFestival(page, { query, id }) {
  await waitForKoreaHome(page);
  const searchToggle = page.getByRole('button', {
    name: /축제 검색|Search festivals/i,
  });
  await searchToggle.click();
  const mobileSearch = page.locator('#korea-festival-search');
  const pcSearch = page.locator('#korea-festival-search-pc');
  const searchInput = (await mobileSearch.isVisible().catch(() => false))
    ? mobileSearch
    : pcSearch;
  await expect(searchInput).toBeVisible({ timeout: 15_000 });
  await searchInput.fill(query);
  await searchInput.press('Enter');
  const card = page.locator(`[data-festival-id="${id}"]`).first();
  await card.waitFor({ state: 'visible', timeout: 120_000 });
  await card.click();
  await page.waitForURL(new RegExp(`festival=${id}`), { timeout: 60_000 });
}

const browser = await webkit.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' });
await installReadOnlyGuard(context);
const page = await context.newPage();

for (const c of CANDIDATES) {
  try {
    await openFestival(page, c);
    const dialog = page.locator('[role="dialog"][aria-labelledby="korea-festival-sheet-title"]');
    await dialog.getByText(/주변 볼거리 불러오는 중|Loading nearby/i).waitFor({ state: 'detached', timeout: 120_000 }).catch(() => {});
    await dialog.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(2000);
    const buttons = await dialog.locator('li button').allTextContents();
    console.log('\n===', c.id, 'nearby:', buttons.slice(0, 15).join(' | '));
    const cards = dialog.locator('li button');
    const n = await cards.count();
    for (let i = 0; i < Math.min(n, 8); i++) {
      await cards.nth(i).click();
      const modal = page.locator('[aria-labelledby="korea-theme-spot-modal-title"]');
      await modal.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => null);
      if (!(await modal.isVisible().catch(() => false))) continue;
      await modal.getByText(/상세.*불러오는 중|Loading details/i).waitFor({ state: 'detached', timeout: 90_000 }).catch(() => {});
      const href = await modal.locator('[data-theme-spot-official-home]').getAttribute('href').catch(() => null);
      const title = await modal.locator('#korea-theme-spot-modal-title').textContent();
      if (href) console.log('  *', title?.trim(), '→', href);
      await modal.locator('button[aria-label="닫기"]').first().click();
      await modal.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    }
  } catch (e) {
    console.log('FAIL', c.id, e.message?.slice(0, 120));
  }
}
await browser.close();
