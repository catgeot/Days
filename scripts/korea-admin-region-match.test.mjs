import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isForbiddenShortRegionKey,
  matchKoreaAdminRegionFromAddr,
  stripKoreaAdminSuffix,
} from '../src/pages/Home/lib/koreaAdminRegionMatch.js';

test('strip suffix and forbid 1–2 letter region keys', () => {
  assert.equal(stripKoreaAdminSuffix('강릉시'), '강릉');
  assert.equal(stripKoreaAdminSuffix('평창군'), '평창');
  assert.ok(isForbiddenShortRegionKey('릉'));
  assert.ok(isForbiddenShortRegionKey('주'));
  assert.ok(!isForbiddenShortRegionKey('강릉'));
  assert.ok(isForbiddenShortRegionKey('릉'));
});

test('token-exact addr match resolves gangneung and pyeongchang', () => {
  assert.deepEqual(matchKoreaAdminRegionFromAddr('강원특별자치도 강릉시 경포로'), {
    hubId: 'gangneung',
    sidoCode: '32',
    sigungu: '강릉',
  });
  assert.deepEqual(matchKoreaAdminRegionFromAddr('강원도 평창군 봉평면'), {
    hubId: 'pyeongchang',
    sidoCode: '32',
    sigungu: '평창',
  });
});

test('homonym 고성군 disambiguates by sido', () => {
  assert.deepEqual(matchKoreaAdminRegionFromAddr('강원특별자치도 고성군 거진읍'), {
    hubId: 'goseong',
    sidoCode: '32',
    sigungu: '고성',
  });
  assert.deepEqual(matchKoreaAdminRegionFromAddr('경상남도 고성군 고성읍'), {
    hubId: 'goseongnam',
    sidoCode: '36',
    sigungu: '고성',
  });
});

test('중구 requires matching sido — 부산 addr does not map to 서울 중구 hub', () => {
  assert.deepEqual(matchKoreaAdminRegionFromAddr('서울특별시 중구 세종대로'), {
    hubId: 'junggu',
    sidoCode: '1',
    sigungu: '중구',
  });
  assert.equal(matchKoreaAdminRegionFromAddr('부산광역시 중구 중앙대로'), null);
});
