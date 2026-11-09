#!/usr/bin/env node
/**
 * Search exposure P1: sitemap /blog/e/*, editorial crawler meta, soft-404 noindex.
 *
 *   npm run smoke:search-exposure-p1
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { injectCrawlerMetaIntoHtml } from '../src/edge/injectCrawlerMeta.js';
import {
  buildCrawlerSoft404Meta,
  getCrawlerMetaKind,
  isCrawlerSoft404Path,
  parseCrawlerPath,
  resolveCrawlerMeta,
} from '../src/edge/resolveCrawlerMeta.js';
import crawlerEditorialMeta from '../src/edge/crawlerEditorialMeta.generated.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = join(root, 'public/sitemap.xml');
const editorialListPath = join(root, 'src/data/logbookEditorialPublished.json');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');

if (!existsSync(sitemapPath)) {
  console.error('Missing public/sitemap.xml — run npm run generate:sitemap');
  process.exit(1);
}

const editorialList = JSON.parse(readFileSync(editorialListPath, 'utf8'));
assert.ok(Array.isArray(editorialList) && editorialList.length >= 1, 'editorial list non-empty');

const sitemap = readFileSync(sitemapPath, 'utf8');
for (const row of editorialList) {
  const loc = `https://www.gateo.kr/blog/e/${row.slug}`;
  assert.ok(sitemap.includes(loc), `sitemap includes ${loc}`);
}

assert.equal(
  (sitemap.match(/https:\/\/www\.gateo\.kr\/blog\/e\//g) || []).length,
  editorialList.length,
  'sitemap editorial URL count matches SSOT',
);

const paris = resolveCrawlerMeta('/blog/e/paris-travelogue', 'ko');
assert.ok(paris?.canonicalUrl === 'https://www.gateo.kr/blog/e/paris-travelogue', 'paris canonical');
assert.ok(/오르세|paris/i.test(paris.title), 'paris editorial title');
assert.ok(paris.editorialSlug === 'paris-travelogue', 'paris editorial slug meta');

const parisHtml = injectCrawlerMetaIntoHtml(indexHtml, paris);
assert.ok(parisHtml.includes('rel="canonical"'), 'paris crawler has canonical');
assert.ok(!parisHtml.includes('name="robots" content="noindex"'), 'paris not noindex');
assert.ok(parisHtml.includes('id="crawler-editorial-body"'), 'paris editorial body');

assert.equal(parseCrawlerPath('/blog/e/paris-travelogue')?.kind, 'editorial-logbook');
assert.equal(getCrawlerMetaKind('/blog/e/paris-travelogue'), 'editorial-logbook');
assert.equal(Object.keys(crawlerEditorialMeta).length, editorialList.length, 'generated editorial meta count');

assert.equal(isCrawlerSoft404Path('/place/not-a-real-slug-zz'), true);
assert.equal(isCrawlerSoft404Path('/blog/e/not-a-real-slug-zz'), true);
assert.equal(isCrawlerSoft404Path('/place/tokyo'), false);
assert.equal(isCrawlerSoft404Path('/blog/e/paris-travelogue'), false);

const missingPlace = buildCrawlerSoft404Meta('/place/not-a-real-slug-zz', 'ko');
const missingPlaceHtml = injectCrawlerMetaIntoHtml(indexHtml, missingPlace);
assert.ok(missingPlaceHtml.includes('name="robots" content="noindex, nofollow"'), 'missing place noindex');
assert.ok(!missingPlaceHtml.includes('rel="canonical"'), 'missing place no canonical');

const missingBlog = buildCrawlerSoft404Meta('/blog/e/not-a-real-slug-zz', 'ko');
const missingBlogHtml = injectCrawlerMetaIntoHtml(indexHtml, missingBlog);
assert.ok(missingBlogHtml.includes('name="robots" content="noindex, nofollow"'), 'missing blog noindex');

const middlewareSrc = readFileSync(join(root, 'middleware.js'), 'utf8');
assert.ok(middlewareSrc.includes('/blog/e/:editorialSlug'), 'middleware matcher includes editorial');
assert.ok(middlewareSrc.includes('isCrawlerSoft404Path'), 'middleware uses soft404 guard');

console.log(`smoke:search-exposure-p1 OK — ${editorialList.length} editorial URLs, soft-404 guards`);
