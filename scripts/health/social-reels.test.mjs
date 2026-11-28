import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test, { after, beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fileURLToPath } from 'node:url';

const NOW = new Date('2026-11-27T03:00:00.000Z');
const FLAG_OFF_HTML_SHA256 = '07a6232f076fb7011431fca73c82bb0d3a1140df799a1e365b08611938d85d37';

globalThis.__GATEO_DISABLE_SOCIAL_PHOTO_FETCH__ = true;
globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ || {}),
  VITE_GATEO_SOCIAL_LINKS: '',
  VITE_GATEO_SOCIAL_REELS: '',
  VITE_GATEO_SOCIAL_LIKES: '',
};

const { default: SocialLinksPage } = await import('../../src/pages/Social/SocialLinksPage.jsx');
const {
  buildSocialReelPlaylist,
  formatSocialReelCredit,
  isLivePostedSocialCard,
  normalizeSocialReel,
  splitSocialReelCreditLines,
} = await import('../../src/pages/Social/socialReels.js');
const { isGateoSocialLikesEnabled } = await import('../../src/shared/gateoFeatureFlags.js');
const {
  SOCIAL_REEL_LIKE_FAIL_TOAST,
  SOCIAL_REEL_LIKE_LOGIN_PROMPT,
  isSocialReelLikeRpcMissing,
  shouldShowSocialReelLikeCount,
} = await import('../../src/pages/Social/socialReelLikes.js');
const { attachMp4Source, createSocialReelSession } = await import('../../src/pages/Social/socialReelPlayback.js');
const catalog = await import('../../src/pages/Social/data/socialReels.json', { with: { type: 'json' } });

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
setGlobal('KeyboardEvent', window.KeyboardEvent);
setGlobal('Event', window.Event);
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));

