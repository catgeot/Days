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
});

test('Korea hub resets list scroll on filter key change', () => {
  assert.match(indexJs, /scrollFestivalHubListToTop/);
  assert.match(indexJs, /festivalHubListScroll\.js/);
  assert.match(indexJs, /listFilterScrollKey/);
  assert.match(indexJs, /useLayoutEffect/);
  assert.match(indexJs, /data-festival-list-scroll/);
});
