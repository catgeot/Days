#!/usr/bin/env node
/**
 * Crawler HTML — hub + tier1 place meta inject smoke (Googlebot UA).
 *
 *   npm run smoke:crawler-place-meta
 *
 * #13 tier2 batch4: generate script INCLUDED 80→109 · count 187→216
 * · bohol gallery assert ON · tier2 pop<70 (santorini) still null
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

assert(
  getCrawlerPlaceMetaSlugCount() === 216,
  'crawler meta covers tier1 64 + tier2 pop≥80 (43) + pop70–79 109/109 (216 slugs)',
);

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

const scenicKo = resolveCrawlerMeta('/korea/theme/scenic', 'ko');
assert(scenicKo.title.includes('명승'), 'scenic KO title');
assert(scenicKo.description.includes('명승'), 'scenic KO description');
assert(scenicKo.canonicalUrl.endsWith('/korea/theme/scenic'), 'scenic KO canonical');

const scenicEn = resolveCrawlerMeta('/korea/theme/scenic', 'en');
assert(/scenic/i.test(scenicEn.title), 'scenic EN title');
assert(scenicEn.canonicalUrl.includes('/korea/theme/scenic?lang=en'), 'scenic EN canonical');

const exploreKo = resolveCrawlerMeta('/explore', 'ko');
assert(/3D|도슨트|세계 여행/i.test(exploreKo.title), 'explore KO title matches home default');
assert(exploreKo.canonicalUrl.endsWith('/explore'), 'explore KO canonical');

const exploreEn = resolveCrawlerMeta('/explore', 'en');
assert(/AI docent|3D/i.test(exploreEn.title), 'explore EN title');
assert(exploreEn.canonicalUrl.includes('/explore?lang=en'), 'explore EN canonical');

assert(parseCrawlerPlacePath('/place/tokyo/video') === null, 'video tab not in scope');
const phuketGalleryKo = resolveCrawlerMeta('/place/phuket/gallery', 'ko');
assert(Boolean(phuketGalleryKo?.title), 'phuket tier2 gallery KO meta resolved');
assert(/푸켓|Phuket/i.test(phuketGalleryKo.title), 'phuket gallery KO title localized');
assert(Boolean(phuketGalleryKo?.ogImage), 'phuket gallery meta includes ogImage');
assert(phuketGalleryKo.ogImage.startsWith('https://images.unsplash.com/'), 'phuket ogImage is slug pool URL');
assert(
  phuketGalleryKo.ogImage !== 'https://www.gateo.kr/og-image.png',
  'phuket ogImage not global default',
);

const phuketBaseKo = resolveCrawlerMeta('/place/phuket', 'ko');
assert(phuketBaseKo?.title === phuketGalleryKo.title, 'phuket tier2 base path uses gallery meta');

const seychellesGalleryKo = resolveCrawlerMeta('/place/seychelles/gallery', 'ko');
assert(Boolean(seychellesGalleryKo?.title), 'seychelles tier2 pop79 gallery KO meta resolved');
assert(/세이셸|Seychelles/i.test(seychellesGalleryKo.title), 'seychelles gallery KO title localized');
assert(Boolean(seychellesGalleryKo?.ogImage), 'seychelles gallery meta includes ogImage');

const hamburgGalleryKo = resolveCrawlerMeta('/place/hamburg/gallery', 'ko');
assert(Boolean(hamburgGalleryKo?.title), 'hamburg tier2 pop76 batch3 gallery KO meta resolved');
assert(/함부르크|Hamburg/i.test(hamburgGalleryKo.title), 'hamburg gallery KO title localized');
assert(Boolean(hamburgGalleryKo?.ogImage), 'hamburg gallery meta includes ogImage');

const boholGalleryKo = resolveCrawlerMeta('/place/bohol/gallery', 'ko');
assert(Boolean(boholGalleryKo?.title), 'bohol tier2 pop70–79 batch4 gallery KO meta resolved');
assert(/보홀|Bohol/i.test(boholGalleryKo.title), 'bohol gallery KO title localized');
assert(Boolean(boholGalleryKo?.ogImage), 'bohol gallery meta includes ogImage');

const tokyoPlannerKo = resolveCrawlerMeta('/place/tokyo/planner', 'ko');
assert(/ICN.*HND|인천.*HND/i.test(tokyoPlannerKo.description), 'tokyo tier1 planner crawler desc includes ICN→HND');
assert(/항공|직항/.test(tokyoPlannerKo.description), 'tokyo planner crawler desc mentions flight route');
assert(/ICN.*HND|항공/.test(tokyoPlannerKo.keywords), 'tokyo planner crawler keywords include flight route');

const phuketPlannerKo = resolveCrawlerMeta('/place/phuket/planner', 'ko');
assert(/ICN.*HKT|인천.*HKT/i.test(phuketPlannerKo.description), 'phuket tier2 planner crawler desc includes ICN→HKT');
assert(/푸켓.*항공|항공 경로/.test(phuketPlannerKo.keywords.replace(/\s/g, '')), 'phuket planner crawler flight keywords');
assert(/MOONi|무니/.test(phuketPlannerKo.description), 'phuket planner crawler desc mentions MOONi');

const tokyoWikiKo = resolveCrawlerMeta('/place/tokyo/wiki', 'ko');
assert(Boolean(tokyoWikiKo?.title), 'tokyo wiki KO meta resolved');
assert(/도쿄|스케치/.test(tokyoWikiKo.title), 'tokyo wiki KO title has sketch intent');
assert(/로컬 왓슨|현지 팁/.test(tokyoWikiKo.description), 'tokyo wiki crawler desc includes Local Watson');
assert(/자유여행/.test(tokyoWikiKo.keywords), 'tokyo wiki crawler keywords include 자유여행');
assert(parseCrawlerPath('/place/tokyo/wiki')?.tab === 'wiki', 'wiki path parsed as wiki tab');

assert(
  resolveCrawlerMeta('/place/santorini/gallery', 'ko') === null,
  'tier2 pop<70 (santorini) not in crawler meta',
);

assert(parseCrawlerPath('/korea').kind === 'hub', 'korea parsed as hub');
assert(parseCrawlerPath('/korea/theme/scenic').kind === 'hub', 'scenic parsed as hub');
assert(parseCrawlerPath('/explore').kind === 'hub', 'explore parsed as hub');
assert(parseCrawlerPath('/blog').kind === 'hub', 'blog parsed as hub');
assert(parseCrawlerPath('/blog/curation').kind === 'hub', 'curation parsed as hub');
assert(parseCrawlerPath('/explore/asia') === null, 'explore category path not in #15 scope');
assert(getCrawlerMetaKind('/place/tokyo') === 'tier1-place-base', 'base path kind tag');
assert(getCrawlerMetaKind('/') === 'home', 'home kind tag');
assert(getCrawlerMetaKind('/korea') === 'korea', 'korea kind tag');
assert(getCrawlerMetaKind('/korea/theme/scenic') === 'scenic', 'scenic kind tag');
assert(getCrawlerMetaKind('/explore') === 'explore', 'explore kind tag');
assert(getCrawlerMetaKind('/blog') === 'blog', 'blog kind tag');
assert(getCrawlerMetaKind('/blog/curation') === 'curation', 'curation kind tag');

const blogKo = resolveCrawlerMeta('/blog', 'ko');
assert(Boolean(blogKo?.title && blogKo.description), 'blog crawler meta resolved');
assert(/여행 블로그/.test(blogKo.keywords), 'blog crawler keywords include 여행 블로그');
assert(blogKo.canonicalUrl === 'https://www.gateo.kr/blog', 'blog canonical URL');

const curationKo = resolveCrawlerMeta('/blog/curation', 'ko');
assert(/큐레이션|낙원/.test(curationKo.title), 'curation crawler title has intent keywords');
assert(curationKo.canonicalUrl === 'https://www.gateo.kr/blog/curation', 'curation canonical URL');

const botReq = googlebotRequest('/place/tokyo/gallery');
assert(isCrawlerRequest(botReq), 'Googlebot detected on gallery');

const humanReq = new Request('https://www.gateo.kr/place/tokyo/gallery', {
  headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
});
assert(!isCrawlerRequest(humanReq), 'Chrome UA not treated as crawler');

const previewReq = new Request('https://www.gateo.kr/place/tokyo/gallery?crawler=1');
assert(isCrawlerRequest(previewReq), 'crawler=1 preview flag works');

for (const path of ['/', '/korea', '/korea/theme/scenic', '/explore', '/blog', '/blog/curation', '/place/tokyo', '/place/tokyo/gallery', '/place/tokyo/wiki']) {
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
assert(
  injectedTokyo.includes('og:image') && !injectedTokyo.includes('content="https://www.gateo.kr/og-image.png"'),
  'tokyo crawler og:image uses slug-specific URL',
);
assert(
  injectedTokyo.includes('application/ld+json') &&
    injectedTokyo.includes('ImageGallery') &&
    injectedTokyo.includes('ImageObject'),
  'tokyo gallery crawler injects ImageGallery JSON-LD',
);

const tokyoGalleryKoMeta = resolveCrawlerMeta('/place/tokyo/gallery', 'ko');
assert(Boolean(tokyoGalleryKoMeta?.ogImage), 'tokyo gallery meta includes ogImage');
assert(tokyoGalleryKoMeta.ogImage.startsWith('https://images.unsplash.com/'), 'tokyo ogImage is stable unsplash URL');

const injectedScenic = injectCrawlerMetaIntoHtml(indexHtml, scenicKo);
assert(injectedScenic.includes(`${scenicKo.title} | GATEO`), 'scenic title injected in head');
assert(injectedScenic.includes('rel="canonical"'), 'scenic canonical link injected');

const injectedExplore = injectCrawlerMetaIntoHtml(indexHtml, exploreKo);
assert(injectedExplore.includes(`${exploreKo.title} | GATEO`), 'explore title injected in head');
assert(injectedExplore.includes('href="https://www.gateo.kr/explore"'), 'explore canonical injected');

const injectedBlog = injectCrawlerMetaIntoHtml(indexHtml, blogKo);
assert(injectedBlog.includes(`${blogKo.title} | GATEO`), 'blog title injected in head');
assert(injectedBlog.includes('href="https://www.gateo.kr/blog"'), 'blog canonical injected');

const injectedCuration = injectCrawlerMetaIntoHtml(indexHtml, curationKo);
assert(injectedCuration.includes(`${curationKo.title} | GATEO`), 'curation title injected in head');
assert(injectedCuration.includes('href="https://www.gateo.kr/blog/curation"'), 'curation canonical injected');

const middlewareSrc = readFileSync(join(root, 'middleware.js'), 'utf8');
assert(middlewareSrc.includes('injectCrawlerMetaIntoHtml'), 'middleware wires HTML injection');
assert(middlewareSrc.includes('isCrawlerRequest'), 'middleware gates on crawler UA');
assert(middlewareSrc.includes('/korea'), 'middleware matcher includes /korea');
assert(middlewareSrc.includes('/korea/theme/scenic'), 'middleware matcher includes scenic hub');
assert(middlewareSrc.includes('/explore'), 'middleware matcher includes explore hub');
assert(middlewareSrc.includes('/blog/curation'), 'middleware matcher includes curation hub');
assert(middlewareSrc.includes('/blog'), 'middleware matcher includes blog hub');
assert(middlewareSrc.includes('/place/:slug'), 'middleware matcher includes tier1 base');
assert(middlewareSrc.includes('/place/:slug/wiki'), 'middleware matcher includes wiki tab');

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll crawler meta smoke checks passed (hub + tier1 + Googlebot).');
