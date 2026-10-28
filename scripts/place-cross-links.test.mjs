import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES } from '../src/shared/gateoFeatureFlags.js';
import { resolvePlaceCrossLinksIfEnabled } from '../src/pages/Home/lib/placeCrosslinkRollout.js';
import {
  isDomesticKoreaForCrosslink,
  listRegionalScenicPlaceCardsForLocation,
  resolvePlaceCrossLinks,
  scenicSpotHasDisplayPhoto,
  sortScenicSpotRowsPreferPhotos,
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
    const gated = resolvePlaceCrossLinksIfEnabled({ slug: 'gangneung', country: '대한민국' });
    assert.deepEqual(gated, { festivals: [], events: [], collections: [] });
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
    const jejuFestIds = jeju.festivals.map((row) => String(row.id || '').replace(/^festival:/, ''));
    assert.ok(
      jejuFestIds.includes('506616'),
      `jeju bundle should include seogwipo-hub festival 506616, got ${jejuFestIds.join(',')}`,
    );
    assert.match(
      jeju.festivals.find((row) => row.id === 'festival:506616')?.title || '',
      /서귀포/,
    );
    const jejuCollectionTitles = jeju.collections.map((row) => row.title);
    const jejuCollectionIds = jeju.collections.map((row) => row.id);
    assert.ok(jejuCollectionIds.includes('scenic-hub:jeju'), 'jeju hub collection card');
    assert.ok(jejuCollectionIds.includes('scenic-hub:seogwipo'), 'seogwipo hub collection card');
    assert.match(
      jejuCollectionTitles.find((t) => /서귀포/.test(t) && /명소 컬렉션/.test(t)) || '',
      /서귀포/,
    );
    assert.ok(
      jejuCollectionIds.includes('scenic:seongsan-ilchulbong'),
      `jeju bundle must include 성산일출봉, got spots: ${jejuCollectionTitles.join(', ')}`,
    );

    const gangTitles = gangneung.festivals.map((row) => row.title);
    assert.ok(gangTitles.some((t) => /국수/.test(t)));
    assert.ok(gangTitles.some((t) => /커피/.test(t)));
    assert.ok(gangTitles.includes('K-Drone Festival'), 'TourAPI has no KO title for 4116994');
  });
});

test('ended seed festivals are dropped at runtime', () => {
  withCrosslinkFlag(true, () => {
    const afterSeason = resolvePlaceCrossLinks(
      { slug: 'gangneung', name: '강릉', country: '대한민국' },
      { now: new Date('2026-11-01T12:00:00+09:00') },
    );
    assert.equal(
      afterSeason.festivals.length,
      0,
      'all anchor Gangneung festivals end before Nov 2026',
    );
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

test('regional scenic place cards prefer photos and link to /place', () => {
  const pyeongchang = listRegionalScenicPlaceCardsForLocation({
    slug: 'pyeongchang',
    name: '평창',
    country: '대한민국',
  });
  assert.ok(pyeongchang);
  assert.equal(pyeongchang.hubId, 'pyeongchang');
  assert.ok(pyeongchang.spots.length >= 1 && pyeongchang.spots.length <= 6);
  assert.match(pyeongchang.viewAllHref, /hub=pyeongchang/);
  for (const row of pyeongchang.spots) {
    assert.match(row.href, /^\/place\/[a-z0-9-]+$/);
    assert.ok(row.name);
  }
  const seonjae = pyeongchang.spots.find((row) => row.id === 'odaesan-seonjae-trail');
  assert.ok(seonjae, 'odaesan-seonjae-trail in regional cards');
  assert.equal(seonjae.href, '/place/odaesan-seonjae-trail');
  assert.ok(scenicSpotHasDisplayPhoto({ imageUrl: 'https://example.com/a.jpg' }));
  assert.equal(
    sortScenicSpotRowsPreferPhotos([
      { spot: { order: 2, imageUrl: null }, spotHubId: 'x' },
      { spot: { order: 1, imageUrl: 'https://example.com/b.jpg' }, spotHubId: 'x' },
    ])[0].spot.order,
    1,
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

test('crosslink event titles follow locale option', () => {
  withCrosslinkFlag(true, () => {
    const ko = resolvePlaceCrossLinks({ slug: 'vienna', name: 'Vienna', country: 'Austria' }, { locale: 'ko' });
    const en = resolvePlaceCrossLinks({ slug: 'vienna', name: 'Vienna', country: 'Austria' }, { locale: 'en' });
    assert.ok(ko.events.length >= 1);
    assert.ok(en.events.length >= 1);
    assert.notEqual(ko.events[0].title, en.events[0].title);
  });
});

test('isPlaceCrosslinkWorldEventsRailEnabled follows flag', async () => {
  const { isPlaceCrosslinkWorldEventsRailEnabled } = await import(
    '../src/pages/Home/lib/placeCrosslinkRollout.js'
  );
  withCrosslinkFlag(false, () => {
    assert.equal(isPlaceCrosslinkWorldEventsRailEnabled(), false);
  });
  withCrosslinkFlag(true, () => {
    assert.equal(isPlaceCrosslinkWorldEventsRailEnabled(), true);
  });
});
