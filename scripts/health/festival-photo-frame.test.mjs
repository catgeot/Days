import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { FestivalPhotoFrame } from '../../src/pages/Korea/festivalPhotoFrame.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sheet = readFileSync(join(rootDir, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://localhost/',
});
const { window } = dom;

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

setGlobal('window', window);
setGlobal('document', window.document);
setGlobal('navigator', window.navigator);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));

let root;
let container;

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
    container = null;
  }
});

function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  return act(async () => {
    root.render(React.createElement(FestivalPhotoFrame, props));
  });
}

test('broken festival photo hides the image and shows the empty slot', async () => {
  await mount({
    src: 'https://example.test/broken.jpg',
    alt: '',
    className: 'h-14 w-14',
    fallback: React.createElement('div', { 'data-festival-photo-fallback': '' }),
  });

  const img = container.querySelector('img[data-festival-photo]');
  assert.ok(img, 'photo renders before an error');
  assert.equal(img.getAttribute('src'), 'https://example.test/broken.jpg');
  assert.equal(container.querySelector('[data-festival-photo-fallback]'), null);

  await act(async () => {
    img.dispatchEvent(new window.Event('error'));
  });

  assert.equal(container.querySelector('img'), null);
  assert.ok(container.querySelector('[data-festival-photo-fallback]'));
});

test('festival detail photo surfaces use the frame that hides a broken image', () => {
  const uses = sheet.split('FestivalPhotoFrame').length - 1;
  assert.ok(uses >= 7, `expected filmstrip, photo tab, lightbox, and nearby frames (got ${uses})`);
  assert.match(sheet, /data-festival-photo-fallback/);
  assert.match(readFileSync(join(rootDir, 'src/pages/Korea/festivalPhotoFrame.js'), 'utf8'), /setFailed\(true\)/);

  const rawImgs = [...sheet.matchAll(/<img\b[\s\S]*?\/>/g)];
  assert.ok(rawImgs.length > 0);
  for (const match of rawImgs) {
    assert.match(match[0], /onError=/, `img without onError:\n${match[0].slice(0, 180)}`);
    assert.match(match[0], /display = 'none'/);
  }
});
