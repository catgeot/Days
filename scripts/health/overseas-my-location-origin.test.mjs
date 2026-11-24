import assert from 'node:assert/strict';
import test from 'node:test';
import { KOREA_AIRPORT_IATAS } from '../../src/utils/koreaAirportIatas.js';
import { resolveFlightOriginFromCoords } from '../../src/pages/Home/lib/flightCinemaOriginSearch.js';
import { preferPrimaryMetroHub } from '../../src/pages/Home/lib/flightOriginMetroGateways.js';
import {
  arrivalAirportForAccessDestination,
  nearestKoreaOriginCity,
  resolveMyLocationOrigin,
} from '../../src/pages/Home/lib/koreaOriginGeolocation.js';
import {
  buildOverseasMyLocationAsk,
  overseasMyLocationModelHint,
  parseOverseasMyLocationAsk,
} from '../../src/pages/Home/lib/overseasMyLocationAsk.js';
import { prepareFestivalMooniChatPayload } from '../../src/pages/Home/lib/festivalMooniRequest.js';
import { planFestivalMooniModelCall } from '../../src/pages/Korea/lib/festivalTransportCardCore.js';

const KHAO_LAK = { lat: 8.6374, lng: 98.2475 };
const BANGKOK = { lat: 13.7563, lng: 100.5018 };
const HAEUNDAE = { lat: 35.158698, lng: 129.160384 };
const SEOUL = { lat: 37.5665, lng: 126.978 };
const SEOGWIPO = { lat: 33.2541, lng: 126.56 };

function placeHit(city, country, cityEn, countryEn) {
  return { name: city, country, name_en: cityEn, country_en: countryEn };
}

test('overseas coordinates are not snapped to a Korean origin city', () => {
  assert.equal(nearestKoreaOriginCity(KHAO_LAK.lat, KHAO_LAK.lng), null);
  assert.equal(nearestKoreaOriginCity(BANGKOK.lat, BANGKOK.lng), null);
  assert.equal(nearestKoreaOriginCity(SEOUL.lat, SEOUL.lng)?.id, 'seoul');
  assert.equal(nearestKoreaOriginCity(35.1796, 129.0756)?.id, 'busan');
  assert.equal(nearestKoreaOriginCity(SEOGWIPO.lat, SEOGWIPO.lng)?.id, 'seogwipo');
  assert.equal(nearestKoreaOriginCity(HAEUNDAE.lat, HAEUNDAE.lng)?.id, 'busan');
});

test('Khao Lak stays on HKT and Bangkok uses Suvarnabhumi, not a Korean airport', async () => {
  let geocodeCalls = 0;
  const khao = await resolveMyLocationOrigin(KHAO_LAK.lat, KHAO_LAK.lng, {
    reverseGeocode: async () => {
      geocodeCalls += 1;
      return placeHit('카오락', '태국', 'Khao Lak', 'Thailand');
    },
  });
  assert.equal(khao.ok, true);
  assert.equal(khao.overseas, true);
  assert.equal(khao.city, '카오락');
  assert.equal(khao.country, '태국');
  assert.equal(khao.originIata, 'HKT');
  assert.equal(KOREA_AIRPORT_IATAS.has(khao.originIata), false);

  const bangkok = await resolveMyLocationOrigin(BANGKOK.lat, BANGKOK.lng, {
    reverseGeocode: async () => placeHit('방콕', '태국', 'Bangkok', 'Thailand'),
  });
  assert.equal(bangkok.ok, true);
  assert.equal(bangkok.city, '방콕');
  assert.equal(bangkok.country, '태국');
  assert.equal(bangkok.originIata, 'BKK');
  assert.equal(KOREA_AIRPORT_IATAS.has(bangkok.originIata), false);
  assert.equal(bangkok.originIata, resolveFlightOriginFromCoords(BANGKOK.lat, BANGKOK.lng, {
    excludeIatas: KOREA_AIRPORT_IATAS,
  })?.iata);

  const domestic = await resolveMyLocationOrigin(SEOUL.lat, SEOUL.lng, {
    reverseGeocode: async () => {
      geocodeCalls += 1;
      return placeHit('서울', '대한민국', 'Seoul', 'South Korea');
    },
  });
  assert.equal(domestic.overseas, false);
  assert.equal(domestic.city.id, 'seoul');
  assert.equal(geocodeCalls, 1);
});

