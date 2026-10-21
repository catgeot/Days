import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoLightboxHistoryEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  LIGHTBOX_HISTORY_KEY,
  createLightboxHistorySession,
} from '../../src/shared/lightboxHistory.js';

function createFakeWindow() {
  const stack = [{ idx: 2, key: 'place', usr: { tab: 'gallery' } }];
  const listeners = [];
  const queue = [];
  let asyncBack = false;

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

  const history = {
    get state() {
      return stack[stack.length - 1];
    },
    get length() {
      return stack.length;
    },
    pushState(state) {
      stack.push(state);
    },
    back() {
      const run = () => {
        if (stack.length > 1) stack.pop();
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
    stack,
    setAsyncBack(value) {
      asyncBack = value;
    },
    flush() {
      const jobs = queue.splice(0, queue.length);
      return jobs.map((job) => job());
    },
    addRouter(fn) {
      listeners.push({ fn, capture: false });
    },
    win: {
      history,
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
