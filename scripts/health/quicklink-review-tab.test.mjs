import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { MemoryRouter } from 'react-router-dom';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoQuicklinkReviewTabEnvEnabled,
  isQuicklinkReviewTabActive,
  isQuicklinkReviewTabQueryEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import { shouldMarkGateoInternalTraffic } from '../../src/shared/analytics/gateoGaQa.js';
import {
  trackMooniCurationLinkClick,
  trackQuicklinkClick,
} from '../../src/shared/analytics/quicklinkAnalytics.js';
import { reviewHubArrivalDelta } from '../../src/logbookOfficialReviews/logbookReviewHubArrival.js';
import MooniCompanionCurationLink, {
  shouldShowMooniCompanionCurationLink,
} from '../../src/components/chat/MooniCompanionCurationLink.jsx';
import ko from '../../src/i18n/locales/ko.json' with { type: 'json' };
import en from '../../src/i18n/locales/en.json' with { type: 'json' };
import { i18n } from '../../src/i18n/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const flagName = GATEO_ENV_FLAG_NAMES.QUICKLINK_REVIEW_TAB;

test('quicklink review tab env is on only for the exact string 1', () => {
  const prev = globalThis.__VITE_ENV__?.[flagName];
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}) };
  for (const value of [undefined, '', '0', 'false', 'off', 'true', 'yes', 'TRUE']) {
    globalThis.__VITE_ENV__[flagName] = value;
    assert.equal(isGateoQuicklinkReviewTabEnvEnabled(), false, String(value));
    assert.equal(isQuicklinkReviewTabActive(''), false, String(value));
  }
  globalThis.__VITE_ENV__[flagName] = '1';
  assert.equal(isGateoQuicklinkReviewTabEnvEnabled(), true);
  assert.equal(isQuicklinkReviewTabActive(''), true);
  globalThis.__VITE_ENV__[flagName] = prev;
});

test('preview query matches logbook_review_hub (1 or true) and does not enable other values', () => {
  const prev = globalThis.__VITE_ENV__?.[flagName];
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), [flagName]: '' };
  assert.equal(isQuicklinkReviewTabQueryEnabled('?quicklink_review_tab=1'), true);
  assert.equal(isQuicklinkReviewTabQueryEnabled('quicklink_review_tab=true'), true);
  assert.equal(isQuicklinkReviewTabQueryEnabled('?quicklink_review_tab=yes'), false);
  assert.equal(isQuicklinkReviewTabQueryEnabled('?quicklink_review_tab=0'), false);
  assert.equal(isQuicklinkReviewTabQueryEnabled(''), false);
  assert.equal(isQuicklinkReviewTabActive('?quicklink_review_tab=1'), true);
  assert.equal(isQuicklinkReviewTabActive('?logbook_review_hub=1'), false);
  globalThis.__VITE_ENV__[flagName] = prev;
});

test('ko and en home.quickLinks keep curation and add review hub labels', () => {
  assert.equal(ko.home.quickLinks.curation.short, '추천');
  assert.equal(ko.home.quickLinks.curation.label, 'AI 큐레이션');
  assert.equal(ko.home.quickLinks.reviewHub.short, '리뷰');
  assert.equal(ko.home.quickLinks.reviewHub.label, '리뷰 창고');
  assert.equal(ko.home.quickLinks.navigateTo, '{{label}}로 이동');
  assert.equal(en.home.quickLinks.curation.short, 'Pick');
  assert.equal(en.home.quickLinks.curation.label, 'AI curation');
  assert.equal(en.home.quickLinks.reviewHub.short, 'Reviews');
  assert.equal(en.home.quickLinks.reviewHub.label, 'Review hub');
  assert.equal(en.home.quickLinks.navigateTo, 'Go to {{label}}');
  assert.equal(ko.mooni.chat.companionCurationLink, '취향에 맞는 여행지 더 찾기 → AI 큐레이션');
  assert.equal(
    en.mooni.chat.companionCurationLink,
    'Find more destinations for your taste → AI curation',
  );
  const collapsed = (pack, fourthKey) =>
    [pack.festival.short, pack.worldEvents.short, pack.scenic.short, pack[fourthKey].short].join(' · ');
  assert.equal(collapsed(ko.home.quickLinks, 'curation'), '축제 · 행사 · 명승 · 추천');
  assert.equal(collapsed(ko.home.quickLinks, 'reviewHub'), '축제 · 행사 · 명승 · 리뷰');
  assert.equal(collapsed(en.home.quickLinks, 'curation'), 'Fest · Events · Scenic · Pick');
  assert.equal(collapsed(en.home.quickLinks, 'reviewHub'), 'Fest · Events · Scenic · Reviews');
});

