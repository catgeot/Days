import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { StrictMode, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';

const HUB_ENTRY = '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1';

globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ || {}),
  DEV: false,
  PROD: true,
  MODE: 'test',
  VITE_GATEO_LOGBOOK_REVIEW_FILTER_E2E: '1',
  VITE_GATEO_LOGBOOK_REVIEW_HUB: '',
  VITE_GATEO_LOGBOOK_REVIEW_FILTER: '',
};

const { default: LogbookOfficialReviewHubCard } = await import(
  '../../src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx'
);
const { clearLogbookReviewHubListCache } = await import(
  '../../src/logbookOfficialReviews/logbookReviewHubListCache.js'
);
const {
  clearLogbookReviewHubSession,
  readLogbookReviewHubSession,
  snapshotLogbookReviewHubSession,
} = await import('../../src/logbookOfficialReviews/logbookReviewHubSession.js');
const { i18n } = await import('../../src/i18n/config.js');

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: `https://www.gateo.kr${HUB_ENTRY}`,
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
setGlobal('sessionStorage', window.sessionStorage);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('MouseEvent', window.MouseEvent);
setGlobal('PointerEvent', window.PointerEvent);
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
setGlobal('IntersectionObserver', IntersectionObserverStub);
window.IntersectionObserver = IntersectionObserverStub;
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
window.localStorage.setItem('gateo.locale', 'ko');
await i18n.changeLanguage('ko');

/** @type {unknown[][]} */
const gtagCalls = [];
window.gtag = (...args) => {
  gtagCalls.push(args);
};

function gaEvents(name) {
  return gtagCalls
    .filter((args) => args[0] === 'event' && (!name || args[1] === name))
    .map((args) => ({ name: args[1], params: args[2] }));
}

function Where() {
  const location = useLocation();
  return React.createElement(
    'output',
    { 'data-testid': 'where' },
    `${location.pathname}${location.search}`,
  );
}

function Harness({ nonce }) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('span', { 'data-testid': 'nonce' }, String(nonce)),
    React.createElement(LogbookOfficialReviewHubCard),
  );
}

let root;
let container;

function tree(nonce) {
  return React.createElement(
    MemoryRouter,
    { initialEntries: [HUB_ENTRY] },
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Where),
      React.createElement(Harness, { nonce }),
    ),
  );
}

async function settle() {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function renderHub(nonce = 0) {
  if (!root) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  }
  await act(async () => {
    root.render(tree(nonce));
  });
  await settle();
}

async function activate(el) {
  await act(async () => {
    el.dispatchEvent(
      new window.PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }),
    );
    el.dispatchEvent(
      new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
    );
  });
}

beforeEach(() => {
  gtagCalls.length = 0;
  clearLogbookReviewHubSession();
  clearLogbookReviewHubListCache();
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
  clearLogbookReviewHubSession();
  clearLogbookReviewHubListCache();
  gtagCalls.length = 0;
});

test('default expand sends one hub toggle and a rerender does not send another', async () => {
  await renderHub(0);
  const toggle = document.querySelector('[data-testid="logbook-official-review-hub-toggle"]');
  assert.ok(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(gaEvents('logbook_review_hub_toggle'), [
    { name: 'logbook_review_hub_toggle', params: { expanded: true, source: 'default' } },
  ]);

  await renderHub(1);
  assert.equal(document.querySelector('[data-testid="nonce"]').textContent, '1');
  assert.equal(toggle.isConnected, true);
  assert.deepEqual(gaEvents('logbook_review_hub_toggle'), [
    { name: 'logbook_review_hub_toggle', params: { expanded: true, source: 'default' } },
  ]);
});

test('strict mode mount still sends the default open event once', async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(StrictMode, null, tree(0)));
  });
  await settle();
  assert.equal(
    gaEvents('logbook_review_hub_toggle').filter((event) => event.params.source === 'default').length,
    1,
  );
});

test('user toggle sends expanded true/false once per click', async () => {
  await renderHub(0);
  const toggle = document.querySelector('[data-testid="logbook-official-review-hub-toggle"]');
  await activate(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  await activate(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(gaEvents('logbook_review_hub_toggle'), [
    { name: 'logbook_review_hub_toggle', params: { expanded: true, source: 'default' } },
    { name: 'logbook_review_hub_toggle', params: { expanded: false, source: 'user' } },
    { name: 'logbook_review_hub_toggle', params: { expanded: true, source: 'user' } },
  ]);
});

test('stored collapse does not emit the default open event', async () => {
  snapshotLogbookReviewHubSession({ returnTo: HUB_ENTRY, expanded: false });
  await renderHub(0);
  const toggle = document.querySelector('[data-testid="logbook-official-review-hub-toggle"]');
  assert.ok(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.deepEqual(gaEvents('logbook_review_hub_toggle'), []);
  await activate(toggle);
  assert.deepEqual(gaEvents('logbook_review_hub_toggle'), [
    { name: 'logbook_review_hub_toggle', params: { expanded: true, source: 'user' } },
  ]);
});

test('first review card click uses position 1', async () => {
  await renderHub(0);
  const first = document.querySelector('[data-testid="logbook-official-review-hub-item"]');
  await activate(first);
  assert.deepEqual(gaEvents('logbook_review_card_click'), [
    {
      name: 'logbook_review_card_click',
      params: { reviewer: '느린산책', place_slug: 'hwaseong-fortress', position: 1 },
    },
  ]);
  assert.match(
    document.querySelector('[data-testid="where"]').textContent,
    /^\/place\/hwaseong-fortress\/reviews\?review=/,
  );
});

test('review photo card click sends reviewer, place_slug, and 1-based position once', async () => {
  await renderHub(0);
  const items = [...document.querySelectorAll('[data-testid="logbook-official-review-hub-item"]')];
  assert.ok(items.length >= 2);
  const first = items[0];
  assert.match(first.getAttribute('href') || '', /^\/place\/hwaseong-fortress\/reviews\?review=/);
  const prague = items.find((el) => el.getAttribute('data-hub-place-slug') === 'prague');
  assert.ok(prague);
  const praguePosition = items.indexOf(prague) + 1;
  assert.ok(praguePosition > 1);
  const href = prague.getAttribute('href');
  assert.match(href || '', /^\/place\/prague\/reviews\?review=/);
  const navigates = [];
  prague.addEventListener('click', () => {
    navigates.push('click');
  });
  await activate(prague);

  assert.deepEqual(gaEvents('logbook_review_card_click'), [
    {
      name: 'logbook_review_card_click',
      params: { reviewer: '로컬하루', place_slug: 'prague', position: praguePosition },
    },
  ]);
  assert.deepEqual(navigates, ['click']);
  assert.match(
    document.querySelector('[data-testid="where"]').textContent,
    /^\/place\/prague\/reviews\?review=/,
  );
  assert.equal(prague.getAttribute('href'), href);
  const saved = readLogbookReviewHubSession();
  assert.equal(saved?.returnTo, HUB_ENTRY);
  const dumped = JSON.stringify(gtagCalls);
  assert.equal(dumped.includes('email'), false);
  assert.equal(dumped.includes('user_id'), false);
  assert.equal(dumped.includes('userId'), false);
});
