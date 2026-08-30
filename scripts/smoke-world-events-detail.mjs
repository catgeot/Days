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
import { getAllWorldEvents, getWorldEventById, getWorldEventBookingHints, getWorldEventDetailOverview, getWorldEventHighlights, getWorldEventLocation, getWorldEventRecurrenceNote, getWorldEventStayAreas } from '../src/utils/worldEvents.js';
import { localizeEventTravelGuide } from '../src/utils/eventTravelGuideLocale.js';
import { tripWindowPresetsFromEvent } from '../src/utils/worldEventTripPresets.js';
import { tripWindowNights } from '../src/shared/tripWindow.js';
import {
  buildWorldEventSearchQuery,
  buildWorldEventHeroGalleryQueries,
  buildWorldEventYoutubeSearchQuery,
  getWorldEventHubAttractions,
} from '../src/utils/worldEventMedia.js';
import { addDaysYmd } from '../src/shared/tripWindow.js';
import {
  extractGoogleMapsSearchQuery,
  googleWebSearchUrl,
} from '../src/utils/worldEventOutboundLinks.js';
import { isLikelyTruncatedGlossaryAnswer } from '../src/utils/worldEventGlossaryAnswer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const events = getAllWorldEvents();
assert.equal(events.length, 17, 'Wave1+Wave2 has 17 events');

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

const WAVE2_EVENT_IDS = ['singapore-gp-2026', 'dubai-fitness-challenge-2026'];

const D5_B_BATCH_A_EVENT_IDS = [
  'vienna-staatsoper-season-2026',
  'amsterdam-kings-day-2027',
  'prague-spring-festival-2027',
  'marrakech-rose-festival-2027',
];

const D5_B_BATCH_B_EVENT_IDS = [
  'tokyo-sakura-season-2027',
  'kyoto-gion-matsuri-2027',
  'bangkok-songkran-2027',
];

const D5_B_BATCH_C_EVENT_IDS = [
  'rio-carnival-2027',
  'new-york-thanksgiving-season-2026',
  'iceland-midnight-sun-2027',
  'sydney-vivid-2027',
];

const D5_B_BATCH_D_EVENT_IDS = ['hanoi-tet-2027'];

for (const eventId of WAVE1_EVENT_IDS) {
  const event = getWorldEventById(eventId);
  assert.ok(event, `${eventId} in Wave1 roster`);
  assert.ok(event.detailOverview, `${eventId} Tier0.5 detailOverview`);
}

for (const eventId of WAVE2_EVENT_IDS) {
  const event = getWorldEventById(eventId);
  assert.ok(event, `${eventId} in Wave2 roster`);
  assert.ok(event.detailOverview, `${eventId} Tier0.5 detailOverview`);
  assert.ok(Array.isArray(event.glossaryTerms) && event.glossaryTerms.length >= 4, `${eventId} glossaryTerms`);
  assert.ok(Array.isArray(event.heroImages) && event.heroImages.length >= 3, `${eventId} heroImages`);
  assert.ok(
    Array.isArray(event.highlightContextLinks) && event.highlightContextLinks.length >= 2,
    `${eventId} highlightContextLinks`,
  );
  assert.ok(!Array.isArray(event.actionChips) || event.actionChips.length === 0, `${eventId} no actionChips`);
}

for (const eventId of D5_B_BATCH_A_EVENT_IDS) {
  const event = getWorldEventById(eventId);
  assert.ok(event, `${eventId} in D5-b batch A`);
  assert.ok(Array.isArray(event.glossaryTerms) && event.glossaryTerms.length >= 4, `${eventId} glossaryTerms`);
  assert.ok(Array.isArray(event.heroImages) && event.heroImages.length >= 3, `${eventId} heroImages`);
  assert.ok(
    Array.isArray(event.highlightContextLinks) && event.highlightContextLinks.length >= 2,
    `${eventId} highlightContextLinks`,
  );
  assert.ok(!Array.isArray(event.actionChips) || event.actionChips.length === 0, `${eventId} no actionChips`);
}

for (const eventId of D5_B_BATCH_B_EVENT_IDS) {
  const event = getWorldEventById(eventId);
  assert.ok(event, `${eventId} in D5-b batch B`);
  assert.ok(Array.isArray(event.glossaryTerms) && event.glossaryTerms.length >= 4, `${eventId} glossaryTerms`);
  assert.ok(Array.isArray(event.heroImages) && event.heroImages.length >= 3, `${eventId} heroImages`);
  assert.ok(
    Array.isArray(event.highlightContextLinks) && event.highlightContextLinks.length >= 2,
    `${eventId} highlightContextLinks`,
  );
  assert.ok(!Array.isArray(event.actionChips) || event.actionChips.length === 0, `${eventId} no actionChips`);
}

