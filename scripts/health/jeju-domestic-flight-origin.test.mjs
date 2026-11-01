// 제주·국내 장소카드 항공 출발지 기본값 — 인천(ICN) 대신 김포(GMP)
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

const {
  preferDomesticFlightOriginIata,
  resolveDefaultFlightOriginIata,
  resolveDefaultFlightOriginIataForLocation,
} = await import('../../src/pages/Home/lib/flightOriginPreference.js');
const { shouldResolveFlightRouteViaEdge } = await import('../../src/utils/rentalAirportMatch.js');
const { resolveFlightCinemaOd } = await import('../../src/pages/Home/lib/globeFlightCinema.js');

const JEJU = { id: 'jeju', slug: 'jeju', name: '제주', name_en: 'Jeju', country: '대한민국', lat: 33.4996, lng: 126.5312 };
const SEOGWIPO = { id: 'seogwipo', slug: 'seogwipo', name: '서귀포', name_en: 'Seogwipo', country: '대한민국', lat: 33.2541, lng: 126.56 };
const CHUJADO_UI = {
  id: 'mapbox-chujado-island',
  name: 'Chujado Island',
  name_en: 'Chujado Island',
  country: 'South Korea',
  lat: 33.94843182,
  lng: 126.31984797,
  uiPlace: true,
  source: 'mapbox',
};
const TOKYO = { id: 'tokyo', slug: 'tokyo', name: '도쿄', name_en: 'Tokyo', country: '일본', lat: 35.6762, lng: 139.6503 };

function installStoredOrigin(iata) {
  const store = new Map(iata ? [['gateo.flightOriginIata', iata]] : []);
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
  };
}

afterEach(() => {
  delete globalThis.window;
});

test('국내 도착(CJU·PUS)이면 ICN → GMP, 해외·서울권은 그대로', () => {
  assert.equal(preferDomesticFlightOriginIata('ICN', 'CJU'), 'GMP');
  assert.equal(preferDomesticFlightOriginIata('ICN', 'PUS'), 'GMP');
  assert.equal(preferDomesticFlightOriginIata('ICN', 'RSU'), 'GMP');
  assert.equal(preferDomesticFlightOriginIata('ICN', 'NRT'), 'ICN');
  assert.equal(preferDomesticFlightOriginIata('ICN', 'GMP'), 'ICN');
  assert.equal(preferDomesticFlightOriginIata('ICN', null), 'ICN');
  assert.equal(preferDomesticFlightOriginIata('PUS', 'CJU'), 'PUS');
});

test('제주·서귀포·추자도(영문 uiPlace) 장소카드 기본 출발지 = GMP', () => {
  assert.equal(resolveDefaultFlightOriginIataForLocation(JEJU), 'GMP');
  assert.equal(resolveDefaultFlightOriginIataForLocation(SEOGWIPO), 'GMP');
  assert.equal(resolveDefaultFlightOriginIataForLocation(CHUJADO_UI), 'GMP');
});

test('해외 장소카드는 기존처럼 ICN', () => {
  assert.equal(resolveDefaultFlightOriginIataForLocation(TOKYO), 'ICN');
  assert.equal(resolveDefaultFlightOriginIataForLocation(null), 'ICN');
  assert.equal(resolveDefaultFlightOriginIata(), 'ICN');
});

test('저장된 ICN도 국내선이면 GMP · 저장된 다른 공항(PUS)은 유지', () => {
  installStoredOrigin('ICN');
  assert.equal(resolveDefaultFlightOriginIataForLocation(JEJU), 'GMP');
  installStoredOrigin('PUS');
  assert.equal(resolveDefaultFlightOriginIataForLocation(JEJU), 'PUS');
});

test('GMP → CJU 경로 미리보기는 유지되고 Edge 경유 조회는 생략', () => {
  const od = resolveFlightCinemaOd(JEJU, { originIata: 'GMP' });
  assert.ok(od, 'GMP→CJU OD');
  assert.equal(od.originIata, 'GMP');
  assert.equal(od.destIata, 'CJU');
  assert.equal(shouldResolveFlightRouteViaEdge(JEJU, { originIata: 'GMP', destIata: 'CJU' }), false);
  assert.equal(shouldResolveFlightRouteViaEdge(CHUJADO_UI, { originIata: 'GMP', destIata: 'CJU' }), false);
  assert.equal(shouldResolveFlightRouteViaEdge(CHUJADO_UI, { originIata: 'ICN', destIata: 'CJU' }), false);
  assert.equal(shouldResolveFlightRouteViaEdge(TOKYO, { originIata: 'PUS', destIata: 'NRT' }), true);
});
