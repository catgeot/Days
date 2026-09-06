#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  filterOutSinglePersonPortraits,
  isSinglePersonPortraitPhoto,
  pickPlaceStatsGalleryRow,
} from '../src/utils/galleryPortraitFilter.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 800,
    height: 1200,
    alt_description: 'portrait of a woman in a studio',
    tags: [{ title: 'portrait' }, { title: 'woman' }],
  }),
  true,
  'vertical studio portrait drops',
);

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 800,
    height: 1200,
    alt_description: 'smiling woman in white shirt',
  }),
  true,
  'vertical person-only photo drops',
);

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 1200,
    height: 1600,
    alt: 'selfie of a man',
  }),
  true,
  'selfie drops',
);

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 1600,
    height: 900,
    alt_description: 'tourists on a paris street near the eiffel tower',
    tags: [{ title: 'people' }, { title: 'street' }],
  }),
  false,
  'landscape street with people stays',
);

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 900,
    height: 1400,
    alt_description: 'waterfall in a mountain forest',
  }),
  false,
  'vertical scenery stays',
);

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 1600,
    height: 900,
    description: 'portrait of a city skyline at sunset',
  }),
  false,
  'scenic portrait-of-city phrase stays',
);

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 1600,
    height: 900,
    alt_description: 'beautiful woman walking on the beach',
  }),
  false,
  'landscape with a person in scenery stays',
);

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 3000,
    height: 4500,
    alt_description: 'a man wearing a black blazer',
    tags: [
      { title: 'zakynthos' },
      { title: 'island' },
      { title: 'travel' },
      { title: 'greece' },
      { title: 'man' },
    ],
  }),
  true,
  'vertical person photo is not saved by island/travel place tags',
);

assert.equal(
  isSinglePersonPortraitPhoto({
    width: 800,
    height: 1200,
    alt_description: 'close up of a man wearing glasses',
    tags: [{ title: 'zakynthos' }, { title: 'portrait' }],
  }),
  true,
  'headshot with place tags drops',
);

const mixed = filterOutSinglePersonPortraits([
  { id: 'keep-scene', width: 1600, height: 900, alt_description: 'bali beach sunset with people' },
  { id: 'drop-portrait', width: 800, height: 1200, alt_description: 'headshot of a model' },
  { id: 'keep-fall', width: 900, height: 1400, alt_description: 'temple waterfall' },
]);
assert.deepEqual(
  mixed.map((img) => img.id),
  ['keep-scene', 'keep-fall'],
  'filter keeps scenery and drops headshot',
);

const allPortraits = [
  { id: 'a', width: 800, height: 1200, alt: 'selfie' },
  { id: 'b', width: 700, height: 1100, alt_description: 'headshot of a woman' },
];
assert.equal(
  filterOutSinglePersonPortraits(allPortraits).length,
  0,
  'all-portrait lists become empty so the gallery can live-refetch',
);

const apiSrc = readFileSync(join(root, 'src/pages/Home/lib/apiClient.js'), 'utf8');
assert.match(apiSrc, /filterOutSinglePersonPortraits/, 'unsplash/pexels apply portrait filter');
assert.match(apiSrc, /orientation=landscape 금지/, 'do not restore orientation=landscape');
assert.doesNotMatch(
  apiSrc,
  /search\/photos\?[^`]*orientation=landscape/,
  'unsplash URL has no orientation=landscape',
);

const gallerySrc = readFileSync(join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'), 'utf8');
assert.match(gallerySrc, /CACHE_VERSION = 'v1\.21'/, 'cache version after latin gallery query');
assert.match(gallerySrc, /place_stats all portraits/, 'DB all-portrait miss falls through to live');
assert.match(gallerySrc, /pickPlaceStatsGalleryRow/, 'prefer latin scenery row over hangul portraits');
assert.match(gallerySrc, /filterOutSinglePersonPortraits\(rawImages\)/, 'cached galleries also drop portraits');

const hangulPortraits = {
  place_id: '자킨토스',
  image_url: 'https://images.pexels.com/photos/7956482/pexels-photo-7956482.jpeg',
  gallery_urls: [
    {
      id: 'pexels-7956482',
      alt_description: 'headshot of a handsome man with his hands in his pockets',
      links: { html: 'https://www.pexels.com/photo/handsome-man-7956482/' },
    },
  ],
};
const latinBeaches = {
  place_id: 'zakynthos',
  image_url: 'https://images.unsplash.com/photo-1612279427382-f8349a383af8',
  gallery_urls: [
    {
      id: 'd-0aXM8cm6o',
      alt_description: 'aerial view of boats on sea during daytime',
      description: 'Zakynthos Shipwreck beach in Greece',
    },
  ],
};
assert.equal(
  pickPlaceStatsGalleryRow([hangulPortraits, latinBeaches], '자킨토스')?.place_id,
  'zakynthos',
  'hangul portrait row loses to latin scenery even if preferred',
);
assert.equal(
  pickPlaceStatsGalleryRow([hangulPortraits], '자킨토스'),
  null,
  'all-portrait hangul row is skipped so live refetch can run',
);

const pexelsSrc = readFileSync(join(root, 'src/pages/Home/lib/apiClient.js'), 'utf8');
assert.match(pexelsSrc, /width: photo\.width/, 'pexels mapping keeps dimensions for the filter');
assert.match(pexelsSrc, /alt_description: photo\.alt/, 'pexels mapping keeps alt for the filter');

console.log('smoke:gallery-portrait-filter PASS');
