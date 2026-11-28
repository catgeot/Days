import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { computeGalleryFactsAndStoriesVisibility } from '../../src/components/PlaceCard/common/PlaceGalleryFactsAndStories.jsx';
import {
  isVisitStoriesFetchEnabled,
  reviewPlaceSlug,
} from '../../src/components/PlaceCard/hooks/useVisitStories.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('useVisitStories fetch is gated on slug, not verified facts card', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/useVisitStories.js'),
    'utf8',
  );
  assert.match(src, /isVisitStoriesFetchEnabled/);
  assert.doesNotMatch(src, /enabled = Boolean\(card\)/);
  assert.equal(isVisitStoriesFetchEnabled({ slug: 'jeju', name: '제주' }), true);
  assert.equal(isVisitStoriesFetchEnabled({ name: '제주' }), false);
  assert.equal(isVisitStoriesFetchEnabled(null), false);
  assert.equal(reviewPlaceSlug({ slug: 'jeju' }), 'jeju');
});

test('no verified facts + visit stories => gallery block renders stories only', () => {
  const visibility = computeGalleryFactsAndStoriesVisibility({
    hasFacts: false,
    stories: [{ id: 'r1', kind: 'review', title: '제주 리뷰', date: '2025-01-01' }],
    isLoading: false,
    hasVerifiedFactsCard: false,
  });
  assert.equal(visibility.hasStories, true);
  assert.equal(visibility.showStoriesBlock, true);
  assert.equal(visibility.shouldRender, true);
});

test('no verified facts + zero stories => gallery block hidden', () => {
  const visibility = computeGalleryFactsAndStoriesVisibility({
    hasFacts: false,
    stories: [],
    isLoading: false,
    hasVerifiedFactsCard: false,
  });
  assert.equal(visibility.hasStories, false);
  assert.equal(visibility.showStoriesBlock, false);
  assert.equal(visibility.shouldRender, false);
});

test('verified facts + visit stories => unchanged combined visibility', () => {
  const visibility = computeGalleryFactsAndStoriesVisibility({
    hasFacts: true,
    stories: [{ id: 'r1', kind: 'review', title: '카오락', date: '2025-01-01' }],
    isLoading: false,
    hasVerifiedFactsCard: true,
  });
  assert.equal(visibility.hasStories, true);
  assert.equal(visibility.showStoriesBlock, true);
  assert.equal(visibility.shouldRender, true);
});

test('PlaceGalleryFactsAndStories does not require verified card for hasStories', () => {
  const bundle = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceGalleryFactsAndStories.jsx'),
    'utf8',
  );
  assert.match(bundle, /if \(!shouldRender\) return null/);
  assert.doesNotMatch(bundle, /hasStories = Boolean\(card &&/);
});

test('PlaceVisitStories renders without verified facts card', () => {
  const storiesUi = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'),
    'utf8',
  );
  const block = storiesUi.split('export function PlaceVisitStories')[1]?.split('export function')[0] ?? '';
  assert.doesNotMatch(block, /if \(!card\) return null/);
});