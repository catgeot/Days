import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyChatIntent,
  countPriorPlanItineraryTurns,
  isPlanItineraryIntentText,
  shouldCollapseItineraryBooking,
  shouldShowChatBookingCta,
} from '../../src/utils/chatIntentClassifier.js';
import {
  getDestinationBookingProfile,
  resolveBookingLegsForIntent,
} from '../../src/utils/destinationBookingProfile.js';
import { extractItineraryStayDates } from '../../src/utils/chatItineraryDates.js';
import {
  canShowMrtStayStrip,
  resolveMrtStayQuery,
} from '../../src/utils/mrtStayQuery.js';
import { resolveTravelSpotFromLocation } from '../../src/utils/travelSpotResolve.js';

test('isPlanItineraryIntentText — Korean itinerary phrasings', () => {
  assert.equal(isPlanItineraryIntentText('미야코지마 3박 4일 일정 짜줘'), true);
  assert.equal(isPlanItineraryIntentText('오키나와 4박5일 코스 추천해줘'), true);
  assert.equal(isPlanItineraryIntentText('숙소랑 투어도 같이 알려줘'), true);
  assert.equal(isPlanItineraryIntentText('2박3일 동선 잡아줘'), true);
});

test('isPlanItineraryIntentText — negatives stay non-itinerary', () => {
  assert.equal(isPlanItineraryIntentText('이곳 맛집 추천해줘'), false);
  assert.equal(isPlanItineraryIntentText('비자 필요해?'), false);
  assert.equal(isPlanItineraryIntentText('인천에서 항공편 어떻게 예약해?'), false);
});

test('classifyChatIntent — plan_itinerary primary for schedule asks', () => {
  const r = classifyChatIntent('미야코지마 3박 4일 일정 짜줘', [], 'miyakojima');
  assert.equal(r.primary, 'plan_itinerary');
  assert.ok(r.intents.includes('plan_itinerary'));
  assert.equal(
    shouldShowChatBookingCta(r, '미야코지마 3박 4일 일정 짜줘', []),
    true,
  );
});

test('classifyChatIntent — 추천-only stays none', () => {
  const r = classifyChatIntent('근처 맛집 추천', [], 'miyakojima');
  assert.equal(r.primary, 'none');
});

test('extractItineraryStayDates — explicit month/day + nights', () => {
  const { checkIn, checkOut } = extractItineraryStayDates('10월 15일부터 3박 4일', {
    nights: null,
  });
  assert.match(checkIn, /^\d{4}-10-15$/);
  assert.match(checkOut, /^\d{4}-10-18$/);
});

test('extractItineraryStayDates — no calendar date', () => {
  const { checkIn, checkOut } = extractItineraryStayDates('3박 4일 일정', { nights: 3 });
  assert.equal(checkIn, null);
  assert.equal(checkOut, null);
});

test('miyakojima catalog — stay keyword SSOT', () => {
  const hit = resolveTravelSpotFromLocation({ slug: 'miyakojima', name: '미야코지마' });
  const loc = {
    slug: hit.spot.slug,
    name: hit.spot.name,
    country: hit.spot.country,
    country_en: hit.spot.country_en,
  };
  assert.equal(loc.slug, 'miyakojima');
  assert.ok(canShowMrtStayStrip(loc));
  assert.ok(resolveMrtStayQuery(loc).keyword);
});

test('countPriorPlanItineraryTurns', () => {
  const history = [{ role: 'user', text: '미야코지마 3박 일정 짜줘' }];
  assert.equal(countPriorPlanItineraryTurns(history), 1);
});

test('shouldCollapseItineraryBooking — ChatModal path (history without current user)', () => {
  const priorTurns = [];
  const userText = '미야코지마 3박 4일 일정 짜줘';
  assert.equal(shouldCollapseItineraryBooking(priorTurns, userText), false);
  const afterFirst = [
    { role: 'user', text: userText },
    { role: 'model', text: 'mock' },
  ];
  assert.equal(shouldCollapseItineraryBooking(afterFirst, userText), true);
});

test('shouldCollapseItineraryBooking — usePlaceChat path (history already includes current user)', () => {
  const userText = '미야코지마 3박 4일 일정 짜줘';
  const historyWithCurrent = [{ role: 'user', text: userText }];
  assert.equal(shouldCollapseItineraryBooking(historyWithCurrent, userText), false);
  const secondTurnHistory = [
    { role: 'user', text: userText },
    { role: 'model', text: 'mock' },
    { role: 'user', text: '숙소도 추천해줘' },
  ];
  assert.equal(
    shouldCollapseItineraryBooking(secondTurnHistory, '숙소도 추천해줘'),
    false,
  );
  assert.equal(
    shouldCollapseItineraryBooking(
      [
        { role: 'user', text: userText },
        { role: 'model', text: 'mock' },
        { role: 'user', text: '오키나와 2박 일정도 짜줘' },
      ],
      '오키나와 2박 일정도 짜줘',
    ),
    true,
  );
});

test('resolveBookingLegsForIntent — ferryRequired + plan_itinerary keeps ferry leg', () => {
  const profile = { ferryRequired: true, legs: ['flight', 'ferry'] };
  const legs = resolveBookingLegsForIntent('plan_itinerary', profile, ['plan_itinerary']);
  assert.ok(legs.includes('itinerary_bundle'));
  assert.ok(legs.includes('ferry'));
});

test('getDestinationBookingProfile — gili-meno ferryRequired + plan_itinerary legs', () => {
  const profile = getDestinationBookingProfile('gili-meno');
  assert.equal(profile.ferryRequired, true);
  const legs = resolveBookingLegsForIntent('plan_itinerary', profile, [
    'plan_itinerary',
    'book_ferry',
  ]);
  assert.ok(legs.includes('itinerary_bundle'));
  assert.ok(legs.includes('ferry'));
});
