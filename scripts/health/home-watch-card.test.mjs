import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  HOME_WATCH_CARD_QUERY_PARAM,
  isGateoHomeWatchCardEnabled,
  isGateoSelfReelsEnabled,
  isHomeWatchCardQueryEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  buildLogbookReviewerFilterHref,
  parseLogbookReviewFilterFromSearch,
} from '../../src/logbookOfficialReviews/logbookReviewFilterUrl.js';
import {
  filterLogbookOfficialReviewRows,
  LOGBOOK_REVIEW_FILTER_MAJOR,
} from '../../src/logbookOfficialReviews/groupLogbookOfficialReviews.js';
import {
  HOME_WATCH_CONTINUE_LIMIT,
  mergeHomeWatchContinueItems,
  readHomeWatchContinueItems,
} from '../../src/pages/Home/lib/homeWatchContinue.js';
import { RECENT_VISITED_KEY } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { FAVORITES_KEY, VIEWED_KEY } from '../../src/pages/Korea/festivalPersonalStore.js';
import { TRAVEL_AGENCY_VISITS_KEY } from '../../src/utils/travelAgencyVisits.js';
import { LOGBOOK_REVIEW_HUB_SESSION_KEY } from '../../src/logbookOfficialReviews/logbookReviewHubSession.js';
import { LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY } from '../../src/logbookOfficialReviews/logbookReviewHubListCache.js';
import {
  HOME_WATCH_DISMISS_KEY,
  HOME_WATCH_DISMISS_MS,
  buildHomeWatchSlots,
  dismissHomeWatchCard,
  homeWatchClickParams,
  homeWatchDismissParams,
  homeWatchViewParams,
  isHomeWatchDismissed,
  rectsOverlap,
  shouldHideHomeWatchCard,
} from '../../src/pages/Home/lib/homeWatchCardModel.js';

const NOW = 1_763_900_000_000;

test('home watch card flag defaults off', () => {
  const cardKey = GATEO_ENV_FLAG_NAMES.HOME_WATCH_CARD;
  const reelsKey = GATEO_ENV_FLAG_NAMES.SELF_REELS;
  const prevCard = globalThis.__VITE_ENV__[cardKey];
  const prevReels = globalThis.__VITE_ENV__[reelsKey];
  try {
    globalThis.__VITE_ENV__[cardKey] = '';
    globalThis.__VITE_ENV__[reelsKey] = '';
    assert.equal(isGateoHomeWatchCardEnabled(), false);
    assert.equal(isGateoSelfReelsEnabled(), false);
    assert.equal(isHomeWatchCardQueryEnabled(`?${HOME_WATCH_CARD_QUERY_PARAM}=1`), true);
    assert.equal(isHomeWatchCardQueryEnabled(''), false);
    globalThis.__VITE_ENV__[cardKey] = '1';
    assert.equal(isGateoHomeWatchCardEnabled(), true);
  } finally {
    globalThis.__VITE_ENV__[cardKey] = prevCard;
    globalThis.__VITE_ENV__[reelsKey] = prevReels;
  }
});

