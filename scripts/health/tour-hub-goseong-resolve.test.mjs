import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCityAttractionHubFromTourAddr } from '../../src/pages/Home/lib/resolveCityAttractionHubFromTourAddr.js';
import { formatScenicSpotPlaceLabel } from '../../src/pages/Home/lib/scenicSpotPlaceLabel.js';
import { resolveRegionalHubIdForPlace } from '../../src/pages/Home/lib/resolveRegionalHubForPlace.js';
import { listRegionalScenicPlaceCardsForLocation } from '../../src/pages/Home/lib/resolvePlaceCrossLinks.js';

test('resolveCityAttractionHubFromTourAddr — 경남 고성군 vs 강원 고성군', () => {
  const gyeongnam = resolveCityAttractionHubFromTourAddr(
    '경상남도 고성군 송학동 송학리',
    '',
  );
  const gangwon = resolveCityAttractionHubFromTourAddr(
    '강원특별자치도 고성군 토성면',
    '',
  );
  assert.equal(gyeongnam?.hubId, 'goseongnam');
  assert.equal(gangwon?.hubId, 'goseong');
});

test('송학동 고분군 지역 명소는 경남 고성이고 강원 고성 명소는 빠진다', () => {
  const songhak = listRegionalScenicPlaceCardsForLocation({
    name: '송학동 고분군',
    parentCity: '고성',
    hubId: 'goseong',
    addr1: '경상남도 고성군 송학동',
    areaCode: '36',
    lat: 34.977,
    lng: 128.323,
    country: '대한민국',
  });
  assert.equal(songhak?.hubId, 'goseongnam');
  assert.equal(songhak?.hubName, '경남 고성');
  const names = (songhak?.spots || []).map((spot) => spot.name);
  assert.equal(names.some((name) => name.includes('거진') || name.includes('통일전망')), false);
  assert.equal(names.some((name) => name.includes('공룡') || name.includes('문수암')), true);

  const byCoords = resolveRegionalHubIdForPlace({
    name: '송학동 고분군',
    parentCity: '고성',
    hubId: 'goseong',
    lat: 34.977,
    lng: 128.323,
    country: '대한민국',
  });
  assert.equal(byCoords, 'goseongnam');

  const gangwon = listRegionalScenicPlaceCardsForLocation({
    name: '거진항',
    parentCity: '고성',
    hubId: 'goseong',
    addr1: '강원특별자치도 고성군 거진읍',
    areaCode: '32',
    lat: 38.446,
    lng: 128.46,
    country: '대한민국',
    slug: 'geojin-port',
  });
  assert.equal(gangwon?.hubId, 'goseong');
  assert.equal(
    (gangwon?.spots || []).some((spot) => spot.name.includes('거진')),
    true,
  );
});

test('동명 구는 시도가 맞을 때만 지역 허브로 붙는다', () => {
  assert.equal(
    resolveRegionalHubIdForPlace({
      parentCity: '중구',
      hubId: 'junggu',
      addr1: '부산광역시 중구 중앙대로',
      areaCode: '6',
      lat: 35.1028,
      lng: 129.032,
      country: '대한민국',
    }),
    '',
  );
  assert.equal(
    resolveRegionalHubIdForPlace({
      parentCity: '중구',
      addr1: '서울특별시 중구 명동길',
      areaCode: '1',
      lat: 37.5636,
      lng: 126.9869,
      country: '대한민국',
    }),
    'junggu',
  );
  assert.equal(
    resolveRegionalHubIdForPlace({
      parentCity: '강서구',
      hubId: 'gangseo',
      addr1: '부산광역시 강서구 가락대로',
      areaCode: '6',
      lat: 35.212,
      lng: 128.98,
      country: '대한민국',
    }),
    '',
  );
  assert.equal(
    resolveRegionalHubIdForPlace({
      parentCity: '강서구',
      addr1: '서울특별시 강서구 마곡중앙로',
      areaCode: '1',
      lat: 37.5695,
      lng: 126.8355,
      country: '대한민국',
    }),
    'gangseo',
  );
  for (const place of [
    { parentCity: '동구', addr1: '대구광역시 동구 동촌로', areaCode: '4', lat: 35.886, lng: 128.635 },
    { parentCity: '서구', addr1: '대전광역시 서구 둔산로', areaCode: '3', lat: 36.355, lng: 127.384 },
    { parentCity: '남구', addr1: '울산광역시 남구 삼산로', areaCode: '7', lat: 35.538, lng: 129.329 },
    { parentCity: '북구', addr1: '광주광역시 북구 무등로', areaCode: '5', lat: 35.174, lng: 126.912 },
  ]) {
    assert.equal(
      resolveRegionalHubIdForPlace({ ...place, country: '대한민국' }),
      '',
      place.addr1,
    );
  }
});

test('formatScenicSpotPlaceLabel prefers addr sido over wrong hubId', () => {
  const label = formatScenicSpotPlaceLabel({
    hubId: 'goseong',
    region: '강원',
    addr1: '경상남도 고성군 송학동',
  });
  assert.match(label, /경남/);
  assert.match(label, /고성/);
});