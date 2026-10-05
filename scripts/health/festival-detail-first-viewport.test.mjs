import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  buildFestivalDetailSummary,
  FESTIVAL_DETAIL_SUMMARY_FIXTURE,
} from '../../src/pages/Korea/lib/festivalDetailSummary.js';
import { getVisibleBookingLinks } from '../../src/pages/Korea/lib/festivalBookingLinks.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('fixture summary exposes time fee and place for first viewport', () => {
  const summary = buildFestivalDetailSummary({
    ...FESTIVAL_DETAIL_SUMMARY_FIXTURE,
    freeLabel: '무료',
  });
  assert.equal(summary.timeText, '10:00~18:00');
  assert.equal(summary.fee?.text, '무료');
  assert.match(summary.placeText, /양양/);
});

test('booking map: 1998564 visible, unknown id hidden', () => {
  const links = getVisibleBookingLinks('1998564', {
    now: '2026-10-07T12:00:00+09:00',
    uiLang: 'ko',
  });
  assert.ok(links.length >= 1);
  assert.ok(links.some((row) => String(row.url).includes('65330')));
  assert.deepEqual(getVisibleBookingLinks('999999999', { uiLang: 'ko' }), []);
});

test('FestivalDetailFirstSummary exposes summary data markers', () => {
  const src = readFileSync(
    join(root, 'src/pages/Korea/FestivalDetailFirstSummary.jsx'),
    'utf8',
  );
  assert.match(src, /data-festival-summary-\$\{dataKey\}/);
  assert.match(src, /dataKey="time"/);
  assert.match(src, /dataKey="fee"/);
  assert.match(src, /dataKey="place"/);
});
