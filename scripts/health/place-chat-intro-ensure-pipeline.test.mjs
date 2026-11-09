import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  needsPlaceChatIntroHydration,
  shouldEnsurePlaceChatIntroForLocation,
} from '../../src/pages/Home/lib/placeDescText.js';
import {
  buildPlaceChatIntroKeys,
  resolvePlaceChatIntroPersistKey,
  resetPlaceChatIntroEnsureStateForTests,
} from '../../src/pages/Home/lib/placeChatIntro.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('name-only synthetic pin — ensure·display hydrate both', () => {
  const pin = { slug: 'fixture-name-only', name: '외곽섬', desc: '' };
  assert.equal(shouldEnsurePlaceChatIntroForLocation(pin), true);
  assert.equal(needsPlaceChatIntroHydration(pin), true);
  assert.deepEqual(buildPlaceChatIntroKeys(pin), ['외곽섬']);
});

test('persist primary key differs per fixture (제품 라우팅, mock 아님)', () => {
  const yap = { slug: 'yap', name: '야프', country: '미크로네시아 연방' };
  const miyako = { slug: 'miyakojima', name: '미야코지마', country: '일본' };
  assert.equal(resolvePlaceChatIntroPersistKey(yap), '미크로네시아 연방 야프');
  assert.equal(resolvePlaceChatIntroPersistKey(miyako), '일본 미야코지마');
  assert.notEqual(resolvePlaceChatIntroPersistKey(yap), resolvePlaceChatIntroPersistKey(miyako));
});

test('동시·실패 행동 — place-chat-intro-ensure-behavior.test.mjs 참조', () => {
  const p = join(root, 'scripts/health/place-chat-intro-ensure-behavior.test.mjs');
  assert.ok(readFileSync(p, 'utf8').includes('ensurePlaceChatIntroForLocation'));
  resetPlaceChatIntroEnsureStateForTests();
});
