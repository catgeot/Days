import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePlaceCardBack } from '../../src/pages/Home/lib/placeCardBack.js';
import {
  articleClickedLinkScrollY,
  articleLinkRestoreTarget,
  isArticleReaderPath,
  isBlogOwnerArticlePath,
  isLogbookReaderPath,
  isPlaceReviewReaderPath,
  resolveLogbookDetailBack,
  sameOriginAppPath,
  selectLogbookDetailReturn,
  selectLogbookReaderOrigin,
} from '../../src/shared/navigation/logbookDetailBack.js';
import {
  articleBodyPlaceOrFestivalTo,
  classifyLogbookMarkdownHref,
} from '../../src/shared/navigation/logbookMarkdownHref.js';

const PLACE = '/place/taj-mahal?lang=ko';
const READER = '/blog/e/taj-mahal-travelogue?lang=ko';

test('isLogbookReaderPath is editorial and public posts only', () => {
  assert.equal(isLogbookReaderPath(READER), true);
  assert.equal(isLogbookReaderPath('/p/abc'), true);
  assert.equal(isLogbookReaderPath('/blog?tab=public'), false);
  assert.equal(isLogbookReaderPath('/place/rome'), false);
  assert.equal(isLogbookReaderPath('/pricing'), false);
});

test('isArticleReaderPath includes owner posts and review articles', () => {
  assert.equal(isArticleReaderPath(READER), true);
  assert.equal(isArticleReaderPath('/p/abc'), true);
  assert.equal(isArticleReaderPath('/blog/owner-post-1'), true);
  assert.equal(isBlogOwnerArticlePath('/blog/owner-post-1?lang=ko'), true);
  assert.equal(isPlaceReviewReaderPath('/place/rome/reviews?review=1'), true);
  assert.equal(isArticleReaderPath('/place/rome/reviews?review=1'), true);
  assert.equal(isArticleReaderPath('/blog'), false);
  assert.equal(isArticleReaderPath('/blog?tab=public'), false);
  assert.equal(isArticleReaderPath('/blog/write'), false);
  assert.equal(isArticleReaderPath('/blog/curation'), false);
  assert.equal(isArticleReaderPath('/blog/e'), false);
  assert.equal(isArticleReaderPath('/place/rome'), false);
  assert.equal(isArticleReaderPath('/explore'), false);
  assert.equal(isArticleReaderPath('/korea/?festival=1'), false);
});

test('sameOriginAppPath keeps path and query', () => {
  assert.equal(
    sameOriginAppPath('https://www.gateo.kr/place/rome/reviews?lang=ko', 'https://www.gateo.kr'),
    '/place/rome/reviews?lang=ko',
  );
  assert.equal(sameOriginAppPath('https://news.example/post', 'https://www.gateo.kr'), null);
  assert.equal(sameOriginAppPath('', 'https://www.gateo.kr'), null);
});

test('SPA history returns to the in-app page, including blog query', () => {
  assert.deepEqual(
    resolveLogbookDetailBack({
      historyIdx: 2,
      prevPath: '/blog?tab=public&location=rome&lang=ko',
      historyLength: 3,
      referrer: '',
      origin: 'https://www.gateo.kr',
      fallback: '/blog',
    }),
    { type: 'history' },
  );
});

test('SPA prev place assigns that URL instead of a layout pop', () => {
  assert.deepEqual(
    resolveLogbookDetailBack({
      historyIdx: 2,
      prevPath: PLACE,
      historyLength: 3,
      referrer: '',
      origin: 'https://www.gateo.kr',
      fallback: '/blog',
    }),
    { type: 'assign', path: PLACE },
  );
});

test('full-page in-app referrer uses history even when the router index was reset', () => {
  assert.deepEqual(
    resolveLogbookDetailBack({
      historyIdx: 0,
      prevPath: null,
      historyLength: 2,
      referrer: `https://www.gateo.kr${PLACE}`,
      origin: 'https://www.gateo.kr',
      fallback: '/blog',
    }),
    { type: 'history' },
  );
});

test('direct load and external referrer fall back to /blog', () => {
  assert.deepEqual(
    resolveLogbookDetailBack({
      historyIdx: 0,
      prevPath: null,
      historyLength: 1,
      referrer: `https://www.gateo.kr${PLACE}`,
      origin: 'https://www.gateo.kr',
      returnTo: PLACE,
      fallback: '/blog?lang=en',
    }),
    { type: 'assign', path: '/blog?lang=en' },
  );
  assert.deepEqual(
    resolveLogbookDetailBack({
      historyIdx: 0,
      prevPath: null,
      historyLength: 2,
      referrer: 'https://news.example/story',
      origin: 'https://www.gateo.kr',
      returnTo: PLACE,
      fallback: '/blog',
    }),
    { type: 'assign', path: '/blog' },
  );
});

