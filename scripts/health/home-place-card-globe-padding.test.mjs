import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PLACE_CARD_GLOBE_PAD_FALLBACK,
  computePlaceCardGlobeFlyPadding,
} from '../../src/pages/Home/lib/homePlaceCardGlobePadding.js';

test('place summary fly padding uses bottom inset on mobile', () => {
  const pad = computePlaceCardGlobeFlyPadding({
    viewportWidth: 390,
    viewportHeight: 844,
    cardRect: { top: 470, left: 24, right: 366, bottom: 820, width: 342, height: 350 },
  });
  assert.equal(pad.bottom, 844 - 470 + 16);
  assert.ok(pad.top >= 80);
  assert.equal(pad.left, PLACE_CARD_GLOBE_PAD_FALLBACK.mobile.left);
});

test('place summary fly padding uses right inset on desktop', () => {
  const pad = computePlaceCardGlobeFlyPadding({
    viewportWidth: 1280,
    viewportHeight: 800,
    cardRect: { top: 520, left: 856, right: 1256, bottom: 768, width: 400, height: 248 },
  });
  assert.ok(pad.right >= 1280 - 856 + 20);
  assert.equal(pad.bottom, PLACE_CARD_GLOBE_PAD_FALLBACK.desktop.bottom);
});

test('place summary fly padding falls back when the card is not measured', () => {
  const mobile = computePlaceCardGlobeFlyPadding({ viewportWidth: 390, viewportHeight: 844 });
  assert.deepEqual(mobile, PLACE_CARD_GLOBE_PAD_FALLBACK.mobile);
  const desktop = computePlaceCardGlobeFlyPadding({ viewportWidth: 1280, viewportHeight: 800 });
  assert.deepEqual(desktop, PLACE_CARD_GLOBE_PAD_FALLBACK.desktop);
});