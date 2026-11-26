import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ensureI18n } from '../../src/i18n/config.js';
import { shouldShowChatFlightSearchCta } from '../../src/utils/chatFlightSearchCta.js';
import { resolveChatBookingActions } from '../../src/utils/chatBookingResolver.js';
import { resolveFlightDepartureIataForBooking } from '../../src/utils/resolveDepartureIataFromChat.js';
import { buildAccessRouteAskText } from '../../src/pages/Home/lib/mooniQuickReplies.js';

await ensureI18n();

test('shouldShowChatFlightSearchCta — same IATA omits, different airports shows', () => {
  assert.equal(shouldShowChatFlightSearchCta('HKT', 'HKT'), false);
  assert.equal(shouldShowChatFlightSearchCta('ICN', 'HKT'), true);
  assert.equal(shouldShowChatFlightSearchCta('icn', 'hkt'), true);
  assert.equal(shouldShowChatFlightSearchCta(null, 'HKT'), true);
  assert.equal(shouldShowChatFlightSearchCta('HKT', null), true);
});

test('카오락 HKT→HKT 가는 방법 — trip_com 항공 CTA 없음', () => {
  const userText = buildAccessRouteAskText('HKT');
  assert.equal(
    resolveFlightDepartureIataForBooking({
      userText,
      tripSession: { departureIata: 'HKT' },
      excludeIata: 'HKT',
    }),
    'HKT',
  );
  const booking = resolveChatBookingActions({
    userText,
    destinationName: '카오락',
    slug: 'khao-lak',
    chatSource: 'place',
    tripSession: { departureIata: 'HKT' },
  });
  const flight = booking.actions.find((action) => action.provider === 'trip_com');
  assert.equal(flight, undefined);
  assert.equal(booking.actions.some((action) => action.provider === 'trip_com'), false);
});

test('카오락 ICN→HKT 가는 방법 — trip_com 항공 CTA 유지', () => {
  const userText = buildAccessRouteAskText('ICN');
  const booking = resolveChatBookingActions({
    userText,
    destinationName: '카오락',
    slug: 'khao-lak',
    chatSource: 'place',
    tripSession: { departureIata: 'ICN' },
  });
  const flight = booking.actions.find((action) => action.provider === 'trip_com');
  assert.ok(flight, 'expected flight CTA for ICN→HKT');
  assert.match(String(flight.routeHint), /ICN/);
  assert.match(String(flight.routeHint), /HKT/);
});