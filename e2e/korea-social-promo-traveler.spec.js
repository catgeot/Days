import { test, expect } from './fixtures.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR =
  process.env.SOCIAL_PROMO_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-social-promo-traveler';

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

/**
 * Wait until every visible thumbnail in scope is loaded or showing fallback.
 */
async function waitForVisibleThumbs(scope, { timeout = 120_000 } = {}) {
  await expect(scope).toBeVisible({ timeout });
  await expect(async () => {
    const state = await scope.evaluate((root) => {
      const boxes = [...root.querySelectorAll('[data-festival-id]')];
      if (
        !boxes.length &&
        root instanceof Element &&
        root.hasAttribute('data-festival-id')
      ) {
        boxes.push(root);
      }
      const visible = boxes.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8;
      });
      const targets = visible.length ? visible : boxes;
      if (!targets.length) return { ok: false, reason: 'no-cards' };
      for (const box of targets) {
        const img = box.querySelector('img');
        const fallback = box.querySelector('[data-thumb-fallback]');
        if (img) {
          if (!img.complete) return { ok: false, reason: 'img-loading', src: img.src };
          if (img.naturalWidth <= 0) {
            return { ok: false, reason: 'img-zero', src: img.src };
          }
        } else if (!fallback) {
          return { ok: false, reason: 'no-img-or-fallback' };
        }
      }
      return { ok: true };
    });
    expect(state.ok, JSON.stringify(state)).toBe(true);
  }).toPass({ timeout });
}

async function collectThumbUrls(scope) {
  return scope.evaluate((root) => {
    const rows = [];
    const nodes =
      root instanceof Element
        ? [
            ...(root.hasAttribute('data-festival-id') ? [root] : []),
            ...root.querySelectorAll('[data-festival-id]'),
          ]
        : [...document.querySelectorAll('[data-festival-id]')];
    for (const el of nodes) {
      const id = el.getAttribute('data-festival-id');
      const img = el.querySelector('img');
      const fallback = el.querySelector('[data-thumb-fallback]');
      rows.push({
        contentId: id,
        src: img?.src || '',
        naturalWidth: img?.naturalWidth ?? 0,
        fallback: Boolean(fallback),
      });
    }
    return rows;
  });
}

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

/** Wait for thumbnails on festival rows visible in the viewport (lazy-load). */
async function waitForViewportListThumbs(page, { timeout = 120_000 } = {}) {
  const main = page.getByRole('main');
  await expect(main).toBeVisible({ timeout });
  await expect(async () => {
    const state = await main.evaluate(() => {
      const vh = window.innerHeight;
      const boxes = [...document.querySelectorAll('[data-festival-id]')].filter(
        (el) => {
          const r = el.getBoundingClientRect();
          return r.bottom > 0 && r.top < vh && r.width > 8 && r.height > 8;
        },
      );
      if (!boxes.length) return { ok: false, reason: 'no-visible-rows' };
      const targets = boxes.slice(0, 12);
      for (const box of targets) {
        const img = box.querySelector('img');
        const fallback = box.querySelector('[data-thumb-fallback]');
        if (img) {
          if (!img.complete) return { ok: false, reason: 'img-loading' };
          if (img.naturalWidth <= 0) {
            return { ok: false, reason: 'img-zero', src: img.src };
          }
        } else if (!fallback) {
          return { ok: false, reason: 'no-img-or-fallback' };
        }
      }
      return { ok: true, checked: targets.length };
    });
    expect(state.ok, JSON.stringify(state)).toBe(true);
  }).toPass({ timeout });
}

async function waitForPromoReady(page) {
  const promoRow = page.locator('[data-social-promo-festival-row]');
  await expect(promoRow).toBeVisible({ timeout: 120_000 });
  await expect(promoRow).toHaveAttribute('data-social-promo-loading', 'false', {
    timeout: 120_000,
  });
  await waitForVisibleThumbs(promoRow);
  return promoRow;
}

