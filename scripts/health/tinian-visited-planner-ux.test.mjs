import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlaceTitleLines } from '../../src/components/PlaceCard/common/locationDisplay.js';
import {
  isSamePinKeepVisitorLabel,
  overlayGeoFieldsOnVisitedSpot,
  visitedRowToSearchSpot,
} from '../../src/pages/Home/lib/visitedPlaceSearch.js';
import { buildToolkitPlaceIdCandidates } from '../../src/utils/toolkitPlaceIdResolve.js';
import {
  hasStoredToolkitRow,
  resolvePlannerGuideForDisplay,
} from '../../src/components/PlaceCard/tabs/planner/plannerGuideDisplay.js';
import { plannerToolkitErrorKey } from '../../src/components/PlaceCard/tabs/planner/plannerToolkitError.js';

test('Tinian keeps English subtitle when geocode returns San Jose municipality', () => {
  const spot = visitedRowToSearchSpot({
    place_id: 'tinian',
    name_ko: '티니안',
    name_en: 'Tinian',
    lat: 15.0,
    lng: 145.63,
  });
  const overlaid = overlayGeoFieldsOnVisitedSpot(spot, [
    {
      name: 'San Jose',
      name_en: 'San Jose',
      country: '북마리아나 제도',
      country_en: 'Northern Mariana Islands',
      lat: 15.0,
      lng: 145.63,
      kind: 'city',
      badge: '도시',
    },
  ]);
  assert.equal(overlaid.name_en, 'Tinian');
  assert.equal(overlaid.country_en, 'Northern Mariana Islands');
  assert.equal(overlaid.parentCity, undefined);
  const { secondaryName } = getPlaceTitleLines(overlaid);
  assert.equal(secondaryName, 'Tinian');
});

test('Tinian keep-label without stored name_en — slug infers Tinian, no San Jose parent', () => {
  const spot = visitedRowToSearchSpot({
    place_id: 'tinian',
    name_ko: '티니안',
    lat: 15.0,
    lng: 145.63,
  });
  const geo = {
    name: 'San Jose',
    name_en: 'San Jose',
    country: '북마리아나 제도',
    country_en: 'Northern Mariana Islands',
    lat: 15.0,
    lng: 145.63,
    kind: 'city',
    badge: '도시',
  };
  assert.equal(isSamePinKeepVisitorLabel(spot, geo), true);
  const overlaid = overlayGeoFieldsOnVisitedSpot(spot, [geo]);
  assert.equal(overlaid.name_en, 'Tinian');
  assert.ok(!overlaid.parentCity);
});

test('toolkit candidates for Tinian uiPlace include prod place_id rows, not saipan slug', () => {
  const candidates = buildToolkitPlaceIdCandidates({
    slug: 'tinian',
    name: '티니안',
    name_en: 'Tinian',
    lat: 15.0,
    lng: 145.63,
    uiPlace: true,
  });
  assert.ok(candidates.some((c) => c === '티니안' || c === 'san-jose-tinian'));
  assert.ok(!candidates.some((c) => String(c).toLowerCase() === 'saipan'));
});

test('planner toolkit error — unregistered place only uses preparing copy key', () => {
  assert.equal(
    plannerToolkitErrorKey({ context: { status: 403 } }, { error: 'forbidden: unregistered place' }),
    'forbidden',
  );
  assert.equal(
    plannerToolkitErrorKey({ context: { status: 401 } }, { error: 'unauthorized: toolkit overwrite requires admin login' }),
    'generic',
  );
  assert.equal(
    plannerToolkitErrorKey({ context: { status: 403 } }, { error: 'forbidden: toolkit overwrite requires admin' }),
    'generic',
  );
});

test('resolvePlannerGuideForDisplay uses DB row when place_id matches even if strict geo filter fails', () => {
  const location = {
    slug: 'tinian',
    name: '티니안',
    name_en: 'Tinian',
    lat: 15.0,
    lng: 145.63,
    uiPlace: true,
  };
  const row = {
    place_id: '티니안',
    essential_guide: {
      categories: { visa: { advice: 'ETA' } },
      journey_timeline: [],
      primary_arrival_airports_iata: ['SPN'],
    },
    toolkit_updated_at: '2026-10-25T12:00:00.000Z',
  };
  assert.equal(hasStoredToolkitRow(row, location, 'ko'), true);
  const guide = resolvePlannerGuideForDisplay(row, location, 'ko');
  assert.ok(guide?.categories?.visa);
});
