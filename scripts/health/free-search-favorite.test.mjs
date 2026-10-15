import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveGlobeLabelPinFields } from '../../src/pages/Home/lib/resolveGlobeLabelPin.js';
import { reopenSavedPlaceLocation } from '../../src/pages/Home/lib/placeRouteHydrate.js';
import { isFreeSearchLocation } from '../../src/pages/Home/lib/freeSearchYouTubeLink.js';
import { freeSearchVideoTarget } from '../../src/pages/Home/lib/freeSearchPlaceVideo.js';
import { getPlaceStatsId } from '../../src/utils/travelSpotResolve.js';

const LAT = 12.5789;
const LNG = 122.2706;

function koreanRomblonFavorite() {
  const fields = resolveGlobeLabelPinFields({
    clickedLabel: '롬블론',
    clickedLabelEn: 'Romblon',
    address: {
      name_en: 'San Jose',
      country: '필리핀',
      country_en: 'Philippines',
    },
    lat: LAT,
    lng: LNG,
  });
  return {
    id: '8f1c0b2a-1111-2222-3333-444455556666',
    destination: fields.name,
    lat: LAT,
    lng: LNG,
    is_bookmarked: true,
    curation_data: {
      locationEn: fields.name_en || fields.name,
      slug: fields.slug,
      country: fields.country,
      country_en: fields.country_en,
      uiPlace: true,
      placeId: `label-${LAT}-${LNG}`,
    },
    fields,
  };
}

test('Korean Romblon label keeps the tapped name, not the reverse-geocoded municipality', () => {
  const { fields } = koreanRomblonFavorite();
  assert.equal(fields.name, '롬블론');
  assert.equal(fields.name_en, 'Romblon');
  assert.equal(fields.slug, 'romblon');
  assert.equal(fields.name_en.includes('San Jose'), false);
});

test('a saved Korean label reopened from favorites stays on the free-search video path', () => {
  const { id, ...trip } = koreanRomblonFavorite();
  const saved = { id, ...trip };
  delete saved.fields;

  assert.equal(isFreeSearchLocation(saved), false);
  assert.equal(getPlaceStatsId(saved), '');

  const reopened = reopenSavedPlaceLocation(saved);
  assert.equal(reopened.name, '롬블론');
  assert.equal(reopened.id, `label-${LAT}-${LNG}`);
  assert.equal(isFreeSearchLocation(reopened), true);

  const target = freeSearchVideoTarget(reopened);
  assert.match(target.requestPlaceId, /^label-/);
  assert.equal(target.built.name, '롬블론');
  assert.match(target.built.query, /롬블론/);
  assert.equal(/san jose/i.test(target.built.query), false);
  assert.match(target.built.cacheId, /^free:롬블론/);
});

test('an older favorite without placeId still rebuilds a label- id from coordinates', () => {
  const saved = {
    id: 'temp_1',
    destination: '롬블론',
    lat: LAT,
    lng: LNG,
    curation_data: {
      locationEn: 'San Jose',
      slug: 'romblon',
      country: '필리핀',
      country_en: 'Philippines',
      uiPlace: true,
    },
  };
  const reopened = reopenSavedPlaceLocation(saved);
  assert.equal(reopened.name, '롬블론');
  assert.match(reopened.id, /^label-/);
  const target = freeSearchVideoTarget(reopened);
  assert.equal(target.built.name, '롬블론');
  assert.equal(/san jose/i.test(target.built.query), false);
});
