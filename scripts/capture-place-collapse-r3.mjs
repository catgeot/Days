#!/usr/bin/env node
/**
 * Place collapse QA round 3 — review return keeps existing visit stories.
 * POST stub only; GET place_reviews = upstream fetch + merge posted stubs.
 *
 *   BRANCH_URL=https://127.0.0.1:4173 node scripts/capture-place-collapse-r3.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.PLACE_COLLAPSE_R3_OUT || '/opt/cursor/artifacts/place-collapse/r3';
const BRANCH_URL = (process.env.BRANCH_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');

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

function stripAuthHeaders(headers) {
  const out = { ...headers };
  for (const key of Object.keys(out)) {
    if (key.toLowerCase() === 'authorization') delete out[key];
  }
  return out;
}

async function fetchSupabasePublic(route) {
  const req = route.request();
  return route.fetch({ headers: stripAuthHeaders(req.headers()) });
}

async function waitForVisitStoriesHeader(page, timeoutMs = 120_000) {
  const header = page.getByRole('button', { name: /다녀온 이야기/ }).first();
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await header.isVisible().catch(() => false)) return header;
    await page.waitForTimeout(500);
  }
  await header.waitFor({ state: 'visible', timeout: 5_000 });
  return header;
}

async function clipShot(page, fileName) {
  const { width = 390, height = 844 } = page.viewportSize() || {};
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width, height },
  });
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

async function readVisitStoryCount(page) {
  const header = page.getByRole('button', { name: /다녀온 이야기/ }).first();
  await header.waitFor({ state: 'visible', timeout: 90_000 });
  const section = page.locator('[data-visit-stories]').first();
  const countAttr = await section.getAttribute('data-visit-story-count');
  if (countAttr) return Number(countAttr);
  const label = await header.innerText();
  const match = label.match(/(\d+)\s*건/);
  return match ? Number(match[1]) : null;
}

async function readVisibleStoryRows(page) {
  return page.locator('[data-visit-story-title]:visible').count();
}

/**
 * Auth + POST-only review stub. GET place_reviews proxies upstream and merges posted stubs.
 */
async function activateQaAuthSession(page, supabaseUrl, session) {
  const storageKey = authStorageKey(supabaseUrl);
  await page.evaluate(({ storageKey: key, session: sess }) => {
    localStorage.setItem(key, JSON.stringify(sess));
  }, { storageKey, session });
}

async function installReviewMocks(page, supabaseUrl) {
  const headers = corsHeaders();
  const postedReviewStubs = [];
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
        body: JSON.stringify({ ...session, user: session.user }),
      });
    }

    if (url.includes('/rest/v1/place_reviews') && method === 'POST') {
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
        is_editorial: true,
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
      postedReviewStubs.unshift(created);
      return route.fulfill({ status: 201, headers, body: JSON.stringify(created) });
    }

    if (url.includes('/rest/v1/reports') && (method === 'GET' || method === 'HEAD')) {
      const upstream = await fetchSupabasePublic(route);
      return route.fulfill({
        status: upstream.status(),
        headers: { ...upstream.headers(), ...headers },
        body: await upstream.text(),
      });
    }

    if (url.includes('/rest/v1/place_reviews') && (method === 'GET' || method === 'HEAD')) {
      const upstream = await fetchSupabasePublic(route);
      let rows = [];
      try {
        const parsed = JSON.parse(await upstream.text());
        rows = Array.isArray(parsed) ? parsed : [];
      } catch {
        rows = [];
      }
      if (postedReviewStubs.length) {
        const byId = new Map(rows.map((row) => [String(row.id), row]));
        for (const stub of postedReviewStubs) {
          byId.set(String(stub.id), stub);
        }
        rows = [...byId.values()].sort(
          (a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0),
        );
      }
      return route.fulfill({
        status: upstream.status(),
        headers: { ...upstream.headers(), ...headers },
        body: JSON.stringify(rows),
      });
    }

    return route.continue();
  });

  await activateQaAuthSession(page, supabaseUrl, session);
  return { postedReviewStubs, session };
}

