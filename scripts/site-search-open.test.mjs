import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES } from '../src/shared/gateoFeatureFlags.js';
import {
  applySiteSearchOpenPin,
  isSiteSearchOpenEnabled,
  resolveSiteSearchEnterSinglePoi,
  siteSearchCatalogPlaceParam,
  siteSearchExploreEnterCommit,
  siteSearchFallbackLinkHref,
} from '../src/pages/Home/lib/siteSearchOpen.js';
import { buildLocalSearchSuggestions } from '../src/pages/Home/lib/searchSuggestions.js';
import { getPlaceUrlParam } from '../src/pages/Home/lib/formatUrlName.js';
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

test('flag on — Explore Enter picks one POI when duplicate exact Korean names', () => {
  withSiteSearchFlag(true, () => {
    const primary = visitedRowToSearchSpot({
      place_id: '흥정계곡',
      name_ko: '흥정계곡',
      name_en: 'Heungjeong Valley',
      lat: 37.62466863,
      lng: 128.34930501,
    });
    const duplicate = visitedRowToSearchSpot({
      place_id: '흥정계곡-alt',
      name_ko: '흥정계곡',
      name_en: '',
      lat: 37.625,
      lng: 128.35,
    });
    const local = [
      primary,
      duplicate,
      {
        name: '흥정계곡오토캠핑장',
        name_en: 'Heungjeong Auto Camping',
        lat: 37.62,
        lng: 128.35,
        country: '대한민국',
      },
    ];
    const direct = resolveSiteSearchEnterSinglePoi('흥정계곡', local);
    assert.ok(direct);
    assert.equal(direct.name, '흥정계곡');
    assert.equal(direct.id, 'visited-흥정계곡');
  });
});

test('flag on — Explore Enter single POI skips disambiguation (흥정계곡)', () => {
  withSiteSearchFlag(true, () => {
    const spot = visitedRowToSearchSpot(heungjeongRow);
    const local = [
      spot,
      {
        name: '흥정계곡오토캠핑장',
        name_en: 'Heungjeong Auto Camping',
        lat: 37.62,
        lng: 128.35,
        country: '대한민국',
      },
    ];
    const direct = resolveSiteSearchEnterSinglePoi('흥정계곡', local);
    assert.ok(direct);
    assert.equal(direct.name, '흥정계곡');
    const commit = siteSearchExploreEnterCommit(direct);
    assert.equal(commit.mode, 'home');
    assert.equal(commit.pin.slug, '흥정계곡');
  });
});

test('flag on — county hub query keeps disambiguation path (평창)', () => {
  withSiteSearchFlag(true, () => {
    const local = buildLocalSearchSuggestions('평창');
    assert.equal(resolveSiteSearchEnterSinglePoi('평창', local), null);
  });
});

test('flag on — AI limit fallback uses POI slug, not county pyeongchang', () => {
  withSiteSearchFlag(true, () => {
    const spot = visitedRowToSearchSpot(heungjeongRow);
    const href = siteSearchFallbackLinkHref(spot, '흥정계곡');
    assert.equal(href, '/place/흥정계곡');
    assert.notEqual(href, '/place/pyeongchang');
  });
});

test('flag off — AI limit href matches legacy catalog param priority', () => {
  withSiteSearchFlag(false, () => {
    const spot = visitedRowToSearchSpot(heungjeongRow);
    const legacyParam = siteSearchCatalogPlaceParam(spot) || getPlaceUrlParam(spot);
    const legacyHref = legacyParam
      ? `/place/${legacyParam}`
      : `/explore?q=${encodeURIComponent('흥정계곡')}`;
    assert.equal(siteSearchFallbackLinkHref(spot, '흥정계곡'), legacyHref);
  });
});

test('flag on — AI limit fallback uses catalog slug for 평창', () => {
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
    assert.equal(siteSearchFallbackLinkHref(spot, '평창'), '/place/pyeongchang');
  });
});
