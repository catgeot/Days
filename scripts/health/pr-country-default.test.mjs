import assert from 'node:assert/strict';
import test from 'node:test';
import { getLocalizedCountryName } from '../../src/components/PlaceCard/common/locationDisplay.js';
import { formatPlaceChatLabel } from '../../src/pages/Home/lib/mooniPlaceChatLabel.js';
import {
  coordsInKorea,
  visitedRowToSearchSpot,
} from '../../src/pages/Home/lib/visitedPlaceSearch.js';
import { resolveGlobeLabelPinFields } from '../../src/pages/Home/lib/resolveGlobeLabelPin.js';

const OVERSEAS_CASES = [
  {
    slug: 'romblon',
    queryKo: '롬블론',
    lat: 12.5789,
    lng: 122.2706,
    name_en: 'Romblon',
  },
  {
    slug: 'pamir',
    queryKo: '파미르 고원',
    lat: 38.5,
    lng: 73.5,
    name_en: 'Pamir',
  },
  {
    slug: 'sao-tome-and-principe',
    queryKo: '상투메 프린시페',
    lat: 0.3365,
    lng: 6.7273,
    name_en: 'Sao Tome',
  },
  {
    slug: 'tinian',
    queryKo: '티니안',
    lat: 15.0,
    lng: 145.63,
    name_en: 'Tinian',
    address: { name_en: 'San Jose', country: '', country_en: '' },
  },
];

test('visited place_stats rows without country do not default to 대한민국 overseas', () => {
  for (const row of OVERSEAS_CASES) {
    const spot = visitedRowToSearchSpot({
      place_id: row.slug,
      name_ko: row.queryKo,
      name_en: row.name_en,
      lat: row.lat,
      lng: row.lng,
    });
    assert.ok(spot, row.slug);
    assert.equal(spot.country, '', `${row.slug} country`);
    assert.equal(spot.country_en, '', `${row.slug} country_en`);
    assert.equal(getLocalizedCountryName(spot, 'ko'), '', `${row.slug} localized ko`);
    assert.equal(
      formatPlaceChatLabel(spot, 'ko'),
      row.queryKo,
      `${row.slug} chat label must not prefix country`,
    );
  }
});

test('domestic Korean visited row still gets 대한민국 when coords are in Korea', () => {
  const spot = visitedRowToSearchSpot({
    place_id: 'seongsan-ilchulbong',
    name_ko: '성산일출봉',
    name_en: 'Seongsan Ilchulbong',
    lat: 33.458,
    lng: 126.942,
  });
  assert.equal(spot.country, '대한민국');
  assert.equal(spot.country_en, 'South Korea');
  assert.equal(getLocalizedCountryName(spot, 'ko'), '대한민국');
  assert.match(formatPlaceChatLabel(spot, 'ko'), /대한민국.*성산일출봉/);
});

test('coordsInKorea excludes Japan and DPRK border false positives', () => {
  const notKorea = [
    { name: 'Fukuoka', lat: 33.59, lng: 130.4 },
    { name: 'Tsushima', lat: 34.2, lng: 129.29 },
    { name: 'Kitakyushu', lat: 33.88, lng: 130.83 },
    { name: 'Pyongyang', lat: 39.03, lng: 125.76 },
    { name: 'Kaesong', lat: 37.97, lng: 126.55 },
    { name: 'Kumgangsan', lat: 38.65, lng: 128.1 },
    { name: 'Haeju', lat: 38.04, lng: 125.71 },
    { name: 'DPRK Ongjin', lat: 37.93, lng: 125.36 },
  ];
  for (const { name, lat, lng } of notKorea) {
    assert.equal(coordsInKorea(lat, lng), false, name);
    const spot = visitedRowToSearchSpot({
      place_id: `foreign-${name}`,
      name_ko: '한글표기',
      name_en: name,
      lat,
      lng,
    });
    assert.equal(spot.country, '', `${name} visited infer`);
  }

  const korea = [
    { name: 'Seongsan', lat: 33.458, lng: 126.942 },
    { name: 'Dokdo', lat: 37.24, lng: 131.87 },
    { name: 'Ulleung', lat: 37.48, lng: 130.9 },
    { name: 'Ganghwa', lat: 37.75, lng: 126.49 },
    { name: 'Busan', lat: 35.1, lng: 129.04 },
    { name: 'Hwajinpo', lat: 38.47, lng: 128.44 },
    { name: 'Tongil Observatory', lat: 38.58, lng: 128.37 },
    { name: 'Cheorwon north', lat: 38.24, lng: 127.21 },
    { name: 'Geoje Jangseungpo', lat: 34.87, lng: 128.72 },
    { name: 'Gadeokdo', lat: 35.03, lng: 128.83 },
    { name: 'Goseong Geojin', lat: 38.44, lng: 128.46 },
    { name: 'Baengnyeongdo', lat: 37.96, lng: 124.69 },
    { name: 'Daecheongdo', lat: 37.83, lng: 124.71 },
    { name: 'Yeonpyeongdo', lat: 37.67, lng: 125.7 },
    { name: 'Gyodongdo', lat: 37.79, lng: 126.27 },
  ];
  for (const { name, lat, lng } of korea) {
    assert.equal(coordsInKorea(lat, lng), true, name);
    const spot = visitedRowToSearchSpot({
      place_id: name,
      name_ko: '한글표기',
      name_en: name,
      lat,
      lng,
    });
    assert.equal(spot.country, '대한민국', `${name} visited infer`);
  }
});

test('globe label pin without reverse country stays Explore placeholder, not Korea', () => {
  const fields = resolveGlobeLabelPinFields({
    clickedLabel: '티니안',
    clickedLabelEn: 'Tinian',
    address: { name_en: 'San Jose', country: '', country_en: '' },
    lat: 15.0,
    lng: 145.63,
  });
  assert.equal(fields.country, 'Explore');
  assert.notEqual(fields.country, '대한민국');
});
