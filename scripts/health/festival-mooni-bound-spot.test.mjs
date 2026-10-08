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

test('buildFestivalMooniNeutralOpening uses verified guide sections', () => {
  const opening = buildFestivalMooniNeutralOpening(buildFestivalMooniContext(FIXTURE));
  assert.match(opening, /홍천 인삼한우 명품축제/);
  assert.match(opening, /10\.08 – 10\.11/);
  assert.match(opening, /볼거리/);
  assert.match(opening, /주변 즐길거리/);
  assert.doesNotMatch(opening, /대한민국 홍천/);
});

test('buildFestivalMooniChatOpening merges invite line', () => {
  const opening = buildFestivalMooniChatOpening(
    buildFestivalMooniContext(FIXTURE),
    '이 축제에 대해 물어보세요.',
  );
  assert.match(opening, /홍천 인삼한우 명품축제/);
  assert.match(opening, /이 축제에 대해 물어보세요/);
  assert.ok(opening.indexOf('이 축제에 대해 물어보세요.') > 0);
});
