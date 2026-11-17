import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { splitPlaceOverview } from '../../src/components/PlaceCard/common/placeOverviewText.js';
import { getGalleryImageAttribution } from '../../src/components/PlaceCard/common/galleryImageAttribution.js';
import { buildGalleryPhotoCredit } from '../../src/components/PlaceCard/common/buildGalleryPhotoCredit.js';
import {
  curatedPlaceGallery,
  listCuratedPlaceGallerySlugs,
} from '../../src/data/curatedPlaceGalleries.js';
import {
  hubAttractionOverview,
  listHubAttractionOverviewSlugs,
} from '../../src/data/hubAttractionOverviews.js';
import { attractionToPlacePin, listCityAttractionHubs } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  isSyntheticOrEmptyPlaceDesc,
  shouldUsePlaceGalleryReadonlyOverview,
} from '../../src/pages/Home/lib/placeDescText.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLACEHOLDER_RE = /업데이트 중|being updated/i;
const HANGUL_RE = /[\u3131-\u318e\uac00-\ud7a3]/;

const SLUGS = [
  'nang-thong-beach',
  'bang-sak-beach',
  'bang-niang-market',
  'ton-chong-fa-waterfall',
  'ban-nam-khem-tsunami-memorial-park',
  'takua-pa-old-town',
];

function khaoLakHub() {
  return listCityAttractionHubs().find((hub) => hub.hubId === 'khao-lak');
}

function pinForSlug(slug) {
  const hub = khaoLakHub();
  const attraction = hub.attractions.find(
    (item) => attractionToPlacePin(hub, item).slug === slug,
  );
  assert.ok(attraction, slug);
  return attractionToPlacePin(hub, attraction);
}

test('khao lak hub JSON still has no desc or overview fields', () => {
  const hub = khaoLakHub();
  assert.equal(hub.attractions.length, 6);
  for (const attraction of hub.attractions) {
    assert.equal(attraction.desc, undefined);
    assert.equal(attraction.overview, undefined);
  }
});

test('six khao lak overviews replace the placeholder in ko and en', () => {
  assert.deepEqual(listHubAttractionOverviewSlugs(), SLUGS);
  for (const slug of SLUGS) {
    const row = hubAttractionOverview(slug);
    assert.ok(row.desc.length > 40, slug);
    assert.ok(row.desc_en.length > 40, slug);
    assert.equal(PLACEHOLDER_RE.test(row.desc), false, slug);
    assert.equal(PLACEHOLDER_RE.test(row.desc_en), false, slug);
    assert.equal(HANGUL_RE.test(row.desc_en), false, slug);
    assert.ok(row.sources.length > 0, slug);
    for (const source of row.sources) {
      assert.match(source, /^https:\/\/(thai\.tourismthailand\.org|www\.phangngapao\.go\.th|portal\.dnp\.go\.th|news\.cision\.com)\//);
    }

    const pin = pinForSlug(slug);
    assert.equal(isSyntheticOrEmptyPlaceDesc(pin), false, slug);
    assert.equal(shouldUsePlaceGalleryReadonlyOverview(pin), false, slug);
    assert.equal(splitPlaceOverview(pin, 'ko').fixed, row.desc);
    assert.equal(splitPlaceOverview(pin, 'en').fixed, row.desc_en);
  }
});

test('six khao lak galleries stay inside the verified commons set', () => {
  assert.deepEqual(listCuratedPlaceGallerySlugs(), SLUGS);
  const withPhotos = {
    'nang-thong-beach': ['commons-khao-lak-light-beacon'],
    'bang-sak-beach': ['commons-sunset-bangsak-beach'],
    'ton-chong-fa-waterfall': ['commons-ton-chong-fa-tier-4', 'commons-ton-chong-fa-tier-3'],
  };
  const empty = ['bang-niang-market', 'ban-nam-khem-tsunami-memorial-park', 'takua-pa-old-town'];

  for (const slug of SLUGS) {
    const images = curatedPlaceGallery(slug);
    assert.ok(Array.isArray(images), slug);
    const ids = images.map((image) => image.id);
    assert.deepEqual(ids, withPhotos[slug] || []);
    for (const image of images) {
      assert.equal(image.source, 'wikimedia');
      assert.match(image.urls.regular, /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\//);
      assert.equal(image.urls.regular.includes('unsplash'), false);
      assert.match(image.license, /^CC BY-SA /);
      const credit = getGalleryImageAttribution(image);
      assert.equal(credit.providerName, 'Wikimedia Commons');
      assert.match(credit.title, /Wikimedia Commons/);
      assert.equal(credit.title.includes('Unsplash'), false);
      const grid = buildGalleryPhotoCredit(image, 'en');
      assert.equal(grid.provider, 'wikimedia');
    }
  }

  for (const slug of empty) {
    assert.deepEqual(curatedPlaceGallery(slug), []);
  }
});

test('gallery hook returns the locked set before stock or place_stats', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
    'utf8',
  );
  const lockAt = src.indexOf('curatedPlaceGallery(curatedSlug)');
  const statsAt = src.indexOf(".from('place_stats')");
  assert.ok(lockAt > 0);
  assert.ok(statsAt > lockAt);
  assert.match(src, /if \(curatedImages\) \{[\s\S]*?return;/);
});
