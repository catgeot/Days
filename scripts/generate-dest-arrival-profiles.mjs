/**
 * Corpus → destArrivalProfile SSOT (git-tracked).
 * Does NOT bake into travelSpotAirports.json or cinema runtime.
 * Timeline hubs enter profiles only as audit-derived candidates — promote via overrides.
 *
 * npm run generate:dest-arrival-profiles
 * npm run generate:dest-arrival-profiles -- --from-corpus   (default)
 *
 * @see src/pages/Home/lib/flightRouteAssemble.js
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { assembleFlightRouteHubs } from '../src/pages/Home/lib/flightRouteAssemble.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CORPUS_JSON = join(__dirname, 'outputs/flight-route-dest-corpus.json');
const OUT_JSON = join(ROOT, 'src/pages/Home/data/destArrivalProfiles.json');
const OUT_REGION = join(ROOT, 'scripts/data/dest-region-gateways.json');

function loadCorpus() {
  if (!existsSync(CORPUS_JSON)) {
    console.error(
      'Missing corpus. Run: npm run audit:flight-route-dest-corpus\nExpected:',
      CORPUS_JSON
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(CORPUS_JSON, 'utf8'));
}

/**
 * Prefer curated override layers; fall back to toolkit-derived near-dest.
 * Never mark source as live-bake — profiles are generate-time snapshots.
 */
function profileFromRow(row) {
  const finalIata = row.destIata;
  if (!finalIata) return null;

  const hasOverrideHubs = Array.isArray(row.overrideHubs);
  const source = hasOverrideHubs
    ? 'override'
    : row.toolkitHubs?.length
      ? 'toolkit-audit'
      : row.graphHubs != null
        ? 'graph'
        : 'infer';

  const longHaulHubs = Array.isArray(row.longHaulHubs) ? row.longHaulHubs : [];
  const nearDestHubs = Array.isArray(row.nearDestHubs) ? row.nearDestHubs : [];
  const gatewayIata = row.gatewayIata || nearDestHubs[0] || null;

  const assembled = assembleFlightRouteHubs({
    originIata: 'ICN',
    finalIata,
    gatewayIata,
    longHaulHubs,
    nearDestHubs,
  });

  return {
    finalIata,
    gatewayIata: assembled.gatewayIata,
    longHaulHubs: longHaulHubs.filter((h) => h !== assembled.gatewayIata),
    nearDestHubs,
    destRegion: row.destRegion ?? 'unknown',
    hubIatas: assembled.hubIatas,
    path: assembled.path,
    source,
    verdict: row.verdict,
    /** Cinema must not auto-apply toolkit-audit without overrides promote */
    cinemaSafe: source === 'override' || source === 'infer',
  };
}

function main() {
  const corpus = loadCorpus();
  const spots = {};
  let cinemaSafe = 0;
  let toolkitAuditOnly = 0;

  for (const row of corpus.spots ?? []) {
    const profile = profileFromRow(row);
    if (!profile) continue;
    spots[row.slug] = profile;
    if (profile.cinemaSafe) cinemaSafe += 1;
    if (profile.source === 'toolkit-audit') toolkitAuditOnly += 1;
  }

  const regionGateways = corpus.regionGateways ?? {};

  const out = {
    _meta: {
      generatedAt: new Date().toISOString(),
      corpusGeneratedAt: corpus.generatedAt ?? null,
      spotCount: Object.keys(spots).length,
      cinemaSafe,
      toolkitAuditOnly,
      note:
        'destArrivalProfile SSOT. Assemble order: longHaul → gateway → final. ' +
        'cinemaSafe=false (toolkit-audit) requires manual override promote — do not auto-bake to cinema.',
      assembleModule: 'src/pages/Home/lib/flightRouteAssemble.js',
    },
    spots,
  };

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');
  writeFileSync(
    OUT_REGION,
    JSON.stringify(
      {
        generatedAt: out._meta.generatedAt,
        regionGateways,
        gatewayFrequency: corpus.gatewayFrequency ?? [],
        nearDestHubFrequency: corpus.nearDestHubFrequency ?? [],
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('Wrote', OUT_JSON);
  console.log('Wrote', OUT_REGION);
  console.log(
    `profiles: ${out._meta.spotCount} · cinemaSafe: ${cinemaSafe} · toolkit-audit(manual only): ${toolkitAuditOnly}`
  );
}

main();
