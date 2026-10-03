import { test, expect } from './fixtures.js';

const FESTIVAL_INVALID = '999999999';

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

async function settleMrtStrips(page) {
  const dialog = detailDialog(page);
  await expect(dialog.getByRole('heading', { name: /내 여행 일정|Your trip dates/i })).toBeVisible({
    timeout: 60_000,
  });
  await expect(
    dialog.getByRole('heading', { name: /투어 · 체험 · 티켓|Tours & Tickets/i }),
  ).toBeVisible({ timeout: 60_000 });
  await expect(dialog.getByText(/숙소를 불러오는 중|Loading stays/i)).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect(
    dialog.getByText(/투어·티켓 상품을 불러오는 중|Loading tours and tickets/i),
  ).toHaveCount(0, { timeout: 120_000 });
  const stays = dialog.locator('.overflow-x-auto a[href*="accommodation.myrealtrip.com"]');
  const tnas = dialog.locator('.overflow-x-auto a[href*="experiences.myrealtrip.com"]');
  const stayEmpty = await dialog
    .getByText(/선택 일정에 맞는 숙소가 없습니다|No stays for these dates/i)
    .isVisible()
    .catch(() => false);
  const tnaEmpty = await dialog
    .getByText(/선택 지역에 맞는 투어·티켓 상품이 없습니다|No tours or tickets found/i)
    .isVisible()
    .catch(() => false);
  const hrefs = await dialog
    .locator('.overflow-x-auto a[href*="myrealtrip.com"]')
    .evaluateAll((as) => as.map((a) => a.href));
  return {
    stays: await stays.count(),
    tnas: await tnas.count(),
    stayEmpty,
    tnaEmpty,
    hrefs,
  };
}

async function pickFestivalWithMrtStrips(page, cards) {
  const total = Math.min(await cards.count(), 120);
  for (let i = 0; i < total; i += 1) {
    const id = await cards.nth(i).getAttribute('data-festival-id');
    if (!id) continue;
    await page.goto(`/korea/?festival=${id}`);
    const dialog = detailDialog(page);
    const dialogOpen = await dialog.isVisible({ timeout: 45_000 }).catch(() => false);
    if (!dialogOpen) continue;
    const visible = await dialog
      .getByRole('heading', { name: /내 여행 일정|Your trip dates/i })
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    if (visible) return id;
    await clickDetailClose(page).catch(() => {});
  }
  throw new Error('no listed festival exposes MRT strips — check festivalCross/stay mapping');
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

test.describe('Korea festival detail URL + history', () => {
  test('scenarios a–f + image/MRT counts', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    const engine = testInfo.project.name;
    const results = {};

    const cards = await waitForFestivalList(page);
    const festivalA = await cards.first().getAttribute('data-festival-id');
    expect(festivalA, 'list card data-festival-id').toBeTruthy();

    // (a) card → detail → browser back
    await openFirstCard(page, cards);
    await expect(page).toHaveURL(/festival=/, { timeout: 15_000 });
    const idA = festivalParam(page.url());
    expect(idA).toBeTruthy();
    await page.goBack();
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/korea\/?(\?|$)/);
    await expect
      .poll(() => festivalParam(page.url()), { timeout: 30_000, message: 'festival param cleared after back' })
      .toBe('');
    results.a =
      !festivalParam(page.url()) &&
      !(await detailDialog(page).isVisible().catch(() => false));

    // (b) card → close → back does not reopen detail
    await openFirstCard(page, cards);
    await clickDetailClose(page);
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect
      .poll(() => festivalParam(page.url()), { timeout: 30_000, message: 'festival param cleared after close' })
      .toBe('');
    await page.goBack();
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect
      .poll(() => festivalParam(page.url()), { timeout: 30_000, message: 'festival param stays clear after back' })
      .toBe('');
    results.b = !(await detailDialog(page).isVisible().catch(() => false));

    // (c) deep link → close → clean URL → reload stays closed
    await page.goto(`/korea/?festival=${festivalA}`);
    await expect(detailDialog(page)).toBeVisible({ timeout: 60_000 });
    await clickDetailClose(page);
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect
      .poll(() => festivalParam(page.url()), { timeout: 30_000, message: 'festival param cleared after deep link close' })
      .toBe('');
    await page.reload();
    await expect(detailDialog(page)).toBeHidden({ timeout: 30_000 });
    results.c = !(await detailDialog(page).isVisible().catch(() => false));

    // (d) deep link → back stays on site
    await page.goto(`/korea/?festival=${festivalA}`);
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
    await expect
      .poll(() => festivalParam(page.url()), { timeout: 30_000, message: 'festival param cleared after A→B→back' })
      .toBe('');
    results.e = !(await detailDialog(page).isVisible().catch(() => false));

    // (f) invalid id
    await page.goto(`/korea/?festival=${FESTIVAL_INVALID}`);
    await expect(detailDialog(page)).toBeHidden({ timeout: 30_000 });
    await expect
      .poll(() => festivalParam(page.url()), { timeout: 30_000, message: 'invalid festival id stripped from URL' })
      .toBe('');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible();
    results.f = !(await detailDialog(page).isVisible().catch(() => false));

    // broken images + MRT on list and festival detail
    const cards3 = await waitForFestivalList(page);
    const brokenOnList = await countBrokenImages(page);
    const mrtFestivalId = await pickFestivalWithMrtStrips(page, cards3);
    await expect(detailDialog(page)).toBeVisible({ timeout: 60_000 });
    const brokenOnDetail = await countBrokenImages(page);
    const mrt = await settleMrtStrips(page);

    const mrtAttachment = {
      stays: mrt.stays,
      tnas: mrt.tnas,
      stayEmpty: mrt.stayEmpty,
      tnaEmpty: mrt.tnaEmpty,
      hrefSample: mrt.hrefs.slice(0, 3),
      mrtFestivalId,
    };

    test.info().attach(`${engine}-scenario-results.json`, {
      body: JSON.stringify(
        {
          engine,
          scenarios: results,
          brokenOnList,
          brokenOnDetail,
          mrt: mrtAttachment,
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

    expect(mrt.stays > 0 || mrt.stayEmpty, 'stay strip settled (cards or explicit empty)').toBe(true);
    expect(mrt.tnas > 0 || mrt.tnaEmpty, 'TNA strip settled (cards or explicit empty)').toBe(true);
    expect(mrt.stays + mrt.tnas, 'at least one MRT product card on festival detail').toBeGreaterThan(0);
    expect(mrt.stays, 'stay cards ≤ page size').toBeLessThanOrEqual(20);

    for (const h of mrt.hrefs.filter((u) => /myrealtrip\.com\/(union\/)?products\/\d+/.test(u))) {
      expect(h, `MRT card affiliate params: ${h}`).toMatch(/mylink_id=\d+/);
    }
  });
});