test('mergeHomeWatchContinueItems is newest-first and keeps three', () => {
  const items = mergeHomeWatchContinueItems({
    now: NOW,
    visited: [
      { name: '교토', slug: 'kyoto' },
      { name: '이름만' },
    ],
    agencyVisits: [
      {
        agencyId: 'klook',
        href: 'https://www.klook.com/activity/1',
        placeLabel: '클룩 교토',
        visitedAt: NOW - 50_000,
      },
    ],
    festivalViewed: [
      { contentId: '100', title: '빛축제', viewedAt: NOW - 10_000 },
    ],
    festivalFavorites: [
      { contentId: '100', title: '빛축제', savedAt: NOW - 20_000 },
      { contentId: '200', title: '불꽃축제', savedAt: NOW - 5_000 },
    ],
    logbookSession: {
      savedAt: NOW - 80_000,
      returnTo: '/blog?region=overseas',
      anchorReviewId: 'rev-1',
    },
    logbookRows: [
      { id: 'rev-1', place_name: '파리', place_slug: 'paris', persona_label: 'GATEO 리뷰어 · 야경렌즈' },
    ],
  });

  assert.equal(items.length, HOME_WATCH_CONTINUE_LIMIT);
  assert.deepEqual(items.map((item) => item.name), ['교토', '불꽃축제', '빛축제']);
  assert.equal(items[0].source, 'visited');
  assert.equal(items[0].href, '/place/kyoto');
  assert.equal(items[0].subtitleKey, 'home.watchCard.continueVisited');
  assert.equal(items[1].source, 'festivalFavorite');
  assert.equal(items[1].subtitleKey, 'home.watchCard.continueFestivalFavorite');
  assert.equal(items[2].source, 'festivalViewed');
  assert.equal(items[2].href, '/korea?festival=100');
  assert.equal(items.some((item) => item.name === '이름만'), false);
});

test('mergeHomeWatchContinueItems keeps the logbook reviewer and does not write storage', () => {
  const writes = [];
  const local = {
    getItem(key) {
      if (key === RECENT_VISITED_KEY) {
        return JSON.stringify([{ name: '제주', slug: 'jeju' }]);
      }
      if (key === TRAVEL_AGENCY_VISITS_KEY) return '[]';
      if (key === VIEWED_KEY) return '[]';
      if (key === FAVORITES_KEY) return '[]';
      return null;
    },
    setItem(key) {
      writes.push(key);
    },
  };
  const session = {
    getItem(key) {
      if (key === LOGBOOK_REVIEW_HUB_SESSION_KEY) {
        return JSON.stringify({
          savedAt: NOW + 10,
          returnTo: '/blog',
          anchorReviewId: 'rev-9',
        });
      }
      if (key === LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY) {
        return JSON.stringify([
          { id: 'rev-9', place_name: '프라하', place_slug: 'prague', persona_label: '느린산책' },
        ]);
      }
      return null;
    },
    setItem(key) {
      writes.push(key);
    },
  };

  const items = readHomeWatchContinueItems(NOW, { localStorage: local, sessionStorage: session });
  assert.equal(writes.length, 0);
  assert.equal(items[0].source, 'logbook');
  assert.equal(items[0].name, '프라하');
  assert.equal(items[0].reviewer, '느린산책');
  assert.equal(items[0].subtitleKey, 'home.watchCard.continueReview');
  assert.equal(items[1].name, '제주');
});

test('buildHomeWatchSlots fills 3 or 4 and reserves reels for the last slot', () => {
  const destinations = ['kyoto', 'jeju', 'dubai', 'melbourne', 'phu-quoc'].map((slug) => ({
    slug,
    name: slug,
    href: `/place/${slug}`,
    imageUrl: 'https://example.test/photo.jpg',
    reason: '이달의 포인트',
    reviewer: slug === 'kyoto' ? '야경렌즈' : '',
  }));
  const continueItems = [
    { source: 'visited', name: '부산', href: '/place/busan', subtitleKey: 'home.watchCard.continueVisited' },
  ];

  const mobile = buildHomeWatchSlots({ continueItems, destinations, slotCount: 3, reelsEnabled: false });
  assert.deepEqual(mobile.map((slot) => slot.type), ['continue', 'destination', 'destination']);
  assert.equal(mobile[1].slug, 'kyoto');
  assert.equal(mobile[1].reviewerHref, '/blog?reviewer=%EC%95%BC%EA%B2%BD%EB%A0%8C%EC%A6%88');

  const wideReels = buildHomeWatchSlots({
    continueItems,
    destinations,
    slotCount: 4,
    reelsEnabled: true,
    reelsPoster: 'https://example.test/poster.webp',
  });
  assert.deepEqual(wideReels.map((slot) => slot.type), ['continue', 'destination', 'destination', 'reels']);
  assert.equal(wideReels.at(-1).href, '/reels');
  assert.equal(wideReels.at(-1).poster, 'https://example.test/poster.webp');
  assert.equal(wideReels.some((slot) => slot.type === 'reels' && slot.href !== '/reels'), false);

  const noHistory = buildHomeWatchSlots({ destinations, slotCount: 3, reelsEnabled: false });
  assert.equal(noHistory.some((slot) => slot.type === 'continue' || slot.type === 'reels'), false);
  assert.equal(noHistory.length, 3);
});

