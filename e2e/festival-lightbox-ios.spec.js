import zlib from 'node:zlib';
import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';
import { installFestivalBackOverviewFixtures } from './festival-back-overview-fixture.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';

const VIEWPORT = { width: 390, height: 844 };
const OUT = '/opt/cursor/artifacts';
const FESTIVAL_ID = '638576';

function solidPng(width, height, r, g, b) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const idat = zlib.deflateSync(raw);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const BRIGHT_PNG = solidPng(900, 600, 255, 214, 92);

async function shot(page, name) {
  await mkdir(OUT, { recursive: true });
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
}

async function tapCenter(page, locator) {
  const box = await locator.boundingBox();
  expect(box, 'control has a box').toBeTruthy();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const label = await page.evaluate(({ x: px, y: py }) => {
    const el = document.elementFromPoint(px, py);
    const button = el?.closest?.('button');
    return button?.getAttribute('aria-label') || el?.tagName || '';
  }, { x, y });
  await page.touchscreen.tap(x, y);
  return label;
}

async function dispatchTouch(page, { targetSelector, x, y, type, active }) {
  await page.evaluate(({ targetSelector: selector, x: clientX, y: clientY, type: eventType, active: keepActive }) => {
    const target = selector
      ? document.querySelector(selector)
      : document.elementFromPoint(clientX, clientY);
    if (!target) throw new Error('missing touch target');
    const touch = document.createTouch(window, target, 1, clientX, clientY, clientX, clientY);
    const empty = document.createTouchList();
    const list = document.createTouchList(touch);
    const event = document.createEvent('Event');
    event.initEvent(eventType, true, true);
    Object.defineProperties(event, {
      touches: { value: keepActive ? list : empty },
      targetTouches: { value: keepActive ? list : empty },
      changedTouches: { value: list },
    });
    target.dispatchEvent(event);
  }, { targetSelector, x, y, type, active });
}

async function swipeRight(page, locator) {
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();
  const y = box.y + Math.min(box.height / 2, 180);
  const startX = box.x + box.width * 0.28;
  const endX = startX + 140;
  await dispatchTouch(page, {
    targetSelector: '[data-festival-lightbox-swipe]',
    x: startX,
    y,
    type: 'touchstart',
    active: true,
  });
  await dispatchTouch(page, {
    targetSelector: '[data-festival-lightbox-swipe]',
    x: startX + 80,
    y,
    type: 'touchmove',
    active: true,
  });
  await dispatchTouch(page, {
    targetSelector: '[data-festival-lightbox-swipe]',
    x: endX,
    y,
    type: 'touchend',
    active: false,
  });
}

