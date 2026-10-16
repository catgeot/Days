import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  KOREA_FILTER_CHIP_ACTIVE_FILL,
  KOREA_FILTER_CHIP_IDLE,
  koreaFilterChipClass,
} from '../../src/pages/Korea/koreaHubFilterChipStyles.js';

test('koreaFilterChipClass: selected period uses amber-700 fill without color transition', () => {
  const active = koreaFilterChipClass(true);
  assert.match(active, new RegExp(KOREA_FILTER_CHIP_ACTIVE_FILL.replace(/\s+/g, '\\s+')));
  assert.match(active, /transition-none/);
  assert.doesNotMatch(active, /bg-white/);
});

test('koreaFilterChipClass: unselected period uses idle white chip', () => {
  const idle = koreaFilterChipClass(false);
  assert.match(idle, new RegExp(KOREA_FILTER_CHIP_IDLE.replace(/\s+/g, '\\s+')));
  assert.doesNotMatch(idle, /bg-amber-700/);
});
