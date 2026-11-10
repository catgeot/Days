#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import { featureToSuggestion } from '../../src/pages/Home/lib/mapboxSearchBox.js';
import {
  buildPlannerToolkitInvokeBody,
  getPlannerToolkitLocation,
  getRestaurantPlannerCityLabel,
  resolveRestaurantPlannerCity,
} from '../../src/shared/place/restaurantPlannerCity.js';
import {
  isPlacePlannerEligible,
  shouldInvokePlaceToolkitUpdate,
} from '../../src/shared/place/placePlannerEligibility.js';
import { fetchToolkitRow } from '../../src/utils/toolkitPlaceIdResolve.js';
import { hasStoredToolkitRow } from '../../src/components/PlaceCard/tabs/planner/plannerGuideDisplay.js';

const GETBOL_SEOUL = {
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

const JEONJU_REST = {
  name: '전주 맛집',
  slug: 'tour-9001001',
  kind: 'restaurant',
  exploreRestaurant: true,
  contentTypeId: '39',
  lat: 35.8242,
  lng: 127.148,
  addr1: '전라북도 전주시 완산구',
};

const MYEONGDONG_GYOZA = {
  name: '명동교자',
  slug: 'tour-403053',
  kind: 'restaurant',
  badge: '식당',
  exploreRestaurant: true,
  contentTypeId: '39',
  cat1: 'A05',
  lat: 37.563569,
  lng: 126.985032,
  addr1: '서울특별시 중구 명동10길 29',
  parentCity: '중구',
  hubId: 'junggu',
};

const GANGNEUNG_REST = {
  name: '강릉 식당',
  slug: 'tour-3532662',
  kind: 'restaurant',
  exploreRestaurant: true,
  contentTypeId: '39',
  lat: 37.7519,
  lng: 128.876,
  addr1: '강원특별자치도 강릉시',
  parentCity: '강릉',
};

const TOKYO_RAMEN = featureToSuggestion(
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [139.7, 35.66] },
    properties: {
      mapbox_id: 'ichiran-test',
      feature_type: 'poi',
      name: 'Ichiran Ramen',
      place_formatted: 'Shibuya, Tokyo, Japan',
      poi_category_ids: ['restaurant', 'ramen'],
      poi_category: ['restaurant', 'ramen'],
      context: { country: { name: 'Japan' }, place: { name: 'Shibuya' } },
    },
  },
  { source: 'mapbox' },
);

const SEOUL_TOOLKIT_ROW = {
  place_id: 'seoul',
  toolkit_updated_at: '2026-01-01T00:00:00Z',
  essential_guide: JSON.stringify({
    primary_arrival_airports_iata: ['GMP', 'ICN'],
    categories: { pre_travel: [{ title: 'test' }] },
    journey_timeline: [{ title: 'STEP 1' }],
  }),
};

test('도시 판별 — 서울·전주·도쿄', () => {
  const seoul = resolveRestaurantPlannerCity(GETBOL_SEOUL);
  assert.equal(seoul?.spot?.slug, 'seoul');
  const jeonju = resolveRestaurantPlannerCity(JEONJU_REST);
  assert.equal(jeonju?.spot?.slug, 'jeonju');
  const tokyo = resolveRestaurantPlannerCity(TOKYO_RAMEN);
  assert.equal(tokyo?.spot?.slug, 'tokyo');
});

test('표시명 — 해석 도시 허브(서울 중구·강릉·도쿄)', () => {
  const seoulJung = resolveRestaurantPlannerCity(MYEONGDONG_GYOZA);
  assert.equal(seoulJung?.spot?.slug, 'seoul');
  assert.equal(getRestaurantPlannerCityLabel(MYEONGDONG_GYOZA, 'ko'), '서울');
  assert.equal(getRestaurantPlannerCityLabel(MYEONGDONG_GYOZA, 'en'), 'Seoul');

  assert.equal(resolveRestaurantPlannerCity(GANGNEUNG_REST)?.spot?.slug, 'gangneung');
  assert.equal(getRestaurantPlannerCityLabel(GANGNEUNG_REST, 'ko'), '강릉');

  assert.equal(getRestaurantPlannerCityLabel(TOKYO_RAMEN, 'ko'), '도쿄');
  assert.equal(getRestaurantPlannerCityLabel(TOKYO_RAMEN, 'en'), 'Tokyo');
});

test('도시 미확정 — 플래너 미지원', () => {
  const vague = {
    name: '이름만 있는 식당',
    kind: 'restaurant',
    exploreRestaurant: true,
    contentTypeId: '39',
  };
  assert.equal(resolveRestaurantPlannerCity(vague), null);
  assert.equal(isPlacePlannerEligible(vague), false);
});

test('상세 진입만 — update-place-toolkit 호출 금지', () => {
  assert.equal(
    shouldInvokePlaceToolkitUpdate({ location: GETBOL_SEOUL, userInitiated: false }),
    false,
  );
});

test('버튼 클릭 — 도시 place_id 1회', () => {
  const prevWindow = globalThis.window;
  globalThis.window = { location: { search: '' } };
  try {
    assert.equal(
      shouldInvokePlaceToolkitUpdate({ location: GETBOL_SEOUL, userInitiated: true }),
      true,
    );
    const body = buildPlannerToolkitInvokeBody(GETBOL_SEOUL, 'ko');
    assert.equal(body.canonicalPlaceId, 'seoul');
    assert.equal(body.placeId, 'seoul');
  } finally {
    globalThis.window = prevWindow;
  }
});

test('기존 도시 플래너 재활용 — Edge 호출 없음', () => {
  assert.equal(hasStoredToolkitRow(SEOUL_TOOLKIT_ROW, GETBOL_SEOUL, 'ko'), true);
  assert.equal(
    shouldInvokePlaceToolkitUpdate({ location: GETBOL_SEOUL, userInitiated: false }),
    false,
  );
});

test('fetchToolkitRow — 식당에서 레거시 지오 폴백 없음', async () => {
  let inCalls = 0;
  const supabase = {
    from() {
      return {
        select() {
          return {
            async in(_col, candidates) {
              inCalls += 1;
              assert.ok(candidates.includes('tour-2599001'));
              return {
                data: [
                  {
                    place_id: 'seoul',
                    toolkit_updated_at: '2026-01-01T00:00:00Z',
                    essential_guide: '{}',
                  },
                ],
                error: null,
              };
            },
          };
        },
      };
    },
  };
  const row = await fetchToolkitRow(supabase, GETBOL_SEOUL, 'ko');
  assert.equal(row, null);
  assert.equal(inCalls, 1);
  assert.equal(getPlannerToolkitLocation(GETBOL_SEOUL).slug, 'seoul');
});