for (const eventId of D5_B_BATCH_C_EVENT_IDS) {
  const event = getWorldEventById(eventId);
  assert.ok(event, `${eventId} in D5-b batch C`);
  assert.ok(Array.isArray(event.glossaryTerms) && event.glossaryTerms.length >= 4, `${eventId} glossaryTerms`);
  assert.ok(Array.isArray(event.heroImages) && event.heroImages.length >= 3, `${eventId} heroImages`);
  assert.ok(
    Array.isArray(event.highlightContextLinks) && event.highlightContextLinks.length >= 2,
    `${eventId} highlightContextLinks`,
  );
  assert.ok(!Array.isArray(event.actionChips) || event.actionChips.length === 0, `${eventId} no actionChips`);
}

for (const eventId of D5_B_BATCH_D_EVENT_IDS) {
  const event = getWorldEventById(eventId);
  assert.ok(event, `${eventId} in D5-b batch D`);
  assert.ok(Array.isArray(event.glossaryTerms) && event.glossaryTerms.length >= 4, `${eventId} glossaryTerms`);
  assert.ok(Array.isArray(event.heroImages) && event.heroImages.length >= 3, `${eventId} heroImages`);
  assert.ok(
    Array.isArray(event.highlightContextLinks) && event.highlightContextLinks.length >= 2,
    `${eventId} highlightContextLinks`,
  );
  assert.ok(!Array.isArray(event.actionChips) || event.actionChips.length === 0, `${eventId} no actionChips`);
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
const singaporeLoc = getWorldEventLocation('singapore');
assert.equal(resolvePlannerFlightArrivalIata(singaporeLoc), 'SIN', 'singapore arrival IATA');
const dubaiLoc = getWorldEventLocation('dubai');
assert.equal(resolvePlannerFlightArrivalIata(dubaiLoc), 'DXB', 'dubai arrival IATA');

const edinburghPresets = tripWindowPresetsFromEvent(getWorldEventById('edinburgh-fringe-2026'));

const stayStripSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventStayStrip.jsx'), 'utf8');
assert.match(stayStripSrc, /getWorldEventStayAreas/, 'EventStayStrip locale stayAreas');
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
assert.match(hubSrc, /getWorldEventRecurrenceNote/, 'WorldEvents hub locale recurrenceNote');
assert.match(hubSrc, /eventDetailHref/, 'WorldEvents hub uses eventDetailHref');

const detailSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventDetailPage.jsx'), 'utf8');
assert.match(detailSrc, /EventDetailStaticPanel/, 'EventDetailPage renders static panel');
assert.match(detailSrc, /shouldShowEventTravelGuidePanel/, 'EventDetailPage suppresses AI panel on PROD');
const travelGuidePanelSrc = readFileSync(
  join(root, 'src/pages/WorldEvents/EventTravelGuidePanel.jsx'),
  'utf8',
);
assert.match(travelGuidePanelSrc, /localizeEventTravelGuide/, 'EventTravelGuidePanel locale guide');
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

const bangkok = getWorldEventById('bangkok-songkran-2027');
const bangkokWaterproof = bangkok.highlightContextLinks
  .find((group) => group.highlightIndex === 1)
  ?.links.find((link) => link.id === 'waterproof-bag');
assert.ok(bangkokWaterproof?.searchTarget === 'google', 'bangkok waterproof bag google search target');

const sydney = getWorldEventById('sydney-vivid-2027');
const sydneyTransport = sydney.highlightContextLinks.find((group) => group.highlightIndex === 2);
const sydneyFerry = sydneyTransport?.links.find((link) => link.id === 'sydney-ferry-official');
const sydneyTram = sydneyTransport?.links.find((link) => link.id === 'sydney-tram-pass');
assert.ok(sydneyFerry?.href?.includes('transportnsw.info'), 'sydney ferry official transportnsw href');
assert.match(sydneyFerry?.href || '', /f1|ferry/i, 'sydney ferry manly route href');
assert.ok(sydneyTram?.searchTarget === 'klook', 'sydney tram klook search target');
assert.match(sydneyTram?.searchQueryKo || '', /교통 패스/, 'sydney tram transit pass query ko');

const bali = getWorldEventById('bali-galungan-season-2026');
assert.ok(bali.heroImage, 'bali heroImage');
assert.ok(Array.isArray(bali.youtubeVideos) && bali.youtubeVideos.length >= 2, 'bali youtubeVideos');
assert.ok(Array.isArray(bali.actionChips) && bali.actionChips.length >= 3, 'bali actionChips');
assert.ok(Array.isArray(bali.mooniChips) && bali.mooniChips.length >= 3, 'bali mooniChips');
assert.equal(bali.hubId, 'bali', 'bali hubId for attraction bridge');

const chipsUtilSrc = readFileSync(join(root, 'src/utils/worldEventChips.js'), 'utf8');
assert.match(chipsUtilSrc, /buildWorldEventMooniSeed/, 'worldEventChips seed builder');
assert.match(chipsUtilSrc, /getWorldEventDetailOverview/, 'worldEventChips locale overview seed');
assert.match(chipsUtilSrc, /getWorldEventHighlights/, 'worldEventChips locale highlights seed');

const mediaUtilSrc = readFileSync(join(root, 'src/utils/worldEventMedia.js'), 'utf8');
assert.match(mediaUtilSrc, /getWorldEventHubAttractions/, 'worldEventMedia hub bridge');
assert.match(mediaUtilSrc, /buildWorldEventSearchQuery/, 'worldEventMedia search query');
assert.match(mediaUtilSrc, /buildWorldEventYoutubeSearchQuery/, 'worldEventMedia youtube search query');
assert.match(mediaUtilSrc, /heroImage/, 'hasWorldEventD3Media checks heroImage data');

const outboundSrc = readFileSync(join(root, 'src/utils/worldEventOutboundLinks.js'), 'utf8');
assert.match(outboundSrc, /naverWebSearchUrl/, 'naver search url builder');
assert.match(outboundSrc, /youtubeWebSearchUrl/, 'youtube search url builder');

const baliHub = getWorldEventHubAttractions(bali, { locale: 'ko' });
assert.ok(baliHub.hub?.href === '/place/bali', 'bali hub link');
assert.ok(baliHub.attractions.length >= 3, 'bali hub attractions');
assert.ok(baliHub.attractions[0].href.startsWith('/place/'), 'attraction place link');
assert.ok(buildWorldEventSearchQuery(bali, 'ko').includes('갈룽안'), 'bali search query ko');
assert.ok(!buildWorldEventSearchQuery(bali, 'ko').includes('islandwide'), 'bali search query no English venue');
assert.ok(buildWorldEventSearchQuery(bali, 'en').includes('Galungan'), 'bali search query en');
assert.ok(!buildWorldEventSearchQuery(bali, 'en').includes('islandwide'), 'bali en search query no venue name');
assert.equal(buildWorldEventYoutubeSearchQuery(bali, 'ko'), '발리 갈룽안 축제', 'bali youtube search ko');
assert.equal(buildWorldEventYoutubeSearchQuery(bali, 'en'), 'Bali Galungan festival', 'bali youtube search en');

const baliSarongGoogle = bali.highlightContextLinks
  .find((group) => group.highlightIndex === 0)
  ?.links.find((link) => link.id === 'sarong-rental');
const baliSarongKlook = bali.highlightContextLinks
  .find((group) => group.highlightIndex === 0)
  ?.links.find((link) => link.id === 'sarong-klook');
assert.ok(baliSarongGoogle?.searchTarget === 'google', 'bali sarong google search target');
assert.ok(baliSarongKlook?.searchTarget === 'klook', 'bali sarong klook search target');
assert.match(baliSarongGoogle?.searchQueryKo || '', /사롱/, 'bali sarong google query ko');
assert.match(baliSarongKlook?.searchQueryKo || '', /사롱/, 'bali sarong klook query ko');
assert.match(baliSarongKlook?.searchQueryEn || '', /sarong/i, 'bali sarong klook query en');
assert.match(bali.actionChips[0].href, /en\.wikipedia\.org\/wiki\/Galungan/, 'bali Galungan en.wikipedia guide');
assert.match(bali.actionChips[2].href, /penjor/, 'bali penjor search query');
assert.ok(
  bali.actionChips.some((chip) => chip.kind === 'shop' && /sarong/i.test(chip.id)),
  'bali shop sarong chip',
);
assert.ok(
  bali.actionChips.filter((chip) => chip.kind === 'shop').length >= 2,
  'bali has 2+ shop actionChips',
);

const executionUtilSrc = readFileSync(join(root, 'src/utils/worldEventExecution.js'), 'utf8');
assert.match(executionUtilSrc, /hasWorldEventD5Execution/, 'worldEventExecution D5 gate');

const glossaryUtilSrc = readFileSync(join(root, 'src/utils/worldEventGlossary.js'), 'utf8');
assert.match(glossaryUtilSrc, /hasWorldEventD5bBodyUx/, 'worldEventGlossary D5-b gate');
assert.match(glossaryUtilSrc, /getWorldEventHeroImages/, 'worldEventGlossary hero images');
assert.match(glossaryUtilSrc, /resolveHighlightContextLinkHref/, 'worldEventGlossary context links');
assert.match(glossaryUtilSrc, /getKlookSearchUrl/, 'worldEventGlossary klook search url');
assert.match(glossaryUtilSrc, /get12GoAffiliateUrl/, 'worldEventGlossary 12go affiliate url');
assert.match(glossaryUtilSrc, /getGlossaryTermReferenceUrl/, 'worldEventGlossary reference url locale');
assert.match(glossaryUtilSrc, /getWorldEventGlossaryTermById/, 'worldEventGlossary term by id locale');
assert.match(glossaryUtilSrc, /term\.termEn && term\.promptEn/, 'worldEventGlossary EN terms require En fields');

const richTextSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventRichText.jsx'), 'utf8');
assert.match(richTextSrc, /buildGlossarySegments/, 'EventRichText glossary wrapping');
assert.match(richTextSrc, /linkedTermIds/, 'EventRichText shared glossary link state');

const PILOT_I18N_EVENT_IDS = [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'bali-galungan-season-2026',
];

for (const eventId of PILOT_I18N_EVENT_IDS) {
  const event = getWorldEventById(eventId);
  assert.ok(event?.detailOverviewEn, `${eventId} has detailOverviewEn`);
  assert.ok(
    Array.isArray(event.highlightsEn) && event.highlightsEn.length >= 2,
    `${eventId} has highlightsEn`,
  );
  assert.equal(
    event.highlightsEn.length,
    event.highlights.length,
    `${eventId} highlightsEn length matches highlights`,
  );
  const overviewEn = getWorldEventDetailOverview(event, 'en');
  const highlightsEn = getWorldEventHighlights(event, 'en');
  assert.ok(overviewEn && overviewEn === event.detailOverviewEn, `${eventId} locale en overview`);
  assert.equal(highlightsEn.length, event.highlightsEn.length, `${eventId} locale en highlights count`);
  assert.ok(
    highlightsEn.every((item, index) => item === event.highlightsEn[index]),
    `${eventId} locale en highlights items`,
  );
  assert.ok(
    getWorldEventDetailOverview(event, 'ko') === event.detailOverview,
    `${eventId} locale ko overview fallback`,
  );
  assert.ok(
    getWorldEventRecurrenceNote(event, 'en') === event.recurrenceNoteEn,
    `${eventId} locale en recurrenceNote`,
  );
  const stayAreasEn = getWorldEventStayAreas(event, 'en');
  if (Array.isArray(event.stayAreas) && event.stayAreas.length > 0) {
    assert.equal(stayAreasEn.length, event.stayAreas.length, `${eventId} stayAreas en count`);
    assert.ok(
      stayAreasEn.every((area, index) => area.name === event.stayAreas[index].nameEn),
      `${eventId} stayAreas en names`,
    );
  }
}

const singapore = getWorldEventById('singapore-gp-2026');
assert.ok(singapore, 'singapore present for i18n-2 non-pilot');
assert.equal(getWorldEventDetailOverview(singapore, 'en'), '', 'non-pilot EN overview has no KO fallback');
assert.deepEqual(getWorldEventHighlights(singapore, 'en'), [], 'non-pilot EN highlights has no KO fallback');
assert.equal(getWorldEventBookingHints(singapore, 'en'), '', 'non-pilot EN bookingHints hidden');
assert.equal(
  getWorldEventRecurrenceNote(singapore, 'en'),
  singapore.recurrenceNoteEn,
  'non-pilot EN recurrenceNote uses En field',
);
assert.equal(getWorldEventStayAreas(singapore, 'en').length, 0, 'non-pilot EN stayAreas without nameEn hidden');

const seoUrlsSrc = readFileSync(join(root, 'src/i18n/seoUrls.js'), 'utf8');
assert.match(seoUrlsSrc, /'\/world-events'/, 'I18N_HUB_PATHS includes /world-events');

const vercelSrc = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercelSrc, /"\/en\/world-events"/, 'vercel /en/world-events redirect');
assert.match(vercelSrc, /"\/en\/world-events\/:eventId"/, 'vercel /en/world-events/:eventId redirect');

const staticPanelSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventDetailStaticPanel.jsx'), 'utf8');
assert.match(staticPanelSrc, /getWorldEventBookingHints/, 'EventDetailStaticPanel locale bookingHints');

const edinburghGuideFixture = JSON.parse(
  readFileSync(join(root, 'scripts/fixtures/event-travel-guide/edinburgh-fringe-2026.json'), 'utf8'),
);
const edinburghGuideEn = localizeEventTravelGuide(edinburghGuideFixture, 'en');
assert.ok(
  edinburghGuideEn.trip_presets[0].label.includes('Opening week'),
  'event travel guide locale en trip preset label',
);
assert.ok(
  edinburghGuideEn.sections[0].title.includes('Choosing shows'),
  'event travel guide locale en section title',
);

assert.match(staticPanelSrc, /getWorldEventDetailOverview/, 'EventDetailStaticPanel locale overview');
assert.match(staticPanelSrc, /getWorldEventHighlights/, 'EventDetailStaticPanel locale highlights');
assert.match(staticPanelSrc, /getWorldEventRecurrenceNote/, 'EventDetailStaticPanel locale recurrenceNote');
assert.match(staticPanelSrc, /getWorldEventStayAreas/, 'EventDetailStaticPanel locale stayAreas');
assert.match(staticPanelSrc, /linkedTermIdsRef/, 'EventDetailStaticPanel shared glossary refs');
assert.match(staticPanelSrc, /hideHeaderSummary/, 'EventDetailStaticPanel hideHeaderSummary gate');
assert.match(detailSrc, /hideHeaderSummary/, 'EventDetailPage D5-b summary dedupe');
assert.match(detailSrc, /heroEyebrow/, 'EventDetailPage season meta strip highlight label');

const termModalSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventTermExplainModal.jsx'), 'utf8');
assert.match(termModalSrc, /fetchEventTermExplanation/, 'EventTermExplainModal cached explain');
assert.match(termModalSrc, /peekEventTermExplanationCache/, 'EventTermExplainModal memory cache warm');
assert.match(termModalSrc, /getGlossaryTermReferenceUrl/, 'EventTermExplainModal locale reference url');
assert.match(termModalSrc, /safe-area-inset-bottom/, 'EventTermExplainModal safe area bottom');
assert.match(termModalSrc, /getWorldEventGlossaryTermById\(event, termId, locale\)/, 'EventTermExplainModal locale term lookup');

const stehplatzTruncated =
  '빈 오페라 스탠딩석(Stehplatz)은 빈 국립 오페라 극장에서 가장 저렴하게 오페라를 관람할 수 있는 입석 티';
assert.ok(isLikelyTruncatedGlossaryAnswer(stehplatzTruncated, 'ko'), 'truncated stehplatz sample');
assert.ok(
  !isLikelyTruncatedGlossaryAnswer(
    '빈 오페라 스탠딩석은 당일 현장 구매가 가능하며, 인기 공연은 조기 매진됩니다. 편한 신발과 여유 시간을 준비하세요.',
    'ko',
  ),
  'complete stehplatz sample',
);

