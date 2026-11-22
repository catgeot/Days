import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareWorldEventsForHubList,
  filterWorldEventsForHub,
  getWorldEventHubBadgeKind,
  getWorldEventHubSortTier,
  getWorldEventTimelineBucket,
  isWorldEventActiveForHub,
  WORLD_EVENT_LONG_SEASON_DAYS,
} from '../../src/shared/worldEventTimeline.js';
import { todayYmdKst } from '../../src/shared/tripWindow.js';
import { getWorldEventsForHubRegion } from '../../src/utils/worldEvents.js';

const KST_TODAY = '2026-11-22';

test('KST today helper uses Asia/Seoul', () => {
  const kst = todayYmdKst(new Date('2026-11-21T15:30:00.000Z'));
  assert.equal(kst, '2026-11-22');
  const kstPrev = todayYmdKst(new Date('2026-11-21T14:59:59.000Z'));
  assert.equal(kstPrev, '2026-11-21');
});

test('past events excluded from hub filter', () => {
  const endedYesterday = { id: 'x', startDate: '2026-11-01', endDate: '2026-11-21' };
  assert.equal(getWorldEventTimelineBucket(endedYesterday, KST_TODAY), 'past');
  assert.equal(isWorldEventActiveForHub(endedYesterday, KST_TODAY), false);
  const endsToday = { id: 'y', startDate: '2026-11-20', endDate: '2026-11-22' };
  assert.equal(getWorldEventTimelineBucket(endsToday, KST_TODAY), 'ongoing');
  assert.equal(isWorldEventActiveForHub(endsToday, KST_TODAY), true);
  const noEnd = { id: 'z', startDate: '2026-10-01' };
  assert.equal(getWorldEventTimelineBucket(noEnd, KST_TODAY), 'past');
});

test('hub region list has no past events as of 2026-11-22 KST', () => {
  const all = getWorldEventsForHubRegion('all');
  assert.ok(all.length >= 20);
  assert.ok(all.length <= 22);
  for (const event of all) {
    assert.notEqual(getWorldEventTimelineBucket(event, KST_TODAY), 'past', event.id);
    const badge = getWorldEventHubBadgeKind(event, KST_TODAY);
    assert.ok(badge === 'ongoing' || badge === 'upcoming', `${event.id} badge`);
  }
  const pastIds = [
    'munich-oktoberfest-2026',
    'istanbul-marathon-2026',
    'edinburgh-fringe-2026',
  ];
  for (const id of pastIds) {
    assert.ok(!all.some((e) => e.id === id), `${id} must not appear on hub`);
  }
});

test('hub sort: short ongoing before upcoming before long season', () => {
  const dubai = { id: 'dubai-fitness-challenge-2026', startDate: '2026-10-31', endDate: '2026-11-29' };
  const vienna = {
    id: 'vienna-staatsoper-season-2026',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
  };
  const seoulLantern = {
    id: 'seoul-lantern-festival-2026',
    startDate: '2026-12-11',
    endDate: '2027-01-31',
  };
  assert.equal(getWorldEventHubSortTier(dubai, KST_TODAY), 0);
  assert.equal(getWorldEventHubSortTier(seoulLantern, KST_TODAY), 1);
  assert.equal(
    getWorldEventHubSortTier(vienna, KST_TODAY),
    2,
    `long season threshold ${WORLD_EVENT_LONG_SEASON_DAYS}d`,
  );
  const ordered = [vienna, seoulLantern, dubai].sort((a, b) =>
    compareWorldEventsForHubList(a, b, KST_TODAY),
  );
  assert.deepEqual(
    ordered.map((e) => e.id),
    [dubai.id, seoulLantern.id, vienna.id],
  );
});

test('filterWorldEventsForHub keeps upcoming and ongoing only', () => {
  const sample = [
    { id: 'a', startDate: '2026-08-01', endDate: '2026-08-10' },
    { id: 'b', startDate: '2026-12-01', endDate: '2026-12-05' },
    { id: 'c', startDate: '2026-11-01', endDate: '2026-11-25' },
  ];
  const active = filterWorldEventsForHub(sample, KST_TODAY);
  assert.deepEqual(
    active.map((e) => e.id).sort(),
    ['b', 'c'],
  );
});