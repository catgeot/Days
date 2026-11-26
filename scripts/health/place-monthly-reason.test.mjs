import assert from 'node:assert/strict';
import test from 'node:test';

import { MONTHLY_PICKS } from '../../src/pages/Home/data/spotTraits.js';
import {
  HOME_MONTHLY_PREVIEW_START_DAY,
  buildHomeWatchMonthlyDestinations,
} from '../../src/pages/Home/lib/homeWatchCardModel.js';
import {
  PLACE_MONTHLY_REASON_PREVIEW_START_DAY,
  placeMonthlyReasonCopy,
  readPlaceMonthlyPickKey,
  resolvePlaceMonthlyPick,
} from '../../src/pages/Home/lib/placeMonthlyReason.js';

const NOVEMBER = new Date('2026-11-25T03:00:00.000Z');

const NOVEMBER_SLUGS = ['kyoto', 'chiang-mai', 'phu-quoc', 'jeju', 'dubai', 'melbourne'];
const DECEMBER_SLUGS = ['sapporo', 'vienna', 'hong-kong', 'seoul', 'sydney', 'reykjavik'];

test('place monthly preview start stays aligned with the home strip', () => {
  assert.equal(PLACE_MONTHLY_REASON_PREVIEW_START_DAY, HOME_MONTHLY_PREVIEW_START_DAY);
});

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
});

test('current month, next month, and the card query resolve the place reason', () => {
  for (const slug of NOVEMBER_SLUGS) {
    const pick = resolvePlaceMonthlyPick({ slug, now: NOVEMBER });
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
    const pick = resolvePlaceMonthlyPick({ slug, now: NOVEMBER });
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

  const early = resolvePlaceMonthlyPick({
    slug: 'sapporo',
    now: new Date('2026-11-09T03:00:00.000Z'),
    previewStartDay: 20,
  });
  assert.equal(early, null);
  assert.equal(
    resolvePlaceMonthlyPick({ slug: 'phu-quoc', now: new Date('2026-11-09T03:00:00.000Z'), previewStartDay: 20 }).monthKey,
    '2026-11',
  );
  assert.equal(resolvePlaceMonthlyPick({ slug: 'tokyo', now: NOVEMBER }), null);
  assert.equal(resolvePlaceMonthlyPick({ slug: 'phu-quoc', now: new Date('2027-01-15T03:00:00.000Z') }), null);
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
