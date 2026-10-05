/**
 * W41 안2 — 축제 상세 첫 화면 요약(시간·요금·장소·예매).
 *   npm run smoke:festival-detail-first-viewport
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFestivalDetailSummary,
  FESTIVAL_DETAIL_SUMMARY_FIXTURE,
  formatFestivalFeeDisplay,
} from '../src/pages/Korea/lib/festivalDetailSummary.js';
import { getVisibleBookingLinks } from '../src/pages/Korea/lib/festivalBookingLinks.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sheet = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
const summaryComponent = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailFirstSummary.jsx'),
  'utf8',
);
const overviewComponent = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailOverviewCollapse.jsx'),
  'utf8',
);

const summary = buildFestivalDetailSummary({
  ...FESTIVAL_DETAIL_SUMMARY_FIXTURE,
  freeLabel: '무료',
});
assert.equal(summary.timeText, '10:00~18:00');
assert.equal(summary.fee?.text, '무료');
assert.ok(summary.placeText.includes('양양'));
assert.ok(summary.dateText.includes('9.06'));

assert.equal(formatFestivalFeeDisplay('입장 무료', '무료')?.text, '무료');
assert.equal(formatFestivalFeeDisplay('성인 15,000원', '무료')?.text, '성인 15,000원');

const palaceLinks = getVisibleBookingLinks('1998564', {
  now: '2026-10-07T12:00:00+09:00',
  uiLang: 'ko',
});
assert.ok(palaceLinks.some((row) => row.url.includes('65330')));
assert.deepEqual(getVisibleBookingLinks('506708', { uiLang: 'ko' }), []);

assert.match(sheet, /FestivalDetailFirstSummary/);
assert.match(summaryComponent, /data-festival-detail-summary/);
assert.match(sheet, /FestivalDetailOverviewCollapse/);
assert.match(overviewComponent, /line-clamp-3/);
assert.doesNotMatch(sheet, /예매 없음/);

const summaryAt = sheet.indexOf('<FestivalDetailFirstSummary');
const bookingInSummaryAt = sheet.indexOf('bookingSlot={', summaryAt);
assert.ok(summaryAt > 0 && bookingInSummaryAt > summaryAt, 'booking actions live inside first summary');
const outboundAt = sheet.indexOf('data-festival-outbound-search');
assert.ok(outboundAt > summaryAt, 'outbound search sits below summary card');

console.log('smoke-festival-detail-first-viewport: OK');
