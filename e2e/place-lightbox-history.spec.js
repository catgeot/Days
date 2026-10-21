// Place + festival lightbox history. Start at `/`, not a /place deeplink.
import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';

const OUT = '/opt/cursor/artifacts/qa/pr534';

const SIZES = [
  { label: '390', width: 390, height: 844, mobile: true },
  { label: '1280', width: 1280, height: 800, mobile: false },
];

const PLACES = [
  { slug: 'jeju', query: '제주', name: /제주/ },
  { slug: 'paris', query: '파리', name: /파리|Paris/ },
  { slug: 'bangkok', query: '방콕', name: /방콕|Bangkok/ },
];

const FESTIVALS = [
  { id: '506616', slug: 'seogwipo-506616', name: /서귀포칠십리/, region: /^제주(?:\s+\d+)?$/ },
  { id: '825295', slug: 'gangneung-825295', name: /강릉커피/, region: /^강원(?:\s+\d+)?$/ },
];

async function shot(page, name, size) {
  await mkdir(OUT, { recursive: true });
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: size.width, height: size.height },
  });
}

async function historySnap(page) {
  return page.evaluate(() => ({
    length: history.length,
    lightbox: history.state?.gateoLightbox === true,
    path: `${location.pathname}${location.search}`,
  }));
}

async function dispatchTouch(page, { x, y, type, active, selector = '[data-place-lightbox-swipe]' }) {
  await page.evaluate(({ x: clientX, y: clientY, type: eventType, active: keepActive, selector: targetSelector }) => {
    const target = document.querySelector(targetSelector)
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
  }, { x, y, type, active, selector });
}

async function swipeLightbox(page, direction, selector = '[data-place-lightbox-swipe]') {
  const stage = page.locator(selector);
  const box = await stage.boundingBox();
  expect(box).toBeTruthy();
  const y = box.y + Math.min(box.height * 0.45, 360);
  const startX = box.x + box.width * (direction === 'next' ? 0.72 : 0.38);
  const endX = direction === 'next' ? startX - 170 : startX + 170;
  expect(startX).toBeGreaterThan(24);
  expect(endX).toBeGreaterThan(24);
  await dispatchTouch(page, { x: startX, y, type: 'touchstart', active: true, selector });
  await dispatchTouch(page, { x: (startX + endX) / 2, y, type: 'touchmove', active: true, selector });
  await dispatchTouch(page, { x: endX, y, type: 'touchend', active: false, selector });
}

async function openSummaryFromHome(page, place, size) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await shot(page, `${place.slug}-${size.label}-01-home`, size);

  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible();
  await input.fill(place.query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: place.name })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();

  await expect.poll(async () => {
    if (new RegExp(`/place/${place.slug}(?:/|$|\\?)`).test(new URL(page.url()).pathname)) return 'place';
    if (await page.locator('.place-summary-card').isVisible().catch(() => false)) return 'summary';
    return '';
  }, { timeout: 30_000 }).not.toBe('');
  const landed = new RegExp(`/place/${place.slug}(?:/|$|\\?)`).test(new URL(page.url()).pathname)
    ? 'place'
    : 'summary';
  if (landed === 'place') {
    const home = page.getByRole('button', { name: /홈으로 이동|Go to home/ }).first();
    await expect(home).toBeVisible({ timeout: 60_000 });
    await home.click();
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 30_000 });
  }

  const summary = page.locator('.place-summary-card');
  await expect(summary).toBeVisible({ timeout: 45_000 });
  await expect(summary).toContainText(place.name);
  await expect(page).toHaveURL(/\/(\?.*)?$/);
  await shot(page, `${place.slug}-${size.label}-02-summary`, size);
  return summary;
}

async function openGalleryFromSummary(page, place, summary, size) {
  const more = summary.getByRole('button', { name: /^(더보기|More)$/ });
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
  await shot(page, `${place.slug}-${size.label}-03-gallery`, size);
  return tile;
}

