import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { withGateoTrafficType } from '../../src/shared/analytics/gateoGaQa.js';

const NOW = new Date('2026-11-27T03:00:00.000Z');

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'https://www.gateo.kr/social?social_links=1&qa=1',
});
const { window } = dom;

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
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
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));

class IntersectionObserverStub {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    this.callback([
      { isIntersecting: true, intersectionRatio: 0.75, target: element },
    ]);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
setGlobal('IntersectionObserver', IntersectionObserverStub);
window.IntersectionObserver = IntersectionObserverStub;
window.__GATEO_GA_DISABLED__ = true;
window.__GATEO_GA_EVENTS__ = [];
globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ || {}),
  VITE_GATEO_SOCIAL_LINKS: '',
};

const { default: SocialLinksPage } = await import('../../src/pages/Social/SocialLinksPage.jsx');

function placeCard(id, day, title) {
  return {
    campaignId: `reel-${id}`,
    firstPostedAt: `2026-11-${String(day).padStart(2, '0')}`,
    title,
    region: '제주 샘플',
    photoUrl: null,
    photoCredit: null,
    targets: [{ type: 'place', slug: `sample-${id}` }],
  };
}

const sampleCards = [
  {
    campaignId: 'reel-14',
    firstPostedAt: '2026-11-27',
    title: '샘플 최근',
    region: '경북 샘플',
    photoUrl: 'https://tong.visitkorea.or.kr/cms/resource/51/3588851_image2_1.jpg',
    photoCredit: { kind: 'kto', label: '한국관광공사' },
    targets: [
      { type: 'place', slug: 'tour-126201' },
      { type: 'place', slug: 'tour-127190', name: '화순 고인돌군' },
    ],
  },
  {
    campaignId: 'fest-9001',
    firstPostedAt: '2026-11-26',
    title: '샘플 종료 축제',
    region: '부산 샘플',
    photoUrl: null,
    photoCredit: null,
    targets: [
      {
        type: 'festival',
        id: '9001',
        eventStartDate: '20261101',
        eventEndDate: '20261108',
      },
    ],
  },
  {
    campaignId: 'fest-9002',
    firstPostedAt: '2026-11-25',
    title: '샘플 곧 시작',
    region: '부산 샘플',
    photoUrl: null,
    photoCredit: null,
    targets: [
      {
        type: 'festival',
        id: '9002',
        eventStartDate: '20261128',
        eventEndDate: '20270110',
      },
    ],
  },
  placeCard(1, 1, '샘플 지난 장소'),
];

function Harness({ entry, pageProps, nonce }) {
  return React.createElement(
    HelmetProvider,
    null,
    React.createElement(
      MemoryRouter,
      { initialEntries: [entry], key: nonce },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: '/social',
          element: React.createElement(SocialLinksPage, pageProps),
        }),
        React.createElement(Route, {
          path: '/',
          element: React.createElement('div', { 'data-testid': 'home' }, 'home'),
        }),
        React.createElement(Route, {
          path: '/place/:slug',
          element: React.createElement('div', { 'data-testid': 'place' }, 'place'),
        }),
        React.createElement(Route, {
          path: '/korea',
          element: React.createElement('div', { 'data-testid': 'korea' }, 'korea'),
        }),
        React.createElement(Route, {
          path: '/explore',
          element: React.createElement('div', { 'data-testid': 'explore' }, 'explore'),
        }),
      ),
    ),
  );
}

let root;
let container;
let renderNonce = 0;

