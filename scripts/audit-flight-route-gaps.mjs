/**
 * Phase 0 — 271 slug routeKind 분류 · uiPlace curated 샘플 · audit baseline embed.
 * @see plans/flight-route-database-plan.md Phase 0
 */
import { execSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';
import { getAirportsIndexMeta } from '../src/utils/airportsIndexLookup.js';
import {
  resolveCinemaDestIata,
  getGraphFlightRouteHubIatas,
} from '../src/utils/rentalAirportMatch.js';
import {
  canPreviewFlightRoute,
  getAirportHubCoords,
  resolveFlightCinemaOd,
  resolveFlightRoutePlan,
} from '../src/pages/Home/lib/globeFlightCinema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'flight-route-gap-report.json');
const AIRPORTS_AUDIT_JSON = join(OUTPUT_DIR, 'rental-airport-audit.json');
const ARCS_AUDIT_JSON = join(OUTPUT_DIR, 'flight-arcs-audit.json');
const STATIC_AIRPORTS_PATH = join(ROOT, 'src/pages/Home/data/travelSpotAirports.json');

const ORIGIN_IATA = 'ICN';

/** Mapbox uiPlace — SSOT slug 없음 · Phase 3 Edge 대상 (placeIds-only 전수 제외) */
const UI_PLACE_SAMPLES = [
  {
    key: 'tahaa',
    label: 'Tahaa (Mapbox uiPlace slug)',
    location: {
      id: 'tahaa',
      slug: 'tahaa',
      name: 'Tahaa',
      name_en: 'Tahaa',
      lat: -16.61,
      lng: -151.45,
      country: '프랑스령 폴리네시아',
      country_en: 'French Polynesia',
      uiPlace: true,
      galleryRegionSpot: { slug: 'bora-bora', name: '보라보라', name_en: 'Bora Bora' },
    },
  },
  {
    key: 'faanui',
    label: "Fa'anui (Bora Bora bay uiPlace)",
    location: {
      id: 'faanui',
      slug: 'faanui',
      name: "Fa'anui",
      name_en: "Fa'anui",
      lat: -16.503,
      lng: -151.738,
      country: '프랑스령 폴리네시아',
      country_en: 'French Polynesia',
      uiPlace: true,
      galleryRegionSpot: { slug: 'bora-bora', name: '보라보라', name_en: 'Bora Bora' },
    },
  },
  {
    key: 'remote-pacific',
    label: 'Remote Pacific (ocean uiPlace)',
    location: {
      id: 'remote-pacific',
      slug: 'remote-pacific',
      name: 'Remote Pacific',
      name_en: 'Remote Pacific',
      lat: -5.0,
      lng: -160.0,
      country: 'Explore',
      country_en: 'Explore',
      uiPlace: true,
    },
  },
  {
    key: 'label-pin',
    label: 'label-* (Mapbox label click)',
    location: {
      id: 'label--16.61--151.45',
      slug: 'tahaa',
      name: 'Tahaa',
      name_en: 'Tahaa',
      lat: -16.61,
      lng: -151.45,
      country: 'Explore',
      country_en: 'Explore',
      uiPlace: true,
      source: 'label',
    },
  },
  {
    key: 'search-pin',
    label: 'search-* (geocode pin)',
    location: {
      id: 'search--5.0--160.0',
      slug: 'search--5.0--160.0',
      name: 'Remote Pacific',
      name_en: 'Remote Pacific',
      lat: -5.0,
      lng: -160.0,
      country: 'Explore',
      country_en: 'Explore',
      uiPlace: true,
      source: 'search',
    },
  },
  {
    key: 'search-dmz',
    label: 'search-* (Korea DMZ sample)',
    location: {
      id: 'search-37.88-127.73',
      slug: 'search-37.88-127.73',
      name: 'DMZ',
      name_en: 'DMZ',
      lat: 37.88,
      lng: 127.73,
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      source: 'search',
    },
  },
  {
    key: 'loc-pin',
    label: 'loc-* (legacy coord URL)',
    location: {
      id: 'loc-37.5665-126.978',
      slug: 'loc-37.5665-126.978',
      name: 'Seoul',
      name_en: 'Seoul',
      lat: 37.5665,
      lng: 126.978,
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      source: 'loc',
    },
  },
];

const staticAirports = JSON.parse(readFileSync(STATIC_AIRPORTS_PATH, 'utf-8'));
const spotAirportRows = staticAirports.spots ?? {};

function runBaselineAudit(scriptName, jsonPath) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  try {
    stdout = execSync(`${npmCmd} run ${scriptName}`, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    exitCode = err.status ?? 1;
    stdout = err.stdout?.toString?.() ?? '';
    stderr = err.stderr?.toString?.() ?? '';
  }

  let payload = null;
  try {
    payload = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  } catch (err) {
    payload = { readError: err.message };
  }

  return { scriptName, exitCode, stdout: stdout.trim(), stderr: stderr.trim(), payload };
}

function getSpotAirportRow(spot) {
  const slug = String(spot?.slug ?? '').toLowerCase();
  return slug ? spotAirportRows[slug] ?? null : null;
}

/**
 * @returns {'hub-override'|'explicit-direct'|'trip-hub-inferred'|'graph-precompute'|'graph-direct'|'corridor-only'|'direct-fallback'|'no-preview'|'no-dest-iata'}
 */
function classifyRouteKind(spot) {
  const destIata = resolveCinemaDestIata(spot);
  if (!destIata) return 'no-dest-iata';

  const destHub = getAirportHubCoords(destIata);
  if (!destHub) return 'no-dest-iata';

  if (!canPreviewFlightRoute(spot, { originIata: ORIGIN_IATA })) {
    return 'no-preview';
  }

  const row = getSpotAirportRow(spot);

  if (Array.isArray(row?.flightRouteHubIatas)) {
    return row.flightRouteHubIatas.length === 0 ? 'explicit-direct' : 'hub-override';
  }

  const trip = String(row?.tripFlightArrivalIata ?? '').trim().toUpperCase();
  if (
    trip.length === 3
    && trip !== destIata
    && trip !== ORIGIN_IATA
    && getAirportHubCoords(trip)
  ) {
    return 'trip-hub-inferred';
  }

  const graphHubs = getGraphFlightRouteHubIatas(spot, { originIata: ORIGIN_IATA, destIata });
  if (graphHubs !== null) {
    return graphHubs.length > 0 ? 'graph-precompute' : 'graph-direct';
  }

  const origin = getAirportHubCoords(ORIGIN_IATA);
  if (!origin) return 'direct-fallback';

  const plan = resolveFlightRoutePlan(
    [origin.lng, origin.lat],
    [destHub.lng, destHub.lat],
    spot,
    { originIata: ORIGIN_IATA, destIata }
  );
  if (plan.hubIatas.length > 0) return 'corridor-only';

  return 'direct-fallback';
}

function auditSlug(spot) {
  const destIata = resolveCinemaDestIata(spot);
  const routeKind = classifyRouteKind(spot);
  const row = getSpotAirportRow(spot);
  const canPreview = canPreviewFlightRoute(spot, { originIata: ORIGIN_IATA });
  const od = canPreview ? resolveFlightCinemaOd(spot, { originIata: ORIGIN_IATA }) : null;

  let hubIatas = [];
  let routeIatas = [];
  if (od) {
    hubIatas = od.hubIatas;
    routeIatas = od.routeIatas;
  } else if (destIata && getAirportHubCoords(destIata)) {
    const dest = getAirportHubCoords(destIata);
    const origin = getAirportHubCoords(ORIGIN_IATA);
    if (origin && dest) {
      const plan = resolveFlightRoutePlan(
        [origin.lng, origin.lat],
        [dest.lng, dest.lat],
        spot,
        { originIata: ORIGIN_IATA, destIata }
      );
      hubIatas = plan.hubIatas;
      routeIatas = [ORIGIN_IATA, ...plan.hubIatas, destIata];
    }
  }

  return {
    slug: spot.slug,
    name: spot.name,
    country: spot.country,
    routeKind,
    destIata: destIata ?? null,
    canPreview,
    hasFlightRouteHubOverride: Array.isArray(row?.flightRouteHubIatas),
    tripFlightArrivalIata: row?.tripFlightArrivalIata ?? null,
    overrideHubIatas: Array.isArray(row?.flightRouteHubIatas) ? row.flightRouteHubIatas : null,
    resolvedHubIatas: hubIatas,
    routeIatas,
    airportSource: row?.source ?? null,
  };
}

function auditUiPlace(sample) {
  const { location } = sample;
  const destIata = resolveCinemaDestIata(location);
  const canPreview = canPreviewFlightRoute(location, { originIata: ORIGIN_IATA });
  const od = canPreview ? resolveFlightCinemaOd(location, { originIata: ORIGIN_IATA }) : null;
  const inSpots = Boolean(spotAirportRows[String(location.slug ?? '').toLowerCase()]);

  return {
    key: sample.key,
    label: sample.label,
    id: location.id,
    slug: location.slug,
    name: location.name,
    lat: location.lat,
    lng: location.lng,
    uiPlace: true,
    inTravelSpotAirports: inSpots,
    destIata: destIata ?? null,
    canPreview,
    routeIatas: od?.routeIatas ?? [],
    hubIatas: od?.hubIatas ?? [],
    gap: canPreview ? null : 'no-flight-preview-without-slug-or-iata',
  };
}

function summarizeAirportsIndexCoverage(slugRows) {
  const rentalSet = new Set(RENTAL_AIRPORT_HUBS.map((h) => h.iata));
  const indexMeta = getAirportsIndexMeta();

  /** @type {Record<string, number>} */
  const destCoordSource = {
    rentalHub: 0,
    airportsIndexOnly: 0,
    both: 0,
    neither: 0,
  };

  const indexOnlyIatas = new Set();
  const missingDestIatas = new Set();

  for (const row of slugRows) {
    const iata = String(row.destIata || '').trim().toUpperCase();
    if (!iata || iata.length !== 3) continue;
    const inRental = rentalSet.has(iata);
    const inIndex = getAirportHubCoords(iata) != null;
    const indexOnly = inIndex && !inRental;

    if (inRental && inIndex) destCoordSource.both += 1;
    else if (inRental) destCoordSource.rentalHub += 1;
    else if (indexOnly) {
      destCoordSource.airportsIndexOnly += 1;
      indexOnlyIatas.add(iata);
    } else {
      destCoordSource.neither += 1;
      missingDestIatas.add(iata);
    }
  }

  const routeIatas = new Set();
  for (const row of slugRows) {
    for (const code of row.routeIatas ?? []) {
      if (code) routeIatas.add(String(code).toUpperCase());
    }
  }

  let routeCoordsFromIndexOnly = 0;
  for (const iata of routeIatas) {
    if (!rentalSet.has(iata) && getAirportHubCoords(iata)) routeCoordsFromIndexOnly += 1;
  }

  return {
    indexMeta,
    rentalHubCount: rentalSet.size,
    destCoordSource,
    indexOnlyDestCount: indexOnlyIatas.size,
    indexOnlyDestIatas: [...indexOnlyIatas].sort(),
    missingDestIatas: [...missingDestIatas].sort(),
    routeIataUnique: routeIatas.size,
    routeCoordsFromIndexOnly,
    indexVsRentalDelta: (indexMeta.count ?? 0) - rentalSet.size,
  };
}

function summarizeByKind(slugs) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const row of slugs) {
    counts[row.routeKind] = (counts[row.routeKind] ?? 0) + 1;
  }
  return counts;
}

