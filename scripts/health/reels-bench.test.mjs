import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('route registered and admin gate uses am_i_app_admin', () => {
  const app = readFileSync(join(root, 'src/App.jsx'), 'utf8');
  assert.match(app, /path="\/admin\/reels-bench"/);
  assert.match(app, /ReelsBenchPage/);
  const page = readFileSync(join(root, 'src/pages/Admin/ReelsBenchPage.jsx'), 'utf8');
  assert.match(page, /useAppAdminGate\('gallery'\)/);
  const gate = readFileSync(join(root, 'src/pages/Admin/useAppAdminGate.js'), 'utf8');
  assert.match(gate, /am_i_app_admin/);
  assert.match(gate, /p_scope: scope/);
});

test('noindex meta and lazy video preload none', () => {
  const page = readFileSync(join(root, 'src/pages/Admin/ReelsBenchPage.jsx'), 'utf8');
  assert.match(page, /name="robots" content="noindex, nofollow"/);
  assert.match(page, /preload="none"/);
  assert.match(page, /IntersectionObserver/);
  assert.match(page, /phase !== 'yes'/);
  assert.doesNotMatch(page, /reel-final-01\.mp4/);
});

test('vercel X-Robots-Tag and robots disallow admin', () => {
  const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
  assert.match(vercel, /"source": "\/admin\/reels-bench"/);
  assert.match(vercel, /X-Robots-Tag/);
  assert.match(vercel, /noindex, nofollow/);
  const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8');
  assert.match(robots, /Disallow: \/admin\//);
});

test('sitemap excludes admin reels bench', () => {
  const gen = readFileSync(join(root, 'scripts/generate-sitemap.cjs'), 'utf8');
  assert.match(gen, /sitemapExcludedPaths/);
  assert.match(gen, /'\/admin\/reels-bench'/);
  const sitemap = readFileSync(join(root, 'public/sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /reels-bench/);
  assert.doesNotMatch(sitemap, /\/admin\/gallery/);
});

test('reels URL SSOT count and verified byte table', () => {
  const urls = readFileSync(join(root, 'src/pages/Admin/reelsBenchUrls.js'), 'utf8');
  assert.match(urls, /REELS_BENCH_COUNT = 7/);
  assert.match(urls, /reels\.findable\.kr/);
  assert.match(urls, /REELS_BENCH_VERIFIED_BYTES/);
  const page = readFileSync(join(root, 'src/pages/Admin/ReelsBenchPage.jsx'), 'utf8');
  assert.doesNotMatch(page, /fetch\(.*HEAD/);
  assert.match(page, /getVerifiedReelByteSize/);
});
