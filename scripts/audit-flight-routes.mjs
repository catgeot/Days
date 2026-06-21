/**
 * Phase 2 — OpenFlights graph precompute vs corridor/override semantic audit.
 *
 * npm run audit:flight-routes
 */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import {
  getFlightRouteHubIatas,
  hasExplicitDirectFlightRoute,
  resolveCinemaDestIata,
} from '../src/utils/rentalAirportMatch.js';
import {
  getAirportHubCoords,
  resolveFlightRoutePlan,
} from '../src/pages/Home/lib/globeFlightCinema.js';
import { DEFAULT_ORIGIN_IATA } from './lib/flight-route-resolver.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'flight-routes-audit.json');
const ROUTES_JSON = join(ROOT, 'src/pages/Home/data/travelSpotFlightRoutes.json');
const AIRPORTS_JSON = join(ROOT, 'src/pages/Home/data/travelSpotAirports.json');

const ORIGIN_IATA = DEFAULT_ORIGIN_IATA;

function loadJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function runGapReport() {
  try {
    execSync('npm run audit:flight-route-gaps', { cwd: ROOT, stdio: 'pipe' });
    return loadJson(join(OUTPUT_DIR, 'flight-route-gap-report.json'));
  } catch {
    return null;
  }
}

function classifyRuntimeKind(spot, row) {
  if (Array.isArray(row?.flightRouteHubIatas)) {
    return row.flightRouteHubIatas.length === 0 ? 'explicit-direct' : 'hub-override';
  }
  const overrideHubs = getFlightRouteHubIatas(spot, {
    originIata: ORIGIN_IATA,
    destIata: resolveCinemaDestIata(spot),
  });
  if (overrideHubs.length > 0) return 'hub-override';
  if (hasExplicitDirectFlightRoute(spot)) return 'explicit-direct';

  const destIata = resolveCinemaDestIata(spot);
  const dest = destIata ? getAirportHubCoords(destIata) : null;
  const origin = getAirportHubCoords(ORIGIN_IATA);
  if (!dest || !origin) return 'no-coords';

  const plan = resolveFlightRoutePlan(
    [origin.lng, origin.lat],
    [dest.lng, dest.lat],
    spot,
    { originIata: ORIGIN_IATA, destIata }
  );
  return plan.hubIatas.length > 0 ? 'corridor-only' : 'direct-fallback';
}

function hubSetsEqual(a, b) {
  const aa = (a ?? []).slice().sort().join(',');
  const bb = (b ?? []).slice().sort().join(',');
  return aa === bb;
}

function auditSlug(spot, graphRow, airportRow) {
  const destIata = resolveCinemaDestIata(spot);
  const runtimeKind = classifyRuntimeKind(spot, airportRow);
  const runtimeHubs = getFlightRouteHubIatas(spot, { originIata: ORIGIN_IATA, destIata });
  const explicitDirect = hasExplicitDirectFlightRoute(spot);

  const graphHubs = graphRow?.hubIatas ?? null;
  const graphSource = graphRow?.source ?? 'missing';
  const graphResolved = graphSource !== 'graph-unresolved' && graphSource !== 'missing';

  let semantic = 'ok';
  const notes = [];

  if (graphResolved && runtimeKind === 'corridor-only' && !hubSetsEqual(graphHubs, runtimeHubs)) {
    semantic = 'graph-vs-corridor';
    notes.push(`corridor=${runtimeHubs.join('→') || '∅'} graph=${(graphHubs ?? []).join('→') || '∅'}`);
  }

  if (!graphResolved && runtimeKind === 'corridor-only' && runtimeHubs.length > 0) {
    semantic = 'corridor-no-graph';
    notes.push('OpenFlights graph에 ICN 경로 없음 · corridor 폴백');
  }

  if (graphResolved && explicitDirect) {
    semantic = 'override-direct-vs-graph';
    notes.push(`override 직항 vs graph ${graphRow?.path?.join('→') ?? ''}`);
  }

  if (graphResolved && runtimeKind === 'hub-override' && !hubSetsEqual(graphHubs, runtimeHubs)) {
    semantic = 'override-vs-graph';
    notes.push(`override=${runtimeHubs.join('→')} graph=${(graphHubs ?? []).join('→')}`);
  }

  return {
    slug: spot.slug,
    destIata,
    runtimeKind,
    runtimeHubIatas: runtimeHubs,
    graphSource,
    graphHubIatas: graphHubs,
    graphPath: graphRow?.path ?? null,
    semantic,
    notes,
  };
}

function main() {
  if (!existsSync(ROUTES_JSON)) {
    console.error('Missing travelSpotFlightRoutes.json — run: npm run generate:flight-routes');
    process.exit(1);
  }

  const routesDoc = loadJson(ROUTES_JSON);
  const airportsDoc = loadJson(AIRPORTS_JSON, { spots: {} });
  const graphSpots = routesDoc?.spots ?? {};
  const airportSpots = airportsDoc?.spots ?? {};

  const rows = TRAVEL_SPOTS.map((spot) =>
    auditSlug(spot, graphSpots[spot.slug], airportSpots[spot.slug])
  );

  const summary = {
    total: rows.length,
    graphResolved: rows.filter((r) => r.graphSource !== 'graph-unresolved' && r.graphSource !== 'missing').length,
    graphUnresolved: rows.filter((r) => r.graphSource === 'graph-unresolved').length,
    semanticOk: rows.filter((r) => r.semantic === 'ok').length,
    graphVsCorridor: rows.filter((r) => r.semantic === 'graph-vs-corridor').length,
    corridorNoGraph: rows.filter((r) => r.semantic === 'corridor-no-graph').length,
    overrideVsGraph: rows.filter((r) => r.semantic === 'override-vs-graph').length,
    overrideDirectVsGraph: rows.filter((r) => r.semantic === 'override-direct-vs-graph').length,
    precomputeStats: routesDoc?.stats ?? null,
  };

  const issues = rows.filter((r) => r.semantic !== 'ok');

  const report = {
    generatedAt: new Date().toISOString(),
    phase: 2,
    originIata: ORIGIN_IATA,
    routesSource: routesDoc?.source ?? null,
    summary,
    issues,
    samples: {
      graphVsCorridor: issues.filter((r) => r.semantic === 'graph-vs-corridor').slice(0, 15),
      corridorNoGraph: issues.filter((r) => r.semantic === 'corridor-no-graph').slice(0, 15),
      overrideVsGraph: issues.filter((r) => r.semantic === 'override-vs-graph').slice(0, 10),
    },
    gapReport: runGapReport()?.summary ?? null,
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('Flight routes audit summary:', summary);
  console.log(`Written: ${OUTPUT_JSON}`);

  if (summary.graphUnresolved > summary.total * 0.5) {
    console.warn(`Warning: graph unresolved ${summary.graphUnresolved}/${summary.total} — OpenFlights 2014 snapshot 한계`);
  }

  process.exit(0);
}

main();
