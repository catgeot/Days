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
import { buildWorldEventListPhotoQueries } from '../src/utils/worldEventMedia.js';
import {
  isUnsplashListPhoto,
  pickWorldEventListPhoto,
} from '../src/utils/worldEventListPhoto.js';
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
assert.equal(resolveWorldEventHubRegionId('rome'), 'europe', 'rome in europe');
assert.equal(resolveWorldEventHubRegionId('istanbul'), 'niche', 'istanbul stays niche');

const wikiSeed = {
  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/x.jpg/1280px-x.jpg',
  source: 'seed',
};
const unsplashThumb = {
  url: 'https://images.unsplash.com/photo-example?w=400',
  source: 'unsplash',
  photographer: 'Ada',
};
assert.equal(isUnsplashListPhoto(wikiSeed), false, 'wikimedia seed is not a list photo');
assert.equal(isUnsplashListPhoto(unsplashThumb), true, 'unsplash source is a list photo');
assert.equal(
  pickWorldEventListPhoto([wikiSeed, unsplashThumb])?.url,
  unsplashThumb.url,
  'list picker skips Wikimedia and takes Unsplash',
);
assert.equal(
  pickWorldEventListPhoto([wikiSeed]),
  null,
  'list picker does not fall back to Wikimedia',
);

const listPhotoProbeIds = [
  'paris-nuit-blanche-2027',
  'dubai-fitness-challenge-2026',
  'los-angeles-rose-parade-2027',
];
for (const eventId of listPhotoProbeIds) {
  const event = allEvents.find((item) => item.id === eventId);
  assert.ok(event, `${eventId} exists for list photo query probe`);
  const queries = buildWorldEventListPhotoQueries(event, 'ko');
  assert.ok(queries.length >= 3, `${eventId} has extended Unsplash query fallbacks`);
  assert.ok(
    queries.some((query) => /[A-Za-z]/.test(query)),
    `${eventId} list queries include English fallback`,
  );
}

const listPhotoSrc = readFileSync(join(root, 'src/utils/fetchWorldEventListPhotos.js'), 'utf8');
assert.match(listPhotoSrc, /event_hero_gallery/, 'list photos read Unsplash gallery cache');
assert.match(listPhotoSrc, /fetchUnsplashImages/, 'list photos live-search Unsplash');
assert.doesNotMatch(listPhotoSrc, /fetchWikimedia/, 'list photos do not call Wikimedia');

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
assert.match(hubSrc, /fetchWorldEventListPhotos/, 'WorldEvents hub fetches Unsplash list photos');
assert.match(hubSrc, /photo=\{photoById\[event\.id\]\}/, 'WorldEvents hub passes Unsplash thumb to cards');
assert.match(hubSrc, /images\.unsplash\.com|photoUrl/, 'WorldEvents hub card renders list photo');
assert.doesNotMatch(hubSrc, /upload\.wikimedia\.org/, 'WorldEvents hub list does not bake Wikimedia URLs');

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
