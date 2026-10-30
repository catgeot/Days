import assert from 'node:assert/strict';
import test from 'node:test';

import koreaScenicSpots from '../../src/pages/Home/data/koreaScenicSpots.json' with { type: 'json' };
import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';
import {
  isGateoScenicPlaceLinksEnabled,
  listKoreaScenicSpotsWithUnresolvablePlaceRoute,
  listRegionalScenicPlaceCardsIfEnabled,
  resolveScenicGalleryUrlsIfEnabled,
  showThemeSpotPlaceCardLink,
} from '../../src/pages/Home/lib/placeScenicPlaceLinksRollout.js';

function withScenicPlaceLinksFlag(enabled, fn) {
  const key = GATEO_ENV_FLAG_NAMES.SCENIC_PLACE_LINKS;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = enabled ? '1' : '0';
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__[key] = prev;
  }
}

test("VITE_GATEO_SCENIC_PLACE_LINKS '0' disables", () => {
  withScenicPlaceLinksFlag(false, () => {
    assert.equal(isGateoScenicPlaceLinksEnabled(), false);
    assert.equal(showThemeSpotPlaceCardLink('odaesan-seonjae-trail'), false);
    assert.equal(
      listRegionalScenicPlaceCardsIfEnabled({
        slug: 'pyeongchang',
        name: '평창',
        country: '대한민국',
      }),
      null,
    );
    assert.deepEqual(
      resolveScenicGalleryUrlsIfEnabled({ slug: 'odaesan-seonjae-trail', country: '대한민국' }),
      [],
    );
  });
});

test('flag on exposes regional cards, gallery urls, and modal CTA', () => {
  withScenicPlaceLinksFlag(true, () => {
    assert.equal(isGateoScenicPlaceLinksEnabled(), true);
    assert.equal(showThemeSpotPlaceCardLink('odaesan-seonjae-trail'), true);
    const cards = listRegionalScenicPlaceCardsIfEnabled({
      slug: 'pyeongchang',
      name: '평창',
      country: '대한민국',
    });
    assert.ok(cards?.spots?.length >= 1 && cards.spots.length <= 6);
    const gallery = resolveScenicGalleryUrlsIfEnabled({
      slug: 'odaesan-seonjae-trail',
      country: '대한민국',
    });
    assert.ok(gallery.length >= 1);
  });
});

test('VITE_GATEO_SCENIC_PLACE_LINKS unset defaults on', () => {
  const key = GATEO_ENV_FLAG_NAMES.SCENIC_PLACE_LINKS;
  const prev = globalThis.__VITE_ENV__[key];
  delete globalThis.__VITE_ENV__[key];
  try {
    assert.equal(isGateoScenicPlaceLinksEnabled(), true);
  } finally {
    globalThis.__VITE_ENV__[key] = prev;
  }
});

test('871 GATEO scenic spots — place route resolvability audit', () => {
  const spots = koreaScenicSpots.spots || [];
  assert.equal(spots.length, 871, 'koreaScenicSpots SSOT count');
  const unresolved = listKoreaScenicSpotsWithUnresolvablePlaceRoute(spots);
  console.log(
    `[scenic-place-links] unresolvable /place slug count=${unresolved.length}`,
  );
  for (const row of unresolved) {
    console.log(`[scenic-place-links] unresolvable id=${row.id} placeSlug=${row.placeSlug}`);
  }
  assert.deepEqual(
    unresolved.map((r) => r.id),
    ['gunwi-whistle-forest'],
  );
});

test('modal place-card CTA hidden when /place slug does not resolve', () => {
  withScenicPlaceLinksFlag(true, () => {
    assert.equal(showThemeSpotPlaceCardLink('gunwi-whistle-forest'), false);
  });
});

test('modal place-card CTA shown for 경복궁 when flag on', () => {
  const gyeongbok = spotsById('gyeongbokgung');
  assert.ok(gyeongbok?.placeSlug, '경복궁 placeSlug in SSOT');
  withScenicPlaceLinksFlag(true, () => {
    assert.equal(showThemeSpotPlaceCardLink(gyeongbok.placeSlug), true);
  });
});

function spotsById(id) {
  return (koreaScenicSpots.spots || []).find((s) => s.id === id);
}
