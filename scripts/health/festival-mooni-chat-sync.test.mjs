import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isTripThreadStaleVersusLocal,
  localProtectedTailMissing,
  rememberInFlightChatId,
  shouldHydrateDraftCacheFallback,
  shouldHydrateDraftMessages,
  shouldHydrateTripMessages,
  shouldReplaceMessagesOnLocaleMismatch,
} from '../../src/pages/Home/lib/festivalMooniChatSync.js';
import {
  festivalSaveExtras,
  festivalTripMatchesLocale,
  stampFestivalMooniLocale,
} from '../../src/pages/Home/lib/festivalMooniSessionCache.js';

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
    false,
  );
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 't2',
      lastSyncedChatId: 't1',
      tripMessageCount: 1,
      localMessageCount: 0,
      tripMessages: [{ role: 'user', text: '다른 채팅' }],
      localMessages: [],
    }),
    true,
  );
});

test('logged-in saved_trips update keeps a model answer missing from the row', () => {
  const local = [
    { role: 'user', text: '볼거리·분위기 알려 줘' },
    { role: 'model', text: '함평 국향대전은 국화 전시예요.', mooniAt: 50 },
  ];
  const longer = [
    { role: 'user', text: 'Tell me the sights and atmosphere in English.' },
    { role: 'model', text: 'A different English answer.', mooniAt: 10 },
    { role: 'model', text: 'More English that is not the local answer.', mooniAt: 11 },
  ];
  assert.equal(localProtectedTailMissing(local, longer), true);
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 'trip-1',
      lastSyncedChatId: 'trip-1',
      tripMessageCount: longer.length,
      localMessageCount: local.length,
      tripMessages: longer,
      localMessages: local,
    }),
    false,
  );
  assert.equal(shouldReplaceMessagesOnLocaleMismatch(local.length), false);
  assert.equal(shouldReplaceMessagesOnLocaleMismatch(0), true);
  const unstamped = { messages: longer };
  assert.equal(festivalTripMatchesLocale(unstamped, 'ko'), false);
  const stamped = {
    messages: longer,
    curation_data: stampFestivalMooniLocale(null, 'ko'),
  };
  assert.equal(festivalTripMatchesLocale(stamped, 'ko'), true);
  assert.equal(festivalSaveExtras('ko', { mooniSession: { slug: 'x' } }).mooniLocale, 'ko');
  assert.equal(stampFestivalMooniLocale({ country: 'KR' }, 'en').mooniLocale, 'en');
});

test('guidance bubble missing from the DB row is not hydrated away', () => {
  const local = [{ role: 'error', text: '질문이 잠시 몰렸어요. 잠시 후에 다시 물어봐 주세요.', mooniGuidance: true }];
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 'trip-1',
      lastSyncedChatId: null,
      tripMessageCount: 0,
      localMessageCount: 1,
      tripMessages: [],
      localMessages: local,
    }),
    false,
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

test('in-flight chat id keeps a shorter saved_trips row from wiping the answer', () => {
  const last = rememberInFlightChatId(null, 'trip-1', true);
  assert.equal(last, 'trip-1');
  assert.equal(rememberInFlightChatId('keep', null, true), 'keep');
  const local = [
    { role: 'user', text: '이 축제 알려줘' },
    { role: 'model', text: '국향대전은 함평 국화 축제예요.', mooniRawReply: '국향대전은 함평 국화 축제예요.' },
  ];
  const trip = [{ role: 'user', text: '이 축제 알려줘' }];
  assert.equal(
    shouldHydrateTripMessages({
      activeChatId: 'trip-1',
      lastSyncedChatId: last,
      tripMessageCount: trip.length,
      localMessageCount: local.length,
      tripMessages: trip,
      localMessages: local,
    }),
    false,
  );
});
