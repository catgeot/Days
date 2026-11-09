#!/usr/bin/env node
/**
 * Writes crawler regression artifact for search exposure P1.
 *
 *   node scripts/verify-search-exposure-p1-samples.mjs [ORIGIN]
 *
 * Default ORIGIN=https://www.gateo.kr (pre-merge: validates only paths that exist on origin;
 * post-merge Preview: pass preview git URL).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveCrawlerMeta } from '../src/edge/resolveCrawlerMeta.js';
import { isCrawlerRequest } from '../src/edge/botDetect.js';

const ORIGIN = (process.argv[2] || process.env.SMOKE_SITE_URL || 'https://www.gateo.kr').replace(/\/$/, '');
const GOOGLEBOT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const YETI = 'Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)';

const SAMPLES = [
  { path: '/place/tokyo/gallery', expectStatus: 200, kind: 'tier1-place' },
  { path: '/place/paris', expectStatus: 200, kind: 'tier1-place-base' },
  { path: '/place/phuket/planner', expectStatus: 200, kind: 'tier1-place' },
  { path: '/place/bangkok/wiki', expectStatus: 200, kind: 'tier1-place' },
  { path: '/place/seoul/gallery', expectStatus: 200, kind: 'tier1-place' },
  { path: '/place/busan', expectStatus: 200, allowNoInject: true },
  { path: '/place/sokcho-beach', expectStatus: 200, allowNoInject: true },
  { path: '/place/tour-127635', expectStatus: 200, allowNoInject: true },
  { path: '/place/busan/gallery', expectStatus: 200, allowNoInject: true },
  { path: '/place/moorea', expectStatus: 200, allowNoInject: true },
  { path: '/korea/theme/scenic', expectStatus: 200, kind: 'scenic' },
  { path: '/explore/asia/paradise', expectStatus: 200, kind: 'explore-category' },
  { path: '/blog/e/paris-travelogue', expectStatus: 200, kind: 'editorial-logbook' },
  { path: '/blog/e/kyoto-travelogue', expectStatus: 200, kind: 'editorial-logbook' },
  { path: '/blog/e/sydney-travelogue', expectStatus: 200, kind: 'editorial-logbook' },
  { path: '/blog/e/this-slug-does-not-exist-zz', expectStatus: 200, allowNoInject: true, passThrough: true },
  { path: '/place/this-slug-does-not-exist-zz', expectStatus: 200, allowNoInject: true, passThrough: true },
];

async function fetchCrawler(path, ua) {
  const url = `${ORIGIN}${path}`;
  const res = await fetch(url, {
    headers: { 'user-agent': ua },
    redirect: 'follow',
  });
  const html = await res.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || null;
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || null;
  const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || null;
  const xMeta = res.headers.get('x-crawler-meta');
  return {
    url,
    status: res.status,
    xCrawlerMeta: xMeta,
    title,
    canonical,
    robots,
    hasCrawlerInject: html.includes('<!-- crawler-meta-injected -->'),
  };
}

const localChecks = SAMPLES.filter((s) => s.kind === 'editorial-logbook').map((sample) => {
  const ko = resolveCrawlerMeta(sample.path, 'ko');
  return {
    path: sample.path,
    localCanonical: ko?.canonicalUrl || null,
    localTitle: ko ? `${ko.title} | GATEO` : null,
    editorialSlug: ko?.editorialSlug || null,
  };
});

const remote = [];
for (const sample of SAMPLES) {
  for (const ua of [GOOGLEBOT, YETI]) {
    try {
      const row = await fetchCrawler(sample.path, ua);
      remote.push({ ...sample, ua: ua.includes('Yeti') ? 'Yeti' : 'Googlebot', ...row });
    } catch (err) {
      remote.push({ ...sample, ua: ua.includes('Yeti') ? 'Yeti' : 'Googlebot', error: String(err) });
    }
  }
}

const botOk = isCrawlerRequest(
  new Request(`${ORIGIN}/place/tokyo`, { headers: { 'user-agent': YETI } }),
);

const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'search-exposure-p1-crawler-samples.json');
const report = {
  generatedAt: new Date().toISOString(),
  origin: ORIGIN,
  botDetectYeti: botOk,
  localMetaChecks: localChecks,
  remoteCrawlerFetches: remote,
};
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

let failed = 0;
for (const row of remote) {
  if (row.error) {
    failed += 1;
    continue;
  }
  if (row.status !== row.expectStatus) failed += 1;
  if (row.robots?.includes('noindex')) failed += 1;
  if (row.status === 404) failed += 1;
  if (!row.allowNoInject) {
    if (!row.hasCrawlerInject) failed += 1;
    if (!row.canonical) failed += 1;
  }
  if (row.kind === 'editorial-logbook' && !row.canonical) failed += 1;
}

if (failed > 0) {
  console.error(`verify-search-exposure-p1-samples: ${failed} remote check(s) failed (origin may lack this PR until Preview deploy)`);
  console.error(`artifact: ${outPath}`);
  process.exit(1);
}

console.log(`verify-search-exposure-p1-samples OK — artifact ${outPath}`);
