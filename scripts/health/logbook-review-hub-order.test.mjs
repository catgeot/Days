import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { fetchEditorialReviewIndex } from '../../src/logbookOfficialReviews/editorialReviewIndex.js';
import { LOGBOOK_REVIEW_FILTER_E2E_FIXTURE } from '../../src/logbookOfficialReviews/logbookReviewFilterE2eFixture.js';
import {
  clearLogbookReviewHubListCache,
  dropLogbookReviewHubRowsMemory,
  LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY,
  readLogbookReviewHubRows,
  rememberLogbookReviewHubRows,
} from '../../src/logbookOfficialReviews/logbookReviewHubListCache.js';
import {
  logbookReviewHubE2eRows,
  mergeLogbookOfficialReviewRows,
  pageLogbookOfficialReviewRows,
  sortLogbookOfficialReviewRows,
} from '../../src/logbookOfficialReviews/logbookReviewHubOrder.js';

const healthRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function row(id, createdAt, extra = {}) {
  return { id, created_at: createdAt, place_slug: 'rome', place_name: id, ...extra };
}

function ids(rows) {
  return rows.map((item) => item.id);
}

test('same created_at sorts by id string, independent of input order', () => {
  const day = '2026-11-09T08:00:00.000Z';
  const orders = [
    [row('tie-c', day), row('tie-a', day), row('tie-b', day)],
    [row('tie-b', day), row('tie-c', day), row('tie-a', day)],
    [row('tie-a', day), row('tie-b', day), row('tie-c', day)],
  ];
  const sortedIds = orders.map((list) => ids(sortLogbookOfficialReviewRows(list)));
  assert.deepEqual(sortedIds[0], ['tie-a', 'tie-b', 'tie-c']);
  assert.deepEqual(sortedIds[1], sortedIds[0]);
  assert.deepEqual(sortedIds[2], sortedIds[0]);
});

test('id tie-break is UTF-16 code unit order, not numeric', () => {
  const day = '2026-11-09T00:00:00Z';
  const sorted = sortLogbookOfficialReviewRows([
    row('10', day),
    row('2', day),
    row('a', day),
    row('B', day),
  ]);
  assert.deepEqual(ids(sorted), ['10', '2', 'B', 'a']);
});

test('newer created_at stays ahead of an id that would sort first', () => {
  const sorted = sortLogbookOfficialReviewRows([
    row('a', '2026-11-08T00:00:00Z'),
    row('z', '2026-11-09T00:00:00Z'),
  ]);
  assert.deepEqual(ids(sorted), ['z', 'a']);
});

test('equal instants with different offset strings tie-break by id', () => {
  const sorted = sortLogbookOfficialReviewRows([
    row('m', '2026-11-09T17:00:00+09:00'),
    row('a', '2026-11-09T08:00:00Z'),
  ]);
  assert.deepEqual(ids(sorted), ['a', 'm']);
});

test('null and invalid created_at sort first, then by id', () => {
  const sorted = sortLogbookOfficialReviewRows([
    row('a', '2026-11-09T00:00:00Z'),
    row('c', 'not-a-date'),
    row('b', null),
  ]);
  assert.deepEqual(ids(sorted), ['b', 'c', 'a']);
});

test('e2e shuffle modes produce one id order', () => {
  const forward = ids(
    sortLogbookOfficialReviewRows(logbookReviewHubE2eRows(LOGBOOK_REVIEW_FILTER_E2E_FIXTURE, 'forward')),
  );
  const reverse = ids(
    sortLogbookOfficialReviewRows(logbookReviewHubE2eRows(LOGBOOK_REVIEW_FILTER_E2E_FIXTURE, 'reverse')),
  );
  assert.deepEqual(forward, reverse);
  assert.deepEqual(
    forward.filter((id) => String(id).startsWith('tie-')),
    ['tie-a', 'tie-b', 'tie-c'],
  );
  const rawForward = ids(logbookReviewHubE2eRows(LOGBOOK_REVIEW_FILTER_E2E_FIXTURE, 'forward'));
  assert.deepEqual(
    rawForward.filter((id) => String(id).startsWith('tie-')),
    ['tie-c', 'tie-a', 'tie-b'],
  );
});

