import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  GATEO_ENV_FLAG_NAMES,
  isGateoPlaceWorldEventsTabEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  mediaModeFromUrlTab,
  placePathSuffixForMediaMode,
} from '../../src/components/PlaceCard/common/placeMediaTabRoutes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

test('flag defaults off', () => {
  const key = GATEO_ENV_FLAG_NAMES.PLACE_WORLD_EVENTS_TAB;
  globalThis.__VITE_ENV__ = globalThis.__VITE_ENV__ ?? {};
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = '';
  assert.equal(isGateoPlaceWorldEventsTabEnabled(), false);
  globalThis.__VITE_ENV__[key] = prev;
});

test('events URL maps to WORLD_EVENTS mode', () => {
  assert.equal(mediaModeFromUrlTab('events'), 'WORLD_EVENTS');
  assert.equal(placePathSuffixForMediaMode('WORLD_EVENTS'), '/events');
});

test('flag off keeps inline accordion wiring in gallery (same as main)', () => {
  const gallery = read('src/components/PlaceCard/views/PlaceGalleryView.jsx');
  assert.match(gallery, /PlaceWorldEventsSection/);
  assert.doesNotMatch(gallery, /isGateoPlaceWorldEventsTabEnabled/);

  const panel = read('src/components/PlaceCard/panels/PlaceMediaPanel.jsx');
  assert.match(panel, /PlaceWorldEventsTabView/);
  assert.match(panel, /showWorldEventsTab/);
});

test('events tab SEO uses place search intent title pattern', () => {
  assert.equal(mediaModeFromUrlTab('events'), 'WORLD_EVENTS');
  const intents = read('src/data/placeSearchIntent.js');
  assert.match(intents, /tab: 'events'/);
  assert.match(intents, /행사·축제/);
  const index = read('src/components/PlaceCard/index.jsx');
  assert.match(index, /getPlaceTabSeoTitle\(contextLocation, locale, tabKey\)/);
  assert.doesNotMatch(index, /tabKeyForSeo/);
});

test('desktop chat panel uses 3-item preview when flag tab enabled', () => {
  const chat = read('src/components/PlaceCard/panels/PlaceChatPanel.jsx');
  assert.match(chat, /PlaceWorldEventsChatPreview/);
  assert.match(chat, /PREVIEW_LIMIT|PlaceWorldEventsChatPreview/);
  const preview = read('src/components/PlaceCard/common/PlaceWorldEventsChatPreview.jsx');
  assert.match(preview, /PREVIEW_LIMIT = 3/);
  assert.match(preview, /viewAllTab/);
});

test('PlaceChatPanel secondary title truncates on narrow desktop header', () => {
  const panel = read('src/components/PlaceCard/panels/PlaceChatPanel.jsx');
  assert.match(panel, /min-w-\[8rem\]/);
  assert.match(panel, /truncate whitespace-nowrap/);
  assert.match(panel, /lg:w-full xl:w-auto/);
  assert.doesNotMatch(panel, /justify-end w-full xl:w-auto/);
});

test('PlaceWorldEventsTabView reserves mobile fixed header space', () => {
  const view = read('src/components/PlaceCard/views/PlaceWorldEventsTabView.jsx');
  assert.match(view, /mobilePlaceHeaderSpacerClass/);
  assert.match(view, /mobileLandscapeChromeHidden/);
});

test('PlaceCard keeps main initialTab for unknown URL segments', () => {
  const index = read('src/components/PlaceCard/index.jsx');
  assert.match(index, /initialTabForExpanded/);
  assert.match(index, /currentTab\.toUpperCase\(\)/);
  assert.doesNotMatch(index, /initialMediaMode/);
});

test('secondary nav flag gates scroll chrome (off matches main justify-center)', () => {
  const nav = read('src/components/PlaceCard/common/PlaceMobileSecondaryNav.jsx');
  assert.match(nav, /isGateoPlaceWorldEventsTabEnabled/);
  assert.match(nav, /worldEventsNavFlagOn \? 'justify-start' : 'justify-center'/);
  assert.match(nav, /if \(!worldEventsNavFlagOn\) return;/);
  assert.match(nav, /scrollActiveSecondaryTabIntoView\(scrollRowRef\.current/);
  assert.match(nav, /scrollIntoView/);
  assert.doesNotMatch(nav, /scrollTabIntoRow/);
  assert.match(nav, /data-place-secondary-tab="world-events"/);
  assert.match(nav, /place\.nav\.worldEvents/);
  assert.doesNotMatch(nav, /WORLD_EVENTS \? t\('place\.nav\.galleryBack'\)/);
  assert.match(
    nav,
    /worldEventsNavFlagOn && showWorldEventsTab[\s\S]*md:justify-start/,
  );
});
