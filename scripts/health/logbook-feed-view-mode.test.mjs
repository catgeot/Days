import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  LOGBOOK_FEED_VIEW_URL_PARAM,
  defaultLogbookFeedViewForViewport,
  parseLogbookFeedView,
  resolveLogbookFeedViewMode,
} from '../../src/utils/logbookFeedViewMode.js';
import { logbookFeedThumbImageProps } from '../../src/utils/logbookImageSrc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('defaultLogbookFeedViewForViewport: mobile column, lg+ grid', () => {
  assert.equal(defaultLogbookFeedViewForViewport(false), 'column');
  assert.equal(defaultLogbookFeedViewForViewport(true), 'grid');
});

test('resolveLogbookFeedViewMode precedence: url > storage > viewport', () => {
  assert.deepEqual(
    resolveLogbookFeedViewMode({ isLgUp: true, urlView: 'column', storedView: 'grid' }),
    { mode: 'column', source: 'url' },
  );
  assert.deepEqual(
    resolveLogbookFeedViewMode({ isLgUp: false, urlView: null, storedView: 'list' }),
    { mode: 'list', source: 'storage' },
  );
  assert.deepEqual(
    resolveLogbookFeedViewMode({ isLgUp: true, urlView: '', storedView: null }),
    { mode: 'grid', source: 'viewport' },
  );
  assert.deepEqual(
    resolveLogbookFeedViewMode({ isLgUp: false, urlView: null, storedView: 'nope' }),
    { mode: 'column', source: 'viewport' },
  );
});

test('parseLogbookFeedView accepts known modes only', () => {
  assert.equal(parseLogbookFeedView('grid'), 'grid');
  assert.equal(parseLogbookFeedView(' COLUMN '), 'column');
  assert.equal(parseLogbookFeedView('tiles'), null);
});

test('logbookFeedThumbImageProps: column layout gets wider sizes on lg', () => {
  const unsplash = [
    'https://images.unsplash.com/photo-1?auto=format&fit=crop&w=400&q=80',
  ];
  const column = logbookFeedThumbImageProps(unsplash, { viewMode: 'column', isCompact: true });
  assert.match(column.srcSet, /960w/);
  assert.match(column.sizes, /1024px/);

  const dense = logbookFeedThumbImageProps(unsplash, { viewMode: 'grid', isCompact: true });
  assert.match(dense.sizes, /24vw/);

  const list = logbookFeedThumbImageProps(unsplash, { viewMode: 'list', isCompact: true });
  assert.equal(list.sizes, '112px');
});

test('RecentList wires viewport hook and feed grid markers', () => {
  const recentList = readFileSync(
    join(root, 'src/pages/DailyReport/components/RecentList.jsx'),
    'utf8',
  );
  assert.match(recentList, /useLogbookFeedViewMode/);
  assert.doesNotMatch(recentList, /useState\('column'\)/);
  assert.match(recentList, /data-logbook-feed-grid/);
  assert.match(recentList, /logbookFeedThumbImageProps/);
  assert.match(recentList, /srcSet=\{thumb\.srcSet\}/);
  assert.match(recentList, /min-w-0 w-full/);
});

test('DailyLayout main scroll clips horizontal bleed', () => {
  const layout = readFileSync(
    join(root, 'src/pages/DailyReport/layout/DailyLayout.jsx'),
    'utf8',
  );
  assert.match(layout, /overflow-x-clip/);
  assert.match(layout, /w-0 flex-1/);
});

test('feed view URL param is feedView', () => {
  assert.equal(LOGBOOK_FEED_VIEW_URL_PARAM, 'feedView');
  const hook = readFileSync(
    join(root, 'src/pages/DailyReport/hooks/useLogbookFeedViewMode.js'),
    'utf8',
  );
  assert.match(hook, /LOGBOOK_FEED_VIEW_URL_PARAM/);
  assert.match(hook, /writeStoredLogbookFeedView/);
});
