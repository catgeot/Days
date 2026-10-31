import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sectionJs = readFileSync(
  join(rootDir, 'src/pages/Korea/components/FestivalNearbyCardsSection.jsx'),
  'utf8',
);
const scrollJs = readFileSync(
  join(rootDir, 'src/pages/Korea/lib/festivalNearbyBandScroll.js'),
  'utf8',
);

test('nearby band scroll uses festival sheet scroll containers', () => {
  assert.match(scrollJs, /getFestivalSheetScrollContainers/);
  assert.match(scrollJs, /prefers-reduced-motion: reduce/);
  assert.match(sectionJs, /scrollFestivalNearbyBandIntoView/);
  assert.match(sectionJs, /scroll-mt-/);
});

test('scroll helper exports band scroll entrypoint', () => {
  assert.match(scrollJs, /export function scrollFestivalNearbyBandIntoView/);
  assert.match(scrollJs, /export function findFestivalNearbyBandScrollTarget/);
  assert.match(scrollJs, /export function computeFestivalNearbyBandScrollMargin/);
});
