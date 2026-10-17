import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  WINDOW30_INCLUSIVE_DAYS,
  addDaysYmd,
  window30RangeYmd,
} from '../../src/pages/Korea/festivalDateFilter.js';
import {
  festivalHubFlagOnRangeYmd,
  festivalHubPeriodMetaLabel,
} from '../../src/pages/Korea/festivalHubDefaultPeriod.js';
import { festivalHubRegionHeading } from '../../src/pages/Korea/festivalIndexHeadline.js';
import {
  buildFestivalPanelListMetaSegments,
  formatFestivalPanelListMetaPlain,
  insertWindow30MetaPeriodSegment,
} from '../../src/pages/Korea/festivalPanelListMeta.js';
import { rolling30DayRangeYmd } from '../../src/pages/Korea/festivalTimeFilter.js';

const SEOUL_NOON = new Date('2026-10-17T03:00:00.000Z');
const STILL_PREVIOUS_DAY_UTC = new Date('2026-10-16T15:00:00.000Z');

function koT(key, opts = {}) {
  const table = {
    'korea.common.nationwide': '전국',
    'korea.common.countUnit': `${opts.count}건`,
    'korea.festival.panelNationwideScope': '전국',
    'korea.festival.panelNationwideGroup': '시·도별',
    'korea.festival.panelBySubregion': '구별',
  };
  return table[key] || opts.defaultValue || key;
}

test('flag-on default range matches window30, not the 31-day device window', () => {
  for (const now of [STILL_PREVIOUS_DAY_UTC, SEOUL_NOON]) {
    const flagOn = festivalHubFlagOnRangeYmd('thisMonth', now);
    const window30 = window30RangeYmd(now);
    const rolling = rolling30DayRangeYmd(now);
    assert.deepEqual(flagOn, window30);
    assert.equal(
      flagOn.eventEndDate,
      addDaysYmd(flagOn.eventStartDate, WINDOW30_INCLUSIVE_DAYS - 1),
    );
    assert.equal(rolling.eventEndDate, addDaysYmd(rolling.eventStartDate, 30));
    assert.notDeepEqual(flagOn, rolling);
  }
  assert.equal(festivalHubFlagOnRangeYmd('thisMonth', SEOUL_NOON).eventEndDate, '20261115');
  assert.deepEqual(
    festivalHubFlagOnRangeYmd('window30', SEOUL_NOON),
    festivalHubFlagOnRangeYmd('thisMonth', SEOUL_NOON),
  );
});

test('default meta uses ~end; 한 달 이내 chip uses the until label in the same slot', () => {
  assert.equal(
    festivalHubPeriodMetaLabel({ timeTab: 'thisMonth', now: SEOUL_NOON, locale: 'ko' }),
    '~11.15',
  );
  assert.equal(
    festivalHubPeriodMetaLabel({ timeTab: 'window30', now: SEOUL_NOON, locale: 'ko' }),
    '11.15까지',
  );
  assert.equal(
    festivalHubPeriodMetaLabel({ timeTab: 'thisMonth', now: SEOUL_NOON, locale: 'en' }),
    'until 11.15',
  );
  const base = buildFestivalPanelListMetaSegments({
    areaCode: 'all',
    cityName: 'all',
    count: 221,
    t: koT,
    locale: 'ko',
  });
  const text = formatFestivalPanelListMetaPlain(
    insertWindow30MetaPeriodSegment(
      base,
      festivalHubPeriodMetaLabel({ timeTab: 'thisMonth', now: SEOUL_NOON, locale: 'ko' }),
    ),
  );
  assert.equal(text, '전국 · ~11.15 · 221건 · 시·도별');
});

test('picked chip meta follows that range', () => {
  assert.equal(
    festivalHubPeriodMetaLabel({
      timeTab: 'date',
      now: SEOUL_NOON,
      locale: 'ko',
      customRange: { start: '20261024', end: '20261025' },
    }),
    '10.24\u201310.25',
  );
  assert.equal(
    festivalHubPeriodMetaLabel({ timeTab: 'weekend', now: SEOUL_NOON, locale: 'ko' }),
    '10.17\u201310.18',
  );
  assert.equal(
    festivalHubPeriodMetaLabel({ timeTab: 'now', now: SEOUL_NOON, seoulToday: '20261017', locale: 'ko' }),
    '10.17',
  );
});

test('flag-on heading is the region name only', () => {
  const nationwide = festivalHubRegionHeading({
    areaCode: 'all',
    cityName: 'all',
    place: '',
    t: koT,
  });
  const seoul = festivalHubRegionHeading({
    areaCode: '1',
    cityName: 'all',
    place: '서울특별시',
    t: koT,
  });
  const gangneung = festivalHubRegionHeading({
    areaCode: '32',
    cityName: '강릉시',
    place: '강원도 강릉',
    t: koT,
  });
  assert.equal(nationwide, '전국');
  assert.equal(seoul, '서울특별시');
  assert.equal(gangneung, '강원도 강릉');
  for (const line of [nationwide, seoul, gangneung]) {
    assert.equal(line.includes('"'), false, line);
    assert.equal(line.includes('축제 리스트'), false, line);
    assert.equal(line.includes('이번 달'), false, line);
    assert.equal(line.includes('\n'), false, line);
  }
});