const explainTermSrc = readFileSync(
  join(root, 'supabase/functions/explain-event-term/index.ts'),
  'utf8',
);
assert.match(explainTermSrc, /thinkingBudget:\s*0/, 'explain-event-term disables thinking budget');
assert.match(explainTermSrc, /isLikelyTruncatedGlossaryAnswer/, 'explain-event-term trunc guard');
assert.match(explainTermSrc, /!part\?\.thought/, 'explain-event-term skips thought parts');

const fetchExplainSrc = readFileSync(join(root, 'src/utils/fetchEventTermExplanation.js'), 'utf8');
assert.match(fetchExplainSrc, /isLikelyTruncatedGlossaryAnswer/, 'fetch explain trunc guard');
assert.match(fetchExplainSrc, /force/, 'fetch explain force retry');

const glossaryAnswerSrc = readFileSync(join(root, 'src/utils/worldEventGlossaryAnswer.js'), 'utf8');
assert.match(glossaryAnswerSrc, /isLikelyTruncatedGlossaryAnswer/, 'worldEventGlossaryAnswer trunc guard');

const glossarySearchUrl = googleWebSearchUrl(bali.glossaryTerms[0].searchQueryKo, 'ko');
assert.match(glossarySearchUrl, /google\.com\/search/, 'glossary modal google web search');
assert.doesNotMatch(glossarySearchUrl, /google\.com\/maps/, 'glossary modal not maps');
assert.match(glossarySearchUrl, /udm=14/, 'glossary google search uses web tab param');

