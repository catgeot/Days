import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = join(process.cwd(), 'docs/qa/place-travelogue-card');
const VIEWPORT = { width: 390, height: 844 };
const manifest = [];

const PLACES = [
  { query: '리우데자네이루', match: /리우|Rio/i, slug: 'rio-de-janeiro', filePrefix: 'rio' },
  { query: '방콕', match: /방콕|Bangkok/i, slug: 'bangkok', filePrefix: 'bangkok' },
  { query: '제주', match: /제주|Jeju/i, slug: 'jeju', filePrefix: 'jeju' },
];

async function shot(page, file, meta = {}) {
  const path = join(OUT, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  manifest.push({ file, ...meta });
}

async function openPlaceFromHome(page, query, match) {
  await page.goto('/?lang=ko', { waitUntil: 'domcontentloaded' });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 120_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill(query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: match })
    .first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.click();
}

test.describe('Place travelogue card QA — WebKit 390 prod data', () => {
  test.skip(
    !process.env.PLACE_TRAVELOGUE_QA_CAPTURE,
    'Set PLACE_TRAVELOGUE_QA_CAPTURE=1 after building with VITE_GATEO_PLACE_TRAVELOGUE_CARD=1',
  );

  test.use({
    ignoreHTTPSErrors: true,
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  test.setTimeout(420_000);

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  for (const place of PLACES) {
    test(`${place.filePrefix}: home → place → card → travelogue`, async ({ page }) => {
      await openPlaceFromHome(page, place.query, place.match);
      await expect(page).toHaveURL(new RegExp(`/place/${place.slug}`), { timeout: 60_000 });

      await shot(page, `${place.filePrefix}-01-place-overview.png`, { step: 'place overview' });

      const card = page.locator('[data-place-travelogue-card]:visible');
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible({ timeout: 90_000 });
      await shot(page, `${place.filePrefix}-02-travelogue-card.png`, { step: 'travelogue card' });

      await page.locator('[data-place-travelogue-item]:visible').first().click();
      await expect(page).toHaveURL(/\/blog\/e\//, { timeout: 60_000 });
      await shot(page, `${place.filePrefix}-03-travelogue-open.png`, { step: 'travelogue article' });
    });
  }

  test.afterAll(async () => {
    if (!manifest.length) return;
    const lines = [
      '# Place travelogue card — QA captures',
      '',
      '| File | Step |',
      '| --- | --- |',
      ...manifest.map((row) => `| ${row.file} | ${row.step || ''} |`),
      '',
      'Captured with `VITE_GATEO_PLACE_TRAVELOGUE_CARD=1`, WebKit 390×844, `deviceScaleFactor: 1`.',
      '',
    ];
    await writeFile(join(OUT, 'README.md'), lines.join('\n'), 'utf8');
  });
});
