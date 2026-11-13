import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  SCENIC_NEARBY_ICON_IDS,
  assignNearbyIconSlots,
  hashNearbyIconKey,
  nearbyIconSlotsCollide,
} from '../../src/pages/KoreaTheme/scenicNearbyIconSlots.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function noPhoto(keys) {
  return keys.map((key) => ({ key, hasPhoto: false }));
}

test('food icons are a set of dining marks, not one repeated glyph', () => {
  assert.equal(SCENIC_NEARBY_ICON_IDS.food.length, 8);
  assert.equal(new Set(SCENIC_NEARBY_ICON_IDS.food).size, 8);
});

test('photo-less neighbors in a 2-column grid do not share an icon', () => {
  const keys = Array.from({ length: 12 }, (_, i) => `place-${i}`);
  const slots = assignNearbyIconSlots(noPhoto(keys), 8, 2);
  assert.equal(slots.some((slot) => slot == null), false);
  assert.equal(nearbyIconSlotsCollide(slots, 2), false);
});

test('the same keys keep the same icons', () => {
  const entries = noPhoto(['가', '나', '다', '라']);
  assert.deepEqual(
    assignNearbyIconSlots(entries, 8, 2),
    assignNearbyIconSlots(entries, 8, 2),
  );
});

test('a photo card does not consume an icon, and icon neighbors still differ', () => {
  const entries = [
    { key: 'photo-a', hasPhoto: true },
    { key: 'icon-b', hasPhoto: false },
    { key: 'icon-c', hasPhoto: false },
    { key: 'photo-d', hasPhoto: true },
  ];
  const slots = assignNearbyIconSlots(entries, 8, 2);
  assert.equal(slots[0], null);
  assert.equal(slots[3], null);
  assert.notEqual(slots[1], null);
  assert.notEqual(slots[2], null);
  assert.notEqual(slots[1], slots[2]);
  assert.equal(nearbyIconSlotsCollide(slots, 2), false);
});

test('adjacent keys that hash to the same icon still diverge', () => {
  const bucket = new Map();
  let pair = null;
  for (let i = 0; i < 4000 && !pair; i += 1) {
    const key = `k${i}`;
    const slot = hashNearbyIconKey(key) % 8;
    const prev = bucket.get(slot);
    if (prev) pair = [prev, key];
    else bucket.set(slot, key);
  }
  assert.ok(pair);
  const slots = assignNearbyIconSlots(noPhoto(pair), 8, 2);
  assert.notEqual(slots[0], slots[1]);
});

test('scenic detail nearby lists render the card grid', () => {
  const src = readFileSync(
    join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
    'utf8',
  );
  assert.match(src, /ScenicNearbyCardGrid/);
  assert.match(src, /ScenicNearbySectionHeader/);
  const headerSrc = readFileSync(
    join(root, 'src/pages/KoreaTheme/ScenicNearbySectionHeader.jsx'),
    'utf8',
  );
  assert.match(headerSrc, /data-scenic-nearby-section-heading/);
  for (const variant of ['food', 'leports', 'culture', 'festival', 'attraction', 'hub']) {
    assert.match(src, new RegExp(`variant="${variant}"`));
  }
  assert.doesNotMatch(src, /h-14 w-14 shrink-0 rounded-xl/);
  const grid = readFileSync(
    join(root, 'src/pages/KoreaTheme/ScenicNearbyCardGrid.jsx'),
    'utf8',
  );
  for (const id of Object.values(SCENIC_NEARBY_ICON_IDS).flat()) {
    assert.match(grid, new RegExp(`(?:['"]${id}['"]|\\b${id}\\s*:)`));
  }
});