class IntersectionObserverStub {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    this.callback([{ isIntersecting: true, intersectionRatio: 0.75, target: element }]);
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

function placeCard(id, day, title, slug, status = 'live') {
  return {
    campaignId: id,
    status,
    firstPostedAt: `2026-11-${String(day).padStart(2, '0')}`,
    title,
    region: '제주 샘플',
    photoUrl: `https://example.test/${id}.jpg`,
    photoCredit: null,
    targets: [{ type: 'place', slug: slug || id }],
  };
}

const sampleCards = [
  {
    campaignId: 'reel-14',
    status: 'live',
    firstPostedAt: '2026-11-27',
    title: '샘플 최근',
    region: '경북 샘플',
    photoUrl: 'https://tong.visitkorea.or.kr/cms/resource/19/4081219_image2_1.jpg',
    photoCredit: { kind: 'kto', label: '한국관광공사' },
    targets: [
      { type: 'place', slug: 'tour-126201' },
      { type: 'place', slug: 'tour-127190', name: '화순 고인돌군' },
    ],
  },
  {
    campaignId: 'fest-9001',
    status: 'live',
    firstPostedAt: '2026-11-26',
    title: '샘플 종료 축제',
    region: '부산 샘플',
    photoUrl: null,
    photoCredit: null,
    targets: [
      { type: 'festival', id: '9001', eventStartDate: '20261101', eventEndDate: '20261108' },
    ],
  },
  {
    campaignId: 'fest-9002',
    status: 'live',
    firstPostedAt: '2026-11-25',
    title: '샘플 곧 시작',
    region: '부산 샘플',
    photoUrl: null,
    photoCredit: null,
    targets: [
      { type: 'festival', id: '9002', eventStartDate: '20261128', eventEndDate: '20270110' },
    ],
  },
  {
    campaignId: 'reel-1',
    status: 'live',
    firstPostedAt: '2026-11-01',
    title: '샘플 지난 장소',
    region: '제주 샘플',
    photoUrl: null,
    photoCredit: null,
    targets: [{ type: 'place', slug: 'sample-1' }],
  },
];

const flagOffReels = [
  {
    campaignId: 'reel-14',
    kind: 'mp4',
    src: 'https://example.test/reel-14.mp4',
    poster: 'https://example.test/reel-14.jpg',
    durationSec: 8,
    credit: '한국관광공사',
  },
];

const orderedCards = [
  placeCard('reel-new', 20, '새 릴스', 'jeju-new'),
  placeCard('reel-old', 2, '옛 릴스', 'busan-old'),
  {
    campaignId: 'fest-old',
    status: 'live',
    firstPostedAt: '2026-11-01',
    title: '끝난 축제',
    region: '부산 샘플',
    photoUrl: 'https://example.test/fest-old.jpg',
    photoCredit: null,
    targets: [{ type: 'festival', id: '42', eventStartDate: '20261101', eventEndDate: '20261102' }],
  },
];

const orderedReels = [
  {
    campaignId: 'fest-old',
    kind: 'mp4',
    src: 'https://example.test/fest.mp4',
    poster: 'https://example.test/fest.jpg',
    durationSec: 4,
    credit: '출처: 축제 자료',
  },
  {
    campaignId: 'reel-old',
    kind: 'mp4',
    src: 'https://example.test/old.mp4',
    poster: 'https://example.test/old.jpg',
    durationSec: 5,
    credit: '옛 자료',
  },
  {
    campaignId: 'reel-new',
    kind: 'mp4',
    src: 'https://example.test/new.mp4',
    poster: 'https://example.test/new.jpg',
    durationSec: 6,
    credit: '한국관광공사',
  },
  {
    campaignId: 'not-a-card',
    kind: 'mp4',
    src: 'https://example.test/nope.mp4',
    poster: 'https://example.test/nope.jpg',
    durationSec: 3,
    credit: '없음',
  },
  {
    campaignId: 'reel-new',
    kind: 'mp4',
    src: 'https://example.test/duplicate.mp4',
    poster: 'https://example.test/duplicate.jpg',
    durationSec: 9,
    credit: '중복',
  },
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
          path: '/auth/login',
          element: React.createElement('div', { 'data-testid': 'auth-login' }, 'login'),
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
  const path = entry.split('?')[0] || '/social';
  const query = entry.includes('?') ? `?${entry.slice(entry.indexOf('?') + 1)}` : '';
  try {
    window.history.replaceState({}, '', `${path}${query}`);
  } catch {
    /* jsdom */
  }
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

function setReducedMotion(on) {
  window.matchMedia = (query) => ({
    matches: Boolean(on) && String(query).includes('prefers-reduced-motion'),
    media: String(query),
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  });
}

async function openPlayer() {
  await act(async () => {
    document.querySelector('[data-testid="social-reels-open"]').click();
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function player() {
  return document.querySelector('[data-testid="social-reel-player"]');
}

function video() {
  return document.querySelector('[data-testid="social-reel-video"]');
}

async function pointerSwipe(dy) {
  const node = player();
  await act(async () => {
    node.dispatchEvent(
      new window.PointerEvent('pointerdown', {
        clientX: 80,
        clientY: 300,
        pointerId: 1,
        bubbles: true,
      }),
    );
    node.dispatchEvent(
      new window.PointerEvent('pointerup', {
        clientX: 80,
        clientY: 300 + dy,
        pointerId: 1,
        bubbles: true,
      }),
    );
  });
}

async function key(name) {
  await act(async () => {
    window.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }),
    );
  });
}

beforeEach(() => {
  globalThis.__VITE_ENV__.VITE_GATEO_SOCIAL_REELS = '';
  globalThis.__VITE_ENV__.VITE_GATEO_SOCIAL_LIKES = '';
  delete window.__GATEO_SOCIAL_REELS_FIXTURE__;
  delete window.__GATEO_SOCIAL_REEL_LIKE_API__;
  delete window.__GATEO_SOCIAL_REEL_RPC_AUDIT__;
  setReducedMotion(false);
  window.__GATEO_GA_DISABLED__ = true;
  window.__GATEO_GA_EVENTS__ = [];
  window.__GATEO_SOCIAL_CARD_VIEWS__ = new Set();
  window.sessionStorage.clear();
});

after(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = undefined;
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
    container = undefined;
  }
  dom.window.close();
});

const SHIPPED_REEL_IDS = [
  'reel-14',
  'reel-13',
  'reel-10',
  'reel-11',
  'reel-09',
  'reel-06',
  'reel-08',
  'reel-07',
  'reel-05',
  'reel-03',
  'reel-04',
  'reel-02',
  'reel-01',
];

