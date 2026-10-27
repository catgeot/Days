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
  assert.match(src, /usePrunedImageGallery/);
  assert.match(src, /markGalleryImageBroken/);
  assert.match(src, /onError=\{\(\) => markGalleryImageBroken/);
});

test('themeSpotGalleryImages exports usePrunedImageGallery', async () => {
  const mod = await import('../../src/pages/KoreaTheme/themeSpotGalleryImages.js');
  assert.equal(typeof mod.usePrunedImageGallery, 'function');
});
