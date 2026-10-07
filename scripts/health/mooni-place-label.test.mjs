import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildMooniBoundSpotFromLocation,
  formatPlaceChatLabel,
  localizeMooniPlaceLabel,
} from '../../src/pages/Home/lib/mooniPlaceChatLabel.js';
import { buildFestivalMooniBoundSpot } from '../../src/pages/Korea/lib/festivalMooniBoundSpot.js';

const FESTIVAL_FIXTURE = {
  item: {
    contentId: '790124',
    title: '홍천 인삼한우 명품축제',
    eventStartDate: '20251008',
    eventEndDate: '20251011',
    addr1: '강원특별자치도 홍천군 홍천읍 갈마곡리',
    mapx: '127.8934680000',
    mapy: '37.6894110000',
  },
  intro: { playtime: '09:00 ~ 22:00', eventplace: '도시산림공원 토리숲' },
  location: { name: '홍천', country: '대한민국' },
  summaryFields: { dateText: '10.08 – 10.11', timeText: '09:00 ~ 22:00' },
};

test('catalog place (kyoto) localizes by UI locale, not bound displayLabel', () => {
  const bound = buildMooniBoundSpotFromLocation({
    slug: 'kyoto',
    name: '교토',
    country: '일본',
    lat: 35.0116,
    lng: 135.7681,
  });
  assert.equal(bound?.displayLabel, formatPlaceChatLabel(bound, 'ko'));
  assert.equal(localizeMooniPlaceLabel(bound, 'ko'), '일본 교토');
  assert.equal(localizeMooniPlaceLabel(bound, 'en'), 'Japan Kyoto');
});

test('catalog place card titles match main (ko/en) via localizeMooniPlaceLabel', () => {
  const cardLoc = {
    slug: 'kyoto',
    name: '교토',
    country: '일본',
    lat: 35.0116,
    lng: 135.7681,
  };
  assert.equal(localizeMooniPlaceLabel(cardLoc, 'ko'), '일본 교토');
  assert.equal(localizeMooniPlaceLabel(cardLoc, 'en'), 'Japan Kyoto');
  const bound = buildMooniBoundSpotFromLocation(cardLoc);
  assert.equal(localizeMooniPlaceLabel(bound, 'ko'), '일본 교토');
  assert.equal(localizeMooniPlaceLabel(bound, 'en'), 'Japan Kyoto');
});

test('world-event style explicit displayLabel does not override catalog locale label', () => {
  const bound = buildMooniBoundSpotFromLocation({
    slug: 'kyoto',
    name: '교토',
    country: '일본',
    displayLabel: '교토 문화제 · 교토',
    eventContext: { seedText: 'event seed' },
  });
  assert.equal(bound?.displayLabel, formatPlaceChatLabel(bound, 'ko'));
  assert.equal(localizeMooniPlaceLabel(bound, 'en'), 'Japan Kyoto');
  assert.equal(localizeMooniPlaceLabel(bound, 'ko'), '일본 교토');
});

test('festivalContext keeps explicit festival displayLabel', () => {
  const bound = buildFestivalMooniBoundSpot(FESTIVAL_FIXTURE);
  assert.equal(
    localizeMooniPlaceLabel(bound, 'en'),
    '홍천 인삼한우 명품축제 · 홍천',
  );
  assert.equal(
    localizeMooniPlaceLabel(bound, 'ko'),
    '홍천 인삼한우 명품축제 · 홍천',
  );
});
