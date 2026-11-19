import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SHOW_ZERO_WINDOW_SIDO_CHIPS,
  SOON_WIDEN_MAX_CARDS,
  SOON_WIDEN_THRESHOLD,
  buildFestivalSoonWiden,
  buildSidoTagsForListWindow,
  diffYmdDays,
  festivalDaysUntilStart,
  findNearestUpcomingFestival,
  isFestivalSoonWidenContext,
  isFestivalSoonWidenPeriod,
  isZeroWindowSidoSelection,
} from '../../src/pages/Korea/lib/festivalSoonWiden.js';
import { buildSidoTags, LIST_SIDO_CHIP_MIN_COUNT } from '../../src/pages/Korea/festivalRegionTags.js';
import { seoulTodayYmd, addDaysYmd } from '../../src/pages/Korea/festivalDateFilter.js';

const SEOUL_NOON = new Date('2026-10-16T03:00:00.000Z');
const TODAY = seoulTodayYmd(SEOUL_NOON);

function item(id, start, end, addr = '강원특별자치도 강릉시') {
  return {
    contentId: id,
    title: `축제 ${id}`,
    eventStartDate: start,
    eventEndDate: end,
    addr1: addr,
    areaCode: '32',
  };
}

const POOL = [
  item('d1', TODAY, addDaysYmd(TODAY, 2)),
  item('d2', TODAY, addDaysYmd(TODAY, 5)),
  item('d3', TODAY, addDaysYmd(TODAY, 10)),
  item('d4', TODAY, addDaysYmd(TODAY, 12)),
  item('s1', addDaysYmd(TODAY, 35), addDaysYmd(TODAY, 40)),
  item('s2', addDaysYmd(TODAY, 38), addDaysYmd(TODAY, 42)),
  item('s3', addDaysYmd(TODAY, 70), addDaysYmd(TODAY, 75)),
  item('ongo', addDaysYmd(TODAY, -5), addDaysYmd(TODAY, 80), '서울특별시 종로구'),
];

test('SHOW_ZERO_WINDOW_SIDO_CHIPS is enabled', () => {
  assert.equal(SHOW_ZERO_WINDOW_SIDO_CHIPS, true);
});

test('sido chips — non-zero first, zero chips after with count 0', () => {
  const timed = POOL.filter((row) => row.eventEndDate >= TODAY && row.eventStartDate <= addDaysYmd(TODAY, 29));
  const chips = buildSidoTagsForListWindow(timed, { minCount: LIST_SIDO_CHIP_MIN_COUNT });
  const nonZero = chips.filter((c) => c.count > 0);
  const zeros = chips.filter((c) => c.count === 0);
  assert.ok(nonZero.length >= 1);
  assert.ok(zeros.length >= 1);
  assert.equal(chips.indexOf(nonZero[0]) < chips.indexOf(zeros[0]), true);
  for (const z of zeros) assert.equal(z.count, 0);
});

test('sido chips — false branch matches buildSidoTags only', () => {
  const timed = POOL.slice(0, 4);
  const direct = buildSidoTags(timed, { minCount: LIST_SIDO_CHIP_MIN_COUNT });
  if (!SHOW_ZERO_WINDOW_SIDO_CHIPS) {
    assert.deepEqual(buildSidoTagsForListWindow(timed, { minCount: LIST_SIDO_CHIP_MIN_COUNT }), direct);
  } else {
    assert.ok(
      buildSidoTagsForListWindow(timed, { minCount: LIST_SIDO_CHIP_MIN_COUNT }).length
        >= direct.length,
    );
  }
});

test('widen when default list has 4 festivals', () => {
  const defaults = POOL.filter((row) => ['d1', 'd2', 'd3', 'd4'].includes(row.contentId));
  const res = buildFestivalSoonWiden({
    pool: POOL,
    defaultListItems: defaults,
    now: SEOUL_NOON,
    excludeContentIds: new Set(),
  });
  assert.ok(res.items.length >= 1);
  assert.ok(res.items.every((row) => !defaults.some((d) => d.contentId === row.contentId)));
});

test('no widen when default count is 5', () => {
  const defaults = POOL.slice(0, 5);
  const res = buildFestivalSoonWiden({
    pool: POOL,
    defaultListItems: defaults,
    now: SEOUL_NOON,
    excludeContentIds: new Set(),
  });
  assert.equal(res.items.length, 0);
});

test('ongoing duplicate excluded from soon', () => {
  const defaults = [item('ongo', addDaysYmd(TODAY, -5), addDaysYmd(TODAY, 80), '서울')];
  const res = buildFestivalSoonWiden({
    pool: [...POOL, defaults[0]],
    defaultListItems: defaults,
    now: SEOUL_NOON,
    excludeContentIds: new Set(),
  });
  assert.ok(!res.items.some((row) => row.contentId === 'ongo'));
});

