import assert from 'node:assert/strict';
import test from 'node:test';
import {
  artistHrefFromCommonsQuery,
  clearCommonsArtistHrefCache,
  commonsFileTitleFromUrl,
  extractCommonsArtistHref,
  fetchCommonsArtistPageHref,
  sanitizeWikimediaAuthorHref,
} from '../../src/utils/commonsArtistHref.js';

const ARTIST_HTML =
  '<a rel="nofollow" class="external text" href="https://www.flickr.com/people/7752378@N03">Stephen Kennedy</a> from atlanta, usa';

test('extractCommonsArtistHref reads the Flickr author link', () => {
  assert.equal(
    extractCommonsArtistHref(ARTIST_HTML),
    'https://www.flickr.com/people/7752378@N03',
  );
  assert.equal(
    extractCommonsArtistHref(
      '<a href="https://creativecommons.org/licenses/by/2.0/">CC</a> <a href="https://www.flickr.com/people/7752378@N03">Stephen Kennedy</a>',
    ),
    'https://www.flickr.com/people/7752378@N03',
  );
});

test('sanitizeWikimediaAuthorHref allows external authors and wiki user pages only', () => {
  assert.equal(
    sanitizeWikimediaAuthorHref('https://commons.wikimedia.org/wiki/User:Karelj'),
    'https://commons.wikimedia.org/wiki/User:Karelj',
  );
  assert.equal(
    sanitizeWikimediaAuthorHref('https://www.wikidata.org/wiki/Q115464159'),
    'https://www.wikidata.org/wiki/Q115464159',
  );
  assert.equal(
    sanitizeWikimediaAuthorHref('https://commons.wikimedia.org/wiki/File:The_tsunami_left_this_boat.jpg'),
    null,
  );
  assert.equal(
    sanitizeWikimediaAuthorHref('https://commons.wikimedia.org/wiki/Category:Thailand_photographs'),
    null,
  );
  assert.equal(sanitizeWikimediaAuthorHref('javascript:alert(1)'), null);
  assert.match(sanitizeWikimediaAuthorHref('https://www.flickr.com/people/7752378@N03'), /flickr\.com\/people\/7752378@N03/);
});

test('commonsFileTitleFromUrl reads File titles and upload paths', () => {
  assert.equal(
    commonsFileTitleFromUrl('https://commons.wikimedia.org/wiki/File:The_tsunami_left_this_boat.jpg'),
    'File:The_tsunami_left_this_boat.jpg',
  );
  assert.equal(commonsFileTitleFromUrl('https://example.com/wiki/File:Ada.jpg'), null);
});

test('artistHrefFromCommonsQuery and fetch throw when Commons is not ok', async () => {
  const href = artistHrefFromCommonsQuery({
    query: {
      pages: {
        1: { imageinfo: [{ extmetadata: { Artist: { value: ARTIST_HTML } } }] },
      },
    },
  });
  assert.equal(href, 'https://www.flickr.com/people/7752378@N03');

  clearCommonsArtistHrefCache();
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(String(url), /iiextmetadatafilter=Artist/);
    assert.match(String(url), /titles=File%3AThe_tsunami_left_this_boat\.jpg/);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        query: {
          pages: {
            1: { imageinfo: [{ extmetadata: { Artist: { value: ARTIST_HTML } } }] },
          },
        },
      }),
    };
  };
  try {
    const fetched = await fetchCommonsArtistPageHref(
      'https://commons.wikimedia.org/wiki/File:The_tsunami_left_this_boat.jpg',
    );
    assert.equal(fetched, 'https://www.flickr.com/people/7752378@N03');
    globalThis.fetch = async () => {
      throw new Error('cached author href must not refetch');
    };
    const cached = await fetchCommonsArtistPageHref(
      'https://commons.wikimedia.org/wiki/File:The_tsunami_left_this_boat.jpg',
    );
    assert.equal(cached, fetched);
  } finally {
    globalThis.fetch = original;
    clearCommonsArtistHrefCache();
  }

  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  try {
    await assert.rejects(
      () => fetchCommonsArtistPageHref('https://commons.wikimedia.org/wiki/File:The_tsunami_left_this_boat.jpg'),
      /Commons Artist metadata failed: 503/,
    );
  } finally {
    globalThis.fetch = original;
    clearCommonsArtistHrefCache();
  }
});
