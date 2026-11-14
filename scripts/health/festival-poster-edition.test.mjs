import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  detectPosterEditionYear,
  festivalEditionYearFromStart,
  isPriorEditionPoster,
} from '../../src/pages/Korea/lib/festivalPosterEdition.js';

test('poster edition year from caption / filename', () => {
  assert.equal(
    detectPosterEditionYear({ caption: '2025 서울빛초롱축제 포스터' }),
    2025,
  );
  assert.equal(
    detectPosterEditionYear({ url: 'https://cdn.example/festival_2024_poster.jpg' }),
    2024,
  );
  assert.equal(detectPosterEditionYear({ url: 'https://cdn.example/no-year.jpg' }), null);
});

test('prior edition label gate', () => {
  assert.equal(festivalEditionYearFromStart('20261211'), 2026);
  assert.equal(isPriorEditionPoster(2025, 2026), true);
  assert.equal(isPriorEditionPoster(2026, 2026), false);
  assert.equal(isPriorEditionPoster(null, 2026), false);
});