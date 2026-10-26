import assert from 'node:assert/strict';
import test from 'node:test';

import { festivalItemThumbCandidateUrls } from '../../src/pages/Korea/festivalListThumb.js';
import { festivalGridPlaceLabel } from '../../src/pages/Korea/festivalGridPlaceLabel.js';
import { FESTIVAL_HUB_GRID_CLASS } from '../../src/pages/Korea/festivalHubGridLayout.js';
import {
  readFestivalHubLegacyListFromSession,
  writeFestivalHubLegacyListToSession,
} from '../../src/pages/Korea/festivalListViewSession.js';

test('festival hub grid class — 2 col mobile, 3 md, 4 lg', () => {
  assert.match(FESTIVAL_HUB_GRID_CLASS, /grid-cols-2/);
  assert.match(FESTIVAL_HUB_GRID_CLASS, /md:grid-cols-3/);
  assert.match(FESTIVAL_HUB_GRID_CLASS, /lg:grid-cols-4/);
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
