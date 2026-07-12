/**
 * OpenFlights / heuristic precompute — dest IATA lookup (slug·uiPlace 공통).
 * SSOT 생성: npm run generate:flight-routes (heuristic(+seed) > graph)
 */
import travelSpotFlightRoutes from '../pages/Home/data/travelSpotFlightRoutes.json' with { type: 'json' };

/** @type {Map<string, { hubIatas: string[], source: string, hops: number, path: string[] | null }> | null} */
let byDestIata = null;

function buildDestIndex() {
  if (byDestIata) return byDestIata;
  byDestIata = new Map();
  for (const entry of Object.values(travelSpotFlightRoutes?.spots ?? {})) {
    const dest = String(entry?.destIata ?? '').trim().toUpperCase();
    if (!dest || dest.length !== 3) continue;
    if (entry.source === 'graph-unresolved') continue;

    const candidate = {
      hubIatas: Array.isArray(entry.hubIatas) ? entry.hubIatas : [],
      source: entry.source ?? 'graph',
      hops: Number.isFinite(entry.hops) ? entry.hops : 99,
      path: Array.isArray(entry.path) ? entry.path : null,
    };

    const existing = byDestIata.get(dest);
    if (!existing || candidate.hops < existing.hops) {
      byDestIata.set(dest, candidate);
    }
  }
  return byDestIata;
}

/**
 * @param {string} destIata
 * @param {string} [originIata='ICN']
 * @returns {{ hubIatas: string[], source: string, hops: number, path: string[] | null } | null}
 */
export function lookupGraphRouteByDestIata(destIata, originIata = 'ICN') {
  const dest = String(destIata ?? '').trim().toUpperCase();
  const origin = String(originIata ?? 'ICN').trim().toUpperCase();
  if (dest.length !== 3) return null;

  const row = buildDestIndex().get(dest);
  if (!row) return null;

  // Precompute paths are ICN-centric — non-ICN origins use Edge resolve-flight-route.
  if (origin !== 'ICN') {
    const pathOrigin = row.path?.[0];
    if (pathOrigin && pathOrigin !== origin) return null;
  }

  return row;
}

export function getFlightRouteGraphMeta() {
  return {
    generatedAt: travelSpotFlightRoutes?.generatedAt ?? null,
    source: travelSpotFlightRoutes?.source ?? null,
    destCount: buildDestIndex().size,
    originIata: travelSpotFlightRoutes?.originIata ?? 'ICN',
  };
}
