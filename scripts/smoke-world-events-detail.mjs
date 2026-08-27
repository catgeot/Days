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
import { getAllWorldEvents, getWorldEventById, getWorldEventLocation } from '../src/utils/worldEvents.js';
import { tripWindowPresetsFromEvent } from '../src/utils/worldEventTripPresets.js';
import { tripWindowNights } from '../src/shared/tripWindow.js';
import {
  buildWorldEventSearchQuery,
  getWorldEventHubAttractions,
} from '../src/utils/worldEventMedia.js';
import { addDaysYmd } from '../src/shared/tripWindow.js';

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

/** @param {string} eventId @param {number} nights */
function assertTier05(eventId, nights) {
  const event = getWorldEventById(eventId);
  assert.ok(event, `${eventId} present`);
  assert.ok(event.detailOverview, `${eventId} has detailOverview`);
  assert.ok(
    Array.isArray(event.highlights) && event.highlights.length >= 2,
    `${eventId} highlights`,
  );
  assert.ok(
    Array.isArray(event.stayAreas) && event.stayAreas.length >= 1,
    `${eventId} stayAreas`,
  );
  assert.equal(event.recommendedNights, nights, `${eventId} recommendedNights`);
}

assertTier05('munich-oktoberfest-2026', 3);
assertTier05('vienna-staatsoper-season-2026', 3);
assertTier05('amsterdam-kings-day-2027', 2);
assertTier05('tokyo-sakura-season-2027', 4);
assertTier05('kyoto-gion-matsuri-2027', 3);
assertTier05('bangkok-songkran-2027', 3);
assertTier05('bali-galungan-season-2026', 4);
assertTier05('rio-carnival-2027', 4);
assertTier05('new-york-thanksgiving-season-2026', 3);
assertTier05('iceland-midnight-sun-2027', 4);
assertTier05('sydney-vivid-2027', 3);
assertTier05('prague-spring-festival-2027', 3);
assertTier05('marrakech-rose-festival-2027', 2);
assertTier05('hanoi-tet-2027', 4);

const WAVE1_EVENT_IDS = [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'vienna-staatsoper-season-2026',
  'amsterdam-kings-day-2027',
  'tokyo-sakura-season-2027',
  'kyoto-gion-matsuri-2027',
  'bangkok-songkran-2027',
  'bali-galungan-season-2026',
  'rio-carnival-2027',
  'new-york-thanksgiving-season-2026',
  'iceland-midnight-sun-2027',
  'sydney-vivid-2027',
  'prague-spring-festival-2027',
  'marrakech-rose-festival-2027',
  'hanoi-tet-2027',
];

for (const eventId of WAVE1_EVENT_IDS) {
  const event = getWorldEventById(eventId);
  assert.ok(event, `${eventId} in Wave1 roster`);
  assert.ok(event.detailOverview, `${eventId} Tier0.5 detailOverview`);
}

const rio = tripWindowPresetsFromEvent(getWorldEventById('rio-carnival-2027'));
assert.ok(rio.visitPresets.length >= 1, 'rio visit presets');
assert.ok(
  tripWindowNights(rio.tripWindow.checkIn, rio.tripWindow.checkOut) <= 10,
  'rio CTA nights capped',
);

const { resolvePlannerFlightArrivalIata } = await import('../src/utils/rentalAirportMatch.js');
const rioLoc = getWorldEventLocation('rio-de-janeiro');
assert.equal(resolvePlannerFlightArrivalIata(rioLoc), 'GIG', 'rio arrival IATA for packages prefill');

const edinburghLoc = getWorldEventLocation('edinburgh');
assert.equal(resolvePlannerFlightArrivalIata(edinburghLoc), 'EDI', 'edinburgh arrival IATA');
const pragueLoc = getWorldEventLocation('prague');
assert.equal(resolvePlannerFlightArrivalIata(pragueLoc), 'PRG', 'prague arrival IATA');
const hanoiLoc = getWorldEventLocation('hanoi');
assert.equal(resolvePlannerFlightArrivalIata(hanoiLoc), 'HAN', 'hanoi arrival IATA');
const marrakechLoc = getWorldEventLocation('marrakech');
assert.equal(resolvePlannerFlightArrivalIata(marrakechLoc), 'RAK', 'marrakech arrival IATA');