test.describe('festival lightbox iOS touch — WebKit 390', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ context }) => {
    await installFestivalBackOverviewFixtures(context);
    await context.route(/e2e-static\.gateo\.test/i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: BRIGHT_PNG,
      });
    });
  });

  test('taps change the photo, swipe stays on the page, filmstrip does not scroll', async ({ page }) => {
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded' });

    const sheet = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    const scroller = sheet.locator('[data-festival-hero-thumbs-scroller]');
    await expect(scroller).toBeVisible({ timeout: 30_000 });
    await scroller.evaluate((el) => {
      el.scrollLeft = 96;
    });

    await sheet.getByRole('button', { name: /사진 확대보기/ }).click();
    const lightbox = page.getByRole('dialog', { name: '사진 확대보기' });
    await expect(lightbox).toBeVisible();
    const index = lightbox.locator('[data-festival-lightbox-index]');
    await expect(index).toHaveAttribute('data-festival-lightbox-index', '0');
    await expect.poll(async () => lightbox.locator('img').first().evaluate((img) => (
      img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
    ))).toBeGreaterThan(10);
    await shot(page, 'festival-lightbox-ios-after');

    const detailUrl = page.url();
    expect(detailUrl).toContain(`festival=${FESTIVAL_ID}`);

    await expect(scroller).toHaveAttribute('data-festival-hero-thumbs-locked', 'true');
    const lockedScroll = await scroller.evaluate((el) => ({
      left: el.scrollLeft,
      overflowX: getComputedStyle(el).overflowX,
      pointerEvents: getComputedStyle(el).pointerEvents,
    }));
    expect(lockedScroll.overflowX).toBe('hidden');
    expect(lockedScroll.pointerEvents).toBe('none');

    const stripHitIsLightbox = await scroller.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + 24, rect.top + rect.height / 2);
      return Boolean(hit?.closest?.('[data-festival-lightbox]'));
    });
    expect(stripHitIsLightbox).toBe(true);

    const close = lightbox.getByRole('button', { name: '확대보기 닫기' });
    const next = lightbox.getByRole('button', { name: '다음 사진' });
    const prev = lightbox.getByRole('button', { name: '이전 사진' });
    const closeBg = await close.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(closeBg).toBe('rgb(12, 10, 9)');

    expect(await tapCenter(page, next)).toBe('다음 사진');
    await expect(index).toHaveAttribute('data-festival-lightbox-index', '1');
    expect(await tapCenter(page, prev)).toBe('이전 사진');
    await expect(index).toHaveAttribute('data-festival-lightbox-index', '0');

    await swipeRight(page, lightbox);
    await expect(index).not.toHaveAttribute('data-festival-lightbox-index', '0');
    await expect(page).toHaveURL(detailUrl);

    const placed = await lightbox.evaluate((root) => {
      const img = root.querySelector('img');
      const stage = root.querySelector('[data-festival-lightbox-swipe]');
      const prev = root.querySelector('button[aria-label="이전 사진"]');
      const next = root.querySelector('button[aria-label="다음 사진"]');
      const imgBox = img.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      const prevBox = prev.getBoundingClientRect();
      const nextBox = next.getBoundingClientRect();
      const fit = Math.min(imgBox.width / img.naturalWidth, imgBox.height / img.naturalHeight);
      const paintedH = img.naturalHeight * fit;
      const paintedMid = imgBox.top + (imgBox.height - paintedH) / 2 + paintedH / 2;
      const style = getComputedStyle(img);
      return {
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        stageMid: stageBox.top + stageBox.height / 2,
        paintedMid,
        prevMid: prevBox.top + prevBox.height / 2,
        nextMid: nextBox.top + nextBox.height / 2,
        prevW: prevBox.width,
        prevH: prevBox.height,
        nextW: nextBox.width,
        nextH: nextBox.height,
        paintedH,
        stageH: stageBox.height,
      };
    });
    expect(placed.objectFit).toBe('contain');
    expect(placed.objectPosition).toMatch(/center|50%/);
    expect(placed.paintedH).toBeLessThan(placed.stageH - 80);
    expect(Math.abs(placed.paintedMid - placed.stageMid)).toBeLessThan(3);
    expect(Math.abs(placed.prevMid - placed.paintedMid)).toBeLessThan(3);
    expect(Math.abs(placed.nextMid - placed.paintedMid)).toBeLessThan(3);
    expect(placed.prevW).toBeGreaterThanOrEqual(44);
    expect(placed.prevH).toBeGreaterThanOrEqual(44);
    expect(placed.nextW).toBeGreaterThanOrEqual(44);
    expect(placed.nextH).toBeGreaterThanOrEqual(44);

    const stripBox = await scroller.boundingBox();
    expect(stripBox).toBeTruthy();
    const stripY = stripBox.y + stripBox.height / 2;
    const stripStartX = stripBox.x + stripBox.width - 30;
    const stripEndX = stripBox.x + 20;
    await dispatchTouch(page, { x: stripStartX, y: stripY, type: 'touchstart', active: true });
    await dispatchTouch(page, { x: stripEndX, y: stripY, type: 'touchmove', active: true });
    await dispatchTouch(page, { x: stripEndX, y: stripY, type: 'touchend', active: false });
    await scroller.evaluate((el) => {
      el.scrollLeft += 180;
    });
    await expect.poll(async () => scroller.evaluate((el) => el.scrollLeft)).toBe(lockedScroll.left);

    expect(await tapCenter(page, close)).toBe('확대보기 닫기');
    await expect(lightbox).toBeHidden();
    await expect(page).toHaveURL(detailUrl);
    await expect(scroller).toHaveAttribute('data-festival-hero-thumbs-locked', 'false');
  });

  test('back closes the lightbox on 825295 and the next back returns to the list', async ({ page }) => {
    const id = '825295';
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await page.goto(`/korea/?festival=${id}`, { waitUntil: 'domcontentloaded' });

    const sheet = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    await expect(sheet.locator('#korea-festival-sheet-title')).toContainText('강릉커피축제');
    await expect(sheet.locator('[data-festival-hero-thumbs-scroller]')).toBeVisible({ timeout: 30_000 });

    await sheet.getByRole('button', { name: /사진 확대보기/ }).click();
    const lightbox = page.getByRole('dialog', { name: '사진 확대보기' });
    await expect(lightbox).toBeVisible();
    await expect.poll(async () => lightbox.locator('img').first().evaluate((img) => (
      img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
    ))).toBeGreaterThan(10);

    await page.goBack({ waitUntil: 'commit' });
    await expect(lightbox).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`festival=${id}`));
    await expect(sheet).toBeVisible();

    await page.goBack({ waitUntil: 'commit' });
    await expect(page).not.toHaveURL(/[?&]festival=/);
    await expect(sheet).toBeHidden();
  });

  test('X drops the lightbox history step so the next back returns to the list', async ({ page }) => {
    const id = '825295';
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await page.goto(`/korea/?festival=${id}`, { waitUntil: 'domcontentloaded' });

    const sheet = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    await sheet.getByRole('button', { name: /사진 확대보기/ }).click();
    const lightbox = page.getByRole('dialog', { name: '사진 확대보기' });
    await expect(lightbox).toBeVisible();

    await lightbox.getByRole('button', { name: '확대보기 닫기' }).click();
    await expect(lightbox).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`festival=${id}`));

    await page.goBack({ waitUntil: 'commit' });
    await expect(page).not.toHaveURL(/[?&]festival=/);
    await expect(sheet).toBeHidden();
  });

  test('1280 arrows sit outside the centered photo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded' });

    const sheet = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    await sheet.getByRole('button', { name: /사진 확대보기/ }).click();
    const lightbox = page.getByRole('dialog', { name: '사진 확대보기' });
    await expect(lightbox).toBeVisible();
    await expect.poll(async () => lightbox.locator('img').first().evaluate((img) => (
      img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
    ))).toBeGreaterThan(10);

    const edges = await lightbox.evaluate((root) => {
      const stage = root.querySelector('[data-festival-lightbox-swipe]').getBoundingClientRect();
      const prev = root.querySelector('button[aria-label="이전 사진"]').getBoundingClientRect();
      const next = root.querySelector('button[aria-label="다음 사진"]').getBoundingClientRect();
      return {
        prevRight: prev.right,
        nextLeft: next.left,
        stageLeft: stage.left,
        stageRight: stage.right,
        prevW: prev.width,
        prevH: prev.height,
      };
    });
    expect(edges.prevRight).toBeLessThanOrEqual(edges.stageLeft + 1);
    expect(edges.nextLeft).toBeGreaterThanOrEqual(edges.stageRight - 1);
    expect(edges.prevW).toBeGreaterThanOrEqual(44);
    expect(edges.prevH).toBeGreaterThanOrEqual(44);
  });

  test('lightbox count matches the loaded filmstrip and keeps that photo when another loads', async ({ page }) => {
    let releaseMiddle;
    const middleReady = new Promise((resolve) => {
      releaseMiddle = resolve;
    });
    await page.route(/e2e-static\.gateo\.test/i, async (route) => {
      const url = route.request().url();
      if (/manual-638576-gallery-2\.png/.test(url)) {
        await middleReady;
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: BRIGHT_PNG,
        });
        return;
      }
      const keep = /festival-hero-638576\.png/.test(url)
        || /manual-638576-gallery-5\.png/.test(url);
      if (!keep) {
        await route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: BRIGHT_PNG,
      });
    });

    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded' });

    const sheet = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    const options = sheet.locator('[data-festival-hero-thumbs-scroller] [role="option"]');
    await expect(options).toHaveCount(2, { timeout: 30_000 });

    const secondSrc = await options.nth(1).locator('img').getAttribute('src');
    await options.nth(1).click();
    await sheet.getByRole('button', { name: /사진 확대보기/ }).click();
    const lightbox = page.getByRole('dialog', { name: '사진 확대보기' });
    await expect(lightbox).toBeVisible();
    const index = lightbox.locator('[data-festival-lightbox-index]');
    await expect(index).toHaveAttribute('data-festival-lightbox-index', '1');
    await expect(index).toHaveText('2 / 2');
    await expect(lightbox.locator('img').first()).toHaveAttribute('src', secondSrc);

    releaseMiddle();
    await expect(options).toHaveCount(3, { timeout: 15_000 });
    await expect(index).toHaveAttribute('data-festival-lightbox-index', '2');
    await expect(index).toHaveText('3 / 3');
    await expect(lightbox.locator('img').first()).toHaveAttribute('src', secondSrc);
    await shot(page, 'festival-lightbox-loaded-count-390');

    await lightbox.getByRole('button', { name: '다음 사진' }).click();
    await expect(index).toHaveText('1 / 3');
    await expect(index).toHaveAttribute('data-festival-lightbox-index', '0');
    await expect(page).toHaveURL(new RegExp(`festival=${FESTIVAL_ID}`));
  });
});

