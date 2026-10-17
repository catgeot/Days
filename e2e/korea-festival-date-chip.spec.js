import { test, expect } from '@playwright/test';

const FILTER_CHIP_ACTIVE_BG = 'rgb(180, 83, 9)';

async function expectPeriodChipPainted(page, activeId, idleId) {
  await expect(page.locator(`[data-period-id="${activeId}"]`)).toHaveCSS(
    'background-color',
    FILTER_CHIP_ACTIVE_BG,
  );
  await expect(page.locator(`[data-period-id="${idleId}"]`)).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
}

const FIXTURE = [
  {
    contentId: '1001',
    title: '서울 경계 축제',
    eventStartDate: '20261016',
    eventEndDate: '20261016',
    addr1: '서울특별시 종로구 세종대로 1',
    areaCode: '1',
  },
  {
    contentId: '1002',
    title: '강릉 주말 축제',
    eventStartDate: '20261024',
    eventEndDate: '20261025',
    addr1: '강원특별자치도 강릉시 경포로 1',
    areaCode: '32',
  },
  {
    contentId: '1003',
    title: '제주 먼 축제',
    eventStartDate: '20270601',
    eventEndDate: '20270603',
    addr1: '제주특별자치도 제주시 관덕로 1',
    areaCode: '39',
  },
  {
    contentId: '1005',
    title: '서울 둘째 축제',
    eventStartDate: '20261020',
    eventEndDate: '20261021',
    addr1: '서울특별시 마포구 양화로 1',
    areaCode: '1',
  },
  {
    contentId: '1004',
    title: '이미 끝난 축제',
    eventStartDate: '20261001',
    eventEndDate: '20261002',
    addr1: '서울특별시 중구 세종대로 2',
    areaCode: '1',
  },
  {
    contentId: '1006',
    title: '토요일만 축제',
    eventStartDate: '20261017',
    eventEndDate: '20261017',
    addr1: '서울특별시 용산구 이태원로 1',
    areaCode: '1',
  },
];

async function dismissLocHint(page) {
  const close = page.getByRole('button', { name: /^닫기$/ }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* hint not shown */
  }
}

async function openTimeRow(page) {
  await page.getByRole('button', { name: /시간 대분류/ }).click();
}

async function periodCount(page, id) {
  const text = await page
    .locator(`[data-period-id="${id}"] [data-period-count]`)
    .innerText();
  return Number(text.trim());
}

function listCards(page) {
  return page.locator('main [data-festival-id]');
}

