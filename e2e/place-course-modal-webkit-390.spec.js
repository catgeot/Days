/**
 * /place → 명승 본문「인근 여행코스」→ CourseDetailModal — WebKit 390 mock.
 */
import { mkdirSync } from 'node:fs';
import { test, expect } from './fixtures.js';
import { PNG_1X1 } from './festival-back-overview-fixture.js';

const SPOT_ID = 'gyeongbokgung';
const PLACE_SLUG = 'gyeongbokgung-palace';
const COURSE_ID = '2666401';
const COURSE_TITLE = 'E2E 경복궁 인근 코스';
const SPOT_CONTENT_ID = '126508';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
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
    if (contentId === SPOT_CONTENT_ID && action === 'detailCommon') {
      payload = {
        ok: true,
        items: [
          {
            contentId: SPOT_CONTENT_ID,
            title: '경복궁',
            overview: `E2E 명승 개요 ${'가'.repeat(400)}`,
            addr1: '서울특별시 종로구 사직로 161',
            mapx: '126.9770000000',
            mapy: '37.5796000000',
          },
        ],
      };
    } else if (contentId === SPOT_CONTENT_ID && action === 'detailImage') {
      payload = { ok: true, items: [] };
    } else if (contentId === SPOT_CONTENT_ID && (action === 'detailIntro' || action === 'detailInfo')) {
      payload = { ok: true, items: [] };
    } else if (action === 'areaBasedList' && contentTypeId === '25') {
      payload = {
        ok: true,
        items: [
          {
            contentId: COURSE_ID,
            title: COURSE_TITLE,
            addr1: '서울특별시 종로구',
            mapx: '126.9770000000',
            mapy: '37.5796000000',
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
        items: [{ contentId: COURSE_ID, theme: '도보', distance: '5km', taketime: '2h' }],
      };
    } else if (contentId === COURSE_ID && action === 'detailInfo') {
      payload = {
        ok: true,
        items: [
          { subnum: 1, subname: '광화문', subdetailoverview: '광화문 광장 '.repeat(30) },
          { subnum: 2, subname: '근정전', subdetailoverview: '근정전 안뜰 '.repeat(30) },
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

async function scenicDialog(page) {
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.locator('#korea-theme-spot-modal-title') });
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog.first();
}

async function scrollMetrics(page, scenicDialog) {
  return page.evaluate((dialog) => {
    const winY = window.scrollY || document.documentElement?.scrollTop || 0;
    const scrollEl = dialog.querySelector('[data-theme-spot-modal-scroll]') || dialog;
    const sheet =
      scrollEl instanceof HTMLElement ? scrollEl.scrollTop : 0;
    return { winY, sheet };
  }, await scenicDialog.elementHandle());
}

test.describe('Place scenic course detail modal @390 WebKit mock', () => {
  test.setTimeout(300_000);

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

  test('from /place: modal scroll, background winY, chrome under overlay', async ({ page }, testInfo) => {
    await page.goto(`/place/${PLACE_SLUG}?lang=ko`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await dismissLocHint(page);
    await expect(page.getByText(/경복궁|Gyeongbokgung/i).first()).toBeVisible({ timeout: 90_000 });

    const scenicLink = page.getByRole('link', { name: /명소 본문|상세 해설/i }).first();
    await expect(scenicLink).toBeVisible({ timeout: 60_000 });
    await scenicLink.click();

    await page.waitForURL(/\/korea\/theme\/scenic/, { timeout: 120_000 });
    await dismissLocHint(page);

    if (!(await page.locator('#korea-theme-spot-modal-title').isVisible().catch(() => false))) {
      await page.goto(
        `/korea/theme/scenic?spot=${SPOT_ID}&returnTo=${encodeURIComponent(`/place/${PLACE_SLUG}?lang=ko`)}&lang=ko`,
        { waitUntil: 'domcontentloaded', timeout: 120_000 },
      );
      await dismissLocHint(page);
    }
    await expect(page.locator('#korea-theme-spot-modal-title')).toBeVisible({
      timeout: 120_000,
    });

    const spotDialog = await scenicDialog(page);
    await expect(page.getByText('인근 여행코스').first()).toBeVisible({
      timeout: 120_000,
    });
    const coursesSection = spotDialog.locator('[data-theme-spot-section="nearCourses"]');
    await expect(coursesSection).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(async () => coursesSection.getByRole('button').count(), { timeout: 60_000 })
      .toBeGreaterThan(0);
    await coursesSection.scrollIntoViewIfNeeded();

    const beforeOpenWinY = (await scrollMetrics(page, spotDialog)).winY;
    await coursesSection.getByRole('button', { name: COURSE_TITLE }).click();

    const courseModal = page.locator('[data-korea-course-modal]');
    await expect(courseModal).toBeVisible({ timeout: 30_000 });
    const beforeScroll = await scrollMetrics(page, spotDialog);

    const scrollPane = courseModal.locator('[data-korea-course-modal-scroll]');
    const scrollBefore = await scrollPane.evaluate((el) => el.scrollTop);
    await scrollPane.evaluate((el) => {
      el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + 360);
    });
    await expect
      .poll(async () => scrollPane.evaluate((el) => el.scrollTop), { timeout: 5_000 })
      .toBeGreaterThan(scrollBefore);

    const afterScroll = await scrollMetrics(page, spotDialog);
    expect(afterScroll.winY).toBe(beforeOpenWinY);
    expect(afterScroll.sheet).toBe(beforeScroll.sheet);

    const modalHit = await page.evaluate(() => {
      const modal = document.querySelector('[data-korea-course-modal]');
      if (!modal) return false;
      const rect = modal.getBoundingClientRect();
      const centerEl = document.elementFromPoint(
        rect.left + rect.width * 0.5,
        rect.top + rect.height * 0.45,
      );
      return modal.contains(centerEl);
    });
    expect(modalHit).toBe(true);

    const scenicScrollUp = page.getByRole('button', { name: /맨 위로/i }).first();
    await expect(scenicScrollUp).toHaveCSS('pointer-events', 'none');
    await expect(scenicScrollUp).toHaveCSS('opacity', '0');

    await courseModal.getByRole('button', { name: /맨 위로|위로/i }).first().click();
    await expect
      .poll(async () => scrollPane.evaluate((el) => el.scrollTop), { timeout: 5_000 })
      .toBeLessThanOrEqual(24);

    if (testInfo.retry === 0) {
      await page.screenshot({
        path: '/opt/cursor/artifacts/place-course-modal-open-390.png',
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