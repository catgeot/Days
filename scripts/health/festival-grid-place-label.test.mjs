import assert from 'node:assert/strict';
import test from 'node:test';

import { festivalItemThumbCandidateUrls } from '../../src/pages/Korea/festivalListThumb.js';
import { festivalGridPlaceLabel } from '../../src/pages/Korea/festivalGridPlaceLabel.js';
import {
  FESTIVAL_HUB_GRID_CLASS,
  festivalHubMasonryIsWide,
  festivalHubMasonryThumbAspectClass,
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

test('festival hub masonry — irregular thumb aspects with wide every 6th', () => {
  const aspects = Array.from({ length: 6 }, (_, i) =>
    festivalHubMasonryThumbAspectClass(i),
  );
  assert.ok(new Set(aspects).size >= 4);
  assert.equal(festivalHubMasonryIsWide(4), false);
  assert.equal(festivalHubMasonryIsWide(5), true);
  assert.equal(festivalHubMasonryIsWide(11), true);
  assert.equal(aspects[5], 'aspect-[16/9]');
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
