import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  TRAVEL_SPOT_PLACE_ID_ALIASES,
  TRAVEL_SPOT_PLACE_ID_BLOCKLIST
} from '../data/travel-spot-place-id-aliases.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIST_PATH = join(__dirname, '../../src/pages/Home/data/travelSpots-list.json');

const STRIP_SUFFIX_RE = /\s*(제도|국립공원|국립\s*공원|호수|섬|기지|시|군|주)\s*$/gi;
const STRIP_INFIX_RE = /\s*(제도|국립공원|국립\s*공원)\s*/gi;

export function normalizePlaceKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function isBlocklistedPlaceId(placeId) {
  const n = normalizePlaceKey(placeId);
  return TRAVEL_SPOT_PLACE_ID_BLOCKLIST.has(n);
}

/** place_id 후보 문자열(원문·띄어쓰기 제거·접미사 제거) */
export function placeIdVariants(placeId) {
  const raw = String(placeId ?? '').trim();
  if (!raw) return [];

  const out = new Set();
  const add = (v) => {
    if (v == null || v === '') return;
    out.add(String(v).trim());
    out.add(normalizePlaceKey(v));
    out.add(String(v).trim().toLowerCase());
  };

  add(raw);
  add(raw.replace(/\s+/g, ''));

  const strippedSuffix = raw.replace(STRIP_SUFFIX_RE, '').trim();
  if (strippedSuffix) add(strippedSuffix);

  const strippedInfix = raw.replace(STRIP_INFIX_RE, ' ').replace(/\s+/g, ' ').trim();
  if (strippedInfix) add(strippedInfix);

  return [...out];
}

function loadSearchKeysBySlug() {
  const bySlug = new Map();
  if (!existsSync(LIST_PATH)) return bySlug;
  try {
    const list = JSON.parse(readFileSync(LIST_PATH, 'utf8'));
    for (const row of list) {
      if (!row?.slug) continue;
      const keys = new Set([row.slug, row.name, row.name_en, ...(row.searchKeys || [])]);
      bySlug.set(row.slug, keys);
    }
  } catch {
    /* ignore */
  }
  return bySlug;
}

export function buildSpotLookup(spots) {
  const lookup = new Map();
  const bySlug = new Map(spots.map((s) => [s.slug, s]));

  const add = (key, spot) => {
    if (key == null || key === '' || !spot) return;
    const variants = placeIdVariants(key);
    for (const v of variants) {
      const k = normalizePlaceKey(v) || String(v).trim();
      if (k && !lookup.has(k)) lookup.set(k, spot);
    }
  };

  for (const spot of spots) {
    add(spot.id, spot);
    add(spot.slug, spot);
    add(spot.name, spot);
    add(spot.name_en, spot);
    for (const kw of spot.keywords || []) add(kw, spot);
  }

  const searchBySlug = loadSearchKeysBySlug();
  for (const spot of spots) {
    for (const k of searchBySlug.get(spot.slug) || []) add(k, spot);
  }

  for (const [placeId, slug] of Object.entries(TRAVEL_SPOT_PLACE_ID_ALIASES)) {
    const spot = bySlug.get(slug);
    if (!spot) continue;
    for (const v of placeIdVariants(placeId)) add(v, spot);
    add(placeId, spot);
  }

  return lookup;
}

function resolveFuzzy(spots, placeId) {
  const core = normalizePlaceKey(String(placeId).replace(STRIP_SUFFIX_RE, '').replace(STRIP_INFIX_RE, ''));
  if (core.length < 2) return null;

  const candidates = spots.filter((s) => {
    const sn = normalizePlaceKey(s.name);
    const sen = normalizePlaceKey(s.name_en);
    const matchKo = sn.length >= 2 && (sn === core || sn.includes(core) || core.includes(sn));
    const matchEn = sen.length >= 2 && (sen === core || sen.includes(core) || core.includes(sen));
    return matchKo || matchEn;
  });

  if (candidates.length === 1) return { spot: candidates[0], matchKind: 'fuzzy' };
  return null;
}

/**
 * @param {Map<string, object>} lookup
 * @param {object[]} spots
 * @param {string} placeId
 * @returns {{ spot: object, matchKind: string } | null}
 */
export function resolveTravelSpotFromPlaceId(lookup, spots, placeId) {
  const raw = String(placeId ?? '').trim();
  if (!raw) return null;
  if (isBlocklistedPlaceId(raw)) return null;

  for (const v of placeIdVariants(raw)) {
    const hit = lookup.get(normalizePlaceKey(v)) || lookup.get(v.toLowerCase());
    if (hit) {
      const aliasHit = Object.entries(TRAVEL_SPOT_PLACE_ID_ALIASES).some(([alias, slug]) => {
        if (slug !== hit.slug) return false;
        return placeIdVariants(alias).some((a) => normalizePlaceKey(a) === normalizePlaceKey(v));
      });
      return { spot: hit, matchKind: aliasHit ? 'alias' : 'lookup' };
    }
  }

  return resolveFuzzy(spots, raw);
}