function compactAirportsBaseline(payload) {
  if (!payload || payload.readError) return payload;
  return {
    generatedAt: payload.generatedAt,
    hubCount: payload.hubCount,
    spotCount: payload.spotCount,
    summary: payload.summary,
  };
}

function compactArcsBaseline(payload) {
  if (!payload || payload.readError) return payload;
  const qaSummary = {};
  if (payload.qa && typeof payload.qa === 'object') {
    for (const [slug, row] of Object.entries(payload.qa)) {
      qaSummary[slug] = {
        qaPass: row.qaPass,
        routeIatas: row.routeIatas,
        zonesCrossed: row.zonesCrossed ?? [],
      };
    }
  }
  return {
    generatedAt: payload.generatedAt,
    originIata: payload.originIata,
    total: payload.total,
    issueCount: payload.issueCount,
    issues: payload.issues,
    qa: qaSummary,
  };
}

console.log('Running baseline audits (audit:airports, audit:flight-arcs)...');
const airportsBaseline = runBaselineAudit('audit:airports', AIRPORTS_AUDIT_JSON);
const arcsBaseline = runBaselineAudit('audit:flight-arcs', ARCS_AUDIT_JSON);

const slugRows = TRAVEL_SPOTS.map(auditSlug);
const routeKindCounts = summarizeByKind(slugRows);
const airportsIndexCoverage = summarizeAirportsIndexCoverage(slugRows);
const uiPlaceRows = UI_PLACE_SAMPLES.map(auditUiPlace);

