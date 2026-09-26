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

const sizedNoW = resolveLogbookDisplaySrc({
  url: 'https://images.unsplash.com/photo-1502602898657',
});
assert.ok(sizedNoW.includes('w=1200'), sizedNoW);
assert.ok(sizedNoW.includes('fit=crop'), sizedNoW);
assert.ok(sizedNoW.includes('q=80'), sizedNoW);

const sizedExistingW = resolveLogbookDisplaySrc({
  url: 'https://images.unsplash.com/photo-1502602898657?auto=format&fit=crop&w=2400&q=90',
});
assert.ok(sizedExistingW.includes('w=2400'), sizedExistingW);

const thumb = resolveLogbookDisplaySrc(
  { url: 'https://images.unsplash.com/photo-1502602898657?w=2400' },
  { role: 'thumb' },
);
assert.ok(thumb.includes('w=400'), thumb);

console.log('smoke-logbook-display-date: OK');
