import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import {
  getFlightRouteHubIatas,
  getGraphFlightRouteHubIatas,
  hasExplicitDirectFlightRoute,
  hasManualFlightRouteHubOverride,
  resolveCinemaDestIata,
} from '../src/utils/rentalAirportMatch.js';
import {
  buildGreatCircleChain,
  getAirportHubCoords,
  isLongGreatCircleArc,
  resolveFlightRoutePlan,
} from '../src/pages/Home/lib/globeFlightCinema.js';
import {
  isSouthernEuropeDest,
  isWesternNorthernEuropeCorridor,
} from '../src/pages/Home/lib/flightRouteCorridors.js';
import {
  coordsCrossAvoidZones,
  isRussiaDestinationLocation,
} from '../src/pages/Home/lib/flightRouteAvoidZones.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'flight-arcs-audit.json');

const QA_SLUGS = [
  'paris',
  'london',
  'amsterdam',
  'seychelles',
  'iceland',
  'faroe-islands',
  'moscow',
  'uyuni-salt-flat',
];

const originIata = 'ICN';
const origin = getAirportHubCoords(originIata);
if (!origin) {
  console.error('Origin hub missing:', originIata);
  process.exit(1);
}
const originLngLat = [origin.lng, origin.lat];

function auditSpot(spot) {
  const destIata = resolveCinemaDestIata(spot);
  if (!destIata) {
    return { slug: spot.slug, skip: true, reason: 'no-dest-iata' };
  }
  const dest = getAirportHubCoords(destIata);
  if (!dest) {
    return { slug: spot.slug, skip: true, reason: 'no-dest-coords', destIata };
  }
  const destLngLat = [dest.lng, dest.lat];

  const overrideHubIatas = getFlightRouteHubIatas(spot, { originIata, destIata });
  const explicitDirect = hasExplicitDirectFlightRoute(spot);
  const hasOverrideHubs = overrideHubIatas.length > 0 || explicitDirect;
  const isRuDest = isRussiaDestinationLocation(spot, destLngLat, destIata);

  const plan = resolveFlightRoutePlan(originLngLat, destLngLat, spot, {
    originIata,
    destIata,
  });
  const chain = buildGreatCircleChain(plan.anchors, 24);
  const zones = coordsCrossAvoidZones(chain);
  const directLongArc = isLongGreatCircleArc(originLngLat, destLngLat);
  const corridorEligible = isWesternNorthernEuropeCorridor(destLngLat, originIata);
  const isGraphTier = !hasManualFlightRouteHubOverride(spot)
    && !hasExplicitDirectFlightRoute(spot)
    && getGraphFlightRouteHubIatas(spot, { originIata, destIata }) !== null;

  return {
    slug: spot.slug,
    name: spot.name,
    country: spot.country,
    destIata,
    overrideHubIatas,
    hasOverrideHubs,
    isRuDest,
    isGraphTier,
    hubIatas: plan.hubIatas,
    routeSource: plan.routeSource ?? null,
    routeIatas: [originIata, ...plan.hubIatas, destIata],
    corridorEligible,
    directLongArc,
    zonesCrossed: zones,
    anchorCount: plan.anchors.length,
  };
}

function qaPass(row) {
  if (row.slug === 'uyuni-salt-flat') {
    return row.hubIatas.includes('LPB') && !row.directLongArc;
  }
  if (row.isRuDest) {
    return row.hasOverrideHubs && !row.hubIatas.includes('DXB');
  }
  if (row.hasOverrideHubs) {
    return true;
  }
  if (row.isGraphTier && row.corridorEligible) {
    return true;
  }
  if (row.corridorEligible) {
    return row.hubIatas.includes('DXB');
  }
  return true;
}

const rows = [];
const issues = [];
const qa = {};

for (const spot of TRAVEL_SPOTS) {
  const row = auditSpot(spot);
  if (row.skip) continue;
  rows.push(row);

  const dest = getAirportHubCoords(row.destIata);
  const destLngLat = dest ? [dest.lng, dest.lat] : null;

  if (row.directLongArc && destLngLat && destLngLat[0] >= -30) {
    issues.push({ slug: row.slug, kind: 'unexpected-long-arc-direct', destIata: row.destIata });
  }

  if (
    row.corridorEligible
    && !row.hasOverrideHubs
    && !row.isGraphTier
    && !row.hubIatas.includes('DXB')
  ) {
    issues.push({
      slug: row.slug,
      kind: 'europe-missing-dxb',
      hubIatas: row.hubIatas,
    });
  }

  if (QA_SLUGS.includes(spot.slug)) {
    qa[spot.slug] = { ...row, qaPass: qaPass(row) };
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(
  OUTPUT_JSON,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      originIata,
      total: rows.length,
      issueCount: issues.length,
      issues,
      qa,
    },
    null,
    2
  )
);

console.log(`Flight arc audit: ${rows.length} spots, ${issues.length} issues`);
console.log(`Output: ${OUTPUT_JSON}`);

if (issues.length) {
  const preview = issues.slice(0, 15);
  for (const issue of preview) {
    console.log(`  [${issue.kind}] ${issue.slug}`, JSON.stringify(issue));
  }
  if (issues.length > 15) console.log(`  ... and ${issues.length - 15} more`);
}

console.log('\n5-click QA slugs:');
let qaFail = 0;
for (const slug of QA_SLUGS) {
  const row = qa[slug];
  if (!row) {
    console.log(`  ${slug}: SKIP (no arc)`);
    qaFail += 1;
    continue;
  }
  console.log(
    `  ${slug}: ${row.qaPass ? 'PASS' : 'FAIL'} — ${row.routeIatas.join(' → ')}`
    + (row.zonesCrossed.length ? ` zones:${row.zonesCrossed.join(',')}` : '')
  );
  if (!row.qaPass) qaFail += 1;
}

if (issues.length) {
  console.log(`\n${issues.length} non-QA spot(s) with corridor gaps (see JSON).`);
}

process.exit(qaFail > 0 ? 1 : 0);
