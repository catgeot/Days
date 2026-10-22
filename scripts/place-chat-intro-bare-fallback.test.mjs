import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPlaceChatIntroBareFallbackKeys,
  destinationKeyMatchesBareName,
  distinctIntroLogicalKeysForBareName,
  isBareIntroNameUnambiguous,
  pickBareFallbackIntroFromRows,
} from '../src/pages/Home/lib/placeChatIntroBareFallback.js';

const ACCEPTED_SUMMARY =
  '완도군 상왕봉은 완도8경 제5경으로 해발 644m의 전망 명소입니다. 상황백운홍춘국원과 어우러진 해안 산세가 특징이며 등산객이 즐겨 찾는 대표 봉우리입니다.';

test('buildPlaceChatIntroBareFallbackKeys returns bare and country+name when parentCity is set', () => {
  const keys = buildPlaceChatIntroBareFallbackKeys(
    { name: '국화섬', parentCity: '완도', country: '대한민국' },
    'ko',
  );
  assert.deepEqual(keys, ['국화섬', '대한민국 국화섬']);
});

test('unique bare-name hit: one legacy row resolves via ko or en storage key', () => {
  const rows = [
    { destination_key: '국화섬', summary: ACCEPTED_SUMMARY },
    { destination_key: '국화섬@en', summary: `${ACCEPTED_SUMMARY} (en)` },
  ];
  assert.equal(isBareIntroNameUnambiguous(rows, '국화섬'), true);
  const pickedKo = pickBareFallbackIntroFromRows(rows, '국화섬', 'ko');
  assert.equal(pickedKo?.logicalKey, '국화섬');
  assert.equal(pickedKo?.summary, ACCEPTED_SUMMARY);
  const pickedEn = pickBareFallbackIntroFromRows(rows, '국화섬', 'en');
  assert.equal(pickedEn?.logicalKey, '국화섬');
  assert.ok(pickedEn?.summary.includes('(en)'));
});

test('ambiguous bare-name miss: two parent-qualified keys for the same bare name', () => {
  const rows = [
    { destination_key: '완도 상왕봉', summary: ACCEPTED_SUMMARY },
    { destination_key: '가야산 상왕봉', summary: ACCEPTED_SUMMARY },
  ];
  assert.equal(destinationKeyMatchesBareName('완도 상왕봉', '상왕봉'), true);
  assert.equal(destinationKeyMatchesBareName('가야산 상왕봉', '상왕봉'), true);
  assert.equal(distinctIntroLogicalKeysForBareName(rows, '상왕봉').size, 2);
  assert.equal(isBareIntroNameUnambiguous(rows, '상왕봉'), false);
  assert.equal(pickBareFallbackIntroFromRows(rows, '상왕봉', 'ko'), null);
});
