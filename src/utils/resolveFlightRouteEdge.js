/**
 * Edge resolve-flight-route — uiPlace·비-precompute dest IATA graph 조회.
 * 동기 arc는 travelSpotFlightRoutes byDestIata · graphFlightRouteHubIatas 우선.
 */
import { supabase } from '../shared/api/supabase';
import { lookupGraphRouteByDestIata } from './flightRouteGraphLookup.js';
import {
  resolveCinemaDestIata,
  shouldResolveFlightRouteViaEdge,
} from './rentalAirportMatch.js';
import { normalizeFlightRouteAlternatives } from '../pages/Home/lib/flightCinemaRouteAlternatives.js';

/** @type {Map<string, { hubIatas: string[] | null, source: string, path: string[] | null, resolvedDestIata: string, fetchedAt: number }>} */
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function cacheKey(originIata, destIata, lat, lng, topN = 1) {
  if (destIata) return `${originIata}|${destIata}|n${topN}`;
  return `${originIata}|${lat?.toFixed(3)},${lng?.toFixed(3)}|n${topN}`;
}

/**
 * @param {{ originIata?: string, destIata?: string, lat?: number, lng?: number, maxNearestKm?: number, topN?: number }} params
 * @returns {Promise<{ destIata: string, hubIatas: string[] | null, source: string, path: string[] | null, nearestAirport?: object, alternatives?: Array<{ hubIatas: string[], source: string, path: string[] | null }> } | null>}
 */
export async function resolveFlightRouteViaEdge(params = {}) {
  const originIata = String(params.originIata ?? 'ICN').trim().toUpperCase();
  const destIata = params.destIata ? String(params.destIata).trim().toUpperCase() : '';
  const lat = params.lat != null ? Number(params.lat) : NaN;
  const lng = params.lng != null ? Number(params.lng) : NaN;
  const topN = params.topN != null ? Math.max(1, Math.min(5, Number(params.topN))) : 1;

  if (destIata.length !== 3 && !(Number.isFinite(lat) && Number.isFinite(lng))) return null;

  const key = cacheKey(originIata, destIata || null, lat, lng, topN);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
    return {
      destIata: destIata || hit.resolvedDestIata,
      hubIatas: hit.hubIatas,
      source: hit.source,
      path: hit.path ?? null,
      alternatives: hit.alternatives ?? [],
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('resolve-flight-route', {
      body: {
        originIata,
        ...(destIata.length === 3 ? { destIata } : {}),
        ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
        maxNearestKm: params.maxNearestKm ?? 650,
        topN,
      },
    });

    if (error || !data?.ok) return null;

    const result = {
      destIata: data.destIata,
      hubIatas: Array.isArray(data.hubIatas) ? data.hubIatas : (data.source === 'graph-direct' ? [] : null),
      source: data.source ?? 'graph-unresolved',
      path: data.path ?? null,
      nearestAirport: data.nearestAirport ?? undefined,
      alternatives: Array.isArray(data.alternatives)
        ? data.alternatives.map((row) => ({
            hubIatas: Array.isArray(row?.hubIatas) ? row.hubIatas : [],
            source: row?.source ?? data.source ?? 'graph',
            path: Array.isArray(row?.path) ? row.path : null,
          }))
        : [],
    };

    cache.set(key, { ...result, resolvedDestIata: result.destIata, fetchedAt: Date.now() });
    cache.set(cacheKey(originIata, result.destIata, null, null, topN), {
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

/**
 * 시네마 hub chain — Edge 우선 · 실패 시 JSON byDestIata 폴백.
 * shouldResolveFlightRouteViaEdge가 false면 null(동기 resolveFlightRoutePlan 사용).
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ originIata?: string, destIata?: string, essentialGuide?: Record<string, unknown> | null, ignoreStaticAirportMap?: boolean }} [options]
 * @returns {Promise<{ hubIatas: string[], destIata: string, routeSource: string } | null>}
 */
export async function resolveFlightRouteHubsForCinema(location, options = {}) {
  const originIata = String(options.originIata ?? 'ICN').trim().toUpperCase();
  const destIata = String(
    options.destIata ?? resolveCinemaDestIata(location, options) ?? ''
  )
    .trim()
    .toUpperCase();

  if (
    !shouldResolveFlightRouteViaEdge(location, {
      ...options,
      originIata,
      destIata,
    })
  ) {
    return null;
  }

  const lat = typeof location?.lat === 'number' ? location.lat : Number(location?.lat);
  const lng = typeof location?.lng === 'number' ? location.lng : Number(location?.lng);

  const edge = await resolveFlightRouteViaEdge({
    originIata,
    ...(destIata.length === 3 ? { destIata } : {}),
    ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
  });

  const resolvedDest = String(edge?.destIata ?? destIata).trim().toUpperCase();

  if (edge?.hubIatas != null && resolvedDest.length === 3) {
    return {
      hubIatas: edge.hubIatas,
      destIata: resolvedDest,
      routeSource: edge.source ?? 'graph',
    };
  }

  if (resolvedDest.length === 3) {
    const graph = lookupGraphRouteByDestIata(resolvedDest, originIata);
    if (graph) {
      return {
        hubIatas: graph.hubIatas,
        destIata: resolvedDest,
        routeSource: graph.source ?? 'graph',
      };
    }
  }

  if (resolvedDest.length === 3) {
    return { hubIatas: [], destIata: resolvedDest, routeSource: 'direct-fallback' };
  }

  return null;
}

/**
 * 경유 hub top-N — Edge graph 후보 (수동 override arc는 UI에서 숨김).
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ originIata?: string, destIata?: string, essentialGuide?: Record<string, unknown> | null, topN?: number }} [options]
 * @returns {Promise<import('../pages/Home/lib/flightCinemaRouteAlternatives.js').buildFlightRouteAlternativeOption extends (...args: infer _) => infer R ? R[] : never>}
 */
export async function resolveFlightRouteAlternativesForCinema(location, options = {}) {
  const originIata = String(options.originIata ?? 'ICN').trim().toUpperCase();
  const destIata = String(
    options.destIata ?? resolveCinemaDestIata(location, options) ?? ''
  )
    .trim()
    .toUpperCase();
  const topN = options.topN ?? 3;

  if (destIata.length !== 3) return [];

  const lat = typeof location?.lat === 'number' ? location.lat : Number(location?.lat);
  const lng = typeof location?.lng === 'number' ? location.lng : Number(location?.lng);

  const edge = await resolveFlightRouteViaEdge({
    originIata,
    destIata,
    ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
    topN,
  });

  const resolvedDest = String(edge?.destIata ?? destIata).trim().toUpperCase();
  if (!edge?.alternatives?.length) {
    if (edge?.hubIatas != null) {
      return normalizeFlightRouteAlternatives(originIata, resolvedDest, [
        { hubIatas: edge.hubIatas, source: edge.source, path: edge.path },
      ]);
    }
    return [];
  }

  return normalizeFlightRouteAlternatives(originIata, resolvedDest, edge.alternatives, topN);
}
