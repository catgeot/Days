/**
 * Heuristic Router + macro unit smoke (Phase 1 / S1).
 * Does NOT mutate overrides / travelSpotAirports / cinema runtime.
 *
 * Usage: node scripts/smoke-flight-route-heuristic.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function loadModule(relPath) {
  return import(pathToFileURL(join(root, relPath)).href);
}

function includesAll(haystack, needles) {
  const set = new Set(haystack);
  return needles.every((n) => set.has(n));
}

function noneOf(haystack, forbidden) {
  const set = new Set(haystack);
  return forbidden.every((n) => !set.has(n));
}

async function main() {
  const { resolveHeuristicFlightRoute, cinemaSafeProfileCandidates } = await loadModule(
    'src/pages/Home/lib/flightRouteHeuristic.js',
  );
  const { resolveMacroTemplate } = await loadModule(
    'src/pages/Home/lib/flightRouteMacroTemplates.js',
  );
  const { assembleFlightRouteHubs } = await loadModule(
    'src/pages/Home/lib/flightRouteAssemble.js',
  );
  const { getDestArrivalProfile } = await loadModule(
    'src/pages/Home/lib/destArrivalProfiles.js',
  );
  const { flightPathDetourRatio } = await loadModule(
    'src/pages/Home/lib/flightRouteGeoRules.js',
  );
  const { resolveHeuristicFlightRouteForAudit } = await loadModule(
    'scripts/lib/flight-route-heuristic.mjs',
  );

  /** @type {{ id: string, label: string, run: () => string[] }[]} */
  const cases = [
    {
      id: 'macro-icn-north-europe',
      label: 'Macro ICN→north Europe key',
      run: () => {
        const m = resolveMacroTemplate('ICN', 'HEL');
        const checks = [];
        if (m.template.macroId !== 'ICN|north_europe') {
          checks.push(`macroId=${m.template.macroId}`);
        }
        if (m.template.allowDirect !== true) checks.push('allowDirect expected true');
        return checks;
      },
    },
    {
      id: 'macro-icn-south-europe',
      label: 'Macro ICN→south Europe allowDirect',
      run: () => {
        const m = resolveMacroTemplate('ICN', 'FCO');
        const checks = [];
        if (m.template.macroId !== 'ICN|south_europe') {
          checks.push(`macroId=${m.template.macroId}`);
        }
        if (!m.template.allowDirect) checks.push('allowDirect expected true');
        return checks;
      },
    },
    {
      id: 'heuristic-icn-cdg-direct-or-short',
      label: 'ICN→CDG direct or short 1hop',
      run: () => {
        const r = resolveHeuristicFlightRoute({ originIata: 'ICN', destIata: 'CDG' });
        const checks = [];
        if (!r) return ['null result'];
        if (r.path[0] !== 'ICN' || r.path[r.path.length - 1] !== 'CDG') {
          checks.push(`path=${r.path.join('-')}`);
        }
        if (r.hubIatas.length > 1) checks.push(`too many hubs: ${r.hubIatas.join(',')}`);
        if (flightPathDetourRatio(r.path) > 1.35) {
          checks.push(`detour=${flightPathDetourRatio(r.path).toFixed(2)}`);
        }
        return checks;
      },
    },
    {
      id: 'heuristic-icn-bob-nrt-ppt',
      label: 'ICN→BOB prefers NRT/PPT (macro + cinemaSafe)',
      run: () => {
        const r = resolveHeuristicFlightRoute({
          originIata: 'ICN',
          destIata: 'BOB',
          slug: 'bora-bora',
        });
        const checks = [];
        if (!r) return ['null result'];
        if (!r.rationale.profileUsed) checks.push('cinemaSafe profile not used');
        if (!includesAll(r.hubIatas, ['NRT']) && !includesAll(r.hubIatas, ['PPT'])) {
          // Accept NRT+PPT or either if score prefers one
          if (!r.hubIatas.includes('NRT') && !r.hubIatas.includes('PPT')) {
            checks.push(`hubs=${r.hubIatas.join(',')}`);
          }
        }
        if (r.path[r.path.length - 1] !== 'BOB') checks.push('dest not BOB');
        return checks;
      },
    },
    {
      id: 'heuristic-icn-africa-preferred',
      label: 'ICN→JNB uses ADD/DOH/DXB family',
      run: () => {
        const r = resolveHeuristicFlightRoute({ originIata: 'ICN', destIata: 'JNB' });
        const checks = [];
        if (!r) return ['null result'];
        const preferred = new Set(['ADD', 'DOH', 'DXB', 'JNB', 'NBO', 'CAI']);
        if (r.hubIatas.length && !r.hubIatas.some((h) => preferred.has(h))) {
          checks.push(`hubs=${r.hubIatas.join(',')}`);
        }
        if (r.rationale.macroId !== 'ICN|africa') {
          checks.push(`macroId=${r.rationale.macroId}`);
        }
        return checks;
      },
    },
    {
      id: 'heuristic-icn-americas-lax',
      label: 'ICN→CUN prefers LAX family',
      run: () => {
        const r = resolveHeuristicFlightRoute({
          originIata: 'ICN',
          destIata: 'CUN',
          slug: 'cancun',
        });
        const checks = [];
        if (!r) return ['null result'];
        if (!r.hubIatas.includes('LAX') && !r.hubIatas.includes('SEA') && !r.hubIatas.includes('SFO')) {
          checks.push(`hubs=${r.hubIatas.join(',')}`);
        }
        return checks;
      },
    },
    {
      id: 'heuristic-bda-cdg-jfk',
      label: 'BDA→CDG via JFK family',
      run: () => {
        const r = resolveHeuristicFlightRoute({ originIata: 'BDA', destIata: 'CDG' });
        const checks = [];
        if (!r) return ['null result'];
        if (!r.hubIatas.some((h) => ['JFK', 'EWR', 'BOS', 'ATL'].includes(h))) {
          checks.push(`hubs=${r.hubIatas.join(',')}`);
        }
        if (!noneOf(r.hubIatas, ['SGF', 'MUC'])) checks.push('forbidden hub present');
        return checks;
      },
    },
    {
      id: 'heuristic-bda-las-atl',
      label: 'BDA→LAS via ATL family (no SGF)',
      run: () => {
        const r = resolveHeuristicFlightRoute({ originIata: 'BDA', destIata: 'LAS' });
        const checks = [];
        if (!r) return ['null result'];
        if (r.hubIatas.includes('SGF')) checks.push('SGF forbidden');
        if (!r.hubIatas.some((h) => ['ATL', 'JFK', 'ORD', 'DFW'].includes(h))) {
          checks.push(`hubs=${r.hubIatas.join(',')}`);
        }
        return checks;
      },
    },
    {
      id: 'heuristic-mnl-cdg-hkg',
      label: 'MNL→CDG prefers HKG family',
      run: () => {
        const r = resolveHeuristicFlightRoute({ originIata: 'MNL', destIata: 'CDG' });
        const checks = [];
        if (!r) return ['null result'];
        if (!r.hubIatas.some((h) => ['HKG', 'SIN', 'BKK', 'DXB'].includes(h))) {
          checks.push(`hubs=${r.hubIatas.join(',')}`);
        }
        return checks;
      },
    },
    {
      id: 'cinemaSafe-only-profile',
      label: 'toolkit-audit santorini NOT cinemaSafe candidate',
      run: () => {
        const profile = getDestArrivalProfile('santorini');
        const cand = cinemaSafeProfileCandidates('santorini');
        const checks = [];
        if (!profile) return ['missing santorini profile'];
        if (profile.cinemaSafe === true) checks.push('santorini unexpectedly cinemaSafe');
        if (cand.used) checks.push('toolkit-audit used as cinema candidate');
        return checks;
      },
    },
    {
      id: 'assemble-order-longhaul-gateway-final',
      label: 'assemble longHaul→gateway→final',
      run: () => {
        const a = assembleFlightRouteHubs({
          originIata: 'ICN',
          finalIata: 'BOB',
          gatewayIata: 'PPT',
          longHaulHubs: ['NRT'],
          nearDestHubs: ['PPT'],
        });
        const checks = [];
        if (a.hubIatas.join(',') !== 'NRT,PPT') {
          checks.push(`hubs=${a.hubIatas.join(',')}`);
        }
        if (a.path.join('-') !== 'ICN-NRT-PPT-BOB') {
          checks.push(`path=${a.path.join('-')}`);
        }
        return checks;
      },
    },
    {
      id: 'audit-wrapper-region-seed',
      label: 'audit wrapper resolves with region seed',
      run: () => {
        const r = resolveHeuristicFlightRouteForAudit({
          originIata: 'ICN',
          destIata: 'ADD',
        });
        const checks = [];
        if (!r) return ['null result'];
        if (r.source !== 'heuristic') checks.push(`source=${r.source}`);
        if (!r.rationale?.macroId) checks.push('missing macroId');
        return checks;
      },
    },
  ];

  const results = [];
  for (const testCase of cases) {
    let checks = [];
    try {
      checks = testCase.run() ?? [];
    } catch (err) {
      checks = [`throw: ${err?.message ?? err}`];
    }
    results.push({
      id: testCase.id,
      label: testCase.label,
      pass: checks.length === 0,
      checks,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);

  const out = {
    generatedAt: new Date().toISOString(),
    pass: failed.length === 0,
    summary: { total: results.length, passed, failed: failed.length },
    results,
  };

  const outPath = join(root, 'scripts/outputs/flight-route-heuristic-smoke.json');
  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`Heuristic smoke: ${passed}/${results.length} pass`);
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id} — ${r.label}`);
    if (!r.pass) {
      for (const c of r.checks) console.log(`       ${c}`);
    }
  }
  console.log(`Wrote ${outPath}`);

  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
