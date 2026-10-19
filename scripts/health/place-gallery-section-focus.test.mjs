import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  PLACE_GALLERY_SECTION,
  consumePlaceGallerySectionAfterReview,
  parsePlaceGallerySectionFromHash,
  parsePlaceGallerySectionFromSearch,
  queuePlaceGallerySectionAfterReview,
  peekPlaceGallerySectionAfterReview,
  resolvePlaceGallerySectionAutoOpen,
} from '../../src/utils/placeGallerySectionFocus.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('parse hash and ?section= targets', () => {
  assert.equal(parsePlaceGallerySectionFromHash('#facts'), PLACE_GALLERY_SECTION.FACTS);
  assert.equal(parsePlaceGallerySectionFromHash('#stories'), PLACE_GALLERY_SECTION.STORIES);
  assert.equal(parsePlaceGallerySectionFromHash('#wiki'), null);
  assert.equal(parsePlaceGallerySectionFromSearch('?section=stories&lang=ko'), PLACE_GALLERY_SECTION.STORIES);
  assert.equal(parsePlaceGallerySectionFromSearch('?section=planner'), null);
});

test('review flash is in-memory and consumed once', () => {
  queuePlaceGallerySectionAfterReview('cairo', PLACE_GALLERY_SECTION.STORIES);
  assert.equal(
    resolvePlaceGallerySectionAutoOpen('cairo', { hash: '', search: '' }),
    PLACE_GALLERY_SECTION.STORIES,
  );
  assert.equal(peekPlaceGallerySectionAfterReview('cairo'), PLACE_GALLERY_SECTION.STORIES);
  assert.equal(consumePlaceGallerySectionAfterReview('cairo'), PLACE_GALLERY_SECTION.STORIES);
  assert.equal(peekPlaceGallerySectionAfterReview('cairo'), null);
  assert.equal(
    resolvePlaceGallerySectionAutoOpen('cairo', { hash: '', search: '' }),
    null,
  );
});

test('gallery sections default collapsed with anchors and toggle chip', () => {
  const factsUi = readFileSync(join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'), 'utf8');
  assert.match(factsUi, /usePlaceGallerySectionOpen\(PLACE_GALLERY_SECTION\.FACTS/);
  assert.match(factsUi, /usePlaceGallerySectionOpen\(PLACE_GALLERY_SECTION\.STORIES/);
  assert.match(factsUi, /routeLocation\.pathname/);
  assert.match(factsUi, /id=\{PLACE_GALLERY_SECTION\.FACTS\}/);
  assert.match(factsUi, /id=\{PLACE_GALLERY_SECTION\.STORIES\}/);
  assert.equal(factsUi.includes('useState(true)'), false);
  assert.match(factsUi, /rounded-full px-2\.5 py-1 text-sm/);
  assert.match(factsUi, /size=\{16\}/);
  assert.equal(factsUi.includes('queuePlaceGallerySectionAfterReview'), false);
});

test('reviews tab queues stories expand after new review', () => {
  const reviewsTab = readFileSync(join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'), 'utf8');
  assert.match(reviewsTab, /queuePlaceGallerySectionAfterReview\(placeSlug, PLACE_GALLERY_SECTION\.STORIES\)/);
  assert.match(reviewsTab, /place-visit-stories-refresh/);
  const visitStoriesHook = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/useVisitStories.js'),
    'utf8',
  );
  assert.match(visitStoriesHook, /place-visit-stories-refresh/);
});
