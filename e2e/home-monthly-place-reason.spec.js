import { test, expect } from './fixtures.js';

const NOVEMBER_AT = '2026-11-25T03:00:00.000Z';

async function openMonthlyHome(page, path) {
  await page.clock.install({ time: new Date(NOVEMBER_AT) });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  const card = page.getByTestId('home-watch-card');
  await expect(card).toBeVisible({ timeout: 60_000 });
  await expect(card).toHaveAttribute('data-month-key', '2026-11', { timeout: 60_000 });
}

async function openPlaceFromMonthlyCard(page, slug) {
  const link = page
    .getByTestId('home-watch-card')
    .locator(`[data-slug="${slug}"] a[href*="/place/${slug}"]`);
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/place/${slug}\\?monthly=2026-11`), { timeout: 60_000 });
}

test.describe('monthly card place reason', () => {
  test('WebKit 390 shows the month reason above the intro', async ({ page }) => {
    await openMonthlyHome(page, '/?home_monthly_switch=1');
    await openPlaceFromMonthlyCard(page, 'phu-quoc');

    const card = page.locator('[data-place-gallery-mobile-overview]:visible');
    const reason = card.getByTestId('place-monthly-reason');
    await expect(reason).toBeVisible({ timeout: 60_000 });
    await expect(reason).toHaveAttribute('data-month-key', '2026-11');
    await expect(reason.getByTestId('place-monthly-reason-title')).toHaveText('11월 건기 시작');
    await expect(reason.getByTestId('place-monthly-reason-best')).toContainText('건기');
    await expect(reason.getByTestId('place-monthly-reason-source').first()).toHaveAttribute(
      'href',
      /vietnam\.travel/,
    );
    await expect(reason).toContainText('출처');

    const intro = card.getByText('몰디브');
    await expect(intro).toBeVisible({ timeout: 60_000 });
    const introFollowsReason = await card.evaluate((root) => {
      const box = root.querySelector('[data-testid="place-monthly-reason"]');
      const lead = [...root.querySelectorAll('p')].find((node) => (node.textContent || '').includes('몰디브'));
      if (!box || !lead) return false;
      return Boolean(box.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(introFollowsReason).toBe(true);
  });

  test('English monthly card shows the English reason', async ({ page }) => {
    await openMonthlyHome(page, '/?home_monthly_switch=1&lang=en');
    await openPlaceFromMonthlyCard(page, 'phu-quoc');

    const reason = page.locator('[data-testid="place-monthly-reason"]:visible');
    await expect(reason).toBeVisible({ timeout: 60_000 });
    await expect(reason.getByTestId('place-monthly-reason-title')).toHaveText('Dry season·Nov');
    await expect(reason.getByTestId('place-monthly-reason-best')).toContainText('dry season');
    await expect(reason.getByTestId('place-monthly-reason-source').first()).toHaveText('Vietnam Tourism');
    await expect(reason).toContainText('Why we picked it for November');
    await expect(reason).toContainText('Source');
  });

  test('a direct place visit does not show the monthly reason', async ({ page }) => {
    await page.clock.install({ time: new Date(NOVEMBER_AT) });
    await page.goto('/place/phu-quoc', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/place\/phu-quoc$/, { timeout: 60_000 });
    const card = page.locator('[data-place-gallery-mobile-overview]:visible');
    await expect(card.getByText('몰디브')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('place-monthly-reason')).toHaveCount(0);
  });
});
