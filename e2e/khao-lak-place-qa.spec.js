/**
 * Khao Lak /place overviews, locked galleries, zen hit target, festival FAB vs Close.
 * Local Vite only. Network mocks — no Gemini.
 */
import { test, expect } from '@playwright/test';
import { buildBackOverviewFestivalDetail } from './festival-back-overview-fixture.js';
import { installFestivalBackOverviewFixtures } from './festival-back-overview-fixture.js';
import { curatedPlaceGallery } from '../src/data/curatedPlaceGalleries.js';
import { hubAttractionOverview } from '../src/data/hubAttractionOverviews.js';

const PLACEHOLDER = /업데이트 중|being updated/i;
const STOCK_SRC = /unsplash|pexels|example\.invalid/i;
const FESTIVAL_IDS = ['2754421', '3028462', '506470'];
const PLACE_SLUGS = [
  'nang-thong-beach',
  'bang-sak-beach',
  'bang-niang-market',
  'ton-chong-fa-waterfall',
  'ban-nam-khem-tsunami-memorial-park',
  'takua-pa-old-town',
];

const FESTIVAL_ROWS = {
  '2754421': {
    id: '2754421',
    title: '괴산김장축제',
    addr1: '충청북도 괴산군',
    mapx: '127.790',
    mapy: '36.815',
    eventStartDate: '20261105',
    eventEndDate: '20261108',
    venue: '괴산군',
  },
  '3028462': {
    id: '3028462',
    title: '보령머드축제',
    addr1: '충청남도 보령시',
    mapx: '126.486',
    mapy: '36.333',
    eventStartDate: '20260717',
    eventEndDate: '20260726',
    venue: '대천해수욕장',
  },
  '506470': {
    id: '506470',
    title: '진주남강유등축제',
    addr1: '경상남도 진주시',
    mapx: '128.084',
    mapy: '35.192',
    eventStartDate: '20261001',
    eventEndDate: '20261013',
    venue: '남강',
  },
};

function boxesIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function playwrightBoxToIntersect(box) {
  return { x: box.x, y: box.y, w: box.width, h: box.height };
}

async function scrollFestivalSheetToEnd(page) {
  const content = page.locator('[data-festival-sheet-content]');
  await expect(content).toBeVisible();
  let last = -1;
  let stable = 0;
  const deadline = Date.now() + 20000;
  while (stable < 3 && Date.now() < deadline) {
    const height = await content.evaluate((el) => el.scrollHeight);
    stable = height === last && height > 0 ? stable + 1 : 0;
    last = height;
    await page.waitForTimeout(400);
  }
  await content.evaluate((el) => {
    const canScroll = (node) => {
      if (!node) return false;
      const overflowY = getComputedStyle(node).overflowY;
      return (
        (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
        && node.scrollHeight > node.clientHeight + 1
      );
    };
    let node = el;
    while (node && !canScroll(node)) node = node.parentElement;
    if (node) node.scrollTop = node.scrollHeight;
  });
  await page.waitForTimeout(400);
}

async function hitAt(page, x, y) {
  return page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    const button = el?.closest?.('button');
    return {
      label: button?.getAttribute('aria-label') || '',
      text: (button?.innerText || '').replace(/\s+/g, ' ').trim(),
    };
  }, { x, y });
}

async function footerCloseBox(page, closeName) {
  const viewport = page.viewportSize();
  const limit = viewport?.height || 844;
  const boxes = await page.getByRole('button', { name: closeName, exact: true }).evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
    }),
  );
  const visible = boxes.filter((box) => box.w > 80 && box.w < 900 && box.h > 20 && box.h < 120 && box.y >= 0 && box.y < limit);
  visible.sort((a, b) => b.w - a.w);
  return visible[0] || null;
}

async function blockLiveApis(page) {
  await page.route(/supabase\.co|\/rest\/v1\//i, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route(/unsplash|pexels|generativelanguage|googleapis.*gemini|functions\/v1\/gemini/i, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], photos: [] }),
    }),
  );
}

async function installFestivalIds(context) {
  await installFestivalBackOverviewFixtures(context);
  await context.route(/tourapi-proxy/i, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fallback();
      return;
    }
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const id = String(body.contentId || body.contentid || '').trim();
    const row = FESTIVAL_ROWS[id];
    const action = String(body.action || '');
    if (!row || (action !== 'festivalDetail' && action !== 'detailIntro' && action !== 'detailCommon')) {
      await route.fallback();
      return;
    }
    const detail = buildBackOverviewFestivalDetail(row);
    if (action === 'detailIntro') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, intro: detail.intro }),
      });
      return;
    }
    if (action === 'detailCommon') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, common: detail.common }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    });
  });
}

