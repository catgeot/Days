#!/usr/bin/env node
/**
 * 국내 축제 상세 — FestivalStayStrip · TripWindow 일정 연동.
 *
 *   npm run smoke:korea-festival-stay-url
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tripWindowFromTourApiFestival, worldEventFromTourApiFestival } from '../src/pages/Korea/worldEventFromTourApiFestival.js';
import { tripWindowPresetsFromEvent } from '../src/utils/worldEventTripPresets.js';
import { tripWindowNights } from '../src/shared/tripWindow.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
const stripSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalStayStrip.jsx'),
  'utf8',
);
const eventStripSrc = readFileSync(
  join(root, 'src/pages/WorldEvents/EventStayStrip.jsx'),
  'utf8',
);

assert.match(sheetSrc, /FestivalStayStrip/, 'FestivalDetailSheet renders FestivalStayStrip');
assert.match(
  sheetSrc,
  /FestivalMooniFab/,
  'FestivalDetailSheet renders FestivalMooniFab',
);
assert.doesNotMatch(
  sheetSrc,
  /buildPlacePlannerPathFromEvent/,
  'FestivalDetailSheet no longer links to place planner',
);
assert.doesNotMatch(
  sheetSrc,
  /festivalPlannerHref/,
  'FestivalDetailSheet removed planner href rail',
);

assert.match(
  stripSrc,
  /tripWindowPresetsFromEvent/,
  'FestivalStayStrip uses tripWindowPresetsFromEvent',
);
assert.match(
  stripSrc,
  /EventStayStrip/,
  'FestivalStayStrip reuses EventStayStrip',
);
assert.match(
  eventStripSrc,
  /placeLabel/,
  'EventStayStrip supports placeLabel override',
);

const hwacheon = {
  contentId: '100',
  title: '화천 산천어축제',
  addr1: '강원특별자치도 화천군',
  eventStartDate: '20260101',
  eventEndDate: '20260131',
};

const tripWindow = tripWindowFromTourApiFestival(hwacheon, {
  todayYmd: '2025-12-01',
});
assert.ok(tripWindow);
assert.equal(tripWindow.checkIn, '2025-12-31');
assert.equal(tripWindow.checkOut, '2026-01-30');
assert.equal(tripWindow.eventId, 'korea-festival-100');

const hoengseongFest = {
  contentId: '200',
  title: '횡성한우축제',
  addr1: '강원특별자치도 횡성군 횡성읍',
  eventStartDate: '20261006',
  eventEndDate: '20261012',
};
const hoengseongEvent = worldEventFromTourApiFestival(hoengseongFest);
assert.equal(hoengseongEvent?.recommendedNights, 3);
const hoengseongPresets = tripWindowPresetsFromEvent(hoengseongEvent, { todayYmd: '2026-08-27' });
assert.ok(hoengseongPresets.visitPresets.length >= 2, 'multi-day festival has visit presets');
assert.ok(
  tripWindowNights(hoengseongPresets.tripWindow.checkIn, hoengseongPresets.tripWindow.checkOut) <= 3,
  'festival tripWindow capped (not full span)',
);
assert.ok(hoengseongPresets.tripWindow.checkOut < '2026-10-13', 'default window shorter than festival end');

console.log('OK    smoke:korea-festival-stay-url — all assertions passed');
