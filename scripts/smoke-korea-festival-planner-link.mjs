#!/usr/bin/env node
/**
 * 세계행사 P1-b — 축제 상세 → 플래너 딥링크 · 항공 위젯 날짜.
 *
 *   npm run smoke:korea-festival-planner-link
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tripWindowFromTourApiFestival } from '../src/pages/Korea/worldEventFromTourApiFestival.js';
import {
  buildPlacePlannerPathFromEvent,
  parseEventPlannerEntry,
} from '../src/utils/placePlannerPath.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
const plannerTabSrc = readFileSync(
  join(root, 'src/components/PlaceCard/tabs/PlannerTab.jsx'),
  'utf8',
);
const flightBannerSrc = readFileSync(
  join(root,
    'src/components/PlaceCard/tabs/planner/components/TripcomFlightBannerWidget.jsx'),
  'utf8',
);

assert.match(
  sheetSrc,
  /buildPlacePlannerPathFromEvent/,
  'FestivalDetailSheet uses buildPlacePlannerPathFromEvent',
);
assert.match(
  sheetSrc,
  /festivalPlannerHref/,
  'FestivalDetailSheet exposes festivalPlannerHref',
);
assert.match(
  plannerTabSrc,
  /parseEventPlannerEntry/,
  'PlannerTab parses event planner entry',
);
assert.match(
  plannerTabSrc,
  /eventTripWindow/,
  'PlannerTab derives eventTripWindow',
);
assert.match(
  flightBannerSrc,
  /departDate/,
  'TripcomFlightBannerWidget accepts departDate',
);
assert.match(
  flightBannerSrc,
  /returnDate/,
  'TripcomFlightBannerWidget accepts returnDate',
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

const plannerHref = buildPlacePlannerPathFromEvent('chuncheon', {
  checkIn: tripWindow.checkIn,
  checkOut: tripWindow.checkOut,
  eventId: tripWindow.eventId,
});
assert.ok(plannerHref);
assert.match(plannerHref, /^\/place\/chuncheon\/planner\?/);
const query = plannerHref.split('?')[1];
const parsed = parseEventPlannerEntry(query);
assert.ok(parsed);
assert.equal(parsed.eventId, 'korea-festival-100');
assert.equal(parsed.checkIn, tripWindow.checkIn);
assert.equal(parsed.checkOut, tripWindow.checkOut);

console.log('OK    smoke:korea-festival-planner-link — all assertions passed');
