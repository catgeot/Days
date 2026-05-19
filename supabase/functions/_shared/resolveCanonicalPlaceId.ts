import canonicalPlaceIdMap from './canonicalPlaceIdMap.json' with { type: 'json' };

const SLUG_TO_CANONICAL = canonicalPlaceIdMap as Record<string, string>;

/**
 * SSOT 한글 place_id — slug가 있으면 travelSpots·reconcile 규칙 우선.
 */
export function resolveCanonicalPlaceId(params: {
  slug?: string | null;
  placeId?: string | null;
  locationName?: string | null;
  canonicalPlaceId?: string | null;
}): string {
  const slug = String(params.slug ?? '').trim().toLowerCase();
  const fromClient = String(params.canonicalPlaceId ?? '').trim();
  const fallback = String(params.placeId ?? params.locationName ?? '').trim();

  if (slug) {
    const fromMap = SLUG_TO_CANONICAL[slug];
    if (fromMap) return fromMap;
    if (fromClient) return fromClient;
  }

  return fallback || fromClient;
}

export function isKnownTravelSpotSlug(slug?: string | null): boolean {
  const s = String(slug ?? '').trim().toLowerCase();
  return Boolean(s && SLUG_TO_CANONICAL[s]);
}
