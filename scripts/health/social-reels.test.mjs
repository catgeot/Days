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
const FLAG_OFF_HTML_SHA256 = 'f5fd91180dfb5105dd61cbf449ada0c5f5e4dff4279b0690740663003d3ee485';

globalThis.__GATEO_DISABLE_SOCIAL_PHOTO_FETCH__ = true;
globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ || {}),
  VITE_GATEO_SOCIAL_LINKS: '',
  VITE_GATEO_SOCIAL_REELS: '',
};

const { default: SocialLinksPage } = await import('../../src/pages/Social/SocialLinksPage.jsx');
const {
  buildSocialReelPlaylist,
  formatSocialReelCredit,
  isLivePostedSocialCard,
  normalizeSocialReel,
} = await import('../../src/pages/Social/socialReels.js');
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
    photoUrl: 'https://tong.visitkorea.or.kr/cms/resource/51/3588851_image2_1.jpg',
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
  delete window.__GATEO_SOCIAL_REELS_FIXTURE__;
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
  assert.equal(playlist[0].placeLabel, '이 여행지 보기');
  assert.equal(playlist[0].creditText, '출처: 한국관광공사');
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
  assert.equal(createHash('sha256').update(html).digest('hex'), FLAG_OFF_HTML_SHA256);
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
  assert.equal(document.querySelectorAll('video').length, 1);
  assert.equal(player().getAttribute('data-campaign'), 'reel-new');
  assert.equal(node.muted, true);
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').getAttribute('data-muted'), 'true');
  assert.equal(document.querySelector('[data-testid="social-reel-mute"]').textContent, '소리 켜기');
  assert.match(node.getAttribute('src'), /new\.mp4$/);
  assert.equal(node.getAttribute('playsinline'), '');
  assert.equal(node.getAttribute('preload'), 'metadata');
  assert.equal(node.hasAttribute('autoplay'), true);
  assert.equal(node.muted, true);
  assert.equal(document.querySelector('[data-testid="social-reel-credit"]').textContent, '출처: 한국관광공사');
  assert.equal(document.querySelector('[data-testid="social-reel-place"]').textContent, '이 여행지 보기');
  assert.equal(document.querySelector('[data-testid="social-reel-place"]').getAttribute('href'), '/place/jeju-new');
  assert.equal(
    document.querySelector('[data-testid="social-reel-next-poster"]').getAttribute('src'),
    'https://example.test/old.jpg',
  );
  assert.match(player().textContent, /위아래 키로 옮겨요/);

  await act(async () => {
    node.dispatchEvent(new window.Event('ended'));
  });
  assert.equal(player().getAttribute('data-campaign'), 'reel-old');
  assert.equal(document.querySelectorAll('video').length, 1);
  assert.equal(video(), node);
  assert.match(node.getAttribute('src'), /old\.mp4$/);
  assert.equal(document.querySelector('[data-testid="social-reel-credit"]').textContent, '출처: 옛 자료');

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
