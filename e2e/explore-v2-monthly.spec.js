// 「11월의 여행지」 — code default ON, mosaic B only, no noindex (env flag / legacy query do not change it)
import { test, expect } from './fixtures.js';

const MONTHLY_VISIBLE_COUNT = 6;
const MONTHLY_HEADING = '11월의 여행지';

const monthlySection = (page) => page.getByTestId('explore-v2-monthly-section');
const SCROLL_AREA = (page) => page.locator('.modal-scroll-area').first();

async function openExplore(page, viewport, search = '') {
  await page.setViewportSize(viewport);
  const suffix = search ? (search.startsWith('?') ? search : `?${search}`) : '';
  await page.goto(`/explore${suffix}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
}

async function expectMonthlyMosaic(page) {
  const section = monthlySection(page);
  await expect(section).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(2000);
  await expect(section).not.toHaveAttribute('data-explore-v2-excluded');
  await expect(page.getByTestId('explore-v2-monthly-heading')).toHaveText(MONTHLY_HEADING);
  await expect(page.getByTestId('explore-v2-monthly-layout-b')).toBeVisible();
  await expect(page.getByTestId('explore-v2-monthly-layout-a')).toHaveCount(0);
  await expect(page.locator('[data-testid^="explore-v2-monthly-card-"]')).toHaveCount(
    MONTHLY_VISIBLE_COUNT,
  );
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(0);
  return section;
}

async function expectPhotoAltAndTextPanels(page, altForName) {
  const cards = page.locator('[data-testid^="explore-v2-monthly-card-"]');
  const count = await cards.count();
  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    const name = (await card.locator('h3').textContent()).trim();
    await expect(card.locator('img')).toHaveAttribute('alt', altForName(name));
  }
  const alphas = await page
    .getByTestId('explore-v2-monthly-text-panel')
    .evaluateAll((panels) =>
      panels.map((el) => {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 1;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = getComputedStyle(el).backgroundColor;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        const card = el.closest('[data-testid^="explore-v2-monthly-card-"]');
        const img = card?.querySelector('img');
        const imgRect = img?.getBoundingClientRect();
        const panelRect = el.getBoundingClientRect();
        return {
          dark: r + g + b === 0,
          alpha: a / 255,
          overlapsPhoto: imgRect ? panelRect.top < imgRect.bottom - 1 : true,
        };
      }),
    );
  expect(alphas).toHaveLength(count);
  for (const { dark, alpha, overlapsPhoto } of alphas) {
    expect(dark).toBe(true);
    expect(alpha).toBeGreaterThanOrEqual(0.69);
    expect(overlapsPhoto).toBe(false);
  }
}

async function expectNoMonthlyHorizontalOverflow(page) {
  const overflow = await page.getByTestId('explore-v2-monthly-layout-b').evaluate((root) => {
    const targets = root.classList.contains('grid')
      ? [root]
      : [...root.querySelectorAll(':scope > div.grid')];
    return targets.map((grid) => grid.scrollWidth - grid.clientWidth);
  });
  expect(overflow.length).toBeGreaterThan(0);
  expect(overflow.every((d) => d <= 1)).toBe(true);
}

async function expectNoFullWidthMonthlyBanner(page) {
  const fullSpan = await page.getByTestId('explore-v2-monthly-layout-b').evaluate((root) => {
    return [...root.querySelectorAll('[data-testid^="explore-v2-monthly-item-"]')].some((el) => {
      const grid = root;
      const itemLeft = el.offsetLeft;
      const itemWidth = el.offsetWidth;
      const gridWidth = grid.clientWidth;
      return itemLeft <= 2 && itemWidth >= gridWidth - 4;
    });
  });
  expect(fullSpan).toBe(false);
}

async function expectMobileWideTallRhythm(page) {
  const report = await page.getByTestId('explore-v2-monthly-layout-b').evaluate((root) => {
    const width = root.clientWidth;
    const item = (slug) => root.querySelector(`[data-testid="explore-v2-monthly-item-${slug}"]`);
    const ratio = (slug) => item(slug).offsetWidth / width;
    const top = (slug) => item(slug).offsetTop;
    return {
      kyoto: ratio('kyoto'),
      jeju: ratio('jeju'),
      chiang: ratio('chiang-mai'),
      phu: ratio('phu-quoc'),
      dubai: ratio('dubai'),
      melbourne: ratio('melbourne'),
      pairLanterns: top('chiang-mai') === top('phu-quoc'),
      pairLast: top('dubai') === top('melbourne'),
      jejuOwnRow: top('jeju') !== top('dubai') && top('jeju') !== top('phu-quoc'),
    };
  });
  expect(report.kyoto).toBeGreaterThan(0.9);
  expect(report.jeju).toBeGreaterThan(0.9);
  expect(report.chiang).toBeLessThan(0.6);
  expect(report.phu).toBeLessThan(0.6);
  expect(report.dubai).toBeLessThan(0.6);
  expect(report.melbourne).toBeLessThan(0.6);
  expect(report.pairLanterns).toBe(true);
  expect(report.pairLast).toBe(true);
  expect(report.jejuOwnRow).toBe(true);
}

async function expectPhotoTallerThanSummary(page) {
  const rows = await page.getByTestId('explore-v2-monthly-layout-b').evaluate((root) =>
    [...root.querySelectorAll('[data-testid^="explore-v2-monthly-card-"]')].map((card) => {
      const photo = card.querySelector('[data-testid^="explore-v2-monthly-photo-"]');
      const text = card.querySelector('[data-testid="explore-v2-monthly-text-panel"]');
      return {
        photo: photo.getBoundingClientRect().height,
        text: text.getBoundingClientRect().height,
      };
    }),
  );
  expect(rows.length).toBe(MONTHLY_VISIBLE_COUNT);
  for (const row of rows) {
    expect(row.photo).toBeGreaterThan(row.text);
  }
}

async function expectAllMonthlyPickSlugsVisible(page) {
  for (const slug of ['kyoto', 'chiang-mai', 'phu-quoc', 'jeju', 'dubai', 'melbourne']) {
    const item = page.getByTestId(`explore-v2-monthly-item-${slug}`);
    await item.scrollIntoViewIfNeeded();
    await expect(item).toBeVisible();
    await expect(page.getByTestId(`explore-v2-monthly-card-${slug}`)).toBeVisible();
  }
}

async function expectMonthlyCardsDoNotOverlap(page) {
  const report = await page.getByTestId('explore-v2-monthly-layout-b').evaluate((root) => {
    const items = [...root.querySelectorAll('[data-testid^="explore-v2-monthly-item-"]')];
    const boxes = items.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        id: el.getAttribute('data-testid'),
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
      };
    });
    const hits = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 1 && overlapY > 1) {
          hits.push({ a: a.id, b: b.id, overlapX, overlapY });
        }
      }
    }
    const leaks = [];
    for (const el of items) {
      const item = el.getBoundingClientRect();
      for (const bit of el.querySelectorAll('a, p, h3')) {
        const r = bit.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        const outside =
          r.left < item.left - 1 ||
          r.right > item.right + 1 ||
          r.top < item.top - 1 ||
          r.bottom > item.bottom + 1;
        if (outside) {
          leaks.push({
            id: el.getAttribute('data-testid'),
            text: (bit.textContent || '').trim().slice(0, 48),
          });
        }
      }
    }
    return { hits, leaks };
  });
  expect(report.hits).toEqual([]);
  expect(report.leaks).toEqual([]);
}

async function expectMonthlySummaryNotSources(page) {
  await expect(page.getByTestId('explore-v2-monthly-source-link')).toHaveCount(0);
  await expect(page.getByText('파일·정책 페이지')).toHaveCount(0);
  await expect(page.getByText('File / policy')).toHaveCount(0);
  await expect(page.getByTestId('explore-v2-monthly-summary')).toHaveCount(MONTHLY_VISIBLE_COUNT);
  const kyoto = page.getByTestId('explore-v2-monthly-card-kyoto');
  await expect(kyoto).toContainText('단풍 절정');
  await expect(kyoto).not.toContainText('일본 전통 문화의 심장');
  const jeju = page.getByTestId('explore-v2-monthly-card-jeju');
  await expect(jeju).toContainText('추정');
  await expect(jeju).not.toContainText('세계자연유산');
  const chiang = page.getByTestId('explore-v2-monthly-card-chiang-mai');
  await expect(chiang).toContainText('이펭');
  await expect(chiang).not.toContainText('태국 북부의 문화 수도');
}

async function expectIrregularMonthlyCardHeights(page) {
  const report = await page.getByTestId('explore-v2-monthly-layout-b').evaluate((root) => {
    const cards = [...root.querySelectorAll('[data-testid^="explore-v2-monthly-card-"]')];
    const heights = cards.map((el) => Math.round(el.getBoundingClientRect().height));
    const photos = [...root.querySelectorAll('[data-testid^="explore-v2-monthly-photo-"]')].map((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    const tops = cards.map((el) => Math.round(el.getBoundingClientRect().top));
    return {
      uniqueCards: new Set(heights).size,
      uniquePhotos: new Set(photos).size,
      uniqueTops: new Set(tops).size,
    };
  });
  expect(report.uniqueCards).toBeGreaterThan(2);
  expect(report.uniquePhotos).toBeGreaterThan(2);
  expect(report.uniqueTops).toBeGreaterThan(2);
}

test.describe('Explore monthly picks @flagOff', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(() => {
    test.skip(
      process.env.VITE_GATEO_EXPLORE_V2 === '1',
      'default-path tests require env flag off in webServer',
    );
  });

  test('390 — default /explore shows mosaic B, jeju estimate, tap navigates', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    await expectMonthlyMosaic(page);
    await expectNoMonthlyHorizontalOverflow(page);
    await expectMobileWideTallRhythm(page);
    await expectPhotoTallerThanSummary(page);
    await expectIrregularMonthlyCardHeights(page);
    await expectMonthlyCardsDoNotOverlap(page);
    await expectMonthlySummaryNotSources(page);
    await expectAllMonthlyPickSlugsVisible(page);

    const jejuItem = page.getByTestId('explore-v2-monthly-item-jeju');
    const jejuCard = page.getByTestId('explore-v2-monthly-card-jeju');
    await expect(jejuCard.getByTestId('explore-v2-monthly-estimate')).toHaveText('추정');

    const scrollEl = SCROLL_AREA(page);
    const urlBefore = page.url();
    const scrollBefore = await scrollEl.evaluate((el) => el.scrollTop);
    await page.waitForTimeout(1500);
    expect(page.url()).toBe(urlBefore);
    expect(await scrollEl.evaluate((el) => el.scrollTop)).toBe(scrollBefore);

    await jejuItem.scrollIntoViewIfNeeded();
    await jejuCard.click();
    await expect(page).toHaveURL(/\/place\/jeju/, { timeout: 30_000 });
  });

  test('390 — Korean photo alt and dark text panel on every card', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    await expectMonthlyMosaic(page);
    await expectPhotoAltAndTextPanels(page, (name) => `${name} 대표 사진`);
  });

  test('1280 — English UI uses English photo alt', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 }, 'lang=en');
    await expect(monthlySection(page)).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('explore-v2-monthly-card-kyoto').locator('img')).toHaveAttribute(
      'alt',
      'Featured photo of Kyoto',
    );
    await expect(page.getByTestId('explore-v2-monthly-card-jeju').locator('img')).toHaveAttribute(
      'alt',
      'Featured photo of Jeju',
    );
  });

  test('1280 — default /explore shows mosaic B without gaps', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 });
    await expectMonthlyMosaic(page);
    await expectNoMonthlyHorizontalOverflow(page);
    await expectNoFullWidthMonthlyBanner(page);
    await expectPhotoTallerThanSummary(page);
    await expectIrregularMonthlyCardHeights(page);
    await expectMonthlyCardsDoNotOverlap(page);
    await expectMonthlySummaryNotSources(page);
    await expectAllMonthlyPickSlugsVisible(page);
    await expectPhotoAltAndTextPanels(page, (name) => `${name} 대표 사진`);
    await expect(page.getByText('에디터스 픽').first()).toBeVisible({ timeout: 45_000 });
  });
});

test.describe('Explore monthly picks @queryOn', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(() => {
    test.skip(
      process.env.VITE_GATEO_EXPLORE_V2 === '1',
      'legacy query path is tested with env flag off',
    );
  });

  test('390 — legacy ?explore_v2=1&layout=a still mosaic B, no noindex', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 }, 'explore_v2=1&layout=a');
    await expectMonthlyMosaic(page);
  });

  test('1280 — legacy ?explore_v2=1 still mosaic B, no noindex', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 }, 'explore_v2=1');
    await expectMonthlyMosaic(page);
  });
});

test.describe('Explore monthly picks @flagOn', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(() => {
    test.skip(
      process.env.VITE_GATEO_EXPLORE_V2 !== '1',
      'requires VITE_GATEO_EXPLORE_V2=1 in webServer',
    );
  });

  test('390 — env flag on keeps same mosaic B', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    await expectMonthlyMosaic(page);
    await expectNoMonthlyHorizontalOverflow(page);
  });

  test('1280 — env flag on keeps same mosaic B and jeju estimate', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 });
    await expectMonthlyMosaic(page);
    await expect(
      page.getByTestId('explore-v2-monthly-card-jeju').getByTestId('explore-v2-monthly-estimate'),
    ).toBeVisible();
    await expect(page.getByText('에디터스 픽').first()).toBeVisible();
  });
});
