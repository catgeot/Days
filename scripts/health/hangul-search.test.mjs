import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  decomposeJamo,
  hangulChoseong,
  isChoseongQuery,
  jamoEditDistance,
  shouldConfirmHangulEntry,
} from '../../src/utils/hangulSearch.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('hangul search never throws on empty, composing jamo, symbols, long text, or mixed english', () => {
  const samples = [
    '',
    'ㄱ',
    'ㄱㅏ',
    'ㅊ',
    '!!',
    '춘천!',
    'Chuncheon 춘천',
    'a'.repeat(4000),
    'ㄱ'.repeat(200),
    null,
    undefined,
    { ko: '춘천' },
  ];
  for (const sample of samples) {
    assert.doesNotThrow(() => {
      hangulChoseong(sample);
      decomposeJamo(sample);
      isChoseongQuery(sample);
      jamoEditDistance(sample, '춘천');
      shouldConfirmHangulEntry({ composing: true, key: 'Enter' });
    });
  }
});

test('choseong shorter than 2 consonants is ignored', () => {
  assert.equal(isChoseongQuery(''), false);
  assert.equal(isChoseongQuery('ㄱ'), false);
  assert.equal(isChoseongQuery('ㅊ'), false);
  assert.equal(isChoseongQuery('ㅊㅊ'), true);
  assert.equal(isChoseongQuery('춘'), false);
  assert.equal(hangulChoseong('춘천'), 'ㅊㅊ');
  assert.equal(hangulChoseong(''), '');
});

test('jamo distance stays finite for a long string', () => {
  assert.equal(jamoEditDistance('가'.repeat(80), '나'), 99);
  assert.ok(jamoEditDistance('춘전', '춘천') <= 1);
});

test('IME composition blocks Enter', () => {
  assert.equal(shouldConfirmHangulEntry({ composing: true, key: 'Enter' }), false);
  assert.equal(shouldConfirmHangulEntry({ composing: false, key: 'Enter' }), true);
  assert.equal(shouldConfirmHangulEntry({ composing: false, key: 'a' }), false);
});

test('explore search does not import the shared hangul module yet', () => {
  const source = readFileSync(join(root, 'src/pages/Home/hooks/useSearchEngine.js'), 'utf8');
  assert.match(source, /초성 검색 기능 완전 폐기/);
  assert.doesNotMatch(source, /hangulSearch/);
  assert.doesNotMatch(source, /0xac00/i);
});
