import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { resetYouTubeMock, setYouTubeMock, calls, mk } from './youtube-session-supabase-mock.mjs';
import { useYouTubeSearch, resetYouTubeSessionCacheForTests } from '../src/pages/Home/hooks/useYouTubeSearch.js';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></html>', {
  url: 'https://localhost/',
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
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('DocumentFragment', window.DocumentFragment);
setGlobal('localStorage', window.localStorage);
setGlobal('sessionStorage', window.sessionStorage);
setGlobal('MutationObserver', window.MutationObserver);
setGlobal('getComputedStyle', window.getComputedStyle.bind(window));
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));

const sapa = { id: 'sapa', slug: 'sapa', name: '사파', country: '베트남', name_en: 'Sapa' };
const hanoi = { id: 'hanoi', slug: 'hanoi', name: '하노이', country: '베트남', name_en: 'Hanoi' };

function place(i) {
  return {
    id: `p${i}`,
    slug: `place-${i}`,
    name: `장소${i}`,
    country: '테스트',
    name_en: `Place${i}`,
  };
}

let root;
let hook;

function Probe({ loc, mode }) {
  hook = useYouTubeSearch(loc, mode);
  return null;
}

function probeEl(loc, mode) {
  return React.createElement(Probe, { loc, mode });
}

function mount() {
  const el = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(el);
  root = createRoot(el);
}

async function render(loc, mode) {
  await act(async () => {
    root.render(probeEl(loc, mode));
    await new Promise((r) => setTimeout(r, 0));
  });
}

function ids() {
  return hook.videos.map((v) => v.id);
}

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
  hook = null;
  resetYouTubeMock();
  resetYouTubeSessionCacheForTests();
});

test('load more survives tab switch and re-entry', async () => {
  mount();
  await render(sapa, 'VIDEO');
  assert.deepEqual(ids(), ['c0', 'c1', 'c2', 'c3', 'c4']);
  assert.equal(hook.isLoading, false);
  assert.equal(hook.canLoadMore, true);

  await act(async () => {
    await hook.loadMore();
  });
  assert.equal(hook.videos.length, 15);
  assert.equal(calls.edge.length, 1);
  assert.equal(calls.edge[0].skipUpsert, true);
  assert.equal(calls.edge[0].maxResults, 20);

  await render(sapa, 'WIKI');
  assert.equal(hook.videos.length, 15);
  assert.equal(hook.isLoading, false);

  await render(sapa, 'VIDEO');
  assert.equal(hook.videos.length, 15);
  assert.equal(hook.isLoading, false);
  assert.equal(hook.isEmpty, false);
  assert.equal(calls.db.length, 1);
  assert.equal(calls.edge.length, 1);

  await act(async () => {
    root.unmount();
  });
  mount();
  const dbBefore = calls.db.length;
  await render(sapa, 'VIDEO');
  assert.equal(hook.videos.length, 15);
  assert.equal(calls.db.length, dbBefore);
  assert.equal(calls.edge.length, 1);
  assert.equal(hook.canLoadMore, true);
});

test('tab return without load more keeps the DB list', async () => {
  mount();
  await render(sapa, 'GALLERY');
  await render(sapa, 'VIDEO');
  assert.equal(hook.videos.length, 5);
  await render(sapa, 'WIKI');
  await render(sapa, 'VIDEO');
  assert.equal(hook.videos.length, 5);
  assert.equal(hook.isLoading, false);
  assert.equal(hook.isEmpty, false);
  assert.equal(calls.edge.length, 0);
  assert.equal(calls.db.length, 1);
});

test('another place never shows the previous videos', async () => {
  setYouTubeMock({
    db: async (queryIds) => {
      const joined = (queryIds || []).join('|');
      const prefix = joined.includes('hanoi') || joined.includes('하노이') ? 'h' : 's';
      return { data: { videos: mk(prefix, 5) } };
    },
  });
  mount();
  await render(sapa, 'VIDEO');
  await act(async () => {
    await hook.loadMore();
  });
  assert.equal(hook.videos.length, 15);
  assert.ok(ids().some((id) => id.startsWith('s')));

  await render(hanoi, 'GALLERY');
  assert.equal(hook.videos.length, 0);
  assert.ok(!ids().some((id) => id.startsWith('s') || id.startsWith('m')));

  await render(hanoi, 'VIDEO');
  assert.deepEqual(ids(), ['h0', 'h1', 'h2', 'h3', 'h4']);
  assert.equal(hook.isLoading, false);
});

