import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  WINDOW30_INCLUSIVE_DAYS,
  addDaysYmd,
  daysInMonth,
  festivalIntervalYmd,
  filterFestivalsByYmdRange,
  formatFestivalMonthDay,
  formatFestivalRangeLabel,
  formatWindow30RangeSuffix,
  formatWindow30UntilMetaLabel,
  replaceMonthTabWithDateChips,
  seoulTodayYmd,
  upcomingWeekendRangeYmd,
  window30RangeFromYmd,
  window30RangeYmd,
} from '../../src/pages/Korea/festivalDateFilter.js';

const SEOUL_TODAY = '20261016';

test('labels drop leading zeros: 10.3, 10.31, 12.15', () => {
  assert.equal(formatFestivalMonthDay('20261003', SEOUL_TODAY), '10.3');
  assert.equal(formatFestivalMonthDay('20261031', SEOUL_TODAY), '10.31');
  assert.equal(formatFestivalMonthDay('20261215', SEOUL_TODAY), '12.15');
  assert.equal(
    formatFestivalRangeLabel('20261024', '20261025', SEOUL_TODAY),
    '10.24\u201310.25',
  );
});

test('leap day 2028.2.1 keeps the year prefix and a real 29 February', () => {
  assert.equal(formatFestivalMonthDay('20280201', SEOUL_TODAY), '2028.2.1');
  assert.equal(formatFestivalRangeLabel('20280201', '20280201', SEOUL_TODAY), '2028.2.1');
  assert.equal(addDaysYmd('20280131', 1), '20280201');
  assert.equal(daysInMonth(2028, 2), 29);
  assert.equal(addDaysYmd('20280228', 1), '20280229');
  assert.equal(addDaysYmd('20280229', 1), '20280301');
  assert.equal(addDaysYmd('20270228', 1), '20270301');
  const leapWindow = window30RangeFromYmd('20280201');
  assert.deepEqual(leapWindow, {
    eventStartDate: '20280201',
    eventEndDate: '20280301',
  });
});

test('Seoul today ignores a device clock that is still the previous day', () => {
  const justAfterSeoulMidnight = new Date('2026-10-16T15:05:00.000Z');
  assert.equal(seoulTodayYmd(justAfterSeoulMidnight), '20261017');
  assert.equal(seoulTodayYmd(new Date('2026-10-16T14:59:00.000Z')), '20261016');
  const range = window30RangeYmd(justAfterSeoulMidnight);
  assert.equal(range.eventStartDate, '20261017');
  assert.equal(range.eventEndDate, addDaysYmd('20261017', WINDOW30_INCLUSIVE_DAYS - 1));
  assert.equal(range.eventEndDate, '20261115');
});

test('30-day window is today through today+29 inclusive', () => {
  const range = window30RangeFromYmd(SEOUL_TODAY);
  assert.deepEqual(range, {
    eventStartDate: '20261016',
    eventEndDate: '20261114',
  });
  assert.equal(WINDOW30_INCLUSIVE_DAYS, 30);
});

test('single-day boundaries and ongoing overlap stay inside the window', () => {
  const range = window30RangeFromYmd(SEOUL_TODAY);
  const items = [
    { id: 'start-day', eventStartDate: '20261016', eventEndDate: '20261016' },
    { id: 'end-day', eventStartDate: '20261114', eventEndDate: '20261114' },
    { id: 'before', eventStartDate: '20261015', eventEndDate: '20261015' },
    { id: 'after', eventStartDate: '20261115', eventEndDate: '20261115' },
    { id: 'ongoing', eventStartDate: '20261001', eventEndDate: '20261020' },
    { id: 'covers', eventStartDate: '20260101', eventEndDate: '20261231' },
    { id: 'touches-start', eventStartDate: '20260901', eventEndDate: '20261016' },
  ];
  const ids = filterFestivalsByYmdRange(
    items,
    range.eventStartDate,
    range.eventEndDate,
  ).map((item) => item.id);
  assert.deepEqual(ids, [
    'start-day',
    'end-day',
    'ongoing',
    'covers',
    'touches-start',
  ]);
});

