#!/usr/bin/env node
/**
 * 세계행사 Phase A — edinburgh TripWindow 프리셋 · 허브 상세 URL 스모크 (DOM 없음).
 *
 *   npm run smoke:trip-window-edinburgh
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EVENT_PLANNER_QUERY_KEY } from '../src/utils/placePlannerPath.js';
import { getWorldEventsForSlug } from '../src/utils/worldEvents.js';
import { tripWindowPresetsFromEvent } from '../src/utils/worldEventTripPresets.js';
import { tripWindowNights } from '../src/shared/tripWindow.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const edinburghEvents = getWorldEventsForSlug('edinburgh');
assert.ok(edinburghEvents.length >= 1, 'edinburgh has world events');

const fringe = edinburghEvents.find((event) => event.id === 'edinburgh-fringe-2026');
assert.ok(fringe, 'edinburgh-fringe-2026 override present');
assert.equal(fringe.startDate, '2026-08-07');
assert.equal(fringe.endDate, '2026-08-31');

const presets = tripWindowPresetsFromEvent(fringe, { todayYmd: '2026-01-01' });

assert.equal(presets.slug, 'edinburgh');
assert.equal(presets.eventId, 'edinburgh-fringe-2026');
assert.equal(presets.tripWindow.checkIn, '2026-08-06');
assert.equal(presets.tripWindow.checkOut, '2026-09-01');
assert.ok(tripWindowNights(presets.tripWindow.checkIn, presets.tripWindow.checkOut) >= 2);

assert.ok(presets.detailHref?.startsWith('/place/edinburgh?'), 'detailHref is place detail with query');
assert.ok(presets.plannerHref?.startsWith('/place/edinburgh/planner?'), 'plannerHref uses planner path');

const detailUrl = new URL(presets.detailHref, 'https://www.gateo.kr');
assert.equal(detailUrl.searchParams.get(EVENT_PLANNER_QUERY_KEY), 'edinburgh-fringe-2026');
assert.equal(detailUrl.searchParams.get('checkIn'), '2026-08-06');
assert.equal(detailUrl.searchParams.get('checkOut'), '2026-09-01');

const plannerUrl = new URL(presets.plannerHref, 'https://www.gateo.kr');
assert.equal(plannerUrl.searchParams.get(EVENT_PLANNER_QUERY_KEY), 'edinburgh-fringe-2026');
assert.equal(plannerUrl.searchParams.get('checkIn'), '2026-08-06');
assert.equal(plannerUrl.searchParams.get('checkOut'), '2026-09-01');

assert.equal(presets.sourceUrl, fringe.sourceUrl);

const hubSrc = readFileSync(join(root, 'src/pages/WorldEvents/index.jsx'), 'utf8');
assert.match(hubSrc, /tripWindowPresetsFromEvent/, 'WorldEvents hub uses tripWindowPresetsFromEvent');
assert.match(hubSrc, /detailHref/, 'WorldEvents hub links place CTA via detailHref');

console.log('OK    smoke:trip-window-edinburgh — all assertions passed');
