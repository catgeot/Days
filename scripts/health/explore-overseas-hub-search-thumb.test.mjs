import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { enrichSearchCandidateScenicMedia } from '../../src/pages/Home/lib/koreaLocalScenicLists.js';
import { attractionToSuggestion, resolveCityAttractionHub } from '../../src/pages/Home/lib/cityAttractionHubs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('enrichSearchCandidateScenicMedia adds hub og thumb for overseas attractions without TourAPI id', () => {
  const hub = resolveCityAttractionHub('prague');
  assert.ok(hub?.attractions?.length);
  const base = attractionToSuggestion(hub, hub.attractions[0]);
  const enriched = enrichSearchCandidateScenicMedia(base);
  assert.match(String(enriched.imageUrl || ''), /^https:\/\//);
  assert.match(String(enriched.thumbUrl || ''), /^https:\/\//);
});

test('koreaLocalScenicLists wires placeSeoOg fallback for explore search', () => {
  const src = readFileSync(
    join(root, 'src/pages/Home/lib/koreaLocalScenicLists.js'),
    'utf8',
  );
  assert.match(src, /getPlaceOgImageUrl/);
  assert.match(src, /DEFAULT_OG_IMAGE/);
});