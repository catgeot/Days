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

const gateoUrls = (sitemap.match(/<loc>https:\/\/www\.gateo\.kr[^<]*<\/loc>/g) || []).length;
assert.equal(gateoUrls, 1147, 'sitemap gateo.kr URL count');

const paris = resolveCrawlerMeta('/blog/e/paris-travelogue', 'ko');
assert.ok(paris?.canonicalUrl === 'https://www.gateo.kr/blog/e/paris-travelogue', 'paris canonical');
assert.ok(/오르세|paris/i.test(paris.title), 'paris editorial title');
assert.ok(paris.editorialSlug === 'paris-travelogue', 'paris editorial slug meta');

const parisHtml = injectCrawlerMetaIntoHtml(indexHtml, paris);
assert.ok(parisHtml.includes('rel="canonical"'), 'paris crawler has canonical');
assert.ok(!parisHtml.includes('name="robots" content="noindex"'), 'paris not noindex');
assert.ok(parisHtml.includes('id="crawler-editorial-body"'), 'paris editorial body');

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

console.log(`smoke:search-exposure-p1 OK — ${editorialList.length} editorial URLs, ${gateoUrls} sitemap URLs`);