async function captureReviewStoryCounts(page, baseURL, supabaseUrl, tag) {
  await openCairoFromHomeSearch(page, baseURL);

  const storiesHeader = await waitForVisitStoriesHeader(page);
  const beforeCount = await readVisitStoryCount(page);
  if ((await storiesHeader.getAttribute('aria-expanded')) !== 'true') {
    await storiesHeader.click();
  }
  const beforeTitles = await page.locator('[data-visit-story-title]:visible').allTextContents();
  await storiesHeader.scrollIntoViewIfNeeded();
  await clipShot(page, `cairo-visit-stories-before-${tag}.png`);

  await installReviewMocks(page, supabaseUrl);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('[data-place-gallery-scroll]').waitFor({ state: 'attached', timeout: 120_000 });
  await waitForVisitStoriesHeader(page);

  const reviewsTab = page.getByRole('button', { name: /^리뷰$/ }).locator('visible=true').first();
  await reviewsTab.click();
  await page.waitForURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });

  const writeBtn = page
    .getByRole('button', { name: /^(작성하기|작성|리뷰 작성하기)$/ })
    .locator('visible=true')
    .first();
  await writeBtn.click();
  await page.locator('textarea[placeholder*="경험"]').first().fill(MOCK_REVIEW_TEXT);
  await page.getByRole('button', { name: '등록하기' }).click();
  await page.getByRole('button', { name: '등록하기' }).waitFor({ state: 'hidden', timeout: 30_000 });

  await page.getByRole('button', { name: '사진 보기' }).first().click();
  await page.waitForFunction(() => !/\/reviews/.test(window.location.pathname), null, { timeout: 30_000 });
  await page.waitForTimeout(1500);

  const storiesHeaderAfter = await waitForVisitStoriesHeader(page);
  const afterCount = await readVisitStoryCount(page);
  const storiesExpanded = await storiesHeaderAfter.getAttribute('aria-expanded');
  const visibleRows = await readVisibleStoryRows(page);
  const storyTitles = await page.locator('[data-visit-story-title]:visible').allTextContents();
  await storiesHeaderAfter.scrollIntoViewIfNeeded();
  await clipShot(page, `cairo-visit-stories-after-return-${tag}.png`);

  return {
    beforeCount,
    afterCount,
    beforeTitles: beforeTitles.map((t) => t.trim()).filter(Boolean),
    storiesExpanded,
    visibleRows,
    storyTitles: storyTitles.map((t) => t.trim()).filter(Boolean),
    url: page.url(),
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const supabaseUrl = discoverSupabaseUrl();
  if (!supabaseUrl) throw new Error('Supabase URL missing — npm run build first');

  const notes = {
    rootCause:
      'R2 capture stub fulfilled every GET /place_reviews with an in-memory array (empty until POST), '
      + 'replacing upstream Cairo rows (QA saw «1건» with only the stub). App refetch via place-visit-stories-refresh is correct. '
      + 'R3 stubs POST only, proxies GET place_reviews/reports with anon (strip fake JWT), and merges posted rows. '
      + 'UI lists at most 2 visit stories (`selectVisitStories`); chip stays «2건» when 3+ exist in data.',
    branchUrl: BRANCH_URL,
    results: [],
  };

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
    const result = await captureReviewStoryCounts(page, BRANCH_URL, supabaseUrl, tag);
    notes.results.push({ viewport: tag, ...result });
    await context.close();
  }
  await browser.close();

  const lines = [
    '# Place collapse QA — round 3',
    '',
    '## Root cause',
    '',
    notes.rootCause,
    '',
    `Branch: ${BRANCH_URL}`,
    '',
    '## Assertions',
    '',
    ...notes.results.map((r) => (
      `- **${r.viewport}**: before \`${r.beforeCount}건\` → after return \`${r.afterCount}건\` `
      + `(aria-expanded=${r.storiesExpanded}, visible story rows=${r.visibleRows})`
    )),
    '',
    '## Files',
    '',
    '- `cairo-visit-stories-before-390.png` / `-1280.png`',
    '- `cairo-visit-stories-after-return-390.png` / `-1280.png`',
    '',
  ];
  await writeFile(join(OUT, 'NOTES.md'), `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${OUT}/NOTES.md`);
  for (const r of notes.results) {
    const hasStub = (r.storyTitles || []).some((t) => /QA stub/i.test(t));
    const preserved = (r.beforeTitles || []).some((title) =>
      (r.storyTitles || []).some((after) => after.includes(title.slice(0, 12)) || title.includes(after.slice(0, 12))),
    );
    if (r.beforeCount < 2 || r.afterCount < 2 || !hasStub || !preserved) {
      console.error('FAIL count/preserve', r);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
