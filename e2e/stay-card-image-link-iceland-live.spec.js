/**
 * 아이슬란드 숙소 — LIVE Edge(모의 아님) · 로컬 vite preview 전용.
 *
 *   npm run build
 *   DEV_SSL=0 npx vite preview --host 127.0.0.1 --port 5199
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5199 npx playwright test e2e/stay-card-image-link-iceland-live.spec.js
 *
 * PROD(www.gateo.kr) 아님 — Preview head 빌드만.
 */
import { test, expect } from '@playwright/test';

async function openIcelandStayListMobile(page) {
  await page.goto('/place/iceland?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '아이슬란드' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
  await expect(page.getByRole('button', { name: '숙소 찾기' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '숙소 찾기' }).first().click();
  await expect(page.getByRole('dialog', { name: '숙소 전체 목록' })).toBeVisible({
    timeout: 90_000,
  });
  const dialog = page.getByRole('dialog', { name: '숙소 전체 목록' });
  await expect(dialog.locator('a[data-partner-booking-handoff="cta"]').first()).toBeVisible({
    timeout: 120_000,
  });
  return dialog;
}

async function openIcelandStayListDesktop(page) {
  await page.goto('/place/iceland?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '아이슬란드' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
  await page.getByRole('button', { name: '숙소 찾기' }).first().click();
  await expect(page.getByRole('region', { name: '숙소 목록' })).toBeVisible({
    timeout: 90_000,
  });
  const region = page.getByRole('region', { name: '숙소 목록' });
  await expect(region.locator('a[data-partner-booking-handoff="cta"]').first()).toBeVisible({
    timeout: 120_000,
  });
  return region;
}

async function assertLiveStayCards(scope, logLines) {
  await expect(scope.locator('[data-stay-list-partner-notice]')).toHaveCount(1);
  await expect(scope.getByText('호텔 보고 예약 시작', { exact: true })).toHaveCount(0);

  const cardLinks = scope.locator('a[data-partner-booking-handoff="cta"]');
  const count = await cardLinks.count();
  expect(count).toBeGreaterThanOrEqual(2);
  logLines.push(`cardLinks=${count}`);

  const firstHref = await cardLinks.first().getAttribute('href');
  expect(firstHref).toMatch(/accommodation\.myrealtrip\.com\/union\/products\/\d+/);
  expect(firstHref).toMatch(/mylink_id=/);
  logLines.push(`firstHrefProduct=${firstHref?.match(/products\/(\d+)/)?.[1] ?? '?'}`);

  await expect(cardLinks.first()).toHaveAttribute('rel', /noopener/);
  await expect(cardLinks.first()).toHaveAttribute('rel', /sponsored/);

  const imgs = scope.locator('img[src*="cloudfront.net"]');
  await expect(imgs.first()).toBeVisible({ timeout: 30_000 });
  const imgMeta = await imgs.first().evaluate((img) => ({
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    complete: img.complete,
  }));
  expect(imgMeta.complete).toBe(true);
  expect(imgMeta.naturalWidth).toBeGreaterThan(0);
  expect(imgMeta.naturalHeight).toBeGreaterThan(0);
  logLines.push(`firstImageNatural=${imgMeta.naturalWidth}x${imgMeta.naturalHeight}`);

  const imageBox = await scope
    .locator('a[data-partner-booking-handoff="cta"]')
    .first()
    .locator('div.relative')
    .first()
    .boundingBox();
  if (imageBox) {
    logLines.push(`firstCardImageBoxHeightPx=${Math.round(imageBox.height)}`);
  }
}

test.describe('Iceland stay list — LIVE preview (not PROD)', () => {
  test('390 — LIVE cards · no visible CTA · capture', async ({ page }) => {
    const logLines = ['surface=preview', 'place=iceland', 'viewport=390', 'data=LIVE_edge'];
    await page.setViewportSize({ width: 390, height: 844 });
    const dialog = await openIcelandStayListMobile(page);
    await assertLiveStayCards(dialog, logLines);

    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-card-image-link-iceland-live-390.png',
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    await import('node:fs/promises').then((fs) =>
      fs.writeFile(
        '/opt/cursor/artifacts/evidence-stay-card-image-link-iceland-live.log',
        `${logLines.join('\n')}\n`,
        'utf8',
      ),
    );
  });

  test('1280 — LIVE cards · capture', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const region = await openIcelandStayListDesktop(page);
    await expect(region.getByText('호텔 보고 예약 시작', { exact: true })).toHaveCount(0);
    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-card-image-link-iceland-live-1280.png',
      clip: { x: 0, y: 0, width: 1280, height: 900 },
    });
  });
});
