/**
 * Detour audit — path hours vs direct great-circle · cross-track outliers.
 *
 * npm run audit:flight-route-detours
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import {
  crossTrackKm,
  flightPathDetourRatio,
} from '../src/pages/Home/lib/flightRouteGeoRules.js';
import {
  getAirportHubCoords,
  resolveFlightRoutePlan,
} from '../src/pages/Home/lib/globeFlightCinema.js';
import {
  hasManualFlightRouteHubOverride,
  resolveCinemaDestIata,
} from '../src/utils/rentalAirportMatch.js';
import { loadAirportMetaMap } from './lib/flight-route-resolver.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'flight-route-detour-report.json');

const DETOUR_RATIO_THRESHOLD = 1.35;
const CROSS_TRACK_KM_THRESHOLD = 800;
const ORIGIN_IATA = 'ICN';

function buildPathFromPlan(plan, destIata) {
  const hubs = plan?.hubIatas ?? [];
  return [ORIGIN_IATA, ...hubs, destIata].filter(Boolean);
}

async function main() {
  const origin = getAirportHubCoords(ORIGIN_IATA);
  if (!origin) {
    console.error('Missing origin coords:', ORIGIN_IATA);
    process.exit(1);
  }

  const airportMeta = await loadAirportMetaMap({ skipDownload: true });

  /** @type {Array<Record<string, unknown>>} */
  const issues = [];
  let checked = 0;
  let manualOverride = 0;

  for (const spot of TRAVEL_SPOTS) {
    const destIata = resolveCinemaDestIata(spot);
    if (!destIata) continue;

    const dest = getAirportHubCoords(destIata);
    if (!dest) continue;

    checked += 1;
    const isManual = hasManualFlightRouteHubOverride(spot);
    if (isManual) manualOverride += 1;

    const plan = resolveFlightRoutePlan(spot, origin, dest, destIata);
    const path = buildPathFromPlan(plan, destIata);
    const detourRatio = flightPathDetourRatio(path);
    const hubCrossTracks = (plan?.hubIatas ?? []).map((hub) => {
      const hubCoords = getAirportHubCoords(hub);
      if (!hubCoords) return { hub, km: null };
      return { hub, km: Math.round(crossTrackKm(origin, dest, hubCoords)) };
    });
    const maxCrossTrack = hubCrossTracks.reduce((m, row) => Math.max(m, row.km ?? 0), 0);

    const flagged =
      detourRatio > DETOUR_RATIO_THRESHOLD || maxCrossTrack > CROSS_TRACK_KM_THRESHOLD;

    if (flagged) {
      issues.push({
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

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      detourRatio: DETOUR_RATIO_THRESHOLD,
      crossTrackKm: CROSS_TRACK_KM_THRESHOLD,
    },
    checked,
    manualOverride,
    issueCount: issues.length,
    issues,
  };

  writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('Flight route detour audit:', {
    checked,
    manualOverride,
    issueCount: issues.length,
    output: OUTPUT_JSON,
  });

  if (issues.length) {
    console.log('\nFirst 15 issues:');
    for (const row of issues.slice(0, 15)) {
      console.log(
        `  ${row.slug}: ratio=${row.detourRatio} xt=${row.maxCrossTrackKm}km hubs=${(row.hubIatas ?? []).join('→')} manual=${row.manualOverride}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
