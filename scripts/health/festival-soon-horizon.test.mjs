import assert from 'node:assert/strict';
import test from 'node:test';

import { addDaysYmd, seoulTodayYmd } from '../../src/pages/Korea/festivalDateFilter.js';
import {
  buildFestivalSoonWiden,
  buildSidoTagsForListWindow,
  isZeroWindowSidoSelection,
} from '../../src/pages/Korea/lib/festivalSoonWiden.js';
import { filterByRegion } from '../../src/pages/Korea/festivalRegionTags.js';
import {
  fetchFestivalSoonHorizon,
  festivalSoonHorizonRanges,
  mergeFestivalSoonHorizon,
  resetFestivalSoonHorizonForTests,
} from '../../src/pages/Korea/lib/festivalSoonHorizon.js';

const NOW = new Date('2026-11-20T03:00:00.000Z');
const TODAY = seoulTodayYmd(NOW);

/** Rolling festivalWindow rows for the three zero chips, as they sit in the live cache. */
const ROLLING_ENDED = [
  {
    contentId: 'jeju-biennale',
    title: '제주비엔날레',
    eventStartDate: '20260901',
    eventEndDate: '20261115',
    addr1: '제주특별자치도 제주시',
    areaCode: '39',
  },
  {
    contentId: 'chungnam-ginkgo',
    title: '공주 은행나무 축제',
    eventStartDate: '20261101',
    eventEndDate: '20261115',
    addr1: '충청남도 공주시',
    areaCode: '34',
  },
  {
    contentId: 'sejong-walk',
    title: '세종 걷기대회',
    eventStartDate: '20261101',
    eventEndDate: '20261114',
    addr1: '세종특별자치시',
    areaCode: '8',
  },
];

const HORIZON_SOON = {
  contentId: 'jeju-horizon',
  title: '제주 곧 축제',
  eventStartDate: addDaysYmd(TODAY, 40),
  eventEndDate: addDaysYmd(TODAY, 43),
  addr1: '제주특별자치도 서귀포시',
  areaCode: '39',
};

const HORIZON_NEAREST = {
  contentId: 'chungnam-far',
  title: '충남 먼 축제',
  eventStartDate: addDaysYmd(TODAY, 120),
  eventEndDate: addDaysYmd(TODAY, 123),
  addr1: '충청남도 보령시',
  areaCode: '34',
};

function widen(pool, areaCode) {
  const region = filterByRegion(pool, { areaCode, cityName: 'all' });
  const timed = region.filter(
    (row) => row.eventEndDate >= TODAY && row.eventStartDate <= addDaysYmd(TODAY, 29),
  );
  return {
    timed,
    result: buildFestivalSoonWiden({
      pool: region,
      defaultListItems: timed,
      now: NOW,
      zeroWindowRegion: isZeroWindowSidoSelection(timed, areaCode),
    }),
  };
}

test('horizon ranges are the three bounded windows after the chip month', () => {
  const ranges = festivalSoonHorizonRanges(NOW);
  assert.deepEqual(ranges, [
    { eventStartDate: addDaysYmd(TODAY, 30), eventEndDate: addDaysYmd(TODAY, 59) },
    { eventStartDate: addDaysYmd(TODAY, 60), eventEndDate: addDaysYmd(TODAY, 89) },
    { eventStartDate: addDaysYmd(TODAY, 90), eventEndDate: addDaysYmd(TODAY, 179) },
  ]);
});

test('rolling cache alone leaves 제주·충남·세종 with no soon card and no nearest date', () => {
  for (const areaCode of ['39', '34', '8']) {
    const { timed, result } = widen(ROLLING_ENDED, areaCode);
    assert.equal(timed.length, 0, areaCode);
    assert.equal(result.items.length, 0, areaCode);
    assert.equal(result.nearestFallback, null, areaCode);
    const chip = buildSidoTagsForListWindow(timed).find((row) => row.id === areaCode);
    assert.equal(chip?.count, 0, areaCode);
  }
});

test('horizon-only row fills the soon section while the 30-day chip stays at 0', () => {
  const merged = mergeFestivalSoonHorizon(ROLLING_ENDED, [HORIZON_SOON]);
  const without = widen(ROLLING_ENDED, '39');
  const withHorizon = widen(merged, '39');
  assert.equal(without.result.items.length, 0);
  assert.equal(withHorizon.result.items.length, 1);
  assert.equal(withHorizon.result.items[0].contentId, 'jeju-horizon');
  assert.equal(withHorizon.result.stage, 1);
  const chipSource = ROLLING_ENDED.filter(
    (row) => row.eventEndDate >= TODAY && row.eventStartDate <= addDaysYmd(TODAY, 29),
  );
  const chip = buildSidoTagsForListWindow(chipSource).find((row) => row.id === '39');
  assert.equal(chip?.count, 0);
  assert.equal(chipSource.some((row) => row.contentId === 'jeju-horizon'), false);
});

test('a later horizon start becomes the nearest fallback when +30–89 is empty', () => {
  const merged = mergeFestivalSoonHorizon(ROLLING_ENDED, [HORIZON_NEAREST]);
  const { result } = widen(merged, '34');
  assert.equal(result.items.length, 0);
  assert.equal(result.nearestFallback?.contentId, 'chungnam-far');
});

test('searchFestival horizon pages each bounded range and dedupes', async () => {
  resetFestivalSoonHorizonForTests();
  const ranges = festivalSoonHorizonRanges(NOW);
  const calls = [];
  const filler = ranges[0];
  const page = Array.from({ length: 50 }, (_, index) => ({
    contentId: `pad-${index}`,
    title: `pad ${index}`,
    eventStartDate: filler.eventStartDate,
    eventEndDate: filler.eventEndDate,
    addr1: '강원특별자치도 평창군',
  }));
  const rows = await fetchFestivalSoonHorizon(NOW, {
    fetchPage: async (range) => {
      calls.push(`${range.eventStartDate}:${range.pageNo}`);
      if (range.eventStartDate === filler.eventStartDate && range.pageNo === 1) {
        return { ok: true, items: page };
      }
      if (range.eventStartDate === filler.eventStartDate && range.pageNo === 2) {
        return { ok: true, items: [HORIZON_SOON, page[0]] };
      }
      if (range.eventStartDate === ranges[2].eventStartDate && range.pageNo === 1) {
        return { ok: true, items: [HORIZON_NEAREST] };
      }
      return { ok: true, items: [] };
    },
  });
  assert.ok(calls.includes(`${ranges[0].eventStartDate}:1`));
  assert.ok(calls.includes(`${ranges[0].eventStartDate}:2`));
  assert.ok(calls.includes(`${ranges[1].eventStartDate}:1`));
  assert.ok(calls.includes(`${ranges[2].eventStartDate}:1`));
  assert.equal(calls.includes(`${ranges[0].eventStartDate}:3`), false);
  assert.equal(rows.filter((row) => row.contentId === 'pad-0').length, 1);
  assert.equal(rows.some((row) => row.contentId === 'jeju-horizon'), true);
  assert.equal(rows.some((row) => row.contentId === 'chungnam-far'), true);
});
