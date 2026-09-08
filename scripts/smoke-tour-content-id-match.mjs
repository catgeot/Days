#!/usr/bin/env node
import assert from 'node:assert';
import {
  KEYWORD_ALIASES,
  acceptUniqueLiveHit,
  classifyScenicMember,
  looksLikeSigunguDisambiguator,
  memberCoords,
  memberQueries,
  scoreHit,
  strategyQueries,
  titleCoversName,
} from './lib/tour-content-id-match.mjs';

const samcheokHub = { hubId: 'samcheok', name: '삼척', aliases: [] };
const andongHub = { hubId: 'andong', name: '안동', aliases: [] };
const hwacheonHub = { hubId: 'hwacheon', name: '화천', aliases: [] };

const samcheokQueries = memberQueries({ attractionName: '삼척 환선굴' }, samcheokHub);
assert.ok(samcheokQueries.includes('환선굴'), 'memberQueries strips hub prefix');
assert.ok(samcheokQueries.includes('삼척 환선굴'), 'memberQueries keeps full name');

const jincheonHub = { hubId: 'jincheon', name: '진천', aliases: [] };
const dutaQueries = memberQueries({ attractionName: '두타모종' }, jincheonHub);
assert.ok(dutaQueries.includes('영수사'), 'P0-A01 시호 alias 영수사');
assert.ok(KEYWORD_ALIASES['농암모설']?.includes('진천 농다리'), 'P0-A01 농암모설 alias');

assert.equal(looksLikeSigunguDisambiguator('천연기념물'), false);
assert.equal(looksLikeSigunguDisambiguator('고성'), true);
assert.equal(looksLikeSigunguDisambiguator('용머리'), false);

const hwacheonItem = {
  title: '화암동굴(천연기념물)',
  addr1: '강원특별자치도 화천군 화천읍',
  contentTypeId: '12',
  mapy: 38.09,
  mapx: 127.7,
};
const hwacheonMember = {
  attractionName: '화암동굴',
  lat: 38.09,
  lng: 127.7,
};
assert.ok(
  scoreHit('화암동굴', hwacheonItem, hwacheonHub, hwacheonMember) >= 80,
  'descriptive paren should not block scoreHit',
);

const goseongItem = {
  title: '도산서원(고성)',
  addr1: '경상남도 고성군',
  contentTypeId: '12',
  mapy: 34.97,
  mapx: 128.33,
};
const andongMember = {
  attractionName: '도산서원',
  lat: 36.57,
  lng: 128.73,
};
assert.equal(
  scoreHit('도산서원', goseongItem, andongHub, andongMember),
  0,
  'different sigungu homonym in paren should block',
);

const hubWithAttr = {
  hubId: 'samcheok',
  name: '삼척',
  lat: 37.45,
  lng: 129.17,
  attractions: [{ name: '환선굴', lat: 37.43, lng: 129.16 }],
};
const coords = memberCoords({ attractionName: '환선굴' }, hubWithAttr);
assert.equal(coords.lat, 37.43);
assert.equal(coords.lng, 129.16);

const hubOnlyCoords = memberCoords({ attractionName: '미등록명소' }, hubWithAttr);
assert.equal(hubOnlyCoords.lat, 37.45);
assert.equal(hubOnlyCoords.lng, 129.17);

assert.equal(classifyScenicMember({ attractionName: '죽서루' }), 'short');
assert.equal(classifyScenicMember({ attractionName: '평사낙안' }), 'siho');
assert.equal(classifyScenicMember({ attractionName: '호미곶 일출' }), 'poetic');
assert.equal(classifyScenicMember({ attractionName: '양구 수목원' }), 'prefix');

const jukQueries = strategyQueries({ attractionName: '죽서루' }, samcheokHub);
assert.ok(jukQueries.includes('삼척 죽서루'), 'strategyQueries adds hub prefix');
assert.ok(titleCoversName('삼척 죽서루', '죽서루'), 'title covers short name');

const jukHit = acceptUniqueLiveHit(
  { attractionName: '죽서루' },
  samcheokHub,
  [{ title: '삼척 죽서루', addr1: '강원 삼척시 성내동 9-3', contentTypeId: '12', contentId: '125406' }],
);
assert.equal(jukHit.status, 'unique_hit');
assert.equal(jukHit.contentId, '125406');

const daecheong = acceptUniqueLiveHit(
  { attractionName: '대청봉' },
  { hubId: 'inje', name: '인제', aliases: [] },
  [{ title: '설악산 대청봉', addr1: '강원특별자치도 양양군 서면 오색리', contentTypeId: '12', contentId: '125587' }],
);
assert.equal(daecheong.status, 'hub_mismatch');

const yangguArb = acceptUniqueLiveHit(
  { attractionName: '양구 수목원' },
  { hubId: 'yanggu', name: '양구', aliases: [] },
  [{ title: '강릉 솔향수목원', addr1: '강원특별자치도 강릉시', contentTypeId: '12', contentId: '1' }],
);
assert.equal(yangguArb.status, 'tour_missing');

console.log('smoke-tour-content-id-match: PASS');
