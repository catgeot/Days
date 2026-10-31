import { test, expect } from '@playwright/test';
import { installFestivalNearbyCardsFixtures } from './festival-nearby-cards-fixture.js';

const SCREENSHOT_DIR = '/opt/cursor/artifacts/screenshots/nearby-card-alt-overlap';
const FESTIVAL_ID = '825295';

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

async function blockVisitKoreaImages(page) {
  await page.route('**/*tong.visitkorea.or.kr/**', (route) => route.abort());
  await page.route('**/*cdn.visitkorea.or.kr/**', (route) => route.abort());
}

async function openFestival(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog;
}

async function waitNearbyPhotoCards(section) {
  await expect(section).toBeVisible({ timeout: 120_000 });
  await expect(section.locator('[data-nearby-photo-card]').first()).toBeVisible({
    timeout: 120_000,
  });
  await expect
    .poll(
      async () => {
        const cards = section.locator('[data-nearby-photo-card]');
        const n = await cards.count();
        if (!n) return 0;
        let settled = 0;
        for (let i = 0; i < n; i++) {
          const card = cards.nth(i);
          const compact = await card.locator('[data-nearby-compact-card]').count();
          const fallback = await card.locator('[data-nearby-photo-fallback]').count();
          const loaded = await card.locator('[data-festival-photo-loaded="true"]').count();
          if (compact || fallback || loaded) settled += 1;
        }
        return settled;
      },
      { timeout: 120_000 },
    )
    .toBeGreaterThan(0);
}

async function assertNoVisibleAltOverlap(page, section) {
  const report = await page.evaluate(() => {
    const cards = [
      ...document.querySelectorAll('[data-festival-section="nearAttractions"] [data-nearby-photo-card]'),
    ];
    const issues = [];
    for (const card of cards) {
      const label = card.querySelector('span.pointer-events-none.absolute.bottom-2');
      const labelText = label?.textContent?.trim() || '';
      const imgs = [...card.querySelectorAll('img[data-festival-photo]')];
      for (const img of imgs) {
        const style = getComputedStyle(img);
        const displayed =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          img.getBoundingClientRect().width > 0;
        const alt = (img.alt || '').trim();
        if (!alt) continue;
        const transparent =
          style.color === 'rgba(0, 0, 0, 0)' ||
          style.webkitTextFillColor === 'rgba(0, 0, 0, 0)' ||
          /\btext-transparent\b/.test(img.className);
        if (displayed && img.naturalWidth === 0 && !transparent) {
          issues.push({ alt, labelText, reason: 'alt-visible-on-broken-img' });
        }
        if (displayed && img.naturalWidth === 0 && transparent && labelText && alt === labelText) {
          const imgBox = img.getBoundingClientRect();
          const labelBox = label?.getBoundingClientRect();
          if (labelBox && imgBox.bottom > labelBox.top + 4) {
            issues.push({ alt, labelText, reason: 'alt-box-overlaps-label' });
          }
        }
      }
    }
    return { issueCount: issues.length, issues: issues.slice(0, 12) };
  });
  expect(report.issueCount, JSON.stringify(report, null, 2)).toBe(0);
}

test.beforeEach(async ({ page }) => {
  await installFestivalNearbyCardsFixtures(page);
  await blockVisitKoreaImages(page);
});

test.describe('Festival nearby photo cards — blocked images, no alt overlap @ciNearbyCards', () => {
  test('390 — neutral fallback, alt not visible over title chip', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await dismissLocHint(page);
    const dialog = await openFestival(page, FESTIVAL_ID);
    const section = dialog.locator('[data-festival-section="nearAttractions"]');
    await waitNearbyPhotoCards(section);
    await assertNoVisibleAltOverlap(page, section);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/825295-nearAttractions-blocked-390.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('1280 — neutral fallback, alt not visible over title chip', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1280, height: 844 });
    await dismissLocHint(page);
    const dialog = await openFestival(page, FESTIVAL_ID);
    const section = dialog.locator('[data-festival-section="nearAttractions"]');
    await waitNearbyPhotoCards(section);
    await assertNoVisibleAltOverlap(page, section);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/825295-nearAttractions-blocked-1280.png`,
      clip: { x: 0, y: 0, width: 1280, height: 844 },
    });
  });
});
