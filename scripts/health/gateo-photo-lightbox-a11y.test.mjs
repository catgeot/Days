import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  consumeGateoPhotoLightboxEscapeHandled,
  isTopGateoPhotoLightboxLayer,
  markGateoPhotoLightboxEscapeHandled,
  registerGateoPhotoLightboxLayer,
  unregisterGateoPhotoLightboxLayer,
} from '../../src/shared/gateoPhotoLightboxLayer.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const LIGHTBOX_FILES = [
  'src/components/PlaceCard/views/PlaceGalleryView.jsx',
  'src/components/PlaceCard/views/PlaceWikiDetailsView.jsx',
  'src/components/PlaceCard/tabs/ReviewsTab.jsx',
  'src/shared/Auth/ProfilePhotoLightbox.jsx',
  'src/pages/WorldEvents/EventHeroGalleryModal.jsx',
  'src/pages/Korea/FestivalDetailSheet.jsx',
  'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx',
];

test('all site photo lightboxes wire useGateoPhotoLightboxA11y', () => {
  for (const rel of LIGHTBOX_FILES) {
    const src = readFileSync(join(root, rel), 'utf8');
    assert.match(src, /useGateoPhotoLightboxA11y\(/, `${rel} uses shared a11y hook`);
    assert.match(src, /data-gateo-photo-lightbox/, `${rel} marks lightbox root`);
  }
});

test('overlay parents consume lightbox escape flag', () => {
  const festival = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  const theme = readFileSync(join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'), 'utf8');
  assert.match(festival, /consumeGateoPhotoLightboxEscapeHandled/);
  assert.match(theme, /consumeGateoPhotoLightboxEscapeHandled/);
});

test('layer stack respects registration order', () => {
  registerGateoPhotoLightboxLayer('a');
  registerGateoPhotoLightboxLayer('b');
  assert.equal(isTopGateoPhotoLightboxLayer('b'), true);
  assert.equal(isTopGateoPhotoLightboxLayer('a'), false);
  unregisterGateoPhotoLightboxLayer('b');
  assert.equal(isTopGateoPhotoLightboxLayer('a'), true);
  unregisterGateoPhotoLightboxLayer('a');
  assert.equal(isTopGateoPhotoLightboxLayer('a'), false);
});

test('escape handled flag is one-shot', () => {
  markGateoPhotoLightboxEscapeHandled();
  assert.equal(consumeGateoPhotoLightboxEscapeHandled(), true);
  assert.equal(consumeGateoPhotoLightboxEscapeHandled(), false);
});

test('gateoPhotoLightboxLayer exports modal guard helpers', () => {
  const layerSrc = readFileSync(join(root, 'src/shared/gateoPhotoLightboxLayer.js'), 'utf8');
  assert.match(layerSrc, /gateoModalBlocksLightboxEscape/);
  assert.match(layerSrc, /consumeGateoPhotoLightboxEscapeHandled/);
});
