#!/usr/bin/env node
/**
 * 세계행사 P2-c — /world-events 허브 · PlaceCard 행사 섹션 스모크 (DOM 없음).
 *
 *   npm run smoke:world-events-hub
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WORLD_EVENT_HUB_REGIONS,
  resolveWorldEventHubRegionId,
  worldEventHubRegionSlugSet,
} from '../src/pages/WorldEvents/worldEventHubRegions.js';
import {
  getAllWorldEvents,
  getWorldEventsForHubRegion,
  getWorldEventsForSlug,
} from '../src/utils/worldEvents.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

assert.equal(WORLD_EVENT_HUB_REGIONS.length, 5, 'hub has 5 regions');

const allEvents = getAllWorldEvents();
assert.ok(allEvents.length >= 12, `Wave1 events present (got ${allEvents.length})`);
assert.equal(
  getWorldEventsForHubRegion('all').length,
  allEvents.length,
  'all region returns full list',
);

for (const region of WORLD_EVENT_HUB_REGIONS) {
  const regionEvents = getWorldEventsForHubRegion(region.id);
  assert.ok(regionEvents.length >= 1, `region ${region.id} has events`);
  const slugSet = worldEventHubRegionSlugSet(region.id);
  for (const event of regionEvents) {
    assert.ok(slugSet.has(event.slug), `${event.id} slug in region ${region.id}`);
    assert.equal(
      resolveWorldEventHubRegionId(event.slug),
      region.id,
      `${event.slug} resolves to ${region.id}`,
    );
  }
}

const viennaEvents = getWorldEventsForSlug('vienna');
assert.ok(viennaEvents.length >= 1, 'vienna has world events');
assert.ok(viennaEvents[0].startDate, 'vienna event has startDate');

const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
assert.match(appSrc, /path="\/world-events"/, 'App registers /world-events route');

const hubSrc = readFileSync(join(root, 'src/pages/WorldEvents/index.jsx'), 'utf8');
assert.match(hubSrc, /WORLD_EVENT_HUB_REGIONS/, 'WorldEvents hub uses region SSOT');
assert.match(hubSrc, /getWorldEventsForHubRegion/, 'WorldEvents hub filters by region');
assert.match(hubSrc, /tripWindowPresetsFromEvent/, 'WorldEvents hub uses TripWindow presets');
assert.match(hubSrc, /detailHref/, 'WorldEvents hub place CTA uses detail URL');

const homeUiSrc = readFileSync(join(root, 'src/pages/Home/components/HomeUI.jsx'), 'utf8');
assert.match(homeUiSrc, /to: '\/world-events'/, 'Home quick link to /world-events');
assert.match(
  homeUiSrc,
  /key: 'worldEvents'/,
  'Home quick link worldEvents after festival',
);

const placeSectionSrc = readFileSync(
  join(root, 'src/components/PlaceCard/common/PlaceWorldEventsSection.jsx'),
  'utf8',
);
assert.match(placeSectionSrc, /getWorldEventsForSlug/, 'PlaceWorldEventsSection reads slug events');
assert.match(placeSectionSrc, /tripWindowPresetsFromEvent/, 'PlaceWorldEventsSection uses TripWindow presets');

const qaSrc = readFileSync(
  join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'),
  'utf8',
);
assert.match(qaSrc, /slug:\s*'world-events'/, 'cloudQaShareLinks has world-events slug');

const vercelSrc = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercelSrc, /\/qa\/world-events/, 'vercel.json redirects /qa/world-events');

console.log('OK    smoke:world-events-hub — all assertions passed');