test('fresh returnTo is used only when the referrer was stripped', () => {
  assert.deepEqual(
    resolveLogbookDetailBack({
      historyIdx: 0,
      prevPath: null,
      historyLength: 2,
      referrer: '',
      origin: 'https://www.gateo.kr',
      returnTo: PLACE,
      fallback: '/blog',
    }),
    { type: 'assign', path: PLACE },
  );
});

test('selectLogbookDetailReturn ignores a stale direct entry', () => {
  const stored = { path: PLACE, forPath: READER, savedAt: 1_000 };
  assert.equal(
    selectLogbookDetailReturn(stored, {
      currentPath: READER,
      referrer: '',
      origin: 'https://www.gateo.kr',
      now: 60_000,
      navType: 'navigate',
    }),
    null,
  );
  assert.equal(
    selectLogbookDetailReturn(stored, {
      currentPath: READER,
      referrer: '',
      origin: 'https://www.gateo.kr',
      now: 2_000,
      navType: 'navigate',
    }),
    PLACE,
  );
  assert.equal(
    selectLogbookDetailReturn(stored, {
      currentPath: READER,
      referrer: 'https://news.example/',
      origin: 'https://www.gateo.kr',
      now: 2_000,
      navType: 'navigate',
    }),
    null,
  );
});

test('place ← pops to a reader and still pushes the blog hub', () => {
  assert.deepEqual(
    resolvePlaceCardBack({
      historyIdx: 2,
      prevPath: READER,
      returnTo: '/blog?tab=public',
      exploreReturnPath: null,
    }),
    { type: 'history' },
  );
  assert.deepEqual(
    resolvePlaceCardBack({
      historyIdx: 2,
      prevPath: '/p/short-1',
      returnTo: null,
      exploreReturnPath: null,
    }),
    { type: 'history' },
  );
  assert.deepEqual(
    resolvePlaceCardBack({
      historyIdx: 2,
      prevPath: '/blog?tab=public&lang=ko',
      returnTo: null,
      exploreReturnPath: null,
    }),
    { type: 'push', path: '/blog?tab=public&lang=ko', clearReturnTo: true },
  );
  assert.deepEqual(
    resolvePlaceCardBack({
      historyIdx: 2,
      prevPath: '/blog/owner-post-1',
      returnTo: '/blog?tab=public',
      exploreReturnPath: null,
    }),
    { type: 'history' },
  );
  assert.deepEqual(
    resolvePlaceCardBack({
      historyIdx: 2,
      prevPath: '/place/rome/reviews?review=1',
      returnTo: null,
      exploreReturnPath: null,
    }),
    { type: 'history' },
  );
});

test('article body links keep place and festival targets in-app', () => {
  const base = 'https://www.gateo.kr/blog/e/short-20261111-week-festivals';
  assert.equal(
    articleBodyPlaceOrFestivalTo('https://www.gateo.kr/korea/?festival=3571001', base),
    '/korea/?festival=3571001',
  );
  assert.equal(
    articleBodyPlaceOrFestivalTo('/place/rome?lang=ko', base),
    '/place/rome?lang=ko',
  );
  assert.equal(articleBodyPlaceOrFestivalTo('https://www.gateo.kr/korea/', base), '');
  assert.equal(articleBodyPlaceOrFestivalTo('https://www.gateo.kr/blog?tab=public', base), '');
  assert.equal(articleBodyPlaceOrFestivalTo('https://example.com/guide', base), '');
});

test('classifyLogbookMarkdownHref keeps gateo links internal and external links blank-eligible', () => {
  assert.deepEqual(classifyLogbookMarkdownHref('/place/rome?lang=ko#map'), {
    kind: 'internal',
    to: '/place/rome?lang=ko#map',
  });
  assert.deepEqual(classifyLogbookMarkdownHref('https://www.gateo.kr/place/rome'), {
    kind: 'internal',
    to: '/place/rome',
  });
  assert.deepEqual(classifyLogbookMarkdownHref('https://gateo.kr/blog?tab=public'), {
    kind: 'internal',
    to: '/blog?tab=public',
  });
  assert.deepEqual(classifyLogbookMarkdownHref('http://www.gateo.kr/p/abc'), {
    kind: 'internal',
    to: '/p/abc',
  });
  assert.deepEqual(classifyLogbookMarkdownHref('//www.gateo.kr/place/rome'), {
    kind: 'internal',
    to: '/place/rome',
  });
  assert.deepEqual(classifyLogbookMarkdownHref('gateo.kr/place/rome'), {
    kind: 'internal',
    to: '/place/rome',
  });
  assert.deepEqual(classifyLogbookMarkdownHref('www.gateo.kr/place/rome'), {
    kind: 'internal',
    to: '/place/rome',
  });
  assert.deepEqual(
    classifyLogbookMarkdownHref('/place/rome?lang=ko', 'http://127.0.0.1:5227/blog/e/rome-travelogue'),
    { kind: 'internal', to: '/place/rome?lang=ko' },
  );
  assert.deepEqual(
    classifyLogbookMarkdownHref('https://www.gateo.kr/place/rome', 'http://127.0.0.1:5227/blog/e/rome-travelogue'),
    { kind: 'internal', to: '/place/rome' },
  );
  assert.equal(classifyLogbookMarkdownHref('https://www.gateo.kr.evil.com/place/rome').kind, 'external');
  assert.equal(classifyLogbookMarkdownHref('https://example.com/guide').kind, 'external');
  assert.equal(classifyLogbookMarkdownHref('mailto:a@gateo.kr').kind, 'plain');
  assert.equal(classifyLogbookMarkdownHref('tel:+821012345678').kind, 'plain');
  assert.deepEqual(classifyLogbookMarkdownHref('#section'), { kind: 'plain', href: '#section' });
});

