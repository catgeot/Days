import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPlaceTitleLines,
  getLocalizedPlaceName,
  resolveEnglishPlaceLabel,
} from '../../src/components/PlaceCard/common/locationDisplay.js';
import {
  latinFromVisitedSlug,
} from '../../src/pages/Home/lib/visitedPlaceSearch.js';
import {
  isTourContentIdEnglishFallback,
  sanitizeTourContentIdEnglishFallback,
} from '../../src/pages/Home/lib/formatUrlName.js';

const TOUR_PIN = {
  id: 'tour-126444',
  slug: 'tour-126444',
  canonical_slug: 'tour-126444',
  name: '차귀도',
  name_en: '',
  contentId: '126444',
  source: 'tourapi',
  country: '대한민국',
  country_en: 'South Korea',
  lat: 33.305,
  lng: 126.16,
  uiPlace: true,
};

test('latinFromVisitedSlug — tour-{contentId} slug does not infer Tour + digits', () => {
  assert.equal(latinFromVisitedSlug({ slug: 'tour-126444' }), '');
  assert.equal(latinFromVisitedSlug({ place_id: 'tour-126434' }), '');
  assert.equal(latinFromVisitedSlug({ slug: 'tinian' }), 'Tinian');
});

test('isTourContentIdEnglishFallback — Tour + numeric id only', () => {
  assert.equal(isTourContentIdEnglishFallback('Tour 126444'), true);
  assert.equal(isTourContentIdEnglishFallback('tour 918805'), true);
  assert.equal(isTourContentIdEnglishFallback('Gyeongbokgung'), false);
  assert.equal(sanitizeTourContentIdEnglishFallback('Tour 129663'), '');
});

test('tour place without English — header subtitle empty, no Tour + contentId', () => {
  assert.equal(resolveEnglishPlaceLabel(TOUR_PIN), '');
  const { primaryName, secondaryName } = getPlaceTitleLines(TOUR_PIN);
  assert.equal(primaryName, '차귀도');
  assert.equal(secondaryName, '');
  assert.doesNotMatch(String(secondaryName), /Tour\s+\d+/i);
});

test('tour place — stored Tour contentId placeholder in name_en is stripped', () => {
  const withStale = { ...TOUR_PIN, name_en: 'Tour 126444' };
  assert.equal(resolveEnglishPlaceLabel(withStale), '');
  const { secondaryName } = getPlaceTitleLines(withStale);
  assert.equal(secondaryName, '');
});

test('tour place with real English name — subtitle kept', () => {
  const named = { ...TOUR_PIN, name_en: 'Chagwido Island' };
  const { secondaryName } = getPlaceTitleLines(named);
  assert.equal(secondaryName, 'Chagwido Island');
  assert.equal(getLocalizedPlaceName(named, 'en'), 'Chagwido Island');
});

test('regression — isTourContentIdEnglishFallback export parity', () => {
  assert.equal(typeof isTourContentIdEnglishFallback, 'function');
  assert.equal(isTourContentIdEnglishFallback('Tour 126444'), true);
});
