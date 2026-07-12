/**
 * Heuristic Flight Router — graph BFS 없음.
 * Macro templates + geoRules score/detour → assemble (longHaul→gateway→final).
 *
 * cinemaSafe destArrivalProfiles만 후보로 사용 (toolkit-audit / timeline bake 금지).
 *
 * @see plans/flight-route-heuristic-ssot-plan.md Phase 1
 * @module flightRouteHeuristic
 */
import {
  assembleFlightRouteHubs,
  normalizeIataList,
  splitHubsIntoLayers,
} from './flightRouteAssemble.js';
import { getDestArrivalProfile } from './destArrivalProfiles.js';
import {
  MAX_FLIGHT_PATH_DETOUR_RATIO,
  filterCandidatesByDetourRatio,
  filterSuspiciousGraphDirect,
  flightPathDetourRatio,
  resolveDestRegion,
  scoreFlightPathV2,
} from './flightRouteGeoRules.js';
import {
  MAX_FLIGHT_LEG_HOURS,
  findOverlongFlightLegs,
  getAirportHubCoords,
} from './globeFlightCinema.js';
import {
  mergeRegionGatewaySeed,
  resolveMacroTemplate,
} from './flightRouteMacroTemplates.js';
import { seedConfirmsPath } from './flightRouteGatewaySeed.js';

/**
 * @typedef {{
 *   hubIatas: string[],
 *   path: string[],
 *   gatewayIata: string | null,
 *   finalIata: string | null,
 *   source: 'heuristic' | 'heuristic-seed',
 *   rationale: {
 *     macroId: string,
 *     destRegion: string,
 *     originRegion: string,
 *     score: number,
 *     detour: number,
 *     allowDirect: boolean,
 *     profileUsed: boolean,
 *     candidateCount: number,
 *     seedConfirmed: boolean,
 *   },
 * }} HeuristicFlightRoute
 */

/**
 * GATN thin seed — confirm-only / fail-open (reject-only 금지).
 * Prefer seed-confirmed paths when any exist; otherwise keep full candidate pool.
 * @param {{ path: string[] }[]} candidates
 */
function preferSeedConfirmedCandidates(candidates) {
  if (!candidates?.length) return { pool: [], seedConfirmed: false };
  const confirmed = candidates.filter((c) => seedConfirmsPath(c.path));
  if (confirmed.length) return { pool: confirmed, seedConfirmed: true };
  return { pool: candidates, seedConfirmed: false };
}

/**
 * @param {string} code
 * @param {Map<string, object> | null | undefined} airportMeta
 */
function hasCoords(code, airportMeta) {
  const meta = airportMeta?.get(code);
  if (meta?.latitude_deg != null && meta?.longitude_deg != null) return true;
  return Boolean(getAirportHubCoords(code));
}

/**
 * cinemaSafe profile only — toolkit-audit ignored (manual promote queue).
 * @param {string | null | undefined} slug
 * @returns {{ longHaulHubs: string[], gatewayIata: string | null, nearDestHubs: string[], used: boolean }}
 */
export function cinemaSafeProfileCandidates(slug) {
  const empty = { longHaulHubs: [], gatewayIata: null, nearDestHubs: [], used: false };
  if (!slug) return empty;
  const profile = getDestArrivalProfile(slug);
  if (!profile || profile.cinemaSafe !== true) return empty;
  return {
    longHaulHubs: normalizeIataList(profile.longHaulHubs),
    gatewayIata: profile.gatewayIata
      ? String(profile.gatewayIata).trim().toUpperCase()
      : null,
    nearDestHubs: normalizeIataList(profile.nearDestHubs),
    used: true,
  };
}

/**
 * Build path candidates from macro + optional cinemaSafe profile.
 * @param {{
 *   originIata: string,
 *   destIata: string,
 *   macro: ReturnType<typeof resolveMacroTemplate>,
 *   profile: ReturnType<typeof cinemaSafeProfileCandidates>,
 *   airportMeta?: Map<string, object> | null,
 * }} args
 */
