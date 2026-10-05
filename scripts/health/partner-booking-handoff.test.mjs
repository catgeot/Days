import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveLodgingHandoffVariant } from '../../src/shared/affiliate/partnerBookingHandoff.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

test('resolveLodgingHandoffVariant prefers hotel label by default', () => {
  assert.equal(resolveLodgingHandoffVariant({ itemName: '롯데 호텔' }), 'lodging-hotel');
});

test('resolveLodgingHandoffVariant detects guesthouse mix', () => {
  assert.equal(resolveLodgingHandoffVariant({ category: '게스트하우스' }), 'lodging-mixed');
  assert.equal(resolveLodgingHandoffVariant({ itemName: '속초 바다뷰 펜션' }), 'lodging-mixed');
});

test('PartnerBookingHandoff CTA is external anchor only', () => {
  const src = readFileSync(
    join(root, 'src/shared/affiliate/PartnerBookingHandoff.jsx'),
    'utf8',
  );
  assert.match(src, /rel="noopener noreferrer sponsored"/);
  assert.match(src, /target="_blank"/);
  assert.doesNotMatch(src, /navigate\(|useNavigate|\/checkout/i);
});