test('quicklink events fire for real users and carry traffic_type internal for QA, webdriver, and crawler', () => {
  const sent = [];
  const dataLayer = [];
  const realWindow = globalThis.window;
  globalThis.window = {
    gtag: (...args) => {
      sent.push(args);
      if (args[0] === 'event') dataLayer.push(args);
    },
    location: { search: '' },
    dataLayer,
  };
  const realUser = {
    navigator: { webdriver: false, userAgent: 'Mozilla/5.0' },
    localStorage: { getItem: () => null },
    userAgent: 'Mozilla/5.0',
    webdriver: false,
    search: '',
  };

  assert.equal(shouldMarkGateoInternalTraffic(realUser), false);
  assert.equal(trackQuicklinkClick('festival', realUser), true);
  assert.equal(trackMooniCurationLinkClick(realUser), true);
  for (const item of ['world_events', 'scenic', 'curation', 'review_hub']) {
    assert.equal(trackQuicklinkClick(item, realUser), true);
  }
  assert.deepEqual(
    sent.map((args) => ({ name: args[1], params: args[2] })),
    [
      { name: 'quicklink_click', params: { item: 'festival', surface: 'home_menu', expanded: true } },
      { name: 'mooni_curation_link_click', params: { from_chip: 'companion' } },
      { name: 'quicklink_click', params: { item: 'world_events', surface: 'home_menu', expanded: true } },
      { name: 'quicklink_click', params: { item: 'scenic', surface: 'home_menu', expanded: true } },
      { name: 'quicklink_click', params: { item: 'curation', surface: 'home_menu', expanded: true } },
      { name: 'quicklink_click', params: { item: 'review_hub', surface: 'home_menu', expanded: true } },
    ],
  );
  assert.equal(dataLayer.length, sent.length);
  for (const params of sent.map((args) => args[2])) {
    assert.equal(Object.hasOwn(params, 'traffic_type'), false);
  }

  function marked(env, item = 'festival') {
    sent.length = 0;
    dataLayer.length = 0;
    assert.equal(shouldMarkGateoInternalTraffic(env), true);
    assert.equal(trackQuicklinkClick(item, env), true);
    assert.equal(trackMooniCurationLinkClick(env), true);
    assert.equal(sent[0][2].traffic_type, 'internal');
    assert.equal(sent[1][2].traffic_type, 'internal');
    assert.equal(sent[0][2].item, item);
    assert.equal(sent[0][2].surface, 'home_menu');
    assert.equal(sent[0][2].expanded, true);
    assert.deepEqual(sent[1][2], { from_chip: 'companion', traffic_type: 'internal' });
    assert.deepEqual(dataLayer[0], sent[0]);
  }

  marked({ ...realUser, webdriver: true });
  marked({ ...realUser, search: '?crawler=1', webdriver: false }, 'curation');
  marked({
    ...realUser,
    search: '?qa=1',
    webdriver: false,
  }, 'review_hub');
  marked({
    ...realUser,
    webdriver: false,
    localStorage: { getItem: (key) => (key === 'gateo_qa' ? '1' : null) },
  });

  globalThis.window = realWindow;
});

test('MOONi companion curation link is absent unless the flag is on and the chip is companion', () => {
  const prev = globalThis.__VITE_ENV__?.[flagName];
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), [flagName]: '' };
  assert.equal(shouldShowMooniCompanionCurationLink('companion', ''), false);
  assert.equal(shouldShowMooniCompanionCurationLink('companion', '?quicklink_review_tab=0'), false);
  assert.equal(shouldShowMooniCompanionCurationLink('food', '?quicklink_review_tab=1'), false);
  assert.equal(shouldShowMooniCompanionCurationLink('activities', '?quicklink_review_tab=1'), false);
  assert.equal(shouldShowMooniCompanionCurationLink(null, '?quicklink_review_tab=1'), false);
  assert.equal(shouldShowMooniCompanionCurationLink('companion', '?quicklink_review_tab=1'), true);
  globalThis.__VITE_ENV__[flagName] = '1';
  assert.equal(shouldShowMooniCompanionCurationLink('companion', ''), true);
  assert.equal(shouldShowMooniCompanionCurationLink('food', ''), false);
  globalThis.__VITE_ENV__[flagName] = prev;
});

