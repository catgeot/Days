import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import SEO from '../../src/components/SEO/index.jsx';
import HomeDocumentHead from '../../src/pages/Home/HomeDocumentHead.jsx';
import { getPlaceOgImageUrl } from '../../src/pages/Home/lib/placeSeoOg.js';
import { ensureI18n } from '../../src/i18n/config.js';
import { LocaleProvider } from '../../src/i18n/LocaleProvider.jsx';
import { LOCALE_STORAGE_KEY } from '../../src/i18n/constants.js';
import { stripHeadSeoBeforeHelmet } from '../../src/shared/seo/stripHeadSeoBeforeHelmet.js';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const i18n = ensureI18n('ko');
const placeImage = getPlaceOgImageUrl({ slug: 'bora-bora', name: '보라보라', name_en: 'Bora Bora' });
const HOME_TITLE = 'GATEO | AI 도슨트와 함께하는 3D 세계 여행';
const PLACE_TITLE = '보라보라 | GATEO';
const PLACE_CANONICAL = 'https://www.gateo.kr/place/bora-bora/gallery';

let root;

function mountDom(pathname) {
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
    value: () => ({ matches: false, addListener() {}, removeListener() {} }),
    configurable: true,
    writable: true,
  });
  stripHeadSeoBeforeHelmet();
}

function headSnapshot() {
  const head = globalThis.document.head;
  return {
    titles: [...head.querySelectorAll('title')].map((el) => el.textContent),
    ogTitles: [...head.querySelectorAll('meta[property="og:title"]')].map((el) => el.getAttribute('content')),
    ogImages: [...head.querySelectorAll('meta[property="og:image"]')].map((el) => el.getAttribute('content')),
    canonicals: [...head.querySelectorAll('link[rel="canonical"]')].map((el) => el.href),
  };
}

function assertSingleHead(label) {
  const snap = headSnapshot();
  assert.equal(snap.titles.length, 1, `${label} title ${JSON.stringify(snap.titles)}`);
  assert.equal(snap.ogTitles.length, 1, `${label} og:title ${JSON.stringify(snap.ogTitles)}`);
  assert.equal(snap.ogImages.length, 1, `${label} og:image ${JSON.stringify(snap.ogImages)}`);
  assert.equal(snap.canonicals.length, 1, `${label} canonical ${JSON.stringify(snap.canonicals)}`);
  return snap;
}

function PlaceHead() {
  const { slug, tab } = useParams();
  const tabKey = tab || 'gallery';
  return React.createElement(SEO, {
    title: '보라보라',
    description: '보라보라 여행. 명소, 플래너, AI 도슨트를 GATEO에서 확인하세요.',
    url: `/place/${slug}/${tabKey}`,
    location: { slug, name: '보라보라', name_en: 'Bora Bora' },
    tab: tabKey,
  });
}

function EditorialHead() {
  const { slug } = useParams();
  return React.createElement(SEO, {
    title: '로마 기행',
    description: '로마 에디터 기행문',
    url: `/blog/e/${slug}`,
    type: 'article',
  });
}

function Shell() {
  return React.createElement(
    HelmetProvider,
    null,
    React.createElement(
      LocaleProvider,
      null,
      React.createElement(
        I18nextProvider,
        { i18n },
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            {
              path: '/',
              element: React.createElement(React.Fragment, null, React.createElement(HomeDocumentHead), React.createElement(Outlet)),
            },
            React.createElement(Route, { index: true, element: null }),
            React.createElement(Route, { path: 'place/:slug', element: React.createElement(PlaceHead) }),
            React.createElement(Route, { path: 'place/:slug/:tab', element: React.createElement(PlaceHead) }),
            React.createElement(Route, { path: 'explore/:continent/:category', element: null }),
          ),
          React.createElement(Route, {
            path: '/korea',
            element: React.createElement(SEO, { title: '한국의 축제', url: '/korea' }),
          }),
          React.createElement(Route, {
            path: '/blog',
            element: React.createElement(SEO, { title: '여행 기록', url: '/blog' }),
          }),
          React.createElement(Route, { path: '/blog/e/:slug', element: React.createElement(EditorialHead) }),
        ),
      ),
    ),
  );
}

function NavBinder({ navRef }) {
  navRef.current = useNavigate();
  return null;
}

async function renderAt(pathname, navRef) {
  mountDom(pathname);
  const container = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(
          MemoryRouter,
          { initialEntries: [pathname] },
          React.createElement(NavBinder, { navRef }),
          React.createElement(Shell),
        ),
      ),
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
});

