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
import {
  isWikimediaOgImageUrl,
  resolveSocialShareImageUrl,
  DEFAULT_SITE_OG_IMAGE,
} from '../../src/shared/seo/socialOgImage.js';
import { injectCrawlerMetaIntoHtml } from '../../src/edge/injectCrawlerMeta.js';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

function mountDom(pathname = '/') {
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

async function renderSeo(props, initialEntry = '/') {
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

function assertSingleSeoHead() {
  const head = globalThis.document.head;
  assert.equal(head.querySelectorAll('title').length, 1, 'title');
  assert.equal(head.querySelectorAll('meta[name="description"]').length, 1, 'meta description');
  assert.equal(head.querySelectorAll('meta[property="og:title"]').length, 1, 'og:title');
  assert.equal(head.querySelectorAll('meta[property="og:description"]').length, 1, 'og:description');
  assert.equal(head.querySelectorAll('meta[property="og:image"]').length, 1, 'og:image');
  assert.equal(head.querySelectorAll('meta[property="og:url"]').length, 1, 'og:url');
  assert.equal(head.querySelectorAll('meta[name="twitter:title"]').length, 1, 'twitter:title');
  assert.equal(head.querySelectorAll('meta[name="twitter:description"]').length, 1, 'twitter:description');
  assert.equal(head.querySelectorAll('meta[name="twitter:image"]').length, 1, 'twitter:image');
}

test('resolveSocialShareImageUrl replaces Wikimedia upload URLs', () => {
  assert.equal(isWikimediaOgImageUrl('https://upload.wikimedia.org/wikipedia/commons/a/a1/Foo.jpg'), true);
  const fallback = 'https://www.gateo.kr/place-og/kyoto.jpg';
  assert.equal(
    resolveSocialShareImageUrl(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/EikandoMomiji.jpg/1280px-EikandoMomiji.jpg',
      fallback,
    ),
    fallback,
  );
  assert.equal(
    resolveSocialShareImageUrl('https://images.unsplash.com/photo-123?w=1200', DEFAULT_SITE_OG_IMAGE),
    'https://images.unsplash.com/photo-123?w=1200',
  );
});

test('home SEO leaves exactly one og:title and og:description', async () => {
  mountDom('/?lang=ko');
  await renderSeo({ url: '/' }, '/?lang=ko');
  assertSingleSeoHead();
});

test('place SEO leaves exactly one og bundle after Helmet', async () => {
  mountDom('/place/rome?lang=ko');
  await renderSeo(
    {
      title: '로마',
      description: '로마 여행. 명소, 플래너, AI 도슨트를 GATEO에서 확인하세요.',
      url: '/place/rome',
      location: { slug: 'rome', name: '로마', name_en: 'Rome', country: '이탈리아', country_en: 'Italy' },
    },
    '/place/rome?lang=ko',
  );
  assertSingleSeoHead();
  assert.equal(
    globalThis.document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    '로마 여행. 명소, 플래너, AI 도슨트를 GATEO에서 확인하세요.',
  );
});

test('editorial blog SEO leaves exactly one og bundle (middleware shell + Helmet)', async () => {
  mountDom('/blog/e/short-20261114-kyoto-monthly-pick?lang=ko');
  const articleDescription = '11월 교토, 단풍과 명소를 짧게 정리했습니다.';
  await renderSeo(
    {
      title: '교토 11월 픽',
      description: articleDescription,
      url: '/blog/e/short-20261114-kyoto-monthly-pick',
      type: 'article',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/EikandoMomiji.jpg/1280px-EikandoMomiji.jpg',
    },
    '/blog/e/short-20261114-kyoto-monthly-pick?lang=ko',
  );
  assertSingleSeoHead();
  assert.equal(globalThis.document.querySelectorAll('meta[property="og:description"]').length, 1);
  assert.equal(
    globalThis.document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    articleDescription,
  );
  const ogImage = globalThis.document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '';
  assert.ok(!isWikimediaOgImageUrl(ogImage), 'og:image must not be Wikimedia after sanitization');
});

test('injectCrawlerMetaIntoHtml yields single og:title and og:description for bots', () => {
  const meta = {
    locale: 'ko',
    title: '로마',
    description: '로마 여행. 명소, 플래너, AI 도슨트를 GATEO에서 확인하세요.',
    keywords: '로마',
    canonicalUrl: 'https://www.gateo.kr/place/rome',
    hreflangAlternates: [{ hreflang: 'ko', href: 'https://www.gateo.kr/place/rome' }],
    ogImage: 'https://www.gateo.kr/place-og/rome.jpg',
    slug: 'rome',
    placeName: '로마',
  };
  const html = injectCrawlerMetaIntoHtml(indexHtml, meta);
  const count = (re) => (html.match(re) || []).length;
  assert.equal(count(/<meta\b[^>]*property="og:description"/gi), 1);
  assert.equal(count(/<meta\b[^>]*property="og:title"/gi), 1);
  assert.equal(count(/<meta\b[^>]*property="og:image"/gi), 1);
  assert.ok(html.includes('<!-- crawler-meta-injected -->'));
});