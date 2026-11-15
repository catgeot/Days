// 검색 팝오버를 바깥 탭으로 닫은 직후 컬렉션 카드를 탭하면 /place 한 번만 연다.
// WebKit은 이동 중 끊긴 dynamic import를 vite:preloadError로 보고, 그 reload가 /explore를 다시 연다.
import { test, expect } from './fixtures.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const CARD = '[data-explore-spot-slug="rome"]';
const PLACE = /\/place\/rome(?:\/|$|\?)/;
const LOOPS = 20;
const holds = new WeakMap();

function attachPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(String(err?.message || err));
  });
  return errors;
}

function expectErrorsClean(errors) {
  const fatal = errors.filter(
    (message) => !/access control checks|Fetch API cannot load|Load failed|cancelled|The operation was aborted|Importing a module script failed|Failed to fetch dynamically imported module/i.test(message),
  );
  expect(fatal, fatal.join('\n')).toEqual([]);
}

async function installExploreMocks(context, hold) {
  await context.route(/supabase\.co/, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/auth/v1')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: null }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await context.route(/api\.unsplash\.com|images\.unsplash\.com/, (route) => {
    const type = route.request().resourceType();
    if (type === 'image') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"results":[]}' });
  });
  await context.route(/api\.mapbox\.com/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"features":[],"suggestions":[],"results":[]}',
    }),
  );
  await context.route(/\/assets\/.+\.js(?:\?|$)/, async (route) => {
    const frameUrl = route.request().frame()?.url() || '';
    if (!hold.on || !frameUrl.includes('/explore')) return route.continue();
    hold.count += 1;
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 12000);
      const check = setInterval(() => {
        if (!hold.on) {
          clearInterval(check);
          clearTimeout(timer);
          resolve();
        }
      }, 40);
    });
    await route.abort().catch(() => {});
  });
}

async function openExploreReady(page) {
  await page.goto('/explore?lang=ko', { waitUntil: 'domcontentloaded' });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible({ timeout: 90_000 });
  return input;
}

async function showRomeCard(page, input) {
  // WebKit이 바쁠 때 fill 한 번이 검색어를 '로마로마'로 넣는다. 카드 탭의 전제는 검색어 로마다.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await input.fill('로마');
    if ((await input.inputValue()) === '로마') break;
  }
  await expect(input).toHaveValue('로마');
  const card = page.locator(CARD).first();
  await expect(card).toBeVisible({ timeout: 30_000 });
  return card;
}

async function outsideTapPoint(page) {
  return page.evaluate(() => {
    const input = [...document.querySelectorAll('input[placeholder]')].find(
      (el) => el.getBoundingClientRect().width > 0,
    );
    const rect = input.getBoundingClientRect();
    return [rect.x + rect.width * 0.72, Math.max(10, rect.y - 18)];
  });
}

async function cardTapPoint(page) {
  return page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    let rect = el.getBoundingClientRect();
    const inView = rect.top >= 0 && rect.bottom <= window.innerHeight && rect.height > 0;
    if (!inView) el.scrollIntoView({ block: 'center' });
    rect = el.getBoundingClientRect();
    return [rect.x + rect.width / 2, rect.y + rect.height / 2];
  }, CARD);
}

