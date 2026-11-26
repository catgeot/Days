import assert from 'node:assert/strict';
import test from 'node:test';

import { MONTHLY_PICKS } from '../../src/pages/Home/data/spotTraits.js';
import { buildHomeWatchMonthlyDestinations } from '../../src/pages/Home/lib/homeWatchCardModel.js';
import {
  placeMonthlyReasonCopy,
  readPlaceMonthlyPickKey,
  resolvePlaceMonthlyPick,
} from '../../src/pages/Home/lib/placeMonthlyReason.js';

const NOVEMBER = new Date('2026-11-25T03:00:00.000Z');

const NOVEMBER_SLUGS = ['kyoto', 'chiang-mai', 'phu-quoc', 'jeju', 'dubai', 'melbourne'];
const DECEMBER_SLUGS = ['sapporo', 'vienna', 'hong-kong', 'seoul', 'sydney', 'reykjavik'];

test('November and December picks keep the card reason and add a sourced best-time line', () => {
  for (const monthKey of ['2026-11', '2026-12']) {
    for (const entry of MONTHLY_PICKS[monthKey]) {
      assert.ok(entry.reason.length > 0 && entry.reason.length <= 40);
      assert.ok(entry.reason_en.length > 0 && entry.reason_en.length <= 40);
      assert.equal(typeof entry.best, 'string');
      assert.equal(typeof entry.best_en, 'string');
      assert.ok(entry.best.length >= 12 && entry.best.length <= 160, entry.slug);
      assert.ok(entry.best_en.length >= 12 && entry.best_en.length <= 220, entry.slug);
      assert.ok(entry.sources.some((source) => source.label_en));
    }
  }
  assert.equal(MONTHLY_PICKS['2026-11'].find((e) => e.slug === 'phu-quoc').reason, '11월 건기 시작');
  assert.equal(MONTHLY_PICKS['2026-11'].find((e) => e.slug === 'phu-quoc').reason_en, 'Dry season·Nov');
  assert.doesNotMatch(MONTHLY_PICKS['2026-11'].find((e) => e.slug === 'jeju').reason, /10월|억새|추정/);
  assert.doesNotMatch(MONTHLY_PICKS['2026-11'].find((e) => e.slug === 'jeju').best, /억새/);
  assert.doesNotMatch(MONTHLY_PICKS['2026-11'].find((e) => e.slug === 'melbourne').reason, /10\/|11\/3|카니발|멜버른컵/);

  const chiang = MONTHLY_PICKS['2026-11'].find((e) => e.slug === 'chiang-mai');
  assert.match(chiang.best, /^11월 23일부터 25일/);
  assert.match(chiang.best, /서늘한 계절/);
  assert.match(chiang.best, /11월부터 2월은 건기/);
  assert.match(chiang.best_en, /^The Yi Peng festival runs 23–25 November/);
  assert.doesNotMatch(chiang.best, /^시내에서는/);
  assert.equal(chiang.sources[0].url.startsWith('https://www.cmcity.go.th/'), true);
  assert.equal(chiang.sources[1].url, 'https://www.tourismthailand.org/Articles/thailand-november');
  assert.equal(chiang.sources[2].url, 'https://www.thailandtravel.or.jp/about/calendar/');

  const dubai = MONTHLY_PICKS['2026-11'].find((e) => e.slug === 'dubai');
  assert.match(dubai.best, /10월 31일부터 11월 29일/);
  assert.match(dubai.best, /30일 동안 하루 30분/);
  assert.doesNotMatch(dubai.best, /마리나|주메이라/);
  assert.doesNotMatch(dubai.best_en, /Marina|Jumeirah/);
  assert.equal(dubai.sources[0].url, 'https://www.dubaifitnesschallenge.com/en/');

  const sapporo = MONTHLY_PICKS['2026-12'].find((e) => e.slug === 'sapporo');
  assert.match(sapporo.best, /11월 20일부터 12월 25일/);
  assert.match(sapporo.best, /16:30부터 22:00/);
  assert.match(sapporo.best, /12월 23일부터 25일만 24:00/);
  assert.doesNotMatch(sapporo.best, /3월 14|자정/);
  assert.match(sapporo.best_en, /20 November to 25 December 2026, 16:30–22:00/);
  assert.doesNotMatch(sapporo.best_en, /March|midnight/);
  assert.equal(
    sapporo.sources[0].url,
    'https://www.sapporo.travel/white-illumination/event/illumination/odori/',
  );
});

