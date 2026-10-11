import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isTripThreadStaleVersusLocal,
  shouldHydrateDraftCacheFallback,
  shouldHydrateDraftMessages,
  shouldHydrateTripMessages,
} from '../../src/pages/Home/lib/festivalMooniChatSync.js';

test('shouldHydrateTripMessages keeps local thread when trip row is stale', () => {
  const local = [
    { role: 'user', text: 'chip' },
    { role: 'model', text: 'answer', mooniRawReply: 'answer' },
  ];
  const trip = [{ role: 'user', text: 'chip' }];
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 't1',
      lastSyncedChatId: 't1',
      tripMessageCount: trip.length,
      localMessageCount: local.length,
      tripMessages: trip,
      localMessages: local,
    }),
    false,
  );
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 't2',
      lastSyncedChatId: 't1',
      tripMessageCount: 0,
      localMessageCount: 2,
      tripMessages: [],
      localMessages: local,
    }),
    true,
  );
});

test('same-length stale server copy does not overwrite newer model tail', () => {
  const local = [
    { role: 'user', text: 'q' },
    { role: 'model', text: 'fresh model', mooniAt: 200 },
  ];
  const trip = [
    { role: 'user', text: 'q' },
    { role: 'model', text: 'stale model', mooniAt: 100 },
  ];
  assert.equal(isTripThreadStaleVersusLocal(trip, local), true);
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 't1',
      lastSyncedChatId: 't1',
      tripMessageCount: 2,
      localMessageCount: 2,
      tripMessages: trip,
      localMessages: local,
    }),
    false,
  );
});

test('shouldHydrateDraftMessages skips while loading or after user sent', () => {
  assert.equal(shouldHydrateDraftMessages({ localMessageCount: 0, isLoading: true }), false);
  assert.equal(shouldHydrateDraftMessages({ localMessageCount: 1, isLoading: false }), false);
  assert.equal(shouldHydrateDraftMessages({ localMessageCount: 0, isLoading: false }), true);
});

test('draft cache fallback only without trip row and empty local', () => {
  assert.equal(
    shouldHydrateDraftCacheFallback({
      activeChatId: 't1',
      hasTripRow: false,
      localMessageCount: 0,
      isLoading: false,
    }),
    true,
  );
  assert.equal(
    shouldHydrateDraftCacheFallback({
      activeChatId: 't1',
      hasTripRow: false,
      localMessageCount: 2,
      isLoading: false,
    }),
    false,
  );
  assert.equal(
    shouldHydrateDraftCacheFallback({
      activeChatId: 't1',
      hasTripRow: true,
      localMessageCount: 0,
      isLoading: false,
    }),
    false,
  );
});