const report = {
  generatedAt: new Date().toISOString(),
  phase: 1,
  originIata: ORIGIN_IATA,
  slugCount: TRAVEL_SPOTS.length,
  routeKindCounts,
  airportsIndexCoverage,
  slugs: slugRows,
  uiPlaceSamples: uiPlaceRows,
  gaps: {
    manualHubOverride: routeKindCounts['hub-override'] ?? 0,
    corridorOnly: routeKindCounts['corridor-only'] ?? 0,
    directFallback: routeKindCounts['direct-fallback'] ?? 0,
    explicitDirect: routeKindCounts['explicit-direct'] ?? 0,
    tripHubInferred: routeKindCounts['trip-hub-inferred'] ?? 0,
    noPreview: routeKindCounts['no-preview'] ?? 0,
    noDestIata: routeKindCounts['no-dest-iata'] ?? 0,
    uiPlaceNoPreview: uiPlaceRows.filter((r) => !r.canPreview).length,
    uiPlaceSampleCount: uiPlaceRows.length,
  },
  baseline: {
    airports: {
      run: compactAirportsBaseline(airportsBaseline.payload),
      exitCode: airportsBaseline.exitCode,
    },
    flightArcs: {
      run: compactArcsBaseline(arcsBaseline.payload),
      exitCode: arcsBaseline.exitCode,
    },
  },
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), 'utf-8');

