#!/usr/bin/env node
/**
 * 국내 축제 상세 — 플래너 딥링크 제거 · FestivalStayStrip·Mooni FAB 회귀.
 *
 *   npm run smoke:korea-festival-planner-link
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
const mooniSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalMooniFab.jsx'),
  'utf8',
);

assert.doesNotMatch(
  sheetSrc,
  /buildPlacePlannerPathFromEvent/,
  'FestivalDetailSheet no longer uses buildPlacePlannerPathFromEvent',
);
assert.match(
  sheetSrc,
  /FestivalStayStrip/,
  'FestivalDetailSheet uses FestivalStayStrip instead of planner',
);
assert.match(mooniSrc, /MooniBoundChatHost/, 'FestivalMooniFab opens MooniBoundChatHost');
assert.match(mooniSrc, /stopPropagation/, 'FestivalMooniFab stops overlay close on click');
assert.match(
  mooniSrc,
  /buildMooniBoundSpotFromLocation/,
  'FestivalMooniFab binds spot from festival location',
);

console.log('OK    smoke:korea-festival-planner-link — all assertions passed');
