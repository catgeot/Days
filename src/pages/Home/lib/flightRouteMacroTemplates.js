/**
 * Macro templates for Heuristic Router — Bar hub chain candidates only.
 * Arc waypoints stay in flightRouteCorridors.js (visual, not semantic hubs).
 *
 * @see plans/flight-route-heuristic-ssot-plan.md Phase 1
 * @module flightRouteMacroTemplates
 */
import { getAirportHubCoords } from './globeFlightCinema.js';
import {
  PREFERRED_HUBS_BY_REGION,
  resolveDestRegion,
} from './flightRouteGeoRules.js';
import { isSouthernEuropeDest } from './flightRouteCorridors.js';

/** @typedef {'africa' | 'south_asia' | 'southeast_asia' | 'middle_east' | 'oceania' | 'europe' | 'americas' | 'unknown'} DestRegion */

/**
 * @typedef {{
 *   macroId: string,
 *   allowDirect: boolean,
 *   longHaulChains: string[][],
 *   gatewayCandidates: string[],
 *   notes?: string,
 * }} MacroTemplate
 */

/** Remote South Pacific / Polynesia — NRT→PPT style chains. */
const SOUTH_PACIFIC_COUNTRIES = new Set([
  'PF', 'CK', 'WS', 'TO', 'TV', 'KI', 'NR', 'MH', 'FM', 'PW', 'NU', 'TK',
]);

/**
 * @param {string} destIata
 * @param {{ iso_country?: string, latitude_deg?: number, longitude_deg?: number } | null | undefined} meta
 */
export function isSouthPacificRemote(destIata, meta) {
  const country = String(meta?.iso_country ?? '').trim().toUpperCase();
  if (SOUTH_PACIFIC_COUNTRIES.has(country)) return true;

  const coords =
    meta?.latitude_deg != null && meta?.longitude_deg != null
      ? { lat: meta.latitude_deg, lng: meta.longitude_deg }
      : getAirportHubCoords(destIata);
  if (!coords) return false;
  // Central/South Pacific island belt (exclude AU/NZ mainland hubs by lng)
  return coords.lat > -30 && coords.lat < 20 && coords.lng < -130 && coords.lng > -180;
}

/**
 * Europe split for ICN macros — reuses corridor bbox helper (arc vs hub remain separate).
 * @param {string} destIata
 * @param {{ latitude_deg?: number, longitude_deg?: number } | null | undefined} meta
 * @returns {'north_europe' | 'south_europe' | 'europe'}
 */
export function resolveEuropeSubregion(destIata, meta) {
  const coords =
    meta?.latitude_deg != null && meta?.longitude_deg != null
      ? { lat: meta.latitude_deg, lng: meta.longitude_deg }
      : getAirportHubCoords(destIata);
  if (!coords) return 'europe';
  const lngLat = /** @type {[number, number]} */ ([coords.lng, coords.lat]);
  if (isSouthernEuropeDest(lngLat)) return 'south_europe';
  return 'north_europe';
}

/**
 * Static macro table — originRegion × destRegion (+ Europe/Pacific refinements).
 * longHaulChains: ordered hub prefixes before regional gateway.
 * gatewayCandidates: near-dest / regional gateways (assemble layer).
 *
 * @type {Record<string, MacroTemplate>}
 */
export const MACRO_TEMPLATES = {
  'ICN|north_europe': {
    macroId: 'ICN|north_europe',
    allowDirect: true,
    longHaulChains: [['DXB'], ['HEL'], ['CPH'], ['FRA'], ['IST']],
    gatewayCandidates: [],
    notes: 'Direct OK for major EU hubs; else DXB / HEL·CPH / FRA·IST',
  },
  'ICN|south_europe': {
    macroId: 'ICN|south_europe',
    allowDirect: true,
    longHaulChains: [[], ['FRA'], ['IST'], ['DXB']],
    gatewayCandidates: [],
    notes: 'Direct preferred; FRA·IST·DXB 1hop',
  },
  'ICN|europe': {
    macroId: 'ICN|europe',
    allowDirect: true,
    longHaulChains: [['DXB'], ['FRA'], ['HEL'], ['IST']],
    gatewayCandidates: [],
  },
  'ICN|africa': {
    macroId: 'ICN|africa',
    allowDirect: false,
    longHaulChains: [['ADD'], ['DOH'], ['DXB'], ['ADD', 'DOH']],
    gatewayCandidates: ['ADD', 'JNB', 'NBO', 'CAI'],
    notes: 'ADD·DOH·DXB long-haul; regional Africa gateways',
  },
  'ICN|americas': {
    macroId: 'ICN|americas',
    allowDirect: false,
    longHaulChains: [['LAX'], ['SEA'], ['SFO'], ['YVR']],
    gatewayCandidates: ['LAX', 'ATL', 'JFK', 'GRU', 'PTY'],
    notes: 'Pacific west-coast first; ATL/JFK/LatAm for near-dest',
  },
  'ICN|oceania_remote': {
    macroId: 'ICN|oceania_remote',
    allowDirect: false,
    longHaulChains: [['NRT'], ['NRT', 'HNL'], ['HNL']],
    gatewayCandidates: ['PPT', 'NAN', 'AKL', 'RAR'],
    notes: 'NRT→PPT-style South Pacific',
  },
  'ICN|oceania': {
    macroId: 'ICN|oceania',
    allowDirect: true,
    longHaulChains: [[], ['NRT'], ['SYD']],
    gatewayCandidates: ['SYD', 'MEL', 'BNE', 'AKL', 'HNL'],
  },
  'ICN|southeast_asia': {
    macroId: 'ICN|southeast_asia',
    allowDirect: true,
    longHaulChains: [[], ['SIN'], ['BKK'], ['HKG']],
    gatewayCandidates: ['SIN', 'BKK', 'KUL', 'SGN', 'HKG'],
  },
  'ICN|south_asia': {
    macroId: 'ICN|south_asia',
    allowDirect: true,
    longHaulChains: [[], ['DXB'], ['DOH'], ['DEL']],
    gatewayCandidates: ['DEL', 'BOM', 'MLE', 'CMB'],
  },
  'ICN|middle_east': {
    macroId: 'ICN|middle_east',
    allowDirect: true,
    longHaulChains: [[], ['DXB'], ['DOH'], ['AUH']],
    gatewayCandidates: ['DXB', 'DOH', 'AUH', 'IST'],
  },
  'ICN|unknown': {
    macroId: 'ICN|unknown',
    allowDirect: true,
    longHaulChains: [[], ['DXB'], ['DOH'], ['SIN'], ['NRT']],
    gatewayCandidates: ['DXB', 'DOH', 'SIN'],
  },
  /** Bermuda / Atlantic edge → US gateway then onward */
  'americas|europe': {
    macroId: 'americas|europe',
    allowDirect: false,
    longHaulChains: [['JFK'], ['EWR'], ['BOS'], ['ATL']],
    gatewayCandidates: [],
    notes: 'BDA→JFK smoke pattern',
  },
  'americas|americas': {
    macroId: 'americas|americas',
    allowDirect: false,
    longHaulChains: [['ATL'], ['JFK'], ['ORD'], ['DFW']],
    gatewayCandidates: ['ATL', 'JFK', 'ORD'],
  },
  'southeast_asia|europe': {
    macroId: 'southeast_asia|europe',
    allowDirect: false,
    longHaulChains: [['HKG'], ['SIN'], ['BKK'], ['DXB']],
    gatewayCandidates: [],
    notes: 'MNL→HKG→CDG smoke pattern',
  },
  'southeast_asia|americas': {
    macroId: 'southeast_asia|americas',
    allowDirect: false,
    longHaulChains: [['NRT'], ['HKG'], ['LAX']],
    gatewayCandidates: ['LAX', 'SFO'],
  },
};

