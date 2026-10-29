/**
 * Site search — all assets: canonical regionKey (= sigungu hub id).
 *
 * Lazy-loaded module (dynamic import only). Not wired into search suggestions in PR-A.
 *
 * Logbook contract (PR-E will query DB): only public posts (`is_public=true`,
 * `is_deleted=false`). Free-text `destination` / `location` / `title` are matched here;
 * ambiguous or unresolved → `null` (post excluded from regional bundles, never force-matched).
 */

/** @typedef {string | null} RegionKey */

export const REGION_KEY_COORD_MAX_KM = 40;

/** @type {readonly { minLat: number, maxLat: number, minLng: number, maxLng: number, hubId: string }[]} */
const REGION_KEY_ISLAND_ZONES = [
  { minLat: 37.85, maxLat: 38.05, minLng: 124.5, maxLng: 124.85, hubId: 'ongjin' },
  { minLat: 37.4, maxLat: 37.65, minLng: 130.7, maxLng: 131.05, hubId: 'ulleung' },
  { minLat: 37.1, maxLat: 37.35, minLng: 131.75, maxLng: 132.05, hubId: 'ulleung' },
];

/** Tsushima / 対馬 — exclude from KR regionKey coord match */
const REGION_KEY_FOREIGN_EXCLUDE_ZONES = [
  { minLat: 33.75, maxLat: 34.55, minLng: 128.95, maxLng: 129.55 },
];

/** @type {Promise<any> | null} */
let contextPromise = null;

async function loadContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const [adminMatchMod, hubMod, sigunguMod, coordsMod] = await Promise.all([
        import('./regionKeyAdminMatch.js'),
        import('../cityAttractionHubs.js'),
        import('../../data/koreaSigunguByHub.json'),
        import('../../../Korea/resolveKoreaAreaFromCoords.js'),
      ]);

      const sigunguJson = sigunguMod.default ?? sigunguMod;
      const byHub = sigunguJson?.byHubId || {};
      /** @type {Map<string, string>} */
      const tourCodeToHub = new Map();
      /** @type {Set<string>} */
      const hubIdSet = new Set();

      for (const [hubId, row] of Object.entries(byHub)) {
        const key = String(hubId || '').trim().toLowerCase();
        if (!key) continue;
        hubIdSet.add(key);
        const areaCode = String(row?.areaCode || '').trim();
        const sigunguCode = String(row?.sigunguCode || '').trim();
        if (areaCode && sigunguCode) {
          tourCodeToHub.set(`${areaCode}|${sigunguCode}`, key);
        }
      }

      const logbookLabels = buildLogbookLabelIndex(hubMod.listCityAttractionHubs());

      return {
        matchRegionKeyAdminFromAddr: adminMatchMod.matchRegionKeyAdminFromAddr,
        isAmbiguousSigunguTextWithoutSido: adminMatchMod.isAmbiguousSigunguTextWithoutSido,
        resolveCityAttractionHub: hubMod.resolveCityAttractionHub,
        resolveHubPlaceFromSlug: hubMod.resolveHubPlaceFromSlug,
        resolveHubAttraction: hubMod.resolveHubAttraction,
        tourCodeToHub,
        hubIdSet,
        logbookLabels,
        resolveKoreaAreaFromCoords: coordsMod.resolveKoreaAreaFromCoords,
      };
    })();
  }
  return contextPromise;
}

/** Test / warm-up hook — loads lazy deps once. */
export async function preloadRegionKeyResolve() {
  return loadContext();
}

function normalizeHubId(raw) {
  const key = String(raw ?? '')
    .trim()
    .toLowerCase();
  return key || '';
}