async function render(entry, pageProps) {
  renderNonce += 1;
  if (!root) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  }
  await act(async () => {
    root.render(React.createElement(Harness, { entry, pageProps, nonce: renderNonce }));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function events(name) {
  return (window.__GATEO_GA_EVENTS__ || [])
    .filter((event) => event.name === name)
    .map((event) => event.params);
}

beforeEach(() => {
  window.__GATEO_GA_DISABLED__ = true;
  window.__GATEO_GA_EVENTS__ = [];
  window.__GATEO_SOCIAL_CARD_VIEWS__ = new Set();
  window.sessionStorage.clear();
});

test('flag off redirects /social home and records no social events', async () => {
  await render('/social', { cards: sampleCards, now: NOW });
  assert.equal(document.querySelector('[data-testid="home"]')?.textContent, 'home');
  assert.equal(document.querySelector('[data-testid="social-hero"]'), null);
  assert.deepEqual(events('social_card_view'), []);
});

test('together line stays inside its card shell', async () => {
  await render('/social?social_links=1', {
    cards: [
      {
        campaignId: 'reel-14',
        firstPostedAt: '2026-11-27',
        title: '샘플 최근',
        region: '경북 샘플',
        photoUrl: 'https://tong.visitkorea.or.kr/cms/resource/51/3588851_image2_1.jpg',
        photoCredit: { kind: 'kto', label: '한국관광공사' },
        targets: [
          { type: 'place', slug: 'tour-126201' },
          { type: 'place', slug: 'tour-127190', name: '화순 고인돌군' },
        ],
      },
      {
        campaignId: 'reel-07',
        firstPostedAt: '2026-11-04',
        title: '국립백두대간수목원',
        region: '경상',
        photoUrl: 'https://tong.visitkorea.or.kr/cms/resource/51/3588851_image2_1.jpg',
        photoCredit: null,
        targets: [
          { type: 'place', slug: 'tour-2508220' },
          { type: 'place', slug: 'gaesimsa', name: '개심사' },
        ],
      },
    ],
    now: NOW,
  });
  const lines = [...document.querySelectorAll('[data-testid="social-together"]')];
  assert.equal(lines.length, 2);
  for (const line of lines) {
    const shell = line.closest('[data-testid="social-card-shell"]');
    assert.ok(shell);
    assert.equal(line.parentElement, shell);
    assert.match(shell.className, /rounded-2xl/);
    assert.match(shell.className, /bg-white\/\[0\.04\]/);
    assert.ok(shell.querySelector('[data-testid="social-hero"], [data-testid="social-card"]'));
    assert.equal(shell.parentElement.contains(line), true);
    assert.notEqual(line.parentElement, shell.parentElement);
  }
  const listShell = document.querySelector('[data-campaign="reel-07"]');
  assert.match(listShell.parentElement.className, /grid/);
});

test('missing photo centers the region or the place name', async () => {
  await render('/social?social_links=1', {
    cards: [
      {
        campaignId: 'reel-13',
        firstPostedAt: '2026-11-23',
        title: '순천 선암사',
        region: '전남 순천',
        photoUrl: null,
        photoCredit: null,
        targets: [{ type: 'place', slug: 'tour-126369' }],
      },
      {
        campaignId: 'reel-03',
        firstPostedAt: '2026-11-02',
        title: '해미순교성지',
        region: '',
        photoUrl: null,
        photoCredit: null,
        targets: [{ type: 'place', slug: 'tour-918805' }],
      },
    ],
    now: NOW,
  });
  const heroFallback = document.querySelector('[data-testid="social-hero"] [data-testid="social-photo-fallback"]');
  assert.equal(heroFallback.textContent, '전남 순천');
  assert.match(heroFallback.className, /absolute/);
  assert.match(heroFallback.className, /items-center/);
  assert.match(heroFallback.className, /justify-center/);
  assert.match(heroFallback.parentElement.className, /aspect-\[16\/10\]/);
  const listFallback = document.querySelector('[data-testid="social-card"] [data-testid="social-photo-fallback"]');
  assert.equal(listFallback.textContent, '해미순교성지');
  assert.match(listFallback.parentElement.className, /min-h-\[88px\]/);
});

test('empty region hides the region line', async () => {
  await render('/social?social_links=1', {
    cards: [
      {
        campaignId: 'reel-20',
        firstPostedAt: '2026-11-27',
        title: '샘플 지역없음',
        region: '',
        photoUrl: null,
        photoCredit: null,
        targets: [{ type: 'place', slug: 'sample-empty-region' }],
      },
    ],
    now: NOW,
  });
  const hero = document.querySelector('[data-testid="social-hero"]');
  assert.match(hero.textContent, /샘플 지역없음/);
  assert.equal(hero.querySelector('[data-testid="social-region"]'), null);
});

test('empty list shows the empty state without a more button', async () => {
  await render('/social?social_links=1', { cards: [], now: NOW });
  assert.match(document.body.textContent, /곧 소개할 여행지를 준비하고 있어요/);
  const links = [...document.querySelectorAll('[data-testid="social-empty"] a')].map((node) =>
    node.getAttribute('href'),
  );
  assert.deepEqual(links, ['/korea', '/explore']);
  assert.equal(links.some((href) => href.includes('utm_')), false);
  assert.equal(document.querySelector('[data-testid="social-more"]'), null);
});

test('flag on shows cards, ended festivals below, and buffers events once', async () => {
  await render('/social?social_links=1&qa=1', { cards: sampleCards, now: NOW });
  const hero = document.querySelector('[data-testid="social-hero"]');
  assert.equal(hero?.getAttribute('data-campaign'), 'reel-14');
  assert.equal(hero.getAttribute('href').includes('utm_'), false);
  assert.equal(hero.getAttribute('href'), '/place/tour-126201');
  assert.match(document.body.textContent, /이 여행지 보기/);
  assert.match(document.body.textContent, /11\.28 시작/);
  assert.match(document.body.textContent, /같이 나온 곳/);
  const ended = document.querySelector('[data-testid="social-ended"]');
  assert.ok(ended);
  assert.match(ended.textContent, /샘플 종료 축제/);
  assert.match(ended.textContent, /종료/);
  assert.equal(ended.textContent.includes('샘플 최근'), false);
  const robots = document.head.querySelector('meta[name="robots"]');
  assert.equal(robots?.getAttribute('content'), 'noindex');

  const views = events('social_card_view');
  assert.equal(views.length, sampleCards.length);
  assert.equal(views[0].placement, 'top_card');
  assert.equal(views[0].position, 1);
  assert.equal(views[0].campaign_id, 'reel-14');
  assert.equal(views[0].traffic_type, 'internal');
  assert.equal(views.some((params) => params.placement === 'ended_card'), true);
  assert.equal(document.querySelectorAll('script[src*="googletagmanager"]').length, 0);

  await render('/social?social_links=1&qa=1', { cards: sampleCards, now: NOW });
  assert.equal(events('social_card_view').length, sampleCards.length);

  const secondary = [...document.querySelectorAll('a')].find((node) =>
    node.textContent.includes('화순 고인돌군'),
  );
  secondary.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await render('/social?social_links=1&qa=1', { cards: sampleCards, now: NOW });
  document
    .querySelector('[data-testid="social-hero"]')
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const clicks = events('social_card_click');
  const secondaryClick = clicks.find((params) => params.link_role === 'secondary');
  const primaryClick = clicks.find((params) => params.link_role === 'primary');
  assert.equal(primaryClick.place_slug, 'tour-126201');
  assert.equal(primaryClick.traffic_type, 'internal');
  assert.equal(secondaryClick.place_slug, 'tour-127190');
  assert.equal(primaryClick.link_url, undefined);
  assert.equal(secondaryClick.link_url, undefined);
});

test('more button reveals the rest up to the cap and records social_more_click', async () => {
  const cards = [];
  for (let day = 1; day <= 13; day += 1) {
    cards.push(placeCard(day, day, `샘플 ${day}`));
  }
  await render('/social?social_links=1&qa=1', { cards, now: NOW });
  assert.equal(document.querySelectorAll('[data-testid="social-hero"], [data-testid="social-card"]').length, 12);
  const more = document.querySelector('[data-testid="social-more"]');
  assert.match(more.textContent, /더 오래된 게시물 보기/);
  await act(async () => {
    more.click();
  });
  assert.equal(document.querySelectorAll('[data-testid="social-hero"], [data-testid="social-card"]').length, 13);
  assert.equal(document.querySelector('[data-testid="social-more"]'), null);
  const moreEvents = events('social_more_click');
  assert.equal(moreEvents.length, 1);
  assert.equal(moreEvents[0].placement, 'more_text');
  assert.equal(moreEvents[0].surface, 'social_links');
  assert.equal(moreEvents[0].traffic_type, 'internal');
});

test('internal traffic marker follows qa, webdriver, and crawler=1', () => {
  assert.equal(
    withGateoTrafficType({ surface: 'social_links' }, { search: '', webdriver: false }).traffic_type,
    undefined,
  );
  assert.equal(
    withGateoTrafficType({ surface: 'social_links' }, { search: '?qa=1', webdriver: false }).traffic_type,
    'internal',
  );
  assert.equal(
    withGateoTrafficType({ surface: 'social_links' }, { search: '', webdriver: true }).traffic_type,
    'internal',
  );
  assert.equal(
    withGateoTrafficType({ surface: 'social_links' }, { search: '?crawler=1', webdriver: false })
      .traffic_type,
    'internal',
  );
});
