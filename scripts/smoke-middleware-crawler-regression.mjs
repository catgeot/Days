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
import { isCrawlerSoft404Path, parseCrawlerPath } from '../src/edge/resolveCrawlerMeta.js';

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

const middlewareSrc = readFileSync(join(root, 'middleware.js'), 'utf8');
for (const pattern of ['/place/:slug/reviews', '/place/:slug/video', '/place/:slug/events']) {
  assert.ok(middlewareSrc.includes(pattern), `middleware matcher includes ${pattern}`);
}
const vercelJson = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.equal(vercelJson.includes('/place/:slug/reviews'), false, 'vercel.json stays unchanged');

const PLACE_TAB_SUFFIXES = ['', '/gallery', '/planner', '/wiki', '/reviews', '/video', '/events'];
const CATALOG_SLUGS = [
  ['bora-bora', '보라보라'],
  ['kyoto', '교토'],
  ['paris', '파리'],
  ['cairo', '카이로'],
  ['sapa', '사파'],
  ['khao-lak', '카오락'],
];
const OUTSIDE_SLUG = 'hwaseong-fortress';
const travelSpotSlugs = new Set(
  JSON.parse(readFileSync(join(root, 'src/pages/Home/data/travelSpots-list.json'), 'utf8')).map(
    (row) => row.slug,
  ),
);
const scenicSlugs = new Set(
  JSON.parse(readFileSync(join(root, 'src/pages/Home/data/koreaScenicSpots.json'), 'utf8')).spots.map(
    (row) => row.placeSlug,
  ),
);
for (const [slug] of CATALOG_SLUGS) {
  assert.equal(travelSpotSlugs.has(slug), true, `${slug} is a TRAVEL_SPOTS slug`);
}
assert.equal(travelSpotSlugs.has(OUTSIDE_SLUG), false, `${OUTSIDE_SLUG} is outside TRAVEL_SPOTS`);
assert.equal(scenicSlugs.has(OUTSIDE_SLUG), true, `${OUTSIDE_SLUG} is a real scenic place slug`);

function headFields(html) {
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/gi)].map((m) => m[1]);
  const ogUrls = [...html.matchAll(/<meta property="og:url" content="([^"]*)"/gi)].map((m) => m[1]);
  return {
    canonicals,
    ogUrls,
    title: html.match(/<title>([^<]*)<\/title>/i)?.[1] || '',
    description: html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '',
  };
}

/** @type {string[]} */
const tableLines = [
  '| slug | tab | UA | result | canonical | og:url | head vs root |',
  '|---|---|---|---|---|---|---|',
];

function cell(value) {
  return String(value ?? '—').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
}

function recordRow(slug, tab, uaLabel, out, note) {
  const tabLabel = tab || '(root)';
  if (out.passThrough) {
    tableLines.push(
      `| ${cell(slug)} | ${cell(tabLabel)} | ${cell(uaLabel)} | pass-through | — | — | — |`,
    );
    return;
  }
  const head = headFields(out.body);
  tableLines.push(
    `| ${cell(slug)} | ${cell(tabLabel)} | ${cell(uaLabel)} | ${cell(`${out.status} ${out.xCrawlerMeta || ''}`)} | ${cell(head.canonicals.join(' '))} | ${cell(head.ogUrls.join(' '))} | ${cell(note)} |`,
  );
}

