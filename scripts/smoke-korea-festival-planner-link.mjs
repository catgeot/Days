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
  join(root, 'src/pages/Korea/FestivalMooniEntry.jsx'),
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
assert.match(mooniSrc, /stopPropagation/, 'Festival mooni entry stops overlay close on click');
assert.match(
  mooniSrc,
  /buildFestivalMooniBoundSpot/,
  'Festival mooni entry binds festival context spot',
);
const inlineSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalMooniInlineButton.jsx'),
  'utf8',
);
assert.match(inlineSrc, /data-festival-mooni-inline/, 'Festival inline MOONi button marker');
assert.match(sheetSrc, /mooniSlot/, 'Festival summary includes mooni slot');
const placeIntroSrc = readFileSync(
  join(root, 'src/pages/Home/lib/placeChatIntro.js'),
  'utf8',
);
assert.match(
  placeIntroSrc,
  /explicitLabel/,
  'buildMooniBoundSpotFromLocation preserves explicit displayLabel',
);

console.log('OK    smoke:korea-festival-planner-link — all assertions passed');
