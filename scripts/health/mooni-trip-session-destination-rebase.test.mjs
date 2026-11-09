import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emptyMooniTripSession,
  mergeMooniTripSession,
  rebaseMooniTripSessionOnDestinationChange,
} from '../../src/pages/Home/lib/mooniTripSession.js';
import { prepareFestivalMooniChatPayload } from '../../src/pages/Home/lib/festivalMooniRequest.js';

test('rebaseMooniTripSessionOnDestinationChange — clears GUM facts on guam→jeju', () => {
  const guamSession = mergeMooniTripSession(emptyMooniTripSession(), {
    slug: 'guam',
    destinationName: '괌',
    arrivalIata: 'GUM',
    arrivalAirportLabel: '괌(GUM)',
    departureIata: 'CJU',
    departureAirportLabel: '제주',
    nights: 5,
    stayLabel: '5박 6일',
  });
  const rebased = rebaseMooniTripSessionOnDestinationChange(guamSession, {
    slug: 'jeju',
    destinationName: '제주',
  });
  assert.equal(rebased.slug, 'jeju');
  assert.equal(rebased.destinationName, '제주');
  assert.equal(rebased.arrivalIata, '');
  assert.equal(rebased.departureIata, '');
  assert.equal(rebased.stayLabel, '');
});

test('prepareFestivalMooniChatPayload — same slug keeps session, new slug drops airports', () => {
  const base = mergeMooniTripSession(emptyMooniTripSession(), {
    slug: 'guam',
    destinationName: '괌',
    arrivalIata: 'GUM',
    departureIata: 'CJU',
  });
  const same = prepareFestivalMooniChatPayload({
    baseSession: base,
    userText: '투몬 숙소 추천',
    slug: 'guam',
    destinationName: '괌',
  });
  assert.equal(same.session.arrivalIata, 'GUM');

  const switched = prepareFestivalMooniChatPayload({
    baseSession: base,
    userText: '제주 우도 페리',
    slug: 'jeju',
    destinationName: '제주',
  });
  assert.equal(switched.session.slug, 'jeju');
  assert.equal(switched.session.arrivalIata, '');
  assert.equal(switched.session.departureIata, '');
});
