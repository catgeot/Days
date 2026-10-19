import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { buildGalleryStockRelevanceTokens } from '../src/utils/galleryStockRelevance.js';

const OUT_DIR = '/opt/cursor/artifacts/korea-gallery-r2';
const NOTES_PATH = join(OUT_DIR, 'NOTES.md');

const PLACES = [
  { query: '양구', cardName: '양구', key: 'yanggu' },
  { query: '곡성', cardName: '곡성', key: 'gokseong' },
  { query: '남한산성', cardName: '남한산성', key: 'namhansanseong' },
  { query: '청주', cardName: '청주', key: 'cheongju' },
  { query: '한반도섬', cardName: '한반도섬', key: 'hanbando', parentPlaceTokens: ['yanggu'] },
  { query: '두타연', cardName: '두타연', key: 'dutayeon', parentPlaceTokens: ['yanggu'] },
  { query: '카이로', cardName: '카이로', key: 'cairo' },
];

async function openHomeSearch(page) {
  const search = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations|Search on 3D globe/i })
    .first();
  await page.goto('/', { waitUntil: 'commit', timeout: 30_000 });
  await expect(search).toBeVisible({ timeout: 25_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  return page.locator('input[placeholder]:visible').first();
}

async function openPlaceFromSearch(page, { query, cardName }) {
  const input = await openHomeSearch(page);
  await input.fill('');
  await input.type(query, { delay: 25 });
  const row = page
    .locator('button')
    .filter({ has: page.getByText(cardName, { exact: false }) })
    .filter({ hasNotText: 'MOONi' })
    .first();
  await expect(row).toBeVisible({ timeout: 40_000 });
  await row.click();
  await expect(page).not.toHaveURL(/\/explore/, { timeout: 45_000 });
  const more = page.getByRole('button', { name: /^더보기$/ }).first();
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.waitForURL(/\/place\//, { timeout: 30_000 });
  }
}

function attachStockCounters(page, bag) {
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('api.unsplash.com/search/photos')) bag.unsplash += 1;
    if (url.includes('api.pexels.com/v1/search') || url.includes('pexels-proxy')) bag.pexels += 1;
  });
}

async function waitGallerySettled(page, startedAt) {
  const loading = page.getByText('사진을 불러오는 중', { exact: false });
  await expect
    .poll(
      async () => {
        const spinVisible = await loading.isVisible().catch(() => false);
        const busy = await page.locator('[aria-busy="true"]').count();
        return spinVisible || busy > 0 ? 1 : 0;
      },
      { timeout: 45_000 },
    )
    .toBe(0);
  return Date.now() - startedAt;
}

async function auditGrid(page) {
  return page.evaluate(() => {
    const tiles = [...document.querySelectorAll('.columns-2 > div')];
    const rows = tiles.map((tile) => {
      const img = tile.querySelector('img');
      const style = img ? getComputedStyle(img) : null;
      const rect = tile.getBoundingClientRect();
      const src = img?.currentSrc || img?.src || '';
      let source = 'other';
      if (/visitkorea|tong\.visitkorea/i.test(src)) source = 'tourapi';
      else if (/pexels/i.test(src)) source = 'pexels';
      else if (/unsplash/i.test(src)) source = 'unsplash';
      const loading = Boolean(
        tile.querySelector('.animate-pulse') && !(img?.complete && img.naturalWidth > 0),
      );
      const broken = Boolean(img?.complete && img.naturalWidth === 0);
      return {
        src,
        source,
        alt: img?.alt || '',
        opacity: style ? Number(style.opacity) : null,
        height: Math.round(rect.height),
        loading,
        broken,
      };
    });
    const bySource = rows.reduce((acc, row) => {
      acc[row.source] = (acc[row.source] || 0) + 1;
      return acc;
    }, {});
    return {
      count: rows.filter((r) => r.height > 8 && !r.broken).length,
      broken: rows.filter((r) => r.broken).length,
      loadingTiles: rows.filter((r) => r.loading).length,
      bySource,
      stockAlts: rows
        .filter((r) => r.source === 'unsplash' || r.source === 'pexels')
        .map((r) => r.alt)
        .filter(Boolean),
      rows,
    };
  });
}

