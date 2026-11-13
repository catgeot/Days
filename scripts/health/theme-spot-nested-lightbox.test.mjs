import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const themeModal = join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx');
const e2eSpec = join(root, 'e2e/theme-scenic-nested-lightbox.spec.js');
const pwConfig = join(root, 'playwright.config.theme-scenic-nested-lightbox.js');

test('ThemeSpotDetailModal portals lightbox above nested modals', () => {
  const src = readFileSync(themeModal, 'utf8');
  assert.match(src, /createPortal\(/, 'lightbox uses createPortal');
  assert.match(src, /data-theme-spot-lightbox/, 'lightbox test hook');
  assert.match(src, /document\.body/, 'portal target is body');
  assert.match(src, /inert=\{lightboxOpen/, 'sheet inert while lightbox open');
  assert.match(src, /z-\[80\]/, 'lightbox z-index above modal stack');
});

test('nested scenic lightbox Playwright smoke spec is wired', () => {
  assert.ok(existsSync(e2eSpec), e2eSpec);
  assert.ok(existsSync(pwConfig), pwConfig);
  const spec = readFileSync(e2eSpec, 'utf8');
  assert.match(spec, /data-theme-spot-lightbox/);
  assert.match(spec, /cha-1351100670000/);
  const cfg = readFileSync(pwConfig, 'utf8');
  assert.match(cfg, /theme-scenic-nested-lightbox\.spec\.js/);
});
