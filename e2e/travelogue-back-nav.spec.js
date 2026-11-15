import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const FX = JSON.parse(readFileSync(join(__dir, 'fixtures/rome-travelogue-fullpage.json'), 'utf8'));

const PLACE_PATH = '/place/rome?lang=ko';
const READER_PATH = '/blog/e/rome-travelogue?lang=ko';
const SHORT_PATH = '/p/e2e-short-rome';

const INTERNAL_LABEL = '콜로세움 장소';
const EXTERNAL_LABEL = '외부 안내';
const BODY = [
  '로마 E2E 기행문 본문입니다.',
  '',
  `${'포로 로마노를 따라 걷는 문단입니다. '.repeat(40)}`,
  '',
  `[${INTERNAL_LABEL}](/place/rome?lang=ko)`,
  '',
  `[게이트오 절대경로](https://www.gateo.kr/place/rome)`,
  '',
  `[호스트만](gateo.kr/place/rome)`,
  '',
  `[${EXTERNAL_LABEL}](https://example.com/guide)`,
  '',
  `${'이어지는 문단입니다. '.repeat(20)}`,
].join('\n');

const EDITORIAL = {
  ...FX.editorialReport,
  content: BODY,
};

const SHORT_REPORT = {
  id: 'e2e-short-rome',
  title: 'E2E 짧은 기록',
  content: `짧은 글 [내부](/place/rome?lang=ko) 와 [외부](https://example.com/guide).`,
  date: '2026-11-13',
  location: '로마',
  images: [],
  is_public: true,
  is_deleted: false,
  is_editorial: false,
  slug: null,
  status: 'published',
  user_id: null,
  view_count: 1,
  like_count: 0,
  comment_count: 0,
};

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

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
    (e) => !/access control checks|Fetch API cannot load/i.test(e.message || ''),
  );
  expect(fatal, JSON.stringify(errors, null, 2)).toHaveLength(0);
}

async function installMocks(context) {
  await context.route(/supabase\.co/, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (route.request().method() !== 'GET' && !path.includes('/rpc/')) {
      return route.fulfill({ status: 405, contentType: 'application/json', body: '{}' });
    }
    if (path.includes('/auth/v1')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: null }) });
    }
    if (path.includes('/report_comments') || path.includes('/report_likes') || path.includes('/place_videos')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (path.includes('/place_reviews')) {
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
      const id = url.searchParams.get('id');
      if (id === 'eq.e2e-short-rome') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SHORT_REPORT),
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
  await context.route('https://images.unsplash.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  );
  await context.route('https://www.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

function placeUrlKey(url) {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

async function openPlace(page) {
  await page.goto(PLACE_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/place\/rome/, { timeout: 45_000 });
  const card = page.locator('[data-place-travelogue-slug="rome-travelogue"]');
  await expect(card).toBeVisible({ timeout: 45_000 });
  return placeUrlKey(page.url());
}

async function openReader(page) {
  await page.goto(READER_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: EDITORIAL.title })).toBeVisible({ timeout: 30_000 });
}

async function clickScreenBack(page) {
  await page.locator('[data-logbook-detail-back]').click();
}

async function clickPlaceScreenBack(page) {
  const chrome = page.locator('[data-place-chrome-hit]');
  await expect(chrome).toBeVisible({ timeout: 30_000 });
  await chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i }).click();
}