test('classifyLogbookMarkdownHref leaves static and non-routes as plain anchors', () => {
  for (const href of [
    '/api/health',
    '/favicon.ico',
    '/robots.txt',
    '/assets/index.js',
    '/sitemap.xml',
    '/sitemap-core.xml',
    '/rss.xml',
    'rss.xml',
  ]) {
    const classified = classifyLogbookMarkdownHref(href);
    assert.equal(classified.kind, 'plain', href);
    assert.equal(classified.href, href);
  }
  assert.deepEqual(classifyLogbookMarkdownHref('https://www.gateo.kr/favicon.ico'), {
    kind: 'plain',
    href: '/favicon.ico',
  });
  assert.deepEqual(classifyLogbookMarkdownHref('https://www.gateo.kr/api/edge'), {
    kind: 'plain',
    href: '/api/edge',
  });
  assert.deepEqual(classifyLogbookMarkdownHref('https://gateo.kr/assets/logo.png'), {
    kind: 'plain',
    href: '/assets/logo.png',
  });
  assert.equal(classifyLogbookMarkdownHref('/explore?lang=ko').kind, 'internal');
  assert.equal(classifyLogbookMarkdownHref('/korea/theme/scenic').kind, 'internal');
});

test('scheme-less look-alike hosts are not internal', () => {
  const notGateo = classifyLogbookMarkdownHref('notgateo.kr/place/rome');
  assert.equal(notGateo.kind, 'external');
  assert.equal(notGateo.href, 'https://notgateo.kr/place/rome');
  const evil = classifyLogbookMarkdownHref('gateo.kr.evil.com/place/rome');
  assert.equal(evil.kind, 'external');
  assert.equal(evil.href, 'https://gateo.kr.evil.com/place/rome');
  assert.equal(classifyLogbookMarkdownHref('https://notgateo.kr/place/rome').kind, 'external');
  assert.equal(classifyLogbookMarkdownHref('https://gateo.kr.evil.com/place/rome').kind, 'external');
});

test('duplicate festival links restore the pressed anchor, not the other copy', () => {
  const upper = { href: '/korea?festival=2563387', docTop: 2800 };
  const lower = { href: '/korea?festival=2563387', docTop: 3700 };
  const pressedUpper = {
    scrollY: 2586,
    anchorDocTop: 2800,
    linkHref: upper.href,
    linkIndex: 0,
  };
  assert.equal(articleClickedLinkScrollY(pressedUpper, 2800), 2586);
  assert.equal(articleLinkRestoreTarget(pressedUpper, [upper, lower]), 2586);
  assert.equal(articleClickedLinkScrollY(pressedUpper, 3700), 3486);
  assert.equal(
    articleLinkRestoreTarget(pressedUpper, [
      { href: upper.href, docTop: 3700 },
      { href: lower.href, docTop: 4600 },
    ]),
    3486,
  );

  const pressedLower = {
    scrollY: 3486,
    anchorDocTop: 3700,
    linkHref: lower.href,
    linkIndex: 1,
  };
  assert.equal(articleLinkRestoreTarget(pressedLower, [upper, lower]), 3486);
  assert.equal(articleLinkRestoreTarget({ scrollY: 956 }, [upper, lower]), 956);
  assert.equal(articleClickedLinkScrollY({ scrollY: 400 }, Number.NaN), 400);
});

test('reader origin is honored only for the matching nonce', () => {
  const stored = {
    path: '/blog/e/rome-travelogue?lang=ko',
    nonce: 'hop-1',
    savedAt: 1_000,
  };
  assert.equal(selectLogbookReaderOrigin(stored, 'hop-1', 2_000), stored.path);
  assert.equal(selectLogbookReaderOrigin(stored, 'hop-2', 2_000), null);
  assert.equal(selectLogbookReaderOrigin(stored, '', 2_000), null);
  assert.equal(selectLogbookReaderOrigin(stored, null, 2_000), null);
  assert.equal(selectLogbookReaderOrigin(stored, 'hop-1', 1_000 + 31 * 60 * 1000), null);
});