test('shipped manifest is the 13 live reels and resolves the public base', () => {
  const playback = fs.readFileSync(
    fileURLToPath(new URL('../../src/pages/Social/socialReelPlayback.js', import.meta.url)),
    'utf8',
  );
  const playerSource = fs.readFileSync(
    fileURLToPath(new URL('../../src/pages/Social/SocialReelsPlayer.jsx', import.meta.url)),
    'utf8',
  );
  assert.equal(playback.includes('hls.js'), false);
  assert.equal(playerSource.includes('hls.js'), false);
  assert.equal(/crossorigin/i.test(playback), false);
  assert.equal(/crossorigin/i.test(playerSource), false);
  assert.equal(playback.includes('r2.dev'), false);
  assert.equal(playerSource.includes('r2.dev'), false);
  assert.equal(fs.existsSync(fileURLToPath(new URL('../../src/pages/Social/socialReelHls.js', import.meta.url))), false);
  assert.match(playback, /attachMp4Source/);
  assert.match(playerSource, /preload="metadata"/);
  assert.match(playerSource, /object-contain/);
  assert.equal(playerSource.includes('object-cover'), false);
  assert.match(playerSource, /28\.125dvh/);

  assert.deepEqual(
    catalog.default.reels.map((reel) => reel.campaignId),
    SHIPPED_REEL_IDS,
  );
  for (const id of ['reel-12', 'reel-15', 'reel-16']) {
    assert.equal(catalog.default.reels.some((reel) => reel.campaignId === id), false);
  }
  for (const reel of catalog.default.reels) {
    assert.equal(reel.kind, 'mp4');
    assert.match(reel.src, /^site\/reels\/reel-\d+\.mp4$/);
    assert.match(reel.poster, /^site\/reels\/reel-\d+\.jpg$/);
  }

  const previousBase = globalThis.__VITE_ENV__.VITE_GATEO_REELS_BASE_URL;
  try {
    globalThis.__VITE_ENV__.VITE_GATEO_REELS_BASE_URL = '';
    const resolved = normalizeSocialReel(catalog.default.reels[0]);
    assert.equal(
      resolved.src,
      'https://reels.findable.kr/site/reels/reel-14.mp4',
    );
    assert.equal(
      resolved.poster,
      'https://reels.findable.kr/site/reels/reel-14.jpg',
    );
    globalThis.__VITE_ENV__.VITE_GATEO_REELS_BASE_URL = 'https://media.gateo.kr/';
    assert.equal(
      normalizeSocialReel(catalog.default.reels[0]).src,
      'https://media.gateo.kr/site/reels/reel-14.mp4',
    );
  } finally {
    globalThis.__VITE_ENV__.VITE_GATEO_REELS_BASE_URL = previousBase;
  }

  const generated = JSON.parse(
    fs.readFileSync(
      fileURLToPath(new URL('../../src/pages/Social/data/socialLinks.generated.json', import.meta.url)),
      'utf8',
    ),
  );
  const playlist = buildSocialReelPlaylist(generated.cards, catalog.default.reels, NOW);
  assert.deepEqual(
    playlist.map((item) => item.campaignId),
    SHIPPED_REEL_IDS,
  );
  assert.equal(playlist[0].href, '/place/tour-126201');
  assert.equal(playlist[0].placeLabel, '이 여행지 보기');
  assert.match(playlist[0].creditText, /^출처: 국가유산청/);
});

test('playlist follows card order, keeps the first row, and prefixes 출처', () => {
  assert.equal(formatSocialReelCredit('한국관광공사'), '출처: 한국관광공사');
  assert.equal(formatSocialReelCredit('출처: 이미 있음'), '출처: 이미 있음');
  assert.equal(formatSocialReelCredit(''), '');
  assert.equal(normalizeSocialReel({ campaignId: 'a', kind: 'wav', src: 'https://example.test/a.wav' }), null);
  assert.equal(normalizeSocialReel({ campaignId: 'a', kind: 'hls', src: 'https://example.test/a.m3u8' }), null);

  const playlist = buildSocialReelPlaylist(orderedCards, orderedReels, NOW);
  assert.deepEqual(
    playlist.map((item) => item.campaignId),
    ['reel-new', 'reel-old', 'fest-old'],
  );
  assert.equal(playlist[0].reel.src, 'https://example.test/new.mp4');
  assert.equal(playlist[0].reel.kind, 'mp4');
  assert.equal(playlist[0].href, '/place/jeju-new');
  assert.equal(playlist[0].placeName, '새 릴스');
  assert.equal(playlist[0].placeLabel, '이 여행지 보기');
  assert.equal(playlist[0].creditText, '출처: 한국관광공사');
  const named = buildSocialReelPlaylist(
    [
      {
        ...orderedCards[0],
        title: '카드 제목',
        targets: [{ type: 'place', slug: 'jeju-new', name: '이름 우선' }],
      },
    ],
    orderedReels,
    NOW,
  );
  assert.equal(named[0].placeName, '이름 우선');
  assert.equal(named[0].href, '/place/jeju-new');
  assert.equal(playlist[2].href, '/korea?festival=42');
  assert.equal(playlist[2].placeLabel, '이 축제 보기');
  assert.equal(playlist[2].creditText, '출처: 축제 자료');
  assert.equal(playlist[0].reel.durationSec, 6);
});

