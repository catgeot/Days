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
import {
  compareWorldEventsForList,
  getWorldEventTimelineBucket,
} from '../src/shared/worldEventTimeline.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

assert.equal(WORLD_EVENT_HUB_REGIONS.length, 5, 'hub has 5 regions');

const allEvents = getAllWorldEvents();
assert.ok(allEvents.length >= 12, `Wave1 events present (got ${allEvents.length})`);

const bucketRank = { ongoing: 0, upcoming: 1, past: 2 };
for (let i = 0; i < allEvents.length - 1; i += 1) {
  const left = allEvents[i];
  const right = allEvents[i + 1];
  const leftBucket = getWorldEventTimelineBucket(left);
  const rightBucket = getWorldEventTimelineBucket(right);
  assert.ok(
    bucketRank[leftBucket] <= bucketRank[rightBucket],
    `events sorted ongoing→upcoming→past (${left.id} ${leftBucket} before ${right.id} ${rightBucket})`,
  );
  if (leftBucket === rightBucket) {
    assert.ok(
      compareWorldEventsForList(left, right) <= 0,
      `events in same bucket sorted by startDate (${left.id} before ${right.id})`,
    );
  }
}
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

assert.equal(resolveWorldEventHubRegionId('prague'), 'europe', 'prague in europe after Wave3 hub reorg');
assert.equal(resolveWorldEventHubRegionId('paris'), 'europe', 'paris in europe');
assert.equal(resolveWorldEventHubRegionId('london'), 'europe', 'london in europe');
assert.equal(resolveWorldEventHubRegionId('istanbul'), 'niche', 'istanbul stays niche');

const viennaEvents = getWorldEventsForSlug('vienna');
assert.ok(viennaEvents.length >= 1, 'vienna has world events');
assert.ok(viennaEvents[0].startDate, 'vienna event has startDate');

const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
assert.match(appSrc, /path="\/world-events"/, 'App registers /world-events route');
assert.match(appSrc, /\/en\/world-events/, 'App registers /en/world-events redirect');

const hubSrc = readFileSync(join(root, 'src/pages/WorldEvents/index.jsx'), 'utf8');
assert.match(hubSrc, /WORLD_EVENT_HUB_REGIONS/, 'WorldEvents hub uses region SSOT');
assert.match(hubSrc, /getWorldEventsForHubRegion/, 'WorldEvents hub filters by region');
assert.match(hubSrc, /tripWindowPresetsFromEvent/, 'WorldEvents hub uses TripWindow presets');
assert.match(hubSrc, /getWorldEventRecurrenceNote/, 'WorldEvents hub locale recurrenceNote');
assert.match(hubSrc, /locale={locale}/, 'WorldEvents hub passes locale to cards');

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
assert.match(qaSrc, /cursor\/world-events-wave3/, 'cloudQaShareLinks world-events uses wave3 branch');

const vercelSrc = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercelSrc, /\/qa\/world-events/, 'vercel.json redirects /qa/world-events');
assert.match(
  vercelSrc,
  /days-git-cursor-world-events-wave3-catgeots-projects\.vercel\.app/,
  'vercel.json /qa/world-events points to wave3 git Preview',
);
assert.match(vercelSrc, /"\/en\/world-events"/, 'vercel.json /en/world-events redirect');

console.log('OK    smoke:world-events-hub — all assertions passed');
