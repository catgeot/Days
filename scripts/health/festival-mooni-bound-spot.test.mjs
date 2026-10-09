import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFestivalMooniChatOpening,
  buildFestivalMooniContext,
  buildFestivalMooniNeutralOpening,
} from '../../src/pages/Korea/lib/festivalMooniContext.js';

const FIXTURE = {
  item: {
    contentId: '790124',
    title: '홍천 인삼한우 명품축제',
    eventStartDate: '20251008',
    eventEndDate: '20251011',
    addr1: '강원특별자치도 홍천군 홍천읍 갈마곡리',
    mapx: '127.888',
    mapy: '37.697',
  },
  intro: {
    playtime: '09:00 ~ 22:00',
    eventplace: '도시산림공원 토리숲',
    usetimefestival: '무료',
  },
  location: { name: '홍천', country: '대한민국' },
  homepage: 'https://example.org/festival',
  summaryFields: {
    dateText: '10.08 – 10.11',
    timeText: '09:00 ~ 22:00',
    fee: { text: '무료' },
  },
};

test('buildFestivalMooniContext keeps TourAPI-shaped fields', () => {
  const ctx = buildFestivalMooniContext(FIXTURE);
  assert.equal(ctx.contentId, '790124');
  assert.equal(ctx.title, '홍천 인삼한우 명품축제');
  assert.match(ctx.gateoUrl, /festival=790124/);
  assert.equal(ctx.dateLabel, '10.08 – 10.11');
  assert.equal(ctx.venue, '도시산림공원 토리숲');
  assert.equal(ctx.address, FIXTURE.item.addr1);
  assert.equal(ctx.lat, 37.697);
  assert.equal(ctx.lng, 127.888);
});

test('buildFestivalMooniNeutralOpening uses verified sentences only', () => {
  const opening = buildFestivalMooniNeutralOpening(buildFestivalMooniContext(FIXTURE));
  assert.match(opening, /홍천 인삼한우 명품축제/);
  assert.match(opening, /2025년 10월 8일부터 2025년 10월 11일까지/);
  assert.match(opening, /도시산림공원 토리숲/);
  assert.match(opening, /festival=790124/);
  assert.doesNotMatch(opening, /대한민국 홍천/);
  assert.doesNotMatch(opening, /오신 것을 환영합니다/);
  assert.doesNotMatch(opening, /^[-•]/m);
});

test('buildFestivalMooniChatOpening ignores the old invite line', () => {
  const opening = buildFestivalMooniChatOpening(
    buildFestivalMooniContext(FIXTURE),
    '이 축제에 대해 물어보세요.',
  );
  assert.match(opening, /홍천 인삼한우 명품축제/);
  assert.doesNotMatch(opening, /이 축제에 대해 물어보세요/);
  assert.match(opening, /다음으로/);
});
