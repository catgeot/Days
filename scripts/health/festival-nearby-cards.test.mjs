import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoNearbyCardsEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  NEARBY_BAND_DRIVE_KM,
  NEARBY_BAND_WALK_KM,
  NEARBY_PHOTO_WIDE_ASPECT_CLASS,
  countNearbyDistanceBands,
  flattenNearbyDisplayGroups,
  groupFestivalNearbyBlocks,
  groupFestivalNearbyItems,
  nearbyBandCountsTotal,
  nearbyDistanceBand,
  partitionNearbyPhotoMasonrySegments,
  sortNearbyBandItemsPhotoFirst,
  summarizeNearbyListItems,
} from '../../src/pages/Korea/lib/festivalNearbyDistanceGroups.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sheet = readFileSync(join(rootDir, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');

const bandTitles = {
  walk: 'walk',
  drive: 'drive',
  far: 'far',
  unknown: 'unknown',
};

test('nearby distance bands use 1km and 5km thresholds', () => {
  assert.equal(NEARBY_BAND_WALK_KM, 1);
  assert.equal(NEARBY_BAND_DRIVE_KM, 5);
  assert.equal(nearbyDistanceBand(0.5), 'walk');
  assert.equal(nearbyDistanceBand(1), 'walk');
  assert.equal(nearbyDistanceBand(1.01), 'drive');
  assert.equal(nearbyDistanceBand(5), 'drive');
  assert.equal(nearbyDistanceBand(5.1), 'far');
});

test('summary band counts sum equals item count', () => {
  const items = [
    { distKm: 0.2, name: 'a' },
    { distKm: 1.5, name: 'b' },
    { distKm: 6, name: 'c' },
    { name: 'd' },
  ];
  const summary = summarizeNearbyListItems(items);
  assert.equal(summary.total, 4);
  assert.equal(nearbyBandCountsTotal(summary.counts), 4);
  assert.equal(summary.counts.walk, 1);
  assert.equal(summary.counts.drive, 1);
  assert.equal(summary.counts.far, 1);
  assert.equal(summary.counts.unknown, 1);
});

test('heading blocks stay separate groups', () => {
  const blocks = [
    { kind: 'spot', spot: { name: 'near', distKm: 0.3, contentId: '1' } },
    { kind: 'spot', spot: { name: 'mid', distKm: 2, contentId: '2' } },
    { kind: 'heading', title: '팔경', listId: 'pal' },
    { kind: 'spot', spot: { name: '팔경1', distKm: 0.1, contentId: '3' } },
  ];
  const groups = groupFestivalNearbyBlocks(blocks, bandTitles);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].kind, 'distance');
  assert.equal(groups[1].kind, 'distance');
  assert.equal(groups[2].kind, 'heading');
  assert.equal(groups[2].title, '팔경');
  const flat = flattenNearbyDisplayGroups(groups);
  assert.equal(flat.length, 3);
  assert.equal(nearbyBandCountsTotal(countNearbyDistanceBands(flat)), 3);
});

test('photo cards sort before compact cards within a band', () => {
  const items = [
    { name: 'no-photo-near', distKm: 0.1 },
    { name: 'photo-far', distKm: 0.8, firstImage: 'https://example.test/a.jpg' },
    { name: 'no-photo-mid', distKm: 0.5 },
  ];
  const sorted = sortNearbyBandItemsPhotoFirst(items, (row) =>
    Boolean(String(row?.firstImage || '').trim()),
  );
  assert.equal(sorted[0].name, 'photo-far');
  assert.equal(sorted[1].name, 'no-photo-near');
  assert.equal(sorted[2].name, 'no-photo-mid');
});

test('food items group by distance only', () => {
  const groups = groupFestivalNearbyItems(
    [
      { name: 'a', distKm: 0.1 },
      { name: 'b', distKm: 4 },
    ],
    bandTitles,
  );
  assert.equal(groups.length, 2);
  assert.ok(groups.every((g) => g.kind === 'distance'));
});

