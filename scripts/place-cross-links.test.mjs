import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES } from '../src/shared/gateoFeatureFlags.js';
import {
  isDomesticKoreaForCrosslink,
  resolvePlaceCrossLinks,
} from '../src/pages/Home/lib/resolvePlaceCrossLinks.js';

function withCrosslinkFlag(enabled, fn) {
  const prev = globalThis.__VITE_ENV__[GATEO_ENV_FLAG_NAMES.PLACE_CROSSLINK];
  globalThis.__VITE_ENV__[GATEO_ENV_FLAG_NAMES.PLACE_CROSSLINK] = enabled ? '1' : '';
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__[GATEO_ENV_FLAG_NAMES.PLACE_CROSSLINK] = prev;
  }
}

function pickTitles(bundle) {
  return {
    festivals: bundle.festivals.map((row) => row.title).filter(Boolean),
    events: bundle.events.map((row) => row.title).filter(Boolean),
    collections: bundle.collections.map((row) => row.title).filter(Boolean),
  };
}

test('flag off returns empty bundles', () => {
  withCrosslinkFlag(false, () => {
    const bundle = resolvePlaceCrossLinks({ slug: 'dubai', country: 'UAE' });
    assert.deepEqual(bundle, { festivals: [], events: [], collections: [] });
  });
});

test('domestic hubs expose scenic collections when flag on', () => {
  withCrosslinkFlag(true, () => {
    const gangneung = resolvePlaceCrossLinks({
      slug: 'gangneung',
      name: '강릉',
      country: '대한민국',
    });
    assert.ok(gangneung.collections.length >= 1);
    assert.match(gangneung.collections[0].title, /강릉/);
    assert.ok(
      gangneung.festivals.length >= 3,
      `gangneung festivals expected >=3 (seed+hub match), got ${gangneung.festivals.length}`,
    );

    const pyeongchang = resolvePlaceCrossLinks({
      slug: 'pyeongchang',
      name: '평창',
      country: '대한민국',
    });
    assert.ok(pyeongchang.collections.length >= 1);
    assert.match(pyeongchang.collections[0].title, /평창/);

    const jeju = resolvePlaceCrossLinks({
      slug: 'jeju',
      name: '제주',
      country: '대한민국',
    });
    assert.ok(jeju.collections.length >= 1);
    assert.match(jeju.collections[0].title, /제주/);
  });
});

test('Japan coords inside coarse bbox are not domestic (Fukuoka, Tsushima)', () => {
  assert.equal(isDomesticKoreaForCrosslink({ lat: 33.59, lng: 130.4 }), false);
  assert.equal(isDomesticKoreaForCrosslink({ lat: 34.2, lng: 129.29 }), false);
  assert.equal(
    isDomesticKoreaForCrosslink({ lat: 37.57, lng: 126.98, country: '대한민국' }),
    true,
  );
});

test('overseas slugs attach world events only', () => {
  withCrosslinkFlag(true, () => {
    const dubai = pickTitles(
      resolvePlaceCrossLinks({ slug: 'dubai', name: '두바이', country: 'United Arab Emirates' }),
    );
    assert.equal(dubai.events.length, 1);
    assert.match(dubai.events[0], /두바이 피트니스 챌린지/);
    assert.equal(dubai.festivals.length, 0);
    assert.equal(dubai.collections.length, 0);

    const vienna = pickTitles(
      resolvePlaceCrossLinks({ slug: 'vienna', name: '비엔나', country: 'Austria' }),
    );
    assert.ok(vienna.events.length >= 1);
    assert.equal(vienna.festivals.length, 0);
    assert.equal(vienna.collections.length, 0);
  });
});
