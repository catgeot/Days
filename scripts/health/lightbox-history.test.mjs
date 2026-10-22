import assert from 'node:assert/strict';
import test from 'node:test';

import { readFileSync } from 'node:fs';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoLightboxHistoryEnabled,
  resolveLightboxHistoryEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  LIGHTBOX_HISTORY_KEY,
  LIGHTBOX_HISTORY_SWALLOW_MS,
  createLightboxHistorySession,
} from '../../src/shared/lightboxHistory.js';

function createFakeWindow() {
  const entries = [{
    state: { idx: 2, key: 'place', usr: { tab: 'gallery' } },
    url: 'http://local/place/jeju',
  }];
  const listeners = [];
  const queue = [];
  const timers = new Map();
  let timerSeq = 0;
  let now = 0;
  let asyncBack = false;
  let silentBack = false;

  function dispatch() {
    const event = {
      stopped: false,
      stopImmediatePropagation() {
        this.stopped = true;
      },
    };
    const capture = listeners.filter((entry) => entry.capture);
    const bubble = listeners.filter((entry) => !entry.capture);
    for (const entry of [...capture, ...bubble]) {
      if (event.stopped) break;
      entry.fn(event);
    }
    return event;
  }

  function resolveUrl(url) {
    if (!url) return entries[entries.length - 1].url;
    return String(url);
  }

  const history = {
    get state() {
      return entries[entries.length - 1].state;
    },
    get length() {
      return entries.length;
    },
    pushState(state, _title, url) {
      entries.push({ state, url: resolveUrl(url) });
    },
    replaceState(state, _title, url) {
      entries[entries.length - 1] = { state, url: resolveUrl(url) };
    },
    back() {
      const run = () => {
        if (!silentBack && entries.length > 1) entries.pop();
        if (silentBack) return undefined;
        return dispatch();
      };
      if (asyncBack) {
        queue.push(run);
        return undefined;
      }
      return run();
    },
  };

  return {
    entries,
    get stack() {
      return entries.map((entry) => entry.state);
    },
    setAsyncBack(value) {
      asyncBack = value;
    },
    setSilentBack(value) {
      silentBack = value;
    },
    flush() {
      const jobs = queue.splice(0, queue.length);
      return jobs.map((job) => job());
    },
    advance(ms) {
      now += ms;
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= now)
        .sort((a, b) => a[1].at - b[1].at);
      for (const [id, timer] of due) {
        if (!timers.has(id)) continue;
        timers.delete(id);
        timer.fn();
      }
    },
    dispatchPop() {
      return dispatch();
    },
    addRouter(fn) {
      listeners.push({ fn, capture: false });
    },
    win: {
      history,
      get location() {
        return { href: entries[entries.length - 1].url };
      },
      setTimeout(fn, ms) {
        const id = ++timerSeq;
        timers.set(id, { fn, at: now + ms });
        return id;
      },
      clearTimeout(id) {
        timers.delete(id);
      },
      addEventListener(type, fn, capture) {
        if (type !== 'popstate') return;
        listeners.push({ fn, capture: capture === true });
      },
      removeEventListener(type, fn) {
        const index = listeners.findIndex((entry) => entry.fn === fn);
        if (index >= 0) listeners.splice(index, 1);
      },
    },
  };
}

test('VITE_GATEO_LIGHTBOX_HISTORY defaults on and turns off for 0/false/off', () => {
  const key = GATEO_ENV_FLAG_NAMES.LIGHTBOX_HISTORY;
  const prev = globalThis.__VITE_ENV__[key];
  try {
    delete globalThis.__VITE_ENV__[key];
    assert.equal(isGateoLightboxHistoryEnabled(), true);
    globalThis.__VITE_ENV__[key] = '';
    assert.equal(isGateoLightboxHistoryEnabled(), true);
    globalThis.__VITE_ENV__[key] = '1';
    assert.equal(isGateoLightboxHistoryEnabled(), true);
    for (const off of ['0', 'false', 'off', 'OFF']) {
      globalThis.__VITE_ENV__[key] = off;
      assert.equal(isGateoLightboxHistoryEnabled(), false, off);
    }
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[key];
    else globalThis.__VITE_ENV__[key] = prev;
  }
});

test('open pushes one same-URL entry and keeps router idx/key/usr', () => {
  const fake = createFakeWindow();
  const session = createLightboxHistorySession(fake.win, {
    enabled: true,
    onCloseFromPop: () => {},
  });
  session.open();
  session.open();
  assert.equal(fake.stack.length, 2);
  const top = fake.stack[1];
  assert.equal(top[LIGHTBOX_HISTORY_KEY], true);
  assert.equal(top.idx, 2);
  assert.equal(top.key, 'place');
  assert.equal(top.usr.tab, 'gallery');
  session.dispose();
  assert.equal(fake.stack.length, 1);
  assert.equal(fake.stack[0][LIGHTBOX_HISTORY_KEY], undefined);
});

test('browser back closes the lightbox and does not pop the page or notify the router', () => {
  const fake = createFakeWindow();
  let routerPops = 0;
  let closes = 0;
  fake.addRouter(() => {
    routerPops += 1;
  });
  const session = createLightboxHistorySession(fake.win, {
    enabled: true,
    onCloseFromPop() {
      closes += 1;
    },
  });
  session.open();
  fake.win.history.back();
  assert.equal(closes, 1);
  assert.equal(routerPops, 0);
  assert.equal(fake.stack.length, 1);
  session.dispose();
  assert.equal(fake.stack.length, 1);
  assert.equal(routerPops, 0);
  assert.equal(closes, 1);
});

