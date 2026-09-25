import assert from 'node:assert/strict';
import { formatLogbookDisplayDate, parseLogbookTimestamp } from '../src/utils/logbookDisplayDate.js';
import { resolveLogbookDisplaySrc } from '../src/utils/logbookImageSrc.js';

assert.equal(formatLogbookDisplayDate('2026-09-25'), '2026년 9월 25일');
assert.equal(
  formatLogbookDisplayDate('2026-09-25T03:13:41.995236+00:00'),
  '2026년 9월 25일',
);
assert.equal(
  formatLogbookDisplayDate({
    published_at: '2026-09-25T03:13:41.995236+00:00',
    date: '2026-09-25',
  }),
  '2026년 9월 25일',
);
assert.ok(parseLogbookTimestamp('2026-09-25T03:13:41.995236+00:00'));
assert.equal(formatLogbookDisplayDate('', { locale: 'en' }), '');
assert.equal(
  formatLogbookDisplayDate('2026-09-25', { locale: 'en' }),
  'September 25, 2026',
);

console.log('smoke-logbook-display-date: OK');