test('playlist keeps live posted cards and drops unposted reels 12, 15, and 16', () => {
  const unposted = [
    placeCard('reel-12', 27, '가야고분군', 'gaya-tombs', 'draft'),
    placeCard('reel-15', 26, '미게시 15', 'unposted-15', 'unconfirmed'),
    placeCard('reel-16', 25, '미게시 16', 'unposted-16', 'deleted'),
    placeCard('reel-11', 18, '상태 없음', 'tour-2615234', ''),
  ];
  const live = placeCard('reel-14', 27, '영주 소수서원', 'tour-126201');
  const reels = [live, ...unposted].map((card) => ({
    campaignId: card.campaignId,
    kind: 'mp4',
    src: `https://example.test/${card.campaignId}.mp4`,
    poster: `https://example.test/${card.campaignId}.jpg`,
    durationSec: 4,
    credit: card.title,
  }));
  const playlist = buildSocialReelPlaylist([live, ...unposted], reels, NOW);
  assert.deepEqual(
    playlist.map((item) => item.campaignId),
    ['reel-14'],
  );
  assert.equal(isLivePostedSocialCard(live), true);
  assert.equal(isLivePostedSocialCard(unposted[0]), false);

  const generated = JSON.parse(
    fs.readFileSync(
      fileURLToPath(new URL('../../src/pages/Social/data/socialLinks.generated.json', import.meta.url)),
      'utf8',
    ),
  );
  const published = buildSocialReelPlaylist(
    generated.cards,
    reels.filter((reel) => reel.campaignId !== 'reel-11'),
    NOW,
  );
  assert.deepEqual(
    published.map((item) => item.campaignId),
    ['reel-14'],
  );
  for (const id of ['reel-12', 'reel-15', 'reel-16']) {
    assert.equal(generated.cards.some((card) => card.campaignId === id), false);
  }
});

test('flag off matches the pre-change /social HTML with reel data present', async () => {
  await render('/social?social_links=1&qa=1', {
    cards: sampleCards,
    now: NOW,
    reels: flagOffReels,
  });
  const html = container.innerHTML;
  const htmlSha = createHash('sha256').update(html).digest('hex');
  assert.equal(htmlSha, FLAG_OFF_HTML_SHA256);
  assert.equal(container.querySelectorAll('button').length, 0);
  assert.equal(document.querySelector('[data-testid="social-reels-open"]'), null);
  assert.equal(document.querySelector('video'), null);
  assert.equal(document.querySelector('[data-testid="social-hero"]').getAttribute('href'), '/place/tour-126201');
});

test('flag on with an empty catalog keeps the entry hidden', async () => {
  globalThis.__VITE_ENV__.VITE_GATEO_SOCIAL_REELS = '1';
  await render('/social?social_links=1', { cards: sampleCards, now: NOW, reels: [] });
  assert.equal(document.querySelector('[data-testid="social-reels-open"]'), null);
  assert.equal(document.querySelector('video'), null);

  await render('/social?social_links=1&social_reels=1', {
    cards: sampleCards,
    now: NOW,
    reels: [],
  });
  assert.equal(document.querySelector('[data-testid="social-reels-open"]'), null);
});

