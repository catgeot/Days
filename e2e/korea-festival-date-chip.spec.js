import { test, expect } from '@playwright/test';

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

  test('30-day chip replaces this month and matches the card count', async ({ page }) => {
    await page.getByRole('button', { name: /^서울\s+\d+$/ }).click();
    await expect(page.getByRole('button', { name: /지역 대분류/ })).toContainText('서울');
    await openTimeRow(page);
    await expect(page.getByRole('button', { name: /이번 달/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /이번 주말/ })).toBeVisible();
    const windowChip = page.locator('[data-period-id="window30"]');
    await expect(windowChip).toContainText('30일 안 ~11.14');
    await windowChip.click();
    await expect(windowChip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /지역 대분류/ })).toContainText('서울');
    const count = await periodCount(page, 'window30');
    await expect(listCards(page)).toHaveCount(count);
    expect(count).toBe(2);
    await expect(page.locator('[data-festival-list-heading] h2')).toHaveText(
      '서울특별시 · 30일 안(~11.14)',
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
    await sheet.locator('[data-ymd="20261024"]').click();
    await sheet.locator('[data-ymd="20261025"]').click();
    await sheet.getByRole('button', { name: '이 기간 보기' }).click();
    const dateChip = page.locator('[data-period-id="date"]');
    await expect(dateChip).toHaveAttribute('aria-pressed', 'true');
    await expect(dateChip).toContainText('10.24\u201310.25');
    await expect(page.locator('[data-festival-list-heading] h2')).toHaveText(
      '전국 · 10.24\u201310.25',
    );
    const count = await periodCount(page, 'date');
    await expect(listCards(page)).toHaveCount(count);
    expect(count).toBeGreaterThan(0);
    await expect(listCards(page).filter({ hasText: '강릉 주말 축제' })).toHaveCount(1);

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
});
