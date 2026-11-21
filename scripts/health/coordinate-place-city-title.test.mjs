import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCoordinatePlaceIdentity } from '../../src/pages/Home/lib/coordinatePlaceIdentity.js';
import { preferOsmCityTitle } from '../../src/pages/Home/lib/osmReverseCityTitle.js';

test('호찌민 좌표 — 등록 허브 호찌민 이름·소개, 동네명 아님', () => {
  const hit = resolveCoordinatePlaceIdentity(10.775525, 106.702105);
  assert.ok(hit, 'nearby registered place');
  assert.equal(hit.name, '호찌민');
  assert.equal(hit.slug, 'ho-chi-minh');
  assert.equal(hit.country, '베트남');
  assert.match(hit.desc, /호찌민/);
  assert.doesNotMatch(hit.name, /Khu phố|Phường|Quận/);
});

test('하노이·방콕 도심 좌표 — 동네보다 등록 도시', () => {
  const hanoi = resolveCoordinatePlaceIdentity(21.033, 105.85);
  assert.equal(hanoi?.name, '하노이');
  assert.match(hanoi?.desc || '', /호안끼엠/);
  assert.doesNotMatch(hanoi?.name || '', /Phường|Hoàn Kiếm/);

  const bangkok = resolveCoordinatePlaceIdentity(13.75, 100.5);
  assert.equal(bangkok?.name, '방콕');
  assert.ok(String(bangkok?.desc || '').length > 20);
  assert.doesNotMatch(bangkok?.name || '', /Khwaeng|Khlong|แขวง/);
});

test('역지오 동네·구 이름은 도시명에 진다', () => {
  const hcmc = preferOsmCityTitle(
    'neighbourhood',
    'Khu phố 5',
    { neighbourhood: 'Khu phố 5', city_district: 'Quận 1', city: '호찌민시' },
  );
  assert.equal(hcmc, '호찌민시');

  const hanoiKo = preferOsmCityTitle(
    'quarter',
    'Khu phố cổ',
    { quarter: 'Khu phố cổ', city: '하노이' },
  );
  assert.equal(hanoiKo, '하노이');

  const bangkok = preferOsmCityTitle(
    'suburb',
    'Khlong Toei',
    { suburb: 'Khlong Toei', city: '방콕' },
  );
  assert.equal(bangkok, '방콕');

  const poi = preferOsmCityTitle(
    'attraction',
    'Independence Palace',
    { city: 'Ho Chi Minh City', attraction: 'Independence Palace' },
  );
  assert.equal(poi, 'Independence Palace');
});
