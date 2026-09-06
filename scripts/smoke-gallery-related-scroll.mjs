#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetPlaceMediaScrollInstant } from '../src/components/PlaceCard/common/placeScrollSurface.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const withScrollTo = {
  scrollTop: 1840,
  scrollLeft: 12,
  scrollTo(opts) {
    this.scrollTop = opts.top;
    this.scrollLeft = opts.left;
  },
};
assert.equal(resetPlaceMediaScrollInstant(withScrollTo), true, 'scrollTo path returns true');
assert.equal(withScrollTo.scrollTop, 0, 'scrollTo path clears offset');
assert.equal(withScrollTo.scrollLeft, 12, 'horizontal offset is left alone when already set');

const noScrollTo = { scrollTop: 640 };
assert.equal(resetPlaceMediaScrollInstant(noScrollTo), true, 'scrollTop-only path returns true');
assert.equal(noScrollTo.scrollTop, 0, 'scrollTop-only path clears offset');

assert.equal(resetPlaceMediaScrollInstant(null), false, 'missing element is a no-op');

const view = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceGalleryView.jsx'), 'utf8');
assert.match(view, /useLayoutEffect/, 'place switch resets gallery scroll before paint');
assert.match(view, /pendingPlaceScrollResetRef/, 'place switch keeps resetting until the new gallery paints');
assert.match(view, /resetPlaceMediaScrollInstant\(scrollContainerRef\.current\)/, 'nested gallery scroller is reset');
assert.match(view, /\[galleryPlaceKey\]/, 'reset is keyed to the place, not 더보기');

const chat = readFileSync(join(root, 'src/components/PlaceCard/panels/PlaceChatPanel.jsx'), 'utf8');
assert.match(
  chat,
  /dispatchPlaceScrollToTop\('GALLERY',\s*\{\s*behavior:\s*'auto'\s*\}\)/,
  'related chips jump to gallery top instantly, not smooth through the previous photos',
);
assert.match(chat, /tab:\s*'gallery'/, 'related chips stay on the gallery tab');
assert.match(chat, /\/gallery/, 'fallback navigate keeps /gallery');

const hook = readFileSync(join(root, 'src/components/PlaceCard/common/usePlaceMediaScrollToTop.js'), 'utf8');
assert.match(hook, /behavior === 'auto'/, 'header tap stays smooth; place switch can request auto');

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/gallery-related/, 'vercel.json has /qa/gallery-related');
assert.match(
  vercel,
  /days-git-cursor-gallery-scroll-76a6-catgeots-projects\.vercel\.app\/place\/paris\/gallery/,
  'qa/gallery-related points at this Preview',
);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /slug:\s*'gallery-related'/, 'qa share slug is gallery-related');
assert.match(qa, /branch:\s*'cursor\/gallery-scroll-76a6'/, 'qa share branch is gallery-scroll');

console.log('smoke:gallery-related-scroll PASS');
