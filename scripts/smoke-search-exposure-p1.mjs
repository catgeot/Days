#!/usr/bin/env node
/**
 * Search exposure P1: sitemap /blog/e/*, editorial crawler meta, /place no soft-404.
 *
 *   npm run smoke:search-exposure-p1
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { injectCrawlerMetaIntoHtml } from '../src/edge/injectCrawlerMeta.js';
import {
  getCrawlerMetaKind,
  isCrawlerSoft404Path,
  parseCrawlerPath,
  resolveCrawlerMeta,
} from '../src/edge/resolveCrawlerMeta.js';
import { resolveEditorialCrawlerMetaLive } from '../src/edge/resolveEditorialCrawlerMetaLive.js';
import { buildSitemapBlogXml } from '../src/edge/sitemapBlogXml.js';
import crawlerEditorialMeta from '../src/edge/crawlerEditorialMeta.generated.js';
import { resolveLogbookFeedExcerpt } from '../src/utils/logbookDek.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sitemapIndexPath = join(root, 'public/sitemap.xml');
const sitemapCorePath = join(root, 'public/sitemap-core.xml');
const editorialListPath = join(root, 'src/data/logbookEditorialPublished.json');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');

const KNOWN_SLUGS = ['rome-travelogue', 'short-20261111-week-festivals'];
const LIVE_ONLY_SLUG = 'only-in-supabase-not-build';

if (!existsSync(sitemapIndexPath) || !existsSync(sitemapCorePath)) {
  console.error('Missing sitemap index/core — run npm run generate:sitemap');
  process.exit(1);
}

const editorialList = JSON.parse(readFileSync(editorialListPath, 'utf8'));
assert.ok(Array.isArray(editorialList) && editorialList.length >= 1, 'editorial list non-empty');

const editorialBySlug = Object.fromEntries(editorialList.map((row) => [row.slug, row]));

for (const slug of KNOWN_SLUGS) {
  assert.ok(editorialBySlug[slug], `editorial SSOT includes ${slug}`);
}

const sitemapIndex = readFileSync(sitemapIndexPath, 'utf8');
assert.ok(sitemapIndex.includes('<sitemapindex'), 'root sitemap is index');
assert.ok(sitemapIndex.includes('https://www.gateo.kr/sitemap-core.xml'), 'index references core');
assert.ok(sitemapIndex.includes('https://www.gateo.kr/sitemap-blog.xml'), 'index references blog live');

const blogSitemap = buildSitemapBlogXml(editorialList);
for (const row of editorialList) {
  const loc = `https://www.gateo.kr/blog/e/${row.slug}`;
  assert.ok(blogSitemap.includes(loc), `dynamic blog sitemap includes ${loc}`);
  if (row.published_at) {
    const lastmod = String(row.published_at).split('T')[0];
    const block = blogSitemap.slice(blogSitemap.indexOf(loc), blogSitemap.indexOf(loc) + 200);
    assert.ok(block.includes(`<lastmod>${lastmod}</lastmod>`), `blog sitemap lastmod for ${row.slug}`);
  }
}

assert.equal(
  (blogSitemap.match(/https:\/\/www\.gateo\.kr\/blog\/e\//g) || []).length,
  editorialList.length,
  'blog sitemap URL count matches SSOT',
);

const sitemapCore = readFileSync(sitemapCorePath, 'utf8');
assert.ok(
  !sitemapCore.includes('/blog/e/'),
  'core sitemap omits blog (served from sitemap-blog.xml)',
);

function assertEditorialCrawlerMeta(slug) {
  const row = editorialBySlug[slug];
  const meta = resolveCrawlerMeta(`/blog/e/${slug}`, 'ko');
  assert.ok(meta, `${slug} crawler meta`);
  assert.equal(meta.canonicalUrl, `https://www.gateo.kr/blog/e/${slug}`, `${slug} canonical`);
  assert.equal(meta.title, row.title, `${slug} title is post headline`);
  assert.equal(meta.description, resolveLogbookFeedExcerpt(row, 150), `${slug} description from dek/lead`);
  assert.equal(meta.editorialSlug, slug, `${slug} editorial slug meta`);

  const html = injectCrawlerMetaIntoHtml(indexHtml, meta);
  assert.ok(html.includes(`<title>${meta.title} | GATEO</title>`), `${slug} injected title`);
  assert.ok(html.includes(`content="${meta.description}`), `${slug} injected description`);
  assert.ok(html.includes('rel="canonical"'), `${slug} crawler has canonical`);
  assert.ok(html.includes(`href="https://www.gateo.kr/blog/e/${slug}"`), `${slug} canonical href`);
  assert.ok(html.includes('property="og:title"'), `${slug} og:title`);
  assert.ok(html.includes('property="og:description"'), `${slug} og:description`);
  assert.ok(html.includes('property="og:url"'), `${slug} og:url`);
  assert.ok(html.includes('property="og:image"'), `${slug} og:image`);
  assert.ok(html.includes('name="twitter:title"'), `${slug} twitter:title`);
  assert.ok(!html.includes('name="robots" content="noindex"'), `${slug} not noindex`);
  assert.ok(html.includes('id="crawler-editorial-body"'), `${slug} editorial body`);
}

for (const slug of KNOWN_SLUGS) {
  assertEditorialCrawlerMeta(slug);
}

assert.ok(
  !crawlerEditorialMeta[LIVE_ONLY_SLUG],
  'fixture slug absent from build-time bundle',
);

const liveFixtureRow = {
  slug: LIVE_ONLY_SLUG,
  title: '빌드 후 새 글',
  dek: '동적 페치 데크 한 줄',
  content: '본문 리드가 있어도 데크 우선.',
  images: ['https://images.unsplash.com/photo-1509024644558-2f56ce76c490'],
  published_at: '2026-11-17T00:00:00.000Z',
  place_slug: 'rome',
};

const mockFetch = async (input) => {
  const url = String(input);
  if (url.includes(LIVE_ONLY_SLUG) && url.includes('slug%2Ctitle')) {
    return new Response(JSON.stringify([liveFixtureRow]), { status: 200 });
  }
  if (url.includes('select=slug,published_at') || url.includes('slug%2Cpublished_at')) {
    return new Response(JSON.stringify([{ slug: LIVE_ONLY_SLUG, published_at: liveFixtureRow.published_at }]), {
      status: 200,
    });
  }
  return new Response('[]', { status: 200 });
};

const prevUrl = process.env.VITE_SUPABASE_URL;
const prevKey = process.env.VITE_SUPABASE_ANON_KEY;
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJ-test-key';

const liveMeta = await resolveEditorialCrawlerMetaLive(LIVE_ONLY_SLUG, 'ko', { fetchImpl: mockFetch });
assert.equal(liveMeta?.canonicalUrl, `https://www.gateo.kr/blog/e/${LIVE_ONLY_SLUG}`, 'live-only canonical');
assert.equal(liveMeta?.title, liveFixtureRow.title, 'live-only title');
assert.equal(liveMeta?.description, liveFixtureRow.dek, 'live-only description from dek');

const liveHtml = injectCrawlerMetaIntoHtml(indexHtml, liveMeta);
assert.ok(liveHtml.includes('rel="canonical"'), 'live-only html canonical');

const missingLive = await resolveEditorialCrawlerMetaLive('not-a-real-slug-zz', 'ko', {
  fetchImpl: async () => new Response('[]', { status: 200 }),
});
assert.equal(missingLive, null, 'unknown slug live fetch returns null');

process.env.VITE_SUPABASE_URL = prevUrl;
process.env.VITE_SUPABASE_ANON_KEY = prevKey;

const paris = resolveCrawlerMeta('/blog/e/paris-travelogue', 'ko');
assert.ok(paris?.canonicalUrl === 'https://www.gateo.kr/blog/e/paris-travelogue', 'paris canonical');

assert.equal(parseCrawlerPath('/blog/e/paris-travelogue')?.kind, 'editorial-logbook');
assert.equal(getCrawlerMetaKind('/blog/e/paris-travelogue'), 'editorial-logbook');
assert.equal(Object.keys(crawlerEditorialMeta).length, editorialList.length, 'generated editorial meta count');

assert.equal(isCrawlerSoft404Path('/blog/e/not-a-real-slug-zz'), false);

const middlewareSrc = readFileSync(join(root, 'middleware.js'), 'utf8');
assert.ok(middlewareSrc.includes('/blog/e/:editorialSlug'), 'middleware matcher includes editorial');
assert.ok(middlewareSrc.includes('/sitemap-blog.xml'), 'middleware serves dynamic blog sitemap');
assert.ok(middlewareSrc.includes('resolveEditorialCrawlerMetaLive'), 'middleware live editorial meta');

const coreUrls = (sitemapCore.match(/<loc>https:\/\/www\.gateo\.kr[^<]*<\/loc>/g) || []).length;

console.log(
  `smoke:search-exposure-p1 OK — ${editorialList.length} blog URLs (live sitemap), ${coreUrls} core URLs, live fetch slug OK`,
);