const edinburghPresets = tripWindowPresetsFromEvent(getWorldEventById('edinburgh-fringe-2026'));

const stayStripSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventStayStrip.jsx'), 'utf8');
assert.match(
  stayStripSrc,
  /departDate: checkIn/,
  'EventStayStrip passes checkIn as departDate',
);
assert.match(
  stayStripSrc,
  /checkIn,\s*\n\s*checkOut/,
  'EventStayStrip passes hotel checkIn/checkOut to packages',
);
assert.match(
  stayStripSrc,
  /adultCount/,
  'EventStayStrip passes adultCount to packages',
);
assert.ok(edinburghPresets.tripWindow.checkIn, 'edinburgh preset checkIn for packages prefill');
assert.ok(edinburghPresets.tripWindow.checkOut, 'edinburgh preset checkOut for packages prefill');

const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
assert.match(appSrc, /\/world-events\/:eventId/, 'App route for event detail');

const hubSrc = readFileSync(join(root, 'src/pages/WorldEvents/index.jsx'), 'utf8');
assert.match(hubSrc, /eventDetailHref/, 'WorldEvents hub uses eventDetailHref');

const detailSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventDetailPage.jsx'), 'utf8');
assert.match(detailSrc, /EventDetailStaticPanel/, 'EventDetailPage renders static panel');
assert.match(detailSrc, /shouldShowEventTravelGuidePanel/, 'EventDetailPage suppresses AI panel on PROD');
assert.match(detailSrc, /EventStayStrip/, 'EventDetailPage renders in-page stay strip');
assert.match(detailSrc, /EventMooniFab/, 'EventDetailPage renders Mooni FAB');
assert.match(detailSrc, /EventActionChips/, 'EventDetailPage renders action chips');
assert.match(detailSrc, /EventMooniChips/, 'EventDetailPage renders Mooni chips');
assert.match(detailSrc, /EventDetailHero/, 'EventDetailPage renders hero image');
assert.match(detailSrc, /EventDetailMediaSection/, 'EventDetailPage renders D3 media section');
assert.match(detailSrc, /hasWorldEventD3Media/, 'EventDetailPage gates D3 media');

const munich = getWorldEventById('munich-oktoberfest-2026');
assert.ok(munich.heroImage, 'munich heroImage');
assert.ok(Array.isArray(munich.youtubeVideos) && munich.youtubeVideos.length >= 2, 'munich youtubeVideos');
assert.ok(Array.isArray(munich.actionChips) && munich.actionChips.length >= 3, 'munich actionChips');
assert.ok(Array.isArray(munich.mooniChips) && munich.mooniChips.length >= 3, 'munich mooniChips');
assert.equal(munich.actionChips[0].kind, 'official', 'munich first action chip kind');
assert.match(munich.actionChips[1].href, /google\.com\/maps/, 'munich map chip href');

const edinburgh = getWorldEventById('edinburgh-fringe-2026');
assert.ok(edinburgh.heroImage, 'edinburgh heroImage');
assert.ok(Array.isArray(edinburgh.youtubeVideos) && edinburgh.youtubeVideos.length >= 2, 'edinburgh youtubeVideos');
assert.ok(Array.isArray(edinburgh.actionChips) && edinburgh.actionChips.length >= 3, 'edinburgh actionChips');
assert.ok(edinburgh.actionChips.some((chip) => /edfringe\.com/.test(chip.href)), 'edinburgh official chip');
assert.ok(edinburgh.actionChips.some((chip) => /Royal\+Mile|Royal%20Mile/i.test(chip.href)), 'edinburgh Royal Mile chip');

const bali = getWorldEventById('bali-galungan-season-2026');
assert.ok(bali.heroImage, 'bali heroImage');
assert.ok(Array.isArray(bali.youtubeVideos) && bali.youtubeVideos.length >= 2, 'bali youtubeVideos');
assert.ok(Array.isArray(bali.actionChips) && bali.actionChips.length >= 3, 'bali actionChips');
assert.ok(Array.isArray(bali.mooniChips) && bali.mooniChips.length >= 3, 'bali mooniChips');
assert.equal(bali.hubId, 'bali', 'bali hubId for attraction bridge');

