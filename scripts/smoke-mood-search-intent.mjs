#!/usr/bin/env node
/**
 * 무드 검색 의도 — 결합 패턴·지오코딩 스킵·약한 POI 필터
 */
import assert from 'node:assert/strict';
import {
  hasMoodCombination,
  isLikelyMoodQuery,
  shouldSkipGeocodeForMood,
  isWeakGeocodeHitForMood,
  buildMooniMoodAskText,
} from '../src/pages/Home/lib/moodSearchIntent.js';

assert.equal(hasMoodCombination('quiet beaches'), true, 'quiet beaches combination');
assert.equal(hasMoodCombination('따뜻한 휴양지'), true, '따뜻한 휴양지 combination');
assert.equal(hasMoodCombination('조용한 바다'), true, '조용한 바다 combination');
assert.equal(hasMoodCombination('아이와 휴양지'), true, '아이와 휴양지 family+noun');
assert.equal(hasMoodCombination('romantic islands'), true, 'romantic islands');
assert.equal(hasMoodCombination('휴양지'), true, '휴양지 standalone generic');

assert.equal(hasMoodCombination('paris'), false, 'paris not combination');
assert.equal(hasMoodCombination('도쿄'), false, '도쿄 not combination');
assert.equal(hasMoodCombination('제주'), false, '제주 not combination');
assert.equal(hasMoodCombination('성산일출봉'), false, '성산일출봉 not combination');
assert.equal(hasMoodCombination('홍천 휴게소'), false, 'facility not combination');

assert.equal(shouldSkipGeocodeForMood('quiet beaches'), true, 'skip quiet beaches');
assert.equal(shouldSkipGeocodeForMood('따뜻한 휴양지'), true, 'skip 따뜻한 휴양지');
assert.equal(shouldSkipGeocodeForMood('조용한 해변'), true, 'skip 조용한 해변 over facility 해변');
assert.equal(shouldSkipGeocodeForMood('힐링'), true, 'skip 힐링 keyword');
assert.equal(shouldSkipGeocodeForMood('설렘'), true, 'skip 설렘 keyword');

assert.equal(shouldSkipGeocodeForMood('paris'), false, 'do not skip paris');
assert.equal(shouldSkipGeocodeForMood('도쿄'), false, 'do not skip 도쿄');
assert.equal(shouldSkipGeocodeForMood('제주'), false, 'do not skip 제주');
assert.equal(shouldSkipGeocodeForMood('홍천 휴게소'), false, 'do not skip facility');
assert.equal(
  shouldSkipGeocodeForMood('빙하를 보고 싶어', { hasThemeHits: true }),
  false,
  'theme sentence keeps geocode path',
);
assert.equal(
  shouldSkipGeocodeForMood('조용한 바다', { hasThemeHits: true }),
  true,
  'mood combination still skips even with theme hits',
);

assert.equal(isLikelyMoodQuery('quiet beaches'), true);
assert.equal(isLikelyMoodQuery('따뜻한 휴양지'), true);
assert.equal(isLikelyMoodQuery('paris'), false);

assert.equal(
  isWeakGeocodeHitForMood('quiet beaches', {
    name: 'Quiet Beach Road',
    place_types: ['address'],
  }),
  true,
  'address type is weak',
);
assert.equal(
  isWeakGeocodeHitForMood('따뜻한 휴양지', {
    name: '따뜻한집',
    place_types: ['poi'],
  }),
  true,
  'poi without place type is weak',
);
assert.equal(
  isWeakGeocodeHitForMood('paris', {
    name: 'Paris',
    place_types: ['place'],
  }),
  false,
  'place name search keeps city hit',
);
assert.equal(
  isWeakGeocodeHitForMood('santorini', {
    name: 'Santorini',
    place_types: ['poi'],
  }),
  false,
  'place-name length must not discard Santorini POI',
);
assert.equal(
  isWeakGeocodeHitForMood('quiet beaches', {
    name: 'Santorini',
    place_types: ['place'],
  }),
  false,
  'mood query may keep real place hits',
);

assert.equal(
  buildMooniMoodAskText('quiet beaches'),
  'quiet beaches 여행지 추천해줘',
);
assert.equal(buildMooniMoodAskText('따뜻한 휴양지'), '따뜻한 휴양지 여행지 추천해줘');

console.log('PASS smoke-mood-search-intent');
