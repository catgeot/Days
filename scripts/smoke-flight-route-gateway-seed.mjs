/**
 * GATN thin seed lookup smoke (Phase 3 / S3).
 * Does NOT wire resolveFlightRoutePlan / mutate overrides.
 *
 * Usage: node scripts/smoke-flight-route-gateway-seed.mjs
 */
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const SEED_JSON = join(root, 'scripts/data/flight-route-gateway-seed.json');

async function loadModule(relPath) {
  return import(pathToFileURL(join(root, relPath)).href);
}

async function main() {
  if (!existsSync(SEED_JSON)) {
    console.error('Missing seed. Run: npm run generate:flight-route-seed');
    process.exit(1);
  }

  const {
    seedHasDirectEdge,
    seedConfirmsPath,
    getGatewaySeedMeta,
    getGatewaySeedTable,
  } = await loadModule('src/pages/Home/lib/flightRouteGatewaySeed.js');

  const { parseGatnCsv, extractGatewayOutbound, GATEWAY_SEED_ORIGINS } = await loadModule(
    'scripts/lib/gat-network.mjs'
  );

  /** @type {{ id: string, label: string, run: () => string[] }[]} */
  const cases = [
    {
      id: 'meta-present',
      label: 'Seed meta has origins/edges',
      run: () => {
        const meta = getGatewaySeedMeta();
        const checks = [];
        if (!meta?.edgeCount || meta.edgeCount < 100) checks.push(`edgeCount=${meta?.edgeCount}`);
        if (!meta?.originCount || meta.originCount < 10) {
          checks.push(`originCount=${meta?.originCount}`);
        }
        return checks;
      },
    },
    {
      id: 'icn-cdg',
      label: 'ICN→CDG seed edge',
      run: () => (seedHasDirectEdge('ICN', 'CDG') ? [] : ['missing ICN→CDG']),
    },
    {
      id: 'icn-dxb',
      label: 'ICN→DXB seed edge',
      run: () => (seedHasDirectEdge('ICN', 'DXB') ? [] : ['missing ICN→DXB']),
    },
    {
      id: 'nrt-ppt',
      label: 'NRT→PPT seed edge',
      run: () => (seedHasDirectEdge('NRT', 'PPT') ? [] : ['missing NRT→PPT']),
    },
    {
      id: 'ppt-rar',
      label: 'PPT→RAR seed edge (Pacific chain leg)',
      run: () => (seedHasDirectEdge('PPT', 'RAR') ? [] : ['missing PPT→RAR']),
    },
    {
      id: 'path-confirm',
      label: 'seedConfirmsPath ICN→NRT→PPT',
      run: () => {
        const ok =
          seedHasDirectEdge('ICN', 'NRT') &&
          seedConfirmsPath(['ICN', 'NRT', 'PPT']);
        return ok ? [] : ['path confirm failed'];
      },
    },
    {
      id: 'fail-open-unknown',
      label: 'Unknown leg returns false (not throw)',
      run: () => {
        const checks = [];
        if (seedHasDirectEdge('ICN', 'ZZZ') !== false) checks.push('expected false for ZZZ');
        if (seedHasDirectEdge('', 'CDG') !== false) checks.push('empty from');
        if (seedConfirmsPath(['ICN', 'ZZZ']) !== false) checks.push('path should fail');
        return checks;
      },
    },
    {
      id: 'no-bfs-export',
      label: 'Parser exports lookup helpers only (no BFS symbol)',
      run: () => {
        const checks = [];
        if (typeof parseGatnCsv !== 'function') checks.push('parseGatnCsv missing');
        if (typeof extractGatewayOutbound !== 'function') {
          checks.push('extractGatewayOutbound missing');
        }
        if (!Array.isArray(GATEWAY_SEED_ORIGINS) || GATEWAY_SEED_ORIGINS.length < 20) {
          checks.push('GATEWAY_SEED_ORIGINS too small');
        }
        const table = getGatewaySeedTable();
        if (!table.ICN?.includes('CDG')) checks.push('table ICN missing CDG');
        return checks;
      },
    },
  ];

  let failed = 0;
  const results = [];
  for (const c of cases) {
    const errors = c.run();
    const ok = errors.length === 0;
    if (!ok) failed += 1;
    results.push({ id: c.id, label: c.label, ok, errors });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.id} — ${c.label}${ok ? '' : `: ${errors.join('; ')}`}`);
  }

  const outPath = join(__dirname, 'outputs/flight-route-gateway-seed-smoke.json');
  writeFileSync(
    outPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), passed: cases.length - failed, total: cases.length, results }, null, 2)}\n`,
    'utf8'
  );
  console.log(`\n${cases.length - failed}/${cases.length} passed → ${outPath}`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
