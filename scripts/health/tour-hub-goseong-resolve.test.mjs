import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCityAttractionHubFromTourAddr } from '../../src/pages/Home/lib/resolveCityAttractionHubFromTourAddr.js';
import { formatScenicSpotPlaceLabel } from '../../src/pages/Home/lib/scenicSpotPlaceLabel.js';

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

test('formatScenicSpotPlaceLabel prefers addr sido over wrong hubId', () => {
  const label = formatScenicSpotPlaceLabel({
    hubId: 'goseong',
    region: '강원',
    addr1: '경상남도 고성군 송학동',
  });
  assert.match(label, /경남/);
  assert.match(label, /고성/);
});