console.log(`\nFlight route gap audit — ${report.slugCount} slugs`);
console.log('routeKind:', JSON.stringify(routeKindCounts));
console.log(
  `uiPlace samples: ${uiPlaceRows.length} (${report.gaps.uiPlaceNoPreview} without flight preview)`
);
console.log(`Output: ${OUTPUT_JSON}`);

console.log('\nBaseline embed:');
console.log(
  `  audit:airports exit=${airportsBaseline.exitCode}`
  + ` hubs=${report.baseline.airports.run?.hubCount ?? '?'}`
  + ` banner-none=${report.baseline.airports.run?.summary?.noBanner ?? '?'}`
);
console.log(
  `  audit:flight-arcs exit=${arcsBaseline.exitCode}`
  + ` issues=${report.baseline.flightArcs.run?.issueCount ?? '?'}`
  + ` qa-fail=${Object.values(report.baseline.flightArcs.run?.qa ?? {}).filter((q) => !q.qaPass).length}`
);

console.log('\nairportsIndex coverage:');
console.log(
  `  index IATA=${airportsIndexCoverage.indexMeta.count ?? '?'}`
  + ` rental hubs=${airportsIndexCoverage.rentalHubCount}`
  + ` delta=${airportsIndexCoverage.indexVsRentalDelta}`
);
console.log('  dest coord source:', JSON.stringify(airportsIndexCoverage.destCoordSource));
console.log(
  `  route IATA unique=${airportsIndexCoverage.routeIataUnique}`
  + ` index-only coords=${airportsIndexCoverage.routeCoordsFromIndexOnly}`
);
if (airportsIndexCoverage.indexOnlyDestCount > 0) {
  console.log(
    `  index-only dest IATA (${airportsIndexCoverage.indexOnlyDestCount}):`,
    airportsIndexCoverage.indexOnlyDestIatas.slice(0, 12).join(', ')
    + (airportsIndexCoverage.indexOnlyDestCount > 12 ? '…' : '')
  );
}

if (report.gaps.uiPlaceNoPreview > 0) {
  console.log('\nuiPlace gaps (no canPreviewFlightRoute):');
  for (const row of uiPlaceRows.filter((r) => !r.canPreview)) {
    console.log(`  ${row.key}: ${row.label}`);
  }
}

const directFallbackPreview = slugRows
  .filter((r) => r.routeKind === 'direct-fallback')
  .slice(0, 8)
  .map((r) => r.slug);
if (directFallbackPreview.length) {
  console.log('\nSample direct-fallback slugs:', directFallbackPreview.join(', '));
}

process.exit(0);
