import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

import {
  gateoBodyScrollLockDepth,
  pushGateoBodyScrollLock,
  resetGateoBodyScrollLockForTests,
} from '../../src/shared/lib/gateoBodyScrollLock.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test.beforeEach(() => {
  resetGateoBodyScrollLockForTests();
});

test('nested locks restore original overflow when the last lock releases', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  globalThis.document = dom.window.document;

  document.body.style.overflow = '';
  document.body.style.overflowY = '';

  const releaseOuter = pushGateoBodyScrollLock();
  assert.equal(gateoBodyScrollLockDepth(), 1);
  assert.equal(document.body.style.overflow, 'hidden');

  const releaseInner = pushGateoBodyScrollLock();
  assert.equal(gateoBodyScrollLockDepth(), 2);

  releaseInner();
  assert.equal(document.body.style.overflow, 'hidden');

  releaseOuter();
  assert.equal(gateoBodyScrollLockDepth(), 0);
  assert.equal(document.body.style.overflow, '');
  assert.equal(document.body.style.overflowY, '');

  dom.window.close();
});

test('ThemeSpotDetailModal uses ref-counted body scroll lock, not per-effect overflow capture', () => {
  const theme = readFileSync(
    join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
    'utf8',
  );
  assert.match(theme, /useGateoBodyScrollLockEffect/);
  assert.doesNotMatch(
    theme,
    /const prev = document\.body\.style\.overflow[\s\S]*document\.body\.style\.overflow = prev/,
  );
});
