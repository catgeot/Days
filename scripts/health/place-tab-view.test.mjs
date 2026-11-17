import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';

const REVIEW_PATH = '/place/hanoi/reviews?review=rev-hanoi-1';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: `https://www.gateo.kr${REVIEW_PATH}`,
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
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);

const { usePlaceTabView } = await import('../../src/shared/analytics/placeTabView.js');

/** @type {unknown[][]} */
const gtagCalls = [];
window.gtag = (...args) => {
  gtagCalls.push(args);
};

function tabViews() {
  return gtagCalls
    .filter((args) => args[0] === 'event' && args[1] === 'tab_view')
    .map((args) => args[2]);
}

function hanoiPin(extra = {}) {
  return {
    id: 'hanoi',
    slug: 'hanoi',
    name: '하노이',
    name_en: 'Hanoi',
    ...extra,
  };
}

function RouteProbe({ location, mediaMode }) {
  const route = useLocation();
  usePlaceTabView(location, mediaMode);
  return React.createElement('div', {
    'data-testid': 'place-route',
    'data-path': `${route.pathname}${route.search}`,
  });
}

function tree(location, mediaMode) {
  return React.createElement(
    MemoryRouter,
    { initialEntries: [REVIEW_PATH] },
    React.createElement(RouteProbe, { location, mediaMode }),
  );
}

let root;

async function renderAt(location, mediaMode) {
  if (!root) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  }
  await act(async () => {
    root.render(tree(location, mediaMode));
  });
}

after(async () => {
  if (!root) return;
  await act(async () => {
    root.unmount();
  });
  root = null;
});

test('place card source tracks tab_view through one hook', () => {
  const source = readFileSync(
    new URL('../../src/components/PlaceCard/modes/PlaceCardExpanded.jsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /usePlaceTabView\(location, mediaMode\)/);
  assert.doesNotMatch(source, /gtag\(\s*'event',\s*'tab_view'/);
});

test('direct /place/hanoi/reviews fires tab_view once, then once per real tab change', async () => {
  gtagCalls.length = 0;
  await renderAt(hanoiPin(), 'REVIEWS');
  assert.equal(document.querySelector('[data-testid="place-route"]').getAttribute('data-path'), REVIEW_PATH);
  assert.deepEqual(
    tabViews().map((params) => params.tab_name),
    ['reviews'],
  );
  assert.equal(tabViews()[0].place_slug, 'hanoi');
  assert.equal(tabViews()[0].place_name, '하노이');

  // /place route sync replaces the pin (addScoutPin, then setSelectedLocation) with the same slug.
  await renderAt(hanoiPin({ placeChatIntroApplied: true }), 'REVIEWS');
  assert.equal(tabViews().length, 1);

  await renderAt(hanoiPin(), 'GALLERY');
  assert.deepEqual(
    tabViews().map((params) => params.tab_name),
    ['reviews', 'gallery'],
  );

  await renderAt(hanoiPin({ desc: 'later hydrate' }), 'REVIEWS');
  const names = tabViews().map((params) => params.tab_name);
  assert.deepEqual(names, ['reviews', 'gallery', 'reviews']);
  assert.equal(tabViews().at(-1).place_slug, 'hanoi');
  assert.equal(tabViews().filter((params) => params.tab_name === 'reviews').length, 2);
});
