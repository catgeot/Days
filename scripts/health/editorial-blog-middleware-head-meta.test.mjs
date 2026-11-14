import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { isCrawlerRequest } from '../../src/edge/botDetect.js';
import crawlerEditorialMeta from '../../src/edge/crawlerEditorialMeta.generated.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** UA → expected middleware class for /blog/e/* (see test plan at bottom). */
export const EDITORIAL_BLOG_UA_MATRIX = [
  { label: 'Chrome (browser)', ua: CHROME, expectInject: true, crawlerGate: 'editorial-shell' },
  { label: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', expectInject: true, crawlerGate: 'crawler' },
  {
    label: 'KakaoTalk scraper',
    ua: 'kakaotalk-scrap/1.0',
    expectInject: true,
    crawlerGate: 'crawler',
  },
  {
    label: 'Facebook',
    ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    expectInject: true,
    crawlerGate: 'crawler',
  },
  { label: 'Facebot', ua: 'Facebot', expectInject: true, crawlerGate: 'crawler' },
  { label: 'Twitterbot', ua: 'Twitterbot/1.0', expectInject: true, crawlerGate: 'crawler' },
  { label: 'Naver Yeti', ua: 'Mozilla/5.0 (compatible; Yeti/1.1; +http://naver.me/spd)', expectInject: true, crawlerGate: 'crawler' },
  {
    label: 'Slackbot',
    ua: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    expectInject: true,
    crawlerGate: 'crawler',
  },
];

const BLOG_SLUGS = ['rome-travelogue', 'short-20261111-week-festivals'];

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
  if (prevFetch) return prevFetch(input, init);
  throw new Error(`unexpected fetch: ${url}`);
};

const { default: middleware } = await import(join(root, 'middleware.js'));

function parseHeadField(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1].replaceAll('&amp;', '&') : null;
}

function parseInjectedHead(html) {
  assert.ok(html.includes('<!-- crawler-meta-injected -->'), 'crawler meta injected marker');
  return {
    title: parseHeadField(html, /<title>([^<]*)<\/title>/i),
    description: parseHeadField(html, /<meta name="description" content="([^"]*)"/i),
    canonical: parseHeadField(html, /<link rel="canonical" href="([^"]+)"/i),
    ogTitle: parseHeadField(html, /<meta property="og:title" content="([^"]*)"/i),
    ogDescription: parseHeadField(html, /<meta property="og:description" content="([^"]*)"/i),
    ogUrl: parseHeadField(html, /<meta property="og:url" content="([^"]*)"/i),
    ogImage: parseHeadField(html, /<meta property="og:image" content="([^"]*)"/i),
    twitterTitle: parseHeadField(html, /<meta name="twitter:title" content="([^"]*)"/i),
    twitterDescription: parseHeadField(html, /<meta name="twitter:description" content="([^"]*)"/i),
    twitterImage: parseHeadField(html, /<meta name="twitter:image" content="([^"]*)"/i),
  };
}

async function runEditorialMiddleware(slug, ua) {
  const req = new Request(`https://www.gateo.kr/blog/e/${slug}`, { headers: { 'user-agent': ua } });
  const res = await middleware(req);
  if (res === undefined) return { passThrough: true };
  const html = await res.text();
  return { passThrough: false, status: res.status, html };
}

test('botDetect recognises social preview crawlers including Facebot', () => {
  for (const row of EDITORIAL_BLOG_UA_MATRIX) {
    if (row.crawlerGate !== 'crawler') continue;
    const req = new Request('https://www.gateo.kr/blog/e/rome-travelogue', { headers: { 'user-agent': row.ua } });
    assert.equal(isCrawlerRequest(req), true, `${row.label} is a crawler UA`);
  }
  const browserReq = new Request('https://www.gateo.kr/blog/e/rome-travelogue', { headers: { 'user-agent': CHROME } });
  assert.equal(isCrawlerRequest(browserReq), false, 'Chrome is not a crawler UA');
});

for (const slug of BLOG_SLUGS) {
  const bundle = crawlerEditorialMeta[slug]?.ko;
  assert.ok(bundle, `fixture has ko meta for ${slug}`);

  test(`/blog/e/${slug} initial HTML meta for each UA variant`, async () => {
    const expectedCanonical = `https://www.gateo.kr/blog/e/${slug}`;
    const expectedTitle = `${bundle.title} | GATEO`;

    for (const row of EDITORIAL_BLOG_UA_MATRIX) {
      const out = await runEditorialMiddleware(slug, row.ua);
      assert.equal(out.passThrough, false, `${row.label}: middleware injects HTML`);
      assert.equal(out.status, 200, `${row.label}: status 200`);
      const head = parseInjectedHead(out.html);
      assert.equal(head.canonical, expectedCanonical, `${row.label}: canonical www gateo`);
      assert.equal(head.title, expectedTitle, `${row.label}: title`);
      assert.equal(head.description, bundle.description, `${row.label}: description`);
      assert.equal(head.ogTitle, expectedTitle, `${row.label}: og:title`);
      assert.equal(head.ogDescription, bundle.description, `${row.label}: og:description`);
      assert.equal(head.ogUrl, expectedCanonical, `${row.label}: og:url`);
      assert.equal(head.ogImage, bundle.ogImage, `${row.label}: og:image`);
      assert.equal(head.twitterTitle, expectedTitle, `${row.label}: twitter:title`);
      assert.equal(head.twitterDescription, bundle.description, `${row.label}: twitter:description`);
      assert.equal(head.twitterImage, bundle.ogImage, `${row.label}: twitter:image`);
    }
  });
}

test('browser UA still passes through non-editorial pages', async () => {
  const req = new Request('https://www.gateo.kr/place/rome', { headers: { 'user-agent': CHROME } });
  const res = await middleware(req);
  assert.equal(res, undefined, 'place page browser pass-through');
});

globalThis.fetch = prevFetch;
process.env.VITE_SUPABASE_URL = prevUrl;
process.env.VITE_SUPABASE_ANON_KEY = prevKey;