test.describe('travelogue back and in-body links', () => {
  test.beforeEach(async ({ context }) => {
    await installMocks(context);
  });

  test('place card → reader ← returns to the same place URL; browser back too', async ({ page }) => {
    const errors = attachDiagnostics(page);
    const placeKey = await openPlace(page);
    await page.locator('[data-place-travelogue-slug="rome-travelogue"]').click();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: EDITORIAL.title })).toBeVisible({ timeout: 30_000 });
    await clickScreenBack(page);
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 30_000 });
    expect(placeUrlKey(page.url())).toBe(placeKey);

    const again = await openPlace(page);
    await page.locator('[data-place-travelogue-slug="rome-travelogue"]').click();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 30_000 });
    expect(placeUrlKey(page.url())).toBe(again);
    expectErrorsClean(errors);
  });

  test('internal place link stays in this tab and both backs return to the reader', async ({ page }) => {
    const errors = attachDiagnostics(page);
    await openReader(page);
    const internal = page.locator('.logbook-body a', { hasText: INTERNAL_LABEL });
    await expect(internal).toBeVisible();
    await expect(internal).toHaveAttribute('href', '/place/rome?lang=ko');
    expect(await internal.getAttribute('target')).toBeNull();
    await internal.scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    let popped = false;
    page.once('popup', () => {
      popped = true;
    });
    await internal.click();
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 45_000 });
    expect(popped).toBe(false);
    expect(page.context().pages()).toHaveLength(1);
    await clickPlaceScreenBack(page);
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: EDITORIAL.title })).toBeVisible({ timeout: 30_000 });
    if (scrollBefore > 40) {
      await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeGreaterThan(40);
    }

    await openReader(page);
    await page.locator('.logbook-body a', { hasText: INTERNAL_LABEL }).click();
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 45_000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: EDITORIAL.title })).toBeVisible();
    expectErrorsClean(errors);
  });

  test('browser back to the reader, then place ← does not return to the reader', async ({ page }) => {
    const errors = attachDiagnostics(page);
    await openPlace(page);
    await page.locator('[data-place-travelogue-slug="rome-travelogue"]').click();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    await page.locator('.logbook-body a', { hasText: INTERNAL_LABEL }).click();
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 45_000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('gateo:logbook-reader-origin'))).toBeNull();
    await clickScreenBack(page);
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 30_000 });
    await clickPlaceScreenBack(page);
    await expect(page).toHaveURL(/\/($|\?)/, { timeout: 30_000 });
    expect(new URL(page.url()).pathname).toBe('/');
    expect(page.url()).not.toContain('/blog/e/');
    expectErrorsClean(errors);
  });

  test('place screen ← from an internal link, then place ← does not return to the reader', async ({ page }) => {
    const errors = attachDiagnostics(page);
    await openPlace(page);
    await page.locator('[data-place-travelogue-slug="rome-travelogue"]').click();
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    await page.locator('.logbook-body a', { hasText: INTERNAL_LABEL }).click();
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 45_000 });
    await clickPlaceScreenBack(page);
    await expect(page).toHaveURL(/\/blog\/e\/rome-travelogue/, { timeout: 30_000 });
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('gateo:logbook-reader-origin'))).toBeNull();
    await clickScreenBack(page);
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 30_000 });
    await clickPlaceScreenBack(page);
    await expect(page).toHaveURL(/\/($|\?)/, { timeout: 30_000 });
    expect(new URL(page.url()).pathname).toBe('/');
    expect(page.url()).not.toContain('/blog/e/');
    expectErrorsClean(errors);
  });

  test('direct reader load ← goes to /blog', async ({ page }) => {
    const errors = attachDiagnostics(page);
    await openReader(page);
    await clickScreenBack(page);
    await expect(page).toHaveURL(/\/blog(?:\?|$)/, { timeout: 30_000 });
    expect(page.url()).not.toMatch(/\/place\//);
    expectErrorsClean(errors);
  });

  test('external link stays target=_blank and short posts share the renderer', async ({ page }) => {
    const errors = attachDiagnostics(page);
    await openReader(page);
    const external = page.locator('.logbook-body a', { hasText: EXTERNAL_LABEL });
    await expect(external).toHaveAttribute('href', 'https://example.com/guide');
    await expect(external).toHaveAttribute('target', '_blank');
    await expect(external).toHaveAttribute('rel', /noopener/);
    await expect(external).toHaveAttribute('rel', /noreferrer/);
    const absolute = page.locator('.logbook-body a', { hasText: '게이트오 절대경로' });
    await expect(absolute).toHaveAttribute('href', '/place/rome');
    expect(await absolute.getAttribute('target')).toBeNull();
    const hostOnly = page.locator('.logbook-body a', { hasText: '호스트만' });
    await expect(hostOnly).toHaveAttribute('href', '/place/rome');
    expect(await hostOnly.getAttribute('target')).toBeNull();

    await page.goto(SHORT_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: SHORT_REPORT.title })).toBeVisible({ timeout: 30_000 });
    const shortInternal = page.locator('.logbook-body a', { hasText: '내부' });
    const shortExternal = page.locator('.logbook-body a', { hasText: '외부' });
    await expect(shortInternal).toHaveAttribute('href', '/place/rome?lang=ko');
    expect(await shortInternal.getAttribute('target')).toBeNull();
    await expect(shortExternal).toHaveAttribute('target', '_blank');
    await expect(shortExternal).toHaveAttribute('rel', 'noopener noreferrer');
    expectErrorsClean(errors);
  });
});
