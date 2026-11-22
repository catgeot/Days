import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { enrichSearchCandidateScenicMedia } from '../../src/pages/Home/lib/koreaLocalScenicLists.js';
import { attractionToSuggestion, resolveCityAttractionHub } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  DEFAULT_OG_IMAGE,
  getPlaceOgImageUrl,
  isGenericPlaceOgImageUrl,
  resolveExploreSearchCardThumbUrl,
} from '../../src/pages/Home/lib/placeSeoOg.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DUBAI_POOL_PHOTO =
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&h=630&q=80';
const VERIFIED_CITY_THUMB =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prague_old_town_square_panorama.jpg/960px-Prague_old_town_square_panorama.jpg';

test('isGenericPlaceOgImageUrl marks default og and unsplash pool', () => {
  assert.equal(isGenericPlaceOgImageUrl(DEFAULT_OG_IMAGE), true);
  assert.equal(isGenericPlaceOgImageUrl(DUBAI_POOL_PHOTO), true);
  assert.equal(isGenericPlaceOgImageUrl(VERIFIED_CITY_THUMB), false);
});

test('resolveExploreSearchCardThumbUrl returns null for pool-only seo fallbacks', () => {
  assert.equal(resolveExploreSearchCardThumbUrl({ slug: 'prague', name: '프라하' }), null);
  assert.equal(
    resolveExploreSearchCardThumbUrl({ thumbnail: DUBAI_POOL_PHOTO }),
    null,
  );
  assert.equal(
    resolveExploreSearchCardThumbUrl({ thumbnail: VERIFIED_CITY_THUMB }),
    VERIFIED_CITY_THUMB,
  );
});

test('getPlaceOgImageUrl still resolves seo pool for crawlers (unchanged)', () => {
  const pragueOg = getPlaceOgImageUrl({ slug: 'prague', name: '프라하' });
  assert.equal(pragueOg, DUBAI_POOL_PHOTO);
});

test('enrichSearchCandidateScenicMedia skips og pool for prague hub attractions', () => {
  const hub = resolveCityAttractionHub('prague');
  assert.ok(hub?.attractions?.length);
  for (const attraction of hub.attractions) {
    const base = attractionToSuggestion(hub, attraction);
    const enriched = enrichSearchCandidateScenicMedia(base);
    const thumb = String(enriched.imageUrl || enriched.thumbUrl || '').trim();
    assert.ok(!thumb || !isGenericPlaceOgImageUrl(thumb), `${attraction.name} must not use generic og`);
    assert.notEqual(thumb, DUBAI_POOL_PHOTO, `${attraction.name} must not show dubai pool photo`);
  }
});

for (const hubId of ['paris', 'rome', 'bangkok']) {
  test(`enrichSearchCandidateScenicMedia avoids generic og for ${hubId} attractions`, () => {
    const hub = resolveCityAttractionHub(hubId);
    assert.ok(hub?.attractions?.length, `${hubId} hub`);
    const base = attractionToSuggestion(hub, hub.attractions[0]);
    const enriched = enrichSearchCandidateScenicMedia(base);
    const thumb = String(enriched.imageUrl || enriched.thumbUrl || '').trim();
    assert.ok(!thumb || !isGenericPlaceOgImageUrl(thumb));
  });
}

test('enrichSearchCandidateScenicMedia keeps verified city thumb when present', () => {
  const hub = resolveCityAttractionHub('prague');
  const base = attractionToSuggestion(hub, hub.attractions[0]);
  const enriched = enrichSearchCandidateScenicMedia({
    ...base,
    imageUrl: VERIFIED_CITY_THUMB,
    thumbUrl: VERIFIED_CITY_THUMB,
  });
  assert.equal(enriched.imageUrl, VERIFIED_CITY_THUMB);
  assert.equal(enriched.thumbUrl, VERIFIED_CITY_THUMB);
});

test('koreaLocalScenicLists wires explore card thumb helper (not place seo og)', () => {
  const src = readFileSync(
    join(root, 'src/pages/Home/lib/koreaLocalScenicLists.js'),
    'utf8',
  );
  assert.match(src, /resolveExploreSearchCardThumbUrl/);
  assert.doesNotMatch(src, /getPlaceOgImageUrl/);
});