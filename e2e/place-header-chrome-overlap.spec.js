import { test, expect } from '@playwright/test';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';

test.beforeEach(async ({ context }) => {
  await installExploreTourapiMock(context);
});

const PLACES = [
  { path: '/place/paris', koTitle: /파리/, enTitle: /Paris/i },
  {
    path: '/place/tour-127635',
    koTitle: /한라산|백록담|화구벽|국립공원|127635/,
    enTitle: /Hallasan|Baekrokdam|National Park|127635/i,
  },
];

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
];

function boxesOverlap(a, b, tolerance = 1) {
  return !(
    a.x + a.width <= b.x + tolerance ||
    b.x + b.width <= a.x + tolerance ||
    a.y + a.height <= b.y + tolerance ||
    b.y + b.height <= a.y + tolerance
  );
}

async function collectChromeBoxes(page, locale) {
  const bookmark =
    locale === 'mobile'
      ? page.getByTestId('place-header-bookmark').locator('button').first()
      : page.getByTestId('place-header-bookmark-desktop').locator('button').first();

  const targets = {
    back: page.getByRole('button', { name: /뒤로|Back/i }).first(),
    home: page.getByRole('button', { name: /홈|Home/i }).first(),
    bookmark,
    locale: page.getByTestId('place-header-locale-toggle').locator('button').first(),
    mooni: page.locator('.place-header-mooni-btn').first(),
    planner: page.getByRole('button', { name: /플래너|Planner|갤러리|Gallery/i }).first(),
  };

  const boxes = {};
  for (const [key, locator] of Object.entries(targets)) {
    await expect(locator).toBeVisible({ timeout: 60_000 });
    const box = await locator.boundingBox();
    expect(box, `${key} bounding box`).toBeTruthy();
    boxes[key] = box;
  }
  return boxes;
}

function assertNoPairwiseOverlap(boxes) {
  const names = Object.keys(boxes);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i];
      const b = names[j];
      expect(
        boxesOverlap(boxes[a], boxes[b]),
        `overlap ${a} vs ${b}: ${JSON.stringify(boxes[a])} / ${JSON.stringify(boxes[b])}`,
      ).toBe(false);
    }
  }
}

for (const place of PLACES) {
  for (const viewport of VIEWPORTS) {
    for (const lang of ['ko', 'en']) {
      test(`${place.path} @${viewport.width} lang=${lang} — header chrome icons do not overlap`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(`${place.path}?lang=${lang}`, { waitUntil: 'domcontentloaded' });
        const toggle = page.getByTestId('place-header-locale-toggle').locator('button').first();
        await expect(toggle).toBeVisible({ timeout: 60_000 });
        if (lang === 'ko') {
          await expect(page.getByRole('button', { name: place.koTitle }).first()).toBeVisible({
            timeout: 60_000,
          });
          await expect(toggle).toHaveText(/EN|영문/i);
        } else {
          await expect(toggle).toHaveText(/한|KO/i);
          const titlePattern = place.path.includes('paris') ? place.enTitle : place.koTitle;
          await expect(page.getByRole('button', { name: titlePattern }).first()).toBeVisible({
            timeout: 60_000,
          });
        }
        const bookmarkMode = viewport.width < 1024 ? 'mobile' : 'desktop';
        const boxes = await collectChromeBoxes(page, bookmarkMode);
        assertNoPairwiseOverlap(boxes);
      });
    }
  }
}
