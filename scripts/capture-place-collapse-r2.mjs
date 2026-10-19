#!/usr/bin/env node
/**
 * Place collapse QA round 2 — user flows + main vs branch gallery load parity.
 *
 *   BRANCH_URL=https://127.0.0.1:4173 MAIN_URL=https://127.0.0.1:4174 \
 *     node scripts/capture-place-collapse-r2.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.PLACE_COLLAPSE_R2_OUT || '/opt/cursor/artifacts/place-collapse/r2';
const BRANCH_URL = (process.env.BRANCH_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const MAIN_URL = (process.env.MAIN_URL || '').replace(/\/?$/, '/');
const IMAGE_WAIT_MS = Number(process.env.GALLERY_IMAGE_WAIT_MS || 8000);

const MOCK_USER_ID = 'qa-place-collapse-user';
const MOCK_REVIEW_TEXT =
  'QA stub: 카이로 플라자에서의 저녁 산책이 인상적이었습니다. 다녀온 이야기 펼침 확인용.';

function discoverSupabaseUrl() {
  if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
  const assetsDir = join(root, 'dist/assets');
  if (!existsSync(assetsDir)) return null;
  for (const name of readdirSync(assetsDir)) {
    if (!name.endsWith('.js')) continue;
    const text = readFileSync(join(assetsDir, name), 'utf8');
    const match = text.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
    if (match) return match[0];
  }
  return null;
}

function authStorageKey(supabaseUrl) {
  const ref = new URL(supabaseUrl).hostname.split('.')[0];
  return `sb-${ref}-auth-token`;
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'content-type': 'application/json',
  };
}

async function clipShot(page, fileName) {
  const { width = 390, height = 844 } = page.viewportSize() || {};
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width, height },
  });
}

async function waitGalleryImagesLoaded(page, timeoutMs = IMAGE_WAIT_MS) {
  const started = Date.now();
  let last = { imgCount: 0, loaded: 0, complete: 0 };
  while (Date.now() - started < timeoutMs) {
    last = await page.evaluate(() => {
      const root = document.querySelector('[data-place-gallery-scroll]');
      if (!root) return { imgCount: 0, loaded: 0, complete: 0 };
      const imgs = [...root.querySelectorAll('img')];
      const loaded = imgs.filter((img) => img.complete && img.naturalWidth > 0).length;
      const complete = imgs.filter((img) => img.complete).length;
      return { imgCount: imgs.length, loaded, complete };
    });
    if (last.imgCount >= 2 && last.loaded >= 2) {
      return { ...last, elapsedMs: Date.now() - started, timedOut: false };
    }
    await page.waitForTimeout(250);
  }
  return { ...last, elapsedMs: Date.now() - started, timedOut: true };
}

async function openCairoFromHomeSearch(page, baseURL) {
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 120_000 });
  await search.click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.waitFor({ state: 'visible' });
  await input.fill('카이로');
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: '카이로여행지' })
    .first();
  await row.waitFor({ state: 'visible', timeout: 30_000 });
  await row.click();
  await page.waitForURL(/\/place\/cairo/, { timeout: 60_000 });
  await page.locator('[data-place-gallery-scroll]').waitFor({ state: 'attached', timeout: 120_000 });
}

async function installReviewMocks(page, supabaseUrl) {
  const headers = corsHeaders();
  const mockReviews = [];
  const storageKey = authStorageKey(supabaseUrl);
  const session = {
    access_token: 'qa-place-collapse-token',
    refresh_token: 'qa-place-collapse-refresh',
    expires_in: 86_400,
    expires_at: Math.floor(Date.now() / 1000) + 86_400,
    token_type: 'bearer',
    user: {
      id: MOCK_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'qa-place-collapse@gateo.test',
    },
  };

  await page.addInitScript(({ storageKey: key, session: sess }) => {
    localStorage.setItem(key, JSON.stringify(sess));
  }, { storageKey, session });

  await page.route(/\.supabase\.co\//i, async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }

    if (url.includes('/auth/v1/')) {
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          ...session,
          user: session.user,
        }),
      });
    }

    if (url.includes('/rest/v1/reports')) {
      if (method === 'GET' || method === 'HEAD') {
        return route.fulfill({ status: 200, headers, body: '[]' });
      }
    }

    if (url.includes('/rest/v1/place_reviews')) {
      if (method === 'GET' || method === 'HEAD') {
        const range = mockReviews.length;
        return route.fulfill({
          status: 200,
          headers: {
            ...headers,
            'content-range': `0-${range > 0 ? range - 1 : 0}/${range}`,
          },
          body: JSON.stringify(mockReviews),
        });
      }
      if (method === 'POST') {
        const payload = JSON.parse(req.postData() || '[]');
        const row = Array.isArray(payload) ? payload[0] : payload;
        const created = {
          id: `mock-review-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          place_slug: row.place_slug || 'cairo',
          place_name: row.place_name || '카이로',
          user_id: MOCK_USER_ID,
          is_public: row.is_public !== false,
          is_editorial: false,
          content: row.content || MOCK_REVIEW_TEXT,
          content_blocks: row.content_blocks ?? null,
          persona_label: null,
          rating: row.rating ?? 5,
          images: row.images ?? [],
          views_count: 0,
          user: {
            id: MOCK_USER_ID,
            display_name: 'QA Traveler',
            avatar_url: null,
          },
          likes: [],
        };
        mockReviews.unshift(created);
        return route.fulfill({ status: 201, headers, body: JSON.stringify(created) });
      }
      if (method === 'PATCH' || method === 'DELETE') {
        return route.fulfill({ status: 200, headers, body: '{}' });
      }
    }

    return route.continue();
  });
}

async function captureUserEntryCollapsed(page, baseURL, tag) {
  await openCairoFromHomeSearch(page, baseURL);
  const facts = page.getByRole('button', { name: /현지 정보/ }).first();
  await facts.waitFor({ state: 'visible', timeout: 60_000 });
  const stories = page.getByRole('button', { name: /다녀온 이야기/ });
  await stories.first().waitFor({ state: 'visible', timeout: 90_000 }).catch(() => {});
  const factsExpanded = await facts.getAttribute('aria-expanded');
  const storiesVisible = await stories.first().isVisible().catch(() => false);
  let storiesExpanded = null;
  if (storiesVisible) {
    storiesExpanded = await stories.first().getAttribute('aria-expanded');
  }
  await clipShot(page, `cairo-user-entry-collapsed-${tag}.png`);
  return { factsExpanded, storiesExpanded, storiesVisible };
}

async function captureReviewReturnFlow(page, baseURL, supabaseUrl, tag) {
  await installReviewMocks(page, supabaseUrl);
  await openCairoFromHomeSearch(page, baseURL);

  const reviewsTab = page.getByRole('button', { name: /^리뷰$/ }).locator('visible=true').first();
  await reviewsTab.click();
  await page.waitForURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });

  const writeBtn = page.getByRole('button', { name: '작성하기' }).first();
  await writeBtn.waitFor({ state: 'visible', timeout: 30_000 });
  await writeBtn.click();

  const textarea = page.locator('textarea[placeholder*="경험"]').first();
  await textarea.waitFor({ state: 'visible', timeout: 30_000 });
  await textarea.fill(MOCK_REVIEW_TEXT);

  await page.getByRole('button', { name: '등록하기' }).click();
  await page.getByRole('button', { name: '등록하기' }).waitFor({ state: 'hidden', timeout: 30_000 });

  const galleryBack = page.getByRole('button', { name: '사진 보기' }).first();
  await galleryBack.waitFor({ state: 'visible', timeout: 30_000 });
  await galleryBack.click();
  await page.waitForURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
  await page.waitForFunction(() => !/\/reviews/.test(window.location.pathname), null, { timeout: 30_000 });
  await page.waitForTimeout(1500);

  const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
  await storiesHeader.waitFor({ state: 'visible', timeout: 90_000 });
  const storiesExpanded = await storiesHeader.getAttribute('aria-expanded');
  await storiesHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await clipShot(page, `cairo-review-return-stories-expanded-${tag}.png`);
  return { storiesExpanded, url: page.url() };
}

async function captureGalleryLoadParity(page, baseURL, label, tag) {
  await page.goto(`${baseURL}place/cairo?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('[data-place-gallery-scroll]').waitFor({ state: 'attached', timeout: 120_000 });
  const facts = page.getByRole('button', { name: /현지 정보/ }).first();
  if (await facts.isVisible().catch(() => false)) {
    await facts.waitFor({ state: 'visible' });
  }
  const metrics = await waitGalleryImagesLoaded(page);
  await clipShot(page, `cairo-gallery-load-${label}-${tag}.png`);
  return metrics;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const supabaseUrl = discoverSupabaseUrl();
  if (!supabaseUrl) {
    throw new Error('Supabase URL not found in dist — run npm run build first');
  }

  const notes = [];
  const browser = await webkit.launch({ headless: true });

  for (const { width, height, tag } of [
    { width: 390, height: 844, tag: '390' },
    { width: 1280, height: 800, tag: '1280' },
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      locale: 'ko-KR',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    const entry = await captureUserEntryCollapsed(page, BRANCH_URL, tag);
    notes.push({
      case: 'user-entry-collapsed',
      viewport: tag,
      ...entry,
      file: `cairo-user-entry-collapsed-${tag}.png`,
    });

    await context.close();

    const ctx2 = await browser.newContext({
      viewport: { width, height },
      locale: 'ko-KR',
      ignoreHTTPSErrors: true,
    });
    const page2 = await ctx2.newPage();
    const review = await captureReviewReturnFlow(page2, BRANCH_URL, supabaseUrl, tag);
    notes.push({
      case: 'review-return-stories-expanded',
      viewport: tag,
      ...review,
      file: `cairo-review-return-stories-expanded-${tag}.png`,
    });
    await ctx2.close();

    if (MAIN_URL) {
      const ctxMain = await browser.newContext({
        viewport: { width, height },
        locale: 'ko-KR',
        ignoreHTTPSErrors: true,
      });
      const pageMain = await ctxMain.newPage();
      const mainMetrics = await captureGalleryLoadParity(pageMain, MAIN_URL, 'main', tag);
      await ctxMain.close();

      const ctxBranch = await browser.newContext({
        viewport: { width, height },
        locale: 'ko-KR',
        ignoreHTTPSErrors: true,
      });
      const pageBranch = await ctxBranch.newPage();
      const branchMetrics = await captureGalleryLoadParity(pageBranch, BRANCH_URL, 'branch', tag);
      await ctxBranch.close();

      notes.push({
        case: 'gallery-load-parity',
        viewport: tag,
        main: mainMetrics,
        branch: branchMetrics,
        files: [`cairo-gallery-load-main-${tag}.png`, `cairo-gallery-load-branch-${tag}.png`],
        collapseRegression:
          branchMetrics.timedOut
          && !mainMetrics.timedOut
          && branchMetrics.loaded < mainMetrics.loaded,
      });
    }
  }

  await browser.close();

  const lines = [
    '# Place collapse QA — round 2',
    '',
    `Branch URL: ${BRANCH_URL}`,
    MAIN_URL ? `Main URL: ${MAIN_URL}` : 'Main URL: (skipped — set MAIN_URL)',
    `Gallery image wait: ${IMAGE_WAIT_MS}ms`,
    '',
    '## Results',
    '',
    ...notes.map((n) => `- ${JSON.stringify(n)}`),
    '',
  ];
  await writeFile(join(OUT, 'NOTES.md'), `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${OUT}/NOTES.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