const tokyo = getWorldEventById('tokyo-sakura-season-2027');
const uenoTerm = tokyo.glossaryTerms.find((term) => term.id === 'ueno-park');
assert.ok(uenoTerm?.referenceUrlKo, 'ueno-park referenceUrlKo');
const uenoRefKo = uenoTerm.referenceUrlKo || uenoTerm.referenceUrl;
const uenoRefEn = uenoTerm.referenceUrl || uenoTerm.referenceUrlKo;
assert.match(uenoRefKo, /ko\.wikipedia\.org/, 'ueno reference ko locale data');
assert.match(uenoRefEn, /en\.wikipedia\.org/, 'ueno reference en locale data');

const mapsQuery = extractGoogleMapsSearchQuery(
  'https://www.google.com/maps/search/?api=1&query=Royal+Mile+Edinburgh',
);
assert.equal(mapsQuery, 'Royal Mile Edinburgh', 'extract maps search query');
const mapsFallbackHref = googleWebSearchUrl(mapsQuery, 'ko');
assert.match(mapsFallbackHref, /google\.com\/search/, 'maps query maps to web search');
assert.doesNotMatch(mapsFallbackHref, /google\.com\/maps/, 'maps query not maps url');

assert.match(googleWebSearchUrl('test query', 'ko'), /udm=14/, 'googleWebSearchUrl web tab param');

const fetchHeroGallerySrc = readFileSync(join(root, 'src/utils/fetchEventHeroGallery.js'), 'utf8');
assert.match(fetchHeroGallerySrc, /event_hero_gallery/, 'fetchEventHeroGallery DB cache');
assert.match(fetchHeroGallerySrc, /fetch-event-hero-gallery/, 'fetchEventHeroGallery edge invoke');
assert.match(fetchHeroGallerySrc, /fetchUnsplashImages/, 'fetchEventHeroGallery unsplash fallback');
assert.match(fetchHeroGallerySrc, /fetchWikimediaGalleryFromQueries/, 'fetchEventHeroGallery wikimedia fallback');
assert.match(fetchHeroGallerySrc, /heroGallerySeedCacheMatches/, 'fetchEventHeroGallery stale cache detection');
assert.match(fetchHeroGallerySrc, /buildHeroGalleryFromCache/, 'fetchEventHeroGallery cache re-merge');

const heroGalleryMergeSrc = readFileSync(join(root, 'src/utils/worldEventHeroGalleryMerge.js'), 'utf8');
assert.match(heroGalleryMergeSrc, /mergeWorldEventHeroGalleryImages/, 'hero gallery merge util');

const baliGalleryQueries = buildWorldEventHeroGalleryQueries(bali, 'ko');
assert.ok(baliGalleryQueries.primary.includes('갈룽안'), 'bali unsplash primary uses ko title');
assert.ok(
  baliGalleryQueries.wikimediaQueries.some((query) => /galungan/i.test(query)),
  'bali wikimedia queries include galungan',
);

