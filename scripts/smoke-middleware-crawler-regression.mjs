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

const LIVE_ONLY_SLUG = 'only-in-supabase-not-build';

const prevFetch = globalThis.fetch;
const prevUrl = process.env.VITE_SUPABASE_URL;
const prevKey = process.env.VITE_SUPABASE_ANON_KEY;
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJ-test-key';

globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes('/index.html') && init?.headers?.['x-middleware-subrequest'] === '1') {
    return new Response(indexHtml, { status: 200 });
  }
  if (url.includes('/rest/v1/reports')) {
    if (url.includes(LIVE_ONLY_SLUG) && url.includes('slug%2Ctitle')) {
      return new Response(
        JSON.stringify([
          {
            slug: LIVE_ONLY_SLUG,
            title: '빌드 후 새 글',
            dek: '동적 메타 데크',
            content: '본문',
            images: null,
            published_at: '2026-11-17T00:00:00.000Z',
            place_slug: 'rome',
          },
        ]),
        { status: 200 },
      );
    }
    if (url.includes('slug%2Cpublished_at')) {
      return new Response(JSON.stringify([{ slug: LIVE_ONLY_SLUG, published_at: '2026-11-17' }]), {
        status: 200,
      });
    }
    return new Response('[]', { status: 200 });
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
  `/blog/e/${LIVE_ONLY_SLUG}`,
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
    xSource: res.headers.get('x-crawler-meta-source'),
    robots: html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || null,
    canonical: html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || null,
    hasCrawlerInject: html.includes('<!-- crawler-meta-injected -->'),
    body: html,
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
  } else if (path.includes(LIVE_ONLY_SLUG)) {
    assert.equal(out.passThrough, false, `${path} live-only injects`);
    assert.equal(out.status, 200, `${path} status 200`);
    assert.equal(out.xSource, 'live', `${path} live meta source`);
    assert.equal(out.canonical, `https://www.gateo.kr/blog/e/${LIVE_ONLY_SLUG}`);
    assert.ok(out.body.includes('빌드 후 새 글'), `${path} post title in html`);
  } else {
    assert.equal(out.passThrough, true, `${path} unknown editorial passes through`);
  }
}

const blogSitemapRes = await middleware(new Request('https://www.gateo.kr/sitemap-blog.xml'));
assert.ok(blogSitemapRes, 'sitemap-blog middleware returns response');
const blogXml = await blogSitemapRes.text();
assert.ok(blogXml.includes(`/blog/e/${LIVE_ONLY_SLUG}`), 'sitemap-blog includes live slug');

const browser = await runMiddleware('/place/busan', CHROME);
assert.equal(browser.passThrough, true, 'browser passes through middleware');

const browserEditorial = await runMiddleware('/blog/e/rome-travelogue', CHROME);
assert.equal(browserEditorial.passThrough, false, 'browser on /blog/e injects editorial shell meta');
assert.equal(
  browserEditorial.canonical,
  'https://www.gateo.kr/blog/e/rome-travelogue',
  'browser editorial canonical',
);

const kakaoEditorial = await runMiddleware(
  '/blog/e/short-20261111-week-festivals',
  'kakaotalk-scrap/1.0',
);
assert.equal(kakaoEditorial.passThrough, false, 'kakao editorial injects');
assert.ok(kakaoEditorial.hasCrawlerInject, 'kakao editorial crawler-meta marker');

globalThis.fetch = prevFetch;
process.env.VITE_SUPABASE_URL = prevUrl;
process.env.VITE_SUPABASE_ANON_KEY = prevKey;

console.log('smoke-middleware-crawler-regression OK');
