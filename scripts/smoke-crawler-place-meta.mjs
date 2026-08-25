#!/usr/bin/env node
/**
 * Crawler HTML — hub + tier1 place meta inject smoke (Googlebot UA).
 *
 *   npm run smoke:crawler-place-meta
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isCrawlerRequest } from '../src/edge/botDetect.js';
import { injectCrawlerMetaIntoHtml } from '../src/edge/injectCrawlerMeta.js';
import {
  getCrawlerMetaKind,
  getCrawlerPlaceMetaSlugCount,
  parseCrawlerPath,
  parseCrawlerPlacePath,
  resolveCrawlerMeta,
} from '../src/edge/resolveCrawlerMeta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

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

function googlebotRequest(pathname, locale = 'ko') {
  const suffix = locale === 'en' ? '?lang=en' : '';
  return new Request(`https://www.gateo.kr${pathname}${suffix}`, {
    headers: { 'user-agent': GOOGLEBOT_UA },
  });
}

assert(getCrawlerPlaceMetaSlugCount() === 64, 'tier1 crawler meta covers 64 slugs');

const tokyoGalleryKo = resolveCrawlerMeta('/place/tokyo/gallery', 'ko');
assert(Boolean(tokyoGalleryKo?.title), 'tokyo gallery KO meta resolved');
assert(/도쿄|東京|tokyo/i.test(tokyoGalleryKo.title), 'tokyo gallery KO title localized');

const tokyoGalleryEn = resolveCrawlerMeta('/place/tokyo/gallery', 'en');
assert(/Tokyo/i.test(tokyoGalleryEn.title), 'tokyo gallery EN title');
assert(tokyoGalleryEn.canonicalUrl.includes('lang=en'), 'tokyo gallery EN canonical has lang=en');

const tokyoBaseKo = resolveCrawlerMeta('/place/tokyo', 'ko');
assert(tokyoBaseKo?.title === tokyoGalleryKo.title, 'tier1 base path uses gallery meta title');
assert(tokyoBaseKo?.canonicalUrl === tokyoGalleryKo.canonicalUrl, 'tier1 base canonical matches gallery');

const angkorPlanner = resolveCrawlerMeta('/place/angkor-wat/planner', 'en');
assert(/Angkor Wat/i.test(angkorPlanner.title), 'angkor planner EN title');
assert(/trip|travel|plan/i.test(angkorPlanner.description), 'angkor planner EN description');

const homeKo = resolveCrawlerMeta('/', 'ko');
assert(/3D|도슨트|세계 여행/i.test(homeKo.title), 'home KO title');
assert(homeKo.description.includes('GATEO'), 'home KO description');

const homeEn = resolveCrawlerMeta('/', 'en');
assert(/AI docent|3D/i.test(homeEn.title), 'home EN title');
assert(homeEn.canonicalUrl.includes('lang=en'), 'home EN canonical');

const koreaKo = resolveCrawlerMeta('/korea', 'ko');
assert(koreaKo.title.includes('축제'), 'korea KO title');
assert(koreaKo.description.includes('축제'), 'korea KO description');

const koreaEn = resolveCrawlerMeta('/korea', 'en');
assert(/Korea festivals/i.test(koreaEn.title), 'korea EN title');
assert(koreaEn.canonicalUrl.endsWith('/korea?lang=en'), 'korea EN canonical');

assert(parseCrawlerPlacePath('/place/tokyo/video') === null, 'video tab not in scope');
assert(resolveCrawlerMeta('/place/phuket/gallery', 'ko') === null, 'tier2 slug not in meta map');
assert(resolveCrawlerMeta('/place/phuket', 'ko') === null, 'tier2 base path not in meta map');

assert(parseCrawlerPath('/korea').kind === 'hub', 'korea parsed as hub');
assert(getCrawlerMetaKind('/place/tokyo') === 'tier1-place-base', 'base path kind tag');
assert(getCrawlerMetaKind('/') === 'home', 'home kind tag');
assert(getCrawlerMetaKind('/korea') === 'korea', 'korea kind tag');

const botReq = googlebotRequest('/place/tokyo/gallery');
assert(isCrawlerRequest(botReq), 'Googlebot detected on gallery');

const humanReq = new Request('https://www.gateo.kr/place/tokyo/gallery', {
  headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
});
assert(!isCrawlerRequest(humanReq), 'Chrome UA not treated as crawler');

const previewReq = new Request('https://www.gateo.kr/place/tokyo/gallery?crawler=1');
assert(isCrawlerRequest(previewReq), 'crawler=1 preview flag works');

for (const path of ['/', '/korea', '/place/tokyo', '/place/tokyo/gallery']) {
  const req = googlebotRequest(path);
  assert(isCrawlerRequest(req), `Googlebot on ${path}`);
  assert(Boolean(resolveCrawlerMeta(path, 'ko')), `meta resolved for ${path}`);
}

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const injectedHome = injectCrawlerMetaIntoHtml(indexHtml, homeKo);
assert(injectedHome.includes('<!-- crawler-meta-injected -->'), 'home injection marker present');
assert(injectedHome.includes(`${homeKo.title} | GATEO`), 'home title injected in head');
assert(!injectedHome.includes('AI 도슨트와 함께하는 3D 세계 여행</title>'), 'default SPA title removed on home');

const injectedTokyo = injectCrawlerMetaIntoHtml(indexHtml, tokyoGalleryKo);
assert(injectedTokyo.includes(`${tokyoGalleryKo.title} | GATEO`), 'tokyo title injected in head');
assert(
  injectedTokyo.includes(`content="${tokyoGalleryKo.description.replace(/"/g, '&quot;')}"`) ||
    injectedTokyo.includes(tokyoGalleryKo.description.slice(0, 40)),
  'tokyo description injected',
);
assert(injectedTokyo.includes('rel="canonical"'), 'canonical link injected');
assert(injectedTokyo.includes('hreflang="en"'), 'hreflang alternates injected');

const middlewareSrc = readFileSync(join(root, 'middleware.js'), 'utf8');
assert(middlewareSrc.includes('injectCrawlerMetaIntoHtml'), 'middleware wires HTML injection');
assert(middlewareSrc.includes('isCrawlerRequest'), 'middleware gates on crawler UA');
assert(middlewareSrc.includes('/korea'), 'middleware matcher includes /korea');
assert(middlewareSrc.includes('/place/:slug'), 'middleware matcher includes tier1 base');

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll crawler meta smoke checks passed (hub + tier1 + Googlebot).');
