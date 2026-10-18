import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const scrollJs = readFileSync(
  join(root, 'src/pages/Korea/festivalSheetOverviewScroll.js'),
  'utf8',
);
const sheetJs = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);

test('overview scroll resets md content column and window', () => {
  assert.match(scrollJs, /getFestivalSheetScrollContainers/);
  assert.match(scrollJs, /data-festival-sheet-content/);
  assert.match(scrollJs, /min-width: 768px/);
  assert.match(scrollJs, /window\.scrollTo/);
  assert.match(scrollJs, /alignOverviewTopBand/);
  assert.match(scrollJs, /data-festival-photo-strip/);
});

test('FestivalDetailSheet uses shared overview scroll helper', () => {
  assert.match(sheetJs, /scrollFestivalOverviewToTop/);
  assert.match(sheetJs, /festivalSheetOverviewScroll\.js/);
});
