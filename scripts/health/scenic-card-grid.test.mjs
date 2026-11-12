import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { scenicCardSections } from '../../src/pages/KoreaTheme/scenicCardSections.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('scenicCardSections keeps ungrouped spots in one run', () => {
  const sections = scenicCardSections([
    { id: 'a', name: '가' },
    { id: 'b', name: '나' },
  ]);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].rest, false);
  assert.deepEqual(sections[0].spots.map((s) => s.id), ['a', 'b']);
});

test('scenicCardSections splits a palgyeong group from the rest heading', () => {
  const sections = scenicCardSections([
    { id: 'a', groupTitle: '함양8경' },
    { id: 'b', groupTitle: '함양8경' },
    { id: 'c' },
    { id: 'd', groupTitle: '거제8경' },
  ]);
  assert.equal(sections.length, 3);
  assert.equal(sections[0].title, '함양8경');
  assert.equal(sections[0].rest, false);
  assert.equal(sections[0].spots.length, 2);
  assert.equal(sections[1].title, '');
  assert.equal(sections[1].rest, true);
  assert.equal(sections[2].title, '거제8경');
  assert.equal(sections[2].rest, false);
});

test('scenic page lists use the festival-style card grid by default', () => {
  const page = readFileSync(
    join(root, 'src/pages/KoreaTheme/ScenicPage.jsx'),
    'utf8',
  );
  assert.match(page, /ScenicSpotCardGrid/);
  assert.match(page, /readScenicLegacyListFromSession/);
  assert.match(page, /data-scenic-grid-list-link/);
  assert.match(page, /data-scenic-grid-card-link/);
  const cardUses = page.match(/<ScenicSpotCardGrid/g) || [];
  assert.equal(cardUses.length, 4);
  const grid = readFileSync(
    join(root, 'src/pages/KoreaTheme/ScenicSpotCardGrid.jsx'),
    'utf8',
  );
  assert.match(grid, /distributeFestivalHubMasonryColumns/);
  assert.doesNotMatch(grid, /partitionFestivalHubSegments/);
  assert.match(grid, /data-scenic-grid=""/);
  const card = readFileSync(
    join(root, 'src/pages/KoreaTheme/ScenicGridPhotoCard.jsx'),
    'utf8',
  );
  assert.match(card, /data-scenic-grid-card=""/);
  assert.match(card, /korea\.common\.viewed/);
  assert.doesNotMatch(card, /korea\.festival\.viewedBadge/);
});
