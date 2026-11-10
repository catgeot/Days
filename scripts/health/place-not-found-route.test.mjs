import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import ko from '../../src/i18n/locales/ko.json' with { type: 'json' };
import en from '../../src/i18n/locales/en.json' with { type: 'json' };
import {
  inferInitialPlaceRouteResolve,
  isAsyncPlaceSlugHydration,
} from '../../src/pages/Home/lib/placeRouteResolvePolicy.js';
import { finalizePlaceRouteHydrateAttempts } from '../../src/pages/Home/lib/placeRouteAsyncHydrate.js';
import { resolvePlaceTargetFromSlug } from '../../src/pages/Home/lib/placeRouteHydrate.js';

const root = join(import.meta.dirname, '../..');

const KNOWN_PLACE_SLUGS = [
  'busan',
  'sokcho-beach',
  'tour-127635',
  'busan/gallery',
  'moorea',
  'venice',
  'paris',
];

test('known catalog slugs resolve without missing status', () => {
  for (const slug of KNOWN_PLACE_SLUGS) {
    const base = slug.split('/')[0];
    const initial = inferInitialPlaceRouteResolve(base, {});
    assert.notEqual(initial.status, 'missing', slug);
    if (resolvePlaceTargetFromSlug(base)) {
      assert.equal(isAsyncPlaceSlugHydration(base, {}), false, slug);
    } else {
      assert.equal(isAsyncPlaceSlugHydration(base, {}), true, slug);
      assert.equal(initial.status, 'pending', slug);
    }
  }
});

test('hydrate attempts — fetch error chain → error, not missing', () => {
  assert.equal(finalizePlaceRouteHydrateAttempts(['error', 'error', 'error']), 'error');
  assert.notEqual(finalizePlaceRouteHydrateAttempts(['error', 'error', 'error']), 'missing');
});

test('hydrate attempts — normal empty response → missing', () => {
  assert.equal(finalizePlaceRouteHydrateAttempts(['empty']), 'missing');
  assert.equal(finalizePlaceRouteHydrateAttempts(['error', 'empty']), 'missing');
});

test('bogus slug is missing when not async', () => {
  const slug = 'not-a-real-slug';
  assert.equal(resolvePlaceTargetFromSlug(slug), null);
  assert.equal(isAsyncPlaceSlugHydration(slug, {}), false);
  assert.deepEqual(inferInitialPlaceRouteResolve(slug, {}), { slug, status: 'missing' });
});

test('tour slug without cache stays pending until async', () => {
  const slug = 'tour-127982';
  if (resolvePlaceTargetFromSlug(slug)) {
    assert.equal(inferInitialPlaceRouteResolve(slug, {}).status, 'found');
    return;
  }
  assert.equal(isAsyncPlaceSlugHydration(slug, {}), true);
  assert.deepEqual(inferInitialPlaceRouteResolve(slug, {}), { slug, status: 'pending' });
});

test('i18n — place not-found copy ko/en', () => {
  assert.equal(ko.place.notFound.title, '찾는 여행지가 없어요');
  assert.match(en.place.notFound.title, /couldn't find/i);
  assert.ok(ko.place.notFound.search);
  assert.ok(en.place.notFound.search);
});

test('PlaceCard — no silent home redirect for invalid slug', () => {
  const placeCard = readFileSync(join(root, 'src/components/PlaceCard/index.jsx'), 'utf8');
  const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  assert.ok(placeCard.includes('PlaceNotFoundView'));
  assert.ok(placeCard.includes('PlaceRouteErrorView'));
  assert.ok(placeCard.includes('placeRouteResolve'));
  assert.ok(!placeCard.includes("navigate('/', { replace: true })"));
  assert.ok(placeCard.includes('robotsNoIndex') || placeCard.includes('PlaceNotFoundView'));
  assert.match(home, /markPlaceRouteResolve\(normalizedTargetSlug, 'error'\)/);
  assert.doesNotMatch(home, /catch\s*\{[^}]*markPlaceRouteResolve\([^,]+, 'missing'\)/s);
});

test('PlaceNotFoundView sets noindex', () => {
  const view = readFileSync(join(root, 'src/components/PlaceCard/PlaceNotFoundView.jsx'), 'utf8');
  assert.ok(view.includes('robotsNoIndex'));
  assert.ok(view.includes('data-testid="place-not-found"'));
});

test('blog editorial route remains separate from place not-found', () => {
  const app = readFileSync(join(root, 'src/App.jsx'), 'utf8');
  assert.ok(app.includes('/blog/e/:editorialSlug'));
  assert.ok(app.includes('PublicViewer'));
  const placeCard = readFileSync(join(root, 'src/components/PlaceCard/index.jsx'), 'utf8');
  assert.ok(!placeCard.includes('/blog/e'));
});