const chipsUtilSrc = readFileSync(join(root, 'src/utils/worldEventChips.js'), 'utf8');
assert.match(chipsUtilSrc, /buildWorldEventMooniSeed/, 'worldEventChips seed builder');

const mediaUtilSrc = readFileSync(join(root, 'src/utils/worldEventMedia.js'), 'utf8');
assert.match(mediaUtilSrc, /getWorldEventHubAttractions/, 'worldEventMedia hub bridge');
assert.match(mediaUtilSrc, /buildWorldEventSearchQuery/, 'worldEventMedia search query');

const outboundSrc = readFileSync(join(root, 'src/utils/worldEventOutboundLinks.js'), 'utf8');
assert.match(outboundSrc, /naverWebSearchUrl/, 'naver search url builder');

const baliHub = getWorldEventHubAttractions(bali, { locale: 'ko' });
assert.ok(baliHub.hub?.href === '/place/bali', 'bali hub link');
assert.ok(baliHub.attractions.length >= 3, 'bali hub attractions');
assert.ok(baliHub.attractions[0].href.startsWith('/place/'), 'attraction place link');
assert.ok(buildWorldEventSearchQuery(bali, 'ko').includes('갈룽안'), 'bali search query ko');
assert.ok(!buildWorldEventSearchQuery(bali, 'ko').includes('islandwide'), 'bali search query no English venue');
assert.match(bali.actionChips[0].href, /en\.wikipedia\.org\/wiki\/Galungan/, 'bali Galungan en.wikipedia guide');
assert.match(bali.actionChips[2].href, /penjor/, 'bali penjor search query');

const munichPresets = tripWindowPresetsFromEvent(getWorldEventById('munich-oktoberfest-2026'));
const munichOpening = munichPresets.visitPresets.find((p) => p.id === 'opening');
assert.ok(munichOpening, 'munich opening preset');
assert.equal(
  munichPresets.tripWindow.checkIn,
  munichOpening.checkIn,
  'default tripWindow matches opening preset',
);
assert.equal(
  munichOpening.checkIn,
  addDaysYmd(getWorldEventById('munich-oktoberfest-2026').startDate, -1),
  'opening check-in is day before event start',
);
assert.match(stayStripSrc, /synced\.checkIn === checkIn/, 'EventStayStrip skips redundant preset apply');

assert.match(stayStripSrc, /EventFlightHotelCta/, 'EventStayStrip uses packages CTA');
assert.match(stayStripSrc, /event-detail-flight/, 'EventStayStrip event-detail-flight tracking');
assert.match(stayStripSrc, /mode: 'packages'/, 'EventStayStrip packages mode');
assert.match(stayStripSrc, /placeLabel/, 'EventStayStrip placeLabel override');
assert.match(stayStripSrc, /accent="light"/, 'EventStayStrip light guest stepper');

const mooniFabSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventMooniFab.jsx'), 'utf8');
assert.match(mooniFabSrc, /onClick/, 'EventMooniFab triggers onClick');

const affiliateSrc = readFileSync(join(root, 'src/utils/affiliate.js'), 'utf8');
assert.match(affiliateSrc, /event-detail-flight/, 'affiliate event-detail-flight tracking');
assert.match(affiliateSrc, /if \(mode === 'packages'\)/, 'packages/list gated by mode=packages only');
assert.match(affiliateSrc, /bali: '723'/, 'bali Trip.com hotel city id for packages');

assert.doesNotMatch(
  stayStripSrc,
  /WhiteLabelWidget/,
  'EventStayStrip uses packages link not WhiteLabelWidget',
);

const globeSrc = readFileSync(join(root, 'src/pages/Home/components/HomePlaceCardSummary.jsx'), 'utf8');
assert.match(globeSrc, /GlobeStayStrip/, 'GlobeStayStrip still wired on place summary (regression)');
assert.match(
  readFileSync(join(root, 'src/pages/Home/components/GlobeStayStrip.jsx'), 'utf8'),
  /WhiteLabelWidget/,
  'GlobeStayStrip WhiteLabelWidget regression',
);

console.log('OK    smoke:world-events-detail — all assertions passed');
