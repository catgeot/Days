#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  relatedPlacePathSuffix,
  relatedPlaceTabForMediaMode,
} from '../src/components/PlaceCard/common/relatedPlaceTab.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(relatedPlaceTabForMediaMode('GALLERY'), 'gallery');
assert.equal(relatedPlaceTabForMediaMode('REVIEWS'), 'reviews');
assert.equal(relatedPlaceTabForMediaMode('PLANNER'), null);
assert.equal(relatedPlaceTabForMediaMode('WIKI'), null);
assert.equal(relatedPlaceTabForMediaMode('VIDEO'), null);
assert.equal(relatedPlacePathSuffix('GALLERY'), '/gallery');
assert.equal(relatedPlacePathSuffix('REVIEWS'), '/reviews');
assert.equal(relatedPlacePathSuffix('PLANNER'), '');

const chat = readFileSync(join(root, 'src/components/PlaceCard/panels/PlaceChatPanel.jsx'), 'utf8');
assert.match(chat, /relatedPlaceTabForMediaMode\(mediaMode\)/, 'related chips read the current place tab');
assert.match(chat, /relatedPlacePathSuffix\(mediaMode\)/, 'fallback navigate keeps the current tab path');
assert.match(
  chat,
  /dispatchPlaceScrollToTop\(mediaMode,\s*\{\s*behavior:\s*'auto'\s*\}\)/,
  'related chips jump to the current tab top instantly',
);
assert.match(
  chat,
  /relatedPlaces\.length > 0 && relatedPlaceTabForMediaMode\(mediaMode\)/,
  'mobile related chips stay available on reviews, not gallery-only',
);

const reviews = readFileSync(join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'), 'utf8');
assert.match(reviews, /useLayoutEffect/, 'place switch resets reviews scroll before paint');
assert.match(
  reviews,
  /resetPlaceMediaScrollInstant\(scrollContainerRef\.current\)/,
  'nested reviews scroller is reset',
);
assert.match(reviews, /\[placeSlug\]/, 'reset is keyed to the place');

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/reviews-related/, 'vercel.json has /qa/reviews-related');
assert.match(
  vercel,
  /days-git-cursor-reviews-related-b9fa-catgeots-projects\.vercel\.app\/place\/paris\/reviews/,
  'qa/reviews-related points at this Preview',
);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /slug:\s*'reviews-related'/, 'qa share slug is reviews-related');
assert.match(qa, /branch:\s*'cursor\/reviews-related-b9fa'/, 'qa share branch is reviews-related');

console.log('smoke:reviews-related-tab PASS');