test.describe('Korea festival date chips', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-16T03:00:00.000Z') });
    await page.route('**/functions/v1/tourapi-proxy**', async (route) => {
      let action = '';
      try {
        action = String(route.request().postDataJSON()?.action || '');
      } catch {
        action = '';
      }
      if (action === 'festivalWindow') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, items: FIXTURE }),
        });
        return;
      }
      if (action === 'festivalDetail') {
        const id = String(route.request().postDataJSON()?.contentId || '');
        const row = FIXTURE.find((r) => String(r.contentId) === id);
        if (row) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ok: true,
              contentId: id,
              intro: {
                contentId: id,
                eventStartDate: row.eventStartDate,
                eventEndDate: row.eventEndDate,
              },
              common: {
                contentId: id,
                title: row.title,
                addr1: row.addr1,
              },
            }),
          });
          return;
        }
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto('/korea/');
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });
    await dismissLocHint(page);
    await expect(page.locator('main [data-festival-id]').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('landing matches flag-off hub (recommended row, no window30 filter until tap)', async ({
    page,
  }) => {
    await expect(page.locator('[data-social-promo-festival-row]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-festival-list-heading] h2')).not.toContainText(
      '한 달 이내',
    );
    await openTimeRow(page);
    const window30Chip = page.locator('[data-period-id="window30"]');
    await expect(window30Chip).toHaveAttribute('aria-pressed', 'false');
    await window30Chip.click();
    await expect(window30Chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-festival-list-heading] h2')).toContainText(
      '한 달 이내',
    );
  });

  test('festival deep link still opens detail on default landing', async ({ page }) => {
    const row = FIXTURE[0];
    await page.goto('/korea/?festival=1001');
    await expect(page).toHaveURL(/festival=1001/);
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByText(row.title)).toBeVisible({ timeout: 30_000 });
  });

  test('30-day chip replaces this month and matches the card count', async ({ page }) => {
    await page.getByRole('button', { name: /^서울\s+\d+$/ }).click();
    await expect(page.getByRole('button', { name: /지역 대분류/ })).toContainText('서울');
    await openTimeRow(page);
    await expect(page.locator('[data-period-id="thisMonth"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /이번 주말/ })).toBeVisible();
    const windowChip = page.locator('[data-period-id="window30"]');
    await expect(windowChip).toHaveText('한 달 이내');
    await expect(windowChip).not.toContainText('~');
    await expect(windowChip.locator('[data-period-count]')).toHaveCount(0);
    await windowChip.click();
    await expect(windowChip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /지역 대분류/ })).toContainText('서울');
    await expect(listCards(page)).toHaveCount(3);
    await expect(page.locator('[data-festival-list-heading] h2')).toHaveText(
      '서울특별시 · 한 달 이내',
    );
    await expect(page.locator('[data-festival-list-meta]')).toHaveText(
      /서울특별시\s*·\s*11\.14까지\s*·\s*3/,
    );
    await expect(page.locator('[data-period-id="date"] [data-period-count]')).toHaveCount(0);
    await expect(listCards(page).filter({ hasText: '서울 경계 축제' })).toHaveCount(1);
  });

  test('date sheet weekend range, empty period, and search skip the period', async ({ page }) => {
    await openTimeRow(page);
    await expect(page.locator('[data-period-id="date"] [data-period-count]')).toHaveCount(0);
    await page.locator('[data-period-id="date"]').click();
    const sheet = page.locator('[data-festival-date-sheet]');
    await expect(sheet).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'GATEO 약관 및 출처' }),
    ).toHaveCount(0);
    const applyBtn = sheet.getByRole('button', { name: '이 기간 보기' });
    const applyBox = await applyBtn.boundingBox();
    const viewport = page.viewportSize();
    expect(applyBox).toBeTruthy();
    expect(applyBox.y + applyBox.height).toBeLessThanOrEqual(viewport.height + 1);
    await sheet.locator('[data-ymd="20261024"]').click();
    await sheet.locator('[data-ymd="20261025"]').click();
    await sheet.getByRole('button', { name: '이 기간 보기' }).click();
    const dateChip = page.locator('[data-period-id="date"]');
    await expect(dateChip).toHaveAttribute('aria-pressed', 'true');
    await expect(dateChip).toContainText('10.24\u201310.25');
    await expect(page.locator('[data-festival-list-heading] h2')).toHaveText(
      '전국 · 10.24\u201310.25',
    );
    await expect(page.getByRole('button', { name: /시간 대분류/ })).toContainText(
      '10.24\u201310.25',
    );
    const count = await periodCount(page, 'date');
    await expect(listCards(page)).toHaveCount(count);
    expect(count).toBeGreaterThan(0);
    await expect(listCards(page).filter({ hasText: '강릉 주말 축제' })).toHaveCount(1);
    const window30Chip = page.locator('[data-period-id="window30"]');
    await expectPeriodChipPainted(page, 'date', 'window30');
    await expect(window30Chip).toHaveAttribute('aria-pressed', 'false');

    await dateChip.click();
    await sheet.locator('[data-ymd="20270501"]').click();
    await sheet.getByRole('button', { name: '이 기간 보기' }).click();
    await expect(page.getByText('이 기간에는 축제가 없어요')).toBeVisible();
    await page.getByRole('button', { name: '기간 풀기' }).click();
    await expect(page.locator('[data-period-id="now"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('이 기간에는 축제가 없어요')).toHaveCount(0);

    await page.getByRole('button', { name: '축제 검색' }).click();
    await page.locator('#korea-festival-search').fill('제주 먼');
    await expect(page.getByRole('heading', { name: '검색은 전체 기간' })).toBeVisible();
    await expect(listCards(page)).toContainText('제주 먼 축제');
  });

  test('custom range after 30-day chip highlights date chip not window30', async ({
    page,
  }) => {
    await openTimeRow(page);
    const window30Chip = page.locator('[data-period-id="window30"]');
    await window30Chip.click();
    await expect(window30Chip).toHaveAttribute('aria-pressed', 'true');
    await expect(window30Chip).toHaveClass(/bg-amber-700/);
    await page.locator('[data-period-id="date"]').click();
    const sheet = page.locator('[data-festival-date-sheet]');
    await sheet.locator('[data-ymd="20261017"]').click();
    await sheet.locator('[data-ymd="20261018"]').click();
    await sheet.getByRole('button', { name: '이 기간 보기' }).click();
    const dateChip = page.locator('[data-period-id="date"]');
    await expect(dateChip).toHaveAttribute('aria-pressed', 'true');
    await expectPeriodChipPainted(page, 'date', 'window30');
    await expect(dateChip).toContainText('10.17\u201310.18');
    await expect(window30Chip).toHaveAttribute('aria-pressed', 'false');
  });

  test('switching back to 30-day clears custom range label on the date chip', async ({
    page,
  }) => {
    await openTimeRow(page);
    await page.locator('[data-period-id="date"]').click();
    const sheet = page.locator('[data-festival-date-sheet]');
    await sheet.locator('[data-ymd="20261017"]').click();
    await sheet.locator('[data-ymd="20261018"]').click();
    await sheet.getByRole('button', { name: '이 기간 보기' }).click();
    const dateChip = page.locator('[data-period-id="date"]');
    const window30Chip = page.locator('[data-period-id="window30"]');
    await expect(dateChip).toContainText('10.17\u201310.18');
    await window30Chip.click();
    await expectPeriodChipPainted(page, 'window30', 'date');
    await expect(dateChip).not.toContainText('10.17');
    await expect(dateChip).toContainText('날짜');
  });

  test('이번 주말 on Saturday is today through Sunday only', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-17T03:00:00.000Z'));
    await page.reload();
    await dismissLocHint(page);
    await expect(page.locator('main [data-festival-id]').first()).toBeVisible({
      timeout: 30_000,
    });
    await openTimeRow(page);
    const weekendChip = page.locator('[data-period-id="weekend"]');
    await weekendChip.click();
    await expect(weekendChip).toHaveAttribute('aria-pressed', 'true');
    await expect(listCards(page).filter({ hasText: '토요일만 축제' })).toHaveCount(1);
    await expect(listCards(page).filter({ hasText: '서울 경계 축제' })).toHaveCount(0);
  });
});