function buildPathCandidates({ originIata, destIata, macro, profile, airportMeta }) {
  const origin = originIata;
  const dest = destIata;
  const { template } = macro;
  /** @type {{ path: string[], hops: number, source: string, longHaulHubs: string[], gatewayIata: string | null }[]} */
  const candidates = [];
  const seen = new Set();

  const push = (path, meta = {}) => {
    const codes = normalizeIataList(path);
    if (codes.length < 2) return;
    if (codes[0] !== origin || codes[codes.length - 1] !== dest) return;
    for (const c of codes) {
      if (!hasCoords(c, airportMeta)) return;
    }
    const key = codes.join('-');
    if (seen.has(key)) return;
    seen.add(key);
    const hubs = codes.slice(1, -1);
    candidates.push({
      path: codes,
      hops: Math.max(1, hubs.length + 1),
      source: meta.source ?? 'heuristic',
      longHaulHubs: meta.longHaulHubs ?? hubs.slice(0, Math.max(0, hubs.length - 1)),
      gatewayIata: meta.gatewayIata ?? (hubs.length ? hubs[hubs.length - 1] : null),
    });
  };

  if (template.allowDirect) {
    push([origin, dest], { source: 'heuristic-direct', longHaulHubs: [], gatewayIata: null });
  }

  const longHaulChains = [...template.longHaulChains];
  if (profile.used && profile.longHaulHubs.length) {
    longHaulChains.unshift(profile.longHaulHubs);
  }

  // Gateways = near-dest / regional only (macro + cinemaSafe).
  // PREFERRED_HUBS_BY_REGION is applied via scoreHubGeoPenalty — do not stack as extra hops.
  const gatewayPool = normalizeIataList([
    ...(profile.gatewayIata ? [profile.gatewayIata] : []),
    ...profile.nearDestHubs,
    ...template.gatewayCandidates,
  ]).filter((g) => g !== origin && g !== dest);

  for (const chain of longHaulChains) {
    const longHaul = normalizeIataList(chain).filter((h) => h !== origin && h !== dest);
    if (!longHaul.length) {
      for (const g of gatewayPool.slice(0, 8)) {
        push([origin, g, dest], {
          source: 'heuristic-1hop',
          longHaulHubs: [],
          gatewayIata: g,
        });
      }
      continue;
    }

    // 1hop via first longHaul only
    push([origin, ...longHaul.slice(0, 1), dest], {
      source: 'heuristic-1hop',
      longHaulHubs: longHaul.slice(0, 1),
      gatewayIata: null,
    });

    // full longHaul chain (≤2 hubs) then dest
    if (longHaul.length >= 2) {
      push([origin, ...longHaul.slice(0, 2), dest], {
        source: 'heuristic-2hop',
        longHaulHubs: longHaul.slice(0, 2),
        gatewayIata: null,
      });
    }

    // longHaul + gateway
    for (const g of gatewayPool.slice(0, 6)) {
      if (longHaul.includes(g)) {
        push([origin, ...longHaul.filter((h) => h !== g).slice(0, 1), g, dest], {
          source: 'heuristic-2hop',
          longHaulHubs: longHaul.filter((h) => h !== g).slice(0, 1),
          gatewayIata: g,
        });
        continue;
      }
      const prefix = longHaul.slice(0, 1);
      push([origin, ...prefix, g, dest], {
        source: 'heuristic-2hop',
        longHaulHubs: prefix,
        gatewayIata: g,
      });
    }
  }

  // Profile-preferred assembled path (cinemaSafe)
  if (profile.used) {
    const assembled = assembleFlightRouteHubs({
      originIata: origin,
      finalIata: dest,
      gatewayIata: profile.gatewayIata,
      longHaulHubs: profile.longHaulHubs,
      nearDestHubs: profile.nearDestHubs,
    });
    // Do not inject profile-only direct when macro forbids direct (e.g. BDA→Europe).
    if (assembled.hubIatas.length > 0 || template.allowDirect) {
      push(assembled.path, {
        source: 'heuristic-profile',
        longHaulHubs: profile.longHaulHubs,
        gatewayIata: assembled.gatewayIata,
      });
    }
  }

  return candidates;
}

/**
 * Drop candidates with overlong legs (same bar as cinema MAX_FLIGHT_LEG_HOURS).
 * @param {{ path: string[] }[]} candidates
 */
function filterOverlongLegs(candidates) {
  if (!candidates?.length) return [];
  const filtered = candidates.filter((c) => {
    const over = findOverlongFlightLegs(c.path, MAX_FLIGHT_LEG_HOURS);
    return over.length === 0;
  });
  return filtered.length ? filtered : candidates;
}

/**
 * Resolve heuristic hub chain (no graph BFS).
 *
 * @param {{
 *   originIata?: string,
 *   destIata: string,
 *   slug?: string | null,
 *   airportMeta?: Map<string, object> | null,
 *   adjacency?: Map<string, Set<string>> | null,
 *   regionGatewayIatas?: string[],
 *   maxDetourRatio?: number,
 *   useGatewaySeed?: boolean,
 * }} input
 * @returns {HeuristicFlightRoute | null}
 */
