/**
 * Legacy place_id → canonical slug (slug-first migration + seed).
 * Shares rules with travelSpotResolve / travel-spot-place-id-aliases.
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../../src/pages/Home/data/travelSpots.js';
import {
  TRAVEL_SPOT_PLACE_ID_ALIASES,
  TRAVEL_SPOT_TOOLKIT_SYNONYMS,
} from '../data/travel-spot-place-id-aliases.mjs';
import {
  buildSpotLookup,
  normalizePlaceKey,
  resolveTravelSpotFromPlaceId,
} from './travel-spot-place-resolve.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIST_PATH = join(__dirname, '../../src/pages/Home/data/travelSpots-list.json');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GEO_RE = /^geo-(-?\d+\.?\d*)-(-?\d+\.?\d*)$/;

let cachedSlugSet = null;
let cachedAliasToSlug = null;

function getKnownSlugs() {
  if (cachedSlugSet) return cachedSlugSet;
  const set = new Set();
  for (const s of TRAVEL_SPOTS) {
    if (s.slug) set.add(String(s.slug).toLowerCase());
  }
  if (existsSync(LIST_PATH)) {
    try {
      const list = JSON.parse(readFileSync(LIST_PATH, 'utf8'));
      for (const row of list) {
        if (row.slug) set.add(String(row.slug).toLowerCase());
      }
    } catch {
      /* ignore */
    }
  }
  cachedSlugSet = set;
  return set;
}

/** Static alias map: normalized alias → canonical_slug */
export function buildStaticAliasToSlugMap() {
  if (cachedAliasToSlug) return cachedAliasToSlug;
  const map = new Map();
  const add = (alias, slug) => {
    const a = String(alias ?? '').trim();
    const s = String(slug ?? '').trim().toLowerCase();
    if (!a || !s) return;
    map.set(normalizePlaceKey(a), s);
    map.set(a.toLowerCase(), s);
  };

  for (const [alias, slug] of Object.entries(TRAVEL_SPOT_PLACE_ID_ALIASES)) {
    add(alias, slug);
  }

  for (const [slug, synonyms] of Object.entries(TRAVEL_SPOT_TOOLKIT_SYNONYMS)) {
    add(slug, slug);
    for (const syn of synonyms || []) add(syn, slug);
  }

  const lookup = buildSpotLookup(TRAVEL_SPOTS);
  for (const spot of TRAVEL_SPOTS) {
    add(spot.slug, spot.slug);
    add(spot.name, spot.slug);
    add(spot.name_en, spot.slug);
    for (const kw of spot.keywords || []) add(kw, spot.slug);
    for (const v of lookup.keys()) {
      const hit = lookup.get(v);
      if (hit?.slug === spot.slug) add(v, spot.slug);
    }
  }

  cachedAliasToSlug = map;
  return map;
}

export function isKnownSlug(value) {
  const s = String(value ?? '').trim().toLowerCase();
  return Boolean(s && getKnownSlugs().has(s));
}

export function isGeoPlaceId(value) {
  return GEO_RE.test(String(value ?? '').trim());
}

/**
 * @param {string} oldPlaceId
 * @param {{ lat?: number, lng?: number, aliasMap?: Map<string, string> }} [opts]
 * @returns {{ slug: string, matchKind: string } | { slug: null, matchKind: 'unresolved', raw: string }}
 */
export function resolveCanonicalSlug(oldPlaceId, opts = {}) {
  const raw = String(oldPlaceId ?? '').trim();
  if (!raw) return { slug: null, matchKind: 'unresolved', raw };

  const lower = raw.toLowerCase();
  if (isKnownSlug(lower)) return { slug: lower, matchKind: 'slug' };
  if (isGeoPlaceId(lower)) return { slug: lower, matchKind: 'geo' };

  const aliasMap = opts.aliasMap ?? buildStaticAliasToSlugMap();
  const fromAlias = aliasMap.get(normalizePlaceKey(raw)) ?? aliasMap.get(lower);
  if (fromAlias) return { slug: fromAlias, matchKind: 'alias' };

  const lookup = buildSpotLookup(TRAVEL_SPOTS);
  const resolved = resolveTravelSpotFromPlaceId(lookup, TRAVEL_SPOTS, raw);
  if (resolved?.spot?.slug) {
    return { slug: resolved.spot.slug, matchKind: resolved.matchKind || 'lookup' };
  }

  const lat = Number(opts.lat);
  const lng = Number(opts.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      slug: `geo-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      matchKind: 'geo-inferred',
    };
  }

  return { slug: null, matchKind: 'unresolved', raw };
}

/** Row timestamp for newest-wins */
export function rowRecencyScore(row, tableName) {
  const ts =
    row.toolkit_updated_at ??
    row.ai_info_updated_at ??
    row.last_updated ??
    row.updated_at ??
    row.created_at ??
    null;
  const t = ts ? new Date(ts).getTime() : 0;
  const score = Number(row.total_score);
  const scoreBonus = Number.isFinite(score) ? score / 1e9 : 0;
  const guideLen =
    tableName === 'place_toolkit' && row.essential_guide
      ? String(row.essential_guide).length / 1e6
      : 0;
  return t + scoreBonus + guideLen;
}
