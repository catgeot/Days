import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPlaceChatIntroKeys } from '../src/pages/Home/lib/placeChatIntro.js';

test('완도 상왕봉 is looked up before the bare 상왕봉 key that also matches 가야산', () => {
  const wando = buildPlaceChatIntroKeys(
    { name: '상왕봉', parentCity: '완도', country: '대한민국' },
    'ko',
  );
  const gayasan = buildPlaceChatIntroKeys(
    { name: '상왕봉', parentCity: '가야산', country: '대한민국' },
    'ko',
  );

  assert.deepEqual(wando.slice(0, 2), ['완도 상왕봉', '대한민국 완도 상왕봉']);
  assert.deepEqual(gayasan.slice(0, 2), ['가야산 상왕봉', '대한민국 가야산 상왕봉']);
  assert.ok(wando.indexOf('완도 상왕봉') < wando.indexOf('상왕봉'));
  assert.ok(wando.indexOf('대한민국 완도 상왕봉') < wando.indexOf('대한민국 상왕봉'));
  assert.equal(wando.includes('가야산 상왕봉'), false);
  assert.equal(gayasan.includes('완도 상왕봉'), false);
  assert.equal(wando.at(-1), '상왕봉');
  assert.equal(gayasan.at(-1), '상왕봉');
});

test('places without parentCity keep the country-then-name key order', () => {
  const keys = buildPlaceChatIntroKeys({ name: '상왕봉', country: '대한민국' }, 'ko');
  assert.deepEqual(keys, ['대한민국 상왕봉', '상왕봉']);
});
