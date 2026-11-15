// 탐색 컬렉션 카드 — 짧은 탭·로딩 중 재렌더·Enter가 /place로 가야 한다.
import { test, expect } from './fixtures.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const PLACE = /\/place\/rome(?:\/|$|\?)/;

function attachPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(String(err?.message || err));
  });
  return errors;
}

function expectErrorsClean(errors) {
  const removeChild = errors.filter((message) => /removeChild/i.test(message));
  expect(removeChild, removeChild.join('\n')).toEqual([]);
  const fatal = errors.filter(
    (message) => !/access control checks|Fetch API cannot load|Load failed|cancelled|The operation was aborted/i.test(message),
  );
  expect(fatal, fatal.join('\n')).toEqual([]);
}

async function installDelayedExploreRoutes(context) {
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

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  await context.route(/api\.unsplash\.com|images\.unsplash\.com/, async (route) => {
    await delay(2500);
    const type = route.request().resourceType();
    if (type === 'image') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"results":[]}',
    });
  });

  await context.route(/api\.mapbox\.com\/(?:geocoding|search)\//, async (route) => {
    await delay(2500);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"features":[],"suggestions":[]}',
    });
  });
}

async function centerCoveredByPopover(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return true;
  const pop = page.locator('[data-search-popover]');
  if ((await pop.count()) === 0) return false;
  const popBox = await pop.boundingBox();
  if (!popBox) return false;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  return x >= popBox.x && x <= popBox.x + popBox.width && y >= popBox.y && y <= popBox.y + popBox.height;
}

async function openRomeCollectionCard(page) {
  await page.goto('/explore?lang=ko', { waitUntil: 'domcontentloaded' });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible({ timeout: 90_000 });
  await input.fill('로마');
  const card = page.locator('[data-explore-spot-slug="rome"]');
  await expect(card).toBeVisible({ timeout: 30_000 });
  const heading = card.locator('h3', { hasText: '로마' }).first();
  await expect(heading).toBeVisible();
  if (await centerCoveredByPopover(page, heading)) {
    await input.click();
    await expect(page.locator('[data-search-popover]')).toHaveCount(0);
  }
  return { input, card, heading };
}

test.describe('explore collection card → /place', () => {
  test.beforeEach(async ({ context }) => {
    await installDelayedExploreRoutes(context);
  });

  test('지연 네트워크에서 목록이 다시 그려지는 중 탭하면 /place/rome', async ({ page }) => {
    const errors = attachPageErrors(page);
    const { card, heading } = await openRomeCollectionCard(page);
    const box = await heading.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.evaluate(() => {
      const el = document.querySelector('input[placeholder]');
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      proto.set.call(el, 'zzz없는곳');
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    });
    await expect(card).toHaveCount(0);
    await page.mouse.up();
    await expect(page).toHaveURL(PLACE, { timeout: 45_000 });
    expectErrorsClean(errors);
  });

  test('결과 카드가 보이자마자 짧은 탭이면 /place/rome', async ({ page }) => {
    const errors = attachPageErrors(page);
    const { heading } = await openRomeCollectionCard(page);
    await heading.click({ delay: 0 });
    await expect(page).toHaveURL(PLACE, { timeout: 45_000 });
    const back = page.locator('[data-place-chrome-hit]').getByRole('button', { name: /^(뒤로가기|Back)$/i });
    await expect(back).toBeVisible({ timeout: 60_000 });
    await back.click();
    await expect(page).toHaveURL(/\/explore/, { timeout: 45_000 });
    await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
    expectErrorsClean(errors);
  });

  test('결과 카드에서 Enter면 /place/rome', async ({ page }) => {
    const errors = attachPageErrors(page);
    const { card } = await openRomeCollectionCard(page);
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(PLACE, { timeout: 45_000 });
    expectErrorsClean(errors);
  });
});

const MOUSE_DRAG_PROJECTS = ['chromium-explore-card-tap-1280', 'webkit-explore-card-tap-390'];
const TOUCH_DRAG_PROJECT = 'chromium-explore-card-tap-390-touch';

function skipUnless(testInfo, names) {
  test.skip(!names.includes(testInfo.project.name), names.join(' · '));
}

async function dragCardHorizontally(page, card, dx) {
  const box = await card.boundingBox();
  expect(box).toBeTruthy();
  const x = box.x + Math.min(28, box.width * 0.2);
  const y = box.y + box.height * 0.72;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: Math.max(8, Math.ceil(Math.abs(dx) / 8)) });
  await page.mouse.up();
}

async function slowTouchDrag12(page, card) {
  const box = await card.boundingBox();
  expect(box).toBeTruthy();
  const x = box.x + Math.min(28, box.width * 0.2);
  const y = box.y + box.height * 0.72;
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 0 }],
  });
  for (let i = 1; i <= 6; i += 1) {
    await page.waitForTimeout(70);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + i * 2, y, id: 0 }],
    });
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await client.detach();
}

async function expectDragStaysOnExplore(page, gesture) {
  const docs = [];
  const onRequest = (req) => {
    if (req.resourceType() === 'document') docs.push(req.url());
  };
  page.on('request', onRequest);
  await gesture();
  await page.waitForTimeout(800);
  page.off('request', onRequest);
  expect(docs, docs.join('\n')).toEqual([]);
  await expect(page).toHaveURL(/\/explore/);
  await expect(page).not.toHaveURL(/\/place\//);
}

test.describe('explore collection card drag does not open /place', () => {
  test.beforeEach(async ({ context }) => {
    await installDelayedExploreRoutes(context);
  });

  test('마우스 18px 드래그 뒤에는 /explore에 머무름', async ({ page }, testInfo) => {
    skipUnless(testInfo, MOUSE_DRAG_PROJECTS);
    const errors = attachPageErrors(page);
    const { card } = await openRomeCollectionCard(page);
    await expectDragStaysOnExplore(page, () => dragCardHorizontally(page, card, 18));
    expectErrorsClean(errors);
  });

  test('마우스 220px 드래그 뒤에는 /explore에 머무름', async ({ page }, testInfo) => {
    skipUnless(testInfo, MOUSE_DRAG_PROJECTS);
    const errors = attachPageErrors(page);
    const { card } = await openRomeCollectionCard(page);
    await expectDragStaysOnExplore(page, () => dragCardHorizontally(page, card, 220));
    expectErrorsClean(errors);
  });

  test('36px 가로 이동 뒤에는 /explore에 머무름', async ({ page }, testInfo) => {
    skipUnless(testInfo, MOUSE_DRAG_PROJECTS);
    const errors = attachPageErrors(page);
    const { card } = await openRomeCollectionCard(page);
    await expectDragStaysOnExplore(page, () => dragCardHorizontally(page, card, 36));
    expectErrorsClean(errors);
  });

  test('느린 12px 터치 뒤에는 /explore에 머무름', async ({ page }, testInfo) => {
    skipUnless(testInfo, [TOUCH_DRAG_PROJECT]);
    const errors = attachPageErrors(page);
    const { card } = await openRomeCollectionCard(page);
    await expectDragStaysOnExplore(page, () => slowTouchDrag12(page, card));
    expectErrorsClean(errors);
  });
});
