import assert from 'node:assert/strict';
import test from 'node:test';
import {
  pickSeaBasinCurationSpot,
  resolveSeaBasinFromQuery,
} from '../../src/pages/Home/lib/seaBasinResolve.js';

test('노르망디는 노르웨이해로 교정되지 않는다', () => {
  assert.equal(resolveSeaBasinFromQuery('노르망디'), null);
  assert.equal(pickSeaBasinCurationSpot('노르망디'), null);
});

test('해역 완전 일치와 실제 한 글자 오타는 유지', () => {
  assert.equal(resolveSeaBasinFromQuery('노르웨이해')?.basin?.name, '노르웨이해');
  assert.equal(resolveSeaBasinFromQuery('노르웨이해')?.typoCorrected, false);
  assert.equal(resolveSeaBasinFromQuery('서해')?.basin?.id, 'yellow-sea');
  assert.equal(resolveSeaBasinFromQuery('서해')?.typoCorrected, false);
  for (const typo of ['산호헤', '맥시코']) {
    const hit = resolveSeaBasinFromQuery(typo);
    assert.ok(hit, typo);
    assert.equal(hit.typoCorrected, true, typo);
  }
  assert.equal(resolveSeaBasinFromQuery('멕시코')?.basin?.id, 'gulf-of-mexico');
  assert.equal(resolveSeaBasinFromQuery('산호해')?.basin?.id, 'coral-sea');
});

test('다른 한글 지명이 해역 오타로 붙지 않는다', () => {
  for (const name of [
    '서원',
    '방콕',
    '하노이',
    '호치민',
    '프라하',
    '파리',
    '나트랑',
    '프로방스',
    '니스',
    '리옹',
    '경주',
    '강릉',
    '속초',
    '통영',
    '발리',
    '오사카',
  ]) {
    const hit = resolveSeaBasinFromQuery(name);
    assert.equal(hit, null, name);
  }
});
