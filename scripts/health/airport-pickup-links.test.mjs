import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';
import { TRIPCOM_KR_PARTNER } from '../../src/utils/affiliate.js';
import {
  airportPickupRowForPlace,
  buildAirportPickupUrl,
} from '../../src/utils/airportPickupLinks.js';

const FLAG = GATEO_ENV_FLAG_NAMES.AIRPORT_PICKUP_LINKS;

function withFlag(value, fn) {
  const prev = globalThis.__VITE_ENV__[FLAG];
  globalThis.__VITE_ENV__[FLAG] = value;
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__[FLAG] = prev;
  }
}

test('HKT builds a Trip.com airport-transfer listing with affiliate params', () => {
  const href = buildAirportPickupUrl('hkt');
  assert.ok(href);
  const url = new URL(href);
  assert.equal(url.hostname, 'kr.trip.com');
  assert.equal(url.pathname, '/airport-transfers/phuket/airport-hkt/');
  assert.equal(url.searchParams.get('Allianceid'), TRIPCOM_KR_PARTNER.allianceId);
  assert.equal(url.searchParams.get('SID'), TRIPCOM_KR_PARTNER.sid);
  assert.equal(url.searchParams.get('trip_sub1'), 'airport-pickup');
  assert.equal(href.includes('25000'), false);
});

test('BKK builds the Bangkok airport-transfer listing', () => {
  const url = new URL(buildAirportPickupUrl('BKK'));
  assert.equal(url.pathname, '/airport-transfers/bangkok/airport-bkk/');
  assert.equal(url.searchParams.get('Allianceid'), TRIPCOM_KR_PARTNER.allianceId);
});

test('unknown airport returns null', () => {
  assert.equal(buildAirportPickupUrl('ZZZ'), null);
  assert.equal(buildAirportPickupUrl(''), null);
  assert.equal(buildAirportPickupUrl('HK'), null);
});

test('Korean airports return null', () => {
  assert.equal(buildAirportPickupUrl('ICN'), null);
  assert.equal(buildAirportPickupUrl('PUS'), null);
  assert.equal(buildAirportPickupUrl('CJU'), null);
});

test('overseas hub without a verified Trip.com listing uses MyRealTrip search', () => {
  const href = buildAirportPickupUrl('NRT');
  assert.ok(href);
  const url = new URL(href);
  assert.equal(url.hostname, 'www.myrealtrip.com');
  assert.equal(url.pathname, '/search');
  assert.equal(url.searchParams.get('q'), 'NRT 공항 픽업');
  assert.equal(url.searchParams.get('mylink_id'), '2640202');
  assert.equal(url.searchParams.get('utm_source'), 'mktpartner');
});

test('pickup row is absent when the flag is off', () => {
  withFlag('', () => {
    assert.equal(airportPickupRowForPlace({ slug: 'khao-lak' }), null);
    assert.equal(airportPickupRowForPlace({ slug: 'bangkok' }), null);
  });
  withFlag('0', () => {
    assert.equal(airportPickupRowForPlace({ slug: 'khao-lak' }), null);
  });
});

test('flag on shows Khao Lak HKT and hides a Korean place', () => {
  withFlag('1', () => {
    const khaoLak = airportPickupRowForPlace({ slug: 'khao-lak' });
    assert.equal(khaoLak?.iata, 'HKT');
    assert.equal(khaoLak?.partner, 'trip');
    assert.equal(khaoLak?.placeKo, '카오락');
    assert.equal(khaoLak?.placeEn, 'Khao Lak');
    assert.match(khaoLak?.href || '', /\/airport-transfers\/phuket\/airport-hkt\//);
    const bangkok = airportPickupRowForPlace({ slug: 'bangkok' });
    assert.equal(bangkok?.iata, 'BKK');
    assert.equal(bangkok?.partner, 'trip');
    assert.equal(bangkok?.placeKo, '방콕');
    assert.match(bangkok?.href || '', /\/airport-transfers\/bangkok\/airport-bkk\//);
    const tokyo = airportPickupRowForPlace({ slug: 'tokyo' });
    assert.equal(tokyo?.iata, 'HND');
    assert.equal(tokyo?.partner, 'mrt');
    assert.equal(tokyo?.placeKo, '도쿄');
    assert.match(tokyo?.href || '', /myrealtrip\.com\/search/);
    assert.match(tokyo?.href || '', /HND/);
    assert.equal(airportPickupRowForPlace({ slug: 'seoul' }), null);
    assert.equal(airportPickupRowForPlace({ lat: 35.17, lng: 129.07, country: '대한민국' }), null);
  });
});