/**
 * Resolve macro key for origin × dest.
 * @param {string} originIata
 * @param {string} destIata
 * @param {Map<string, object> | null | undefined} airportMeta
 * @returns {{ key: string, originRegion: DestRegion, destRegion: DestRegion, template: MacroTemplate }}
 */
export function resolveMacroTemplate(originIata, destIata, airportMeta = null) {
  const origin = String(originIata || 'ICN').trim().toUpperCase() || 'ICN';
  const dest = String(destIata || '').trim().toUpperCase();
  const originMeta = airportMeta?.get(origin) ?? null;
  const destMeta = airportMeta?.get(dest) ?? null;
  const originRegion = resolveDestRegion(origin, originMeta);
  let destRegion = resolveDestRegion(dest, destMeta);

  let key;
  if (origin === 'ICN') {
    if (destRegion === 'europe') {
      const sub = resolveEuropeSubregion(dest, destMeta);
      key = `ICN|${sub}`;
      if (!MACRO_TEMPLATES[key]) key = 'ICN|europe';
    } else if (
      destRegion === 'oceania' ||
      isSouthPacificRemote(dest, destMeta)
    ) {
      key = isSouthPacificRemote(dest, destMeta)
        ? 'ICN|oceania_remote'
        : 'ICN|oceania';
      if (isSouthPacificRemote(dest, destMeta)) destRegion = 'oceania';
    } else {
      key = `ICN|${destRegion}`;
      if (!MACRO_TEMPLATES[key]) key = 'ICN|unknown';
    }
  } else {
    key = `${originRegion}|${destRegion}`;
    if (!MACRO_TEMPLATES[key]) {
      // Soft fallback: prefer origin-region preferred hubs as longHaul only
      const preferred = [
        ...(PREFERRED_HUBS_BY_REGION[originRegion] ?? []),
        ...(PREFERRED_HUBS_BY_REGION[destRegion] ?? []),
      ];
      return {
        key: `${originRegion}|${destRegion}|fallback`,
        originRegion,
        destRegion,
        template: {
          macroId: `${originRegion}|${destRegion}|fallback`,
          allowDirect: true,
          longHaulChains: [[], ...preferred.slice(0, 4).map((h) => [h])],
          gatewayCandidates: [...(PREFERRED_HUBS_BY_REGION[destRegion] ?? [])].slice(0, 6),
          notes: 'fallback from PREFERRED_HUBS_BY_REGION',
        },
      };
    }
  }

  return {
    key,
    originRegion,
    destRegion,
    template: MACRO_TEMPLATES[key] ?? MACRO_TEMPLATES['ICN|unknown'],
  };
}

/**
 * Merge region-gateway frequency seed (optional soft candidates).
 * @param {MacroTemplate} template
 * @param {string[]} regionGatewayIatas
 * @returns {MacroTemplate}
 */
export function mergeRegionGatewaySeed(template, regionGatewayIatas = []) {
  if (!regionGatewayIatas.length) return template;
  const extra = regionGatewayIatas
    .map((c) => String(c || '').trim().toUpperCase())
    .filter((c) => c.length === 3);
  if (!extra.length) return template;
  const seen = new Set(template.gatewayCandidates);
  const merged = [...template.gatewayCandidates];
  for (const g of extra) {
    if (seen.has(g)) continue;
    seen.add(g);
    merged.push(g);
  }
  return { ...template, gatewayCandidates: merged };
}
