import assert from 'node:assert/strict';
import test from 'node:test';

import { festivalItemThumbCandidateUrls } from '../../src/pages/Korea/festivalListThumb.js';
import { festivalGridPlaceLabel } from '../../src/pages/Korea/festivalGridPlaceLabel.js';
import {
  FESTIVAL_HUB_GRID_CLASS,
  FESTIVAL_HUB_PHOTO_WIDE_MIN_RATIO,
  festivalHubPhotoLayout,
} from '../../src/pages/Korea/festivalHubGridLayout.js';
import {
  readFestivalHubLegacyListFromSession,
  writeFestivalHubLegacyListToSession,
} from '../../src/pages/Korea/festivalListViewSession.js';

test('festival hub grid class — masonry columns 2 mobile, 3 md, 4 lg', () => {
  assert.match(FESTIVAL_HUB_GRID_CLASS, /columns-2/);
  assert.match(FESTIVAL_HUB_GRID_CLASS, /md:columns-3/);
  assert.match(FESTIVAL_HUB_GRID_CLASS, /lg:columns-4/);
});

test('festival hub masonry — layout follows each photo, not list index', () => {
  assert.deepEqual(festivalHubPhotoLayout(800, 1000), {
    aspectRatio: '0.8 / 1',
    wide: false,
  });
  assert.deepEqual(festivalHubPhotoLayout(1000, 1000), {
    aspectRatio: '1 / 1',
    wide: false,
  });
  assert.deepEqual(festivalHubPhotoLayout(1200, 800), {
    aspectRatio: `${FESTIVAL_HUB_PHOTO_WIDE_MIN_RATIO} / 1`,
    wide: true,
  });
  assert.deepEqual(festivalHubPhotoLayout(1600, 900), {
    aspectRatio: `${1600 / 900} / 1`,
    wide: true,
  });
  assert.deepEqual(festivalHubPhotoLayout(3000, 1000), {
    aspectRatio: '2 / 1',
    wide: true,
  });
  assert.deepEqual(festivalHubPhotoLayout(400, 2000), {
    aspectRatio: '0.5 / 1',
    wide: false,
  });
  assert.deepEqual(festivalHubPhotoLayout(0, 100), {
    aspectRatio: null,
    wide: false,
  });
  assert.deepEqual(festivalHubPhotoLayout(undefined, undefined), {
    aspectRatio: null,
    wide: false,
  });
});

test('festivalGridPlaceLabel — nationwide uses short sido + city', () => {
  const item = { addr1: '경상남도 진주시 중앙동' };
  assert.equal(festivalGridPlaceLabel(item, { areaCode: 'all', cityName: 'all' }), '경남 진주');
});

test('festivalGridPlaceLabel — sido filter shows city only', () => {
  const item = { addr1: '경상남도 진주시 중앙동' };
  assert.equal(festivalGridPlaceLabel(item, { areaCode: '36', cityName: 'all' }), '진주');
});

test('festivalGridPlaceLabel — EN nationwide short sido + city', () => {
  const item = { addr1: '대구광역시 수성구 범어동' };
  const label = festivalGridPlaceLabel(item, {
    areaCode: 'all',
    cityName: 'all',
    locale: 'en',
  });
  assert.match(label, /^Daegu /);
  assert.equal(/[가-힣]/u.test(label), false);
});

test('festivalGridPlaceLabel — EN sido filter city only', () => {
  const item = { addr1: '경상남도 진주시 중앙동' };
  assert.equal(
    festivalGridPlaceLabel(item, { areaCode: '36', cityName: 'all', locale: 'en' }),
    'Jinju',
  );
});

test('festivalItemThumbCandidateUrls upgrades http and dedupes', () => {
  const urls = festivalItemThumbCandidateUrls({
    firstimage: 'http://example.com/a.jpg',
    firstimage2: 'https://example.com/a.jpg',
    imageUrl: 'https://example.com/b.jpg',
  });
  assert.equal(urls.length, 2);
  assert.equal(urls[0], 'https://example.com/a.jpg');
  assert.equal(urls[1], 'https://example.com/b.jpg');
});

test('festival hub list view session — grid default, legacy round-trip', () => {
  const store = new Map();
  const prev = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
  };
  try {
    writeFestivalHubLegacyListToSession(false);
    assert.equal(readFestivalHubLegacyListFromSession(), false);
    writeFestivalHubLegacyListToSession(true);
    assert.equal(readFestivalHubLegacyListFromSession(), true);
    writeFestivalHubLegacyListToSession(false);
  } finally {
    globalThis.sessionStorage = prev;
  }
});
