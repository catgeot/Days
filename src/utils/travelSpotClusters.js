import { TRAVEL_SPOTS } from '../pages/Home/data/travelSpots.js';
import clusterData from '../pages/Home/data/travelSpotClusters.json' with { type: 'json' };
import { resolveRentalPickupBannerInfo } from './rentalAirportMatch.js';

const CLUSTERS = Object.fromEntries(
  Object.entries(clusterData).filter(([key]) => !key.startsWith('_'))
);

const slugToClusterId = new Map();
for (const [clusterId, cluster] of Object.entries(CLUSTERS)) {
  for (const slug of cluster.slugs ?? []) {
    if (!slugToClusterId.has(slug)) slugToClusterId.set(slug, clusterId);
  }
}

const spotBySlug = new Map(TRAVEL_SPOTS.map((s) => [s.slug, s]));

/**
 * @param {string | null | undefined} slug
 * @returns {string | null}
 */
export function getClusterIdForSlug(slug) {
  if (!slug) return null;
  return slugToClusterId.get(String(slug).trim().toLowerCase()) ?? null;
}

/**
 * @param {string | null | undefined} slug
 * @returns {{ clusterId: string, labelKo: string, labelEn: string, notes?: string } | null}
 */
export function getClusterForSlug(slug) {
  const clusterId = getClusterIdForSlug(slug);
  if (!clusterId) return null;
  const cluster = CLUSTERS[clusterId];
  if (!cluster) return null;
  return {
    clusterId,
    labelKo: cluster.labelKo,
    labelEn: cluster.labelEn,
    notes: cluster.notes,
  };
}

/**
 * @param {string | null | undefined} slug
 * @returns {string}
 */
export function formatGatewayIataForSlug(slug) {
  const spot = spotBySlug.get(slug);
  if (!spot) return '';
  const info = resolveRentalPickupBannerInfo(
    { slug: spot.slug, name: spot.name, lat: spot.lat, lng: spot.lng },
    {}
  );
  if (!info) return '';
  if (info.kind === 'single' && info.iata) return info.iata;
  if (info.kind === 'multi' && info.airports?.length) {
    return info.airports.map((a) => a.iata).filter(Boolean).join('·');
  }
  return '';
}

/**
 * 현재 slug를 제외한 클러스터 내 공식 여행지 목록
 * @param {string | null | undefined} currentSlug
 * @returns {Array<{ slug: string, name: string, name_en: string, gatewayIata: string }>}
 */
export function getRelatedTravelSpots(currentSlug) {
  const clusterId = getClusterIdForSlug(currentSlug);
  if (!clusterId) return [];
  const cluster = CLUSTERS[clusterId];
  const normalized = String(currentSlug ?? '').trim().toLowerCase();

  return (cluster.slugs ?? [])
    .filter((slug) => slug && slug !== normalized)
    .map((slug) => {
      const spot = spotBySlug.get(slug);
      if (!spot) return null;
      return {
        slug: spot.slug,
        name: spot.name,
        name_en: spot.name_en ?? '',
        gatewayIata: formatGatewayIataForSlug(slug),
      };
    })
    .filter(Boolean);
}
