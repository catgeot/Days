/**
 * Detour audit — path hours vs direct great-circle · cross-track outliers.
 * Multi-origin: ICN (default) · BDA · MNL.
 *
 * npm run audit:flight-route-detours
 * npm run audit:flight-route-detours -- --origins ICN,BDA,MNL
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import {
  crossTrackKm,
  flightPathDetourRatio,
  MAX_FLIGHT_PATH_DETOUR_RATIO,
} from '../src/pages/Home/lib/flightRouteGeoRules.js';
import {
  getAirportHubCoords,
  resolveFlightRoutePlan,
} from '../src/pages/Home/lib/globeFlightCinema.js';
import {
  hasManualFlightRouteHubOverride,
  resolveCinemaDestIata,
  shouldResolveFlightRouteViaEdge,
} from '../src/utils/rentalAirportMatch.js';
import {
  loadAirportMetaMap,
  loadFlightRouteGraph,
  resolveGraphFlightRoute,
} from './lib/flight-route-resolver.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'flight-route-detour-report.json');

const CROSS_TRACK_KM_THRESHOLD = 800;
const DEFAULT_ORIGINS = ['ICN', 'BDA', 'MNL'];

function parseOriginsArg() {
  const idx = process.argv.indexOf('--origins');
  if (idx === -1 || !process.argv[idx + 1]) return DEFAULT_ORIGINS;
  return process.argv[idx + 1]
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length === 3);
}

function buildPathFromPlan(originIata, plan, destIata) {
  const hubs = plan?.hubIatas ?? [];
  return [originIata, ...hubs, destIata].filter(Boolean);
}

/**
 * ICN — sync resolveFlightRoutePlan · non-ICN — graph resolver (Edge parity).
 */
async function resolveRoutePlanForAudit(spot, originIata, destIata, graphCtx) {
  const origin = getAirportHubCoords(originIata);
  const dest = getAirportHubCoords(destIata);
  if (!origin || !dest) return null;

  if (originIata !== 'ICN' || shouldResolveFlightRouteViaEdge(spot, { originIata, destIata })) {
    const graph = resolveGraphFlightRoute(originIata, destIata, graphCtx.adjacency, {
      airportMeta: graphCtx.airportMeta,
    });
    if (!graph) {
      return { hubIatas: [], routeSource: 'graph-unresolved' };
    }
    return {
      hubIatas: graph.hubIatas,
      routeSource: graph.source,
      path: graph.path,
    };
  }

  return resolveFlightRoutePlan(
    [origin.lng, origin.lat],
    [dest.lng, dest.lat],
    spot,
    { originIata, destIata },
  );
}

async function main() {
  const origins = parseOriginsArg();
  const graphCtx = {
    adjacency: (await loadFlightRouteGraph({ skipDownload: true })).adjacency,
    airportMeta: await loadAirportMetaMap({ skipDownload: true }),
  };

  /** @type {Array<Record<string, unknown>>} */
  const issues = [];
  let checked = 0;
  let manualOverride = 0;

  for (const originIata of origins) {
    const origin = getAirportHubCoords(originIata);
    if (!origin) {
      console.error('Missing origin coords:', originIata);
      process.exit(1);
    }

    for (const spot of TRAVEL_SPOTS) {
      const destIata = resolveCinemaDestIata(spot);
      if (!destIata) continue;

      const dest = getAirportHubCoords(destIata);
      if (!dest) continue;

      checked += 1;
      const isManual = hasManualFlightRouteHubOverride(spot);
      if (isManual) manualOverride += 1;

      const plan = await resolveRoutePlanForAudit(spot, originIata, destIata, graphCtx);
      const path = plan?.path ?? buildPathFromPlan(originIata, plan, destIata);
      const detourRatio = flightPathDetourRatio(path);
      const hubCrossTracks = (plan?.hubIatas ?? []).map((hub) => {
        const hubCoords = getAirportHubCoords(hub);
        if (!hubCoords) return { hub, km: null };
        return { hub, km: Math.round(crossTrackKm(origin, dest, hubCoords)) };
      });
      const maxCrossTrack = hubCrossTracks.reduce((m, row) => Math.max(m, row.km ?? 0), 0);

      const flagged =
        detourRatio > MAX_FLIGHT_PATH_DETOUR_RATIO || maxCrossTrack > CROSS_TRACK_KM_THRESHOLD;

      if (flagged) {
        issues.push({
          originIata,
          slug: spot.slug,
          destIata,
          routeSource: plan?.routeSource,
          hubIatas: plan?.hubIatas ?? [],
          detourRatio: Number(detourRatio.toFixed(2)),
          maxCrossTrackKm: maxCrossTrack,
          manualOverride: isManual,
          hubCrossTracks,
        });
      }
    }
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    origins,
    thresholds: {
      detourRatio: MAX_FLIGHT_PATH_DETOUR_RATIO,
      crossTrackKm: CROSS_TRACK_KM_THRESHOLD,
    },
    checked,
    manualOverride,
    issueCount: issues.length,
    issues,
  };

  writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('Flight route detour audit:', {
    origins,
    checked,
    manualOverride,
    issueCount: issues.length,
    output: OUTPUT_JSON,
  });

  if (issues.length) {
    console.log('\nFirst 15 issues:');
    for (const row of issues.slice(0, 15)) {
      console.log(
        `  ${row.originIata} ${row.slug}: ratio=${row.detourRatio} xt=${row.maxCrossTrackKm}km hubs=${(row.hubIatas ?? []).join('→')} manual=${row.manualOverride}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
