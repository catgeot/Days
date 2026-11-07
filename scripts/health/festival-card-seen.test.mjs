import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  dedupeFestivalItems,
  festivalCardDedupeKey,
  hasFestivalCardContent,
} from '../../src/pages/Korea/festivalCardList.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('dedupeFestivalItems keeps first occurrence and preserves order', () => {
  const items = [
    { contentId: '2', title: '둘째로 온 첫 카드' },
    { contentId: '1', title: '첫째' },
    { contentId: '2', title: '중복된 둘째' },
    { contentId: '3', title: '셋째' },
    { contentId: '1', title: '중복된 첫째' },
  ];
  const out = dedupeFestivalItems(items);
  assert.deepEqual(out.map((row) => row.contentId), ['2', '1', '3']);
  assert.equal(out[0].title, '둘째로 온 첫 카드');
});

test('dedupeFestivalItems keeps different editions with different contentIds', () => {
  const items = [
    { contentId: '10', title: '같은 축제', eventStartDate: '20261101' },
    { contentId: '11', title: '같은 축제', eventStartDate: '20261101' },
  ];
  assert.equal(dedupeFestivalItems(items).length, 2);
});

test('dedupeFestivalItems falls back to title+date+addr without contentId', () => {
  const a = { title: '무번호 축제', eventStartDate: '20261101', addr1: '서울특별시 중구' };
  const dup = { ...a };
  const other = { ...a, addr1: '서울특별시 종로구' };
  assert.equal(festivalCardDedupeKey(a), festivalCardDedupeKey(dup));
  assert.equal(dedupeFestivalItems([a, dup, other]).length, 2);
});

test('hasFestivalCardContent rejects title-less (empty) cards only', () => {
  assert.equal(hasFestivalCardContent({ title: '축제' }), true);
  assert.equal(hasFestivalCardContent({ title: '  ' }), false);
  assert.equal(hasFestivalCardContent({}), false);
  assert.equal(hasFestivalCardContent(null), false);
});

test('hub list dedupes, drops empty cards, and excludes the session pin from the main list', () => {
  const hub = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
  assert.match(hub, /dedupeFestivalItems\(items\)\.filter\(hasFestivalCardContent\)/);
  assert.match(hub, /excludePinnedFromPanelItems\(withoutPromo, sessionPinnedDisplay\)/);
  assert.match(hub, /viewedIds=\{viewedIds\}/);
  assert.match(hub, /new Set\(viewedList\.map/);
});

test('grid and row cards mark viewed festivals with a badge and dimmed photo without CSS column-span fragmentation', () => {
  const card = readFileSync(
    join(root, 'src/pages/Korea/components/FestivalGridPhotoCard.jsx'),
    'utf8',
  );
  assert.match(card, /data-festival-card-viewed-badge/);
  assert.match(card, /data-festival-grid-card-viewed/);
  assert.match(card, /korea\.festival\.viewedBadge/);
  assert.match(card, /if \(!titleLines\?\.primary\) return null;/);
  assert.doesNotMatch(card, /column-span:all/);
  const hub = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
  assert.match(hub, /data-festival-card-viewed-badge/);
  assert.match(hub, /partitionFestivalHubSegments/);
  assert.match(hub, /distributeFestivalHubMasonryColumns/);
});

test('viewed badge copy exists in ko/en locales', () => {
  const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
  assert.equal(ko.korea.festival.viewedBadge, '본 축제');
  assert.equal(en.korea.festival.viewedBadge, 'Viewed');
});
