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
  assert.match(reviews, /isLogbookEditorialReviewDetailLayoutActive/);
  assert.match(reviews, /hubDetailLayout/);
});

test('hub cards — city/date + one summary line only', () => {
  const grid = readFileSync(
    join(healthRoot, 'src/pages/DailyReport/components/LogbookOfficialReviewCardGrid.jsx'),
    'utf8',
  );
  assert.match(grid, /line-clamp-1/);
  assert.doesNotMatch(grid, /logbook-official-review-hub-card-summary/);
  assert.match(grid, /pickEditorialReviewHubThumb/);
});

test('shared thumb picks wikimedia 960', () => {
  const thumb = pickEditorialReviewHubThumb({
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/5/5b/Colosseum_of_Rome%2C_Italy.jpg',
    ],
  });
  assert.match(thumb?.src || '', /960px-Colosseum/);
});