/**
 * YouTube quota / session harness (no live YouTube API)
 */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';

const DEFAULT_BASE = 'https://127.0.0.1:4173';

function parseBase() {
  const i = process.argv.indexOf('--base');
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1].replace(/\/$/, '');
  return DEFAULT_BASE;
}

const base = parseBase();
let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return;
  }
  console.log(`OK    ${msg}`);
}

const edgeSrc = readFileSync('supabase/functions/fetch-place-videos/index.ts', 'utf8');
assert(!edgeSrc.includes('maxFollowPages'), 'edge: no follow-page loop');
assert(!edgeSrc.includes('mayFollowPages'), 'edge: no mayFollowPages');
assert(edgeSrc.includes('paginationSource'), 'edge: paginationSource for fallback tokens');
const fetchSearchCalls = (edgeSrc.match(/await fetchSearch\(/g) || []).length;
assert(fetchSearchCalls <= 3, `edge: fetchSearch call sites bounded (${fetchSearchCalls})`);

const hookSrc = readFileSync('src/pages/Home/hooks/useYouTubeSearch.js', 'utf8');
assert(hookSrc.includes('setLoadMoreCount((c) => c + 1)'), 'hook: loadMore count in finally');
assert(hookSrc.includes('LOAD_MORE_SESSION_MAX = 3'), 'hook: session max 3');

async function countEdgeOnFirstOpen(placeSlug, runs = 20) {
  const browser = await chromium.launch({ headless: true });
  const counts = [];
  for (let i = 0; i < runs; i += 1) {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    let edgeCalls = 0;
    await page.route('**/rest/v1/place_videos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.pgrst.object+json',
        body: JSON.stringify(null),
      });
    });
    await page.route('**/functions/v1/fetch-place-videos**', async (route) => {
      edgeCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          videos: [{ id: `v${i}`, title: 't', ai_context: { tags: [], timeline: [] } }],
          nextPageToken: null,
        }),
      });
    });
    const edgeWait = page.waitForResponse(
      (r) => r.url().includes('fetch-place-videos'),
      { timeout: 20000 },
    );
    await page.goto(`${base}/place/${placeSlug}/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    try {
      await edgeWait;
    } catch {
      // no edge (unexpected)
    }
    await page.waitForTimeout(500);
    counts.push(edgeCalls);
    await context.close();
  }
  await browser.close();
  return counts;
}

async function loadMoreSessionCap() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  let edgeCalls = 0;
  await page.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.pgrst.object+json',
      body: JSON.stringify({
        videos: [{ id: 'a', title: 'A', ai_context: { tags: [], timeline: [] } }],
      }),
    });
  });
  await page.route('**/functions/v1/fetch-place-videos**', async (route) => {
    edgeCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'mock 403' }),
    });
  });
  await page.goto(`${base}/place/paris/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1500);
  const btn = page.getByRole('button', { name: /영상 더 보기|More videos/i });
  for (let c = 0; c < 5; c += 1) {
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  await browser.close();
  return edgeCalls;
}

const counts = await countEdgeOnFirstOpen('new-york', 20);
const allOne = counts.every((n) => n === 1);
assert(allOne, `first open: 20/20 places had exactly 1 edge call (got ${counts.join(',')})`);

const loadMoreCalls = await loadMoreSessionCap();
assert(loadMoreCalls <= 3, `load more session cap ≤3 edge calls including failures (got ${loadMoreCalls})`);
assert(loadMoreCalls * 100 <= 400, `session worst-case units ≤400 (${loadMoreCalls * 100})`);

const s2 = spawnSync('node', ['scripts/smoke-youtube-s2-autoskip.mjs', '--base', base], { stdio: 'inherit' });
if (s2.status !== 0) {
  failed += 1;
  console.error('FAIL  S2 auto-skip smoke');
} else {
  console.log('OK    S2 auto-skip smoke');
}

if (failed > 0) {
  console.error(`\n${failed} harness check(s) failed`);
  process.exit(1);
}
console.log('\nAll quota harness checks passed');
