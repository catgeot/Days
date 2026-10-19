import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  placeReviewVisitStoryDisplayTitle,
  placeReviewVisibleInVisitStories,
} from '../../src/utils/placeReviewEditorial.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('useVisitStories does not select place_reviews.title', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/useVisitStories.js'),
    'utf8',
  );
  assert.match(src, /\.from\('place_reviews'\)/);
  assert.match(src, /select\('id, content, content_blocks, persona_label, is_public, is_editorial, created_at'\)/);
  const reviewsBlock = src.split(".from('place_reviews')")[1]?.split('.eq(')[0] ?? '';
  assert.doesNotMatch(reviewsBlock, /\btitle\b/);
});

test('placeReviewVisitStoryDisplayTitle trims on word boundary with ellipsis', () => {
  const long = 'A'.repeat(50);
  const spaced = `${'word '.repeat(12)}tail`;
  assert.equal(placeReviewVisitStoryDisplayTitle({ content: 'Short headline' }), 'Short headline');
  assert.match(placeReviewVisitStoryDisplayTitle({ content: long }), /…$/);
  const titled = placeReviewVisitStoryDisplayTitle({ content: spaced });
  assert.ok(titled.length <= 42);
  assert.match(titled, /…$/);
});

test('placeReviewVisibleInVisitStories requires is_public and preview text', () => {
  assert.equal(
    placeReviewVisibleInVisitStories({ is_public: false, content: 'hello' }),
    false,
  );
  assert.equal(
    placeReviewVisibleInVisitStories({ is_public: true, content: '   ' }),
    false,
  );
  assert.equal(
    placeReviewVisibleInVisitStories({ is_public: true, content: '공식 리뷰 본문' }),
    true,
  );
});
