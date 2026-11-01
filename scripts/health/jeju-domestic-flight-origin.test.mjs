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

// 충남 서해안 — 도착 공항이 인천으로 잡히는 국내 장소 (허브·명소·영문 uiPlace)
const CHUNGNAM_WEST = [
  { id: 'seosan', slug: 'seosan', name: '서산', name_en: 'Seosan', country: '대한민국', lat: 36.7845, lng: 126.4503 },
  { id: 'taean', slug: 'taean', name: '태안', name_en: 'Taean', country: '대한민국', lat: 36.7456, lng: 126.298 },
  { id: 'seocheon', slug: 'seocheon', name: '서천', name_en: 'Seocheon', country: '대한민국', lat: 36.0803, lng: 126.6914 },
  { id: 'seosan-haemieupseong', name: '서산 해미읍성', country: '대한민국', lat: 36.7132, lng: 126.5493 },
  { id: 'mapbox-haemi', name: 'Haemi-myeon', country: 'South Korea', lat: 36.712, lng: 126.545, uiPlace: true, source: 'mapbox' },
  { id: 'mapbox-anmyeonam', name: 'Anmyeon-Am', lat: 36.5595, lng: 126.3744, uiPlace: true, source: 'mapbox' },
];

test('서산·태안·서천·해미 — 도착이 서울권(ICN)으로 잡혀도 국내 장소면 기본 출발지 GMP', async () => {
  const { resolveCinemaDestIata } = await import('../../src/utils/rentalAirportMatch.js');
  for (const place of CHUNGNAM_WEST) {
    assert.ok(['ICN', 'GMP'].includes(resolveCinemaDestIata(place)), `${place.name} 도착 공항`);
    assert.equal(resolveDefaultFlightOriginIataForLocation(place), 'GMP', place.name);
  }
  installStoredOrigin('ICN');
  assert.equal(resolveDefaultFlightOriginIataForLocation(CHUNGNAM_WEST[0]), 'GMP', '저장된 ICN');
  installStoredOrigin('CJU');
  assert.equal(resolveDefaultFlightOriginIataForLocation(CHUNGNAM_WEST[0]), 'CJU', '저장된 다른 공항 유지');
});

test('서울권 도착이어도 해외 국가가 명시된 장소는 ICN 유지', () => {
  assert.equal(
    preferDomesticFlightOriginIata('ICN', 'ICN', { domesticPlace: false }),
    'ICN',
  );
  const tsushima = { id: 'tsushima', name: '쓰시마', country: '일본', lat: 34.2, lng: 129.29 };
  assert.equal(resolveDefaultFlightOriginIataForLocation(tsushima), 'ICN');
});

test('Trip.com 항공 링크 — 출발 미지정이면 국내선 도착은 GMP, 해외는 ICN, 명시 출발은 유지', async () => {
  const { buildTripcomPlannerFlightUrl, resolveTripcomDefaultDepartureIata } = await import(
    '../../src/utils/affiliate.js'
  );
  assert.equal(resolveTripcomDefaultDepartureIata('CJU'), 'GMP');
  assert.equal(resolveTripcomDefaultDepartureIata('NRT'), 'ICN');
  assert.equal(resolveTripcomDefaultDepartureIata(null), 'ICN');
  const depart = (loc, opts) => new URL(buildTripcomPlannerFlightUrl(loc, opts)).searchParams.get('dAirportCode');
  assert.equal(depart(JEJU), 'GMP');
  assert.equal(depart(TOKYO), 'ICN');
  assert.equal(depart(JEJU, { departureIata: 'PUS' }), 'PUS');
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
