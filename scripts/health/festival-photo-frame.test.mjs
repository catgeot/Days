import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FESTIVAL_PHOTO_LOAD_TIMEOUT_MS,
  FestivalPhotoFrame,
  festivalPhotoWrapClassName,
  isFestivalPhotoDecoded,
} from '../../src/pages/Korea/festivalPhotoFrame.js';
import { FestivalHeroPhoto } from '../../src/pages/Korea/festivalHeroPhoto.js';
import {
  FestivalHeroThumbStrip,
  festivalHeroStripMode,
  canOpenFestivalLightbox,
  festivalLightboxSlides,
  stepFestivalLightbox,
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

test('festivalPhotoWrapClassName avoids w-full on fixed-size flex thumbnails', () => {
  assert.match(
    festivalPhotoWrapClassName('h-14 w-14 shrink-0 rounded-xl object-cover'),
    /shrink-0/,
  );
  assert.doesNotMatch(
    festivalPhotoWrapClassName('h-14 w-14 shrink-0 rounded-xl object-cover'),
    /\bw-full\b/,
  );
  assert.match(
    festivalPhotoWrapClassName('absolute inset-0 h-full w-full object-cover'),
    /\bh-full w-full\b/,
  );
  assert.match(
    festivalPhotoWrapClassName('h-full w-full object-cover'),
    /\bh-full w-full\b/,
  );
});

test('isFestivalPhotoDecoded treats cached complete images as loaded', () => {
  const img = { complete: true, naturalWidth: 120 };
  assert.equal(isFestivalPhotoDecoded(img), true);
  assert.equal(isFestivalPhotoDecoded({ complete: true, naturalWidth: 0 }), false);
  assert.equal(isFestivalPhotoDecoded({ complete: false, naturalWidth: 0 }), false);
});

test('cached complete image is treated as loaded on layout sync', async () => {
  let loaded = false;
  const props = {
    src: 'https://example.test/cached.jpg',
    alt: '',
    onLoaded: () => {
      loaded = true;
    },
    fallback: React.createElement('div', { 'data-festival-photo-fallback': '' }),
  };
  await mount(props);

  const img = container.querySelector('img[data-festival-photo]');
  assert.ok(img);
  Object.defineProperty(img, 'complete', { value: true, configurable: true });
  Object.defineProperty(img, 'naturalWidth', { value: 200, configurable: true });
  await act(async () => {
    img.dispatchEvent(new window.Event('load'));
  });
  assert.equal(loaded, true);
  assert.ok(container.querySelector('img[data-festival-photo]'));
});

test('load then load-timeout does not swap to fallback', async () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const timers = [];
  globalThis.setTimeout = (fn, ms) => {
    const id = originalSetTimeout(fn, ms);
    timers.push({ id, ms, fn });
    return id;
  };
  globalThis.clearTimeout = originalClearTimeout;

  try {
    await mount({
      src: 'https://example.test/slow.jpg',
      alt: '',
      fallback: React.createElement('div', { 'data-festival-photo-fallback': '' }),
    });

    const img = container.querySelector('img[data-festival-photo]');
    assert.ok(img);
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 180, configurable: true });
    await act(async () => {
      img.dispatchEvent(new window.Event('load'));
    });
    assert.ok(container.querySelector('img[data-festival-photo]'));

    const timeoutTimer = timers.find((t) => t.ms === FESTIVAL_PHOTO_LOAD_TIMEOUT_MS);
    assert.ok(timeoutTimer, 'expected festival photo load timeout to be scheduled');
    await act(async () => {
      timeoutTimer.fn();
    });

    assert.ok(
      container.querySelector('img[data-festival-photo]'),
      'loaded photo must stay after timeout callback',
    );
    assert.equal(container.querySelector('[data-festival-photo-fallback]'), null);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});

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

  const imgAfter = container.querySelector('img[data-festival-photo]');
  assert.ok(imgAfter);
  assert.equal(imgAfter.style.display, 'none');
  assert.ok(container.querySelector('[data-festival-photo-fallback]'));
});