const fetchWorldVideosSrc = readFileSync(join(root, 'src/utils/fetchWorldEventVideos.js'), 'utf8');
assert.match(fetchWorldVideosSrc, /worldEventVideosPlaceId\(eventId, locale\)/, 'fetchWorldEventVideos locale place_id');
assert.match(fetchWorldVideosSrc, /world-event:\$\{String\(eventId/, 'fetchWorldEventVideos place_id prefix');
assert.match(fetchWorldVideosSrc, /:\$\{loc\}`/, 'fetchWorldEventVideos locale suffix');
assert.match(fetchWorldVideosSrc, /WORLD_EVENT_VIDEOS_MAX/, 'fetchWorldEventVideos max count');

assert.doesNotMatch(detailSrc, /EventExecutionStrip/, 'EventDetailPage no execution strip (D5-b)');
assert.match(detailSrc, /EventTermExplainModal/, 'EventDetailPage glossary modal');
assert.match(detailSrc, /hasWorldEventD5bBodyUx/, 'EventDetailPage gates D5-b body UX');
assert.match(detailSrc, /onGlossaryTermClick/, 'EventDetailPage glossary click handler');

const heroSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventDetailHero.jsx'), 'utf8');
assert.match(heroSrc, /getWorldEventHeroImages/, 'EventDetailHero gallery SSOT');
assert.match(heroSrc, /fetchEventHeroGallery/, 'EventDetailHero extended gallery fetch');
assert.doesNotMatch(heroSrc, /heroEyebrow/, 'EventDetailHero no highlight text on image');
assert.match(heroSrc, /heroGallery\.thumbnailsAria/, 'EventDetailHero separate gallery list section');
assert.match(heroSrc, /EventHeroGalleryModal/, 'EventDetailHero gallery modal');
assert.match(heroSrc, /heroGallery\.viewMore/, 'EventDetailHero view more button');
assert.match(heroSrc, /loadExtendedGallery\(\)/, 'EventDetailHero auto-fetches hero gallery on mount');
assert.match(heroSrc, /displayImages/, 'EventDetailHero uses displayImages for hero and thumbnails');
assert.match(heroSrc, /handleImageError/, 'EventDetailHero drops broken image URLs');

const mediaSectionSrc = readFileSync(
  join(root, 'src/pages/WorldEvents/EventDetailMediaSection.jsx'),
  'utf8',
);
assert.match(mediaSectionSrc, /buildWorldEventYoutubeSearchQuery/, 'EventDetailMediaSection youtube search');
assert.match(mediaSectionSrc, /youtubeWebSearchUrl/, 'EventDetailMediaSection youtube search url');
assert.match(mediaSectionSrc, /fetchWorldEventVideos/, 'EventDetailMediaSection youtube fetch');
assert.match(mediaSectionSrc, /overflow-y-auto/, 'EventDetailMediaSection youtube scroll container');
assert.doesNotMatch(mediaSectionSrc, /youtubeLoadMore/, 'EventDetailMediaSection no youtube load more');
assert.match(mediaSectionSrc, /locale === 'ko'/, 'EventDetailMediaSection naver ko only');


for (const event of events) {
  const hero = String(event.heroImage || '').trim();
  const gallery = Array.isArray(event.heroImages) ? event.heroImages : [];
  assert.ok(
    hero.startsWith('http') || gallery.length > 0,
    `${event.id} has heroImage or heroImages`,
  );
}

assert.ok(Array.isArray(bali.glossaryTerms) && bali.glossaryTerms.length >= 5, 'bali glossaryTerms');
assert.ok(Array.isArray(bali.heroImages) && bali.heroImages.length >= 2, 'bali heroImages');
assert.ok(
  Array.isArray(bali.highlightContextLinks) && bali.highlightContextLinks.length >= 2,
  'bali highlightContextLinks',
);
assert.ok(
  bali.highlightContextLinks.some((group) => group.highlightIndex === 0 && group.links?.length),
  'bali highlight 0 context links',
);
assert.ok(
  bali.highlightContextLinks.some((group) => group.highlightIndex === 2 && group.links?.length),
  'bali highlight 2 context links',
);
assert.ok(bali.glossaryTerms.some((term) => term.id === 'galungan'), 'bali galungan glossary');
assert.ok(bali.glossaryTerms.some((term) => term.id === 'penjor'), 'bali penjor glossary');

assert.ok(
  Array.isArray(edinburgh.glossaryTerms) && edinburgh.glossaryTerms.length >= 4,
  'edinburgh glossaryTerms',
);
assert.ok(Array.isArray(edinburgh.heroImages) && edinburgh.heroImages.length >= 2, 'edinburgh heroImages');
assert.ok(
  Array.isArray(edinburgh.highlightContextLinks) && edinburgh.highlightContextLinks.length >= 2,
  'edinburgh highlightContextLinks',
);
assert.ok(edinburgh.glossaryTerms.some((term) => term.id === 'fringe'), 'edinburgh fringe glossary');
assert.ok(edinburgh.glossaryTerms.some((term) => term.id === 'royal-mile'), 'edinburgh royal-mile glossary');

assert.ok(
  Array.isArray(munich.glossaryTerms) && munich.glossaryTerms.length >= 4,
  'munich glossaryTerms',
);
assert.ok(Array.isArray(munich.heroImages) && munich.heroImages.length >= 2, 'munich heroImages');
assert.ok(
  Array.isArray(munich.highlightContextLinks) && munich.highlightContextLinks.length >= 2,
  'munich highlightContextLinks',
);
assert.ok(munich.glossaryTerms.some((term) => term.id === 'theresienwiese'), 'munich theresienwiese glossary');
assert.ok(munich.glossaryTerms.some((term) => term.id === 'beer-tent'), 'munich beer-tent glossary');

/**
 * @param {string} eventId
 */
async function assertPilotHeroImagesReachable(eventId) {
  const event = getWorldEventById(eventId);
  const images = Array.isArray(event?.heroImages) ? event.heroImages : [];
  for (const image of images) {
    const url = String(image?.url || '').trim();
    if (!url.startsWith('http')) continue;

    let ok = false;
    let status = 0;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
      }
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(12_000) });
      status = response.status;
      if (response.ok) {
        ok = true;
        break;
      }
      if (status !== 429) break;
    }

    assert.equal(
      ok,
      true,
      `${eventId} hero image reachable (${status}): ${url}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

for (const pilotId of [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'bali-galungan-season-2026',
  'singapore-gp-2026',
  'dubai-fitness-challenge-2026',
  ...D5_B_BATCH_A_EVENT_IDS,
  ...D5_B_BATCH_B_EVENT_IDS,
  ...D5_B_BATCH_C_EVENT_IDS,
  ...D5_B_BATCH_D_EVENT_IDS,
]) {
  await assertPilotHeroImagesReachable(pilotId);
}

const chipsUtilSrc2 = readFileSync(join(root, 'src/utils/worldEventChips.js'), 'utf8');
assert.match(chipsUtilSrc2, /getKlookAffiliateUrl/, 'shop Klook chips use affiliate url');

const actionChipsSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventActionChips.jsx'), 'utf8');
assert.match(actionChipsSrc, /shop: ShoppingBag/, 'EventActionChips shop icon');

const plannerConstantsSrc = readFileSync(
  join(root, 'src/components/PlaceCard/tabs/planner/constants.js'),
  'utf8',
);
assert.doesNotMatch(plannerConstantsSrc, /imigresi/, 'Indonesia e-VOA no typo domain imigresi');
assert.doesNotMatch(plannerConstantsSrc, /molina\.imigrasi/, 'Indonesia e-VOA no retired molina portal');
assert.match(plannerConstantsSrc, /evisa\.imigrasi\.go\.id/, 'Indonesia e-VOA official evisa portal');

const baliLoc = getWorldEventLocation('bali');
const locationRulesSrc = readFileSync(
  join(root, 'src/components/PlaceCard/tabs/planner/locationRules.js'),
  'utf8',
);
const mrtPackageQuerySrc = readFileSync(join(root, 'src/utils/mrtPackageQuery.js'), 'utf8');
const affiliateSrc = readFileSync(join(root, 'src/utils/affiliate.js'), 'utf8');
assert.match(locationRulesSrc, /'bali'/, 'bali in GYG location rules');
assert.match(affiliateSrc, /getKlookRentalUrlByLocation/, 'affiliate Klook rental helper');
assert.match(affiliateSrc, /event-detail-flight/, 'affiliate event-detail-flight tracking');
assert.match(affiliateSrc, /if \(mode === 'packages'\)/, 'packages/list gated by mode=packages only');
assert.match(affiliateSrc, /bali: '723'/, 'bali Trip.com hotel city id for packages');
assert.match(mrtPackageQuerySrc, /bali/, 'bali in MRT package keyword rules');
assert.equal(baliLoc.slug, 'bali', 'bali location slug for execution strip');

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

const PILOT_D4 = ['edinburgh-fringe-2026', 'munich-oktoberfest-2026', 'bali-galungan-season-2026'];
for (const pilotId of PILOT_D4) {
  const pilot = getWorldEventById(pilotId);
  assert.ok(pilot, `${pilotId} pilot present`);
  assert.ok(
    Array.isArray(pilot.stayAreas) && pilot.stayAreas.length >= 2,
    `${pilotId} has 2+ stayAreas`,
  );
  for (const area of pilot.stayAreas) {
    assert.ok(area.mrtKeyword, `${pilotId} stayArea ${area.name} has mrtKeyword`);
  }
  const pilotPresets = tripWindowPresetsFromEvent(pilot);
  assert.ok(pilotPresets.tripWindow.checkIn, `${pilotId} tripWindow checkIn`);
  assert.ok(pilotPresets.tripWindow.checkOut, `${pilotId} tripWindow checkOut`);
}

assert.match(stayStripSrc, /stayAreas/, 'EventStayStrip uses event.stayAreas');
assert.match(stayStripSrc, /keywordOverride/, 'EventStayStrip passes stayArea mrtKeyword');
assert.match(stayStripSrc, /buildMrtStayListUrl/, 'EventStayStrip MRT list more link');
assert.match(stayStripSrc, /selectedAreaIndex/, 'EventStayStrip area chip state');

const fetchMrtSrc = readFileSync(join(root, 'src/utils/fetchMrtStays.js'), 'utf8');
assert.match(fetchMrtSrc, /keywordOverride/, 'fetchMrtStaysForLocation keywordOverride');

const mooniFabSrc = readFileSync(join(root, 'src/pages/WorldEvents/EventMooniFab.jsx'), 'utf8');
assert.match(mooniFabSrc, /onClick/, 'EventMooniFab triggers onClick');

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
