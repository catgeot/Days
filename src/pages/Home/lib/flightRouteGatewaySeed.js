/**
 * GATN thin seed — runtime lookup only (no BFS / path inference).
 * Wired via flightRouteHeuristic (confirm/fail-open) · resolveFlightRoutePlan (S4).
 *
 * @see plans/flight-route-heuristic-ssot-plan.md Phase 3–4
 * @module flightRouteGatewaySeed
 */
import gatewaySeedJson from '../../../../scripts/data/flight-route-gateway-seed.json' with { type: 'json' };

/** @type {Record<string, string[]> | null} */
let _gateways = null;
/** @type {Map<string, Set<string>> | null} */
let _sets = null;

function normalizeIata(code) {
  const upper = String(code || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : null;
}

/**
 * Raw gateways object from seed JSON (`{ ICN: ['CDG', …], … }`).
 * @returns {Record<string, string[]>}
 */
export function getGatewaySeedTable() {
  if (!_gateways) {
    _gateways = gatewaySeedJson?.gateways && typeof gatewaySeedJson.gateways === 'object'
      ? gatewaySeedJson.gateways
      : {};
  }
  return _gateways;
}

/**
 * @returns {Map<string, Set<string>>}
 */
function getGatewaySeedSets() {
  if (_sets) return _sets;
  const table = getGatewaySeedTable();
  _sets = new Map();
  for (const [origin, dests] of Object.entries(table)) {
    const o = normalizeIata(origin);
    if (!o) continue;
    _sets.set(o, new Set((dests || []).map(normalizeIata).filter(Boolean)));
  }
  return _sets;
}

/**
 * Lookup-only: does GATN thin seed list a direct outbound edge?
 * Fail-open consumers should treat `false` as "unconfirmed", not "reject".
 *
 * @param {string} fromIata
 * @param {string} toIata
 * @returns {boolean}
 */
export function seedHasDirectEdge(fromIata, toIata) {
  const from = normalizeIata(fromIata);
  const to = normalizeIata(toIata);
  if (!from || !to || from === to) return false;
  return getGatewaySeedSets().get(from)?.has(to) ?? false;
}

/**
 * True when every consecutive leg in `path` (IATA[]) has a seed edge.
 * Empty / single-node path → true (nothing to confirm).
 *
 * @param {string[]} path
 * @returns {boolean}
 */
export function seedConfirmsPath(path) {
  if (!Array.isArray(path) || path.length < 2) return true;
  for (let i = 0; i < path.length - 1; i += 1) {
    if (!seedHasDirectEdge(path[i], path[i + 1])) return false;
  }
  return true;
}

/**
 * @returns {{ generatedAt?: string, originCount?: number, edgeCount?: number, source?: string } | null}
 */
export function getGatewaySeedMeta() {
  return gatewaySeedJson?._meta ?? null;
}