test('dismiss stores only a 7-day timestamp', () => {
  const saved = new Map();
  const storage = {
    getItem: (key) => (saved.has(key) ? saved.get(key) : null),
    setItem: (key, value) => saved.set(key, value),
  };
  assert.equal(isHomeWatchDismissed(NOW, storage), false);
  const until = dismissHomeWatchCard(NOW, storage);
  assert.equal(until - NOW, HOME_WATCH_DISMISS_MS);
  assert.equal(saved.size, 1);
  assert.equal(saved.has(HOME_WATCH_DISMISS_KEY), true);
  assert.equal(isHomeWatchDismissed(NOW + HOME_WATCH_DISMISS_MS - 1, storage), true);
  assert.equal(isHomeWatchDismissed(NOW + HOME_WATCH_DISMISS_MS, storage), false);
  assert.match(saved.get(HOME_WATCH_DISMISS_KEY), /^\d+$/);
});

test('home watch card hides for place, explore, MOONi, cinema, and site notice', () => {
  assert.equal(shouldHideHomeWatchCard(), false);
  for (const key of ['placeCard', 'explore', 'mooniChat', 'cinema', 'siteNotice']) {
    assert.equal(shouldHideHomeWatchCard({ [key]: true }), true);
  }
});

test('reviewer filter reuses the logbook list filter', () => {
  const rows = [
    { id: '1', place_slug: 'paris', persona_label: '야경렌즈' },
    { id: '2', place_slug: 'prague', persona_label: 'GATEO 리뷰어 · 느린산책' },
    { id: '3', place_slug: 'jeju', persona_label: '야경렌즈' },
  ];
  const filtered = filterLogbookOfficialReviewRows(rows, LOGBOOK_REVIEW_FILTER_MAJOR.ALL, null, '야경렌즈');
  assert.deepEqual(filtered.map((row) => row.id), ['1', '3']);
  const parsed = parseLogbookReviewFilterFromSearch('?reviewer=느린산책&region=overseas');
  assert.equal(parsed.reviewer, '느린산책');
  assert.equal(parsed.major, 'overseas');
  assert.equal(buildLogbookReviewerFilterHref('GATEO 리뷰어 · 야경렌즈'), '/blog?reviewer=%EC%95%BC%EA%B2%BD%EB%A0%8C%EC%A6%88');
});

test('home watch analytics params carry slot type only', () => {
  assert.deepEqual(homeWatchViewParams(3), { slot_count: 3 });
  assert.deepEqual(homeWatchClickParams('destination'), { slot_type: 'destination' });
  assert.deepEqual(homeWatchDismissParams(), {});
  const blob = JSON.stringify({
    ...homeWatchViewParams(4),
    ...homeWatchClickParams('reels'),
    ...homeWatchDismissParams(),
  });
  assert.equal(blob.includes('kyoto') || blob.includes('교토'), false);
});

test('rectsOverlap measures MOONi clearance', () => {
  const card = { left: 12, right: 378, top: 615, bottom: 700 };
  const mooni = { left: 294, right: 374, top: 708, bottom: 812 };
  assert.equal(rectsOverlap(card, mooni), false);
  assert.equal(rectsOverlap(card, { left: 300, right: 370, top: 640, bottom: 720 }), true);
});
