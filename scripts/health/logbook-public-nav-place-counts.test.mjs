import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { filterPublicLogbookFeedRows } from '../../src/utils/logbookPublicFeed.js';
import {
  countReportsByPlace,
  listLogbookPlaceChips,
  logbookPlaceKey,
} from '../../src/utils/logbookReadingMeta.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Legacy sidebar: raw trimmed location strings, top 15 only. */
function legacySidebarPlaceCounts(rows) {
  const locCounts = {};
  for (const row of rows) {
    const loc = String(row?.location ?? '').trim();
    if (loc) locCounts[loc] = (locCounts[loc] || 0) + 1;
  }
  return Object.entries(locCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));
}

const fixtureRows = filterPublicLogbookFeedRows([
  { location: '춘천', is_editorial: false },
  { location: '춘천시 소양로3가', is_editorial: false },
  { location: '춘천시 퇴계동', is_editorial: false },
  { location: '카이로', is_editorial: false },
  { location: '프라하', is_editorial: false },
  { location: '홍콩', is_editorial: false },
  { location: '파리', is_editorial: false },
  { location: '파리 근교', is_editorial: false },
]);

test('feed chips and sidebar use the same grouped place counts', () => {
  const chips = listLogbookPlaceChips(fixtureRows);
  const sidebar = listLogbookPlaceChips(fixtureRows);
  assert.deepEqual(sidebar, chips);
  const chuncheon = chips.find((c) => c.name === '춘천');
  assert.equal(chuncheon?.count, 3);
  for (const city of ['카이로', '프라하', '홍콩']) {
    assert.ok(chips.some((c) => c.name === city), `chip list includes ${city}`);
    assert.ok(sidebar.some((c) => c.name === city), `sidebar list includes ${city}`);
  }
});

test('legacy raw sidebar under-counts merged Korean cities', () => {
  const legacy = legacySidebarPlaceCounts(fixtureRows);
  const grouped = listLogbookPlaceChips(fixtureRows);
  assert.notDeepEqual(legacy, grouped);
  assert.ok(!legacy.some((row) => row.name === '춘천' && row.count === 3));
  assert.equal(countReportsByPlace(fixtureRows).get('춘천'), 3);
});

test('PublicNav wires shared logbook place grouping (not raw top-15)', () => {
  const publicNav = readFileSync(
    join(root, 'src/pages/DailyReport/layout/PublicNav.jsx'),
    'utf8',
  );
  assert.match(publicNav, /listLogbookPlaceChips/);
  assert.match(publicNav, /filterPublicLogbookFeedRows/);
  assert.match(publicNav, /logbookPlaceKey/);
  assert.doesNotMatch(publicNav, /\.slice\(0,\s*15\)/);
  assert.doesNotMatch(publicNav, /locCounts\[loc\]/);
});

test('place chips lead with the newest post, then count', () => {
  const rows = [
    { location: '파리', created_at: '2026-11-01T00:00:00Z' },
    { location: '파리', created_at: '2026-10-01T00:00:00Z' },
    { location: '파리', date: '2026-09-01' },
    { location: '방콕', published_at: '2026-11-20T00:00:00Z' },
    { location: '제주', created_at: '2026-11-10T00:00:00Z' },
    { location: '제주', created_at: '2026-11-11T00:00:00Z' },
  ];
  assert.deepEqual(
    listLogbookPlaceChips(rows).map((chip) => chip.name),
    ['방콕', '파리', '제주'],
  );
});

test('place filter keys stay aligned between sidebar navigation and chips', () => {
  assert.equal(logbookPlaceKey('춘천시 퇴계동'), '춘천');
  assert.equal(logbookPlaceKey('춘천'), '춘천');
});
