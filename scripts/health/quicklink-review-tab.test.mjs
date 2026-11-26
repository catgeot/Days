import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { MemoryRouter } from 'react-router-dom';

import { reviewHubArrivalDelta } from '../../src/logbookOfficialReviews/logbookReviewHubArrival.js';
import MooniCompanionCurationLink, {
  shouldShowMooniCompanionCurationLink,
} from '../../src/components/chat/MooniCompanionCurationLink.jsx';
import ko from '../../src/i18n/locales/ko.json' with { type: 'json' };
import en from '../../src/i18n/locales/en.json' with { type: 'json' };
import { i18n } from '../../src/i18n/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('ko and en home.quickLinks keep curation and add review hub labels', () => {
  assert.equal(ko.home.quickLinks.curation.short, '추천');
  assert.equal(ko.home.quickLinks.curation.label, 'AI 큐레이션');
  assert.equal(ko.home.quickLinks.reviewHub.short, '리뷰');
  assert.equal(ko.home.quickLinks.reviewHub.label, '리뷰 창고');
  assert.equal(en.home.quickLinks.reviewHub.short, 'Reviews');
  assert.equal(en.home.quickLinks.reviewHub.label, 'Review hub');
  assert.equal(ko.mooni.chat.companionCurationLink, '취향에 맞는 여행지 더 찾기 → AI 큐레이션');
  assert.equal(
    en.mooni.chat.companionCurationLink,
    'Find more destinations for your taste → AI curation',
  );
  const collapsed = (pack, fourthKey) =>
    [pack.festival.short, pack.worldEvents.short, pack.scenic.short, pack[fourthKey].short].join(' · ');
  assert.equal(collapsed(ko.home.quickLinks, 'reviewHub'), '축제 · 행사 · 명승 · 리뷰');
  assert.equal(collapsed(en.home.quickLinks, 'reviewHub'), 'Fest · Events · Scenic · Reviews');
});

test('MOONi companion curation link shows only for the companion chip', () => {
  assert.equal(shouldShowMooniCompanionCurationLink('companion'), true);
  assert.equal(shouldShowMooniCompanionCurationLink('food'), false);
  assert.equal(shouldShowMooniCompanionCurationLink(null), false);
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
});

test('home menu and MOONi answer wire review hub without flag or quicklink analytics', () => {
  const home = readFileSync(join(root, 'src/pages/Home/components/HomeUI.jsx'), 'utf8');
  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  const arrival = readFileSync(
    join(root, 'src/logbookOfficialReviews/logbookReviewHubArrival.js'),
    'utf8',
  );
  const mooniLink = readFileSync(join(root, 'src/components/chat/MooniCompanionCurationLink.jsx'), 'utf8');
  assert.match(home, /REVIEW_HUB_QUICK_LINK/);
  assert.match(home, /item\.key === 'curation' \? REVIEW_HUB_QUICK_LINK : item/);
  assert.doesNotMatch(home, /isQuicklinkReviewTabActive/);
  assert.doesNotMatch(home, /quicklinkAnalytics/);
  assert.match(home, /to: REVIEW_HUB_HREF/);
  assert.match(arrival, /REVIEW_HUB_HREF = `\/blog\$\{REVIEW_HUB_HASH\}`/);
  assert.match(chat, /MooniCompanionCurationLink/);
  assert.match(chat, /replyChipId/);
  assert.doesNotMatch(mooniLink, /quicklinkAnalytics/);
  assert.doesNotMatch(mooniLink, /isQuicklinkReviewTabActive/);
  assert.match(mooniLink, /to="\/blog\/curation"/);
});

test('rendered companion link targets AI curation without analytics hooks', async () => {
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
  const link = window.document.querySelector('[data-testid="mooni-companion-curation-link"]');
  assert.ok(link, window.document.body.innerHTML);
  assert.equal(link.getAttribute('href'), '/blog/curation');
  assert.equal(link.textContent, '취향에 맞는 여행지 더 찾기 → AI 큐레이션');

  await act(async () => {
    reactRoot.unmount();
  });
  for (const [name, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});
