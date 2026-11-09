import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { festivalReviewPlaceSlug } from '../../src/pages/Korea/lib/festivalReviewPlaceSlug.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('festivalReviewPlaceSlug matches tour-{contentId} SSOT', () => {
  assert.equal(festivalReviewPlaceSlug('638576'), 'tour-638576');
  assert.equal(festivalReviewPlaceSlug(''), '');
  assert.equal(festivalReviewPlaceSlug('abc'), '');
});

test('FestivalDetailSheet mounts reviews section on info tab', () => {
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(sheet, /FestivalDetailReviewsSection/);
  assert.match(sheet, /data-festival-section="nearAttractions"/);
  const reviewsIdx = sheet.indexOf('FestivalDetailReviewsSection');
  const nearIdx = sheet.indexOf('data-festival-section="nearAttractions"');
  assert.ok(reviewsIdx > 0 && nearIdx > reviewsIdx);
});

test('FestivalDetailReviewsSection hides when slug missing', () => {
  const src = readFileSync(join(root, 'src/pages/Korea/FestivalDetailReviewsSection.jsx'), 'utf8');
  assert.match(src, /data-festival-section="reviews"/);
  assert.match(src, /ReviewItem/);
  assert.match(src, /!isLoading && reviews\.length === 0\) return null/);
});