test('player order, credit, place target, poster preload, and one video element', async () => {
  await render('/social?social_links=1&social_reels=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  assert.equal(document.querySelector('[data-testid="social-reels-open"]').textContent, '지난 릴스 보기');
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');
  await openPlayer();
  const node = video();
  assert.equal(document.querySelectorAll('[data-testid="social-reel-video"]').length, 1);
  assert.equal(document.querySelectorAll('video').length, 2);
  assert.match(
    document.querySelector('[data-testid="social-reel-video-preload"]').getAttribute('src'),
    /old\.mp4$/,
  );
  assert.match(document.querySelector('[data-testid="social-reel-track"]').style.transform, /calc\(0%/);
  assert.match(document.querySelector('[data-testid="social-reel-track"]').style.transition, /transform/);
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');
  assert.equal(node.muted, true);
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').getAttribute('data-muted'), 'true');
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').textContent, '소리 켜기');
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').getAttribute('aria-label'), '소리 켜기');
  assert.equal(document.querySelector('[data-testid="social-reel-close"]').getAttribute('aria-label'), '닫기');
  assert.match(node.getAttribute('src'), /new\.mp4$/);
  assert.equal(node.getAttribute('playsinline'), '');
  assert.equal(node.getAttribute('preload'), 'metadata');
  assert.match(node.className, /object-contain/);
  assert.doesNotMatch(node.className, /object-cover/);
  assert.equal(node.hasAttribute('autoplay'), true);
  const chrome = document.querySelector('[data-testid="social-reel-chrome"]');
  assert.equal(chrome.contains(document.querySelector('[data-testid="social-reel-credit"]')), true);
  assert.equal(chrome.contains(document.querySelector('[data-testid="social-reel-place"]')), true);
  assert.match(chrome.className, /28\.125dvh/);
  assert.equal(node.muted, true);
  assert.equal(document.querySelector('[data-testid="social-reel-credit-source"]').textContent, '출처: 한국관광공사');
  assert.equal(document.querySelector('[data-testid="social-reel-place-name"]').textContent, '새 릴스');
  assert.equal(document.querySelector('[data-testid="social-reel-place"]').textContent, '이 여행지 보기');
  assert.doesNotMatch(document.querySelector('[data-testid="social-reel-place"]').className, /\bh-12\b/);
  assert.equal(document.querySelector('[data-testid="social-reel-place"]').getAttribute('href'), '/place/jeju-new');
  assert.equal(document.querySelector('[data-testid="social-reel-like"]'), null);
  assert.equal(document.querySelector('[data-testid="social-reel-comment"]'), null);
  assert.equal(
    document.querySelector('[data-testid="social-reel-next-poster"]').getAttribute('src'),
    'https://example.test/old.jpg',
  );
  assert.match(player().textContent, /위아래 키로 옮겨요/);

  await act(async () => {
    node.dispatchEvent(new window.Event('ended'));
  });
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
  assert.equal(document.querySelectorAll('[data-testid="social-reel-video"]').length, 1);
  assert.equal(document.querySelectorAll('video').length, 3);
  assert.notEqual(video(), node);
  assert.equal(node.isConnected, true);
  assert.equal(node.getAttribute('data-active'), 'false');
  assert.match(node.getAttribute('src'), /new\.mp4$/);
  assert.equal(video().getAttribute('data-active'), 'true');
  assert.match(video().getAttribute('src'), /old\.mp4$/);
  assert.match(document.querySelector('[data-testid="social-reel-track"]').style.transform, /calc\(-100%/);
  assert.equal(document.querySelector('[data-testid="social-reel-credit-source"]').textContent, '출처: 옛 자료');

  await act(async () => {
    document.querySelector('[data-testid="social-reel-mute"]').click();
  });
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').textContent, '소리 끄기');
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').getAttribute('data-muted'), 'false');
  assert.equal(video().muted, false);
});

test('swipe and keyboard move between reels and Esc closes', async () => {
  await render('/social?social_reels=1&social_links=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  await openPlayer();
  await pointerSwipe(-160);
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
  await pointerSwipe(160);
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');
  await pointerSwipe(-20);
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');
  await act(async () => {
    player().dispatchEvent(
      new window.PointerEvent('pointerdown', { clientX: 10, clientY: 200, pointerId: 2, bubbles: true }),
    );
    player().dispatchEvent(
      new window.PointerEvent('pointerup', { clientX: 200, clientY: 210, pointerId: 2, bubbles: true }),
    );
  });
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');

  await key('ArrowDown');
  await key('ArrowDown');
  assert.equal(player().getAttribute('data-campaign'), 'fest-old');
  assert.equal(document.querySelector('[data-testid="social-reel-place"]').getAttribute('href'), '/korea?festival=42');
  assert.equal(document.querySelector('[data-testid="social-reel-place"]').textContent, '이 축제 보기');
  assert.equal(document.querySelector('[data-testid="social-reel-next-poster"]'), null);
  await act(async () => {
    video().dispatchEvent(new window.Event('ended'));
  });
  assert.equal(player().getAttribute('data-campaign'), 'fest-old');

  await key('ArrowUp');
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
  await key('Escape');
  assert.equal(player(), null);
  assert.equal(document.querySelector('[data-testid="social-reels-open"]').textContent, '지난 릴스 보기');
});

test('reduced motion does not autoplay or advance when the video ends', async () => {
  setReducedMotion(true);
  await render('/social?social_reels=1&social_links=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  await openPlayer();
  assert.equal(player().getAttribute('data-reduced-motion'), '1');
  assert.equal(video().autoplay, false);
  assert.equal(video().hasAttribute('autoplay'), false);
  assert.equal(document.querySelector('[data-testid="social-reel-track"]').style.transition, 'none');
  await act(async () => {
    video().dispatchEvent(new window.Event('ended'));
  });
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');
  await key('ArrowDown');
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
});

test('capture fixture is ignored unless the flag is on', async () => {
  window.__GATEO_SOCIAL_REELS_FIXTURE__ = flagOffReels;
  await render('/social?social_links=1', { cards: sampleCards, now: NOW });
  assert.equal(document.querySelector('[data-testid="social-reels-open"]'), null);

  await render('/social?social_links=1&social_reels=1', { cards: sampleCards, now: NOW });
  assert.equal(document.querySelector('[data-testid="social-reels-open"]').textContent, '지난 릴스 보기');
  await openPlayer();
  assert.equal(player().getAttribute('data-campaign'), 'reel-14');
  assert.equal(document.querySelector('[data-testid="social-reel-place"]').getAttribute('href'), '/place/tour-126201');
});

function setWidth(width) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

const WHEEL_WAIT_MS = 460;

test('one swipe or wheel moves exactly one reel and back', async () => {
  setWidth(390);
  await render('/social?social_reels=1&social_links=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  await openPlayer();
  await pointerSwipe(-2400);
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
  assert.equal(player().getAttribute('data-index'), '1');
  await pointerSwipe(2400);
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');
  await pointerSwipe(-160);
  await pointerSwipe(-160);
  assert.equal(player().getAttribute('data-campaign'), 'fest-old');

  setWidth(1280);
  await render('/social?social_reels=1&social_links=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  await openPlayer();
  await act(async () => {
    window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 900, bubbles: true, cancelable: true }));
    window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 900, bubbles: true, cancelable: true }));
  });
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, WHEEL_WAIT_MS));
  });
  await act(async () => {
    window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: -40, bubbles: true, cancelable: true }));
  });
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');

  setWidth(390);
  await act(async () => {
    window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }));
  });
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');
});