async function closeDetailSheet(page) {
  const closeDetail = page
    .getByRole('dialog')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  await expect(closeDetail).toBeVisible({ timeout: 30_000 });
  await closeDetail.click();
}

test.describe('korea social promo traveler @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(180_000);

  test('promo title, pin+search, region chip, screenshots', async ({ page }) => {
    const imageLog = [];
    const paths = [];

    await page.goto('/korea/');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible({ timeout: 90_000 });
    await dismissLocHint(page);

    await expect(
      page.getByText('GATEO가 소개하는 축제', { exact: true }),
    ).toBeVisible({ timeout: 120_000 });

    const promoRow = await waitForPromoReady(page);
    await expect(promoRow.locator('[data-social-promo-card]')).toHaveCount(2);
    imageLog.push({
      step: '01-home-promo',
      thumbs: await collectThumbUrls(promoRow),
    });
    paths.push(await shot(page, '01-home-promo-row'));

    const gukhyangCard = promoRow
      .locator('[data-social-promo-card][data-festival-id="638576"]')
      .first();
    await gukhyangCard.click();
    await expect(page).toHaveURL(/festival=638576/, { timeout: 60_000 });
    paths.push(await shot(page, '02-detail-sheet'));
    await closeDetailSheet(page);
    await expect(page).not.toHaveURL(/festival=638576/, { timeout: 30_000 });
    await expect(page.locator('[data-session-pinned-festival]')).toHaveCount(0);
    await waitForPromoReady(page);
    await waitForViewportListThumbs(page);
    paths.push(await shot(page, '03-after-close-no-duplicate-pin'));

    const searchToggle = page.getByRole('button', {
      name: /축제 검색|Search festivals/i,
    });
    await searchToggle.click();
    const searchInput = page.getByRole('searchbox').first();
    await searchInput.fill('강릉 국수');
    await searchInput.press('Enter');
    const gangneungHit = page
      .getByRole('main')
      .locator('[data-festival-id]')
      .filter({ hasText: /강릉/ })
      .first();
    await expect(gangneungHit).toBeVisible({ timeout: 60_000 });
    await gangneungHit.click();
    await expect(page).toHaveURL(/festival=\d+/, { timeout: 60_000 });
    await closeDetailSheet(page);
    await page.getByRole('button', { name: /검색 닫기|Close search/i }).click();
    await expect(page.locator('[data-session-pinned-festival]')).toHaveCount(1, {
      timeout: 30_000,
    });
    await expect(
      page
        .locator('[data-session-pinned-festival]')
        .getByText('최근 본 축제'),
    ).toBeVisible();

    await searchToggle.click();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('국향');
    await searchInput.press('Enter');
    await expect(promoRow).toHaveCount(0);
    await expect(page.locator('[data-session-pinned-festival]')).toHaveCount(0);
    const gukhyangHit = page
      .getByRole('main')
      .locator('[data-festival-id="638576"]')
      .first();
    await expect(gukhyangHit).toBeVisible({ timeout: 30_000 });
    await waitForVisibleThumbs(gukhyangHit);
    imageLog.push({
      step: '04-search-gukhyang-no-pin',
      thumbs: await collectThumbUrls(gukhyangHit),
    });
    paths.push(await shot(page, '04-search-gukhyang-prior-viewed'));

    await page.getByRole('button', { name: /검색 닫기|Close search/i }).click();
    await waitForPromoReady(page);

    const gangwon = page.getByRole('button', { name: /강원/ }).first();
    await gangwon.scrollIntoViewIfNeeded();
    await gangwon.click();
    await expect(promoRow).toHaveCount(0, { timeout: 30_000 });
    await waitForViewportListThumbs(page);
    paths.push(await shot(page, '05-region-gangwon-no-promo'));

    const logPath = join(OUT_DIR, 'image-urls.json');
    await writeFile(logPath, JSON.stringify(imageLog, null, 2), 'utf8');

    await test.info().attach('screenshot-paths.txt', {
      body: paths.join('\n'),
      contentType: 'text/plain',
    });
  });
});
