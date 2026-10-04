import { test, expect } from './fixtures.js';

const FESTIVAL_INVALID = '999999999';
const MRT_SCAN_MAX = 10;
/** Prod cross-link fixture — perf-gateo-home-audit-metrics `festival-detail-613316` */
const MRT_PINNED_FESTIVAL_IDS = ['613316'];

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
  const stayHrefs = await stays.evaluateAll((as) => as.map((a) => a.href));
  const tnaHrefs = await tnas.evaluateAll((as) => as.map((a) => a.href));
  return {
    stays: await stays.count(),
    tnas: await tnas.count(),
    stayEmpty,
    tnaEmpty,
    stayHrefs,
    tnaHrefs,
  };
}

async function waitMrtStripReady(dialog) {
  const loadingStay = dialog.getByText(/숙소를 불러오는 중|Loading stays/i);
  const loadingTna = dialog.getByText(/투어·티켓 상품을 불러오는 중|Loading tours and tickets/i);
  await loadingStay.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() =>
    expect(loadingStay).toHaveCount(0, { timeout: 90_000 }),
  );
  await loadingTna.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() =>
    expect(loadingTna).toHaveCount(0, { timeout: 90_000 }),
  );
}

async function tryFestivalMrtStrips(page, id) {
  await page.goto(`/korea/?festival=${id}`);
  const dialog = detailDialog(page);
  try {
    await dialog.waitFor({ state: 'visible', timeout: 45_000 });
    await waitMrtStripReady(dialog);
  } catch {
    return null;
  }
  const stayCount = await dialog.locator('a[href*="accommodation.myrealtrip.com"]').count();
  const tnaCount = await dialog.locator('a[href*="experiences.myrealtrip.com"]').count();
  if (stayCount > 0 || tnaCount > 0) return id;
  await clickDetailClose(page).catch(() => {});
  return null;
}

async function pickFestivalWithMrtStrips(page, cards) {
  for (const id of MRT_PINNED_FESTIVAL_IDS) {
    const hit = await tryFestivalMrtStrips(page, id);
    if (hit) return hit;
  }

  const total = Math.min(await cards.count(), MRT_SCAN_MAX);
  for (let i = 0; i < total; i += 1) {
    const card = cards.nth(i);
    await card.scrollIntoViewIfNeeded();
    const id = await card.getAttribute('data-festival-id');
    if (!id || MRT_PINNED_FESTIVAL_IDS.includes(id)) continue;
    const hit = await tryFestivalMrtStrips(page, id);
    if (hit) return hit;
  }
  throw new Error('no listed festival exposes MRT strips — check festivalCross/stay mapping');
}

function assertMrtAffiliateLinks(mrt) {
  for (const h of mrt.stayHrefs) {
    expect(h, `lodging href: ${h}`).toMatch(/accommodation\.myrealtrip\.com/);
    expect(h, `lodging affiliate: ${h}`).toMatch(/mylink_id=\d+/);
  }
  for (const h of mrt.tnaHrefs) {
    expect(h, `tna href: ${h}`).toMatch(/experiences\.myrealtrip\.com/);
    expect(h, `tna affiliate: ${h}`).toMatch(/mylink_id=\d+|utm_source=mktpartner/);
  }
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

    await page.goto(`/korea/?festival=${festivalA}`);
    await expect(detailDialog(page)).toBeVisible({ timeout: 60_000 });
    await page.goBack();
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/korea/);
    results.d =
      page.url().includes('/korea') &&
      !(await detailDialog(page).isVisible().catch(() => false));

    const cards2 = await waitForFestivalList(page);
    await openFirstCard(page, cards2);
    const firstId = festivalParam(page.url());
    const secondContentId = await cards2.nth(1).getAttribute('data-festival-id');
    expect(secondContentId).toBeTruthy();
    await page.evaluate((id) => {
      document.querySelector(`[data-festival-id="${id}"]`)?.click();
    }, secondContentId);
    await expect(detailDialog(page)).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(() => festivalParam(page.url()), {
        timeout: 30_000,
        message: 'second festival id appears in URL',
      })
      .not.toBe('');
    await expect
      .poll(() => festivalParam(page.url()), {
        timeout: 30_000,
        message: 'second festival differs from first',
      })
      .not.toBe(firstId);
    await page.goBack();
    await expect(detailDialog(page)).toBeHidden({ timeout: 15_000 });
    await expect
      .poll(() => festivalParam(page.url()), { timeout: 30_000, message: 'festival param cleared after A→B→back' })
      .toBe('');
    results.e = !(await detailDialog(page).isVisible().catch(() => false));

    await page.goto(`/korea/?festival=${FESTIVAL_INVALID}`);
    await expect(detailDialog(page)).toBeHidden({ timeout: 30_000 });
    await expect
      .poll(() => festivalParam(page.url()), { timeout: 30_000, message: 'invalid festival id stripped from URL' })
      .toBe('');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible();
    results.f = !(await detailDialog(page).isVisible().catch(() => false));

    const cards3 = await waitForFestivalList(page);
    const brokenOnList = await countBrokenImages(page);
    const mrtFestivalId = await pickFestivalWithMrtStrips(page, cards3);
    await expect(detailDialog(page)).toBeVisible({ timeout: 60_000 });
    const brokenOnDetail = await countBrokenImages(page);
    const mrt = await settleMrtStrips(page);

    test.info().attach(`${engine}-scenario-results.json`, {
      body: JSON.stringify(
        {
          engine,
          scenarios: results,
          brokenOnList,
          brokenOnDetail,
          mrt: {
            stays: mrt.stays,
            tnas: mrt.tnas,
            stayEmpty: mrt.stayEmpty,
            tnaEmpty: mrt.tnaEmpty,
            hrefSample: [...mrt.stayHrefs.slice(0, 2), ...mrt.tnaHrefs.slice(0, 2)],
            mrtFestivalId,
          },
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
    assertMrtAffiliateLinks(mrt);
  });
});
