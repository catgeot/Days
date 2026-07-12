/**
 * Flight route hub chain assembly — long-haul → gateway → final.
 * Used by destArrivalProfile SSOT and future Heuristic Router.
 * Does NOT read toolkit journey_timeline (auto-bake forbidden).
 *
 * @module flightRouteAssemble
 */

/**
 * @typedef {{ longHaulHubs?: string[], gatewayIata?: string | null, nearDestHubs?: string[], finalIata?: string | null, originIata?: string }} AssembleFlightRouteInput
 * @typedef {{ hubIatas: string[], path: string[], gatewayIata: string | null, finalIata: string | null, source: 'assembled' }} AssembledFlightRoute
 */

/**
 * Normalize IATA list: uppercase, length 3, dedupe preserving order.
 * @param {unknown} list
 * @returns {string[]}
 */
export function normalizeIataList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const code = String(raw ?? '').trim().toUpperCase();
    if (code.length !== 3 || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

/**
 * Assemble cinema/Bar hub chain: origin → longHaul → gateway → nearDest → final.
 * Endpoints are excluded from hubIatas (same contract as flightRouteHubIatas).
 *
 * @param {AssembleFlightRouteInput} input
 * @returns {AssembledFlightRoute}
 */
export function assembleFlightRouteHubs(input = {}) {
  const origin = String(input.originIata ?? 'ICN').trim().toUpperCase();
  const finalIata = String(input.finalIata ?? '').trim().toUpperCase() || null;
  const gatewayRaw = String(input.gatewayIata ?? '').trim().toUpperCase();
  const gatewayIata =
    gatewayRaw.length === 3 && gatewayRaw !== origin && gatewayRaw !== finalIata
      ? gatewayRaw
      : null;

  const longHaul = normalizeIataList(input.longHaulHubs);
  const nearDest = normalizeIataList(input.nearDestHubs);

  const endpoints = new Set([origin]);
  if (finalIata) endpoints.add(finalIata);

  /** @type {string[]} */
  const ordered = [];
  const push = (code) => {
    if (!code || endpoints.has(code) || ordered.includes(code)) return;
    ordered.push(code);
  };

  for (const h of longHaul) push(h);
  if (gatewayIata) push(gatewayIata);
  for (const h of nearDest) {
    if (h === gatewayIata) continue;
    push(h);
  }

  const hubIatas = ordered.slice(0, 3);
  const path = [origin, ...hubIatas];
  if (finalIata) path.push(finalIata);

  return {
    hubIatas,
    path,
    gatewayIata,
    finalIata,
    source: 'assembled',
  };
}

/**
 * Split a flat hub chain into long-haul vs near-dest using optional gateway.
 * Last hub matching gateway (or same destRegion as final) → near-dest layer.
 *
 * @param {string[]} hubs
 * @param {{ gatewayIata?: string | null, finalIata?: string | null, destRegion?: string, regionOf?: (iata: string) => string }} [opts]
 */
export function splitHubsIntoLayers(hubs, opts = {}) {
  const list = normalizeIataList(hubs);
  const gateway = String(opts.gatewayIata ?? '').trim().toUpperCase() || null;
  const destRegion = opts.destRegion ?? null;
  const regionOf = typeof opts.regionOf === 'function' ? opts.regionOf : null;

  if (!list.length) {
    return { longHaulHubs: [], nearDestHubs: [], gatewayIata: gateway };
  }

  if (gateway && list.includes(gateway)) {
    const idx = list.indexOf(gateway);
    return {
      longHaulHubs: list.slice(0, idx),
      nearDestHubs: list.slice(idx),
      gatewayIata: gateway,
    };
  }

  const last = list[list.length - 1];
  if (
    destRegion &&
    destRegion !== 'unknown' &&
    regionOf &&
    regionOf(last) === destRegion
  ) {
    return {
      longHaulHubs: list.slice(0, -1),
      nearDestHubs: [last],
      gatewayIata: gateway || last,
    };
  }

  return { longHaulHubs: list, nearDestHubs: [], gatewayIata: gateway };
}