test('arrival scroll moves once only when the hub is below the first screen', () => {
  const below = reviewHubArrivalDelta({
    hubRect: { top: 900, bottom: 1400 },
    rootRect: { top: 80, bottom: 800 },
    scrollTop: 0,
  });
  assert.equal(below, 820);
  assert.equal(
    reviewHubArrivalDelta({
      hubRect: { top: 120, bottom: 400 },
      rootRect: { top: 80, bottom: 800 },
      scrollTop: 0,
    }),
    0,
  );
  assert.equal(
    reviewHubArrivalDelta({
      hubRect: { top: 900, bottom: 1400 },
      rootRect: { top: 80, bottom: 800 },
      scrollTop: 40,
      userMoved: true,
    }),
    0,
  );
});

test('home menu and MOONi answer wire the flag without adding a chip', () => {
  const home = readFileSync(join(root, 'src/pages/Home/components/HomeUI.jsx'), 'utf8');
  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(home, /trackQuicklinkClick\(item\.analyticsItem\)/);
  assert.match(home, /REVIEW_HUB_QUICK_LINK/);
  assert.match(home, /item\.key === 'curation' \? REVIEW_HUB_QUICK_LINK : item/);
  assert.match(chat, /replyChipId: chipId \|\| null/);
  assert.match(chat, /MooniCompanionCurationLink/);
  assert.doesNotMatch(chat, /companionCurationChip/);
  const index = readFileSync(join(root, 'index.html'), 'utf8').split('\n')[131];
  assert.match(index, /href="\/blog\/curation"/);
});

test('rendered companion link is absent when the flag is off and sends the click when on', async () => {
  const prev = globalThis.__VITE_ENV__?.[flagName];
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), [flagName]: '' };
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://www.gateo.kr/',
  });
  const { window } = dom;
  const previous = new Map();
  function setGlobal(name, value) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
  setGlobal('window', window);
  setGlobal('document', window.document);
  setGlobal('navigator', window.navigator);
  setGlobal('HTMLElement', window.HTMLElement);
  setGlobal('Node', window.Node);
  setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const sent = [];
  window.gtag = (...args) => sent.push(args);
  await i18n.changeLanguage('ko');

  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const reactRoot = createRoot(container);

  await act(async () => {
    reactRoot.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/home'] },
        React.createElement(MooniCompanionCurationLink, { chipId: 'companion', variant: 'light' }),
      ),
    );
  });
  assert.equal(window.document.querySelector('[data-testid="mooni-companion-curation-link"]'), null);
  assert.equal(window.document.body.textContent.includes('취향에 맞는 여행지'), false);

  await act(async () => {
    reactRoot.unmount();
  });
  const onRoot = createRoot(container);
  await act(async () => {
    onRoot.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/home?quicklink_review_tab=1'] },
        React.createElement(MooniCompanionCurationLink, { chipId: 'companion', variant: 'light' }),
      ),
    );
  });
  const link = window.document.querySelector('[data-testid="mooni-companion-curation-link"]');
  assert.ok(link, window.document.body.innerHTML);
  assert.equal(link.getAttribute('href'), '/blog/curation');
  assert.equal(link.textContent, '취향에 맞는 여행지 더 찾기 → AI 큐레이션');

  Object.defineProperty(window.navigator, 'webdriver', { configurable: true, get: () => false });
  window.addEventListener('click', (event) => event.preventDefault(), true);
  await act(async () => {
    link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  assert.deepEqual(sent, [
    ['event', 'mooni_curation_link_click', { from_chip: 'companion' }],
  ]);
  assert.equal(Object.hasOwn(sent[0][2], 'traffic_type'), false);

  await act(async () => {
    onRoot.unmount();
  });
  for (const [name, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
  globalThis.__VITE_ENV__[flagName] = prev;
});
