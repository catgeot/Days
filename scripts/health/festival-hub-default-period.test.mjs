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
  festivalHubTimeMajorDisplay,
  festivalHubTimeMajorLabel,
} from '../../src/pages/Korea/festivalHubDefaultPeriod.js';
import { festivalHubRegionHeading } from '../../src/pages/Korea/festivalIndexHeadline.js';
import {
  buildFestivalPanelListMetaSegments,
  formatFestivalPanelListMetaPlain,
  insertWindow30MetaPeriodSegment,
  omitFestivalMetaRegionDuplicatingHeading,
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
  const dropped = formatFestivalPanelListMetaPlain(
    omitFestivalMetaRegionDuplicatingHeading(
      insertWindow30MetaPeriodSegment(
        base,
        festivalHubPeriodMetaLabel({ timeTab: 'thisMonth', now: SEOUL_NOON, locale: 'ko' }),
      ),
      '전국',
    ),
  );
  assert.equal(dropped, '~11.15 · 221건 · 시·도별');
});

test('meta drops a region prefix only when it repeats the heading', () => {
  const seoul = buildFestivalPanelListMetaSegments({
    areaCode: '1',
    cityName: 'all',
    count: 43,
    t: koT,
    locale: 'ko',
  });
  const seoulMeta = formatFestivalPanelListMetaPlain(
    omitFestivalMetaRegionDuplicatingHeading(
      insertWindow30MetaPeriodSegment(seoul, '11.15까지'),
      '서울특별시',
    ),
  );
  assert.equal(seoulMeta, '11.15까지 · 43건 · 구별');

  const gangneung = buildFestivalPanelListMetaSegments({
    areaCode: '32',
    cityName: '강릉시',
    count: 4,
    t: koT,
    locale: 'ko',
  });
  const gangneungMeta = formatFestivalPanelListMetaPlain(
    omitFestivalMetaRegionDuplicatingHeading(
      insertWindow30MetaPeriodSegment(gangneung, '~11.15'),
      '강원도 강릉',
    ),
  );
  assert.equal(gangneungMeta, '~11.15 · 4건');

  const kept = formatFestivalPanelListMetaPlain(
    omitFestivalMetaRegionDuplicatingHeading(
      insertWindow30MetaPeriodSegment(seoul, '11.15까지'),
      '서울특별시 · "이번 달" 축제 리스트',
    ),
  );
  assert.equal(kept, '서울특별시 · 11.15까지 · 43건 · 구별');
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

function periodT(locale) {
  const ko = {
    'korea.festival.periodCategory': '기간',
    'korea.festival.timeTab.thisMonth': '이번 달',
    'korea.festival.timeTab.now': '지금',
    'korea.common.time': '시간',
  };
  const en = {
    'korea.festival.periodCategory': 'Dates',
    'korea.festival.timeTab.thisMonth': 'Month',
    'korea.festival.timeTab.now': 'Now',
    'korea.common.time': 'Time',
  };
  const table = locale === 'en' ? en : ko;
  return (key) => table[key] || key;
}

test('flag-on default time category is 기간 / Dates, not 이번 달', () => {
  const ko = periodT('ko');
  const en = periodT('en');
  const monthTab = { id: 'thisMonth', label: '이번 달' };
  assert.equal(
    festivalHubTimeMajorLabel({
      dateChipEnabled: true,
      activeTab: null,
      timeTab: 'thisMonth',
      t: ko,
    }),
    '기간',
  );
  assert.equal(
    festivalHubTimeMajorDisplay({
      dateChipEnabled: true,
      locale: 'ko',
      timeMajorLabel: '기간',
      t: ko,
    }),
    '기간',
  );
  assert.equal(
    festivalHubTimeMajorDisplay({
      dateChipEnabled: true,
      locale: 'en',
      timeMajorLabel: 'Dates',
      t: en,
    }),
    'Dates',
  );
  const picked = { id: 'date', label: '10.24–10.25', headline: '10.24–10.25' };
  assert.equal(
    festivalHubTimeMajorLabel({
      dateChipEnabled: true,
      activeTab: picked,
      timeTab: 'date',
      t: ko,
    }),
    '10.24–10.25',
  );
  assert.equal(
    festivalHubTimeMajorLabel({
      dateChipEnabled: false,
      activeTab: monthTab,
      timeTab: 'thisMonth',
      t: ko,
    }),
    '이번 달',
  );
  assert.equal(
    festivalHubTimeMajorDisplay({
      dateChipEnabled: false,
      locale: 'en',
      timeMajorLabel: 'Month',
      t: en,
    }),
    'Time',
  );
  assert.equal(
    festivalHubTimeMajorDisplay({
      dateChipEnabled: false,
      locale: 'ko',
      timeMajorLabel: '이번 달',
      t: ko,
    }),
    '이번 달',
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
