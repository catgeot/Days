/**
 * 축제 상세「인근 여행코스」→ CourseDetailModal — WebKit 390 mock.
 */
import { mkdirSync } from 'node:fs';
import { test, expect } from './fixtures.js';
import { PNG_1X1 } from './festival-back-overview-fixture.js';
import { buildFestivalDetailFixture, E2E_FESTIVAL_ID } from './mooni-festival-tourapi-fixture.js';

const COURSE_ID = '2666401';
const COURSE_TITLE = 'E2E 춘천 의암 코스';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

const FESTIVAL_LIST_ROW = {
  contentId: E2E_FESTIVAL_ID,
  title: '제76주년 K-밀리터리 페스티벌：춘천대첩',
  eventStartDate: '20261009',
  eventEndDate: '20261011',
  addr1: '강원특별자치도 춘천시',
  mapx: '127.7003000000',
  mapy: '37.8726000000',
  firstimage: 'https://example.test/fest.png',
};

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  if (!(await close.isVisible().catch(() => false))) return;
  await close.click({ timeout: 3_000, force: true }).catch(() => {});
}

async function installTourapiMock(context) {
  await context.route(/tourapi-proxy/i, async (route) => {
    const method = route.request().method();
    if (method !== 'POST') {
      await route.fulfill({ status: 200, headers: CORS, body: '' });
      return;
    }
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const action = String(body.action || '');
    const contentTypeId = String(body.contentTypeId || '').trim();
    const contentId = String(body.contentId || body.contentid || '').trim();

    let payload = { ok: true, items: [], rawCount: 0, fromCache: true };
    if (action === 'festivalWindow') {
      payload = { ok: true, items: [FESTIVAL_LIST_ROW], rawCount: 1, fromCache: true };
    } else if (action === 'festivalDetail') {
      payload = buildFestivalDetailFixture(contentId || E2E_FESTIVAL_ID);
    } else if (action === 'areaBasedList' && contentTypeId === '25') {
      payload = {
        ok: true,
        items: [
          {
            contentId: COURSE_ID,
            title: COURSE_TITLE,
            addr1: '강원특별자치도 춘천시',
            mapx: '127.7003000000',
            mapy: '37.8726000000',
            firstimage: 'https://example.test/course.png',
          },
        ],
        rawCount: 1,
        fromCache: true,
      };
    } else if (contentId === COURSE_ID && action === 'detailCommon') {
      payload = {
        ok: true,
        items: [
          {
            contentId: COURSE_ID,
            title: COURSE_TITLE,
            overview: `E2E 코스 개요 ${'가'.repeat(800)}`,
          },
        ],
      };
    } else if (contentId === COURSE_ID && action === 'detailIntro') {
      payload = {
        ok: true,
        items: [{ contentId: COURSE_ID, theme: '자연', distance: '12km', taketime: '4h' }],
      };
    } else if (contentId === COURSE_ID && action === 'detailInfo') {
      payload = {
        ok: true,
        items: [
          { subnum: 1, subname: '의암호', subdetailoverview: '의암호 산책 '.repeat(40) },
          { subnum: 2, subname: '소양강', subdetailoverview: '소양강 둔치 '.repeat(40) },
        ],
      };
    } else if (contentId === COURSE_ID && action === 'detailImage') {
      payload = { ok: true, items: [] };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify(payload),
    });
  });
}

async function festivalDialog(page) {
  const dialog = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  await expect(dialog.locator('[data-festival-detail-slot]')).toBeVisible({ timeout: 90_000 });
  await expect(dialog.locator('[data-festival-detail-skeleton]')).toHaveCount(0, {
    timeout: 90_000,
  });
  return dialog.first();
}

async function scrollMetrics(page, festivalDialog) {
  return page.evaluate((dialog) => {
    const winY = window.scrollY || document.documentElement?.scrollTop || 0;
    const sheet = dialog instanceof HTMLElement ? dialog.scrollTop : 0;
    return { winY, sheet };
  }, await festivalDialog.elementHandle());
}

test.describe('Festival course detail modal @390 WebKit mock', () => {
  test.setTimeout(240_000);

  test.beforeAll(() => {
    mkdirSync('/opt/cursor/artifacts', { recursive: true });
  });

  test.beforeEach(async ({ context }) => {
    await context.route(/\/functions\/v1\/(gemini-proxy|transport-proxy|fetch-place-videos)/i, async (route) => {
      const path = route.request().url();
      if (path.includes('transport-proxy')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: CORS,
          body: JSON.stringify({ ok: false, status: 'unavailable' }),
        });
        return;
      }
      if (path.includes('fetch-place-videos')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: CORS,
          body: JSON.stringify({ success: true, videos: [] }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({ ok: true, text: '' }),
      });
    });
    await context.route(/example\.test|tong\.visitkorea\.or\.kr/i, async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 });
    });
    await installTourapiMock(context);
  });

  test('modal scroll does not move background; footer buttons work', async ({ page }, testInfo) => {
    await page.goto(`/korea/?festival=${E2E_FESTIVAL_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await dismissLocHint(page);

    const sheet = await festivalDialog(page);
    await sheet.getByRole('tab', { name: /안내|Info/i }).click();

    const coursesSection = sheet.locator('[data-festival-section="nearCourses"]');
    await expect
      .poll(async () => coursesSection.locator('button').count(), { timeout: 90_000 })
      .toBeGreaterThan(0);
    await coursesSection.scrollIntoViewIfNeeded();

    const beforeOpenWinY = (await scrollMetrics(page, sheet)).winY;
    await coursesSection.getByRole('button', { name: COURSE_TITLE }).click();

    const courseModal = page.locator('[data-korea-course-modal]');
    await expect(courseModal).toBeVisible({ timeout: 30_000 });
    const beforeScroll = await scrollMetrics(page, sheet);

    const scrollPane = courseModal.locator('[data-korea-course-modal-scroll]');
    const scrollBefore = await scrollPane.evaluate((el) => el.scrollTop);
    await scrollPane.evaluate((el) => {
      el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + 360);
    });
    await expect
      .poll(async () => scrollPane.evaluate((el) => el.scrollTop), { timeout: 5_000 })
      .toBeGreaterThan(scrollBefore);

    const afterScroll = await scrollMetrics(page, sheet);
    expect(afterScroll.winY).toBe(beforeOpenWinY);
    expect(afterScroll.sheet).toBe(beforeScroll.sheet);

    await courseModal.getByRole('button', { name: /맨 위로|위로/i }).first().click();
    await expect
      .poll(async () => scrollPane.evaluate((el) => el.scrollTop), { timeout: 5_000 })
      .toBeLessThanOrEqual(24);

    if (testInfo.retry === 0) {
      await page.screenshot({
        path: '/opt/cursor/artifacts/festival-course-modal-open-390.png',
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
    }

    await courseModal
      .locator('.border-t')
      .last()
      .getByRole('button', { name: /^닫기$|^Close$/i })
      .click();
    await expect(courseModal).toBeHidden({ timeout: 15_000 });
  });
});