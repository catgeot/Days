#!/usr/bin/env node
/**
 * 세계행사 P1-a — 축제 상세 MRT 숙소 URL에 TripWindow checkIn/checkOut.
 *
 *   npm run smoke:korea-festival-stay-url
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tripWindowFromTourApiFestival } from '../src/pages/Korea/worldEventFromTourApiFestival.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
const affiliateSrc = readFileSync(
  join(root, 'src/utils/affiliate.js'),
  'utf8',
);

assert.match(
  sheetSrc,
  /tripWindowFromTourApiFestival/,
  'FestivalDetailSheet uses tripWindowFromTourApiFestival',
);
assert.match(
  sheetSrc,
  /checkIn:\s*festivalTripWindow/,
  'FestivalDetailSheet passes checkIn from festivalTripWindow',
);
assert.match(
  sheetSrc,
  /checkOut:\s*festivalTripWindow/,
  'FestivalDetailSheet passes checkOut from festivalTripWindow',
);
assert.match(
  affiliateSrc,
  /checkIn:\s*options\.checkIn/,
  'getMrtAccommodationSearchUrl forwards checkIn',
);
assert.match(
  affiliateSrc,
  /checkOut:\s*options\.checkOut/,
  'getMrtAccommodationSearchUrl forwards checkOut',
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

console.log('OK    smoke:korea-festival-stay-url — all assertions passed');
