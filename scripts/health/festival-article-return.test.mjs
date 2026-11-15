import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveFestivalArticleReturn } from '../../src/pages/Korea/lib/festivalArticleReturn.js';

const ARTICLE = '/blog/e/short-20261111-week-festivals';
const OWNER = '/blog/owner-post-1';
const REVIEWS = '/place/rome/reviews?review=1';

test('article history pops back to the reader', () => {
  for (const prevPath of [ARTICLE, '/p/short-1', OWNER, REVIEWS]) {
    assert.deepEqual(
      resolveFestivalArticleReturn({
        historyIdx: 2,
        prevPath,
        historyLength: 3,
        referrerPath: '/explore',
      }),
      { type: 'history' },
    );
  }
});

test('festival home, explore, search, and the blog list stay on the hub', () => {
  for (const prevPath of ['/korea/', '/korea/?lang=ko', '/explore', '/explore/asia', '/blog?tab=public', null]) {
    assert.equal(
      resolveFestivalArticleReturn({
        historyIdx: 2,
        prevPath,
        historyLength: 3,
        referrerPath: ARTICLE,
      }),
      null,
    );
  }
});

test('a direct or external entry still falls through to the festival home', () => {
  assert.equal(
    resolveFestivalArticleReturn({
      historyIdx: 0,
      prevPath: null,
      historyLength: 1,
      referrerPath: null,
    }),
    null,
  );
  assert.equal(
    resolveFestivalArticleReturn({
      historyIdx: 0,
      prevPath: null,
      historyLength: 2,
      referrerPath: '/explore',
    }),
    null,
  );
  assert.equal(
    resolveFestivalArticleReturn({
      historyIdx: null,
      prevPath: null,
      historyLength: 2,
      referrerPath: 'https://news.example/post',
    }),
    null,
  );
});

test('a full document load from an article still pops', () => {
  assert.deepEqual(
    resolveFestivalArticleReturn({
      historyIdx: 0,
      prevPath: null,
      historyLength: 2,
      referrerPath: ARTICLE,
    }),
    { type: 'history' },
  );
  assert.deepEqual(
    resolveFestivalArticleReturn({
      historyIdx: null,
      prevPath: null,
      historyLength: 3,
      referrerPath: REVIEWS,
    }),
    { type: 'history' },
  );
});
