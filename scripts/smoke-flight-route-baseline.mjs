/**
 * 항공 경로 기준선 smoke — sync tier·Edge gate·audit·S4 plan heuristic.
 * Usage: node scripts/smoke-flight-route-baseline.mjs [--edge]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function loadModule(relPath) {
  return import(pathToFileURL(join(root, relPath)).href);
}

function loadTravelSpotBySlug(slug) {
  const json = JSON.parse(
    readFileSync(join(root, 'src/pages/Home/data/travelSpotAirports.json'), 'utf8')
  );
  const row = json.spots?.[slug];
  if (!row) return null;
  return {
    slug,
    name: slug,
    lat: row.lat,
    lng: row.lng,
    type: 'travel-spot',
  };
}

function uiPlaceLocation(name, lat, lng) {
  return {
    id: `label-${lat}-${lng}`,
    name,
    lat,
    lng,
    uiPlace: true,
    type: 'temp-base',
  };
}

async function main() {
  const runEdge = process.argv.includes('--edge');
  const {
    shouldResolveFlightRouteViaEdge,
    getGraphFlightRouteHubIatas,
    getFlightRouteWaypoints,
    hasManualFlightRouteHubOverride,
    resolveCinemaDestIata,
  } = await loadModule('src/utils/rentalAirportMatch.js');
  const {
    canPreviewFlightRoute,
    resolveSummaryFlightCinemaOd,
    resolveFlightRoutePlan,
    getAirportHubCoords,
    buildFlightRouteLineWithLegs,
  } = await loadModule('src/pages/Home/lib/globeFlightCinema.js');
  const { flightPathDetourRatio } = await loadModule('src/pages/Home/lib/flightRouteGeoRules.js');
  const {
    loadFlightRouteGraph,
    loadAirportMetaMap,
    resolveGraphFlightRoute,
  } = await loadModule('scripts/lib/flight-route-resolver.mjs');
  const resolveFlightRouteViaEdge = runEdge
    ? (await loadModule('src/utils/resolveFlightRouteEdge.js')).resolveFlightRouteViaEdge
    : null;

  const graphCtx = {
    adjacency: (await loadFlightRouteGraph({ skipDownload: true })).adjacency,
    airportMeta: await loadAirportMetaMap({ skipDownload: true }),
  };

  const cases = [
    {
      id: 'ssot-curated-bora',
      label: 'SSOT curated — 보라보라',
      location: loadTravelSpotBySlug('bora-bora'),
      originIata: 'ICN',
      expectEdge: false,
      expectPreview: true,
    },
    {
      id: 'ssot-override-hampi',
      label: 'SSOT override — 함피(DEL hub)',
      location: loadTravelSpotBySlug('hampi'),
      originIata: 'ICN',
      expectEdge: false,
      expectPreview: true,
      expectManualOverride: true,
    },
    {
      id: 'uiplace-sync-tahaa',
      label: 'uiPlace sync — Tahaa',
      location: uiPlaceLocation('Tahaa', -16.61, -151.5),
      originIata: 'ICN',
      expectEdge: false,
      expectPreview: true,
    },
    {
      id: 'uiplace-override-manihiki',
      label: 'uiPlace override — Manihiki (placeIds hub, Edge 스킵)',
      location: uiPlaceLocation('Manihiki', -10.38, -161.08),
      originIata: 'ICN',
      expectEdge: false,
      expectPreview: true,
    },
    {
      id: 'uiplace-edge-remote',
      label: 'uiPlace Edge — 원격 좌표(override 없음)',
      location: uiPlaceLocation('Remote Atoll', -12.5, -176.2),
      originIata: 'ICN',
      expectEdge: true,
      expectPreview: true,
    },
    {
      id: 'explicit-direct-saipan',
      label: 'explicit direct — 사이판',
      location: loadTravelSpotBySlug('saipan'),
      originIata: 'ICN',
      expectEdge: false,
      expectPreview: true,
    },
    {
      id: 'non-icn-origin-mnl',
      label: 'non-ICN 출발 — 보라보라 + MNL',
      location: loadTravelSpotBySlug('bora-bora'),
      originIata: 'MNL',
      expectEdge: true,
      expectPreview: true,
    },
    {
      id: 'no-preview-seoul',
      label: 'no-preview — 서울',
      location: { name: '서울', lat: 37.5665, lng: 126.978, type: 'temp-base' },
      originIata: 'ICN',
      expectPreview: false,
    },
    {
      id: 'icn-paris-direct',
      label: 'ICN → paris explicit direct',
      location: loadTravelSpotBySlug('paris'),
      originIata: 'ICN',
      expectEdge: false,
      expectPreview: true,
      expectRouteIatas: ['ICN', 'CDG'],
    },
    {
      id: 'icn-grand-canyon-waypoint',
      label: 'ICN → grand-canyon Pacific waypoint',
      location: loadTravelSpotBySlug('grand-canyon'),
      originIata: 'ICN',
      expectEdge: false,
      expectPreview: true,
      expectHubIatas: ['LAX'],
      expectWaypoints: [[135, 35]],
    },
    {
      id: 'bda-grand-canyon-no-sgf',
      label: 'BDA → grand-canyon graph (SGF 없음)',
      location: loadTravelSpotBySlug('grand-canyon'),
      originIata: 'BDA',
      destIata: 'LAS',
      graphOnly: true,
      expectPreview: true,
      forbiddenHubs: ['SGF'],
      expectHubIatas: ['ATL'],
    },
    {
      id: 'bda-paris-detour',
      label: 'BDA → paris graph detour ≤1.35',
      location: loadTravelSpotBySlug('paris'),
      originIata: 'BDA',
      destIata: 'CDG',
      graphOnly: true,
      expectPreview: true,
      maxDetourRatio: 1.35,
      forbiddenHubs: ['MUC', 'SGF'],
    },
    {
      id: 'bda-paris-arc-via-jfk',
      label: 'BDA → paris arc multi-leg (explicitDirect ICN gate)',
      location: loadTravelSpotBySlug('paris'),
      originIata: 'BDA',
      destIata: 'CDG',
      arcOnly: true,
      expectHubIatas: ['JFK'],
      minArcLegs: 2,
    },
    {
      id: 'mnl-paris-via-hkg',
      label: 'MNL → paris graph (FRA 2hop 없음)',
      location: loadTravelSpotBySlug('paris'),
      originIata: 'MNL',
      destIata: 'CDG',
      graphOnly: true,
      expectPreview: true,
      expectHubIatas: ['HKG'],
      forbiddenHubs: ['FRA'],
      maxDetourRatio: 1.35,
    },
    {
      id: 'plan-heuristic-bda-cdg',
      label: 'S4 plan — BDA→CDG heuristic(+seed) > graph',
      location: loadTravelSpotBySlug('paris'),
      originIata: 'BDA',
      destIata: 'CDG',
      planOnly: true,
      expectHubIatas: ['JFK'],
      expectRouteSources: ['heuristic', 'heuristic-seed'],
    },
  ];

  const results = [];

  for (const testCase of cases) {
    const { location, originIata } = testCase;

    if (testCase.arcOnly) {
      const destIata = testCase.destIata ?? resolveCinemaDestIata(location);
      const origin = getAirportHubCoords(originIata);
      const dest = getAirportHubCoords(destIata);
      const checks = [];
      if (origin && dest) {
        const { legEndIndices } = buildFlightRouteLineWithLegs(
          [origin.lng, origin.lat],
          [dest.lng, dest.lat],
          {
            location,
            originIata,
            destIata,
            hubIatas: testCase.expectHubIatas,
          }
        );
        if (testCase.minArcLegs != null && legEndIndices.length < testCase.minArcLegs) {
          checks.push(`arc legs: expected ≥${testCase.minArcLegs}, got ${legEndIndices.length}`);
        }
      } else {
        checks.push('missing origin/dest coords');
      }
      results.push({
        id: testCase.id,
        label: testCase.label,
        pass: checks.length === 0,
        checks,
        edge: null,
        preview: true,
        destIata,
        routeLabel: [originIata, ...(testCase.expectHubIatas ?? []), destIata].join(' → '),
        graphHubs: testCase.expectHubIatas ?? [],
        manualOverride: false,
        edgeAlternatives: 0,
        edgeHubs: null,
      });
      continue;
    }

    if (testCase.planOnly) {
      const destIata = testCase.destIata ?? resolveCinemaDestIata(location);
      const origin = getAirportHubCoords(originIata);
      const dest = getAirportHubCoords(destIata);
      const checks = [];
      if (!origin || !dest || !destIata) {
        checks.push('missing origin/dest coords');
      } else {
        const plan = resolveFlightRoutePlan(
          [origin.lng, origin.lat],
          [dest.lng, dest.lat],
          location,
          { originIata, destIata },
        );
        if (testCase.expectHubIatas) {
          if (plan.hubIatas.join(',') !== testCase.expectHubIatas.join(',')) {
            checks.push(
              `hubs: expected ${testCase.expectHubIatas.join(',')}, got ${plan.hubIatas.join(',') || '—'}`,
            );
          }
        }
        if (
          testCase.expectRouteSources?.length &&
          !testCase.expectRouteSources.includes(plan.routeSource)
        ) {
          checks.push(
            `routeSource: expected one of ${testCase.expectRouteSources.join('|')}, got ${plan.routeSource}`,
          );
        }
        if (testCase.forbiddenHubs?.some((hub) => plan.hubIatas.includes(hub))) {
          checks.push(
            `forbidden hub present: ${testCase.forbiddenHubs.filter((h) => plan.hubIatas.includes(h)).join(',')}`,
          );
        }
        results.push({
          id: testCase.id,
          label: testCase.label,
          pass: checks.length === 0,
          checks,
          edge: null,
          preview: true,
          destIata,
          routeLabel: [originIata, ...plan.hubIatas, destIata].join(' → '),
          graphHubs: plan.hubIatas,
          manualOverride: false,
          edgeAlternatives: 0,
          edgeHubs: null,
          routeSource: plan.routeSource,
        });
        continue;
      }
      results.push({
        id: testCase.id,
        label: testCase.label,
        pass: false,
        checks,
        edge: null,
        preview: true,
        destIata,
        routeLabel: null,
        graphHubs: [],
        manualOverride: false,
        edgeAlternatives: 0,
        edgeHubs: null,
      });
      continue;
    }

    if (testCase.graphOnly) {
      const destIata = testCase.destIata ?? resolveCinemaDestIata(location);
      const graph = resolveGraphFlightRoute(originIata, destIata, graphCtx.adjacency, {
        airportMeta: graphCtx.airportMeta,
      });
      const hubIatas = graph?.hubIatas ?? [];
      const path = graph?.path ?? [originIata, destIata];
      const detourRatio = flightPathDetourRatio(path);
      const checks = [];

      if (testCase.expectHubIatas) {
        if (hubIatas.join(',') !== testCase.expectHubIatas.join(',')) {
          checks.push(`hubs: expected ${testCase.expectHubIatas.join(',')}, got ${hubIatas.join(',') || '—'}`);
        }
      }
      if (testCase.forbiddenHubs?.some((hub) => hubIatas.includes(hub))) {
        checks.push(`forbidden hub present: ${testCase.forbiddenHubs.filter((h) => hubIatas.includes(h)).join(',')}`);
      }
      if (testCase.maxDetourRatio != null && detourRatio > testCase.maxDetourRatio) {
        checks.push(`detour: ${detourRatio.toFixed(2)} > ${testCase.maxDetourRatio}`);
      }

      results.push({
        id: testCase.id,
        label: testCase.label,
        pass: checks.length === 0,
        checks,
        edge: null,
        preview: true,
        destIata,
        routeLabel: path.join(' → '),
        graphHubs: hubIatas,
        manualOverride: false,
        edgeAlternatives: 0,
        edgeHubs: null,
        detourRatio: Number(detourRatio.toFixed(2)),
      });
      continue;
    }

    const edge = shouldResolveFlightRouteViaEdge(location, { originIata });
    const preview = canPreviewFlightRoute(location, { originIata });
    const summary = preview
      ? resolveSummaryFlightCinemaOd(location, { originIata })
      : null;
    const graphHubs = getGraphFlightRouteHubIatas(location, { originIata });
    const manualOverride = hasManualFlightRouteHubOverride(location);
    const destIata = resolveCinemaDestIata(location);
    const waypoints = getFlightRouteWaypoints(location, { originIata });

    let planWaypoints = null;
    if (testCase.expectWaypoints != null && destIata) {
      const origin = getAirportHubCoords(originIata);
      const dest = getAirportHubCoords(destIata);
      if (origin && dest) {
        planWaypoints = resolveFlightRoutePlan(
          [origin.lng, origin.lat],
          [dest.lng, dest.lat],
          location,
          { originIata, destIata }
        ).geoWaypoints;
      }
    }

    let edgeResult = null;
    let edgeAlternatives = 0;
    if (runEdge && edge && destIata && resolveFlightRouteViaEdge) {
      edgeResult = await resolveFlightRouteViaEdge({
        originIata,
        destIata,
        lat: location?.lat,
        lng: location?.lng,
        topN: 3,
      });
      edgeAlternatives = edgeResult?.alternatives?.length ?? 0;
    }

    const checks = [];
    if (testCase.expectEdge != null && edge !== testCase.expectEdge) {
      checks.push(`edge gate: expected ${testCase.expectEdge}, got ${edge}`);
    }
    if (testCase.expectPreview != null && preview !== testCase.expectPreview) {
      checks.push(`preview: expected ${testCase.expectPreview}, got ${preview}`);
    }
    if (testCase.expectManualOverride && !manualOverride) {
      checks.push('expected manual hub override');
    }
    if (testCase.expectRouteIatas) {
      const actual = summary?.routeIatas ?? [];
      const expected = testCase.expectRouteIatas;
      if (actual.join(' → ') !== expected.join(' → ')) {
        checks.push(`route: expected ${expected.join(' → ')}, got ${actual.join(' → ') || '—'}`);
      }
    }
    if (testCase.expectHubIatas) {
      const actual = summary?.hubIatas ?? [];
      if (actual.join(',') !== testCase.expectHubIatas.join(',')) {
        checks.push(`hubs: expected ${testCase.expectHubIatas.join(',')}, got ${actual.join(',') || '—'}`);
      }
    }
    if (testCase.expectWaypoints) {
      const actual = planWaypoints ?? waypoints;
      const same =
        actual.length === testCase.expectWaypoints.length
        && actual.every(
          (wp, i) =>
            wp[0] === testCase.expectWaypoints[i][0] && wp[1] === testCase.expectWaypoints[i][1]
        );
      if (!same) {
        checks.push(`waypoints: expected ${JSON.stringify(testCase.expectWaypoints)}, got ${JSON.stringify(actual)}`);
      }
    }

    results.push({
      id: testCase.id,
      label: testCase.label,
      pass: checks.length === 0,
      checks,
      edge,
      preview,
      destIata,
      routeLabel: summary?.routeIatas?.join(' → ') ?? null,
      graphHubs,
      manualOverride,
      edgeAlternatives,
      edgeHubs: edgeResult?.hubIatas ?? null,
    });
  }

  const passCount = results.filter((row) => row.pass).length;
  const outPath = join(root, 'scripts/outputs/flight-route-baseline-smoke.json');
  writeFileSync(outPath, `${JSON.stringify({ passCount, total: results.length, results }, null, 2)}\n`);

  console.log(`Flight route baseline smoke: ${passCount}/${results.length} pass`);
  for (const row of results) {
    const status = row.pass ? 'PASS' : 'FAIL';
    console.log(`  ${status} ${row.id} — edge=${row.edge} preview=${row.preview} route=${row.routeLabel ?? '—'}`);
    for (const check of row.checks) console.log(`         ${check}`);
  }
  console.log(`Output: ${outPath}`);

  if (passCount !== results.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