test('the reason box follows only the monthly card query', () => {
  for (const slug of NOVEMBER_SLUGS) {
    assert.equal(resolvePlaceMonthlyPick({ slug, now: NOVEMBER }), null, slug);
    const pick = resolvePlaceMonthlyPick({
      slug,
      now: NOVEMBER,
      monthKey: readPlaceMonthlyPickKey('?monthly=2026-11'),
    });
    assert.equal(pick.monthKey, '2026-11', slug);
    const ko = placeMonthlyReasonCopy(pick, 'ko');
    const en = placeMonthlyReasonCopy(pick, 'en');
    assert.equal(ko.reason, MONTHLY_PICKS['2026-11'].find((e) => e.slug === slug).reason);
    assert.equal(en.reason, MONTHLY_PICKS['2026-11'].find((e) => e.slug === slug).reason_en);
    assert.equal(ko.monthLabel, '11');
    assert.equal(en.monthLabel, 'November');
    assert.match(ko.sources[0].url, /^https:\/\//);
    assert.notEqual(en.sources[0].label, ko.sources[0].label);
  }
  for (const slug of DECEMBER_SLUGS) {
    assert.equal(resolvePlaceMonthlyPick({ slug, now: NOVEMBER }), null, slug);
    const pick = resolvePlaceMonthlyPick({
      slug,
      now: NOVEMBER,
      monthKey: readPlaceMonthlyPickKey('?monthly=2026-12'),
    });
    assert.equal(pick.monthKey, '2026-12', slug);
    assert.ok(placeMonthlyReasonCopy(pick, 'ko').best.length > 0);
  }
  const fromCard = resolvePlaceMonthlyPick({
    slug: 'sapporo',
    now: NOVEMBER,
    monthKey: readPlaceMonthlyPickKey('?monthly=2026-12'),
  });
  assert.equal(fromCard.monthKey, '2026-12');
  assert.equal(placeMonthlyReasonCopy(fromCard, 'en').reason, 'Odori lights Nov–');
  assert.equal(
    resolvePlaceMonthlyPick({
      slug: 'sapporo',
      now: NOVEMBER,
      monthKey: readPlaceMonthlyPickKey('?monthly=2026-11'),
    }),
    null,
  );
  assert.equal(
    resolvePlaceMonthlyPick({
      slug: 'phu-quoc',
      now: new Date('2026-11-09T03:00:00.000Z'),
    }),
    null,
  );
  assert.equal(resolvePlaceMonthlyPick({ slug: 'tokyo', now: NOVEMBER, monthKey: '2026-11' }), null);
  assert.equal(
    resolvePlaceMonthlyPick({
      slug: 'phu-quoc',
      now: new Date('2027-01-15T03:00:00.000Z'),
    }),
    null,
  );
  assert.equal(
    resolvePlaceMonthlyPick({
      slug: 'phu-quoc',
      now: new Date('2027-01-15T03:00:00.000Z'),
      monthKey: '2027-01',
    }),
    null,
  );
  assert.equal(readPlaceMonthlyPickKey(''), '');
});

test('home monthly card links carry the month they were opened from', () => {
  const november = buildHomeWatchMonthlyDestinations(NOVEMBER, [], '2026-11', 'ko');
  assert.deepEqual(
    november.map((item) => item.slug),
    NOVEMBER_SLUGS,
  );
  assert.ok(november.every((item) => item.href.endsWith('?monthly=2026-11')));
  const december = buildHomeWatchMonthlyDestinations(NOVEMBER, [], '2026-12', 'en');
  assert.deepEqual(december.map((item) => item.slug), DECEMBER_SLUGS);
  assert.ok(december.every((item) => item.href.includes('?monthly=2026-12')));
});
