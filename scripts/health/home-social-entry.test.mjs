import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://www.gateo.kr/',
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
setGlobal('localStorage', window.localStorage);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('MouseEvent', window.MouseEvent);
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);

window.localStorage.setItem('gateo.locale', 'ko');

const { i18n } = await import('../../src/i18n/config.js');
const { default: HomeSocialEntryLink } = await import(
  '../../src/pages/Home/components/HomeSocialEntryLink.jsx'
);

let root;
let container;

beforeEach(() => {
  globalThis.__VITE_ENV__ = {
    ...(globalThis.__VITE_ENV__ || {}),
    VITE_GATEO_SOCIAL_LINKS: '',
  };
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
  container?.remove();
  container = null;
  await i18n.changeLanguage('ko');
});

async function mountTree(tree) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(tree);
  });
}

function LocationProbe() {
  const { pathname } = useLocation();
  return React.createElement('h1', { 'data-testid': 'pathname' }, pathname);
}

test('home social entry hidden when VITE_GATEO_SOCIAL_LINKS is off', async () => {
  await i18n.changeLanguage('ko');
  await mountTree(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      React.createElement(HomeSocialEntryLink),
    ),
  );
  assert.equal(document.querySelector('[data-testid="home-social-entry-link"]'), null);
});

test('home social entry visible with label, aria, and 44px tap target when flag is on', async () => {
  globalThis.__VITE_ENV__.VITE_GATEO_SOCIAL_LINKS = '1';
  await i18n.changeLanguage('ko');
  await mountTree(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      React.createElement(HomeSocialEntryLink),
    ),
  );
  const link = document.querySelector('[data-testid="home-social-entry-link"]');
  assert.ok(link);
  assert.equal(link.getAttribute('href'), '/social');
  assert.equal(link.textContent.trim(), '릴스에 나온 곳');
  assert.equal(link.getAttribute('aria-label'), '릴스에 나온 곳으로 이동');
  assert.match(link.className, /min-h-11/);

  await act(async () => {
    await i18n.changeLanguage('en');
  });
  const enLink = document.querySelector('[data-testid="home-social-entry-link"]');
  assert.equal(enLink.textContent.trim(), 'Places from our reels');
  assert.equal(enLink.getAttribute('aria-label'), 'Go to Places from our reels');
});

test('home social entry navigates to /social', async () => {
  globalThis.__VITE_ENV__.VITE_GATEO_SOCIAL_LINKS = '1';
  await i18n.changeLanguage('ko');
  await mountTree(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: '/',
          element: React.createElement(
            React.Fragment,
            null,
            React.createElement(HomeSocialEntryLink),
            React.createElement(LocationProbe),
          ),
        }),
        React.createElement(Route, {
          path: '/social',
          element: React.createElement(
            React.Fragment,
            null,
            React.createElement(LocationProbe),
            React.createElement('p', { 'data-testid': 'social-landed' }, 'social'),
          ),
        }),
      ),
    ),
  );

  const link = document.querySelector('[data-testid="home-social-entry-link"]');
  assert.ok(link);
  assert.equal(document.querySelector('[data-testid="pathname"]').textContent, '/');

  await act(async () => {
    link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });

  assert.equal(document.querySelector('[data-testid="pathname"]').textContent, '/social');
  assert.equal(document.querySelector('[data-testid="social-landed"]').textContent, 'social');
});