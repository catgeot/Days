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
import crawlerEditorialMeta from '../src/edge/crawlerEditorialMeta.generated.js';
import { resolveLogbookFeedExcerpt } from '../src/utils/logbookDek.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = join(root, 'public/sitemap.xml');
const editorialListPath = join(root, 'src/data/logbookEditorialPublished.json');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');

const KNOWN_SLUGS = ['rome-travelogue', 'short-20261111-week-festivals'];

if (!existsSync(sitemapPath)) {
  console.error('Missing public/sitemap.xml — run npm run generate:sitemap');
  process.exit(1);
}

const editorialList = JSON.parse(readFileSync(editorialListPath, 'utf8'));
assert.ok(Array.isArray(editorialList) && editorialList.length >= 1, 'editorial list non-empty');

const editorialBySlug = Object.fromEntries(editorialList.map((row) => [row.slug, row]));

for (const slug of KNOWN_SLUGS) {
  assert.ok(editorialBySlug[slug], `editorial SSOT includes ${slug}`);
}

const sitemap = readFileSync(sitemapPath, 'utf8');
for (const row of editorialList) {
  const loc = `https://www.gateo.kr/blog/e/${row.slug}`;
  assert.ok(sitemap.includes(loc), `sitemap includes ${loc}`);
  if (row.published_at) {
    const lastmod = String(row.published_at).split('T')[0];
    const block = sitemap.slice(sitemap.indexOf(loc), sitemap.indexOf(loc) + 400);
    assert.ok(block.includes(`<lastmod>${lastmod}</lastmod>`), `sitemap lastmod for ${row.slug}`);
  }
}

assert.equal(
  (sitemap.match(/https:\/\/www\.gateo\.kr\/blog\/e\//g) || []).length,
  editorialList.length,
  'sitemap editorial URL count matches SSOT',
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

const paris = resolveCrawlerMeta('/blog/e/paris-travelogue', 'ko');
assert.ok(paris?.canonicalUrl === 'https://www.gateo.kr/blog/e/paris-travelogue', 'paris canonical');

const kyoto = resolveCrawlerMeta('/blog/e/kyoto-travelogue', 'ko');
assert.ok(kyoto?.canonicalUrl === 'https://www.gateo.kr/blog/e/kyoto-travelogue', 'kyoto canonical');
const sydney = resolveCrawlerMeta('/blog/e/sydney-travelogue', 'ko');
assert.ok(sydney?.canonicalUrl === 'https://www.gateo.kr/blog/e/sydney-travelogue', 'sydney canonical');

assert.equal(parseCrawlerPath('/blog/e/paris-travelogue')?.kind, 'editorial-logbook');
assert.equal(getCrawlerMetaKind('/blog/e/paris-travelogue'), 'editorial-logbook');
assert.equal(Object.keys(crawlerEditorialMeta).length, editorialList.length, 'generated editorial meta count');

assert.equal(isCrawlerSoft404Path('/place/not-a-real-slug-zz'), false);
assert.equal(isCrawlerSoft404Path('/place/busan'), false);
assert.equal(isCrawlerSoft404Path('/place/sokcho-beach'), false);
assert.equal(isCrawlerSoft404Path('/place/tour-127635'), false);
assert.equal(isCrawlerSoft404Path('/blog/e/not-a-real-slug-zz'), false);
assert.equal(isCrawlerSoft404Path('/blog/e/paris-travelogue'), false);

assert.equal(resolveCrawlerMeta('/place/moorea', 'ko'), null, 'moorea passes through when no crawler meta');
assert.equal(resolveCrawlerMeta('/place/busan/gallery', 'ko'), null, 'busan gallery passes through when no meta');

const middlewareSrc = readFileSync(join(root, 'middleware.js'), 'utf8');
assert.ok(middlewareSrc.includes('/blog/e/:editorialSlug'), 'middleware matcher includes editorial');
assert.ok(!middlewareSrc.includes('buildCrawlerSoft404Meta'), 'middleware does not apply soft-404');
assert.ok(!middlewareSrc.includes('status: soft404'), 'middleware never returns 404 for crawler inject');

const gateoUrls = (sitemap.match(/<loc>https:\/\/www\.gateo\.kr[^<]*<\/loc>/g) || []).length;

console.log(
  `smoke:search-exposure-p1 OK — ${editorialList.length} editorial URLs, ${gateoUrls} sitemap URLs, checked ${KNOWN_SLUGS.join(', ')}`,
);
