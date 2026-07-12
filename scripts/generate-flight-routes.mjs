/**
 * Heuristic(+GATN seed) → OpenFlights graph fallback → slug precompute.
 *
 * Priority (Phase 4): heuristic(+seed fail-open) > graph
 * Runtime cinema: override > heuristic(+seed) > graph > corridor
 *
 * npm run generate:flight-routes
 * npm run generate:flight-routes -- --from-supabase
 * npm run generate:flight-routes -- --dry-run
 * npm run generate:flight-routes -- --graph-only
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { resolveCinemaDestIata } from '../src/utils/rentalAirportMatch.js';
import { TRAVEL_SPOT_AIRPORT_OVERRIDES } from './data/travel-spot-airport-overrides.mjs';
import {
  DEFAULT_ORIGIN_IATA,
  loadAirportMetaMap,
  loadFlightRouteGraph,
  resolveFlightRouteFromGraph,
  resolveFlightRoutePreferHeuristic,
} from './lib/flight-route-resolver.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_PATH = join(ROOT, 'src/pages/Home/data/travelSpotFlightRoutes.json');

const dryRun = process.argv.includes('--dry-run');
const fromSupabase = process.argv.includes('--from-supabase');
const skipDownload = process.argv.includes('--skip-download');
const graphOnly = process.argv.includes('--graph-only');

function hasManualFlightRouteOverride(slug) {
  const override = TRAVEL_SPOT_AIRPORT_OVERRIDES[slug];
  if (!override) return false;
  if (Array.isArray(override.flightRouteHubIatas)) return true;
  const trip = String(override.tripFlightArrivalIata ?? '').trim().toUpperCase();
  const preferred = String(override.preferredLinkIata ?? override.primaryIatas?.[0] ?? '')
    .trim()
    .toUpperCase();
  return trip.length === 3 && preferred.length === 3 && trip !== preferred;
}

function isHeuristicSource(source) {
  return source === 'heuristic' || source === 'heuristic-seed';
}

async function main() {
  console.log('Loading OpenFlights route graph...');
  const [{ adjacency, routeLegCount }, airportMeta] = await Promise.all([
    loadFlightRouteGraph({ fromSupabase, skipDownload }),
    loadAirportMetaMap({ skipDownload: true }),
  ]);
  console.log(
    `Graph: ${routeLegCount} legs · ${adjacency.size} origin nodes · airport meta ${airportMeta.size}` +
      (graphOnly ? ' · graph-only' : ' · heuristic-first'),
  );

  /** @type {Record<string, unknown>} */
  const spots = {};
  const stats = {
    total: 0,
    resolved: 0,
    heuristic: 0,
    heuristicSeed: 0,
    direct: 0,
    oneHop: 0,
    twoHop: 0,
    unresolved: 0,
    noDestIata: 0,
    manualOverrideSkipped: 0,
  };

  for (const spot of TRAVEL_SPOTS) {
    const slug = spot.slug;
    stats.total += 1;

    if (hasManualFlightRouteOverride(slug)) {
      stats.manualOverrideSkipped += 1;
      continue;
    }

    const destIata = resolveCinemaDestIata(spot);
    if (!destIata) {
      stats.noDestIata += 1;
      continue;
    }

    const resolved = graphOnly
      ? resolveFlightRouteFromGraph(destIata, adjacency, {
          originIata: DEFAULT_ORIGIN_IATA,
          airportMeta,
        })
      : resolveFlightRoutePreferHeuristic({
          originIata: DEFAULT_ORIGIN_IATA,
          destIata,
          slug,
          airportMeta,
          adjacency,
        });

    if (!resolved) {
      stats.unresolved += 1;
      spots[slug] = {
        destIata,
        hubIatas: null,
        hops: null,
        source: 'graph-unresolved',
        path: null,
      };
      continue;
    }

    stats.resolved += 1;
    if (resolved.source === 'heuristic-seed') stats.heuristicSeed += 1;
    else if (isHeuristicSource(resolved.source)) stats.heuristic += 1;
    else if (resolved.source === 'graph-direct') stats.direct += 1;
    else if (resolved.source === 'graph-1hop') stats.oneHop += 1;
    else if (resolved.source === 'graph-2hop') stats.twoHop += 1;

    spots[slug] = {
      destIata,
      hubIatas: resolved.hubIatas,
      hops: resolved.hops,
      source: resolved.source,
      path: resolved.path,
      ...(resolved.rationale?.macroId
        ? { macroId: resolved.rationale.macroId, seedConfirmed: resolved.rationale.seedConfirmed === true }
        : {}),
    };
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: fromSupabase ? 'supabase-air_routes' : 'openflights-cache+heuristic',
    originIata: DEFAULT_ORIGIN_IATA,
    routeLegCount,
    graphNodeCount: adjacency.size,
    spotCount: Object.keys(spots).length,
    stats,
    spots,
    note:
      'Phase 4 precompute — heuristic(+GATN seed fail-open) > graph. Runtime: override > heuristic > graph > corridor. BFS는 graph fallback만.',
  };

  console.log('Stats:', stats);

  if (dryRun) {
    console.log('[dry-run] Skipping write');
    process.exit(0);
  }

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Written: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