for (const [slug, label] of CATALOG_SLUGS) {
  const rootPath = `/place/${slug}`;
  const rootBot = await runMiddleware(rootPath, GOOGLEBOT);
  assert.equal(rootBot.passThrough, false, `${label} root injects`);
  assert.equal(rootBot.status, 200, `${label} root 200`);
  const rootHead = headFields(rootBot.body);
  const rootCanonical = `https://www.gateo.kr/place/${slug}`;
  assert.deepEqual(rootHead.canonicals, [rootCanonical], `${label} root canonical`);
  assert.deepEqual(rootHead.ogUrls, [rootCanonical], `${label} root og:url`);
  recordRow(slug, '', 'Googlebot', rootBot, 'root');

  for (const suffix of PLACE_TAB_SUFFIXES) {
    if (!suffix) continue;
    const path = `${rootPath}${suffix}`;
    const tab = suffix.slice(1);
    const bot = await runMiddleware(path, GOOGLEBOT);
    const browserHit = await runMiddleware(path, CHROME);
    assert.equal(browserHit.passThrough, true, `${path} browser passes through`);
    recordRow(slug, tab, 'browser', browserHit);
    assert.equal(bot.passThrough, false, `${path} crawler injects`);
    assert.equal(bot.status, 200, `${path} status 200`);
    assert.notEqual(bot.status, 404, `${path} not 404`);
    assert.ok(!bot.robots?.includes('noindex'), `${path} no noindex`);
    const head = headFields(bot.body);
    assert.equal(head.canonicals.length, 1, `${path} one canonical`);
    assert.equal(head.ogUrls.length, 1, `${path} one og:url`);
    assert.equal(head.ogUrls[0], head.canonicals[0], `${path} og:url matches canonical`);
    assert.equal(head.canonicals[0].endsWith('/'), false, `${path} canonical has no trailing slash`);
    if (tab === 'gallery' || tab === 'planner' || tab === 'wiki') {
      assert.equal(head.canonicals[0], `https://www.gateo.kr/place/${slug}/${tab}`, `${path} keeps tab canonical`);
      assert.equal(parseCrawlerPath(path)?.kind, 'place-tab', `${path} stays place-tab`);
      assert.notEqual(head.title, rootHead.title, `${path} title stays tab-specific`);
    } else {
      const selfCanonical = `https://www.gateo.kr/place/${slug}/${tab}`;
      assert.equal(head.canonicals[0], selfCanonical, `${path} canonical is the tab URL`);
      assert.equal(head.ogUrls[0], selfCanonical, `${path} og:url is the tab URL`);
      assert.equal(head.title, rootHead.title, `${path} title stays the place copy`);
      assert.equal(head.description, rootHead.description, `${path} description stays the place copy`);
      assert.equal(bot.xCrawlerMeta, rootBot.xCrawlerMeta, `${path} same crawler kind as root`);
      assert.equal(parseCrawlerPath(path)?.kind, 'place-base', `${path} parsed as place-base`);
      assert.equal(isCrawlerSoft404Path(path), false, `${path} soft-404 policy unchanged`);
    }
    recordRow(
      slug,
      tab,
      'Googlebot',
      bot,
      tab === 'gallery' || tab === 'planner' || tab === 'wiki' ? 'tab canonical kept' : 'title+description kept; canonical=tab',
    );
  }

  const browserRoot = await runMiddleware(rootPath, CHROME);
  assert.equal(browserRoot.passThrough, true, `${rootPath} browser passes through`);
  recordRow(slug, '', 'browser', browserRoot);
}

for (const suffix of PLACE_TAB_SUFFIXES) {
  const path = `/place/${OUTSIDE_SLUG}${suffix}`;
  const tab = suffix ? suffix.slice(1) : '';
  for (const [ua, uaLabel] of [
    [GOOGLEBOT, 'Googlebot'],
    [CHROME, 'browser'],
  ]) {
    const out = await runMiddleware(path, ua);
    assert.equal(out.passThrough, true, `${path} ${uaLabel} passes through (no 404)`);
    recordRow(OUTSIDE_SLUG, tab, uaLabel, out);
  }
  assert.equal(isCrawlerSoft404Path(path), false, `${path} soft-404 flag stays off`);
}

for (const suffix of ['/reviews', '/video', '/events']) {
  const path = `/place/this-slug-does-not-exist-zz${suffix}`;
  const out = await runMiddleware(path, GOOGLEBOT);
  assert.equal(out.passThrough, true, `${path} unknown place passes through`);
  assert.equal(isCrawlerSoft404Path(path), false, `${path} not a soft 404`);
}

for (const suffix of ['', '/reviews', '/video', '/events']) {
  const path = `/place/tour-127635${suffix}`;
  const out = await runMiddleware(path, GOOGLEBOT);
  assert.equal(out.passThrough, true, `${path} tour slug outside bundle passes through`);
}

