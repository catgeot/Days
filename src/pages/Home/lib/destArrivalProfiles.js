/**
 * destArrivalProfile lookup — assemble order longHaul → gateway → final.
 * Toolkit-audit profiles are NOT applied to cinema unless cinemaSafe (override/infer).
 */
import destArrivalProfiles from '../data/destArrivalProfiles.json' with { type: 'json' };
import { assembleFlightRouteHubs } from './flightRouteAssemble.js';

/**
 * @param {string | null | undefined} slug
 * @returns {object | null}
 */
export function getDestArrivalProfile(slug) {
  const key = String(slug ?? '').trim();
  if (!key) return null;
  const row = destArrivalProfiles?.spots?.[key];
  return row && typeof row === 'object' ? row : null;
}

export function getDestArrivalProfilesMeta() {
  return destArrivalProfiles?._meta ?? null;
}

/**
 * Cinema-safe hub chain from profile (override/infer only).
 * Returns null when profile missing or toolkit-audit (must promote via overrides).
 *
 * @param {string | null | undefined} slug
 * @param {{ originIata?: string }} [options]
 * @returns {string[] | null}
 */
export function getCinemaSafeHubIatasFromProfile(slug, options = {}) {
  const profile = getDestArrivalProfile(slug);
  if (!profile || profile.cinemaSafe !== true) return null;

  const assembled = assembleFlightRouteHubs({
    originIata: options.originIata ?? 'ICN',
    finalIata: profile.finalIata,
    gatewayIata: profile.gatewayIata,
    longHaulHubs: profile.longHaulHubs,
    nearDestHubs: profile.nearDestHubs,
  });
  return assembled.hubIatas;
}
