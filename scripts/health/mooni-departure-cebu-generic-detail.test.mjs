import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ensureI18n } from '../../src/i18n/config.js';
import { aliasMatchesHay } from '../../src/utils/rentalAirportMatch.js';
import {
  matchDepartureInText,
  resolveDepartureIataFromChat,
} from '../../src/utils/resolveDepartureIataFromChat.js';
import { resolveChatBookingActions } from '../../src/utils/chatBookingResolver.js';
import { isCebuGenericDetailUsage } from '../../src/utils/cebuKoreanPlaceGuard.js';

await ensureI18n();

test('isCebuGenericDetailUsage — 일정·시간별 세부', () => {
  assert.equal(isCebuGenericDetailUsage('세부 일정만 정리해 줘'), true);
  assert.equal(isCebuGenericDetailUsage('카오락 시간별 세부 일정 짜 줘'), true);
  assert.equal(isCebuGenericDetailUsage('세부 여행 3박'), false);
  assert.equal(isCebuGenericDetailUsage('세부로 갈게요'), false);
});

test('aliasMatchesHay — CEB 세부 별칭 generic 세부 제외', () => {
  assert.equal(aliasMatchesHay('푸켓 세부 일정 짜 줘', '세부', 'CEB'), false);
  assert.equal(aliasMatchesHay('세부 여행', '세부', 'CEB'), true);
  assert.equal(aliasMatchesHay('세부로 출발', '세부', 'CEB'), true);
});

test('matchDepartureInText — 세부 일정은 CEB 출발 아님', () => {
  assert.equal(matchDepartureInText('세부 일정만 정리해 줘')?.iata, undefined);
  assert.equal(matchDepartureInText('세부에서 출발할게요')?.iata, 'CEB');
});

test('resolveDepartureIataFromChat — 호주·푸켓 후 세부 일정 턴', () => {
  const history = [
    { role: 'user', text: '호주에서 출발해서 그레이트 배리어 리프 가려고 해요' },
    { role: 'user', text: '푸켓으로 바꿀게요 3박 일정' },
  ];
  const iata = resolveDepartureIataFromChat('세부 일정 짜 줘', history, {
    excludeIata: 'HKT',
  });
  assert.notEqual(iata, 'CEB');
});

test('resolveChatBookingActions — 푸켓 일정 카드 출발지 CEB 아님', () => {
  const result = resolveChatBookingActions({
    userText: '세부 일정 짜 줘',
    destinationName: '푸켓',
    slug: 'phuket',
    chatHistory: [
      { role: 'user', text: '호주에서 출발해서 그레이트 배리어 리프 가려고 해요' },
      { role: 'user', text: '푸켓으로 바꿀게요 3박 일정' },
    ],
  });
  const flight = result.actions.find((a) => a.type === 'trip_flight');
  assert.ok(flight, 'itinerary bundle should include flight CTA');
  assert.notEqual(flight.departureIata, 'CEB');
  assert.ok(!String(flight.routeHint ?? '').includes('막탄세부'), flight.routeHint);
});
