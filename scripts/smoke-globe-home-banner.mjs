#!/usr/bin/env node
/**
 * 지구본 홈 동적 배너 — 축제 pick·장기 제외 스모크.
 *
 *   npm run smoke:globe-home-banner
 */
import {
  compareFestivalsByStartDesc,
  currentWeekRangeYmd,
  festivalDurationDays,
  isLongTermFestival,
  mixGlobeBannerItems,
  pickGlobeBannerFestivals,
  pickGlobeBannerScenicItems,
} from '../src/pages/Home/lib/globeBannerContent.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

const now = new Date('2026-08-15T12:00:00');

assert(isLongTermFestival({ title: '연중무휴 전시', eventStartDate: '20260101', eventEndDate: '20261231' }), 'keyword long-term');
assert(
  isLongTermFestival({ title: '여름축제', eventStartDate: '20260101', eventEndDate: '20260401' }),
  'duration > 60 days',
);
assert(
  !isLongTermFestival({ title: '단기축제', eventStartDate: '20260810', eventEndDate: '20260820' }),
  'short festival kept',
);
assert(festivalDurationDays({ eventStartDate: '20260810', eventEndDate: '20260812' }) === 3, 'duration days');

const week = currentWeekRangeYmd(now);
assert(/^\d{8}$/.test(week.startYmd) && /^\d{8}$/.test(week.endYmd), 'week range ymd');

const pool = [
  { contentId: '1', title: '진행중 최신', eventStartDate: '20260814', eventEndDate: '20260820' },
  { contentId: '2', title: '진행중 이전', eventStartDate: '20260801', eventEndDate: '20260820' },
  { contentId: '3', title: '이번주만', eventStartDate: '20260818', eventEndDate: '20260819' },
  { contentId: '4', title: '연중 상시', eventStartDate: '20260101', eventEndDate: '20261231' },
  { contentId: '5', title: '다음달', eventStartDate: '20260905', eventEndDate: '20260907' },
];

const picked = pickGlobeBannerFestivals(pool, { now, limit: 3 });
assert(picked.length === 3, 'pick limit 3');
assert(picked[0].id === 'festival:1', 'now + newest start first');
assert(picked.every((item) => item.topic === 'festival'), 'festival topic');
assert(!picked.some((item) => item.label.includes('연중')), 'long-term excluded');

const scenics = pickGlobeBannerScenicItems({ now, limit: 3 });
assert(scenics.length === 3, 'scenic pick 3');
assert(scenics.every((item) => item.topic === 'scenic' && item.href.includes('/korea/theme/scenic')), 'scenic href');

const mixed = mixGlobeBannerItems(picked, scenics);
assert(mixed.length === 6, 'interleaved 6 items (helper, unused in UI)');
assert(mixed[0].topic === 'festival' && mixed[1].topic === 'scenic', 'alternate mix helper');
assert(picked.every((item) => item.topic === 'festival'), 'festival lane only');
assert(scenics.every((item) => item.topic === 'scenic'), 'scenic lane only');

assert(
  compareFestivalsByStartDesc(
    { eventStartDate: '20260814', title: '가' },
    { eventStartDate: '20260801', title: '나' },
  ) < 0,
  'start date desc sort',
);

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll globe home banner smoke checks passed.');