test('stage 2 fills up to 90 days', () => {
  const defaults = [];
  const sparse = [
    item('only', addDaysYmd(TODAY, 72), addDaysYmd(TODAY, 74)),
  ];
  const res = buildFestivalSoonWiden({
    pool: sparse,
    defaultListItems: defaults,
    now: SEOUL_NOON,
    zeroWindowRegion: true,
    excludeContentIds: new Set(),
  });
  assert.equal(res.items.length, 1);
  assert.equal(res.stage, 2);
});

test('zero window region forces widen and nearest fallback', () => {
  const jejuOnly = [
    item('far', addDaysYmd(TODAY, 120), addDaysYmd(TODAY, 122), '제주특별자치도 제주시'),
  ];
  const res = buildFestivalSoonWiden({
    pool: jejuOnly,
    defaultListItems: [],
    now: SEOUL_NOON,
    zeroWindowRegion: true,
    excludeContentIds: new Set(),
  });
  assert.equal(res.items.length, 0);
  assert.equal(res.nearestFallback?.contentId, 'far');
});

test('zero window with nothing upcoming keeps empty soon and no nearest', () => {
  const pastOnly = [
    item('past', addDaysYmd(TODAY, -40), addDaysYmd(TODAY, -2), '제주특별자치도 제주시'),
  ];
  const res = buildFestivalSoonWiden({
    pool: pastOnly,
    defaultListItems: [],
    now: SEOUL_NOON,
    zeroWindowRegion: true,
    excludeContentIds: new Set(),
  });
  assert.equal(res.items.length, 0);
  assert.equal(res.nearestFallback, null);
});

test('context guards — search, now, date, season, near, personal', () => {
  const base = { timeTab: 'thisMonth', searchActive: false, nearActive: false, personalTab: null };
  assert.equal(isFestivalSoonWidenContext(base), true);
  assert.equal(isFestivalSoonWidenContext({ ...base, searchActive: true }), false);
  assert.equal(isFestivalSoonWidenContext({ ...base, nearActive: true }), false);
  assert.equal(isFestivalSoonWidenContext({ ...base, personalTab: 'favorites' }), false);
  assert.equal(isFestivalSoonWidenContext({ ...base, timeTab: 'now' }), false);
  assert.equal(isFestivalSoonWidenContext({ ...base, timeTab: 'date' }), false);
  assert.equal(isFestivalSoonWidenContext({ ...base, timeTab: 'spring' }), false);
  assert.equal(isFestivalSoonWidenPeriod('window30'), true);
});

test('max 6 and sort order', () => {
  const many = [];
  for (let i = 0; i < 10; i += 1) {
    many.push(item(`m${i}`, addDaysYmd(TODAY, 32 + i), addDaysYmd(TODAY, 33 + i)));
  }
  const res = buildFestivalSoonWiden({
    pool: many,
    defaultListItems: [],
    now: SEOUL_NOON,
    zeroWindowRegion: true,
    excludeContentIds: new Set(),
  });
  assert.equal(res.items.length, SOON_WIDEN_MAX_CARDS);
  const sorted = [...res.items].sort((a, b) =>
    String(a.eventStartDate).localeCompare(String(b.eventStartDate)),
  );
  assert.deepEqual(res.items.map((r) => r.contentId), sorted.map((r) => r.contentId));
});

test('Seoul timezone date boundary for days-until-start', () => {
  const utcEdge = new Date('2026-10-15T15:00:00.000Z');
  const today = seoulTodayYmd(utcEdge);
  assert.equal(today, '20261016');
  const days = festivalDaysUntilStart(
    item('x', addDaysYmd(today, 3), addDaysYmd(today, 4)),
    today,
  );
  assert.equal(days, 3);
  assert.equal(diffYmdDays(today, addDaysYmd(today, 1)), 1);
});

test('isZeroWindowSidoSelection detects empty sido window', () => {
  const timed = POOL.filter((row) => row.areaCode === '32');
  assert.equal(isZeroWindowSidoSelection(timed, '39'), true);
  assert.equal(isZeroWindowSidoSelection(timed, '32'), false);
});

test('findNearestUpcomingFestival respects exclude set', () => {
  const row = findNearestUpcomingFestival(POOL, TODAY, new Set(['s3']));
  assert.notEqual(row?.contentId, 's3');
});

test('SOON_WIDEN_THRESHOLD is 5', () => {
  assert.equal(SOON_WIDEN_THRESHOLD, 5);
});