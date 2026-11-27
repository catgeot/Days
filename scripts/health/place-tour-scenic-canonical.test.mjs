import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPlaceUrlParam,
  koreaTourContentPlaceParam,
  resolvePlaceUrlParamForPath,
} from '../../src/pages/Home/lib/formatUrlName.js';
import {
  getVisibleKoreaScenicSpotByContentId,
  resolveKoreaScenicCatalogPlacePinFromTourContentId,
  resolveUniqueKoreaScenicPlaceSlugForContentId,
} from '../../src/pages/Home/lib/placeScenicGateway.js';
import { resolvePlaceTargetFromSlug } from '../../src/pages/Home/lib/placeRouteHydrate.js';
import { placeCanonicalPath } from '../../src/shared/seo/placeCanonicalPath.js';

test('tour-126547 → gochang-dolmen-sites canonical', () => {
  assert.equal(resolveUniqueKoreaScenicPlaceSlugForContentId('126547'), 'gochang-dolmen-sites');
  const pin = resolveKoreaScenicCatalogPlacePinFromTourContentId('126547');
  assert.equal(pin?.slug, 'gochang-dolmen-sites');
  assert.equal(pin?.source, 'hub');
  assert.equal(getPlaceUrlParam(pin), 'gochang-dolmen-sites');
  assert.equal(placeCanonicalPath(getPlaceUrlParam(pin)), '/place/gochang-dolmen-sites');

  const fromSlug = resolvePlaceTargetFromSlug('tour-126547');
  assert.equal(fromSlug?.slug, 'gochang-dolmen-sites');
  assert.equal(getPlaceUrlParam(fromSlug), 'gochang-dolmen-sites');
  assert.equal(resolvePlaceUrlParamForPath(fromSlug, 'tour-126547'), 'gochang-dolmen-sites');
  assert.equal(
    placeCanonicalPath(resolvePlaceUrlParamForPath(fromSlug, 'tour-126547')),
    '/place/gochang-dolmen-sites',
  );
});

test('tour-* URL 세그먼트만 scenic placeSlug — tourapi 탐색 param은 tour 유지', () => {
  const tourapiPin = {
    contentId: '126547',
    source: 'tourapi',
    slug: koreaTourContentPlaceParam('126547'),
    canonical_slug: koreaTourContentPlaceParam('126547'),
    name: '고창 고인돌 유적',
    country_en: 'South Korea',
  };
  assert.equal(getPlaceUrlParam(tourapiPin), 'tour-126547');
  assert.equal(resolvePlaceUrlParamForPath(tourapiPin, 'tour-126547'), 'gochang-dolmen-sites');
});

test('ambiguous scenic contentId — no canonical overwrite', () => {
  assert.equal(getVisibleKoreaScenicSpotByContentId('125449'), null);
  assert.equal(resolveUniqueKoreaScenicPlaceSlugForContentId('125449'), null);
  const ambiguousPin = {
    contentId: '125449',
    source: 'tourapi',
    slug: 'tour-125449',
    name: '남한산성',
  };
  assert.equal(getPlaceUrlParam(ambiguousPin), 'tour-125449');
  assert.equal(resolvePlaceUrlParamForPath(ambiguousPin, 'tour-125449'), 'tour-125449');
});

test('hub attraction contentId — placeUrlSlug 유지 (scenic placeSlug로 덮지 않음)', () => {
  const scenic = getVisibleKoreaScenicSpotByContentId('128526');
  assert.equal(scenic?.placeSlug, 'donggung-palace-and-wolji-pond');
  assert.equal(
    getPlaceUrlParam({
      contentId: '128526',
      source: 'hub',
      slug: 'apji-duckweed',
      canonical_slug: 'apji-duckweed',
      name: '압지부평',
    }),
    'apji-duckweed',
  );
});

test('tour contentId without GATEO placeSlug — tour-* 유지', () => {
  assert.equal(resolveUniqueKoreaScenicPlaceSlugForContentId('127982'), null);
  assert.equal(
    getPlaceUrlParam({ contentId: '127982', source: 'tourapi', name: '고산사' }),
    'tour-127982',
  );
});