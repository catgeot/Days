import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  noteCompatClick,
  resetCompatClicks,
  takeCompatClick,
} from '../../src/hooks/useClickWithDragPrevention.js';

describe('compat click after pointerup', () => {
  it('swallows the compatibility click even when it arrives late', () => {
    resetCompatClicks();
    noteCompatClick();
    assert.equal(takeCompatClick(), true);
    assert.equal(takeCompatClick(), false);
  });

  it('keeps one swallow per pointer activation', () => {
    resetCompatClicks();
    noteCompatClick();
    noteCompatClick();
    assert.equal(takeCompatClick(), true);
    assert.equal(takeCompatClick(), true);
    assert.equal(takeCompatClick(), false);
  });
});
