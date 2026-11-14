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
import { stripHeadSeoBeforeHelmet } from '../../src/shared/seo/stripHeadSeoBeforeHelmet.js';
import { LOCALE_STORAGE_KEY } from '../../src/i18n/constants.js';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

function mountDom(pathname = '/blog/e/rome-travelogue?lang=ko') {
  const dom = new JSDOM(indexHtml, { url: `https://www.gateo.kr${pathname}` });
  dom.window.localStorage.setItem(LOCALE_STORAGE_KEY, 'ko');
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
  Object.defineProperty(globalThis, 'matchMedia', {
    value: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
    configurable: true,
    writable: true,
  });
  return dom;
}

const i18n = ensureI18n('ko');
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

async function renderSeo(props, initialEntry = '/blog/e/rome-travelogue?lang=ko') {
  container = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [initialEntry] },
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

function firstMeta(selector) {
  return globalThis.document.querySelector(selector)?.getAttribute('content') ?? '';
}

test('stripHeadSeoBeforeHelmet removes index.html default og and description tags', () => {
  mountDom();
  assert.ok(globalThis.document.querySelectorAll('meta[property="og:title"]').length >= 1);
  stripHeadSeoBeforeHelmet();
  assert.equal(globalThis.document.querySelectorAll('meta[property="og:title"]').length, 0);
  assert.equal(globalThis.document.querySelectorAll('meta[name="description"]').length, 0);
});

test('editorial SEO keeps single post-specific description and og fields after render', async () => {
  mountDom('/blog/e/rome-travelogue?lang=ko');
  const articleTitle = '로마, 영원의 도시를 걷다';
  const articleDescription = '로마 골목과 콜로세움을 잇는 GATEO 에디터 기행문 데크.';
  const pagePath = '/blog/e/rome-travelogue';

  await renderSeo({
    title: articleTitle,
    description: articleDescription,
    url: pagePath,
    image: 'https://www.gateo.kr/og-image.png',
    type: 'article',
  });

  assert.equal(globalThis.document.querySelectorAll('title').length, 1);
  assert.equal(globalThis.document.title, `${articleTitle} | GATEO`);
  assert.equal(globalThis.document.querySelectorAll('meta[name="description"]').length, 1);
  assert.equal(firstMeta('meta[name="description"]'), articleDescription);
  assert.equal(globalThis.document.querySelectorAll('meta[property="og:title"]').length, 1);
  assert.equal(firstMeta('meta[property="og:title"]'), `${articleTitle} | GATEO`);
  assert.equal(globalThis.document.querySelectorAll('meta[property="og:description"]').length, 1);
  assert.equal(firstMeta('meta[property="og:description"]'), articleDescription);
  assert.equal(globalThis.document.querySelectorAll('meta[property="og:url"]').length, 1);
  assert.equal(firstMeta('meta[property="og:url"]'), 'https://www.gateo.kr/blog/e/rome-travelogue');
  assert.equal(globalThis.document.querySelector('link[rel="canonical"]')?.href, 'https://www.gateo.kr/blog/e/rome-travelogue');
});

test('editorial SEO does not leave duplicate home-default og:description', async () => {
  mountDom('/blog/e/rome-travelogue?lang=ko');
  const homeOgDescription = '당신의 여행을 계획하고 기록하는 가장 스마트한 방법';

  await renderSeo({
    title: '로마 기행',
    description: '에디터 데크 한 줄',
    url: '/blog/e/rome-travelogue',
    type: 'article',
  });

  const ogDescriptions = [...globalThis.document.querySelectorAll('meta[property="og:description"]')].map((el) =>
    el.getAttribute('content'),
  );
  assert.equal(ogDescriptions.length, 1);
  assert.notEqual(ogDescriptions[0], homeOgDescription);
  assert.equal(ogDescriptions[0], '에디터 데크 한 줄');
});

test('home-path SEO still replaces defaults with site description', async () => {
  mountDom('/?lang=ko');
  const homeDescription = i18n.t('seo.defaultDescription');

  await renderSeo({ url: '/' }, '/?lang=ko');

  assert.equal(globalThis.document.querySelectorAll('meta[property="og:url"]').length, 1);
  assert.equal(firstMeta('meta[property="og:url"]'), 'https://www.gateo.kr/');
  assert.equal(globalThis.document.querySelectorAll('meta[name="description"]').length, 1);
  assert.equal(firstMeta('meta[name="description"]'), homeDescription);
  assert.equal(globalThis.document.querySelectorAll('meta[property="og:description"]').length, 1);
  assert.equal(firstMeta('meta[property="og:description"]'), homeDescription);
});