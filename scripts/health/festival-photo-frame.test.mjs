import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { FestivalPhotoFrame } from '../../src/pages/Korea/festivalPhotoFrame.js';
import { FestivalHeroPhoto } from '../../src/pages/Korea/festivalHeroPhoto.js';
import {
  FestivalHeroThumbStrip,
  festivalHeroStripMode,
} from '../../src/pages/Korea/festivalHeroThumbs.js';

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

test('cached zero-width festival photo swaps to fallback at mount', async () => {
  await mount({
    src: 'https://example.test/zero.jpg',
    alt: '',
    className: 'h-14 w-14',
    fallback: React.createElement('div', { 'data-festival-photo-fallback': '' }),
  });

  const img = container.querySelector('img[data-festival-photo]');
  assert.ok(img);
  Object.defineProperty(img, 'complete', { value: true, configurable: true });
  Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
  await act(async () => {
    img.dispatchEvent(new window.Event('load'));
  });

  assert.equal(container.querySelector('img'), null);
  assert.ok(container.querySelector('[data-festival-photo-fallback]'));
});

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
  assert.ok(uses >= 6, `expected photo tab, lightbox, and nearby frames (got ${uses})`);
  assert.match(sheet, /FestivalHeroPhoto/);
  assert.match(sheet, /h-\[min\(40vh,18rem\)\]/);
  assert.doesNotMatch(sheet, /minHeight: 'min\(40vh, 18rem\)'/);
  assert.doesNotMatch(sheet, /setHeroBox/);
  assert.match(sheet, /data-festival-photo-fallback/);
  assert.match(sheet, /data-festival-hero-fallback/);
  assert.match(sheet, /heroPhotoDecoded/);
  assert.match(sheet, /activePhotoCredit && heroPhotoDecoded/);
  assert.match(
    readFileSync(join(rootDir, 'src/pages/Korea/festivalPhotoFrame.js'), 'utf8'),
    /naturalWidth/,
  );
  const nearbyFn = sheet.slice(
    sheet.indexOf('function NearbyRowThumb'),
    sheet.indexOf('function nearbySightTitle'),
  );
  assert.match(nearbyFn, /setThumbIndex/);
  assert.match(nearbyFn, /FestivalPhotoFrame/);
  assert.match(nearbyFn, /referrerPolicy="no-referrer"/);

  const rawImgs = [...sheet.matchAll(/<img\b[\s\S]*?\/>/g)];
  assert.equal(rawImgs.length, 0, 'festival detail sheet uses FestivalPhotoFrame, not raw img');
  assert.doesNotMatch(sheet, /heroImageBroken/);
});

test('late hero error removes the image and keeps the fixed hero box', async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(FestivalHeroPhoto, {
      src: 'https://example.test/late-hero.jpg',
      fallback: React.createElement('div', { 'data-festival-hero-fallback': '' }),
    }));
  });

  const box = container.querySelector('[data-festival-hero]');
  assert.ok(box);
  assert.match(box.className, /h-\[min\(40vh,18rem\)\]/);
  const img = container.querySelector('img[data-festival-photo]');
  assert.ok(img, 'hero image stays mounted until the late error');
  assert.equal(container.querySelector('[data-festival-hero-fallback]'), null);

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(container.querySelector('img[data-festival-photo]'), img);

  Object.defineProperty(img, 'complete', { value: true, configurable: true });
  Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
  await act(async () => {
    img.dispatchEvent(new window.Event('error'));
  });

  assert.equal(container.querySelector('img'), null);
  assert.ok(container.querySelector('[data-festival-hero-fallback]'));
  assert.match(box.className, /h-\[min\(40vh,18rem\)\]/);
});

function mountStrip(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  return act(async () => {
    root.render(React.createElement(FestivalHeroThumbStrip, props));
  });
}

function stripMode() {
  return container.querySelector('[data-festival-photo-strip]')?.getAttribute('data-festival-photo-strip');
}

async function settleProbe(ok) {
  const img = container.querySelector('[data-festival-photo-probes] img');
  assert.ok(img, 'expected a pending photo probe');
  Object.defineProperty(img, 'complete', { value: true, configurable: true });
  Object.defineProperty(img, 'naturalWidth', { value: ok ? 160 : 0, configurable: true });
  await act(async () => {
    img.dispatchEvent(new window.Event(ok ? 'load' : 'error'));
  });
}

