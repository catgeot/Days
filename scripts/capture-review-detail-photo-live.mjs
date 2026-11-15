/**
 * Live Supabase (anon) captures — flags ON prod build preview.
 * Output: /opt/cursor/artifacts/review-detail-photo/
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { pickEditorialReviewHubThumb } from '../src/logbookOfficialReviews/editorialReviewHubThumb.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/review-detail-photo';
const baseHost = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4176';

const HWASEONG_ID = 'a9e7d546-7b70-47ce-bea1-362f36d12156';
const ROME_ID = '62212ddb-749e-4ef6-9fda-fa0326a52122';

mkdirSync(outDir, { recursive: true });

async function fetchEditorialRows(limit = 30) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY required');
  const res = await fetch(
    `${url}/rest/v1/place_reviews?is_editorial=eq.true&is_public=eq.true&select=id,place_slug,place_name,images&order=created_at.desc&limit=${limit}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  return res.json();
}

async function clipShot(page, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  return path;
}

async function waitReviewHero(page, reviewId, timeout = 90_000) {
  const card = page.locator(`[data-review-id="${reviewId}"]`);
  await card.getByTestId('logbook-editorial-review-detail-hero').waitFor({ timeout });
  await expectVisiblePhotoOrFallback(card);
}

async function expectVisiblePhotoOrFallback(card) {
  await Promise.race([
    card.getByTestId('logbook-editorial-review-detail-hero-photo').waitFor({ state: 'visible', timeout: 60_000 }),
    card.getByTestId('logbook-editorial-review-detail-hero-fallback').waitFor({ state: 'visible', timeout: 60_000 }),
  ]).catch(() => {});
}

async function captureReview(page, placeSlug, reviewId, fileStem, width) {
  await page.goto(
    `${baseHost}/place/${placeSlug}/reviews?review=${reviewId}`,
    { waitUntil: 'domcontentloaded', timeout: 120_000 },
  );
  await page.getByTestId('place-card-route-loading').waitFor({ state: 'hidden', timeout: 120_000 }).catch(() => {});
  await waitReviewHero(page, reviewId);
  return clipShot(page, `${fileStem}-${width}.png`, width);
}

async function captureBlogCards(page, width) {
  await page.goto(`${baseHost}/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=overseas`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 90_000 });
  await page.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-card-grid').waitFor({ timeout: 60_000 });
  return clipShot(page, `blog-review-cards-live-${width}.png`, width);
}

function buildThumbCompareTable(rows) {
  const picked = [];
  for (const row of rows) {
    const thumb = pickEditorialReviewHubThumb(row);
    if (thumb?.src) picked.push({ ...row, thumbSrc: thumb.src });
    if (picked.length >= 5) break;
  }
  const lines = [
    '| place_slug | review_id | card/detail thumb src (same rule) |',
    '|---|---|---|',
    ...picked.map(
      (r) => `| ${r.place_slug} | ${r.id} | ${r.thumbSrc} |`,
    ),
  ];
  return { picked, markdown: `${lines.join('\n')}\n` };
}

async function run() {
  const rows = await fetchEditorialRows();
  const { picked, markdown } = buildThumbCompareTable(rows);
  writeFileSync(join(outDir, 'thumb-compare-5.md'), markdown);

  const noPhoto =
    rows.find((r) => !Array.isArray(r.images) || r.images.length === 0) ?? null;

  const browser = await chromium.launch();
  const page = await browser.newPage({ ignoreHTTPSErrors: true, locale: 'ko-KR' });
  const manifest = { baseHost, data: 'live supabase anon read', captures: [], noPhoto };

  try {
    for (const width of [390, 1280]) {
      manifest.captures.push(await captureBlogCards(page, width));
      manifest.captures.push(
        await captureReview(page, 'hwaseong-fortress', HWASEONG_ID, 'hwaseong-review-detail-top-live', width),
      );
      manifest.captures.push(
        await captureReview(page, 'rome', ROME_ID, 'rome-review-detail-top-live', width),
      );
      if (noPhoto) {
        manifest.noPhoto = { id: noPhoto.id, slug: noPhoto.place_slug };
        manifest.captures.push(
          await captureReview(
            page,
            noPhoto.place_slug,
            noPhoto.id,
            'review-detail-no-photo-fallback-live',
            width,
          ),
        );
      }
      writeFileSync(join(outDir, `manifest-live-${width}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
    }
  } finally {
    await browser.close();
  }
  console.log(`Live captures in ${outDir}`);
  console.log(markdown);
}

await run();