test('late load after timeout restores the photo', async () => {
  const originalSetTimeout = globalThis.setTimeout;
  const timers = [];
  globalThis.setTimeout = (fn, ms) => {
    const id = originalSetTimeout(fn, ms);
    timers.push({ ms, fn });
    return id;
  };

  try {
    await mount({
      src: 'https://example.test/late-after-timeout.jpg',
      alt: '',
      className: 'h-14 w-14',
      fallback: React.createElement('div', { 'data-festival-photo-fallback': '' }),
    });

    const timeoutTimer = timers.find((t) => t.ms === FESTIVAL_PHOTO_LOAD_TIMEOUT_MS);
    assert.ok(timeoutTimer);
    await act(async () => {
      timeoutTimer.fn();
    });

    assert.ok(container.querySelector('[data-festival-photo-fallback-slot]'));
    const img = container.querySelector('img[data-festival-photo]');
    assert.ok(img);
    assert.match(img.className, /opacity-0/);

    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 220, configurable: true });
    await act(async () => {
      img.dispatchEvent(new window.Event('load'));
    });

    assert.equal(container.querySelector('[data-festival-photo-fallback-slot]'), null);
    assert.doesNotMatch(img.className, /opacity-0/);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
});

test('pending shimmer covers the thumb until decode, then the timeout fallback replaces it', async () => {
  const originalSetTimeout = globalThis.setTimeout;
  const timers = [];
  globalThis.setTimeout = (fn, ms) => {
    const id = originalSetTimeout(fn, ms);
    timers.push({ ms, fn });
    return id;
  };
  try {
    await mount({
      src: 'https://example.test/slow-thumb.jpg',
      alt: '',
      className: 'h-full w-full object-cover',
      pendingShimmer: true,
      fallback: React.createElement('div', { 'data-festival-photo-fallback': '' }),
    });
    const pending = container.querySelector('[data-festival-photo-pending]');
    assert.ok(pending, 'shimmer shows before the image decodes');
    assert.match(pending.innerHTML, /blur-md/);
    const img = container.querySelector('img[data-festival-photo]');
    assert.match(img.className, /opacity-0/);
    assert.equal(container.querySelector('[data-festival-photo-fallback]'), null);

    const timeoutTimer = timers.find((t) => t.ms === FESTIVAL_PHOTO_LOAD_TIMEOUT_MS);
    assert.ok(timeoutTimer);
    await act(async () => {
      timeoutTimer.fn();
    });
    assert.equal(container.querySelector('[data-festival-photo-pending]'), null);
    assert.ok(container.querySelector('[data-festival-photo-fallback]'));

    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 80, configurable: true });
    await act(async () => {
      img.dispatchEvent(new window.Event('load'));
    });
    assert.equal(container.querySelector('[data-festival-photo-pending]'), null);
    assert.equal(container.querySelector('[data-festival-photo-fallback]'), null);
    assert.doesNotMatch(img.className, /opacity-0/);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
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

  const brokenImg = container.querySelector('img[data-festival-photo]');
  assert.ok(brokenImg);
  assert.equal(brokenImg.style.display, 'none');
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

  const brokenHeroImg = container.querySelector('img[data-festival-photo]');
  assert.ok(brokenHeroImg);
  assert.equal(brokenHeroImg.style.display, 'none');
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

  const brokenThumb = container.querySelector('img[data-festival-photo]');
  assert.ok(brokenThumb);
  assert.equal(brokenThumb.style.display, 'none');
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

test('lightbox slides follow loaded filmstrip urls and keep the open photo when one loads later', () => {
  const urls = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => `https://example.test/${id}.jpg`);
  const loaded = [urls[0], urls[5]];
  let slides = festivalLightboxSlides(urls, loaded, 5);
  assert.deepEqual(slides.urls, loaded);
  assert.equal(slides.index, 1);
  assert.equal(slides.rawIndex, 5);
  assert.equal(`${slides.index + 1} / ${slides.urls.length}`, '2 / 2');

  slides = festivalLightboxSlides(urls, [urls[0], urls[2], urls[5]], 5);
  assert.equal(slides.rawIndex, 5);
  assert.equal(slides.index, 2);
  assert.equal(slides.urls[slides.index], urls[5]);
  assert.equal(`${slides.index + 1} / ${slides.urls.length}`, '3 / 3');

  const stepped = stepFestivalLightbox(urls, [urls[0], urls[2], urls[5]], 5, 1);
  assert.equal(stepped.index, 0);
  assert.equal(stepped.rawIndex, 0);

  const skipped = stepFestivalLightbox(urls, [urls[0], urls[2], urls[5]], 0, 1);
  assert.equal(skipped.rawIndex, 2);
  assert.equal(skipped.urls[skipped.index], urls[2]);

  const removed = festivalLightboxSlides(urls, [urls[0], urls[5]], 2, [urls[2]]);
  assert.equal(removed.urls[removed.index], urls[0]);
  assert.equal(removed.rawIndex, 0);

  const removedFirst = festivalLightboxSlides(urls, [urls[2], urls[5]], 5, [urls[0]]);
  assert.equal(removedFirst.rawIndex, 5);
  assert.equal(removedFirst.index, 1);
  assert.equal(`${removedFirst.index + 1} / ${removedFirst.urls.length}`, '2 / 2');

  const pendingOnly = festivalLightboxSlides(urls, [], 3);
  assert.deepEqual(pendingOnly.urls, [urls[3]]);
  assert.equal(pendingOnly.rawIndex, 3);

  assert.equal(canOpenFestivalLightbox(urls, [], 3), false);
  assert.equal(canOpenFestivalLightbox(urls, [], 3, urls[3]), true);
  assert.equal(canOpenFestivalLightbox(urls, [urls[0]], 3), false);
  assert.equal(canOpenFestivalLightbox(urls, [urls[0], urls[3]], 3), true);
  assert.equal(canOpenFestivalLightbox(urls, [], 0, ''), false);
});