test('list card 40x40 thumb removes a broken image and shows the placeholder', async () => {
  const indexSrc = readFileSync(join(rootDir, 'src/pages/Korea/index.jsx'), 'utf8');
  const row = indexSrc.slice(
    indexSrc.indexOf('function FestivalRow('),
    indexSrc.indexOf('export default function KoreaFestivalHub'),
  );
  assert.equal([...row.matchAll(/<img\b/g)].length, 0);
  assert.match(row, /FestivalPhotoFrame/);
  assert.match(row, /FestivalThumbFallback/);

  const { FestivalListThumbBox } = await import('../../src/pages/Korea/festivalListThumbBox.jsx');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(FestivalListThumbBox, {
      item: {
        contentId: '4114954',
        firstimage: 'https://tong.visitkorea.or.kr/cms/resource/54/4114954_image2_1.jpg',
      },
    }));
  });

  const box = container.querySelector('div');
  assert.match(box.className, /h-10/);
  assert.match(box.className, /w-10/);
  const img = container.querySelector('img[data-festival-photo]');
  assert.ok(img, '40x40 thumb renders before an error');
  assert.equal(container.querySelector('[data-thumb-fallback]'), null);

  await act(async () => {
    img.dispatchEvent(new window.Event('error'));
  });

  assert.equal(container.querySelector('img'), null);
  assert.ok(container.querySelector('[data-thumb-fallback]'));
  assert.match(box.className, /h-10/);
  assert.match(box.className, /w-10/);
});

test('hero strip mode follows successful loads, not URL count', () => {
  assert.equal(festivalHeroStripMode(0, false, 11), 'collapsed');
  assert.equal(festivalHeroStripMode(1, false, 11), 'collapsed');
  assert.equal(festivalHeroStripMode(2, false, 11), 'open');
  assert.equal(festivalHeroStripMode(0, true, 1), 'reserve');
  assert.equal(festivalHeroStripMode(1, false, 1), 'collapsed');
});

test('one success among eleven photo urls removes failed tiles and collapses the strip', async () => {
  const urls = Array.from({ length: 11 }, (_, i) => `https://example.test/masan-${i}.jpg`);
  await mountStrip({ urls, detailLoading: false, photosAria: 'photos' });

  assert.equal(stripMode(), 'collapsed');
  assert.equal(container.querySelectorAll('[data-festival-photo-probes] img').length, 11);
  assert.equal(container.querySelectorAll('[role="option"]').length, 0);

  await settleProbe(true);
  for (let i = 0; i < 10; i += 1) await settleProbe(false);

  assert.equal(stripMode(), 'collapsed');
  assert.equal(container.querySelectorAll('[role="option"]').length, 0);
  assert.equal(container.querySelectorAll('[data-festival-photo-fallback]').length, 0);
  assert.equal(container.querySelectorAll('[data-festival-photo-probes] img').length, 0);
});

test('zero successful loads among eleven urls collapse the strip', async () => {
  const urls = Array.from({ length: 11 }, (_, i) => `https://example.test/fail-${i}.jpg`);
  await mountStrip({ urls, detailLoading: false });

  for (let i = 0; i < 11; i += 1) await settleProbe(false);

  assert.equal(stripMode(), 'collapsed');
  assert.equal(container.querySelectorAll('[role="option"]').length, 0);
  assert.equal(container.querySelectorAll('[data-festival-photo-fallback]').length, 0);
});

test('two successful loads open the strip and a later failure collapses it', async () => {
  const urls = [
    'https://example.test/gangneung-a.jpg',
    'https://example.test/gangneung-b.jpg',
    'https://example.test/gangneung-c.jpg',
  ];
  await mountStrip({ urls, detailLoading: false, photosAria: 'photos' });

  await settleProbe(true);
  await settleProbe(true);
  await settleProbe(false);

  assert.equal(stripMode(), 'open');
  assert.equal(container.querySelectorAll('[role="option"]').length, 2);
  assert.equal(container.querySelectorAll('[data-festival-photo-fallback]').length, 0);

  const visible = container.querySelector('[role="option"] img');
  assert.ok(visible);
  Object.defineProperty(visible, 'complete', { value: true, configurable: true });
  Object.defineProperty(visible, 'naturalWidth', { value: 0, configurable: true });
  await act(async () => {
    visible.dispatchEvent(new window.Event('error'));
  });

  assert.equal(stripMode(), 'collapsed');
  assert.equal(container.querySelectorAll('[role="option"]').length, 0);
});
