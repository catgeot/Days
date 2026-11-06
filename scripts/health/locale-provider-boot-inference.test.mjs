import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const { appendEnglishLangQueryToPath, shouldAppendEnglishLangQuery } = await import(
  pathToFileURL(join(root, 'src/i18n/localeUrlQuery.js')).href,
);
const { resolveBootLocaleSource } = await import(
  pathToFileURL(join(root, 'src/i18n/resolveBootLocaleSource.js')).href,
);
const { LOCALE_STORAGE_KEY } = await import(
  pathToFileURL(join(root, 'src/i18n/constants.js')).href,
);
const { LocaleProvider, useLocale } = await import(
  pathToFileURL(join(root, 'src/i18n/LocaleProvider.jsx')).href,
);

function setupDom(url) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url,
  });
  const { window } = dom;
  for (const key of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'Element',
    'Node',
    'localStorage',
  ]) {
    Object.defineProperty(globalThis, key, {
      value: window[key],
      configurable: true,
      writable: true,
    });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}

function LocationProbe() {
  const loc = useLocation();
  const ctx = useLocale();
  return React.createElement('div', {
    id: 'probe',
    'data-path': `${loc.pathname}${loc.search}`,
    'data-locale': ctx.locale,
    'data-source': ctx.localeSource,
    'data-explicit': String(ctx.isExplicitLocale),
  });
}

let reactRoot;
let container;

afterEach(() => {
  if (reactRoot) {
    act(() => {
      reactRoot.unmount();
    });
    reactRoot = null;
  }
  container = null;
  try {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY);
  } catch {
    // ignore
  }
});

test('localeUrlQuery — lang=en only for non-browser sources', () => {
  assert.equal(shouldAppendEnglishLangQuery('en', 'browser'), false);
  assert.equal(shouldAppendEnglishLangQuery('en', 'explicit'), true);
  assert.equal(
    appendEnglishLangQueryToPath('/korea/theme/scenic', 'en', 'browser'),
    '/korea/theme/scenic',
  );
  assert.equal(
    appendEnglishLangQueryToPath('/korea/theme/scenic', 'en', 'explicit'),
    '/korea/theme/scenic?lang=en',
  );
});

test('resolveBootLocaleSource — url beats storage', () => {
  assert.equal(resolveBootLocaleSource({ urlLang: 'en', storedLocale: 'ko' }), 'url');
  assert.equal(resolveBootLocaleSource({ storedLocale: 'en' }), 'storage');
  assert.equal(resolveBootLocaleSource({}), 'browser');
});

test('LocaleProvider — browser en does not rewrite deep link URL', async () => {
  setupDom('https://www.gateo.kr/place/jeju/reviews');
  Object.defineProperty(window.navigator, 'languages', {
    value: ['en-US'],
    configurable: true,
  });

  container = document.getElementById('root');
  reactRoot = createRoot(container);

  await act(async () => {
    reactRoot.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/place/jeju/reviews'] },
        React.createElement(
          LocaleProvider,
          null,
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: '/place/:slug/reviews',
              element: React.createElement(LocationProbe),
            }),
          ),
        ),
      ),
    );
  });

  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

  const probe = document.getElementById('probe');
  assert.equal(probe?.dataset.locale, 'en');
  assert.equal(probe?.dataset.source, 'browser');
  assert.equal(probe?.dataset.explicit, 'false');
  assert.equal(probe?.dataset.path, '/place/jeju/reviews');
  assert.equal(window.localStorage.getItem(LOCALE_STORAGE_KEY), null);
});

test('LocaleProvider — explicit toggle persists and adds lang to URL', async () => {
  setupDom('https://www.gateo.kr/place/jeju/reviews');
  Object.defineProperty(window.navigator, 'languages', {
    value: ['en-US'],
    configurable: true,
  });

  function ToggleProbe() {
    const loc = useLocation();
    const { setLocale, localeSource, isExplicitLocale } = useLocale();
    return React.createElement(
      'div',
      null,
      React.createElement(
        'button',
        { type: 'button', id: 'toggle-en', onClick: () => setLocale('en') },
        'EN',
      ),
      React.createElement('div', {
        id: 'probe',
        'data-path': `${loc.pathname}${loc.search}`,
        'data-source': localeSource,
        'data-explicit': String(isExplicitLocale),
      }),
    );
  }

  container = document.getElementById('root');
  reactRoot = createRoot(container);

  await act(async () => {
    reactRoot.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/place/jeju/reviews'] },
        React.createElement(
          LocaleProvider,
          null,
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: '/place/:slug/reviews',
              element: React.createElement(ToggleProbe),
            }),
          ),
        ),
      ),
    );
  });

  await act(async () => {
    document.getElementById('toggle-en')?.click();
  });

  const probe = document.getElementById('probe');
  assert.equal(probe?.dataset.source, 'explicit');
  assert.equal(probe?.dataset.explicit, 'true');
  assert.match(probe?.dataset.path || '', /\?lang=en/);
  assert.equal(window.localStorage.getItem(LOCALE_STORAGE_KEY), 'en');
});
