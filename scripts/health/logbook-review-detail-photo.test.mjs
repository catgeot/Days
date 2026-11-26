import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { isLogbookEditorialReviewDetailLayoutActive } from '../../src/utils/logbookReviewFilterFlag.js';
import { pickEditorialReviewHubThumb } from '../../src/logbookOfficialReviews/editorialReviewHubThumb.js';

const healthRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('detail layout flag combines hub + filter', () => {
  const src = readFileSync(join(healthRoot, 'src/utils/logbookReviewFilterFlag.js'), 'utf8');
  assert.match(src, /isLogbookEditorialReviewDetailLayoutActive/);
  assert.match(src, /isLogbookOfficialReviewHubActive/);
  assert.match(src, /isGateoLogbookReviewFilterEnabled/);
  assert.equal(typeof isLogbookEditorialReviewDetailLayoutActive, 'function');
});

test('ReviewsTab wires editorial detail hero behind flag', () => {
  const reviews = readFileSync(
    join(healthRoot, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'),
    'utf8',
  );
  assert.match(reviews, /LogbookEditorialReviewDetailHero/);
  assert.match(reviews, /isGateoOfficialEditorialPlaceReview/);
  assert.match(reviews, /isLogbookEditorialReviewDetailLayoutActive/);
  const layout = readFileSync(
    join(healthRoot, 'src/logbookOfficialReviews/logbookEditorialReviewDetailLayout.js'),
    'utf8',
  );
  assert.match(layout, /markLogbookEditorialReviewDetailLayoutFromHub/);
});

test('hub cards — city/date + 2-line bold title, no faint excerpt', () => {
  const grid = readFileSync(
    join(healthRoot, 'src/pages/DailyReport/components/LogbookOfficialReviewCardGrid.jsx'),
    'utf8',
  );
  assert.match(grid, /line-clamp-2/);
  assert.doesNotMatch(grid, /line-clamp-1/);
  assert.doesNotMatch(grid, /logbook-official-review-hub-card-summary/);
  assert.match(grid, /pickEditorialReviewHubThumb/);
  const hero = readFileSync(
    join(healthRoot, 'src/logbookOfficialReviews/LogbookEditorialReviewDetailHero.jsx'),
    'utf8',
  );
  assert.doesNotMatch(hero, /editorialReviewDetailSummary/);
  assert.doesNotMatch(hero, /line-clamp-3/);
  assert.match(hero, /LogbookOfficialReviewPersonaPhotoBadge/);
  assert.match(hero, /logbook-editorial-review-detail-hero-reviewer/);
  assert.doesNotMatch(hero, /bottom-2 left-2/);
});

test('shared thumb picks wikimedia 960', () => {
  const thumb = pickEditorialReviewHubThumb({
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/5/5b/Colosseum_of_Rome%2C_Italy.jpg',
    ],
  });
  assert.match(thumb?.src || '', /960px-Colosseum/);
});