test('in-flight fetch does not paint the previous place', async () => {
  setYouTubeMock({
    db: (queryIds) => new Promise((resolve) => {
      const joined = (queryIds || []).join('|');
      const hanoiQuery = joined.includes('hanoi') || joined.includes('하노이');
      setTimeout(() => {
        resolve({ data: { videos: mk(hanoiQuery ? 'h' : 's', hanoiQuery ? 2 : 4) } });
      }, hanoiQuery ? 0 : 40);
    }),
  });
  mount();
  await act(async () => {
    root.render(probeEl(sapa, 'VIDEO'));
  });
  await render(hanoi, 'VIDEO');
  await act(async () => {
    await new Promise((r) => setTimeout(r, 60));
  });
  assert.deepEqual(ids(), ['h0', 'h1']);
  assert.equal(hook.isLoading, false);
});

test('fast repeated loadMore taps share one request', async () => {
  let edgeCalls = 0;
  setYouTubeMock({
    edge: () => new Promise((resolve) => {
      edgeCalls += 1;
      setTimeout(() => {
        resolve({
          data: {
            success: true,
            videos: mk('m', 10),
            nextPageToken: 'T1',
            paginationSource: 'primary',
          },
        });
      }, 25);
    }),
  });
  mount();
  await render(sapa, 'VIDEO');
  await act(async () => {
    const first = hook.loadMore();
    const second = hook.loadMore();
    await first;
    await second;
  });
  assert.equal(edgeCalls, 1);
  assert.equal(hook.videos.length, 15);
  assert.equal(hook.canLoadMore, true);
});

test('retry drops the session cache', async () => {
  mount();
  await render(sapa, 'VIDEO');
  await act(async () => {
    await hook.loadMore();
  });
  assert.equal(hook.videos.length, 15);
  await act(async () => {
    await hook.retry();
  });
  assert.deepEqual(ids(), ['c0', 'c1', 'c2', 'c3', 'c4']);

  await act(async () => {
    root.unmount();
  });
  mount();
  await render(sapa, 'VIDEO');
  assert.equal(hook.videos.length, 5);
  assert.ok(calls.db.length >= 2);
});

test('load-more cap stays on re-entry', async () => {
  let n = 0;
  setYouTubeMock({
    edge: async () => {
      n += 1;
      return {
        data: {
          success: true,
          videos: [{ id: `extra${n}`, title: `extra${n}` }],
          nextPageToken: `T${n}`,
          paginationSource: 'primary',
        },
      };
    },
  });
  mount();
  await render(sapa, 'VIDEO');
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      await hook.loadMore();
    });
  }
  assert.equal(hook.videos.length, 8);
  assert.equal(hook.canLoadMore, false);
  assert.equal(n, 3);

  await act(async () => {
    root.unmount();
  });
  mount();
  const dbBefore = calls.db.length;
  const edgeBefore = calls.edge.length;
  await render(sapa, 'VIDEO');
  assert.equal(hook.videos.length, 8);
  assert.equal(hook.canLoadMore, false);
  assert.equal(calls.db.length, dbBefore);
  assert.equal(calls.edge.length, edgeBefore);
});

test('session cache keeps about 30 places', async () => {
  setYouTubeMock({
    db: async (queryIds) => {
      const slug = (queryIds || []).find((id) => String(id).startsWith('place-')) || 'place-x';
      return { data: { videos: [{ id: `${slug}-db`, title: slug }] } };
    },
    edge: async (body) => ({
      data: {
        success: true,
        videos: [{ id: `${body.placeId}-more`, title: 'more' }],
        nextPageToken: 'T',
        paginationSource: 'primary',
      },
    }),
  });

  for (let i = 0; i < 31; i += 1) {
    mount();
    await render(place(i), 'VIDEO');
    await act(async () => {
      await hook.loadMore();
    });
    await act(async () => {
      root.unmount();
    });
    root = null;
  }

  calls.db = [];
  mount();
  await render(place(0), 'VIDEO');
  assert.equal(calls.db.length, 1, 'oldest place is evicted');
  assert.deepEqual(ids(), ['place-0-db']);

  await act(async () => {
    root.unmount();
  });
  calls.db = [];
  mount();
  await render(place(30), 'VIDEO');
  assert.equal(calls.db.length, 0, 'newest place stays cached');
  assert.equal(hook.videos.length, 2);
});