test('filmstrip photo N opens the lightbox on that same loaded url', async () => {
  const urls = ['a', 'b', 'c'].map((id) => `https://example.test/strip-${id}.jpg`);
  const opened = [];
  const reports = [];
  await mountStrip({
    urls,
    onOpen: (index) => opened.push(index),
    onStripChange: (next) => reports.push({
      loadedUrls: [...next.loadedUrls],
      failedUrls: [...next.failedUrls],
    }),
  });
  await settleProbe(true);
  await settleProbe(false);
  await settleProbe(true);

  const options = [...container.querySelectorAll('[role="option"]')];
  assert.equal(options.length, 2);
  await act(async () => {
    options[1].dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  });
  assert.deepEqual(opened, [2]);

  const last = reports[reports.length - 1];
  assert.deepEqual(last.loadedUrls, [urls[0], urls[2]]);
  assert.deepEqual(last.failedUrls, [urls[1]]);
  const slides = festivalLightboxSlides(urls, last.loadedUrls, opened[0], last.failedUrls);
  assert.equal(slides.index, 1);
  assert.equal(slides.urls[slides.index], urls[2]);
  assert.equal(`${slides.index + 1} / ${slides.urls.length}`, '2 / 2');
});

test('festival lightbox counter uses loaded slides, not the raw url list', () => {
  const start = sheet.indexOf('data-festival-lightbox-index');
  assert.ok(start > 0);
  const block = sheet.slice(start, start + 500);
  assert.match(block, /lightboxSlides\.index/);
  assert.match(block, /lightboxSlides\.urls\.length/);
  assert.doesNotMatch(block, /imageUrls\.length/);
  assert.match(sheet, /stepFestivalLightbox/);
});
