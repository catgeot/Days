import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const FX = JSON.parse(readFileSync(join(__dir, 'fixtures/rome-travelogue-fullpage.json'), 'utf8'));

const FESTIVAL_ID = '3571001';
const FESTIVAL_TITLE = 'E2E 우리술 대축제';
const FESTIVAL_LABEL = '2026 대한민국 우리술 대축제';
const PLACE_LABEL = '콜로세움 장소';
const READER_PATH = '/blog/e/rome-travelogue?lang=ko';
const REVIEW_ID = 'e2e-rev-1';
const REVIEWS_PATH = `/place/rome/reviews?review=${REVIEW_ID}&lang=ko`;
const SHOT_DIR = '/opt/cursor/artifacts/article-festival-back';

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

const rangeStart = new Date();
rangeStart.setDate(rangeStart.getDate() - 7);
const rangeEnd = new Date();
rangeEnd.setDate(rangeEnd.getDate() + 40);
const EVENT_START = ymd(rangeStart);
const EVENT_END = ymd(rangeEnd);

const filler = '단풍이 지기 전에 걷는 문단입니다. '.repeat(70);
const BODY = [
  filler,
  '',
  `[${FESTIVAL_LABEL}](https://www.gateo.kr/korea/?festival=${FESTIVAL_ID})`,
  '',
  `[${PLACE_LABEL}](/place/rome?lang=ko)`,
  '',
  filler,
].join('\n');

const EDITORIAL = {
  ...FX.editorialReport,
  images: [],
  content: BODY,
};

const REVIEW_BODY = BODY.replace(
  '](/place/rome?lang=ko)',
  '](https://www.gateo.kr/place/rome?lang=ko)',
);

const REVIEW = {
  id: REVIEW_ID,
  place_slug: 'rome',
  content: REVIEW_BODY,
  rating: 5,
  is_editorial: true,
  is_public: true,
  created_at: '2026-11-01T00:00:00.000Z',
  user_id: 'e2e-editorial',
  images: [],
  likes: [],
  user: { id: 'e2e-editorial', display_name: '게이트오', avatar_url: null },
};

const FESTIVAL_ITEM = {
  contentId: FESTIVAL_ID,
  title: FESTIVAL_TITLE,
  addr1: '서울특별시 종로구',
  eventStartDate: EVENT_START,
  eventEndDate: EVENT_END,
  mapx: '126.978',
  mapy: '37.566',
};

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function urlKey(url) {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

function attachDiagnostics(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push({ message: err.message || String(err), stack: err.stack || '' });
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /removeChild/i.test(msg.text())) {
      errors.push({ message: msg.text(), stack: '' });
    }
  });
  return errors;
}

function expectErrorsClean(errors) {
  const fatal = errors.filter(
    (entry) => !/access control checks|Fetch API cannot load/i.test(entry.message || ''),
  );
  expect(fatal, JSON.stringify(errors, null, 2)).toHaveLength(0);
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
      try {
        action = String(route.request().postDataJSON()?.action || '');
      } catch {
        action = '';
      }
      if (action === 'festivalWindow') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, items: [FESTIVAL_ITEM] }),
        });
      }
      if (action === 'festivalDetail') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            contentId: FESTIVAL_ID,
            intro: {
              contentid: FESTIVAL_ID,
              title: FESTIVAL_TITLE,
              eventstartdate: EVENT_START,
              eventenddate: EVENT_END,
            },
            common: {
              contentid: FESTIVAL_ID,
              title: FESTIVAL_TITLE,
              addr1: '서울특별시 종로구',
            },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [] }),
      });
    }
    if (route.request().method() !== 'GET' && !path.includes('/rpc/')) {
      return route.fulfill({ status: 405, contentType: 'application/json', body: '{}' });
    }
    if (path.includes('/auth/v1')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: null }) });
    }
    if (path.includes('/place_reviews')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([REVIEW]),
      });
    }
    if (path.includes('/report_comments') || path.includes('/report_likes') || path.includes('/place_videos')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (path.includes('/rpc/increment_report_view')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '2' });
    }
    if (path.includes('/reports')) {
      const slug = url.searchParams.get('slug');
      if (slug === 'eq.rome-travelogue') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(EDITORIAL),
        });
      }
      const placeSlug = url.searchParams.get('place_slug');
      if (placeSlug === 'eq.rome') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FX.placeSlugRows),
        });
      }
      if (url.searchParams.get('location') || String(url.searchParams.get('or') || '').includes('location')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FX.placeSlugRows),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await context.route(/https?:\/\/(?:[^/]+\.)?(?:mapbox\.com|unsplash\.com|googleapis\.com|visitkorea\.or\.kr)\//i, (route) => {
    const type = route.request().resourceType();
    if (type === 'image') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

async function openReader(page) {
  await page.goto(READER_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: EDITORIAL.title })).toBeVisible({ timeout: 45_000 });
}

