import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePlaceCardBack } from '../../src/pages/Home/lib/placeCardBack.js';
import {
  isLogbookReaderPath,
  resolveLogbookDetailBack,
  sameOriginAppPath,
  selectLogbookDetailReturn,
} from '../../src/shared/navigation/logbookDetailBack.js';
import { classifyLogbookMarkdownHref } from '../../src/shared/navigation/logbookMarkdownHref.js';

const PLACE = '/place/taj-mahal?lang=ko';
const READER = '/blog/e/taj-mahal-travelogue?lang=ko';

test('isLogbookReaderPath is editorial and public posts only', () => {
  assert.equal(isLogbookReaderPath(READER), true);
  assert.equal(isLogbookReaderPath('/p/abc'), true);
  assert.equal(isLogbookReaderPath('/blog?tab=public'), false);
  assert.equal(isLogbookReaderPath('/place/rome'), false);
  assert.equal(isLogbookReaderPath('/pricing'), false);
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
  assert.deepEqual(classifyLogbookMarkdownHref('#section'), { kind: 'plain', href: '#section' });
});
