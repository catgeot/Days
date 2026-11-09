#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPlacePlannerEligible,
  shouldInvokePlaceToolkitUpdate,
} from '../../src/shared/place/placePlannerEligibility.js';
import { resolvePlannerGuideForDisplay } from '../../src/components/PlaceCard/tabs/planner/plannerGuideDisplay.js';

const GETBOL_RESTAURANT = {
  name: '갯벌의조개 성수역점',
  slug: 'tour-2599001',
  kind: 'restaurant',
  badge: '식당',
  contentTypeId: '39',
  cat1: 'A05',
  lat: 37.544,
  lng: 127.055,
  exploreRestaurant: true,
};

const SEOUL_TOOLKIT_ROW = {
  place_id: 'seoul',
  toolkit_updated_at: '2026-01-01T00:00:00Z',
  essential_guide: JSON.stringify({
    primary_arrival_airports_iata: ['GMP'],
    categories: { pre_travel: [{ title: 'test' }] },
    journey_timeline: [{ title: 'STEP 1' }],
  }),
};

test('음식점 — 플래너 미지원', () => {
  assert.equal(isPlacePlannerEligible(GETBOL_RESTAURANT), false);
  assert.equal(
    resolvePlannerGuideForDisplay(SEOUL_TOOLKIT_ROW, GETBOL_RESTAURANT, 'ko'),
    null,
  );
});

test('상세 진입만 — update-place-toolkit 호출 금지', () => {
  assert.equal(
    shouldInvokePlaceToolkitUpdate({
      location: { slug: 'tokyo', name: '도쿄' },
      userInitiated: false,
    }),
    false,
  );
});

test('버튼 클릭 — 등록 여행지 1회 허용', () => {
  const prevWindow = globalThis.window;
  globalThis.window = { location: { search: '' } };
  try {
    assert.equal(
      shouldInvokePlaceToolkitUpdate({
        location: { slug: 'tokyo', name: '도쿄' },
        userInitiated: true,
      }),
      true,
    );
  } finally {
    globalThis.window = prevWindow;
  }
});

test('버튼 클릭이어도 음식점·crawler=1 은 생성 금지', () => {
  const prev = globalThis.window;
  globalThis.window = {
    location: { search: '?crawler=1' },
  };
  try {
    assert.equal(
      shouldInvokePlaceToolkitUpdate({
        location: GETBOL_RESTAURANT,
        userInitiated: true,
      }),
      false,
    );
  } finally {
    globalThis.window = prev;
  }
});
