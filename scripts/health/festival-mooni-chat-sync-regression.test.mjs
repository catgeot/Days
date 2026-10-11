import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldHydrateTripMessages } from '../../src/pages/Home/lib/festivalMooniChatSync.js';

/** Pre-#431 ChatModal always applied trip.messages when activeChatId matched. */
function legacyAlwaysHydrateTrip({ tripMessageCount, localMessageCount }) {
  return (Number(tripMessageCount) || 0) >= 0 && (Number(localMessageCount) || 0) >= 0;
}

test('stale savedTrips row (user-only) would clobber model reply under legacy hydrate', () => {
  const tripMessageCount = 1;
  const localMessageCount = 2;
  assert.equal(legacyAlwaysHydrateTrip({ tripMessageCount, localMessageCount }), true);
  const trip = [{ role: 'user', text: 'chip' }];
  const local = [
    { role: 'user', text: 'chip' },
    { role: 'model', text: 'answer' },
  ];
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 't1',
      lastSyncedChatId: 't1',
      tripMessageCount,
      localMessageCount,
      tripMessages: trip,
      localMessages: local,
    }),
    false,
  );
});
