import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isFestivalOperatingScheduleAsk } from '../../src/pages/Home/lib/mooniKoreaFestivalTurn.js';
import {
  polishFestivalModelReply,
  stripFestivalUnaskedRouteAndFood,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';

const GWANGHWAMUN_SHOPS = [
  { name: '디라이프스타일키친 광화문점', distKm: 0.5, cat3: '양식' },
  { name: '붓처스컷 광화문점', distKm: 0.6, cat3: '양식' },
  { name: '오양회참치', distKm: 0.7, cat3: '횟집' },
  { name: '동해도 광화문', distKm: 0.8, cat3: '한식' },
];

test('isFestivalOperatingScheduleAsk — 토요일 일정 / 기간 운영 일정', () => {
  assert.equal(isFestivalOperatingScheduleAsk('토요일 일정 알려줘'), true);
  assert.equal(isFestivalOperatingScheduleAsk('기간 중 운영 일정 알려줘'), true);
  assert.equal(isFestivalOperatingScheduleAsk('토요일 하루 일정을 짜 줘'), false);
  assert.equal(isFestivalOperatingScheduleAsk('근처 맛집 알려줘'), false);
});

test('stripFestivalUnaskedRouteAndFood — removes day-route and hint restaurants', () => {
  const raw =
    '12/11~1/31이에요. 토요일 저녁 18시부터 23시까지예요. '
    + '주말인 토요일에는 오후 6시 점등 시간에 맞춰 여유롭게 둘러보는 동선을 권해드려요. '
    + '낮에는 인근 명소를 가볍게 산책하고 카페에서 휴식을 취한 뒤, 해가 지면 청계천을 따라 산책하며 빛 전시를 즐겨보세요. '
    + '디라이프스타일키친 광화문점, 붓처스컷 광화문점, 오양회참치, 동해도 광화문도 있어요.';
  const opts = {
    userText: '토요일 일정 알려줘',
    locale: 'ko',
    contentId: '1095732',
    nearbyRestaurants: GWANGHWAMUN_SHOPS,
  };
  const out = stripFestivalUnaskedRouteAndFood(raw, opts);
  assert.doesNotMatch(out, /동선을\s*권해/);
  assert.doesNotMatch(out, /디라이프스타일키친/);
  assert.match(out, /12\/11~1\/31/);
  assert.match(out, /18시/);
});

test('polishFestivalModelReply — itinerary ask keeps route block', () => {
  const raw =
    '토요일 오전에는 서울로 7017을 산책하고, 저녁 6시에 청계천으로 가요. '
    + '디라이프스타일키친 광화문점도 가까워요.';
  const out = polishFestivalModelReply(raw, {
    userText: '토요일 하루 일정을 짜 줘',
    chipId: 'festival_day',
    locale: 'ko',
    contentId: '1095732',
    nearbyRestaurants: GWANGHWAMUN_SHOPS,
  });
  assert.match(out, /오전|7017|저녁/);
});

test('polishFestivalModelReply — food ask keeps restaurants', () => {
  const raw = '근처에 디라이프스타일키친 광화문점이 있어요.';
  const out = polishFestivalModelReply(raw, {
    userText: '근처 맛집 알려줘',
    chipId: 'festival_nearby',
    locale: 'ko',
    contentId: '1095732',
    nearbyRestaurants: GWANGHWAMUN_SHOPS,
  });
  assert.match(out, /디라이프스타일키친/);
});