test('SEO does not strip the document head during render', () => {
  const source = readFileSync(new URL('../../src/components/SEO/index.jsx', import.meta.url), 'utf8');
  assert.equal(source.includes('stripHeadSeoBeforeHelmet'), false);
});

test('Home delegates document head and does not render SEO beside /place', () => {
  const source = readFileSync(new URL('../../src/pages/Home/index.jsx', import.meta.url), 'utf8');
  assert.match(source, /<HomeDocumentHead\s*\/>/);
  assert.equal(source.includes('<SEO'), false);
});

test('editorial loading strip stays in a layout effect, not render', () => {
  const source = readFileSync(new URL('../../src/pages/DailyReport/PublicViewer.jsx', import.meta.url), 'utf8');
  const layoutAt = source.indexOf('useLayoutEffect(');
  const stripAt = source.indexOf('stripHeadSeoBeforeHelmet()');
  assert.ok(layoutAt !== -1 && stripAt > layoutAt);
});

test('fresh load keeps one title, og:title, og:image, and canonical', async () => {
  const cases = [
    {
      path: '/',
      title: HOME_TITLE,
      canonical: 'https://www.gateo.kr/',
      ogImage: 'https://www.gateo.kr/og-image.png',
    },
    {
      path: '/place/bora-bora',
      title: PLACE_TITLE,
      canonical: PLACE_CANONICAL,
      ogImage: placeImage,
    },
    {
      path: '/place/bora-bora/gallery',
      title: PLACE_TITLE,
      canonical: PLACE_CANONICAL,
      ogImage: placeImage,
    },
    {
      path: '/blog',
      title: '여행 기록 | GATEO',
      canonical: 'https://www.gateo.kr/blog',
      ogImage: 'https://www.gateo.kr/og-image.png',
    },
    {
      path: '/blog/e/rome-travelogue',
      title: '로마 기행 | GATEO',
      canonical: 'https://www.gateo.kr/blog/e/rome-travelogue',
      ogImage: 'https://www.gateo.kr/og-image.png',
    },
    {
      path: '/korea',
      title: '한국의 축제 | GATEO',
      canonical: 'https://www.gateo.kr/korea',
      ogImage: 'https://www.gateo.kr/og-image.png',
    },
    {
      path: '/explore/asia/paradise',
      title: '아시아 휴양·호캉스 여행지 | GATEO',
      canonical: 'https://www.gateo.kr/explore/asia/paradise',
    },
  ];

  for (const row of cases) {
    await renderAt(row.path, { current: null });
    const snap = assertSingleHead(`fresh ${row.path}`);
    assert.equal(snap.titles[0], row.title, row.path);
    assert.equal(snap.ogTitles[0], row.title, row.path);
    assert.equal(snap.canonicals[0], row.canonical, row.path);
    if (row.ogImage) assert.equal(snap.ogImages[0], row.ogImage, row.path);
    if (row.path.startsWith('/place/')) {
      assert.equal(snap.titles.includes(HOME_TITLE), false);
      assert.equal(snap.canonicals.includes('https://www.gateo.kr/place/bora-bora'), false);
    }
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
});

test('SPA moves keep one head tag and do not throw removeChild', async () => {
  const navRef = { current: null };
  await renderAt('/', navRef);
  const steps = [
    { path: '/', title: HOME_TITLE, canonical: 'https://www.gateo.kr/' },
    { path: '/place/bora-bora', title: PLACE_TITLE, canonical: PLACE_CANONICAL },
    { path: '/place/bora-bora/gallery', title: PLACE_TITLE, canonical: PLACE_CANONICAL },
    { path: '/blog', title: '여행 기록 | GATEO', canonical: 'https://www.gateo.kr/blog' },
    { path: '/blog/e/rome-travelogue', title: '로마 기행 | GATEO', canonical: 'https://www.gateo.kr/blog/e/rome-travelogue' },
    { path: '/korea', title: '한국의 축제 | GATEO', canonical: 'https://www.gateo.kr/korea' },
    { path: '/', title: HOME_TITLE, canonical: 'https://www.gateo.kr/' },
  ];

  for (const step of steps) {
    await act(async () => {
      navRef.current(step.path);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const snap = assertSingleHead(`spa ${step.path}`);
    assert.equal(snap.titles[0], step.title, step.path);
    assert.equal(snap.ogTitles[0], step.title, step.path);
    assert.equal(snap.canonicals[0], step.canonical, step.path);
    if (step.path.startsWith('/place/')) {
      assert.equal(snap.ogImages[0], placeImage);
      assert.equal(snap.titles.includes(HOME_TITLE), false);
    }
  }
});
