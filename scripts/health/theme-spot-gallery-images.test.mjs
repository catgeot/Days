import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('ThemeSpotDetailModal wires pruned gallery + onError', () => {
  const src = readFileSync(
    join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
    'utf8',
  );
  assert.match(src, /usePrunedImageGallery\(imageUrls,\s*spot\?\.id\)/);
  assert.match(src, /markGalleryImageBroken/);
  assert.match(src, /onError=\{\(\) => markGalleryImageBroken/);
});

test('usePrunedImageGallery resets dropped only on galleryKey change', async () => {
  const src = readFileSync(
    join(root, 'src/pages/KoreaTheme/themeSpotGalleryImages.js'),
    'utf8',
  );
  assert.doesNotMatch(src, /seedKey/);
  assert.match(src, /scopeKey/);
});

test('themeSpotGalleryImages exports usePrunedImageGallery', async () => {
  const mod = await import('../../src/pages/KoreaTheme/themeSpotGalleryImages.js');
  assert.equal(typeof mod.usePrunedImageGallery, 'function');
});
