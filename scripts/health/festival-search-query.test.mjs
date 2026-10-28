import assert from 'node:assert/strict';
import test from 'node:test';
import {
  festivalSearchQueryTokens,
  filterBySearchQuery,
} from '../../src/pages/Korea/festivalSearch.js';

test('festivalSearchQueryTokens splits spaced queries', () => {
  assert.deepEqual(festivalSearchQueryTokens('진주 유등'), ['진주', '유등']);
  assert.deepEqual(festivalSearchQueryTokens('  산 천 어 '), ['산천어']);
});

test('filterBySearchQuery requires every spaced token in title or addr', () => {
  const jinju = {
    title: '진주남강유등축제',
    addr1: '경상남도 진주시',
  };
  assert.equal(filterBySearchQuery([jinju], '진주 유등').length, 1);
  assert.equal(filterBySearchQuery([jinju], '진주유등').length, 0);
  assert.equal(filterBySearchQuery([jinju], '진주').length, 1);
});
