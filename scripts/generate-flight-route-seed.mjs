/**
 * GATN CSV → gateway outbound seed JSON (lookup SSOT).
 * Build-time only — no BFS, no resolveFlightRoutePlan wiring (S4).
 *
 * npm run generate:flight-route-seed
 * npm run generate:flight-route-seed -- --skip-download
 *
 * @see plans/flight-route-heuristic-ssot-plan.md Phase 3
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  GATEWAY_SEED_ORIGINS,
  buildGatewaySeed,
} from './lib/gat-network.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_JSON = join(ROOT, 'scripts/data/flight-route-gateway-seed.json');

async function main() {
  const skipDownload = process.argv.includes('--skip-download');
  const { gateways, meta } = await buildGatewaySeed({ skipDownload });

  const out = {
    _meta: {
      generatedAt: new Date().toISOString(),
      source: 'wikipediaGATN/global-air-pax-network.csv',
      sourceUrl: meta.sourceUrl,
      licenseNote:
        'GATN code is GPL v3; this file is a filtered IATA lookup extract (CC BY-SA Wikipedia links). Build-time only — do not bundle GATN source.',
      usage: 'lookup-only (seedHasDirectEdge). No BFS. Runtime wiring = S4.',
      originCount: meta.originCount,
      edgeCount: meta.edgeCount,
      origins: [...GATEWAY_SEED_ORIGINS],
      missingOrigins: meta.missingOrigins,
    },
    gateways,
  };

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log('Wrote', OUT_JSON);
  console.log(
    `origins=${meta.originCount} edges=${meta.edgeCount} missing=${meta.missingOrigins.length || 0}`
  );
  if (meta.missingOrigins.length) {
    console.warn('Missing outbound for:', meta.missingOrigins.join(', '));
  }

  // Sanity: ICN→CDG / NRT→PPT / PPT→RAR should exist in current GATN
  const checks = [
    ['ICN', 'CDG'],
    ['ICN', 'DXB'],
    ['NRT', 'PPT'],
    ['PPT', 'RAR'],
    ['DXB', 'ADD'],
  ];
  for (const [from, to] of checks) {
    const ok = gateways[from]?.includes(to);
    console.log(`  seed ${from}→${to}: ${ok ? 'yes' : 'NO'}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
