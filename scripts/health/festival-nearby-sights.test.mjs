import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isFestivalVenueSight,
  mergeFestivalNearbySights,
  normalizeNearbySightName,
} from '../../src/pages/Korea/lib/festivalNearbySights.js';
import { isNearbyTourAttractionTitle } from '../../src/pages/Home/lib/koreaTourAttractionNearbyFilter.js';

const origin = { lat: 35.06, lng: 126.52 };

test('normalize nearby sight names', () => {
  assert.equal(normalizeNearbySightName('돌머리 해수욕장'), normalizeNearbySightName('돌머리해수욕장'));
});

test('dedupe by contentId then normalized name', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '용천사 함평', contentId: '129246', lat: 35.183, lng: 126.545 },
    ],
    grouped: {
      groups: [],
      rest: [
        { name: '용천사 함평', contentId: '129246', lat: 35.183, lng: 126.545 },
        { name: '용천사함평', contentId: '888', lat: 35.19, lng: 126.55 },
      ],
    },
    origin,
  });
  assert.equal(merged.items.length, 1);
  assert.equal(merged.items[0].contentId, '129246');
});

test('exclude the festival venue', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '함평엑스포공원', contentId: '130864', lat: 35.0592, lng: 126.5222 },
      { name: '별관', contentId: '42', lat: 35.062, lng: 126.521 },
    ],
    grouped: { groups: [], rest: [] },
    origin: { lat: 35.0592, lng: 126.5222 },
    venue: {
      contentIds: ['130864'],
      eventPlace: '함평엑스포공원',
      addr: '전라남도 함평군 별관 일원',
    },
  });
  const names = merged.items.map((spot) => spot.name);
  assert.deepEqual(names, []);
  assert.equal(
    isFestivalVenueSight(
      { name: '함평엑스포공원', contentId: '1' },
      { ids: new Set(), eventPlace: '함평엑스포공원', addr: '' },
      3,
    ),
    true,
  );
});

test('sort by distance and hide missing or fallback coordinates', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '먼곳', contentId: '2', lat: 35.2, lng: 126.6 },
      { name: '가까운곳', contentId: '3', lat: 35.07, lng: 126.53 },
      { name: '좌표없음', contentId: '4' },
    ],
    grouped: {
      groups: [],
      rest: [
        { name: '중심A', contentId: '5', lat: 35.0654, lng: 126.5166 },
        { name: '중심B', contentId: '6', lat: 35.0654, lng: 126.5166 },
      ],
    },
    origin,
    fallbackCenters: [{ lat: 35.0654, lng: 126.5166 }],
  });
  assert.deepEqual(
    merged.items.map((spot) => spot.name),
    ['가까운곳', '먼곳', '좌표없음', '중심A', '중심B'],
  );
  assert.ok(merged.items[0].distKm < merged.items[1].distKm);
  assert.equal(merged.items.find((spot) => spot.name === '좌표없음').distKm, null);
  assert.equal(merged.items.find((spot) => spot.name === '중심A').distKm, null);
  assert.equal(merged.items.find((spot) => spot.name === '중심B').distKm, null);
});

test('팔경 group stays as a subheading', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [],
    grouped: {
      groups: [
        {
          title: '함평 팔경',
          listId: 'hampyeong-palgyeong',
          items: [
            { name: '청계산', rankBlurb: '함평 8경', lat: 35.1, lng: 126.48 },
            { name: '삼호천', rankBlurb: '함평 7경' },
          ],
        },
      ],
      rest: [{ name: '보광사', contentId: '77', lat: 35.09, lng: 126.5 }],
    },
    origin,
  });
  assert.equal(merged.groups.length, 1);
  assert.equal(merged.groups[0].title, '함평 팔경');
  assert.equal(merged.groups[0].items[0].rankBlurb, '함평 8경');
  assert.equal(merged.groups[0].items[1].distKm, null);
  assert.ok(merged.blocks.some((block) => block.kind === 'heading' && block.title === '함평 팔경'));
});

test('drop non-tourist facilities from nearby sights', () => {
  assert.equal(isNearbyTourAttractionTitle('기린사우나'), false);
  assert.equal(isNearbyTourAttractionTitle('대한노인회 강릉지회'), false);
  assert.equal(isNearbyTourAttractionTitle('강릉종합사회복지관'), false);
  assert.equal(isNearbyTourAttractionTitle('임당생활문화센터'), false);
  assert.equal(isNearbyTourAttractionTitle('경포해변'), true);
  const merged = mergeFestivalNearbySights({
    scenicSpots: [],
    grouped: {
      groups: [],
      rest: [
        { name: '기린사우나', contentId: '11', lat: 35.07, lng: 126.53 },
        { name: '임당생활문화센터', contentId: '12', lat: 35.08, lng: 126.54, cat3: 'A02050600' },
        { name: '이색찜질', contentId: '13', lat: 35.08, lng: 126.55, cat3: 'A02020400' },
        { name: '경포대', contentId: '14', lat: 35.08, lng: 126.56 },
      ],
    },
    origin,
  });
  assert.deepEqual(
    merged.items.map((spot) => spot.name),
    ['경포대'],
  );
});
