import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasExplicitNonKoreaCountry,
  isDomesticKoreaLocationForTourApi,
  isExplicitlyOverseasForTourApi,
  resolveTourApiPlace,
  shouldUseTourApiGalleryForPlace,
} from '../../src/utils/tourApiMatch.js';

const CAIRO = {
  slug: 'cairo',
  name: '카이로',
  name_en: 'Cairo',
  country: '이집트',
  country_en: 'Egypt',
  lat: 30.0444,
  lng: 31.2357,
};

const JEJU = {
  slug: 'jeju',
  name: '제주',
  name_en: 'Jeju',
  country: '한국',
  country_en: 'South Korea',
  lat: 33.4996,
  lng: 126.5312,
};

test('overseas place with Korean display name never enables TourAPI gallery', () => {
  assert.equal(hasExplicitNonKoreaCountry(CAIRO), true);
  assert.equal(isDomesticKoreaLocationForTourApi(CAIRO), false);
  const mapping = resolveTourApiPlace(CAIRO);
  assert.equal(shouldUseTourApiGalleryForPlace([CAIRO], mapping), false);
});

test('overseas cities in multiple regions stay off TourAPI gallery', () => {
  const places = [
    {
      slug: 'rio-de-janeiro',
      name: '리우데자네이루',
      country: '브라질',
      country_en: 'Brazil',
      lat: -22.9068,
      lng: -43.1729,
    },
    {
      slug: 'bangkok',
      name: '방콕',
      country: '태국',
      country_en: 'Thailand',
      lat: 13.7563,
      lng: 100.5018,
    },
    {
      slug: 'paris',
      name: '파리',
      country: '프랑스',
      country_en: 'France',
      lat: 48.8566,
      lng: 2.3522,
    },
  ];
  for (const place of places) {
    assert.equal(
      shouldUseTourApiGalleryForPlace([place], resolveTourApiPlace(place)),
      false,
      place.slug,
    );
  }
});

test('domestic Jeju still enables TourAPI gallery path', () => {
  assert.equal(isDomesticKoreaLocationForTourApi(JEJU), true);
  const mapping = resolveTourApiPlace(JEJU);
  assert.equal(shouldUseTourApiGalleryForPlace([JEJU], mapping), true);
});

test('curated hub card without country keeps TourAPI (양구-style hub entry)', () => {
  const yangguHub = { slug: 'yanggu', hubId: 'yanggu', name: '양구' };
  const mapping = resolveTourApiPlace(yangguHub);
  assert.equal(mapping?.curated, true);
  assert.equal(isExplicitlyOverseasForTourApi(yangguHub), false);
  assert.equal(shouldUseTourApiGalleryForPlace([yangguHub], mapping), true);
});

test('venice (Italy) blocked by explicit country and overseas coords', () => {
  const venice = {
    slug: 'venice',
    name: '베니스',
    country: '이탈리아',
    country_en: 'Italy',
    lat: 45.4408,
    lng: 12.3155,
  };
  assert.equal(isExplicitlyOverseasForTourApi(venice), true);
  assert.equal(shouldUseTourApiGalleryForPlace([venice], resolveTourApiPlace(venice)), false);
});

test('dubai with cached TourAPI risk stays off TourAPI gallery', () => {
  const dubai = {
    slug: 'dubai',
    name: '두바이',
    country: '아랍에미리트',
    country_en: 'United Arab Emirates',
    lat: 25.2048,
    lng: 55.2708,
  };
  assert.equal(isExplicitlyOverseasForTourApi(dubai), true);
  assert.equal(shouldUseTourApiGalleryForPlace([dubai], resolveTourApiPlace(dubai)), false);
});