test('explicit close history.back is swallowed so the router stays put', () => {
  const fake = createFakeWindow();
  let routerPops = 0;
  let closes = 0;
  fake.addRouter(() => {
    routerPops += 1;
  });
  const session = createLightboxHistorySession(fake.win, {
    enabled: true,
    onCloseFromPop() {
      closes += 1;
    },
  });
  session.open();
  session.dispose();
  assert.equal(closes, 0);
  assert.equal(routerPops, 0);
  assert.equal(fake.stack.length, 1);
});

test('place flag 0 still leaves festival lightbox history enabled', () => {
  const key = GATEO_ENV_FLAG_NAMES.LIGHTBOX_HISTORY;
  const prev = globalThis.__VITE_ENV__[key];
  try {
    globalThis.__VITE_ENV__[key] = '0';
    assert.equal(isGateoLightboxHistoryEnabled(), false);
    assert.equal(resolveLightboxHistoryEnabled(false), false);
    assert.equal(resolveLightboxHistoryEnabled(true), true);
    const sheet = readFileSync(
      new URL('../../src/pages/Korea/FestivalDetailSheet.jsx', import.meta.url),
      'utf8',
    );
    assert.match(sheet, /useLightboxHistory\(lightboxOpen,\s*closeLightbox,\s*\{\s*always:\s*true\s*\}\)/);
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[key];
    else globalThis.__VITE_ENV__[key] = prev;
  }
});

test('disabled flag does not push or back', () => {
  const fake = createFakeWindow();
  let closes = 0;
  const session = createLightboxHistorySession(fake.win, {
    enabled: false,
    onCloseFromPop() {
      closes += 1;
    },
  });
  session.open();
  assert.equal(fake.stack.length, 1);
  fake.win.history.back();
  session.dispose();
  assert.equal(fake.stack.length, 1);
  assert.equal(closes, 0);
});

test('strict-mode remount leaves a single entry and does not close on the queued back', () => {
  const fake = createFakeWindow();
  fake.setAsyncBack(true);
  const closes = [];
  const first = createLightboxHistorySession(fake.win, {
    enabled: true,
    onCloseFromPop() {
      closes.push('first');
    },
  });
  first.open();
  first.dispose();
  const second = createLightboxHistorySession(fake.win, {
    enabled: true,
    onCloseFromPop() {
      closes.push('second');
    },
  });
  second.open();
  assert.equal(fake.stack.length, 3);
  fake.flush();
  assert.equal(closes.length, 0);
  assert.equal(fake.stack.length, 2);
  assert.equal(fake.stack[1][LIGHTBOX_HISTORY_KEY], true);
  second.dispose();
  fake.flush();
  assert.equal(fake.stack.length, 1);
  assert.equal(closes.length, 0);
});

test('swallow listener is removed when history.back never fires popstate', () => {
  const fake = createFakeWindow();
  fake.setSilentBack(true);
  let routerPops = 0;
  fake.addRouter(() => {
    routerPops += 1;
  });
  const session = createLightboxHistorySession(fake.win, {
    enabled: true,
    onCloseFromPop() {},
    swallowTimeoutMs: LIGHTBOX_HISTORY_SWALLOW_MS,
  });
  session.open();
  session.dispose();
  fake.advance(LIGHTBOX_HISTORY_SWALLOW_MS - 1);
  fake.dispatchPop();
  assert.equal(routerPops, 0);

  const late = createFakeWindow();
  late.setSilentBack(true);
  let lateRouterPops = 0;
  late.addRouter(() => {
    lateRouterPops += 1;
  });
  const lateSession = createLightboxHistorySession(late.win, {
    enabled: true,
    onCloseFromPop() {},
    swallowTimeoutMs: LIGHTBOX_HISTORY_SWALLOW_MS,
  });
  lateSession.open();
  lateSession.dispose();
  late.advance(LIGHTBOX_HISTORY_SWALLOW_MS);
  late.setSilentBack(false);
  late.win.history.back();
  assert.equal(lateRouterPops, 1);
  assert.equal(late.stack.length, 1);
  assert.equal(late.stack[0][LIGHTBOX_HISTORY_KEY], undefined);
});

test('route change while open removes the orphaned lightbox entry and keeps the new route', () => {
  const fake = createFakeWindow();
  let routerPops = 0;
  let closes = 0;
  fake.addRouter(() => {
    routerPops += 1;
  });
  const session = createLightboxHistorySession(fake.win, {
    enabled: true,
    onCloseFromPop() {
      closes += 1;
    },
  });
  session.open();
  fake.win.history.pushState({ idx: 4, key: 'korea' }, '', 'http://local/korea');
  assert.equal(fake.stack.length, 3);
  session.dispose();
  assert.equal(closes, 0);
  assert.equal(routerPops, 0);
  assert.equal(fake.stack.length, 2);
  assert.equal(fake.stack[1].key, 'korea');
  assert.equal(fake.stack[1][LIGHTBOX_HISTORY_KEY], undefined);
  assert.equal(fake.stack[0].key, 'place');
  assert.equal(fake.win.location.href, 'http://local/korea');
});

test('replace over the lightbox entry does not history.back away from the new route', () => {
  const fake = createFakeWindow();
  let routerPops = 0;
  fake.addRouter(() => {
    routerPops += 1;
  });
  const session = createLightboxHistorySession(fake.win, {
    enabled: true,
    onCloseFromPop() {},
  });
  session.open();
  fake.win.history.replaceState({ idx: 2, key: 'replaced' }, '', 'http://local/elsewhere');
  session.dispose();
  assert.equal(routerPops, 0);
  assert.equal(fake.stack.length, 2);
  assert.equal(fake.stack[1].key, 'replaced');
  assert.equal(fake.win.location.href, 'http://local/elsewhere');
});