for (const size of SIZES) {
  test.describe(`place lightbox history — WebKit ${size.label}`, () => {
    test.use({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
      isMobile: size.mobile,
      hasTouch: true,
    });

    for (const place of PLACES) {
      test(`${place.slug}: home → summary → gallery → photo → back → card back`, async ({ page }) => {
        const summary = await openSummaryFromHome(page, place, size);
        const tile = await openGalleryFromSummary(page, place, summary, size);
        const before = await historySnap(page);
        expect(before.lightbox).toBe(false);

        await tile.click();
        const lightbox = page.locator('[data-place-lightbox]');
        await expect(lightbox).toBeVisible();
        await expect(lightbox).toHaveAttribute('data-place-lightbox-index', '0');
        const opened = await historySnap(page);
        expect(opened.lightbox).toBe(true);
        expect(opened.length).toBe(before.length + 1);
        expect(opened.path).toBe(before.path);
        await shot(page, `${place.slug}-${size.label}-04-photo`, size);

        await swipeLightbox(page, 'next');
        await expect(lightbox).toHaveAttribute('data-place-lightbox-index', '1');
        const swiped = await historySnap(page);
        expect(swiped.length).toBe(opened.length);
        expect(swiped.lightbox).toBe(true);
        await shot(page, `${place.slug}-${size.label}-05-swipe`, size);

        await page.goBack({ waitUntil: 'commit' });
        await expect(lightbox).toBeHidden();
        await expect(page).toHaveURL(new RegExp(`/place/${place.slug}(?:/|$|\\?)`));
        await expect(page.locator('[data-place-gallery-scroll]')).toBeVisible();
        const closed = await historySnap(page);
        expect(closed.lightbox).toBe(false);
        await shot(page, `${place.slug}-${size.label}-06-back-gallery`, size);

        await page.goBack({ waitUntil: 'commit' });
        await expect(page).toHaveURL(/\/(\?.*)?$/);
        const summaryAgain = page.locator('.place-summary-card');
        await expect(summaryAgain).toBeVisible({ timeout: 30_000 });
        await expect(summaryAgain).toContainText(place.name);
        await shot(page, `${place.slug}-${size.label}-07-back-summary`, size);

        const cardBack = summaryAgain.getByRole('button', { name: /써머리 닫기|Close summary/ });
        await expect(cardBack).toBeVisible();
        await cardBack.click();
        await expect(summaryAgain).toBeHidden({ timeout: 15_000 });
        await expect(page).toHaveURL(/\/(\?.*)?$/);
        await shot(page, `${place.slug}-${size.label}-08-card-back`, size);
      });
    }
  });

  test.describe(`festival lightbox history — WebKit ${size.label}`, () => {
    test.use({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
      isMobile: size.mobile,
      hasTouch: true,
    });

    for (const festival of FESTIVALS) {
      test(`${festival.slug}: photos load before the lightbox opens`, async ({ page }) => {
        await page.goto('/korea', { waitUntil: 'domcontentloaded' });
        const region = page.getByRole('button', { name: /지역 대분류/ }).first();
        await expect(region).toBeVisible({ timeout: 60_000 });
        await shot(page, `${festival.slug}-${size.label}-01-korea`, size);
        await region.click();
        const chip = page.getByRole('button', { name: festival.region }).first();
        await expect(chip).toBeVisible({ timeout: 20_000 });
        await chip.click();
        await shot(page, `${festival.slug}-${size.label}-02-region`, size);

        const row = page.locator(`[data-festival-id="${festival.id}"]`).first();
        await expect(row).toBeVisible({ timeout: 60_000 });
        await row.scrollIntoViewIfNeeded();
        await row.click();
        await expect(page).toHaveURL(new RegExp(`[?&]festival=${festival.id}(?:&|$)`), { timeout: 20_000 });
        const sheet = page.locator('[role="dialog"][aria-labelledby="korea-festival-sheet-title"]');
        await expect(sheet).toBeVisible({ timeout: 20_000 });
        await expect(sheet).toContainText(festival.name);

        const expand = sheet.locator('[data-festival-hero-expand="ready"]');
        await expect(sheet.locator('[data-festival-photo-strip="open"]').first()).toBeVisible({ timeout: 60_000 });
        await expect(expand).toBeEnabled({ timeout: 60_000 });
        const heroPhoto = sheet.locator('[data-festival-hero] img[data-festival-photo-loaded="true"]');
        await expect(heroPhoto).toBeVisible({ timeout: 20_000 });
        await expect.poll(async () => heroPhoto.evaluate((img) => (
          img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
        ))).toBeGreaterThan(10);
        await shot(page, `${festival.slug}-${size.label}-03-sheet`, size);

        const before = await historySnap(page);
        await expand.click();
        const lightbox = page.locator('[data-festival-lightbox]');
        await expect(lightbox).toBeVisible();
        const photo = lightbox.locator('img[data-festival-photo-loaded="true"]');
        await expect(photo).toBeVisible({ timeout: 20_000 });
        await expect.poll(async () => photo.evaluate((img) => (
          img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
        ))).toBeGreaterThan(10);
        const opened = await historySnap(page);
        expect(opened.lightbox).toBe(true);
        expect(opened.length).toBe(before.length + 1);
        expect(opened.path).toContain(`festival=${festival.id}`);
        await shot(page, `${festival.slug}-${size.label}-04-lightbox`, size);

        const index = lightbox.locator('[data-festival-lightbox-index]');
        const indexBefore = await index.getAttribute('data-festival-lightbox-index');
        await swipeLightbox(page, 'next', '[data-festival-lightbox-swipe]');
        await expect.poll(async () => index.getAttribute('data-festival-lightbox-index')).not.toBe(indexBefore);
        const swiped = await historySnap(page);
        expect(swiped.length).toBe(opened.length);
        expect(swiped.lightbox).toBe(true);
        await shot(page, `${festival.slug}-${size.label}-05-swipe`, size);

        await page.goBack({ waitUntil: 'commit' });
        await expect(lightbox).toBeHidden();
        await expect(sheet).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`[?&]festival=${festival.id}(?:&|$)`));
        const closed = await historySnap(page);
        expect(closed.lightbox).toBe(false);
        expect(closed.path).toContain(`festival=${festival.id}`);
        await shot(page, `${festival.slug}-${size.label}-06-back-sheet`, size);
      });
    }
  });
}