export function resolveHeuristicFlightRoute(input = {}) {
  const originIata = String(input.originIata ?? 'ICN').trim().toUpperCase() || 'ICN';
  const destIata = String(input.destIata ?? '').trim().toUpperCase();
  if (!destIata || destIata.length !== 3) return null;
  if (originIata === destIata) {
    return {
      hubIatas: [],
      path: [originIata],
      gatewayIata: null,
      finalIata: destIata,
      source: 'heuristic',
      rationale: {
        macroId: 'same-airport',
        destRegion: 'unknown',
        originRegion: 'unknown',
        score: 0,
        detour: 1,
        allowDirect: true,
        profileUsed: false,
        candidateCount: 0,
        seedConfirmed: false,
      },
    };
  }

  const airportMeta = input.airportMeta ?? null;
  const useGatewaySeed = input.useGatewaySeed !== false;
  let macro = resolveMacroTemplate(originIata, destIata, airportMeta);
  if (input.regionGatewayIatas?.length) {
    macro = {
      ...macro,
      template: mergeRegionGatewaySeed(macro.template, input.regionGatewayIatas),
    };
  }

  const profile = cinemaSafeProfileCandidates(input.slug);
  let candidates = buildPathCandidates({
    originIata,
    destIata,
    macro,
    profile,
    airportMeta,
  });

  if (input.adjacency && airportMeta) {
    candidates = filterSuspiciousGraphDirect(
      candidates.map((c) => ({
        ...c,
        hubIatas: c.path.slice(1, -1),
      })),
      input.adjacency,
      airportMeta,
    );
  }

  candidates = filterCandidatesByDetourRatio(
    candidates,
    airportMeta,
    input.maxDetourRatio ?? MAX_FLIGHT_PATH_DETOUR_RATIO,
  );
  candidates = filterOverlongLegs(candidates);

  if (!candidates.length) {
    // Last resort: direct if coords exist
    if (hasCoords(originIata, airportMeta) && hasCoords(destIata, airportMeta)) {
      const path = [originIata, destIata];
      const seedConfirmed = useGatewaySeed && seedConfirmsPath(path);
      return {
        hubIatas: [],
        path,
        gatewayIata: null,
        finalIata: destIata,
        source: seedConfirmed ? 'heuristic-seed' : 'heuristic',
        rationale: {
          macroId: macro.template.macroId,
          destRegion: macro.destRegion,
          originRegion: macro.originRegion,
          score: scoreFlightPathV2(path, { airportMeta }),
          detour: flightPathDetourRatio(path),
          allowDirect: true,
          profileUsed: profile.used,
          candidateCount: 0,
          seedConfirmed,
        },
      };
    }
    return null;
  }

  const { pool, seedConfirmed } = useGatewaySeed
    ? preferSeedConfirmedCandidates(candidates)
    : { pool: candidates, seedConfirmed: false };
  candidates = pool;

  /** cinemaSafe profile hubs get a strong preference (still no timeline bake). */
  const scoreCandidate = (c) => {
    let score = scoreFlightPathV2(c.path, { airportMeta });
    if (useGatewaySeed && seedConfirmsPath(c.path)) score -= 180;
    if (c.source === 'heuristic-profile') score -= 250;
    if (profile.used && profile.longHaulHubs.length) {
      const hubs = c.path.slice(1, -1);
      const matchesLongHaul =
        hubs.length === profile.longHaulHubs.length &&
        profile.longHaulHubs.every((h, i) => hubs[i] === h);
      if (matchesLongHaul) score -= 700;
      else if (profile.longHaulHubs.every((h) => c.path.includes(h))) score -= 350;
    }
    if (profile.used && profile.gatewayIata && c.path.includes(profile.gatewayIata)) {
      score -= 150;
    }
    // Prefer earlier macro longHaulChains order (index 0 = strongest)
    const firstHub = c.path[1];
    const chainRank = macro.template.longHaulChains.findIndex(
      (chain) => chain.length === 1 && chain[0] === firstHub && c.path.length === 3,
    );
    if (chainRank >= 0) score += chainRank * 40;
    return score;
  };

  let best = candidates[0];
  let bestScore = scoreCandidate(best);
  for (let i = 1; i < candidates.length; i += 1) {
    const score = scoreCandidate(candidates[i]);
    if (score < bestScore) {
      best = candidates[i];
      bestScore = score;
    }
  }

  const hubs = best.path.slice(1, -1);
  const layers = splitHubsIntoLayers(hubs, {
    gatewayIata: best.gatewayIata,
    finalIata: destIata,
    destRegion: macro.destRegion,
    regionOf: (iata) =>
      resolveDestRegion(iata, airportMeta?.get(iata) ?? null),
  });

  const assembled = assembleFlightRouteHubs({
    originIata,
    finalIata: destIata,
    gatewayIata: layers.gatewayIata ?? best.gatewayIata,
    longHaulHubs: layers.longHaulHubs.length ? layers.longHaulHubs : best.longHaulHubs,
    nearDestHubs: layers.nearDestHubs,
  });

  const finalSeedConfirmed =
    seedConfirmed || (useGatewaySeed && seedConfirmsPath(assembled.path));

  return {
    hubIatas: assembled.hubIatas,
    path: assembled.path,
    gatewayIata: assembled.gatewayIata,
    finalIata: assembled.finalIata,
    source: finalSeedConfirmed ? 'heuristic-seed' : 'heuristic',
    rationale: {
      macroId: macro.template.macroId,
      destRegion: macro.destRegion,
      originRegion: macro.originRegion,
      score: bestScore,
      detour: flightPathDetourRatio(assembled.path),
      allowDirect: macro.template.allowDirect,
      profileUsed: profile.used,
      candidateCount: candidates.length,
      seedConfirmed: finalSeedConfirmed,
    },
  };
}