const REAL_OUT = process.env.LIGHTBOX_QA_OUT || '/tmp/lightbox-center-qa';
const COFFEE_ID = '825295';

async function shotReal(page, name) {
  await mkdir(REAL_OUT, { recursive: true });
  await page.evaluate(() => {
    document.querySelectorAll('body *').forEach((el) => {
      if ((el.textContent || '').trim() === '모바일 위젯 로그') {
        const host = el.closest('div.fixed');
        if (host) host.style.visibility = 'hidden';
      }
    });
  });
  await page.screenshot({
    path: `${REAL_OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
}

async function openKoreaList(page) {
  await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
  await dismissLocHint(page);
  await expect(page.locator('[data-festival-id]').first()).toBeVisible({ timeout: 90_000 });
}

async function gangwonChip(page) {
  return page.getByRole('button', { name: /^강원/ }).first();
}

async function openCoffeeFromGangwon(page) {
  await openKoreaList(page);
  const chip = await gangwonChip(page);
  await chip.scrollIntoViewIfNeeded();
  await chip.tap();
  await expect(page.getByRole('button', { name: /^강원/, pressed: true }).first()).toBeVisible();
  const card = page.locator(`[data-festival-id="${COFFEE_ID}"]`);
  await expect(card).toBeVisible({ timeout: 45_000 });
  await card.scrollIntoViewIfNeeded();
  await card.tap();
  const sheet = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
  await expect(sheet).toBeVisible({ timeout: 60_000 });
  await expect(sheet.locator('#korea-festival-sheet-title')).toContainText('강릉커피축제');
  await expect(page).toHaveURL(new RegExp(`festival=${COFFEE_ID}`));
  return sheet;
}

async function expandCoffeePhoto(page, sheet) {
  await sheet.getByRole('button', { name: /사진 확대보기/ }).tap();
  const lightbox = page.getByRole('dialog', { name: '사진 확대보기' });
  await expect(lightbox).toBeVisible();
  await expect.poll(async () => lightbox.locator('img').first().evaluate((img) => (
    img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
  ))).toBeGreaterThan(10);
  await expect(lightbox.getByRole('button', { name: '다음 사진' })).toBeVisible({ timeout: 25_000 });
  return lightbox;
}

async function backdropPoint(lightbox) {
  return lightbox.evaluate((root) => {
    const img = root.querySelector('img');
    const box = img.getBoundingClientRect();
    const fit = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const paintedH = img.naturalHeight * fit;
    const paintedTop = box.top + (box.height - paintedH) / 2;
    const paintedBottom = paintedTop + paintedH;
    const rootBox = root.getBoundingClientRect();
    let y = paintedBottom + 36;
    if (y > rootBox.bottom - 28) y = Math.max(rootBox.top + 28, paintedTop - 36);
    return { x: box.left + box.width / 2, y };
  });
}

test.describe('festival lightbox real TourAPI — WebKit 390', () => {
  test.describe.configure({ timeout: 180_000 });

  test('강원 chip card: back closes the lightbox, then returns to the 강원 list', async ({ page }) => {
    await openKoreaList(page);
    await shotReal(page, '01-list');

    const chip = await gangwonChip(page);
    await chip.scrollIntoViewIfNeeded();
    await chip.tap();
    await expect(page.getByRole('button', { name: /^강원/, pressed: true }).first()).toBeVisible();
    await expect(page.locator(`[data-festival-id="${COFFEE_ID}"]`)).toBeVisible({ timeout: 45_000 });
    await shotReal(page, '02-gangwon');

    const card = page.locator(`[data-festival-id="${COFFEE_ID}"]`);
    await card.scrollIntoViewIfNeeded();
    await card.tap();
    const sheet = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    await expect(sheet.locator('#korea-festival-sheet-title')).toContainText('강릉커피축제');
    await expect(page).toHaveURL(new RegExp(`festival=${COFFEE_ID}`));
    await shotReal(page, '03-sheet');

    const lightbox = await expandCoffeePhoto(page, sheet);
    await shotReal(page, '04-lightbox');

    await page.goBack({ waitUntil: 'commit' });
    await expect(lightbox).toBeHidden();
    await expect(sheet).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`festival=${COFFEE_ID}`));
    await shotReal(page, '05-back-detail');

    await page.goBack({ waitUntil: 'commit' });
    await expect(page).not.toHaveURL(/[?&]festival=/);
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: /^강원/, pressed: true }).first()).toBeVisible();
    await expect(page.locator(`[data-festival-id="${COFFEE_ID}"]`)).toBeVisible();
    await shotReal(page, '06-back-list');
  });

  test('Esc then one back returns to the list', async ({ page }) => {
    const sheet = await openCoffeeFromGangwon(page);
    const lightbox = await expandCoffeePhoto(page, sheet);
    await page.keyboard.press('Escape');
    await expect(lightbox).toBeHidden();
    await expect(sheet).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`festival=${COFFEE_ID}`));
    await page.goBack({ waitUntil: 'commit' });
    await expect(page).not.toHaveURL(/[?&]festival=/);
    await expect(sheet).toBeHidden();
    await expect(page.locator(`[data-festival-id="${COFFEE_ID}"]`)).toBeVisible();
  });

  test('backdrop tap then one back returns to the list', async ({ page }) => {
    const sheet = await openCoffeeFromGangwon(page);
    const lightbox = await expandCoffeePhoto(page, sheet);
    const point = await backdropPoint(lightbox);
    await page.touchscreen.tap(point.x, point.y);
    await expect(lightbox).toBeHidden();
    await expect(sheet).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`festival=${COFFEE_ID}`));
    await page.goBack({ waitUntil: 'commit' });
    await expect(page).not.toHaveURL(/[?&]festival=/);
    await expect(sheet).toBeHidden();
    await expect(page.locator(`[data-festival-id="${COFFEE_ID}"]`)).toBeVisible();
  });

  test('three next taps then one back closes the lightbox only', async ({ page }) => {
    const sheet = await openCoffeeFromGangwon(page);
    const lightbox = await expandCoffeePhoto(page, sheet);
    const index = lightbox.locator('[data-festival-lightbox-index]');
    await expect(index).toHaveAttribute('data-festival-lightbox-index', '0');
    const next = lightbox.getByRole('button', { name: '다음 사진' });
    for (let step = 1; step <= 3; step += 1) {
      await next.tap();
      await expect(index).toHaveAttribute('data-festival-lightbox-index', String(step));
    }
    await page.goBack({ waitUntil: 'commit' });
    await expect(lightbox).toBeHidden();
    await expect(sheet).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`festival=${COFFEE_ID}`));
    await expect(sheet.locator('#korea-festival-sheet-title')).toContainText('강릉커피축제');
  });
});