test('invalid end counts as the start day; missing start and end-before-start drop', () => {
  const range = window30RangeFromYmd(SEOUL_TODAY);
  const items = [
    { id: 'blank-end', eventStartDate: '20261020', eventEndDate: '' },
    { id: 'garbage-end', eventStartDate: '20261021', eventEndDate: 'soon' },
    { id: 'impossible-end', eventStartDate: '20261022', eventEndDate: '20260230' },
    { id: 'non-leap-end', eventStartDate: '20261023', eventEndDate: '20270229' },
    { id: 'blank-end-outside', eventStartDate: '20261001', eventEndDate: '' },
    { id: 'end-before-start', eventStartDate: '20261020', eventEndDate: '20261019' },
    { id: 'missing-start', eventStartDate: '', eventEndDate: '20261020' },
    { id: 'bad-start', eventStartDate: '20261340', eventEndDate: '20261020' },
  ];
  const ids = filterFestivalsByYmdRange(
    items,
    range.eventStartDate,
    range.eventEndDate,
  ).map((item) => item.id);
  assert.deepEqual(ids, [
    'blank-end',
    'garbage-end',
    'impossible-end',
    'non-leap-end',
  ]);
  assert.deepEqual(festivalIntervalYmd(items[0]), {
    start: '20261020',
    end: '20261020',
  });
  assert.equal(festivalIntervalYmd(items[5]), null);
  assert.equal(festivalIntervalYmd(items[6]), null);
});

test('date chips replace 이번 달 and leave the weekend chip alone', () => {
  const tabs = replaceMonthTabWithDateChips(
    [
      { id: 'now', label: '지금' },
      { id: 'weekend', label: '이번 주말' },
      { id: 'thisMonth', label: '이번 달' },
      { id: 'autumn', label: '가을' },
    ],
    {
      window30Label: '한 달 이내',
      window30Headline: '한 달 이내',
      dateLabel: '10.17\u201310.18',
      dateHeadline: '10.17\u201310.18',
    },
  );
  assert.deepEqual(
    tabs.map((tab) => tab.id),
    ['now', 'weekend', 'window30', 'date', 'autumn'],
  );
  assert.equal(tabs[1].label, '이번 주말');
  assert.equal(tabs[2].label, '한 달 이내');
  assert.equal(tabs[2].headline, '한 달 이내');
  assert.equal(tabs[3].headline, '10.17\u201310.18');
  assert.equal(tabs[3].label, '10.17\u201310.18');
});

test('window30 subline range suffix and a picked range is the label itself', () => {
  const end = formatFestivalMonthDay('20261114', SEOUL_TODAY);
  assert.equal(end, '11.14');
  assert.equal(formatWindow30RangeSuffix(end), '~11.14');
  assert.equal(formatWindow30RangeSuffix('~11.14'), '~11.14');
  assert.equal(formatWindow30RangeSuffix('2027.11.14'), '~2027.11.14');
  const picked = formatFestivalRangeLabel('20261017', '20261018', SEOUL_TODAY);
  assert.equal(picked, '10.17\u201310.18');
  assert.equal(formatWindow30RangeSuffix(end).includes('"'), false);
  assert.equal(picked.includes('"'), false);
  assert.equal(formatWindow30UntilMetaLabel(end, 'ko'), '11.14까지');
  assert.equal(formatWindow30UntilMetaLabel(end, 'en'), 'until 11.14');
});

test('weekend window on Sat–Sun is today through Sunday (Seoul)', () => {
  const sat = new Date('2026-10-17T03:00:00.000Z');
  assert.equal(seoulTodayYmd(sat), '20261017');
  assert.deepEqual(upcomingWeekendRangeYmd(sat), {
    startYmd: '20261017',
    endYmd: '20261018',
  });
  const sun = new Date('2026-10-18T03:00:00.000Z');
  assert.deepEqual(upcomingWeekendRangeYmd(sun), {
    startYmd: '20261018',
    endYmd: '20261018',
  });
  const fri = new Date('2026-10-16T03:00:00.000Z');
  assert.deepEqual(upcomingWeekendRangeYmd(fri), {
    startYmd: '20261016',
    endYmd: '20261018',
  });
});
