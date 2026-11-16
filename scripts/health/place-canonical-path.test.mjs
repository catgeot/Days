import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import SEO from '../../src/components/SEO/index.jsx';
import { ensureI18n } from '../../src/i18n/config.js';
import { LocaleProvider } from '../../src/i18n/LocaleProvider.jsx';
import { LOCALE_STORAGE_KEY } from '../../src/i18n/constants.js';
import { isPlaceRootAliasTab, placeCanonicalPath } from '../../src/shared/seo/placeCanonicalPath.js';
import { buildLocalePageUrl } from '../../src/i18n/seoUrls.js';
import { stripHeadSeoBeforeHelmet } from '../../src/shared/seo/stripHeadSeoBeforeHelmet.js';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const i18n = ensureI18n('ko');
let root;

test('place canonical follows the indexed tab, not the default gallery view', () => {
  assert.equal(placeCanonicalPath('bora-bora', undefined), '/place/bora-bora');
  assert.equal(placeCanonicalPath('bora-bora', ''), '/place/bora-bora');
  assert.equal(placeCanonicalPath('kyoto', 'gallery'), '/place/kyoto/gallery');
  assert.equal(placeCanonicalPath('paris', 'planner'), '/place/paris/planner');
  assert.equal(placeCanonicalPath('cairo', 'wiki'), '/place/cairo/wiki');
  assert.equal(placeCanonicalPath('sapa', 'reviews'), '/place/sapa/reviews');
  assert.equal(placeCanonicalPath('hwaseong-fortress', 'video'), '/place/hwaseong-fortress/video');
  assert.equal(placeCanonicalPath('khao-lak', 'events'), '/place/khao-lak/events');
  assert.equal(isPlaceRootAliasTab('reviews'), true);
  assert.equal(isPlaceRootAliasTab('video'), true);
  assert.equal(isPlaceRootAliasTab('events'), true);
  assert.equal(isPlaceRootAliasTab('gallery'), false);
  assert.equal(isPlaceRootAliasTab('planner'), false);
  assert.equal(isPlaceRootAliasTab('wiki'), false);
  assert.equal(
    buildLocalePageUrl(placeCanonicalPath('bora-bora', undefined), 'ko'),
    'https://www.gateo.kr/place/bora-bora',
  );
  assert.equal(
    buildLocalePageUrl(placeCanonicalPath('bora-bora', 'gallery'), 'en'),
    'https://www.gateo.kr/place/bora-bora/gallery?lang=en',
  );
  assert.equal(
    buildLocalePageUrl(placeCanonicalPath('cape-verde', 'video'), 'en'),
    'https://www.gateo.kr/place/cape-verde/video?lang=en',
  );
  assert.equal(
    buildLocalePageUrl(placeCanonicalPath('cape-verde', 'video'), 'ko'),
    'https://www.gateo.kr/place/cape-verde/video',
  );
});

test('PlaceCard publishes the URL tab, not the defaulted gallery tab', () => {
  const source = readFileSync(new URL('../../src/components/PlaceCard/index.jsx', import.meta.url), 'utf8');
  assert.match(source, /placeCanonicalPath\(slug,\s*tab\)/);
  assert.equal(source.includes('`/place/${slug}/${tabKey}`'), false);
});

function mount(pathname, locale) {
  const dom = new JSDOM(indexHtml, { url: `https://www.gateo.kr${pathname}` });
  dom.window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'HTMLElement', { value: dom.window.HTMLElement, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    value: (cb) => setTimeout(cb, 0),
    configurable: true,
    writable: true,
  });
  stripHeadSeoBeforeHelmet();
}

async function renderSeo(pathname, locale, props) {
  mount(pathname, locale);
  const container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [pathname] },
        React.createElement(
          HelmetProvider,
          null,
          React.createElement(
            LocaleProvider,
            null,
            React.createElement(I18nextProvider, { i18n }, React.createElement(SEO, props)),
          ),
        ),
      ),
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function headUrl(selector, attr) {
  const node = document.head.querySelector(selector);
  return attr === 'href' ? node?.href || '' : node?.getAttribute(attr) || '';
}

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
});

test('place root canonical stays on /place/:slug and router tabs keep their own URL', async () => {
  const samples = [
    ['/place/bora-bora', 'bora-bora'],
    ['/place/kyoto', 'kyoto'],
    ['/place/paris/reviews', 'paris'],
    ['/place/cairo/video', 'cairo'],
    ['/place/sapa/events', 'sapa'],
    ['/place/hwaseong-fortress', 'hwaseong-fortress'],
    ['/place/khao-lak', 'khao-lak'],
    ['/place/cape-verde/video', 'cape-verde'],
    ['/place/cape-verde/gallery', 'cape-verde'],
    ['/place/cape-verde/wiki', 'cape-verde'],
    ['/place/cape-verde/planner', 'cape-verde'],
  ];
  for (const [path, slug] of samples) {
    await renderSeo(path, 'ko', {
      title: slug,
      description: `${slug} place`,
      url: path,
      location: { slug, name: slug },
    });
    const expected = `https://www.gateo.kr${path}`;
    assert.equal(headUrl('link[rel="canonical"]', 'href'), expected, path);
    assert.equal(headUrl('meta[property="og:url"]', 'content'), expected, path);
    assert.equal(document.head.querySelectorAll('link[rel="canonical"]').length, 1, path);
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
});

test('indexed sub-tabs keep their own canonical and og:url', async () => {
  const rows = [
    ['/place/bora-bora/gallery', 'gallery'],
    ['/place/kyoto/planner', 'planner'],
    ['/place/paris/wiki', 'wiki'],
  ];
  for (const [path, tab] of rows) {
    await renderSeo(path, 'ko', {
      title: tab,
      description: tab,
      url: path,
      tab,
    });
    const expected = `https://www.gateo.kr${path}`;
    assert.equal(headUrl('link[rel="canonical"]', 'href'), expected, path);
    assert.equal(headUrl('meta[property="og:url"]', 'content'), expected, path);
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
});

test('english place canonical keeps the www lang query', async () => {
  await renderSeo('/place/bora-bora', 'en', {
    title: 'Bora Bora',
    description: 'Bora Bora',
    url: '/place/bora-bora',
  });
  assert.equal(headUrl('link[rel="canonical"]', 'href'), 'https://www.gateo.kr/place/bora-bora?lang=en');
  assert.equal(
    headUrl('meta[property="og:url"]', 'content'),
    'https://www.gateo.kr/place/bora-bora?lang=en',
  );
});
