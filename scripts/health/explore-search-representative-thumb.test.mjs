import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveExploreSearchRepresentativeThumbUrl,
  resolveExploreSearchCardThumbUrl,
  isGenericPlaceOgImageUrl,
} from '../../src/pages/Home/lib/placeSeoOg.js';
import { PLACE_SEO_OG_IMAGE_OVERRIDES } from '../../src/data/placeSeoOgImageOverrides.js';

test('representative thumb rejects per-slug OG when it is generic pool', () => {
  assert.equal(
    resolveExploreSearchRepresentativeThumbUrl({
      kind: 'spot',
      source: 'ssot',
      slug: 'seattle',
      name: '시애틀',
    }),
    null,
  );
});

test('representative thumb does not invent a URL for slug without override or spot thumb', () => {
  assert.equal(
    resolveExploreSearchRepresentativeThumbUrl({ kind: 'city', source: 'hub', slug: 'sanya', hubId: 'sanya' }),
    null,
  );
});

test('explore card guard still treats prague seo pool as non-card thumb', () => {
  assert.equal(resolveExploreSearchRepresentativeThumbUrl({ slug: 'prague', name: '프라하' }), null);
  assert.equal(isGenericPlaceOgImageUrl(PLACE_SEO_OG_IMAGE_OVERRIDES.prague), true);
});