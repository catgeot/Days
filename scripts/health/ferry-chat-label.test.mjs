import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatFerryOperatorChatLabel } from '../../src/utils/ferryChatLabel.js';

test('formatFerryOperatorChatLabel — ko / en prefix', () => {
  assert.equal(formatFerryOperatorChatLabel('Eka Jaya', 'ko'), '페리 · Eka Jaya');
  assert.equal(formatFerryOperatorChatLabel('Eka Jaya', 'en'), 'Ferry · Eka Jaya');
  assert.equal(formatFerryOperatorChatLabel('페리 · Eka Jaya', 'ko'), '페리 · Eka Jaya');
  assert.equal(formatFerryOperatorChatLabel('BlueWater Express', 'en'), 'Ferry · BlueWater Express');
});