async function scrollGalleryEnd(page) {
  const scroller = page.locator('.custom-scrollbar-blue').first();
  await expect(scroller).toBeAttached({ timeout: 20_000 });
  await scroller.evaluate((el) => {
    let last = -1;
    for (let i = 0; i < 24; i += 1) {
      el.scrollTop = el.scrollHeight;
      if (el.scrollTop === last) break;
      last = el.scrollTop;
    }
  });
}

async function shot(page, file, width) {
  await page.screenshot({
    path: join(OUT_DIR, file),
    clip: { x: 0, y: 0, width, height: page.viewportSize().height },
  });
}

test.describe('korea gallery r2 capture', () => {
  test.beforeAll(async () => {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(
      NOTES_PATH,
      `# Korea gallery R2 — ${new Date().toISOString()}\n\n`,
    );
  });

  for (const viewport of [
    { label: '390', width: 390, height: 844 },
    { label: '1280', width: 1280, height: 900 },
  ]) {
    for (const place of PLACES) {
      test(`${place.key} @${viewport.label}`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          locale: 'ko-KR',
        });
        const page = await context.newPage();
        const stockBag = { unsplash: 0, pexels: 0 };
        attachStockCounters(page, stockBag);

        await openPlaceFromSearch(page, place);
        const t0 = Date.now();
        const spinnerMs = await waitGallerySettled(page, t0);
        let audit = await auditGrid(page);
        const initialCount = audit.count;

        await scrollGalleryEnd(page);
        await shot(page, `${place.key}-${viewport.label}-initial.png`, viewport.width);

        const refresh = page.getByRole('button', { name: /더 많은 사진|추가 사진/ }).first();
        let afterMore = initialCount;
        if (await refresh.isVisible().catch(() => false)) {
          await refresh.click();
          await waitGallerySettled(page, Date.now());
          audit = await auditGrid(page);
          afterMore = audit.count;
          await scrollGalleryEnd(page);
          await shot(page, `${place.key}-${viewport.label}-after-more.png`, viewport.width);
        }

        const reentryBag = { unsplash: 0, pexels: 0 };
        const page2 = await context.newPage();
        attachStockCounters(page2, reentryBag);
        await openPlaceFromSearch(page2, place);
        await waitGallerySettled(page2, Date.now());

        const tokens = [
          ...buildGalleryStockRelevanceTokens({
            koreanName: place.cardName,
            englishName: '',
            parentPlaceTokens: place.parentPlaceTokens || [],
          }),
        ];
        const failSpinner = spinnerMs > 8000 ? 'FAIL' : 'PASS';
        const block = [
          `## ${place.key} @${viewport.label}`,
          `- search query: ${place.query}`,
          `- relevance tokens: ${tokens.length ? tokens.join(', ') : '(none)'}`,
          `- spinner end: ${spinnerMs}ms (${failSpinner})`,
          `- initial tiles: ${initialCount} · after 더보기: ${afterMore}`,
          `- by source: ${JSON.stringify(audit.bySource)}`,
          `- broken: ${audit.broken} · loading chrome tiles: ${audit.loadingTiles}`,
          `- stock alts: ${audit.stockAlts.length ? audit.stockAlts.join(' | ') : '(none)'}`,
          `- stock API 1st visit: unsplash=${stockBag.unsplash} pexels=${stockBag.pexels}`,
          `- stock API re-entry: unsplash=${reentryBag.unsplash} pexels=${reentryBag.pexels}`,
          `- url: ${page.url()}`,
          '',
        ].join('\n');
        await appendFile(NOTES_PATH, `${block}\n`);

        const emptyState = await page
          .getByText(/등록된 이미지|사진이 없|불러올 수 없/i)
          .isVisible()
          .catch(() => false);
        expect(
          spinnerMs <= 8000 || initialCount > 0 || emptyState,
          'spinner should finish within 8s or show grid/empty',
        ).toBe(true);

        await context.close();
      });
    }
  }
});
