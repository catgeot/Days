import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { resolveEditorialReviewPhotoNoteText } from '../../src/utils/editorialReviewPhotoNote.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('editorial caption is shown; stock auto alt alone is not', () => {
  const withCaption = {
    source: 'Unsplash',
    caption: '같은 종류의 음식 사진(리뷰 속 식당 촬영 아님)',
    alt_description: 'A fish on a leaf',
  };
  assert.match(
    resolveEditorialReviewPhotoNoteText(withCaption),
    /같은 종류의 음식 사진/,
  );

  const stockOnly = {
    source: 'pexels',
    alt_description: 'Ocean waves on sand',
    user: { name: 'Alex' },
  };
  assert.equal(resolveEditorialReviewPhotoNoteText(stockOnly), '');
});

test('review renderers wire photo note helper', () => {
  const hero = readFileSync(
    join(root, 'src/logbookOfficialReviews/LogbookEditorialReviewDetailHero.jsx'),
    'utf8',
  );
  const reviews = readFileSync(join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'), 'utf8');
  const logbook = readFileSync(
    join(root, 'src/pages/DailyReport/components/EditorialLogbookImageCredits.jsx'),
    'utf8',
  );
  assert.match(hero, /EditorialReviewPhotoNote[\s\S]*variant="hero"/);
  assert.match(reviews, /EditorialReviewPhotoNote/);
  assert.match(reviews, /gateo-review-lightbox-credit/);
  assert.match(reviews, /resolveEditorialReviewPhotoNoteText/);
  assert.match(logbook, /EditorialReviewPhotoNote/);
  const noteComponent = readFileSync(
    join(root, 'src/components/PlaceCard/common/EditorialReviewPhotoNote.jsx'),
    'utf8',
  );
  assert.match(noteComponent, /logbook-editorial-review-detail-hero-note/);
  assert.match(noteComponent, /gateo-review-lightbox-note/);
  assert.match(noteComponent, /editorial-review-image-note/);
});