test('pages of a tied day do not duplicate or skip, for either input order', () => {
  const day = '2026-11-09T08:00:00Z';
  const newer = row('newer', '2026-11-10T08:00:00Z');
  const tied = ['d', 'a', 'c', 'b'].map((id) => row(id, day));
  const orders = [
    [newer, ...tied],
    [tied[2], newer, tied[0], tied[3], tied[1]],
  ];
  const pagesOf = (list) => {
    const out = [];
    for (let offset = 0; ; offset += 2) {
      const page = pageLogbookOfficialReviewRows(list, offset, 2);
      if (!page.length) break;
      out.push(ids(page));
      if (offset > 20) break;
    }
    return out;
  };
  assert.deepEqual(pagesOf(orders[0]), pagesOf(orders[1]));
  const flat = pagesOf(orders[0]).flat();
  assert.deepEqual(flat, ['newer', 'a', 'b', 'c', 'd']);
  assert.equal(new Set(flat).size, flat.length);
  assert.equal(flat.length, orders[0].length);
});

test('merge of overlapping tied pages keeps one row per id in sort order', () => {
  const day = '2026-11-09T08:00:00Z';
  const merged = mergeLogbookOfficialReviewRows(
    [row('c', day, { place_name: 'from-page-1' }), row('a', day)],
    [row('a', day, { place_name: 'from-page-2' }), row('b', day)],
  );
  assert.deepEqual(ids(merged), ['a', 'b', 'c']);
  assert.equal(merged[0].place_name, 'from-page-2');
  const again = mergeLogbookOfficialReviewRows(
    [row('b', day), row('a', day)],
    [row('c', day), row('a', day)],
  );
  assert.deepEqual(ids(again), ids(merged));
});

test('fetchEditorialReviewIndex orders by created_at then id and sorts the payload', async () => {
  const calls = [];
  const mockClient = {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order(col, opts) {
          calls.push(['order', col, opts]);
          return this;
        },
        limit() {
          return Promise.resolve({
            data: [
              row('b', '2026-11-09T00:00:00Z'),
              row('a', '2026-11-09T00:00:00Z'),
              row('c', '2026-11-10T00:00:00Z'),
            ],
            error: null,
          });
        },
      };
    },
  };
  const rows = await fetchEditorialReviewIndex(mockClient, { limit: 10 });
  assert.deepEqual(
    calls.filter((entry) => entry[0] === 'order'),
    [
      ['order', 'created_at', { ascending: false, nullsFirst: true }],
      ['order', 'id', { ascending: true }],
    ],
  );
  assert.deepEqual(ids(rows), ['c', 'a', 'b']);
});

test('cache restore re-sorts a shuffled same-date payload', () => {
  const mem = new Map();
  const prevWindow = globalThis.window;
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => (mem.has(key) ? mem.get(key) : null),
      setItem: (key, value) => {
        mem.set(key, String(value));
      },
      removeItem: (key) => {
        mem.delete(key);
      },
    },
  };
  try {
    clearLogbookReviewHubListCache();
    const day = '2026-11-09T00:00:00Z';
    mem.set(
      LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY,
      JSON.stringify([row('b', day), row('a', day), row('z', '2026-11-10T00:00:00Z')]),
    );
    dropLogbookReviewHubRowsMemory();
    assert.deepEqual(ids(readLogbookReviewHubRows()), ['z', 'a', 'b']);

    rememberLogbookReviewHubRows([row('c', day), row('a', day)]);
    dropLogbookReviewHubRowsMemory();
    assert.deepEqual(ids(readLogbookReviewHubRows()), ['a', 'c']);
  } finally {
    clearLogbookReviewHubListCache();
    if (prevWindow === undefined) delete globalThis.window;
    else globalThis.window = prevWindow;
  }
});

test('hub pagination and the editorial query share the order helper', () => {
  const hub = readFileSync(
    join(healthRoot, 'src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx'),
    'utf8',
  );
  const index = readFileSync(
    join(healthRoot, 'src/logbookOfficialReviews/editorialReviewIndex.js'),
    'utf8',
  );
  const hook = readFileSync(
    join(healthRoot, 'src/logbookOfficialReviews/useLogbookOfficialReviewHub.js'),
    'utf8',
  );
  assert.match(hub, /pageLogbookOfficialReviewRows\(filteredRows, 0, visibleCount\)/);
  assert.match(index, /\.order\('id', \{ ascending: true \}\)/);
  assert.match(hook, /sortLogbookOfficialReviewRows\(data\)/);
  assert.match(hook, /logbookReviewHubE2eRows\(LOGBOOK_REVIEW_FILTER_E2E_FIXTURE\)/);
});