test.describe('explore outside tap then card', () => {
  test.beforeEach(async ({ context }) => {
    const hold = { on: false, count: 0 };
    holds.set(context, hold);
    await installExploreMocks(context, hold);
  });

  test('바깥 탭 직후 카드 탭은 /place 문서 1번이고 /explore를 다시 로드하지 않는다', async ({ page, context }) => {
    test.setTimeout(300_000);
    const errors = attachPageErrors(page);
    const hold = holds.get(context);
    const docs = [];
    page.on('request', (request) => {
      if (request.resourceType() !== 'document' || !request.isNavigationRequest()) return;
      docs.push(request.url());
    });

    for (let i = 0; i < LOOPS; i += 1) {
      hold.on = false;
      const input = await openExploreReady(page);
      await showRomeCard(page, input);
      await expect(page.locator('[data-search-popover]')).toBeVisible();
      hold.on = true;
      const heldBefore = hold.count;
      await page.evaluate(() => {
        window.__heldImport = import(`/assets/hold-probe-${Date.now()}.js`);
      });
      await expect.poll(() => hold.count, { timeout: 5_000 }).toBeGreaterThan(heldBefore);
      // 바깥 탭과 카드 탭 사이 wall clock은 tap·evaluate·scrollIntoView를 포함한다.
      // CI WebKit은 그 합이 685ms라 600ms에서 장소 이동 검사 전에 끊겼다. 레이스는 hold가 청크를 붙잡고 있는 동안의 탭이다.
      const outside = await outsideTapPoint(page);
      await page.touchscreen.tap(outside[0], outside[1]);
      const closed = await page.evaluate(() => !document.querySelector('[data-search-popover]'));
      expect(closed, `iteration ${i} popover stayed open`).toBe(true);
      const cardAt = await cardTapPoint(page);
      const mark = docs.length;
      await page.touchscreen.tap(cardAt[0], cardAt[1]);
      await expect(page).toHaveURL(PLACE, { timeout: 20_000 });
      await page.waitForTimeout(700);
      const after = docs.slice(mark).map((url) => new URL(url).pathname + new URL(url).search);
      const placeDocs = after.filter((url) => url.startsWith('/place/'));
      const exploreDocs = after.filter((url) => url.startsWith('/explore'));
      expect(placeDocs, `iteration ${i} docs ${after.join(' | ')}`).toHaveLength(1);
      expect(exploreDocs, `iteration ${i} extra explore ${exploreDocs.join(' | ')}`).toEqual([]);
    }
    expect(hold.count).toBeGreaterThan(0);
    expectErrorsClean(errors);
  });

  test('장소 ← 로 돌아오면 팝오버는 닫혀 있고 스크롤이 남는다', async ({ page, context }) => {
    const errors = attachPageErrors(page);
    const hold = holds.get(context);
    hold.on = false;
    const input = await openExploreReady(page);
    await showRomeCard(page, input);
    await page.setViewportSize({ width: 390, height: 520 });
    await page.touchscreen.tap(...(await outsideTapPoint(page)));
    await expect(page.locator('[data-search-popover]')).toHaveCount(0);
    const placed = await page.evaluate((sel) => {
      const el = document.querySelector('.modal-scroll-area');
      const room = el.scrollHeight - el.clientHeight;
      el.scrollTop = Math.min(160, room);
      const card = document.querySelector(sel);
      const rect = card.getBoundingClientRect();
      return {
        top: el.scrollTop,
        room,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
    }, CARD);
    expect(placed.room).toBeGreaterThan(40);
    expect(placed.top).toBeGreaterThan(40);
    const scrolled = placed.top;
    await page.touchscreen.tap(placed.x, placed.y);
    await expect(page).toHaveURL(PLACE, { timeout: 30_000 });
    const back = page.locator('[data-place-chrome-hit]').getByRole('button', { name: /^(뒤로가기|Back)$/i });
    await expect(back).toBeVisible({ timeout: 60_000 });
    await back.click();
    await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
    await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
    await expect(page.locator('[data-search-popover]')).toHaveCount(0);
    await expect(page.locator('input[placeholder]:visible').first()).toHaveValue('로마');
    await expect(page.locator(CARD).first()).toBeVisible();
    await expect.poll(async () => page.evaluate(() => document.querySelector('.modal-scroll-area')?.scrollTop ?? 0), {
      timeout: 5_000,
    }).toBeGreaterThan(40);
    const restored = await page.evaluate(() => document.querySelector('.modal-scroll-area')?.scrollTop ?? 0);
    expect(Math.abs(restored - scrolled)).toBeLessThan(48);
    expectErrorsClean(errors);
  });

  test('취소된 beforeunload 뒤 창이 지나면 청크 오류는 다시 새로고침한다', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium beforeunload probe');
    test.setTimeout(45_000);
    const hold = holds.get(context);
    hold.on = false;
    const input = await openExploreReady(page);
    await page.evaluate(() => {
      window.__leaveProbe = 'alive';
      window.__blockLeave = true;
      window.addEventListener('beforeunload', (event) => {
        if (!window.__blockLeave) return;
        event.preventDefault();
        event.returnValue = '';
      });
    });
    page.on('dialog', (dialog) => dialog.dismiss());
    await input.click();
    const armedAt = Date.now();
    await page.evaluate(() => {
      window.location.assign('/place/rome');
    });
    await expect.poll(() => page.url(), { timeout: 5_000 }).toContain('/explore');
    expect(await page.evaluate(() => window.__leaveProbe)).toBe('alive');

    await page.evaluate(() => window.dispatchEvent(new Event('vite:preloadError')));
    await page.waitForTimeout(400);
    expect(page.url()).toContain('/explore');
    expect(await page.evaluate(() => window.__leaveProbe)).toBe('alive');

    const remain = 2_000 - (Date.now() - armedAt) + 300;
    await page.waitForTimeout(Math.max(remain, 300));
    await page.evaluate(() => {
      window.__blockLeave = false;
    });
    const reloaded = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.evaluate(() => window.dispatchEvent(new Event('vite:preloadError'))).catch(() => {});
    await reloaded;
    await expect(page).toHaveURL(/\/explore/);
    expect(await page.evaluate(() => window.__leaveProbe)).toBeUndefined();
  });

  test('브라우저 뒤로가기도 팝오버를 다시 열지 않는다', async ({ page, context }) => {
    const errors = attachPageErrors(page);
    holds.get(context).on = false;
    const input = await openExploreReady(page);
    await showRomeCard(page, input);
    await page.touchscreen.tap(...(await outsideTapPoint(page)));
    await expect(page.locator('[data-search-popover]')).toHaveCount(0);
    await page.touchscreen.tap(...(await cardTapPoint(page)));
    await expect(page).toHaveURL(PLACE, { timeout: 30_000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
    await expect(page.locator('[data-search-popover]')).toHaveCount(0);
    await expect(page.locator(CARD).first()).toBeVisible();
    expectErrorsClean(errors);
  });
});
