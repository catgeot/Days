// Place gallery lightbox: iOS edge-swipe (history.back) closes the photo and stays on the gallery.
import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';

const VIEWPORT = { width: 390, height: 844 };
const OUT = '/opt/cursor/artifacts';

const PLACES = [
  { slug: 'jeju', label: 'jeju', name: /제주/ },
  { slug: 'paris', label: 'paris', name: /파리|Paris/ },
  { slug: 'bangkok', label: 'bangkok', name: /방콕|Bangkok/ },
];

async function shot(page, name) {
  await mkdir(OUT, { recursive: true });
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
}

async function historySnap(page) {
  return page.evaluate(() => ({
    length: history.length,
    lightbox: history.state?.gateoLightbox === true,
    idx: history.state?.idx ?? null,
    path: `${location.pathname}${location.search}`,
  }));
}

async function dispatchTouch(page, { x, y, type, active }) {
  await page.evaluate(({ x: clientX, y: clientY, type: eventType, active: keepActive }) => {
    const target = document.querySelector('[data-place-lightbox-swipe]')
      || document.elementFromPoint(clientX, clientY);
    if (!target) throw new Error('missing lightbox swipe target');
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
  }, { x, y, type, active });
}

async function swipeLightbox(page, direction) {
  const stage = page.locator('[data-place-lightbox-swipe]');
  const box = await stage.boundingBox();
  expect(box).toBeTruthy();
  const y = box.y + Math.min(box.height * 0.45, 360);
  const startX = box.x + box.width * (direction === 'next' ? 0.72 : 0.38);
  const endX = direction === 'next' ? startX - 170 : startX + 170;
  expect(startX).toBeGreaterThan(24);
  expect(endX).toBeGreaterThan(24);
  await dispatchTouch(page, { x: startX, y, type: 'touchstart', active: true });
  await dispatchTouch(page, { x: (startX + endX) / 2, y, type: 'touchmove', active: true });
  await dispatchTouch(page, { x: endX, y, type: 'touchend', active: false });
}

async function openGalleryFromHomeSummary(page, place) {
  await page.goto(`/place/${place.slug}?lang=ko`, { waitUntil: 'domcontentloaded' });
  const home = page.getByRole('button', { name: '홈으로 이동' }).first();
  await expect(home).toBeVisible({ timeout: 60_000 });
  await home.click();
  await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 30_000 });
  const summary = page.locator('.place-summary-card');
  await expect(summary).toBeVisible({ timeout: 45_000 });
  await expect(summary).toContainText(place.name);
  await shot(page, `lightbox-history-${place.label}-summary-390`);
  const more = summary.getByRole('button', { name: '더보기', exact: true });
  await expect(more).toBeVisible({ timeout: 20_000 });
  await more.click();
  await expect(page).toHaveURL(new RegExp(`/place/${place.slug}(?:/|$|\\?)`), { timeout: 30_000 });
  const scroller = page.locator('[data-place-gallery-scroll]');
  await expect(scroller).toBeVisible({ timeout: 30_000 });
  const tile = scroller.locator('img').first();
  await expect(tile).toBeVisible({ timeout: 90_000 });
  await expect.poll(async () => tile.evaluate((img) => (
    img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
  ))).toBeGreaterThan(10);
  await shot(page, `lightbox-history-${place.label}-gallery-390`);
  return tile;
}

test.describe('place lightbox history — WebKit 390', () => {
  test.use({ viewport: VIEWPORT, deviceScaleFactor: 1 });

  for (const place of PLACES) {
    test(`${place.label}: edge-back closes the lightbox and stays on the gallery`, async ({ page }) => {
      const tile = await openGalleryFromHomeSummary(page, place);
      const before = await historySnap(page);
      expect(before.lightbox).toBe(false);

      await tile.click();
      const lightbox = page.locator('[data-place-lightbox]');
      await expect(lightbox).toBeVisible();
      await expect(lightbox).toHaveAttribute('data-place-lightbox-index', '0');
      await expect.poll(async () => {
        const text = await lightbox.innerText();
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        return match ? Number(match[2]) : 0;
      }).toBeGreaterThan(1);

      const opened = await historySnap(page);
      expect(opened.lightbox).toBe(true);
      expect(opened.length).toBe(before.length + 1);
      expect(opened.path).toBe(before.path);
      await shot(page, `lightbox-history-${place.label}-open-390`);

      await swipeLightbox(page, 'next');
      await expect(lightbox).toHaveAttribute('data-place-lightbox-index', '1');
      const swiped = await historySnap(page);
      expect(swiped.length).toBe(opened.length);
      expect(swiped.lightbox).toBe(true);
      expect(swiped.path).toBe(opened.path);
      await shot(page, `lightbox-history-${place.label}-swipe-390`);

      await page.goBack({ waitUntil: 'commit' });
      await expect(lightbox).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`/place/${place.slug}(?:/|$|\\?)`));
      await expect(page.locator('[data-place-gallery-scroll]')).toBeVisible();
      const closed = await historySnap(page);
      expect(closed.lightbox).toBe(false);
      await shot(page, `lightbox-history-${place.label}-back-gallery-390`);

      await page.goBack({ waitUntil: 'commit' });
      await expect(page).toHaveURL(/\/(\?.*)?$/);
      const summary = page.locator('.place-summary-card');
      await expect(summary).toBeVisible({ timeout: 30_000 });
      await expect(summary).toContainText(place.name);
      await shot(page, `lightbox-history-${place.label}-back-summary-390`);
    });
  }

  test('jeju: X releases the lightbox history entry', async ({ page }) => {
    const place = PLACES[0];
    const tile = await openGalleryFromHomeSummary(page, place);
    const before = await historySnap(page);
    await tile.click();
    const lightbox = page.locator('[data-place-lightbox]');
    await expect(lightbox).toBeVisible();
    const opened = await historySnap(page);
    expect(opened.lightbox).toBe(true);
    expect(opened.length).toBe(before.length + 1);

    await lightbox.getByRole('button', { name: '닫기' }).click();
    await expect(lightbox).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/place/${place.slug}(?:/|$|\\?)`));
    const closed = await historySnap(page);
    expect(closed.lightbox).toBe(false);

    await page.goBack({ waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(page.locator('.place-summary-card')).toBeVisible({ timeout: 30_000 });
    await shot(page, 'lightbox-history-jeju-x-then-summary-390');
  });
});
