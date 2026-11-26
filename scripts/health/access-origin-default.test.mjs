// 가는 방법 출발 기본값 — 알고 있는 위치가 있으면 서울(ICN)로 두지 않는다.
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

const { resolveDefaultFlightOriginIataForLocation } = await import(
  '../../src/pages/Home/lib/flightOriginPreference.js'
);
const { getFlightOriginDisplayLabel } = await import(
  '../../src/pages/Home/lib/flightCinemaOriginOptions.js'
);

const KHAO_LAK = {
  id: 'khao-lak',
  slug: 'khao-lak',
  name: '카오락',
  name_en: 'Khao Lak',
  country: '태국',
  lat: 8.6475,
  lng: 98.2483,
};
const TOKYO = {
  id: 'tokyo',
  slug: 'tokyo',
  name: '도쿄',
  name_en: 'Tokyo',
  country: '일본',
  lat: 35.6762,
  lng: 139.6503,
};
const JEJU = {
  id: 'jeju',
  slug: 'jeju',
  name: '제주',
  name_en: 'Jeju',
  country: '대한민국',
  lat: 33.4996,
  lng: 126.5312,
};

function installStorage(entries = []) {
  const store = new Map(entries);
  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  };
}

function locationSuccess(lat, lng) {
  return [
    'korea-festival-loc-success',
    JSON.stringify({ at: Date.now(), lat, lng }),
  ];
}

afterEach(() => {
  delete globalThis.window;
});

test('카오락에 있으면 카오락 가는 방법 출발은 푸켓(HKT)이고 서울(ICN)이 아니다', () => {
  installStorage();
  const origin = resolveDefaultFlightOriginIataForLocation(KHAO_LAK, {
    userLat: 8.6475,
    userLng: 98.2483,
  });
  assert.equal(origin, 'HKT');
  assert.notEqual(origin, 'ICN');
  assert.equal(getFlightOriginDisplayLabel(origin, 'ko'), '푸켓');
  assert.equal(getFlightOriginDisplayLabel(origin, 'en'), 'Phuket');
});

test('저장된 카오락 좌표도 인천 기본값보다 우선한다', () => {
  installStorage([locationSuccess(8.65, 98.25), ['gateo.flightOriginIata', 'ICN']]);
  assert.equal(resolveDefaultFlightOriginIataForLocation(KHAO_LAK), 'HKT');
});

test('방콕에 있으면 도쿄 가는 방법 출발은 방콕(BKK)이다', () => {
  installStorage();
  const origin = resolveDefaultFlightOriginIataForLocation(TOKYO, {
    userLat: 13.7563,
    userLng: 100.5018,
  });
  assert.equal(origin, 'BKK');
  assert.equal(getFlightOriginDisplayLabel(origin, 'ko'), '방콕');
  assert.equal(getFlightOriginDisplayLabel(origin, 'en'), 'Bangkok');
});

test('부산에 있으면 제주 가는 방법 출발은 부산(PUS)이다', () => {
  installStorage([['gateo.domesticOriginCityId', 'busan']]);
  const origin = resolveDefaultFlightOriginIataForLocation(JEJU);
  assert.equal(origin, 'PUS');
  assert.equal(getFlightOriginDisplayLabel(origin, 'ko'), '부산');
  assert.equal(getFlightOriginDisplayLabel(origin, 'en'), 'Busan');
});

test('제주에 있으면 제주 가는 방법 출발은 제주(CJU)이고 구간은 서울로 두지 않는다', () => {
  installStorage([locationSuccess(33.5, 126.53)]);
  const origin = resolveDefaultFlightOriginIataForLocation(JEJU);
  assert.equal(origin, 'CJU');
  assert.notEqual(origin, 'ICN');
  assert.notEqual(origin, 'GMP');
  assert.equal(getFlightOriginDisplayLabel(origin, 'ko'), '제주');
  assert.equal(getFlightOriginDisplayLabel(origin, 'en'), 'Jeju');
});

test('서울 좌표는 해외 도착이면 인천, 제주 도착이면 김포를 유지한다', () => {
  installStorage();
  assert.equal(
    resolveDefaultFlightOriginIataForLocation(TOKYO, { userLat: 37.5665, userLng: 126.978 }),
    'ICN',
  );
  assert.equal(
    resolveDefaultFlightOriginIataForLocation(JEJU, { userLat: 37.5665, userLng: 126.978 }),
    'GMP',
  );
});

test('좌표가 없으면 해외는 인천이고, 인천이 아닌 저장 출발은 유지한다', () => {
  installStorage();
  assert.equal(resolveDefaultFlightOriginIataForLocation(TOKYO), 'ICN');
  installStorage([['gateo.flightOriginIata', 'PUS'], locationSuccess(8.65, 98.25)]);
  assert.equal(resolveDefaultFlightOriginIataForLocation(KHAO_LAK), 'PUS');
  assert.equal(resolveDefaultFlightOriginIataForLocation(JEJU), 'PUS');
});
