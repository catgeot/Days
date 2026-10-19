import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = join(process.cwd(), 'docs/qa/place-travelogue-card-v2');
const VIEWPORT = { width: 390, height: 844 };
const manifest = [];
let brokenImages = 0;

const OTHER_REGION_TITLES = [
  '붉게 물든 짜오프라야',
  '브라질 첫 케이블카를 타고',
  '사막이 강을 만나는 곳',
  '하버가 불을 켤 때',
  '새벽 카를교에서 맥주홀까지',
  '미로 끝의 푸른 바람',
];

const PLACES = [
  { query: '리우데자네이루', match: /리우데자네이루/, slug: 'rio-de-janeiro', filePrefix: 'rio', title: '브라질 첫 케이블카를 타고' },
  { query: '방콕', match: /방콕/, slug: 'bangkok', filePrefix: 'bangkok', title: '붉게 물든 짜오프라야' },
  { query: '제주', match: /제주/, slug: 'jeju', filePrefix: 'jeju', title: '장날 아침, 사라봉 저녁' },
];

async function shot(page, file, meta = {}) {
  await expect(page.getByText('모바일 위젯 로그')).toHaveCount(0);
  await expect(page.getByText('작업 로그')).toHaveCount(0);
  const broken = await page.evaluate(() => {
    return [...document.querySelectorAll('img')].filter((img) => {
      const style = getComputedStyle(img);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (Number.parseFloat(style.opacity) === 0) return false;
      const rect = img.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      return img.complete && img.naturalWidth === 0;
    }).length;
  });
  brokenImages += broken;
  const path = join(OUT, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  manifest.push({ file, broken, ...meta });
  expect(broken, `${file} broken images`).toBe(0);
}

async function openPlaceFromHome(page, query, match, slug) {
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
  await expect(page).toHaveURL(new RegExp(`/place/${slug}(?:[/?#]|$)`), { timeout: 60_000 });
  await expect(page.locator('[data-search-popover]')).toHaveCount(0);
}

async function waitForCardThumbs(card) {
  const images = card.locator('[data-place-travelogue-thumb="image"]');
  await expect(images.first()).toBeVisible({ timeout: 30_000 });
  await images.evaluateAll((imgs) => Promise.all(imgs.map((img) => {
    if (img.complete && img.naturalWidth > 0) return undefined;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('thumbnail did not load')), 20_000);
      img.addEventListener('load', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      img.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('thumbnail failed'));
      }, { once: true });
    });
  })));
  await expect(card).not.toContainText('불러오는');
}

async function waitForTravelogueBody(page) {
  await expect(page.getByText(/파편을 불러오는/)).toHaveCount(0, { timeout: 90_000 });
  const body = page.locator('.logbook-body');
  await expect(body).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => (await body.innerText()).trim().length, { timeout: 30_000 }).toBeGreaterThan(80);
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')];
    await Promise.all(imgs.map((img) => {
      img.loading = 'eager';
      if (img.complete && img.naturalWidth > 0) return undefined;
      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, 12_000);
      });
    }));
    window.scrollTo(0, 0);
  });
}

test.describe('Place travelogue card QA v2 — WebKit 390 prod data', () => {
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
      await openPlaceFromHome(page, place.query, place.match, place.slug);
      await expect(page.getByText(place.query).first()).toBeVisible({ timeout: 30_000 });
      await shot(page, `${place.filePrefix}-01-place-overview.png`, { step: 'place overview' });

      const card = page.locator('[data-place-travelogue-card]:visible');
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible({ timeout: 90_000 });
      await expect(card).toContainText(place.title);
      await waitForCardThumbs(card);
      await shot(page, `${place.filePrefix}-02-travelogue-card.png`, { step: 'travelogue card, thumbnail loaded' });

      if (place.slug === 'jeju') {
        const slugs = await card.locator('[data-place-travelogue-item]').evaluateAll((nodes) => (
          nodes.map((node) => node.getAttribute('data-place-travelogue-slug'))
        ));
        expect(slugs.length).toBeGreaterThan(0);
        expect(slugs.every((slug) => slug === 'jeju-travelogue')).toBe(true);
        for (const title of OTHER_REGION_TITLES) {
          await expect(card).not.toContainText(title);
        }
        await shot(page, 'jeju-04-no-wrong-region.png', {
          step: 'Jeju card slugs are jeju-travelogue only',
          slugs: slugs.join(','),
        });
      }

      await page.locator('[data-place-travelogue-item]:visible').first().click();
      await expect(page).toHaveURL(/\/blog\/e\//, { timeout: 60_000 });
      await waitForTravelogueBody(page);
      await shot(page, `${place.filePrefix}-03-travelogue-open.png`, { step: 'travelogue body rendered' });
    });
  }

  test('cairo: travelogue does not overlap visit stories', async ({ page }) => {
    await openPlaceFromHome(page, '카이로', /카이로/, 'cairo');
    const visibleStories = page.locator('[data-visit-stories]:visible');
    await visibleStories.scrollIntoViewIfNeeded();
    await expect(visibleStories).toBeVisible({ timeout: 90_000 });
    await expect(visibleStories).toContainText('사막이 강을 만나는 곳');

    await expect(visibleStories).toHaveCount(1);
    await expect(visibleStories.getByText('사막이 강을 만나는 곳', { exact: true })).toHaveCount(1);
    const visibleCard = page.locator('[data-place-travelogue-card]:visible');
    if (await visibleCard.count()) {
      await expect(visibleCard).not.toContainText('사막이 강을 만나는 곳');
    }
    const storyTitles = (await visibleStories.locator('[data-visit-story-title]').allTextContents()).map((title) => title.trim());
    const cardTitles = (await visibleCard.locator('h3').allTextContents()).map((title) => title.trim());
    const overlap = storyTitles.filter((title) => cardTitles.includes(title));
    expect(overlap).toEqual([]);

    await shot(page, 'cairo-01-no-visit-story-overlap.png', {
      step: 'Cairo visit stories without a duplicate travelogue card row',
      storyTitles: storyTitles.join(' | '),
      cardTitles: cardTitles.join(' | '),
    });
  });

  test.afterAll(async () => {
    if (!manifest.length) return;
    const lines = [
      '# Place travelogue card v2 — QA captures',
      '',
      `Broken images across captures: **${brokenImages}**`,
      '',
      '| File | Step | Broken imgs |',
      '| --- | --- | --- |',
      ...manifest.map((row) => `| ${row.file} | ${row.step || ''} | ${row.broken ?? ''} |`),
      '',
      'Captured with `VITE_GATEO_PLACE_TRAVELOGUE_CARD=1`, production data read-only, WebKit 390×844, `deviceScaleFactor: 1`.',
      'Path: home → search → place overview → card (thumbnail loaded) → travelogue body (loading copy gone).',
      '',
    ];
    await writeFile(join(OUT, 'README.md'), lines.join('\n'), 'utf8');
  });
});
