#!/usr/bin/env node
/**
 * TourAPI meta 추론 스모크 — areacode 공백 POI 보정.
 *   node scripts/smoke-tourapi-attraction-infer.mjs
 */
import assert from 'assert';
import {
  fillTourAttractionMeta,
  inferTourAreaCodeFromAddr,
  inferTourCatsFromLcls,
} from './lib/tourapi-attraction-infer.mjs';

assert.equal(
  inferTourAreaCodeFromAddr('전남광주통합특별시 구례군 마산면 화엄사로 539'),
  '38',
);
assert.equal(inferTourAreaCodeFromAddr('서울특별시 종로구 사직로 161'), '1');
assert.equal(
  inferTourCatsFromLcls('HS', 'HS03', 'HS030100')?.cat3,
  'A02010800',
);

const filled = fillTourAttractionMeta({
  contentid: '127923',
  title: '화엄사',
  addr1: '전남광주통합특별시 구례군 마산면 화엄사로 539',
  areacode: '',
  cat1: '',
  lclsSystm1: 'HS',
  lclsSystm2: 'HS03',
  lclsSystm3: 'HS030100',
});
assert.equal(filled.areacode, '38');
assert.equal(filled.cat1, 'A02');
assert.equal(filled.cat3, 'A02010800');

console.log('smoke-tourapi-attraction-infer: PASS');
