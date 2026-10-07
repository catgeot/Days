/**
 * MOONi 일정 카드 URL HTTP 상태 (Node fetch).
 *   node scripts/smoke-chat-itinerary-links.mjs
 */
import assert from 'node:assert/strict';
import { resolveChatBookingActions } from '../src/utils/chatBookingResolver.js';
import { resolveItineraryBookingActions } from '../src/utils/chatItineraryBooking.js';

const { actions } = resolveItineraryBookingActions({
  slug: 'miyakojima',
  destinationName: '미야코지마',
  userText: '미야코지마 3박 4일 일정 짜줘',
  chatHistory: [],
  tripSession: { nights: 3 },
});

assert.ok(actions.length >= 2, `expected actions, got ${actions.length}`);

const results = [];
for (const action of actions) {
  const res = await fetch(action.url, {
    method: 'GET',
    redirect: 'manual',
    headers: { 'user-agent': 'gateo-smoke/1.0' },
  });
  results.push({ provider: action.provider, status: res.status, url: action.url });
}

for (const row of results) {
  const ok = row.status >= 200 && row.status < 400;
  if (!ok && (row.provider === 'klook_tour' || row.provider === 'klook_pickup') && row.status === 403) {
    console.warn(`warn: ${row.provider} returned ${row.status} (bot block — URL still valid)`);
    continue;
  }
  assert.ok(
    row.status >= 200 && row.status < 400,
    `${row.provider} ${row.status} ${row.url}`,
  );
}

console.log(JSON.stringify(results, null, 2));

const ferryItinerary = resolveChatBookingActions({
  userText: '길리메노 3박 4일 페리로 가는 일정 짜줘',
  destinationName: '길리메노',
  slug: 'gili-meno',
  chatHistory: [],
  chatSource: 'place',
  aiReplyText: '',
});
assert.ok(ferryItinerary.show, 'gili-meno itinerary booking should show');
assert.ok(
  ferryItinerary.actions.some((a) => a.provider === 'twelve_go' || a.provider === 'direct'),
  'gili-meno ferryRequired itinerary must include ferry card',
);
assert.ok(ferryItinerary.actions.length <= 4);

console.log('smoke-chat-itinerary-links: PASS');