test('unmuted sound stays on for the next reel and a reopened player', async () => {
  await render('/social?social_reels=1&social_links=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  await openPlayer();
  assert.equal(video().muted, true);
  await act(async () => {
    document.querySelector('[data-testid="social-reel-mute"]').click();
  });
  assert.equal(window.sessionStorage.getItem('gateo_social_reel_sound'), 'on');
  await key('ArrowDown');
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
  assert.equal(video().muted, false);
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').textContent, '소리 끄기');
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').getAttribute('aria-label'), '소리 끄기');
  await key('Escape');
  assert.equal(player(), null);
  await openPlayer();
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').getAttribute('data-muted'), 'false');
  assert.equal(video().muted, false);
});

test('share falls back to copying the place URL', async () => {
  await render('/social?social_reels=1&social_links=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  await openPlayer();
  const nav = window.navigator;
  const previousShare = nav.share;
  const previousClipboard = nav.clipboard;
  const copied = [];
  const shared = [];
  try {
    Object.defineProperty(nav, 'share', {
      configurable: true,
      value: async (data) => {
        shared.push(data);
      },
    });
    Object.defineProperty(nav, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          copied.push(value);
        },
      },
    });
    await act(async () => {
      document.querySelector('[data-testid="social-reel-share"]').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(copied.length, 0);
    assert.equal(shared[0].url, 'https://www.gateo.kr/place/jeju-new');
    assert.equal(document.querySelector('[data-testid="social-reel-toast"]'), null);

    Object.defineProperty(nav, 'share', {
      configurable: true,
      value: async () => {
        const error = new Error('denied');
        error.name = 'NotAllowedError';
        throw error;
      },
    });
    await act(async () => {
      document.querySelector('[data-testid="social-reel-share"]').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.deepEqual(copied, ['https://www.gateo.kr/place/jeju-new']);
    assert.equal(document.querySelector('[data-testid="social-reel-toast"]').textContent, '링크를 복사했어요');

    copied.length = 0;
    Object.defineProperty(nav, 'share', { configurable: true, value: undefined });
    await key('ArrowDown');
    await key('ArrowDown');
    await act(async () => {
      document.querySelector('[data-testid="social-reel-share"]').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(copied[0], 'https://www.gateo.kr/korea?festival=42');
  } finally {
    Object.defineProperty(nav, 'share', { configurable: true, value: previousShare });
    Object.defineProperty(nav, 'clipboard', { configurable: true, value: previousClipboard });
  }
});

test('reel like flag defaults off and the query param turns it on', () => {
  assert.equal(shouldShowSocialReelLikeCount(10), false);
  assert.equal(shouldShowSocialReelLikeCount(11), true);
  assert.equal(shouldShowSocialReelLikeCount(0), false);
  assert.equal(shouldShowSocialReelLikeCount(null), false);
  assert.equal(isSocialReelLikeRpcMissing({ code: 'PGRST202', message: 'Could not find the function' }), true);
  assert.equal(isSocialReelLikeRpcMissing({ code: '42883', message: 'function does not exist' }), true);
  assert.equal(isSocialReelLikeRpcMissing({ message: 'network down' }), false);
  assert.equal(isGateoSocialLikesEnabled(''), false);
  assert.equal(isGateoSocialLikesEnabled('?social_reels=1'), false);
  assert.equal(isGateoSocialLikesEnabled('?social_likes=1'), true);
  const catalogCredit = splitSocialReelCreditLines(catalog.default.reels[0].credit);
  assert.deepEqual(
    catalogCredit.map((line) => line.text),
  [
    "출처: 국가유산청 '014. 한국의 서원'(2025)",
    '저작자: 국가유산청',
    '라이선스: 공공누리 제1유형',
    'GATEO 편집',
  ],
  );
  const longest = splitSocialReelCreditLines(catalog.default.reels.find((reel) => reel.campaignId === 'reel-13').credit);
  assert.equal(longest.some((line) => line.testId === 'social-reel-credit-author'), true);
  const paren = splitSocialReelCreditLines("출처: 국가유산청 '015. 한국의갯벌'(2025)(공공누리 제1유형) | GATEO 편집");
  assert.equal(paren.find((line) => line.id === 'license')?.text, '라이선스: 공공누리 제1유형');
  assert.match(paren.find((line) => line.id === 'source')?.text || '', /한국의갯벌/);
});

test('reels player with likes flag off makes no like RPC audit calls', async () => {
  window.__GATEO_SOCIAL_REEL_RPC_AUDIT__ = [];
  await render('/social?social_links=1&social_reels=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  await openPlayer();
  await flushPlayer();
  assert.deepEqual(window.__GATEO_SOCIAL_REEL_RPC_AUDIT__, []);
  assert.equal(document.querySelector('[data-testid="social-reel-like"]'), null);
  const credit = document.querySelector('[data-testid="social-reel-credit"]');
  assert.ok(credit);
  assert.doesNotMatch(credit.className, /truncate|line-clamp|text-overflow/);
  for (const node of credit.querySelectorAll('[data-testid]')) {
    assert.doesNotMatch(node.className || '', /truncate|line-clamp|text-overflow/);
  }
});

function likeApi(spec) {
  const calls = [];
  window.__GATEO_SOCIAL_REEL_LIKE_API__ = {
    calls,
    async readUser() {
      return spec.user ?? null;
    },
    async fetchState(ids) {
      calls.push(['fetch', ids.slice()]);
      if (spec.fetch) return spec.fetch(ids);
      return { counts: {}, mine: [] };
    },
    async toggle(id, desired) {
      calls.push(['toggle', id, desired]);
      if (spec.toggle) return spec.toggle(id, desired);
      return { error: { message: 'unset' } };
    },
  };
  return calls;
}

async function flushPlayer() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

test('like count is hidden at 10 and shown at 11, and the comment icon is absent', async () => {
  const calls = likeApi({
    user: { id: 'user-1' },
    fetch: () => ({
      counts: { 'reel-new': 11, 'reel-old': 10, 'fest-old': 0 },
      mine: ['reel-new'],
    }),
  });
  await render('/social?social_links=1&social_reels=1&social_likes=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels.map((reel) =>
      reel.campaignId === 'reel-new'
        ? {
            ...reel,
            credit:
              "출처: 국가유산청 '014. 한국의 서원'(2025) | 저작자: 국가유산청 | 라이선스: 공공누리 제1유형 | GATEO 편집",
          }
        : reel,
    ),
  });
  await openPlayer();
  await flushPlayer();
  assert.equal(document.querySelector('[data-testid="social-reel-comment"]'), null);
  const like = document.querySelector('[data-testid="social-reel-like"]');
  const share = document.querySelector('[data-testid="social-reel-share"]');
  assert.equal(like.disabled, false);
  assert.equal(like.getAttribute('aria-pressed'), 'true');
  assert.match(like.getAttribute('style') || '', /253,\s*164,\s*175/);
  assert.equal(document.querySelector('[data-testid="social-reel-like-count"]').textContent, '11');
  assert.match(share.className, /h-11/);
  assert.match(share.className, /w-11/);
  assert.match(share.className, /bg-black\/55/);
  assert.match(like.className, /h-11/);
  assert.match(like.className, /w-11/);
  assert.match(like.className, /bg-black\/55/);
  assert.match(document.querySelector('[data-testid="social-reel-rail"]').className, /gap-3/);
  assert.equal(document.querySelector('[data-testid="social-reel-credit-author"]').textContent, '저작자: 국가유산청');
  const license = document.querySelector('[data-testid="social-reel-credit-license"]');
  assert.equal(license.textContent, '라이선스: 공공누리 제1유형');
  assert.equal(document.querySelector('[data-testid="social-reel-credit-editorial"]').textContent, 'GATEO 편집');
  const credit = document.querySelector('[data-testid="social-reel-credit"]');
  assert.doesNotMatch(credit.className, /truncate|line-clamp|text-overflow/);
  for (const node of credit.querySelectorAll('[data-testid]')) {
    assert.doesNotMatch(node.className || '', /truncate|line-clamp|text-overflow/);
  }
  assert.match(document.querySelector('[data-testid="social-reel-credit-source"]').textContent, /한국의 서원/);
  assert.equal(calls.some((entry) => entry[0] === 'fetch'), true);

  await key('ArrowDown');
  await flushPlayer();
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
  assert.equal(document.querySelector('[data-testid="social-reel-like-count"]'), null);
  assert.equal(document.querySelector('[data-testid="social-reel-like"]').getAttribute('data-liked'), 'false');
  assert.equal(document.querySelector('[data-testid="social-reel-comment"]'), null);
});

test('logged-out like tap prompts login and does not call the RPC', async () => {
  const calls = likeApi({
    user: null,
    fetch: () => ({ counts: { 'reel-new': 12 }, mine: [] }),
  });
  const prompts = [];
  window.confirm = (message) => {
    prompts.push(message);
    return true;
  };
  await render('/social?social_links=1&social_reels=1&social_likes=1', {
    cards: orderedCards,
    now: NOW,
    reels: orderedReels,
  });
  await openPlayer();
  await flushPlayer();
  assert.equal(document.querySelector('[data-testid="social-reel-like-count"]').textContent, '12');
  await act(async () => {
    document.querySelector('[data-testid="social-reel-like"]').click();
  });
  await flushPlayer();
  assert.deepEqual(prompts, [SOCIAL_REEL_LIKE_LOGIN_PROMPT]);
  assert.equal(calls.some((entry) => entry[0] === 'toggle'), false);
  assert.equal(document.querySelector('[data-testid="auth-login"]').textContent, 'login');
});

test('a failed like rolls back the optimistic heart and shows the toast', async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => {
    errors.push(args.map(String).join(' '));
  };
  try {
    likeApi({
      user: { id: 'user-1' },
      fetch: () => ({ counts: { 'reel-new': 11 }, mine: ['reel-new'] }),
      toggle: () => gate.then(() => ({ error: { code: 'PGRST202', message: 'Could not find the function public.toggle_social_reel_like' } })),
    });
    await render('/social?social_links=1&social_reels=1&social_likes=1', {
      cards: orderedCards,
      now: NOW,
      reels: orderedReels,
    });
    await openPlayer();
    await flushPlayer();
    assert.equal(document.querySelector('[data-testid="social-reel-like-count"]').textContent, '11');
    await act(async () => {
      document.querySelector('[data-testid="social-reel-like"]').click();
    });
    await flushPlayer();
    assert.equal(document.querySelector('[data-testid="social-reel-like"]').getAttribute('aria-pressed'), 'false');
    assert.equal(document.querySelector('[data-testid="social-reel-like-count"]'), null);
    release();
    await act(async () => {
      await gate;
    });
    await flushPlayer();
    assert.equal(document.querySelector('[data-testid="social-reel-like"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('[data-testid="social-reel-like-count"]').textContent, '11');
    assert.equal(document.querySelector('[data-testid="social-reel-toast"]').textContent, SOCIAL_REEL_LIKE_FAIL_TOAST);
    assert.equal(errors.filter((line) => /toggle_social_reel_like|social_reel_like|PGRST202/i.test(line)).length, 0);
  } finally {
    console.error = originalError;
  }
});

test('mp4 assigns the public URL for Range playback and leaves an attach seam', async () => {
  function fakeVideo() {
    const attrs = {};
    return {
      attrs,
      src: '',
      muted: false,
      defaultMuted: false,
      playsInline: false,
      preload: '',
      setAttribute(name, value) {
        attrs[name] = value;
      },
      removeAttribute(name) {
        delete attrs[name];
      },
      load() {
        this.loads = (this.loads || 0) + 1;
      },
    };
  }

  let fetches = 0;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetches += 1;
    throw new Error('reel playback must not download the file');
  };
  try {
    const mp4 = fakeVideo();
    const direct = attachMp4Source(mp4, { kind: 'mp4', src: 'https://cdn.example.test/a.mp4' });
    assert.equal(direct.mode, 'mp4');
    assert.equal(mp4.src, 'https://cdn.example.test/a.mp4');
    assert.equal(mp4.preload, 'metadata');
    assert.equal(attachMp4Source(mp4, { kind: 'hls', src: 'https://cdn.example.test/a.m3u8' }), null);

    const session = createSocialReelSession(mp4);
    const handle = await session.attach(
      { kind: 'mp4', src: 'https://cdn.example.test/reel.mp4' },
      { muted: true },
    );
    assert.equal(handle.mode, 'mp4');
    assert.equal(mp4.src, 'https://cdn.example.test/reel.mp4');
    assert.equal(String(mp4.src).startsWith('blob:'), false);
    assert.equal(mp4.preload, 'metadata');
    assert.equal(mp4.attrs.playsinline, '');
    assert.equal(mp4.attrs['webkit-playsinline'], 'true');
    assert.equal(mp4.attrs.muted, '');
    assert.equal(fetches, 0);
    session.detach();
    assert.equal(mp4.src, '');
    assert.ok(mp4.loads >= 1);

    const rejected = await session.attach({ kind: 'hls', src: 'https://cdn.example.test/a.m3u8' });
    assert.equal(rejected.mode, 'unsupported');
    assert.equal(mp4.src, '');
    assert.equal(fetches, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }

  const seamVideo = fakeVideo();
  const seen = [];
  const seam = createSocialReelSession(seamVideo, {
    attachSource(media, reel) {
      seen.push(reel.src);
      return attachMp4Source(media, reel);
    },
  });
  const seamHandle = await seam.attach({ kind: 'mp4', src: 'https://cdn.example.test/seam.mp4' });
  assert.equal(seamHandle.mode, 'mp4');
  assert.deepEqual(seen, ['https://cdn.example.test/seam.mp4']);
  assert.equal(seamVideo.src, 'https://cdn.example.test/seam.mp4');
  seam.detach();
});