test.describe('khao lak place qa', () => {
  test.beforeEach(async ({ page }) => {
    await blockLiveApis(page);
  });

  test('overviews and galleries for the six slugs stay on the verified set', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const slug of PLACE_SLUGS) {
      const overview = hubAttractionOverview(slug);
      await page.goto(`/place/${slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(overview.desc.slice(0, 24)).first()).toBeVisible();
      const body = await page.locator('body').innerText();
      expect(body).not.toMatch(PLACEHOLDER);
      const allowed = new Set((curatedPlaceGallery(slug) || []).map((image) => image.urls.regular));
      const srcs = await page.locator('img').evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('src') || '').filter(Boolean),
      );
      const gallerySrcs = srcs.filter((src) => /wikimedia|unsplash|pexels|example\.invalid/i.test(src));
      expect(gallerySrcs.filter((src) => STOCK_SRC.test(src))).toEqual([]);
      for (const src of gallerySrcs) {
        expect(allowed.has(src)).toBe(true);
      }
      if (allowed.size === 0) {
        expect(gallerySrcs).toEqual([]);
      } else {
        expect(gallerySrcs.length).toBeGreaterThan(0);
      }
    }
  });

  test('zen button hit target at 1280 is the zen control', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/place/bang-sak-beach', { waitUntil: 'domcontentloaded' });
    const zen = page.getByRole('button', { name: /Zen Mode/i });
    await expect(zen).toBeVisible();
    const box = await zen.boundingBox();
    expect(box).toBeTruthy();
    const hitLabel = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      const button = el?.closest?.('button');
      return button?.getAttribute('aria-label') || el?.getAttribute?.('aria-label') || '';
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    expect(hitLabel).toMatch(/Zen Mode/i);
    await zen.click({ trial: true });
  });
});

const NANG_THONG_CAPTION = 'Khao Lak lighthouse on the rock off Nang Thong Beach';
const STOCK_AUTO_ALT = 'A large body of water surrounded by trees';
const MOCK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

async function blockLiveApisWithPexelsStock(page) {
  const stockThumb =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Khao_Lak_light_beacon.JPG/960px-Khao_Lak_light_beacon.JPG';
  const stockGalleryRow = [{
    place_id: 'Bangkok',
    gallery_urls: [{
      id: 'pexels-e2e-auto-alt',
      source: 'pexels',
      width: 960,
      height: 720,
      alt_description: STOCK_AUTO_ALT,
      alt: STOCK_AUTO_ALT,
      urls: {
        regular: stockThumb,
        small: stockThumb,
      },
      user: { name: 'E2E' },
      links: { html: 'https://www.pexels.com/photo/e2e-auto-alt/' },
    }],
  }];
  await page.route(/\/rest\/v1\//i, (route) => {
    const url = route.request().url();
    if (/place_stats/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(stockGalleryRow),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route(/generativelanguage|googleapis.*gemini|functions\/v1\/gemini/i, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], photos: [] }),
    }),
  );
  await page.route(/unsplash|api\.unsplash\.com/i, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], photos: [] }),
    }),
  );
  await page.route(/\/functions\/v1\/pexels-proxy/i, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        images: [
          {
            id: 'pexels-e2e-auto-alt',
            source: 'pexels',
            width: 1200,
            height: 800,
            alt_description: STOCK_AUTO_ALT,
            alt: STOCK_AUTO_ALT,
            urls: {
              regular: 'https://images.pexels.com/photos/e2e-auto-alt/large.jpeg',
              small: 'https://images.pexels.com/photos/e2e-auto-alt/small.jpeg',
            },
            user: { name: 'E2E' },
            links: { html: 'https://www.pexels.com/photo/e2e-auto-alt/' },
          },
        ],
      }),
    }),
  );
  await page.route(/images\.pexels\.com/i, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_PNG }),
  );
  await page.route(/tourapi-proxy/i, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, items: [] }) }),
  );
}

async function openNangThongGalleryLightbox(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('/place/nang-thong-beach/gallery?lang=en', { waitUntil: 'domcontentloaded' });
  const scroller = page.locator('[data-place-gallery-scroll]');
  await expect(scroller).toBeVisible({ timeout: 60_000 });
  const tile = scroller.locator('img').first();
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => tile.evaluate((img) => (
    img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
  ))).toBeGreaterThan(10);
  await tile.click();
  const lightbox = page.locator('[data-place-lightbox]');
  await expect(lightbox).toBeVisible({ timeout: 15_000 });
  return lightbox;
}

test.describe('place gallery lightbox caption — mock @390 @1280', () => {
  test.beforeEach(async ({ page }) => {
    await blockLiveApis(page);
  });

  for (const viewport of [
    { label: '390', width: 390, height: 844 },
    { label: '1280', width: 1280, height: 800 },
  ]) {
    test(`${viewport.label}: photo note visible; top-right hit target is lightbox`, async ({ page }) => {
      const lightbox = await openNangThongGalleryLightbox(page, viewport);
      await expect(lightbox.locator('[data-place-lightbox-caption]')).toContainText(NANG_THONG_CAPTION);

      const close = lightbox.getByRole('button', { name: /close/i });
      await expect(close).toBeVisible();
      const closeBox = await close.boundingBox();
      expect(closeBox).toBeTruthy();

      const hit = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return {
          inLightbox: Boolean(el?.closest?.('[data-place-lightbox]')),
          inHomeChrome: Boolean(el?.closest?.('[data-testid="place-header-chrome-actions"]')),
        };
      }, { x: closeBox.x + closeBox.width / 2, y: closeBox.y + closeBox.height / 2 });
      expect(hit.inLightbox).toBe(true);
      expect(hit.inHomeChrome).toBe(false);

      await expect(lightbox.locator('[data-gallery-wikimedia-credit]').first()).toBeVisible();

      const note = lightbox.locator('[data-place-lightbox-note]').first();
      const photo = lightbox.locator('[data-place-lightbox-photo]');
      await expect(note).toBeVisible();
      await expect(photo).toBeVisible();
      const noteBox = await note.boundingBox();
      const photoBox = await photo.boundingBox();
      expect(noteBox).toBeTruthy();
      expect(photoBox).toBeTruthy();
      expect(boxesIntersect(playwrightBoxToIntersect(noteBox), playwrightBoxToIntersect(photoBox))).toBe(
        false,
      );
      expect(noteBox.width).toBeLessThan(viewport.width);

      await page.screenshot({
        path: `/opt/cursor/artifacts/place-gallery-lightbox-caption-${viewport.label}.png`,
      });
    });
  }

  for (const viewport of [
    { label: '390', width: 390, height: 844 },
    { label: '1280', width: 1280, height: 800 },
  ]) {
    test(`${viewport.label}: stock auto alt only — no photo note`, async ({ page }) => {
      await blockLiveApisWithPexelsStock(page);
      await page.setViewportSize(viewport);
      await page.goto('/place/bangkok/gallery?lang=en', { waitUntil: 'domcontentloaded' });
      const scroller = page.locator('[data-place-gallery-scroll]');
      await expect(scroller).toBeVisible({ timeout: 60_000 });
      const tile = scroller.locator('img').first();
      await expect(tile).toBeVisible({ timeout: 60_000 });
      await expect.poll(async () => tile.evaluate((img) => (
        img.complete && img.naturalWidth > 10 ? img.naturalWidth : 0
      ))).toBeGreaterThan(10);
      await tile.click();
      const lightbox = page.locator('[data-place-lightbox]');
      await expect(lightbox).toBeVisible({ timeout: 15_000 });
      await expect(lightbox.locator('[data-place-lightbox-caption]')).toHaveCount(0);
      await expect(lightbox.locator('[data-place-lightbox-note]')).toHaveCount(0);
      const photo = lightbox.locator('[data-place-lightbox-photo]');
      await expect(photo).toHaveAttribute('alt', new RegExp(STOCK_AUTO_ALT, 'i'));
      await page.screenshot({
        path: `/opt/cursor/artifacts/place-gallery-lightbox-stock-auto-alt-${viewport.label}.png`,
      });
    });
  }
});

test.describe('festival ask mooni vs close', () => {
  test.beforeEach(async ({ context }) => {
    await installFestivalIds(context);
  });

  test('Ask MOONi and Close boxes do not intersect at 1280 English', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const id of FESTIVAL_IDS) {
      await page.goto(`/korea?festival=${id}&lang=en`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#korea-festival-sheet-title')).toBeVisible();
      await expect(page.locator('[data-festival-fab-clearance]')).toBeAttached();
      await scrollFestivalSheetToEnd(page);
      const fab = page.getByRole('button', { name: 'Ask MOONi', exact: true });
      await expect(fab).toBeVisible();
      const fabBox = await fab.boundingBox();
      const closes = await page.getByRole('button', { name: 'Close', exact: true }).evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
        }),
      );
      const visibleCloses = closes.filter((box) => box.w < 900 && box.h < 120 && box.w > 0);
      expect(visibleCloses.length).toBeGreaterThan(0);
      for (const closeBox of visibleCloses) {
        expect(boxesIntersect(fabBox, closeBox)).toBe(false);
      }
    }
  });

  test('Ask MOONi and Close stay apart at 1280 Korean and at 390 English', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/korea?festival=2754421&lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#korea-festival-sheet-title')).toBeVisible();
    await expect(page.locator('[data-festival-fab-clearance]')).toBeAttached();
    await scrollFestivalSheetToEnd(page);
    const fabKo = page.getByRole('button', { name: '무니에게 묻기', exact: true });
    await expect(fabKo).toBeVisible();
    const fabKoBox = await fabKo.boundingBox();
    const closesKo = await page.getByRole('button', { name: '닫기', exact: true }).evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      }),
    );
    for (const closeBox of closesKo.filter((box) => box.w < 900 && box.h < 120 && box.w > 0)) {
      expect(boxesIntersect(fabKoBox, closeBox)).toBe(false);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/korea?festival=2754421&lang=en', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#korea-festival-sheet-title')).toBeVisible();
    await scrollFestivalSheetToEnd(page);
    const fabEn = page.getByRole('button', { name: 'Ask MOONi', exact: true });
    const inlineEn = page.getByRole('button', { name: 'Ask MOONi about this festival', exact: true });
    const askEn = (await fabEn.count()) > 0 && await fabEn.isVisible() ? fabEn : inlineEn;
    await expect(askEn).toBeVisible();
    const fabEnBox = await askEn.boundingBox();
    const closesEn = await page.getByRole('button', { name: 'Close', exact: true }).evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      }),
    );
    for (const closeBox of closesEn.filter((box) => box.w < 360 && box.h < 120 && box.w > 0 && box.y < 844)) {
      expect(boxesIntersect(fabEnBox, closeBox)).toBe(false);
    }
  });

  test('Ask MOONi and Close stay clickable at 390 and 1280 in Korean and English', async ({ page }) => {
    const cases = [
      { width: 390, height: 844, lang: 'en', fab: 'Ask MOONi', close: 'Close' },
      { width: 390, height: 844, lang: 'ko', fab: '무니에게 묻기', close: '닫기' },
      { width: 1280, height: 800, lang: 'en', fab: 'Ask MOONi', close: 'Close' },
      { width: 1280, height: 800, lang: 'ko', fab: '무니에게 묻기', close: '닫기' },
    ];
    for (const item of cases) {
      await page.setViewportSize({ width: item.width, height: item.height });
      await page.goto(`/korea?festival=2754421&lang=${item.lang}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#korea-festival-sheet-title')).toBeVisible();
      await expect(page.locator('[data-festival-fab-clearance]')).toBeVisible();
      await scrollFestivalSheetToEnd(page);
      const fab = page.getByRole('button', { name: item.fab, exact: true });
      await expect(fab).toBeVisible();
      const fabBox = await fab.boundingBox();
      const closeBox = await footerCloseBox(page, item.close);
      expect(closeBox, `${item.lang} ${item.width}`).toBeTruthy();
      expect(boxesIntersect(fabBox, closeBox)).toBe(false);

      const fabHit = await hitAt(page, fabBox.x + fabBox.width / 2, fabBox.y + fabBox.height / 2);
      expect(fabHit.label || fabHit.text).toContain(item.fab);

      const closeHit = await hitAt(page, closeBox.x + closeBox.w / 2, closeBox.y + closeBox.h / 2);
      expect(closeHit.text).toBe(item.close);

      const cornerHit = await hitAt(page, closeBox.x + closeBox.w - 6, closeBox.y + closeBox.h - 4);
      expect(cornerHit.text).toBe(item.close);
      expect(cornerHit.label).not.toContain(item.fab);
    }
  });
});