const reviewQuery = await runMiddleware('/place/cairo/reviews?review=abc', GOOGLEBOT);
const reviewQueryHead = headFields(reviewQuery.body);
assert.deepEqual(reviewQueryHead.canonicals, ['https://www.gateo.kr/place/cairo/reviews'], 'review deeplink canonical drops extra query');
assert.deepEqual(reviewQueryHead.ogUrls, ['https://www.gateo.kr/place/cairo/reviews'], 'review deeplink og:url drops extra query');

const enAlias = await runMiddleware('/place/paris/reviews?lang=en', GOOGLEBOT);
const enRoot = await runMiddleware('/place/paris?lang=en', GOOGLEBOT);
const enAliasHead = headFields(enAlias.body);
const enRootHead = headFields(enRoot.body);
assert.deepEqual(enAliasHead.canonicals, ['https://www.gateo.kr/place/paris/reviews?lang=en'], 'en alias canonical keeps lang and the tab');
assert.deepEqual(enAliasHead.ogUrls, ['https://www.gateo.kr/place/paris/reviews?lang=en'], 'en alias og:url keeps lang and the tab');
assert.equal(enAliasHead.title, enRootHead.title, 'en alias title matches root');
assert.equal(enAliasHead.description, enRootHead.description, 'en alias description matches root');
assert.deepEqual(enRootHead.canonicals, ['https://www.gateo.kr/place/paris?lang=en'], 'en place root canonical unchanged');

const blog = await runMiddleware('/blog/e/paris-travelogue', GOOGLEBOT);
assert.equal(headFields(blog.body).canonicals[0], 'https://www.gateo.kr/blog/e/paris-travelogue', 'blog canonical unchanged');

const WORLD_EVENT_SAMPLES = [
  '/world-events/vienna-staatsoper-season-2026',
  '/world-events/edinburgh-fringe-2026',
  '/world-events/munich-oktoberfest-2026',
];
for (const path of WORLD_EVENT_SAMPLES) {
  const bot = await runMiddleware(path, GOOGLEBOT);
  const browserHit = await runMiddleware(path, CHROME);
  assert.equal(browserHit.passThrough, true, `${path} browser passes through`);
  assert.equal(bot.passThrough, false, `${path} crawler injects`);
  assert.equal(bot.status, 200, `${path} status 200`);
  assert.equal(bot.xCrawlerMeta, 'world-event', `${path} kind`);
  const head = headFields(bot.body);
  assert.deepEqual(head.canonicals, [`https://www.gateo.kr${path}`], `${path} canonical`);
  assert.deepEqual(head.ogUrls, [`https://www.gateo.kr${path}`], `${path} og:url`);
  assert.equal(head.title.includes('AI 도슨트와 함께하는 3D'), false, `${path} is not the home title`);
}
const unknownEvent = await runMiddleware('/world-events/not-a-real-event', GOOGLEBOT);
assert.equal(unknownEvent.passThrough, true, 'unknown world event passes through');
const unknownBrowser = await runMiddleware('/world-events/not-a-real-event', CHROME);
assert.equal(unknownBrowser.passThrough, true, 'unknown world event browser passes through');
const worldHub = await runMiddleware('/world-events', GOOGLEBOT);
assert.equal(headFields(worldHub.body).canonicals[0], 'https://www.gateo.kr/world-events', 'world-events hub canonical unchanged');
const enEvent = await runMiddleware('/world-events/vienna-staatsoper-season-2026?lang=en', GOOGLEBOT);
assert.equal(
  headFields(enEvent.body).canonicals[0],
  'https://www.gateo.kr/world-events/vienna-staatsoper-season-2026?lang=en',
  'en world event canonical keeps lang',
);
assert.ok(middlewareSrc.includes('/world-events/:eventId'), 'middleware matcher includes world event detail');

console.log(tableLines.join('\n'));

globalThis.fetch = prevFetch;
process.env.VITE_SUPABASE_URL = prevUrl;
process.env.VITE_SUPABASE_ANON_KEY = prevKey;

console.log('smoke-middleware-crawler-regression OK');
