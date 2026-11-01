import assert from 'node:assert/strict';
import test from 'node:test';

import { festivalItemThumbCandidateUrls } from '../../src/pages/Korea/festivalListThumb.js';
import { festivalGridPlaceLabel } from '../../src/pages/Korea/festivalGridPlaceLabel.js';
import {
  FESTIVAL_HUB_GRID_CLASS,
  FESTIVAL_HUB_PHOTO_WIDE_MIN_RATIO,
  distributeFestivalHubMasonryColumns,
  festivalHubPhotoLayout,
  partitionFestivalHubSegments,
} from '../../src/pages/Korea/festivalHubGridLayout.js';
import {
  readFestivalHubLegacyListFromSession,
  writeFestivalHubLegacyListToSession,
} from '../../src/pages/Korea/festivalListViewSession.js';

test('festival hub grid class — 2 col mobile, 3 md, 4 lg, items-start masonry wrapper', () => {
  assert.match(FESTIVAL_HUB_GRID_CLASS, /grid-cols-2/);
  assert.match(FESTIVAL_HUB_GRID_CLASS, /md:grid-cols-3/);
  assert.match(FESTIVAL_HUB_GRID_CLASS, /lg:grid-cols-4/);
  assert.match(FESTIVAL_HUB_GRID_CLASS, /items-start/);
  assert.doesNotMatch(FESTIVAL_HUB_GRID_CLASS, /columns-/);
});

test('partitionFestivalHubSegments and distributeFestivalHubMasonryColumns avoid lone-card holes and column-span fragmentation', () => {
  const items = [
    { id: 'w0', wide: true },
    { id: 'p1', wide: false },
    { id: 'w2', wide: true },
    { id: 'p3', wide: false },
    { id: 'p4', wide: false },
    { id: 'w5', wide: true },
  ];
  const segs = partitionFestivalHubSegments(items, (item) => item.wide, 2);
  assert.deepEqual(
    segs.map((s) =>
      s.type === 'wide'
        ? { type: 'wide', id: s.entry.item.id }
        : { type: 'columns', ids: s.entries.map((e) => e.item.id) },
    ),
    [
      { type: 'wide', id: 'w0' },
      { type: 'columns', ids: ['p1', 'w2', 'p3', 'p4'] },
      { type: 'wide', id: 'w5' },
    ],
  );
  const cols = distributeFestivalHubMasonryColumns(segs[1].entries, 2);
  assert.deepEqual(
    cols.map((col) => col.map((e) => e.item.id)),
    [
      ['p1', 'p3'],
      ['w2', 'p4'],
    ],
  );
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
