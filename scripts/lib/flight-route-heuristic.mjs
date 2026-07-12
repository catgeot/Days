/**
 * Heuristic Router wrapper for audit / precompute scripts.
 * Re-exports runtime SSOT — no duplicate logic.
 *
 * @see src/pages/Home/lib/flightRouteHeuristic.js
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveHeuristicFlightRoute } from '../../src/pages/Home/lib/flightRouteHeuristic.js';
import { resolveMacroTemplate } from '../../src/pages/Home/lib/flightRouteMacroTemplates.js';
import { resolveDestRegion } from '../../src/pages/Home/lib/flightRouteGeoRules.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const REGION_GATEWAYS = join(ROOT, 'scripts/data/dest-region-gateways.json');

let _regionGatewaysCache = null;

/**
 * Soft seed from dest-region-gateways.json (corpus-derived frequencies).
 * @returns {Record<string, string[]>}
 */
export function loadRegionGatewaySeed() {
  if (_regionGatewaysCache) return _regionGatewaysCache;
  if (!existsSync(REGION_GATEWAYS)) {
    _regionGatewaysCache = {};
    return _regionGatewaysCache;
  }
  const raw = JSON.parse(readFileSync(REGION_GATEWAYS, 'utf8'));
  /** @type {Record<string, string[]>} */
  const out = {};
  for (const [region, list] of Object.entries(raw.regionGateways ?? {})) {
    out[region] = (Array.isArray(list) ? list : [])
      .map((row) => String(row?.iata ?? row ?? '').trim().toUpperCase())
      .filter((c) => c.length === 3)
      .slice(0, 8);
  }
  _regionGatewaysCache = out;
  return out;
}

/**
 * @param {{
 *   originIata?: string,
 *   destIata: string,
 *   slug?: string | null,
 *   airportMeta?: Map<string, object> | null,
 *   adjacency?: Map<string, Set<string>> | null,
 *   useRegionGatewaySeed?: boolean,
 * }} input
 */
export function resolveHeuristicFlightRouteForAudit(input = {}) {
  const destIata = String(input.destIata ?? '').trim().toUpperCase();
  const airportMeta = input.airportMeta ?? null;
  const destRegion = resolveDestRegion(destIata, airportMeta?.get(destIata) ?? null);

  let regionGatewayIatas = [];
  if (input.useRegionGatewaySeed !== false) {
    const seed = loadRegionGatewaySeed();
    regionGatewayIatas = seed[destRegion] ?? [];
  }

  return resolveHeuristicFlightRoute({
    ...input,
    regionGatewayIatas,
  });
}

export { resolveHeuristicFlightRoute, resolveMacroTemplate, resolveDestRegion };
