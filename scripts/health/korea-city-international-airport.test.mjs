import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatFlightOriginGatewayDepartureLabel,
  resolveInternationalGatewayForCityId,
  searchKoreaCityInternationalAirportOrigins,
} from '../../src/pages/Home/lib/koreaCityInternationalAirport.js';

test('춘천 → ICN gateway line', () => {
  const hits = searchKoreaCityInternationalAirportOrigins('춘천');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].iata, 'ICN');
  assert.match(hits[0].label, /서울\(ICN\)에서 출발/);
});

test('강릉 → YNY', () => {
  assert.equal(resolveInternationalGatewayForCityId('gangneung'), 'YNY');
  const hits = searchKoreaCityInternationalAirportOrigins('강릉');
  assert.equal(hits[0]?.iata, 'YNY');
});

test('전주 → MWX', () => {
  assert.equal(resolveInternationalGatewayForCityId('jeonju'), 'MWX');
  const hits = searchKoreaCityInternationalAirportOrigins('전주');
  assert.equal(hits[0]?.iata, 'MWX');
});

test('서울 → ICN', () => {
  const hits = searchKoreaCityInternationalAirportOrigins('서울');
  assert.ok(hits.some((row) => row.iata === 'ICN'));
});

test('English Chuncheon → ICN', () => {
  const hits = searchKoreaCityInternationalAirportOrigins('Chuncheon', { locale: 'en' });
  assert.equal(hits[0]?.iata, 'ICN');
  assert.match(hits[0]?.label || '', /From Seoul \(ICN\)/i);
});

test('gateway label helper', () => {
  assert.equal(formatFlightOriginGatewayDepartureLabel('ICN', 'ko'), '서울(ICN)에서 출발');
  assert.equal(formatFlightOriginGatewayDepartureLabel('ICN', 'en'), 'From Seoul (ICN)');
});