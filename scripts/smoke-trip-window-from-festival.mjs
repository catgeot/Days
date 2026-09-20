#!/usr/bin/env node
/**
 * 세계행사 P0-b — TripWindow · TourAPI festival 어댑터 스모크 (DOM 없음).
 *
 *   npm run smoke:trip-window-from-festival
 */
import assert from 'node:assert/strict';
import {
  parseEventYmd,
  tripWindowFromEvent,
  tripWindowNights,
} from '../src/shared/tripWindow.js';
import {
  tripWindowFromTourApiFestival,
  worldEventFromTourApiFestival,
} from '../src/pages/Korea/worldEventFromTourApiFestival.js';

assert.equal(parseEventYmd('20260410'), '2026-04-10');
assert.equal(parseEventYmd('2026-04-10'), '2026-04-10');
assert.equal(parseEventYmd('bad'), null);

const multiDay = tripWindowFromEvent(
  { id: 'vienna-staatsoper-season-2026', startDate: '2026-09-01', endDate: '2026-09-05' },
  { todayYmd: '2026-01-01' },
);
assert.equal(multiDay.checkIn, '2026-08-31');
assert.equal(multiDay.checkOut, '2026-09-06');
assert.equal(multiDay.source, 'event');
assert.equal(multiDay.eventId, 'vienna-staatsoper-season-2026');
assert.ok(tripWindowNights(multiDay.checkIn, multiDay.checkOut) >= 2);

const singleDay = tripWindowFromEvent(
  { startDate: '20260410', endDate: '20260410' },
  { todayYmd: '2026-01-01' },
);
assert.equal(singleDay.checkIn, '2026-04-09');
assert.equal(singleDay.checkOut, '2026-04-11');
assert.equal(tripWindowNights(singleDay.checkIn, singleDay.checkOut), 2);

const clamped = tripWindowFromEvent(
  { startDate: '2026-01-01', endDate: '2026-01-31' },
  { todayYmd: '2026-01-15' },
);
assert.equal(clamped.checkIn, '2026-01-15');
assert.equal(clamped.checkOut, '2026-02-01');

const pastEvent = tripWindowFromEvent(
  { startDate: '2025-01-01', endDate: '2025-01-31' },
  { todayYmd: '2026-08-26' },
);
assert.equal(pastEvent.checkIn, '2026-08-26');
assert.equal(pastEvent.checkOut, '2026-08-28');
assert.equal(tripWindowNights(pastEvent.checkIn, pastEvent.checkOut), 2);

const hwacheon = {
  contentId: '100',
  title: '화천 산천어축제',
  titleEn: 'Hwacheon Sancheoneo Ice Festival',
  addr1: '강원특별자치도 화천군',
  eventStartDate: '20260101',
  eventEndDate: '20260131',
};

const worldEvent = worldEventFromTourApiFestival(hwacheon);
assert.ok(worldEvent);
assert.equal(worldEvent.id, 'korea-festival-100');
assert.equal(worldEvent.startDate, '2026-01-01');
assert.equal(worldEvent.endDate, '2026-01-31');
assert.equal(worldEvent.source, 'tourapi');
assert.equal(worldEvent.type, 'festival');
assert.equal(worldEvent.venue?.name, '강원특별자치도 화천군');

const fromFestival = tripWindowFromTourApiFestival(hwacheon, { todayYmd: '2025-12-01' });
assert.ok(fromFestival);
assert.equal(fromFestival.checkIn, '2025-12-31');
assert.equal(fromFestival.checkOut, '2026-01-30');
assert.equal(fromFestival.eventId, 'korea-festival-100');

assert.equal(worldEventFromTourApiFestival({ contentId: 'x', title: 't' }), null);
assert.equal(worldEventFromTourApiFestival({ contentId: '1', title: 't', eventStartDate: 'nope' }), null);

console.log('OK    smoke:trip-window-from-festival — all assertions passed');
