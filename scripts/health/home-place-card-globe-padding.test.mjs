import assert from 'node:assert/strict';
import test from 'node:test';

import {
  offsetPlaceCardFlyCenter,
  placeCardFlyLatitudeOffsetDeg,
} from '../../src/pages/Home/lib/homePlaceCardFlyOffset.js';

test('place summary fly shifts the camera south on a phone', () => {
  const jeju = offsetPlaceCardFlyCenter(33.5, 126.5, {
    viewportWidth: 390,
    viewportHeight: 844,
    zoom: 2.35,
  });
  assert.equal(jeju.lng, 126.5);
  assert.ok(jeju.lat < 33.5 - 8, `expected a clear south shift, got ${jeju.lat}`);
  assert.ok(jeju.lat > 33.5 - 27);
  const deg = placeCardFlyLatitudeOffsetDeg({ viewportHeight: 844, zoom: 2.35 });
  assert.ok(deg >= 10 && deg <= 26);
});

test('place summary fly does not shift latitude on desktop', () => {
  const desktop = offsetPlaceCardFlyCenter(33.5, 126.5, {
    viewportWidth: 1280,
    viewportHeight: 800,
    zoom: 2.35,
  });
  assert.deepEqual(desktop, { lat: 33.5, lng: 126.5 });
});

test('southern pin still moves up the screen and stays on the globe', () => {
  const south = offsetPlaceCardFlyCenter(-33.9, 18.4, {
    viewportWidth: 390,
    viewportHeight: 844,
    zoom: 2.35,
  });
  assert.ok(south.lat < -33.9);
  assert.ok(south.lat >= -85);
  const polar = offsetPlaceCardFlyCenter(-80, 0, {
    viewportWidth: 390,
    viewportHeight: 844,
    zoom: 2.35,
  });
  assert.ok(polar.lat >= -85);
  assert.ok(polar.lat < -80);
});
