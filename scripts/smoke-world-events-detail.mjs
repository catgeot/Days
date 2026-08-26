#!/usr/bin/env node
/**
 * 세계행사 Phase B — 상세 URL · lookup · edinburgh Tier0.5 스모크 (DOM 없음).
 *
 *   npm run smoke:world-events-detail
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWorldEventDetailPath } from '../src/utils/worldEventDetailPath.js';
import { getAllWorldEvents, getWorldEventById } from '../src/utils/worldEvents.js';
import { tripWindowPresetsFromEvent } from '../src/utils/worldEventTripPresets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const events = getAllWorldEvents();
assert.equal(events.length, 15, 'Wave1 has 15 events');

for (const event of events) {
  const found = getWorldEventById(event.id);
  assert.ok(found, `getWorldEventById resolves ${event.id}`);
  assert.equal(found.id, event.id);
  const href = buildWorldEventDetailPath(event.id);
  assert.equal(href, `/world-events/${event.id}`);
  const presets = tripWindowPresetsFromEvent(event);
  assert.equal(presets.eventDetailHref, href, `${event.id} eventDetailHref`);
}

const fringe = getWorldEventById('edinburgh-fringe-2026');
assert.ok(fringe, 'edinburgh-fringe-2026 present');
assert.ok(fringe.detailOverview, 'edinburgh has detailOverview');
assert.ok(Array.isArray(fringe.highlights) && fringe.highlights.length >= 2, 'edinburgh highlights');
assert.ok(Array.isArray(fringe.stayAreas) && fringe.stayAreas.length >= 1, 'edinburgh stayAreas');
assert.equal(fringe.recommendedNights, 4, 'edinburgh recommendedNights');

const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
assert.match(appSrc, /\/world-events\/:eventId/, 'App route for event detail');

const hubSrc = readFileSync(join(root, 'src/pages/WorldEvents/index.jsx'), 'utf8');
assert.match(hubSrc, /eventDetailHref/, 'WorldEvents hub uses eventDetailHref');

const detailSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventDetailPage.jsx'), 'utf8');
assert.match(detailSrc, /EventDetailStaticPanel/, 'EventDetailPage renders static panel');

console.log('OK    smoke:world-events-detail — all assertions passed');
