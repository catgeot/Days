import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';
import {
  isGateoScenicPlaceLinksEnabled,
  listRegionalScenicPlaceCardsIfEnabled,
  resolveScenicGalleryUrlsIfEnabled,
  showThemeSpotPlaceCardLink,
} from '../../src/pages/Home/lib/placeScenicPlaceLinksRollout.js';

function withScenicPlaceLinksFlag(enabled, fn) {
  const key = GATEO_ENV_FLAG_NAMES.SCENIC_PLACE_LINKS;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = enabled ? '1' : '';
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__[key] = prev;
  }
}

test('VITE_GATEO_SCENIC_PLACE_LINKS defaults off', () => {
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
