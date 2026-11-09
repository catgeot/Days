#!/usr/bin/env node
/**
 * Crawler middleware regression — direct middleware() calls (mocked index.html fetch).
 *
 *   node scripts/smoke-middleware-crawler-regression.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const GOOGLEBOT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const prevFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes('/index.html') && init?.headers?.['x-middleware-subrequest'] === '1') {
    return new Response(indexHtml, { status: 200 });
  }
  if (prevFetch) return prevFetch(input, init);
  throw new Error(`unexpected fetch: ${url}`);
};

const { default: middleware } = await import(join(root, 'middleware.js'));

const PLACE_PATHS = [
  '/place/busan',
  '/place/sokcho-beach',
  '/place/tour-127635',
  '/place/busan/gallery',
  '/place/moorea',
  '/place/this-slug-does-not-exist-zz',
];

const EDITORIAL_PATHS = [
  '/blog/e/kyoto-travelogue',
  '/blog/e/sydney-travelogue',
  '/blog/e/this-slug-does-not-exist-zz',
];

async function runMiddleware(path, ua) {
  const req = new Request(`https://www.gateo.kr${path}`, {
    headers: { 'user-agent': ua },
  });
  const res = await middleware(req);
  if (res === undefined) return { passThrough: true };
  const html = await res.text();
  return {
    passThrough: false,
    status: res.status,
    xCrawlerMeta: res.headers.get('x-crawler-meta'),
    robots: html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || null,
    canonical: html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || null,
    hasCrawlerInject: html.includes('<!-- crawler-meta-injected -->'),
  };
}

for (const path of PLACE_PATHS) {
  const out = await runMiddleware(path, GOOGLEBOT);
  if (!out.passThrough) {
    assert.notEqual(out.status, 404, `${path} crawler not 404`);
    assert.ok(!out.robots?.includes('noindex'), `${path} no noindex`);
  }
}

for (const path of EDITORIAL_PATHS) {
  const out = await runMiddleware(path, GOOGLEBOT);
  if (path.includes('kyoto') || path.includes('sydney')) {
    assert.equal(out.passThrough, false, `${path} injects crawler meta`);
    assert.equal(out.status, 200, `${path} status 200`);
    assert.ok(out.canonical, `${path} canonical`);
    assert.ok(!out.robots?.includes('noindex'), `${path} no noindex`);
  } else {
    assert.equal(out.passThrough, true, `${path} unknown editorial passes through`);
  }
}

const browser = await runMiddleware('/place/busan', CHROME);
assert.equal(browser.passThrough, true, 'browser passes through middleware');

globalThis.fetch = prevFetch;

console.log('smoke-middleware-crawler-regression OK');
