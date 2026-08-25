#!/usr/bin/env node
/**
 * Crawler HTML MVP — tier1 gallery/planner meta inject smoke.
 *
 *   npm run smoke:crawler-place-meta
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isCrawlerRequest } from '../src/edge/botDetect.js';
import { injectCrawlerMetaIntoHtml } from '../src/edge/injectCrawlerMeta.js';
import {
  getCrawlerPlaceMetaSlugCount,
  parseCrawlerPlacePath,
  resolveCrawlerPlaceMeta,
} from '../src/edge/resolveCrawlerPlaceMeta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

assert(getCrawlerPlaceMetaSlugCount() === 64, 'tier1 crawler meta covers 64 slugs');

const tokyoGalleryKo = resolveCrawlerPlaceMeta('/place/tokyo/gallery', 'ko');
assert(Boolean(tokyoGalleryKo?.title), 'tokyo gallery KO meta resolved');
assert(/도쿄|東京|tokyo/i.test(tokyoGalleryKo.title), 'tokyo gallery KO title localized');

const tokyoGalleryEn = resolveCrawlerPlaceMeta('/place/tokyo/gallery', 'en');
assert(/Tokyo/i.test(tokyoGalleryEn.title), 'tokyo gallery EN title');
assert(tokyoGalleryEn.canonicalUrl.includes('lang=en'), 'tokyo gallery EN canonical has lang=en');

const angkorPlanner = resolveCrawlerPlaceMeta('/place/angkor-wat/planner', 'en');
assert(/Angkor Wat/i.test(angkorPlanner.title), 'angkor planner EN title');
assert(/trip|travel|plan/i.test(angkorPlanner.description), 'angkor planner EN description');

assert(parseCrawlerPlacePath('/place/tokyo/video') === null, 'video tab not in MVP scope');
assert(resolveCrawlerPlaceMeta('/place/phuket/gallery', 'ko') === null, 'tier2 slug not in meta map');

const botReq = new Request('https://www.gateo.kr/place/tokyo/gallery', {
  headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
});
assert(isCrawlerRequest(botReq), 'Googlebot detected');

const humanReq = new Request('https://www.gateo.kr/place/tokyo/gallery', {
  headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
});
assert(!isCrawlerRequest(humanReq), 'Chrome UA not treated as crawler');

const previewReq = new Request('https://www.gateo.kr/place/tokyo/gallery?crawler=1');
assert(isCrawlerRequest(previewReq), 'crawler=1 preview flag works');

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const injected = injectCrawlerMetaIntoHtml(indexHtml, tokyoGalleryKo);
assert(injected.includes('<!-- crawler-meta-injected -->'), 'injection marker present');
assert(injected.includes('<html lang="ko">'), 'html lang updated');
assert(injected.includes(`${tokyoGalleryKo.title} | GATEO`), 'title injected in head');
assert(
  injected.includes(`content="${tokyoGalleryKo.description.replace(/"/g, '&quot;')}"`) ||
    injected.includes(tokyoGalleryKo.description.slice(0, 40)),
  'description injected',
);
assert(injected.includes('rel="canonical"'), 'canonical link injected');
assert(injected.includes('hreflang="en"'), 'hreflang alternates injected');
assert(!injected.includes('AI 도슨트와 함께하는 3D 세계 여행</title>'), 'default SPA title removed');

const middlewareSrc = readFileSync(join(root, 'middleware.js'), 'utf8');
assert(middlewareSrc.includes('injectCrawlerMetaIntoHtml'), 'middleware wires HTML injection');
assert(middlewareSrc.includes('isCrawlerRequest'), 'middleware gates on crawler UA');

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll crawler place meta smoke checks passed.');
