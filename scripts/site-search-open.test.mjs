import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES } from '../src/shared/gateoFeatureFlags.js';
import {
  applySiteSearchOpenPin,
  isSiteSearchOpenEnabled,
  siteSearchCatalogPlaceParam,
  siteSearchExploreEnterCommit,
} from '../src/pages/Home/lib/siteSearchOpen.js';
import { visitedRowToSearchSpot } from '../src/pages/Home/lib/visitedPlaceSearch.js';

function withSiteSearchFlag(enabled, fn) {
  const key = GATEO_ENV_FLAG_NAMES.SITE_SEARCH;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = enabled ? '1' : '';
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__[key] = prev;
  }
}

const heungjeongRow = {
  place_id: 'pyeongchang',
  name_ko: '흥정계곡',
  name_en: 'Pyeongchang',
  lat: 37.62466863,
  lng: 128.34930501,
};

test('flag off — sitewide open helpers stay legacy', () => {
  withSiteSearchFlag(false, () => {
    assert.equal(isSiteSearchOpenEnabled(), false);
    const spot = visitedRowToSearchSpot(heungjeongRow);
    assert.equal(siteSearchExploreEnterCommit(spot).mode, 'legacy');
    assert.equal(applySiteSearchOpenPin(spot), spot);
    assert.equal(siteSearchCatalogPlaceParam(spot), '흥정계곡');
  });
});

test('flag on — Explore Enter uses home open, not /place/pyeongchang', () => {
  withSiteSearchFlag(true, () => {
    const spot = visitedRowToSearchSpot(heungjeongRow);
    const commit = siteSearchExploreEnterCommit(spot);
    assert.equal(commit.mode, 'home');
    assert.equal(commit.pin.slug, '흥정계곡');
    assert.equal(siteSearchCatalogPlaceParam(spot), '');
    const normalized = applySiteSearchOpenPin(spot);
    assert.equal(normalized.slug, '흥정계곡');
    assert.equal(normalized.parentCity, '평창');
  });
});

test('flag on — 평창 hub still opens catalog place', () => {
  withSiteSearchFlag(true, () => {
    const spot = {
      slug: 'pyeongchang',
      name: '평창',
      name_ko: '평창',
      name_en: 'Pyeongchang',
      lat: 37.37,
      lng: 128.39,
      country: '대한민국',
    };
    const commit = siteSearchExploreEnterCommit(spot);
    assert.equal(commit.mode, 'place');
    assert.equal(commit.param, 'pyeongchang');
  });
});
