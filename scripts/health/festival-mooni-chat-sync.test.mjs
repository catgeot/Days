import assert from 'node:assert/strict';
import test from 'node:test';
import {
  shouldHydrateDraftMessages,
  shouldHydrateTripMessages,
} from '../../src/pages/Home/lib/festivalMooniChatSync.js';

test('shouldHydrateTripMessages keeps local thread when trip row is stale', () => {
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 't1',
      lastSyncedChatId: 't1',
      tripMessageCount: 0,
      localMessageCount: 2,
    }),
    false,
  );
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 't2',
      lastSyncedChatId: 't1',
      tripMessageCount: 0,
      localMessageCount: 2,
    }),
    true,
  );
});

test('shouldHydrateDraftMessages skips while loading or after user sent', () => {
  assert.equal(shouldHydrateDraftMessages({ localMessageCount: 0, isLoading: true }), false);
  assert.equal(shouldHydrateDraftMessages({ localMessageCount: 1, isLoading: false }), false);
  assert.equal(shouldHydrateDraftMessages({ localMessageCount: 0, isLoading: false }), true);
});
