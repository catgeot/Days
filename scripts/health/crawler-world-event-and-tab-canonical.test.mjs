import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { PLACE_URL_TAB_BY_MEDIA_MODE } from '../../src/components/PlaceCard/common/placeMediaTabRoutes.js';
import crawlerPlaceMeta from '../../src/edge/crawlerPlaceMeta.generated.js';
import { injectCrawlerMetaIntoHtml } from '../../src/edge/injectCrawlerMeta.js';
import { parseCrawlerPath, resolveCrawlerMeta } from '../../src/edge/resolveCrawlerMeta.js';
import { buildWorldEventCrawlerMetaFromEvent } from '../../src/edge/worldEventCrawlerMeta.js';
import { buildLocalePageUrl } from '../../src/i18n/seoUrls.js';
import { getAllWorldEvents } from '../../src/utils/worldEvents.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const ROUTER_TABS = [...new Set(Object.values(PLACE_URL_TAB_BY_MEDIA_MODE))];
const SENTENCE_OR_ELLIPSIS = /[.!?。！？…]$/;
const HANGUL_START = /^[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/;
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function metaContent(html, pattern) {
  return html.match(pattern)?.[1] ?? '';
}

function assertDescription(description, label) {
  assert.ok(description.length > 0 && description.length <= 155, `${label} is ${description.length} chars`);
  assert.match(description, SENTENCE_OR_ELLIPSIS, `${label} ends with ${JSON.stringify(description.slice(-12))}`);
  assert.equal(description.includes('<'), false, label);
}

test('world event samples and an unknown id', () => {
  const samples = [
    ['/world-events/vienna-staatsoper-season-2026', 'ko', '빈 국립오페라 시즌 — 빈'],
    ['/world-events/edinburgh-fringe-2026', 'ko', '에든버러 프린지 — 에딘버러'],
    ['/world-events/munich-oktoberfest-2026', 'ko', '옥토버페스트 — 뮌헨'],
    ['/world-events/vienna-staatsoper-season-2026', 'en', 'Vienna State Opera Season — Vienna'],
  ];
  for (const [path, locale, title] of samples) {
    const meta = resolveCrawlerMeta(path, locale);
    assert.ok(meta, path);
    assert.equal(meta.title, title, path);
    assert.equal(meta.canonicalUrl, buildLocalePageUrl(path, locale), path);
    assertDescription(meta.description, `${path} ${locale}`);
    if (locale === 'en') assert.equal(HANGUL_START.test(meta.description), false, meta.description);
    const html = injectCrawlerMetaIntoHtml(indexHtml, meta);
    assert.equal(metaContent(html, /<title>([^<]*)<\/title>/i), `${title} | GATEO`);
    assert.equal(metaContent(html, /<link rel="canonical" href="([^"]+)"/i), meta.canonicalUrl);
    assert.equal(metaContent(html, /<meta property="og:url" content="([^"]+)"/i), meta.canonicalUrl);
    assert.equal(metaContent(html, /<meta property="og:title" content="([^"]+)"/i), `${title} | GATEO`);
    assert.match(metaContent(html, /<meta property="og:image" content="([^"]+)"/i), /^https:\/\//);
    assert.equal(html.includes('GATEO | AI 도슨트와 함께하는 3D'), false);
  }

  const vienna = resolveCrawlerMeta('/world-events/vienna-staatsoper-season-2026', 'ko');
  assert.match(vienna.description, /2026년 9월 1일/);
  assert.match(vienna.description, /오페라/);
  assert.match(vienna.description, /빈/);
  const viennaEn = resolveCrawlerMeta('/world-events/vienna-staatsoper-season-2026', 'en');
  assert.match(viennaEn.description, /Sep 1, 2026/);
  assert.match(viennaEn.description, /Vienna/);
  const fringeEn = resolveCrawlerMeta('/world-events/edinburgh-fringe-2026', 'en');
  assert.match(fringeEn.description, /performing arts|Fringe|Edinburgh/);
  assert.equal(HANGUL_START.test(fringeEn.description), false);

  assert.equal(resolveCrawlerMeta('/world-events/not-a-real-event', 'ko'), null);
  assert.equal(resolveCrawlerMeta('/world-events/not-a-real-event', 'en'), null);
  assert.equal(parseCrawlerPath('/world-events/not-a-real-event')?.kind, 'world-event');
  assert.equal(resolveCrawlerMeta('/world-events/', 'ko').canonicalUrl, 'https://www.gateo.kr/world-events');
  assert.equal(resolveCrawlerMeta('/place/paris', 'ko').canonicalUrl, 'https://www.gateo.kr/place/paris');
  assert.equal(
    resolveCrawlerMeta('/blog/e/paris-travelogue', 'ko').canonicalUrl,
    'https://www.gateo.kr/blog/e/paris-travelogue',
  );
});

test('every world event description stays within 155 characters and English does not start with Hangul', () => {
  const events = getAllWorldEvents();
  assert.ok(events.length >= 3);
  for (const event of events) {
    for (const locale of ['ko', 'en']) {
      const meta = resolveCrawlerMeta(`/world-events/${event.id}`, locale);
      assert.ok(meta, `${event.id} ${locale}`);
      assert.equal(meta.title.includes('| GATEO'), false, event.id);
      assert.match(meta.title, / — /, event.id);
      assert.equal(meta.canonicalUrl, buildLocalePageUrl(`/world-events/${event.id}`, locale));
      assertDescription(meta.description, `${event.id} ${locale}`);
      if (locale === 'en') {
        assert.equal(HANGUL_START.test(meta.description), false, `${event.id}: ${meta.description.slice(0, 40)}`);
      }
      const html = injectCrawlerMetaIntoHtml(indexHtml, meta);
      assert.equal((html.match(/<link rel="canonical"/gi) || []).length, 1, event.id);
      assert.equal((html.match(/<meta property="og:url"/gi) || []).length, 1, event.id);
      assert.equal((html.match(/<meta property="og:description"/gi) || []).length, 1, event.id);
    }
  }
});

test('router tab canonicals point at the tab and place root stays put', () => {
  assert.deepEqual([...ROUTER_TABS].sort(), ['events', 'gallery', 'planner', 'reviews', 'video', 'wiki']);
  const slugs = Object.keys(crawlerPlaceMeta);
  assert.ok(slugs.length > 10);
  for (const slug of slugs) {
    for (const locale of ['ko', 'en']) {
      const rootMeta = resolveCrawlerMeta(`/place/${slug}`, locale);
      assert.equal(rootMeta.canonicalUrl, buildLocalePageUrl(`/place/${slug}`, locale), `${slug} root`);
      for (const tab of ROUTER_TABS) {
        const path = `/place/${slug}/${tab}`;
        const meta = resolveCrawlerMeta(path, locale);
        assert.ok(meta, path);
        assert.equal(meta.canonicalUrl, buildLocalePageUrl(path, locale), path);
        const html = injectCrawlerMetaIntoHtml(indexHtml, meta);
        assert.equal(metaContent(html, /<meta property="og:url" content="([^"]+)"/i), meta.canonicalUrl, path);
        if (tab === 'reviews' || tab === 'video' || tab === 'events') {
          assertDescription(meta.description, `${path} ${locale}`);
          if (locale === 'en') assert.equal(HANGUL_START.test(meta.description), false, path);
        }
      }
    }
  }
  const video = resolveCrawlerMeta('/place/cape-verde/video', 'ko');
  const base = resolveCrawlerMeta('/place/cape-verde', 'ko');
  assert.equal(video.title, '카보베르데 여행 영상');
  assert.notEqual(video.description, base.description);
  assert.equal(video.canonicalUrl, 'https://www.gateo.kr/place/cape-verde/video');
});

test('world event text is escaped and an unknown id does not throw', () => {
  const meta = buildWorldEventCrawlerMetaFromEvent(
    {
      id: 'escape-fixture',
      slug: 'vienna',
      title: 'A & B <script>alert(1)</script>',
      titleEn: 'A & B <script>alert(1)</script>',
      startDate: '2026-09-01',
      endDate: '2027-06-30',
      detailOverview: '5 < 6 & "7".',
      detailOverviewEn: '5 < 6 & "7".',
    },
    'ko',
  );
  assert.equal(meta.title, 'A & B — 빈');
  assert.match(meta.description, /5 < 6 & "7"/);
  const html = injectCrawlerMetaIntoHtml(indexHtml, meta);
  assert.equal(html.includes('<script>alert'), false);
  assert.match(html, /A &amp; B — 빈 \| GATEO/);
  assert.match(html, /5 &lt; 6 &amp; &quot;7&quot;/);
  assert.equal(resolveCrawlerMeta('/world-events/%', 'ko'), null);
  assert.equal(resolveCrawlerMeta('/world-events/vienna-staatsoper-season-2026/extra', 'ko'), null);
});

test('browser user agent passes through and Googlebot receives the event head', async () => {
  const prev = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('/index.html') && init?.headers?.['x-middleware-subrequest'] === '1') {
      return new Response(indexHtml, { status: 200 });
    }
    throw new Error(`unexpected fetch ${url}`);
  };
  try {
    const { default: middleware } = await import('../../middleware.js');
    const browser = await middleware(
      new Request('https://www.gateo.kr/world-events/vienna-staatsoper-season-2026', {
        headers: { 'user-agent': CHROME },
      }),
    );
    assert.equal(browser, undefined);
    const bot = await middleware(
      new Request('https://www.gateo.kr/world-events/vienna-staatsoper-season-2026', {
        headers: { 'user-agent': GOOGLEBOT },
      }),
    );
    assert.equal(bot.status, 200);
    assert.equal(bot.headers.get('x-crawler-meta'), 'world-event');
    const html = await bot.text();
    assert.match(html, /빈 국립오페라 시즌 — 빈 \| GATEO/);
    assert.match(html, /rel="canonical" href="https:\/\/www\.gateo\.kr\/world-events\/vienna-staatsoper-season-2026"/);
    const missing = await middleware(
      new Request('https://www.gateo.kr/world-events/not-a-real-event', {
        headers: { 'user-agent': GOOGLEBOT },
      }),
    );
    assert.equal(missing, undefined);
  } finally {
    globalThis.fetch = prev;
  }
});
