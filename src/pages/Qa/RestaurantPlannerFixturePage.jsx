import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlannerTab from '../../components/PlaceCard/tabs/PlannerTab.jsx';
import { featureToSuggestion } from '../Home/lib/mapboxSearchBox.js';

const GANGNEUNG_RESTAURANT = {
  name: '강릉 초당순두부 맛집',
  slug: 'tour-88001',
  kind: 'restaurant',
  badge: '식당',
  exploreRestaurant: true,
  contentTypeId: '39',
  cat1: 'A05',
  lat: 37.789,
  lng: 128.897,
  addr1: '강원특별자치도 강릉시 초당동',
  country: '대한민국',
};

const TOKYO_RAMEN = featureToSuggestion(
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [139.701, 35.659] },
    properties: {
      mapbox_id: 'ichiran-qa',
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

const GANGNEUNG_TOOLKIT = {
  place_id: 'gangneung',
  toolkit_updated_at: '2026-03-01T00:00:00Z',
  essential_guide: JSON.stringify({
    primary_arrival_airports_iata: ['GMP', 'ICN'],
    categories: {
      pre_travel: [{ title: '강릉 여행 체크', advice: '동해안 기차·고속버스' }],
      accommodation: { advice: '경포·시내' },
    },
    journey_timeline: [{ title: '서울 → 강릉', step: 1 }],
  }),
};

const TOKYO_TOOLKIT = {
  place_id: 'tokyo',
  toolkit_updated_at: '2026-03-01T00:00:00Z',
  essential_guide: JSON.stringify({
    primary_arrival_airports_iata: ['NRT', 'HND'],
    categories: {
      pre_travel: [{ title: 'Tokyo entry', advice: 'Visit Japan Web' }],
      transport: { advice: 'Suica / PASMO' },
    },
    journey_timeline: [{ title: 'Airport → Tokyo', step: 1 }],
  }),
};

export default function RestaurantPlannerFixturePage() {
  const [params] = useSearchParams();
  const city = String(params.get('city') || 'gangneung').toLowerCase();
  const after = params.get('after') === '1';

  const location = useMemo(() => {
    if (city === 'tokyo') return TOKYO_RAMEN;
    return GANGNEUNG_RESTAURANT;
  }, [city]);

  const plannerData = after ? (city === 'tokyo' ? TOKYO_TOOLKIT : GANGNEUNG_TOOLKIT) : null;

  return (
    <div className="min-h-screen bg-neutral-900 flex justify-center py-0">
      <div className="w-full max-w-[1280px] h-[min(900px,100vh)] bg-white shadow-xl overflow-hidden">
        <PlannerTab
          location={location}
          plannerData={plannerData}
          isPlannerLoading={false}
          isActive
        />
      </div>
    </div>
  );
}
