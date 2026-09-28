import { test, expect } from '@playwright/test';

const FESTIVAL_A = '613316';
const FESTIVAL_INVALID = '999999999';

async function blockSupabaseWrites(page) {
  await page.route(/\/rest\/v1\//, async (route) => {
    const req = route.request();
    if (req.method() !== 'GET') {
      await route.abort();
      return;
    }
    await route.continue();
  });
}

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  if (await close.isVisible({ timeout: 2500 }).catch(() => false)) {
    await close.click();
  }
}

function festivalCards(page) {
  return page
    .getByRole('main')
    .getByRole('button')
    .filter({ has: page.locator('img[alt]') });
}

async function waitForFestivalList(page) {
  await page.goto('/korea/');
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 60_000 });
  await dismissLocHint(page);
  const cards = festivalCards(page);
  await expect(cards.first()).toBeVisible({ timeout: 90_000 });
  return cards;
}

function festivalParam(url) {
  try {
    return new URL(url).searchParams.get('festival') || '';
  } catch {
    return '';
  }
}

async function countBrokenImages(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    return imgs.filter((img) => img.complete && img.naturalWidth === 0).length;
  });
}

async function countMrtProductCards(page) {
  const dialog = detailDialog(page);
  const cards = dialog.locator('.overflow-x-auto a[href*="myrealtrip.com"]');
  await expect(cards.first()).toBeVisible({ timeout: 120_000 });
  return cards.count();
}

function detailDialog(page) {
  return page.getByRole('dialog').first();
}

async function clickDetailClose(page) {
  const dialog = detailDialog(page);
  await expect(dialog).toBeVisible();
  await page
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .last()
    .click();
}

async function openFirstCard(page, cards) {
  const first = cards.first();
  await first.click();
  await expect(detailDialog(page)).toBeVisible({ timeout: 30_000 });
}

async function openSecondCard(page, cards) {
  await cards.nth(1).click({ force: true });
  await expect(detailDialog(page)).toBeVisible({ timeout: 30_000 });
}

test.describe('Korea festival detail URL + history', () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabaseWrites(page);
  });

  test('scenarios a–f + image/MRT counts', async ({ page }, testInfo) => {
    const engine = testInfo.project.name;
    const results = {};

    const cards = await waitForFestivalList(page);

    // (a) card → detail → browser back
    await openFirstCard(page, cards);
    await expect(page).toHaveURL(/festival=/, { timeout: 15_000 });
    const idA = festivalParam(page.url());
    expect(idA).toBeTruthy();
    await page.goBack();
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/korea\/?(\?|$)/);
    expect(festivalParam(page.url())).toBe('');
    results.a =
      !festivalParam(page.url()) &&
      !(await detailDialog(page).isVisible().catch(() => false));

    // (b) card → close → back does not reopen detail
    await openFirstCard(page, cards);
    await clickDetailClose(page);
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    expect(festivalParam(page.url())).toBe('');
    await page.goBack();
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    expect(festivalParam(page.url())).toBe('');
    results.b = !(await detailDialog(page).isVisible().catch(() => false));

    // (c) deep link → close → clean URL → reload stays closed
    await page.goto(`/korea/?festival=${FESTIVAL_A}`);
    await expect(detailDialog(page)).toBeVisible({ timeout: 60_000 });
    await clickDetailClose(page);
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    expect(festivalParam(page.url())).toBe('');
    await page.reload();
    await expect(detailDialog(page)).toBeHidden({ timeout: 30_000 });
    results.c = !(await detailDialog(page).isVisible().catch(() => false));

    // (d) deep link → back stays on site
    await page.goto(`/korea/?festival=${FESTIVAL_A}`);
    await expect(detailDialog(page)).toBeVisible({ timeout: 60_000 });
    await page.goBack();
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/korea/);
    results.d =
      page.url().includes('/korea') &&
      !(await detailDialog(page).isVisible().catch(() => false));

    // (e) A → B → back → list (not A)
    const cards2 = await waitForFestivalList(page);
    await openFirstCard(page, cards2);
    const firstId = festivalParam(page.url());
    const secondContentId = await cards2.nth(1).getAttribute('data-festival-id');
    expect(secondContentId).toBeTruthy();
    await page.evaluate((id) => {
      document.querySelector(`[data-festival-id="${id}"]`)?.click();
    }, secondContentId);
    await expect(detailDialog(page)).toBeVisible({ timeout: 30_000 });
    const secondId = festivalParam(page.url());
    expect(secondId).toBeTruthy();
    expect(secondId).not.toBe(firstId);
    await page.goBack();
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    expect(festivalParam(page.url())).toBe('');
    results.e = !(await detailDialog(page).isVisible().catch(() => false));

    // (f) invalid id
    await page.goto(`/korea/?festival=${FESTIVAL_INVALID}`);
    await expect(detailDialog(page)).toBeHidden({ timeout: 30_000 });
    expect(festivalParam(page.url())).toBe('');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible();
    results.f = !(await detailDialog(page).isVisible().catch(() => false));

    // broken images + MRT on list and festival detail
    await waitForFestivalList(page);
    const brokenOnList = await countBrokenImages(page);
    await page.goto(`/korea/?festival=${FESTIVAL_A}`);
    await expect(detailDialog(page)).toBeVisible({ timeout: 60_000 });
    const brokenOnDetail = await countBrokenImages(page);
    const mrtCount = await countMrtProductCards(page);

    test.info().attach(`${engine}-scenario-results.json`, {
      body: JSON.stringify(
        {
          engine,
          scenarios: results,
          brokenOnList,
          brokenOnDetail,
          mrtCount,
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    expect(results.a, 'scenario a').toBe(true);
    expect(results.b, 'scenario b').toBe(true);
    expect(results.c, 'scenario c').toBe(true);
    expect(results.d, 'scenario d').toBe(true);
    expect(results.e, 'scenario e').toBe(true);
    expect(results.f, 'scenario f').toBe(true);
    expect(brokenOnList, 'broken images on list').toBe(0);
    expect(brokenOnDetail, 'broken images on detail').toBe(0);
    expect(mrtCount, 'MRT cards on 613316').toBe(27);
  });
});