test('metro priority picks the primary international hub and leaves a lone feeder', () => {
  const tokyo = { lat: 35.6812, lng: 139.7671 };
  assert.equal(preferPrimaryMetroHub('HND', tokyo.lat, tokyo.lng), 'NRT');
  assert.equal(resolveFlightOriginFromCoords(tokyo.lat, tokyo.lng)?.iata, 'NRT');
  assert.equal(preferPrimaryMetroHub('DMK', BANGKOK.lat, BANGKOK.lng), 'BKK');
  assert.equal(preferPrimaryMetroHub('HKT', KHAO_LAK.lat, KHAO_LAK.lng), null);
  const northOfDonMueang = { lat: 15.67, lng: 100.6067 };
  assert.equal(preferPrimaryMetroHub('DMK', northOfDonMueang.lat, northOfDonMueang.lng), null);
  assert.equal(
    resolveFlightOriginFromCoords(northOfDonMueang.lat, northOfDonMueang.lng)?.iata,
    'DMK',
  );
});

test('Haeundae lands at PUS and Seoul at ICN; domestic city match is unchanged', () => {
  assert.equal(arrivalAirportForAccessDestination(HAEUNDAE).iata, 'PUS');
  assert.equal(arrivalAirportForAccessDestination(SEOUL).iata, 'ICN');
  assert.equal(arrivalAirportForAccessDestination(SEOGWIPO).iata, 'PUS');
  const seoulHub = resolveFlightOriginFromCoords(SEOUL.lat, SEOUL.lng);
  assert.equal(seoulHub?.iata, 'ICN');
});

test('overseas ask names the real city and the airport hop, and round-trips', () => {
  const festival = buildOverseasMyLocationAsk({
    locale: 'ko',
    kind: 'festival',
    city: '카오락',
    country: '태국',
    originLabel: '푸켓국제공항',
    originIata: 'HKT',
    arrivalLabel: '김해국제공항',
    arrivalIata: 'PUS',
  });
  assert.match(festival, /카오락 · 태국/);
  assert.match(festival, /HKT/);
  assert.match(festival, /PUS/);
  assert.doesNotMatch(festival, /서귀포|제주/);
  const parsed = parseOverseasMyLocationAsk(festival);
  assert.equal(parsed.originIata, 'HKT');
  assert.equal(parsed.arrivalIata, 'PUS');
  assert.equal(parsed.kind, 'festival');

  const place = buildOverseasMyLocationAsk({
    locale: 'en',
    kind: 'place',
    city: 'Bangkok',
    country: 'Thailand',
    originLabel: 'Suvarnabhumi',
    originIata: 'BKK',
    arrivalLabel: 'Busan',
    arrivalIata: 'PUS',
  });
  const placeParsed = parseOverseasMyLocationAsk(place);
  assert.equal(placeParsed.city, 'Bangkok');
  assert.equal(placeParsed.country, 'Thailand');
  assert.equal(placeParsed.kind, 'place');
  assert.equal(placeParsed.originIata, 'BKK');
  assert.match(overseasMyLocationModelHint(parsed, 'ko'), /한국 도시로 출발지를 바꾸지 마세요/);
  assert.match(overseasMyLocationModelHint(parsed, 'ko'), /HKT에서 PUS로 비행/);
});

test('festival payload keeps the overseas airports and does not load a Korean ground origin', () => {
  const ask = buildOverseasMyLocationAsk({
    locale: 'ko',
    kind: 'festival',
    city: '카오락',
    country: '태국',
    originLabel: '푸켓국제공항',
    originIata: 'HKT',
    arrivalLabel: '김해국제공항',
    arrivalIata: 'PUS',
  });
  const prepared = prepareFestivalMooniChatPayload({
    festivalContext: true,
    userText: ask,
    departureLabel: ask,
    chipId: 'festival_access',
    destinationName: '해운대 빛축제',
  });
  assert.equal(prepared.groundOrigin, null);
  assert.equal(prepared.session.departureIata, 'HKT');
  assert.equal(prepared.session.arrivalIata, 'PUS');
  assert.equal(planFestivalMooniModelCall({
    chipId: 'festival_access',
    userText: ask,
    transport: { origins: [{ label: '서울', segments: [{ mode: 'train' }] }] },
  }).tagoLead, '');

  const domestic = prepareFestivalMooniChatPayload({
    festivalContext: true,
    userText: '서울에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
    departureLabel: '서울',
    chipId: 'festival_access',
    destinationName: '해운대 빛축제',
  });
  assert.equal(domestic.groundOrigin?.ko, '서울');
  assert.equal(domestic.session.departureIata, '');
});
