import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const scrollJs = readFileSync(
  join(root, 'src/pages/Korea/festivalHubListScroll.js'),
  'utf8',
);
const indexJs = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');

test('hub list scroll targets main vs md list pane', () => {
  assert.match(scrollJs, /data-festival-list-scroll/);
  assert.match(scrollJs, /min-width: 768px/);
  assert.match(scrollJs, /behavior: 'instant'/);
  assert.match(scrollJs, /ResizeObserver/);
  assert.match(scrollJs, /RESTORE_READY_TIMEOUT_MS/);
  assert.match(scrollJs, /touchstart/);
  assert.doesNotMatch(scrollJs, /mergeFestivalHubListScrollForMapOpen/);
});

test('Korea hub resets list scroll on filter key change only', () => {
  assert.match(indexJs, /scrollFestivalHubListToTop/);
  assert.match(indexJs, /festivalHubListScroll\.js/);
  assert.match(indexJs, /listFilterScrollKey/);
  assert.match(indexJs, /listFilterScrollKeyRef/);
  assert.match(indexJs, /searchFilter/);
  assert.match(indexJs, /nearActive/);
  assert.match(indexJs, /useLayoutEffect/);
  assert.match(indexJs, /data-festival-list-scroll/);
  assert.doesNotMatch(indexJs, /listFilterScrollKey, mapOpen/);
  assert.match(indexJs, /readFestivalHubListScrollOffsets/);
  assert.doesNotMatch(indexJs, /mapOpenScrollCaptureRef/);
  assert.doesNotMatch(indexJs, /peakHubListScrollOffsetsRef/);
  assert.doesNotMatch(indexJs, /lastHubListScrollOffsetsRef/);
});
