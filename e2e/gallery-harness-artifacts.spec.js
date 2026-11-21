/**
 * Fixture-only: PR 브랜치 빌드(dist/gallery-writer-harness) 캡처용. 검증 assertion 최소.
 */
import { test } from '@playwright/test';

const MOCK_ORIGIN = 'https://gallery-writer-mock.invalid';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function photo(id) {
  return {
    id,
    width: 1600,
    height: 1000,
    urls: {
      small: `https://images.unsplash.com/${id}/small`,
      regular: `https://images.unsplash.com/${id}/regular`,
      full: `https://images.unsplash.com/${id}/full`,
    },
    user: { name: 'Tester' },
    links: { html: `https://unsplash.com/photos/${id}` },
  };
}

const cors = {
  'access-control-allow-origin': '*',
  'content-type': 'application/json',
};

async function installGridMock(page) {
  const stored = Array.from({ length: 8 }, (_, i) => photo(`cap-${i + 1}`));
  await page.route(/phdjnbfitvmrguqzverm/, (r) => r.abort());
  await page.route('https://images.unsplash.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  );
  await page.route('https://api.unsplash.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) }),
  );
  await page.route('https://api.pexels.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ photos: [] }) }),
  );
  await page.route(`${MOCK_ORIGIN}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors });
    }
    if (url.pathname.includes('/rest/v1/place_stats') && req.method() === 'GET') {
      return route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify([{ place_id: 'qa-gallery-writer', gallery_urls: stored }]),
      });
    }
    if (url.pathname.includes('/rpc/') || url.pathname.includes('/functions/')) {
      return route.fulfill({ status: 200, headers: cors, body: 'null' });
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
}

test.describe('gallery harness screenshots', () => {
  test('save 1280 and 390 fixtures', async ({ page }, testInfo) => {
    testInfo.annotations.push({
      type: 'fixture',
      description: 'VITE_GALLERY_WRITER_HARNESS build + mock place_stats; not PROD',
    });
    await installGridMock(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/qa/gallery-single-writer');
    await page.waitForSelector('.break-inside-avoid', { timeout: 45_000 });
    await page.screenshot({
      path: '/opt/cursor/artifacts/pr682-gallery-harness-1280.png',
      fullPage: false,
    });

    await page.setViewportSize({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.screenshot({
      path: '/opt/cursor/artifacts/pr682-gallery-harness-390.png',
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });
});
