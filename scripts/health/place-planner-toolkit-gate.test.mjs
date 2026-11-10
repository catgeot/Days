#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPlacePlannerEligible,
  shouldInvokePlaceToolkitUpdate,
} from '../../src/shared/place/placePlannerEligibility.js';
import {
  buildPlannerToolkitInvokeBody,
  resolveRestaurantPlannerCity,
} from '../../src/shared/place/restaurantPlannerCity.js';
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
  addr1: '서울특별시 성동구 성수동',
  exploreRestaurant: true,
};

const SEOUL_TOOLKIT_ROW = {
  place_id: 'seoul',
  toolkit_updated_at: '2026-01-01T00:00:00Z',
  essential_guide: JSON.stringify({
    primary_arrival_airports_iata: ['GMP', 'ICN'],
    categories: { pre_travel: [{ title: 'test' }] },
    journey_timeline: [{ title: 'STEP 1' }],
  }),
};

test('음식점 — 서울 도시 호스트가 있으면 플래너 지원', () => {
  assert.equal(resolveRestaurantPlannerCity(GETBOL_RESTAURANT)?.spot?.slug, 'seoul');
  assert.equal(isPlacePlannerEligible(GETBOL_RESTAURANT), true);
  assert.ok(resolvePlannerGuideForDisplay(SEOUL_TOOLKIT_ROW, GETBOL_RESTAURANT, 'ko'));
});

test('음식점 — 도시 호스트로 seoul 툴킷 조회 · 레거시 폴백 없음', async () => {
  const { fetchToolkitRow } = await import('../../src/utils/toolkitPlaceIdResolve.js');
  const { getPlannerToolkitLocation } = await import('../../src/shared/place/restaurantPlannerCity.js');
  const host = getPlannerToolkitLocation(GETBOL_RESTAURANT);
  assert.equal(host.slug, 'seoul');
  const supabaseHost = {
    from: () => ({
      select: () => ({
        in: async (_col, candidates) => {
          assert.ok(candidates.includes('seoul'));
          return { data: [SEOUL_TOOLKIT_ROW], error: null };
        },
      }),
    }),
  };
  const hostRow = await fetchToolkitRow(supabaseHost, host, 'ko');
  assert.equal(hostRow?.place_id, 'seoul');

  const supabaseFallback = {
    from: () => ({
      select: () => ({
        in: async () => ({
          data: [{ place_id: 'seoul', essential_guide: '{}' }],
          error: null,
        }),
      }),
    }),
  };
  const wrongPinRow = await fetchToolkitRow(supabaseFallback, GETBOL_RESTAURANT, 'ko');
  assert.equal(wrongPinRow, null);
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

test('버튼 클릭 — 식당은 도시 slug로 Edge 본문', () => {
  const prevWindow = globalThis.window;
  globalThis.window = { location: { search: '' } };
  try {
    const body = buildPlannerToolkitInvokeBody(GETBOL_RESTAURANT, 'ko');
    assert.equal(body.placeId, 'seoul');
    assert.equal(
      shouldInvokePlaceToolkitUpdate({ location: GETBOL_RESTAURANT, userInitiated: true }),
      true,
    );
  } finally {
    globalThis.window = prevWindow;
  }
});

test('버튼 클릭이어도 crawler=1 · 도시 미확정은 생성 금지', () => {
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
    assert.equal(
      shouldInvokePlaceToolkitUpdate({
        location: { kind: 'restaurant', exploreRestaurant: true, name: 'x' },
        userInitiated: true,
      }),
      false,
    );
  } finally {
    globalThis.window = prev;
  }
});