async function alignWindowLink(page, link) {
  await link.evaluate((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo(0, Math.max(160, top));
  });
  return page.evaluate(() => window.scrollY || document.documentElement.scrollTop || 0);
}

async function expectWindowScroll(page, before) {
  await expect.poll(async () => {
    const y = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop || 0);
    return Math.abs(y - before);
  }, { timeout: 8_000 }).toBeLessThanOrEqual(48);
}

async function openFestivalFrom(page, link) {
  await link.click();
  await expect(page).toHaveURL(new RegExp(`festival=${FESTIVAL_ID}`), { timeout: 30_000 });
  await expect(page.locator('#korea-festival-sheet-title')).toContainText(FESTIVAL_TITLE, { timeout: 30_000 });
}

async function clickFestivalClose(page) {
  await page.locator('body > button[aria-label="닫기"]').click();
}

async function shot(page, testInfo, name) {
  if (!/webkit/i.test(testInfo.project.name)) return;
  mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: join(SHOT_DIR, `${name}.png`),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

test.describe('article festival and place back', () => {
  test.beforeEach(async ({ context }) => {
    const gemini = { count: 0 };
    context._gemini = gemini;
    await installMocks(context, gemini);
  });

  test.afterEach(async ({ context }) => {
    expect(context._gemini.count).toBe(0);
  });

  test('editorial festival X and browser back restore the article scroll', async ({ page }, testInfo) => {
    const errors = attachDiagnostics(page);
    await openReader(page);
    const link = page.locator('.logbook-body a', { hasText: FESTIVAL_LABEL });
    await expect(link).toBeVisible();
    const articleKey = urlKey(page.url());
    const before = await alignWindowLink(page, link);
    expect(before).toBeGreaterThan(80);
    await openFestivalFrom(page, link);
    await clickFestivalClose(page);
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    expect(urlKey(page.url())).toBe(articleKey);
    await expect(page.getByRole('heading', { name: EDITORIAL.title })).toBeVisible();
    await expectWindowScroll(page, before);
    await shot(page, testInfo, 'webkit-article-festival-x');

    await openFestivalFrom(page, link);
    await page.goBack();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    expect(urlKey(page.url())).toBe(articleKey);
    await expectWindowScroll(page, before);
    await shot(page, testInfo, 'webkit-article-festival-back');
    expectErrorsClean(errors);
  });

  test('editorial place link screen back and browser back restore the article', async ({ page }, testInfo) => {
    const errors = attachDiagnostics(page);
    await openReader(page);
    const link = page.locator('.logbook-body a', { hasText: PLACE_LABEL });
    await expect(link).toBeVisible();
    const articleKey = urlKey(page.url());
    const before = await alignWindowLink(page, link);
    expect(before).toBeGreaterThan(80);
    await link.click();
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 30_000 });
    const chrome = page.locator('[data-place-chrome-hit]');
    await expect(chrome).toBeVisible({ timeout: 30_000 });
    await chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i }).click();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    expect(urlKey(page.url())).toBe(articleKey);
    await expectWindowScroll(page, before);
    await shot(page, testInfo, 'webkit-article-place-back');

    await link.click();
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 30_000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    expect(urlKey(page.url())).toBe(articleKey);
    await expectWindowScroll(page, before);
    expectErrorsClean(errors);
  });

  test('review body festival X and place back restore the review scroll', async ({ page }, testInfo) => {
    const errors = attachDiagnostics(page);
    await page.goto(REVIEWS_PATH, { waitUntil: 'domcontentloaded' });
    const toggle = page.locator('[data-review-expand-toggle]').first();
    await expect(toggle).toBeVisible({ timeout: 45_000 });
    await toggle.click();
    const festival = page.locator('[data-review-body] a', { hasText: FESTIVAL_LABEL }).first();
    await expect(festival).toBeVisible({ timeout: 30_000 });
    const beforeKey = urlKey(page.url());
    expect(beforeKey).toContain('/place/rome/reviews');
    await festival.evaluate((el) => {
      const root = document.querySelector('[data-place-reviews-scroll-root]');
      const delta = el.getBoundingClientRect().top - root.getBoundingClientRect().top - 120;
      root.scrollTop += delta;
    });
    await page.evaluate(() => {
      window.__reviewScrollAtClick = null;
      document.addEventListener('click', () => {
        const root = document.querySelector('[data-place-reviews-scroll-root]');
        window.__reviewScrollAtClick = root ? root.scrollTop : 0;
      }, { capture: true, once: true });
    });
    await openFestivalFrom(page, festival);
    const beforeTop = await page.evaluate(() => window.__reviewScrollAtClick || 0);
    expect(beforeTop).toBeGreaterThan(80);
    await clickFestivalClose(page);
    await expect(page).toHaveURL(/\/place\/rome\/reviews/, { timeout: 30_000 });
    expect(urlKey(page.url())).toBe(beforeKey);
    await expect.poll(async () => {
      const top = await page.evaluate(() => document.querySelector('[data-place-reviews-scroll-root]')?.scrollTop || 0);
      return Math.abs(top - beforeTop);
    }, { timeout: 8_000 }).toBeLessThanOrEqual(48);
    await shot(page, testInfo, 'webkit-review-festival-x');

    const place = page.locator('[data-review-body] a', { hasText: PLACE_LABEL }).first();
    await place.click();
    await expect(page).toHaveURL(/\/place\/rome(?!\/reviews)/, { timeout: 30_000 });
    const chrome = page.locator('[data-place-chrome-hit]');
    await expect(chrome).toBeVisible({ timeout: 30_000 });
    await chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i }).click();
    await expect(page).toHaveURL(/\/place\/rome\/reviews/, { timeout: 30_000 });
    expect(urlKey(page.url())).toBe(beforeKey);
    await expect.poll(async () => {
      const top = await page.evaluate(() => document.querySelector('[data-place-reviews-scroll-root]')?.scrollTop || 0);
      return Math.abs(top - beforeTop);
    }, { timeout: 8_000 }).toBeLessThanOrEqual(48);
    expectErrorsClean(errors);
  });

  test('festival home and a direct deeplink still close onto the festival home', async ({ page }, testInfo) => {
    const errors = attachDiagnostics(page);
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    const card = page.locator(`[data-festival-id="${FESTIVAL_ID}"]`);
    await expect(card).toBeVisible({ timeout: 45_000 });
    await card.click();
    await expect(page).toHaveURL(new RegExp(`festival=${FESTIVAL_ID}`), { timeout: 30_000 });
    await expect(page.locator('#korea-festival-sheet-title')).toContainText(FESTIVAL_TITLE);
    await clickFestivalClose(page);
    await expect(page).toHaveURL(/\/korea\/?(?:\?|$)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/festival=/);
    await expect(page.locator('#korea-festival-sheet-title')).toHaveCount(0);
    await shot(page, testInfo, 'webkit-korea-home-after-close');

    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#korea-festival-sheet-title')).toContainText(FESTIVAL_TITLE, { timeout: 30_000 });
    await clickFestivalClose(page);
    await expect(page).toHaveURL(/\/korea\/?(?:\?|$)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/festival=/);
    await expect(page.locator('#korea-festival-sheet-title')).toHaveCount(0);

    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await page.evaluate((id) => {
      window.location.assign(`/korea/?festival=${id}`);
    }, FESTIVAL_ID);
    await expect(page).toHaveURL(new RegExp(`festival=${FESTIVAL_ID}`), { timeout: 30_000 });
    await expect(page.locator('#korea-festival-sheet-title')).toContainText(FESTIVAL_TITLE, { timeout: 30_000 });
    await clickFestivalClose(page);
    await expect(page).toHaveURL(/\/korea\/?(?:\?|$)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/festival=/);
    await expect(page).not.toHaveURL(/\/explore/);
    expectErrorsClean(errors);
  });
});
