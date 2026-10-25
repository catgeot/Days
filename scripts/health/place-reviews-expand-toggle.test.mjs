import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  hasReviewBodyTextSelection,
  isReviewBodyInteractiveClickTarget,
  shouldToggleReviewBodyFromClick,
} from '../../src/utils/placeReviewExpandInteraction.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = dom;
for (const key of ['window', 'document', 'Element', 'Node']) {
  Object.defineProperty(globalThis, key, { value: window[key], configurable: true });
}

test('shouldToggleReviewBodyFromClick ignores modifier and non-primary buttons', () => {
  const body = document.createElement('div');
  const text = document.createElement('p');
  text.textContent = 'hello';
  body.appendChild(text);
  assert.equal(
    shouldToggleReviewBodyFromClick({ target: text, button: 0, defaultPrevented: false }),
    true,
  );
  assert.equal(
    shouldToggleReviewBodyFromClick({ target: text, button: 1, defaultPrevented: false }),
    false,
  );
  assert.equal(
    shouldToggleReviewBodyFromClick({
      target: text,
      button: 0,
      defaultPrevented: false,
      metaKey: true,
    }),
    false,
  );
});

test('isReviewBodyInteractiveClickTarget matches links, buttons, and images', () => {
  const wrap = document.createElement('div');
  wrap.innerHTML = '<a href="#">link</a><button type="button">btn</button><img alt="" />';
  const [link, button, img] = wrap.children;
  assert.equal(isReviewBodyInteractiveClickTarget(link), true);
  assert.equal(isReviewBodyInteractiveClickTarget(button), true);
  assert.equal(isReviewBodyInteractiveClickTarget(img), true);
  const plain = document.createElement('span');
  plain.textContent = 'text';
  assert.equal(isReviewBodyInteractiveClickTarget(plain), false);
});

test('hasReviewBodyTextSelection respects collapsed selection', () => {
  const node = document.createElement('p');
  node.textContent = 'select me';
  document.body.appendChild(node);
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = document.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  assert.equal(hasReviewBodyTextSelection(), true);
  selection.removeAllRanges();
  assert.equal(hasReviewBodyTextSelection(), false);
});

test('ReviewsTab wires body tap, aria-expanded, and accessible expand control', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'),
    'utf8',
  );
  assert.match(src, /data-review-body/);
  assert.match(src, /shouldToggleReviewBodyFromClick/);
  assert.match(src, /aria-expanded=\{isExpanded\}/);
  assert.match(src, /data-review-expand-toggle/);
  assert.match(src, /min-h-11/);
  assert.match(src, /▾/);
  assert.match(src, /▴/);
});