test('VITE_GATEO_NEARBY_CARDS flag defaults on', () => {
  const key = GATEO_ENV_FLAG_NAMES.NEARBY_CARDS;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = '';
  assert.equal(isGateoNearbyCardsEnabled(), true);
  globalThis.__VITE_ENV__[key] = '0';
  assert.equal(isGateoNearbyCardsEnabled(), false);
  globalThis.__VITE_ENV__[key] = '1';
  assert.equal(isGateoNearbyCardsEnabled(), true);
  globalThis.__VITE_ENV__[key] = prev;
});

test('FestivalDetailSheet gates legacy list behind flag', () => {
  assert.match(sheet, /festivalNearbyCardsEnabled/);
  assert.match(sheet, /FestivalNearbyCardsSection/);
  assert.match(sheet, /!festivalNearbyCardsEnabled &&/);
  assert.match(sheet, /data-festival-section="nearAttractions"/);
  assert.match(sheet, /data-festival-section="nearFood"/);
  assert.match(sheet, /data-nearby-heading/);
});

test('flag off keeps main sheet body padding (no nearby cards DOM)', () => {
  const contentBlock = sheet.slice(
    sheet.indexOf('data-festival-sheet-content'),
    sheet.indexOf('data-festival-sheet-content') + 600,
  );
  assert.doesNotMatch(contentBlock, /pr-\[max\(5rem/);
  assert.match(contentBlock, /max-md:pb-\[max\(11\.5rem/);
});

test('nearby cards section does not reserve mobile FAB gutter in layout', () => {
  const cardsSection = readFileSync(
    join(rootDir, 'src/pages/Korea/components/FestivalNearbyCardsSection.jsx'),
    'utf8',
  );
  assert.doesNotMatch(cardsSection, /max-md:pb-\[max\(11\.5rem/);
  assert.doesNotMatch(cardsSection, /max-md:pr-\[max\(3\.25rem/);
  assert.match(cardsSection, /data-nearby-cards-section/);
  assert.match(cardsSection, /partitionNearbyPhotoMasonrySegments/);
  assert.match(cardsSection, /data-nearby-masonry-columns/);
});

test('partitionNearbyPhotoMasonrySegments produces irregular staggered columns and wide rows without lone cards', () => {
  for (let count = 1; count <= 12; count += 1) {
    const items = Array.from({ length: count }, (_, i) => ({ id: `spot-${i}` }));
    const segs = partitionNearbyPhotoMasonrySegments(items);
    const seenIndices = [];

    for (const seg of segs) {
      if (seg.type === 'wide') {
        assert.equal(seg.entry.wide, true);
        assert.equal(seg.entry.thumbAspectClass, NEARBY_PHOTO_WIDE_ASPECT_CLASS);
        seenIndices.push(seg.entry.index);
      } else {
        assert.equal(seg.type, 'columns');
        assert.equal(seg.columns.length, 2);
        assert.equal(
          seg.columns[0].length,
          seg.columns[1].length,
          `count=${count} should keep equal left/right column counts`,
        );
        assert.notEqual(
          seg.columns[0][0].thumbAspectClass,
          seg.columns[1][0].thumbAspectClass,
          `count=${count} should stagger top left/right aspect ratios`,
        );
        for (const entry of seg.entries) {
          seenIndices.push(entry.index);
        }
      }
    }

    assert.deepEqual(
      seenIndices,
      items.map((_, i) => i),
      `count=${count} should preserve input item order`,
    );
  }

  const eightSegs = partitionNearbyPhotoMasonrySegments(
    Array.from({ length: 8 }, (_, i) => ({ id: `s-${i}` })),
  );
  assert.deepEqual(
    eightSegs.map((seg) =>
      seg.type === 'wide'
        ? { type: 'wide', index: seg.entry.index }
        : {
            type: 'columns',
            left: seg.columns[0].map((c) => c.index),
            right: seg.columns[1].map((c) => c.index),
          },
    ),
    [
      { type: 'columns', left: [0, 2], right: [1, 3] },
      { type: 'wide', index: 4 },
      { type: 'columns', left: [5], right: [6] },
      { type: 'wide', index: 7 },
    ],
  );
});
