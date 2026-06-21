/**
 * Edge resolve-flight-route — uiPlace·비-precompute dest IATA graph 조회.
 * 동기 arc는 travelSpotFlightRoutes byDestIata · graphFlightRouteHubIatas 우선.
 */
import { supabase } from '../shared/api/supabase';

/** @type {Map<string, { hubIatas: string[] | null, source: string, path: string[] | null, resolvedDestIata: string, fetchedAt: number }>} */
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function cacheKey(originIata, destIata, lat, lng) {
  if (destIata) return `${originIata}|${destIata}`;
  return `${originIata}|${lat?.toFixed(3)},${lng?.toFixed(3)}`;
}

/**
 * @param {{ originIata?: string, destIata?: string, lat?: number, lng?: number, maxNearestKm?: number }} params
 * @returns {Promise<{ destIata: string, hubIatas: string[] | null, source: string, path: string[] | null, nearestAirport?: object } | null>}
 */
export async function resolveFlightRouteViaEdge(params = {}) {
  const originIata = String(params.originIata ?? 'ICN').trim().toUpperCase();
  const destIata = params.destIata ? String(params.destIata).trim().toUpperCase() : '';
  const lat = params.lat != null ? Number(params.lat) : NaN;
  const lng = params.lng != null ? Number(params.lng) : NaN;

  if (destIata.length !== 3 && !(Number.isFinite(lat) && Number.isFinite(lng))) return null;

  const key = cacheKey(originIata, destIata || null, lat, lng);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
    return {
      destIata: destIata || hit.resolvedDestIata,
      hubIatas: hit.hubIatas,
      source: hit.source,
      path: hit.path ?? null,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('resolve-flight-route', {
      body: {
        originIata,
        ...(destIata.length === 3 ? { destIata } : {}),
        ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
        maxNearestKm: params.maxNearestKm ?? 650,
      },
    });

    if (error || !data?.ok) return null;

    const result = {
      destIata: data.destIata,
      hubIatas: Array.isArray(data.hubIatas) ? data.hubIatas : (data.source === 'graph-direct' ? [] : null),
      source: data.source ?? 'graph-unresolved',
      path: data.path ?? null,
      nearestAirport: data.nearestAirport ?? undefined,
    };

    cache.set(key, { ...result, resolvedDestIata: result.destIata, fetchedAt: Date.now() });
    cache.set(cacheKey(originIata, result.destIata, null, null), {
      ...result,
      resolvedDestIata: result.destIata,
      fetchedAt: Date.now(),
    });
    return result;
  } catch {
    return null;
  }
}

export function clearFlightRouteEdgeCache() {
  cache.clear();
}
