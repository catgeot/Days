import { test, expect } from './fixtures.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = '/opt/cursor/artifacts/screenshots/gukhyang-manual-638576';
const GUKHYANG_ID = '638576';

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

async function shot(page, name, options = {}) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: options.fullPage !== false, ...options });
  return path;
}

function sidoChipButton(page, label) {
  return page.getByRole('button', { name: new RegExp(`^${label} \\d+$`) });
}

async function ensureFestivalWindowLoaded(page) {
  const loadError = page.getByText('축제 목록을 불러오지 못했습니다');
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (!(await loadError.isVisible().catch(() => false))) break;
    await page.getByRole('button', { name: '다시 시도' }).click();
    await page.waitForTimeout(4000);
  }
  await expect(page.getByRole('button', { name: /^전남 \d+$/ })).toBeVisible({
    timeout: 120_000,
  });
}

test.describe('gukhyang manual — real TourAPI @390 webkit', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test('전남·경남 list counts and single promo', async ({ page }) => {
    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await expect(page.locator('[data-social-promo-card], [data-social-promo-card-skeleton]').first()).toBeVisible({
      timeout: 120_000,
    });
    await ensureFestivalWindowLoaded(page);

    const jeonnam = sidoChipButton(page, '전남');
    await expect(jeonnam).toBeVisible({ timeout: 60_000 });
    await expect(jeonnam).toContainText('14');
    await jeonnam.click();
    await expect(page.locator(`[data-social-promo-card][data-festival-id="${GUKHYANG_ID}"]`)).toBeVisible({
      timeout: 60_000,
    });
    await expect(async () => {
      const count = await page.locator(`[data-festival-id="${GUKHYANG_ID}"]`).count();
      expect(count).toBe(1);
    }).toPass({ timeout: 30_000 });
    await shot(page, 'jeonnam-list-single-promo-390');

    const gyeongnam = sidoChipButton(page, '경남');
    await expect(gyeongnam).toBeVisible({ timeout: 60_000 });
    await expect(gyeongnam).toContainText('10');
    await gyeongnam.click();
    await expect(page.locator('[data-social-promo-card][data-festival-id="637693"]')).toBeVisible({
      timeout: 60_000,
    });
    await shot(page, 'gyeongnam-list-single-promo-390');
  });

  test('국향 detail — no event hours, layout, trust bar', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto(`/korea?festival=${GUKHYANG_ID}`, { waitUntil: 'commit' });
    await dismissLocHint(page);
    await expect(page.locator('#korea-festival-sheet-title')).toContainText('국향대전', {
      timeout: 180_000,
    });
    await expect(page.getByText(/2026\.10\.13 확인/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-festival-photo-credit]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-festival-summary-fee]')).toContainText('사전예매 10%');
    await expect(page.locator('[data-festival-summary-fee]')).toContainText('함평군민');

    const summary = page.locator('[data-festival-detail-summary]');
    await expect(summary).toBeVisible();
    await expect(summary).not.toContainText(/행사\s*시간/);
    await expect(summary).not.toContainText(/\d{1,2}:\d{2}/);

    await expect(page.locator('[data-festival-summary-time]')).toHaveCount(0);

    const hero = page.locator('[data-festival-photo-strip]').first();
    await expect(hero).toBeVisible();
    const title = page.locator('#korea-festival-sheet-title');
    await expect(title).toBeVisible();
    await shot(page, 'gukhyang-detail-sheet-top-photo-title-390', {
      fullPage: false,
      clip: await hero.boundingBox().then(async (box) => {
        const titleBox = await title.boundingBox();
        if (!box || !titleBox) return undefined;
        return {
          x: Math.min(box.x, titleBox.x),
          y: box.y,
          width: Math.max(box.width, titleBox.width),
          height: titleBox.y + titleBox.height - box.y,
        };
      }),
    });

    await shot(page, 'gukhyang-detail-asof-credit-390');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('navigation', { name: /소개|About|회사/i })).toHaveCount(0);
    await shot(page, 'gukhyang-detail-sheet-bottom-no-trust-band-390', { fullPage: false });
  });
});

test.describe('live prod trust bar @390 webkit', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test('gateo.kr main — festival deeplink trust bar', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('https://www.gateo.kr/korea?festival=638576', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await mkdir(OUT_DIR, { recursive: true });
    await page.waitForTimeout(4000);
    const trustVisible = await page
      .getByRole('navigation')
      .filter({ hasText: /소개|이용약관|개인정보/ })
      .first()
      .isVisible()
      .catch(() => false);
    await page.screenshot({
      path: join(OUT_DIR, 'live-gateo-festival-638576-trust-bar-390.png'),
      fullPage: false,
    });
    test.info().annotations.push({
      type: 'live-trust-bar-visible',
      description: String(trustVisible),
    });
  });
});