function normalizeCompact(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function inBbox(lat, lng, box) {
  return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;
}

function resolveRegionKeyFromLatLng(lat, lng, resolveKoreaAreaFromCoords) {
  for (const box of REGION_KEY_FOREIGN_EXCLUDE_ZONES) {
    if (inBbox(lat, lng, box)) return null;
  }
  for (const zone of REGION_KEY_ISLAND_ZONES) {
    if (inBbox(lat, lng, zone)) return normalizeHubId(zone.hubId);
  }
  const hit = resolveKoreaAreaFromCoords(lat, lng);
  if (!hit?.hubId) return null;
  if (Number(hit.km) > REGION_KEY_COORD_MAX_KM) return null;
  return normalizeHubId(hit.hubId);
}

function buildLogbookLabelIndex(hubs) {
  /** @type {{ label: string, labelKey: string, hubId: string }[]} */
  const entries = [];
  const seen = new Set();

  for (const hub of hubs) {
    const hubId = normalizeHubId(hub?.hubId);
    if (!hubId) continue;
    const labels = [hub.name, ...(hub.aliases || [])].filter(Boolean);
    for (const label of labels) {
      const text = String(label).trim().normalize('NFC');
      if (!text) continue;
      const labelKey = normalizeCompact(text);
      if (!labelKey) continue;
      const dedupe = `${hubId}|${labelKey}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      entries.push({ label: text, labelKey, hubId });
    }
  }

  entries.sort((a, b) => b.label.length - a.label.length);
  return entries;
}

function tourCoordsToLatLng(asset) {
  const lat = Number(asset?.lat ?? asset?.latitude);
  const lng = Number(asset?.lng ?? asset?.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  const mapy = Number(asset?.mapy);
  const mapx = Number(asset?.mapx);
  if (Number.isFinite(mapx) && Number.isFinite(mapy)) {
    return { lat: mapy, lng: mapx };
  }
  return null;
}

function resolveFromTourApiSync(ctx, asset) {
  const areaCode = String(asset?.areaCode ?? asset?.area_code ?? '').trim();
  const sigunguCode = String(asset?.sigunguCode ?? asset?.sigungu_code ?? '').trim();
  if (areaCode && sigunguCode) {
    const hit = ctx.tourCodeToHub.get(`${areaCode}|${sigunguCode}`);
    if (hit) return hit;
  }
  const addr1 = String(asset?.addr1 ?? asset?.address ?? '').trim();
  if (addr1) {
    const region = ctx.matchRegionKeyAdminFromAddr(addr1);
    if (region?.hubId) return region.hubId;
  }
  return null;
}

function resolveFromPlaceSlugSync(ctx, slug) {
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized) return null;

  const hubHit = ctx.resolveCityAttractionHub(normalized);
  if (hubHit?.hubId) return normalizeHubId(hubHit.hubId);

  const pin = ctx.resolveHubPlaceFromSlug(normalized);
  if (pin?.hubId) return normalizeHubId(pin.hubId);

  const attraction = ctx.resolveHubAttraction(normalized);
  if (attraction?.hub?.hubId) return normalizeHubId(attraction.hub.hubId);

  return null;
}

function resolveLogbookTextSync(ctx, parts) {
  const text = parts
    .map((p) => String(p ?? '').trim())
    .filter(Boolean)
    .join(' ')
    .normalize('NFC');
  if (!text) return null;

  const adminHit = ctx.matchRegionKeyAdminFromAddr(text);
  if (adminHit?.hubId) return normalizeHubId(adminHit.hubId);

  if (ctx.isAmbiguousSigunguTextWithoutSido(text)) return null;

  /** @type {Set<string>} */
  const matched = new Set();

  for (const { label, labelKey, hubId } of ctx.logbookLabels) {
    if (ctx.isAmbiguousSigunguTextWithoutSido(label)) continue;
    if (labelKey.length < 3) {
      const tokens = text.split(/[\s,·/|，、]+/).filter(Boolean);
      if (tokens.some((tok) => normalizeCompact(tok) === labelKey)) {
        matched.add(hubId);
      }
      continue;
    }
    if (text.includes(label)) {
      matched.add(hubId);
      continue;
    }
    if (/^[a-z0-9]+$/i.test(labelKey) && text.toLowerCase().includes(labelKey)) {
      matched.add(hubId);
    }
  }

  if (matched.size !== 1) return null;
  return [...matched][0];
}

/**
 * @param {object} ctx
 * @param {{ destination?: string, location?: string, title?: string }} fields
 */
function resolveLogbookFieldsSync(ctx, fields) {
  const { destination, location, title } = fields || {};
  return resolveLogbookTextSync(ctx, [destination, location, title]);
}

/**
 * @param {string | null | undefined} hubId
 * @returns {Promise<RegionKey>}
 */
export async function resolveRegionKeyFromHubId(hubId) {
  const ctx = await loadContext();
  const key = normalizeHubId(hubId);
  if (!key) return null;
  if (ctx.hubIdSet.has(key)) return key;
  if (ctx.resolveCityAttractionHub(key)?.hubId) return normalizeHubId(key);
  return null;
}

/**
 * @param {string | null | undefined} placeSlug
 * @returns {Promise<RegionKey>}
 */
export async function resolveRegionKeyFromPlaceSlug(placeSlug) {
  const ctx = await loadContext();
  return resolveFromPlaceSlugSync(ctx, placeSlug);
}

/**
 * @param {string | null | undefined} addr1
 * @returns {Promise<RegionKey>}
 */
export async function resolveRegionKeyFromAddr(addr1) {
  const ctx = await loadContext();
  const region = ctx.matchRegionKeyAdminFromAddr(addr1);
  return region?.hubId ? normalizeHubId(region.hubId) : null;
}

/**
 * @param {{ lat?: number, lng?: number, mapx?: number, mapy?: number, latitude?: number, longitude?: number }} coords
 * @returns {Promise<RegionKey>}
 */
export async function resolveRegionKeyFromCoords(coords) {
  const ctx = await loadContext();
  const pair = tourCoordsToLatLng(coords);
  if (!pair) return null;
  return resolveRegionKeyFromLatLng(pair.lat, pair.lng, ctx.resolveKoreaAreaFromCoords);
}

/**
 * TourAPI row shape (+ addr1 / mapx / mapy fallbacks).
 * @param {object} asset
 * @returns {Promise<RegionKey>}
 */
export async function resolveRegionKeyFromTourApi(asset) {
  const ctx = await loadContext();
  const fromCodes = resolveFromTourApiSync(ctx, asset);
  if (fromCodes) return fromCodes;
  const pair = tourCoordsToLatLng(asset);
  if (pair) {
    const fromCoords = resolveRegionKeyFromLatLng(
      pair.lat,
      pair.lng,
      ctx.resolveKoreaAreaFromCoords,
    );
    if (fromCoords) return fromCoords;
  }
  return null;
}

/**
 * Logbook public-post text fields only (no DB access here).
 * @param {{ destination?: string, location?: string, title?: string }} fields
 * @returns {Promise<RegionKey>}
 */
export async function resolveRegionKeyFromLogbookText(fields) {
  const ctx = await loadContext();
  return resolveLogbookFieldsSync(ctx, fields);
}

/**
 * Unified asset resolver — first successful strategy wins (hubId → slug → tour → addr → coords → logbook text).
 * @param {object} asset
 * @returns {Promise<RegionKey>}
 */
export async function resolveRegionKey(asset) {
  if (!asset || typeof asset !== 'object') return null;
  const ctx = await loadContext();

  const explicit = normalizeHubId(asset.hubId ?? asset.hub_id);
  if (explicit && (ctx.hubIdSet.has(explicit) || ctx.resolveCityAttractionHub(explicit))) {
    return explicit;
  }

  const slug = asset.placeSlug ?? asset.place_slug;
  if (slug) {
    const fromSlug = resolveFromPlaceSlugSync(ctx, slug);
    if (fromSlug) return fromSlug;
  }

  const fromTour = resolveFromTourApiSync(ctx, asset);
  if (fromTour) return fromTour;

  const addr = asset.addr1 ?? asset.address;
  if (addr) {
    const region = ctx.matchRegionKeyAdminFromAddr(addr);
    if (region?.hubId) return normalizeHubId(region.hubId);
  }

  const pair = tourCoordsToLatLng(asset);
  if (pair) {
    const fromCoords = resolveRegionKeyFromLatLng(
      pair.lat,
      pair.lng,
      ctx.resolveKoreaAreaFromCoords,
    );
    if (fromCoords) return fromCoords;
  }

  if (asset.destination != null || asset.location != null || asset.title != null) {
    return resolveLogbookFieldsSync(ctx, asset);
  }

  return null;
}
