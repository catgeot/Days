import { mkdirSync } from 'node:fs';
import { test, expect } from './fixtures.js';

const WITH_PLACE = '3571001';
const NO_PLACE = '3571002';
const WITH_TITLE = 'E2E 서울 도시 축제';
const NO_TITLE = 'E2E 장소 없는 축제';
const SHOT_DIR = '/opt/cursor/artifacts/festival-city-place';

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

const rangeStart = new Date();
rangeStart.setDate(rangeStart.getDate() - 2);
const rangeEnd = new Date();
rangeEnd.setDate(rangeEnd.getDate() + 20);
const EVENT_START = ymd(rangeStart);
const EVENT_END = ymd(rangeEnd);
const OVERVIEW = '서울에서 이어지는 축제 본문입니다. '.repeat(80);

const WITH_ITEM = {
  contentId: WITH_PLACE,
  title: WITH_TITLE,
  addr1: '서울특별시 종로구',
  eventStartDate: EVENT_START,
  eventEndDate: EVENT_END,
  mapx: '126.978',
  mapy: '37.566',
};

const NO_ITEM = {
  contentId: NO_PLACE,
  title: NO_TITLE,
  eventStartDate: EVENT_START,
  eventEndDate: EVENT_END,
};

function detailBody(item) {
  return {
    ok: true,
    contentId: item.contentId,
    intro: {
      contentid: item.contentId,
      title: item.title,
      eventstartdate: EVENT_START,
      eventenddate: EVENT_END,
    },
    common: {
      contentid: item.contentId,
      title: item.title,
      addr1: item.addr1 || '',
      overview: item === WITH_ITEM ? OVERVIEW : '짧은 개요',
    },
  };
}

async function installMocks(context, gemini) {
  await context.addInitScript(() => {
    for (const store of [sessionStorage, localStorage]) {
      store.removeItem('gateo:korea-festivals:v2:rolling12:ko');
      store.removeItem('gateo:korea-festivals:v2:rolling12:en');
    }
  });

  await context.route(/supabase\.co/, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.includes('/functions/v1/gemini-proxy')) {
      gemini.count += 1;
      return route.abort();
    }
    if (path.includes('/functions/v1/tourapi-proxy')) {
      let action = '';
      let contentId = '';
      try {
        const body = route.request().postDataJSON() || {};
        action = String(body.action || '');
        contentId = String(body.contentId || '');
      } catch {
        action = '';
      }
      if (action === 'festivalWindow') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, items: [WITH_ITEM, NO_ITEM] }),
        });
      }
      if (action === 'festivalDetail') {
        const item = contentId === NO_PLACE ? NO_ITEM : WITH_ITEM;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(detailBody(item)),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [] }),
      });
    }
    if (path.includes('/auth/v1')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: null }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await context.route(/https?:\/\/(?:[^/]+\.)?(?:mapbox\.com|unsplash\.com|googleapis\.com|visitkorea\.or\.kr)\//i, (route) => {
    const type = route.request().resourceType();
    if (type === 'image') {
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          'base64',
        ),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

async function measurePrimaryScroller(dialog) {
  return dialog.evaluate((el) => {
    const md = window.matchMedia('(min-width: 768px)').matches;
    const contentCol = el.querySelector('[data-festival-sheet-content]');
    const primary = md && contentCol instanceof HTMLElement ? contentCol : el;
    return {
      scrollTop: primary.scrollTop,
      maxScrollTop: Math.max(0, primary.scrollHeight - primary.clientHeight),
    };
  });
}

async function scrollPrimaryToBottom(dialog) {
  await dialog.evaluate((el) => {
    const md = window.matchMedia('(min-width: 768px)').matches;
    const contentCol = el.querySelector('[data-festival-sheet-content]');
    const primary = md && contentCol instanceof HTMLElement ? contentCol : el;
    const target = Math.max(0, primary.scrollHeight - primary.clientHeight);
    primary.scrollTop = target;
  });
}

test.describe('festival detail city place link', () => {
  test.beforeEach(async ({ context }) => {
    const gemini = { count: 0 };
    context._gemini = gemini;
    await installMocks(context, gemini);
  });

  test.afterEach(async ({ context }) => {
    expect(context._gemini.count).toBe(0);
  });

  test('city place link opens /place and browser back restores the sheet scroll', async ({ page }, testInfo) => {
    await page.goto(`/korea/?festival=${WITH_PLACE}`, { waitUntil: 'domcontentloaded' });
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('#korea-festival-sheet-title')).toContainText(WITH_TITLE, {
      timeout: 30_000,
    });
    const link = dialog.locator('a[data-festival-city-place]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText('이 도시 여행지 보기');
    await expect(link).toHaveAttribute('href', '/place/jongno');
    await expect(dialog.getByText('서울에서 이어지는 축제 본문입니다.').first()).toBeVisible({
      timeout: 30_000,
    });

    const width = page.viewportSize()?.width;
    const shotName = width === 1280 ? 'chromium-1280' : 'chromium-390';
    const capture = /chromium/i.test(testInfo.project.name) && (width === 390 || width === 1280);
    if (capture) {
      mkdirSync(SHOT_DIR, { recursive: true });
      await link.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${SHOT_DIR}/${shotName}-festival-link.png`,
        clip: { x: 0, y: 0, width, height: page.viewportSize().height },
      });
    }

    let before = 0;
    await expect.poll(async () => {
      await scrollPrimaryToBottom(dialog);
      const top = (await measurePrimaryScroller(dialog)).scrollTop;
      const stable = top > 80 && top === before;
      before = top;
      return stable;
    }, { timeout: 8_000 }).toBe(true);

    await link.click();
    await expect(page).toHaveURL(/\/place\/jongno(?:\?|$)/, { timeout: 30_000 });
    await expect(page.locator('[data-place-chrome-hit]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /^(뒤로가기|Back)$/ })).toBeVisible();
    if (capture) {
      await page.screenshot({
        path: `${SHOT_DIR}/${shotName}-place.png`,
        clip: { x: 0, y: 0, width, height: page.viewportSize().height },
      });
    }

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`festival=${WITH_PLACE}`), { timeout: 30_000 });
    await expect(page.locator('#korea-festival-sheet-title')).toContainText(WITH_TITLE, {
      timeout: 30_000,
    });
    await expect.poll(async () => {
      const top = (await measurePrimaryScroller(page.getByRole('dialog'))).scrollTop;
      return Math.abs(top - before);
    }, { timeout: 8_000 }).toBeLessThanOrEqual(48);
  });

  test('a festival with no city place does not render the line', async ({ page }) => {
    await page.goto(`/korea/?festival=${NO_PLACE}`, { waitUntil: 'domcontentloaded' });
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('#korea-festival-sheet-title')).toContainText(NO_TITLE, {
      timeout: 30_000,
    });
    await expect(dialog.getByText('짧은 개요')).toBeVisible({ timeout: 30_000 });
    await expect(dialog.locator('a[data-festival-city-place]')).toHaveCount(0);
    await expect(dialog.getByText('이 도시 여행지 보기')).toHaveCount(0);
    const internalPlaceLinks = await dialog.locator('a[href^="/place/"]').count();
    expect(internalPlaceLinks).toBe(0);
  });
});
