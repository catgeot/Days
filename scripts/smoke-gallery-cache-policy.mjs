#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GALLERY_SWR_TTL_MS,
  gallerySwrStampKey,
  isGallerySwrDue,
  mergeGalleryFreshKeepHero,
  shouldRunGalleryStockSwr,
  filterHiddenGalleryIncoming,
} from '../src/utils/galleryCachePolicy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hookSrc = readFileSync(join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'), 'utf8');
const thumbSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscovery/SpotThumbnailCard.jsx'),
  'utf8',
);
const tripSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscovery/TripLinkSectionCard.jsx'),
  'utf8',
);

assert.equal(GALLERY_SWR_TTL_MS, 1000 * 60 * 60 * 24 * 7, 'SWR TTL 7 days');
assert.equal(
  gallerySwrStampKey('v1.20', 'paris'),
  'days_gallery_swr_v1.20_paris',
  'stamp key includes cache version',
);

assert.equal(isGallerySwrDue(0), true, 'never stamped → due');
assert.equal(isGallerySwrDue(Date.now() - 1000), false, 'fresh stamp → not due');
assert.equal(isGallerySwrDue(Date.now() - GALLERY_SWR_TTL_MS - 1), true, 'older than TTL → due');

assert.equal(
  shouldRunGalleryStockSwr({
    thumbnailOnly: true,
    lastSwrAt: 0,
    isTourDominant: false,
    imageCount: 12,
  }),
  false,
  'thumbnail cards never SWR',
);
assert.equal(
  shouldRunGalleryStockSwr({
    thumbnailOnly: false,
    lastSwrAt: 0,
    isTourDominant: true,
    imageCount: 12,
  }),
  false,
  'TourAPI-dominant skip SWR',
);
assert.equal(
  shouldRunGalleryStockSwr({
    thumbnailOnly: false,
    lastSwrAt: 0,
    isTourDominant: false,
    imageCount: 12,
  }),
  true,
  'gallery tab stock cache is due',
);

assert.deepEqual(
  filterHiddenGalleryIncoming([{ id: 'keep' }, { id: 'gone' }], ['gone']).map((img) => img.id),
  ['keep'],
  'SWR does not revive removed ids',
);

const hero = { id: 'hero-db', urls: { small: 'db-thumb' } };
const oldA = { id: 'old-a' };
const oldB = { id: 'old-b' };
const fresh = { id: 'fresh-1' };
const dup = { id: 'hero-db' };

const { merged, added } = mergeGalleryFreshKeepHero([hero, oldA, oldB], [dup, fresh], 4);
assert.equal(added, 1, 'duplicate hero id ignored');
assert.equal(merged[0].id, 'hero-db', 'hero stays index 0');
assert.equal(merged[1].id, 'fresh-1', 'new photos sit after hero');
assert.equal(merged[2].id, 'old-a');

const capped = mergeGalleryFreshKeepHero(
  [hero, oldA, oldB],
  [{ id: 'n1' }, { id: 'n2' }],
  3,
);
assert.equal(capped.merged.length, 3, 'cap drops tail not hero');
assert.equal(capped.merged[0].id, 'hero-db');
assert.equal(capped.merged[1].id, 'n1');
assert.equal(capped.merged.at(-1).id !== 'old-b', true, 'oldest non-hero can drop');

assert.match(hookSrc, /CACHE_VERSION = 'v1\.20'/, 'cache version after SWR');
assert.match(hookSrc, /shouldRunGalleryStockSwr/, 'hook uses SWR gate');
assert.match(hookSrc, /mergeGalleryFreshKeepHero/, 'hook merges keep-hero');
assert.match(hookSrc, /gallery_urls: galleryUrls/, 'SWR upsert gallery_urls only');
assert.match(hookSrc, /filterHiddenGalleryIncoming/, 'SWR respects removed photo ids');
assert.match(hookSrc, /addHiddenGalleryId/, 'remove records hidden ids');
assert.doesNotMatch(
  hookSrc,
  /persistGalleryKeepThumb[\s\S]{0,200}image_url/,
  'SWR persist omits image_url',
);

assert.match(thumbSrc, /thumbnailOnly:\s*true/, 'search spot cards reuse DB thumb');
assert.match(tripSrc, /thumbnailOnly:\s*true/, 'trip-link cards reuse DB thumb');

console.log('smoke:gallery-cache-policy PASS');
