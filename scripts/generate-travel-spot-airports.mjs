import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';
import {
  RENTAL_MULTI_AIRPORT_DESTINATIONS,
  distanceKm,
  resolveRentalPickupBannerInfo
} from '../src/utils/rentalAirportMatch.js';
import {
  TRAVEL_SPOT_AIRPORT_OVERRIDES,
  TRAVEL_SPOT_PLACE_ID_OVERRIDES
} from './data/travel-spot-airport-overrides.mjs';
import { normalizePlaceKey, placeIdVariants } from './lib/travel-spot-place-resolve.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/travelSpotAirports.json');

const hubByIata = new Map(RENTAL_AIRPORT_HUBS.map((h) => [h.iata, h]));

function loadExistingAirportMap() {
  try {
    return JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  } catch {
    return { spots: {}, placeIds: {} };
  }
}

function nearestHub(lat, lng) {
  let best = null;
  let bestD = Infinity;
  for (const h of RENTAL_AIRPORT_HUBS) {
    const d = distanceKm(lat, lng, h.lat, h.lng);
    if (d < bestD) {
      bestD = d;
      best = h;
    }
  }
  return best ? { iata: best.iata, km: bestD } : null;
}

function filterRegisteredIatas(codes) {
  return codes.filter((c) => hubByIata.has(c));
}

function rowFromBanner(spot, banner) {
  if (!banner) return null;
  if (banner.kind === 'single') {
    if (!banner.iata || !hubByIata.has(banner.iata)) return null;
    return {
      primaryIatas: [banner.iata],
      preferredLinkIata: banner.iata,
      kind: 'single',
      source: 'runtime-infer',
      confidence: 'medium'
    };
  }
  const iatas = filterRegisteredIatas(banner.airports.map((a) => a.iata));
  if (!iatas.length) return null;
  const link = banner.linkHub?.iata && iatas.includes(banner.linkHub.iata) ? banner.linkHub.iata : iatas[0];
  return {
    primaryIatas: iatas,
    preferredLinkIata: link,
    kind: iatas.length > 1 ? 'multi' : 'single',
    source: 'runtime-infer',
    confidence: 'medium',
    ...(banner.bannerNote ? { bannerNote: banner.bannerNote } : {})
  };
}

function flightRouteWaypointsFromOverride(override) {
  if (!Array.isArray(override?.flightRouteWaypoints) || !override.flightRouteWaypoints.length) {
    return {};
  }
  const flightRouteWaypoints = override.flightRouteWaypoints
    .slice(0, 3)
    .filter((wp) => Array.isArray(wp) && wp.length >= 2)
    .map((wp) => [Number(wp[0]), Number(wp[1])])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
  return flightRouteWaypoints.length ? { flightRouteWaypoints } : {};
}

function flightRouteHubIatasFromOverride(override) {
  if (Array.isArray(override?.flightRouteHubIatas) && override.flightRouteHubIatas.length) {
    const flightRouteHubIatas = filterRegisteredIatas(override.flightRouteHubIatas).slice(0, 3);
    return flightRouteHubIatas.length ? { flightRouteHubIatas } : {};
  }
  const trip = String(override.tripFlightArrivalIata ?? '').trim().toUpperCase();
  const preferred = String(override.preferredLinkIata ?? override.primaryIatas?.[0] ?? '')
    .trim()
    .toUpperCase();
  if (trip.length === 3 && preferred.length === 3 && trip !== preferred && hubByIata.has(trip)) {
    return { flightRouteHubIatas: [trip] };
  }
  return {};
}

function rowFromOverride(override) {
  const iatas = filterRegisteredIatas(override.primaryIatas);
  if (!iatas.length) return null;
  const link =
    override.preferredLinkIata && iatas.includes(override.preferredLinkIata)
      ? override.preferredLinkIata
      : iatas[0];
  return {
    primaryIatas: iatas,
    preferredLinkIata: link,
    kind: override.kind ?? (iatas.length > 1 ? 'multi' : 'single'),
    source: 'curated-override',
    confidence: override.confidence ?? 'high',
    ...(override.bannerNote ? { bannerNote: override.bannerNote } : {}),
    ...(override.rationale ? { rationale: override.rationale } : {}),
    ...(Array.isArray(override.searchHintIatas) && override.searchHintIatas.length
      ? { searchHintIatas: filterRegisteredIatas(override.searchHintIatas) }
      : {}),
    ...(override.klookRentalHomeSearchLabel
      ? { klookRentalHomeSearchLabel: String(override.klookRentalHomeSearchLabel).trim() }
      : {}),
    ...(override.klookRentalSearchLabel
      ? { klookRentalSearchLabel: String(override.klookRentalSearchLabel).trim() }
      : {}),
    ...(override.klookRentalSearchMode ? { klookRentalSearchMode: override.klookRentalSearchMode } : {}),
    ...(override.tripFlightArrivalIata
      ? { tripFlightArrivalIata: String(override.tripFlightArrivalIata).trim().toUpperCase() }
      : {}),
    ...flightRouteWaypointsFromOverride(override),
    ...flightRouteHubIatasFromOverride(override),
  };
}

function matchesMultiRule(spot, row) {
  const hay = `${spot.slug || ''} ${spot.name || ''} ${spot.name_en || ''}`.toLowerCase().replace(/-/g, ' ');
  for (const p of row.phrases) {
    const pl = p.toLowerCase();
    if (pl.length >= 2 && hay.includes(pl)) return true;
  }
  return false;
}

function rowFromMultiRule(spot) {
  for (const row of RENTAL_MULTI_AIRPORT_DESTINATIONS) {
    if (!matchesMultiRule(spot, row)) continue;
    const iatas = filterRegisteredIatas(row.iataCodes);
    if (!iatas.length) return null;
    const link = row.preferredLinkIata && iatas.includes(row.preferredLinkIata) ? row.preferredLinkIata : iatas[0];
    return {
      primaryIatas: iatas,
      preferredLinkIata: link,
      kind: 'multi',
      source: 'multi-rule',
      confidence: 'high',
      ...(row.bannerNote ? { bannerNote: row.bannerNote } : {})
    };
  }
  return null;
}

function rowFromNearest(spot) {
  const near = nearestHub(spot.lat, spot.lng);
  if (!near) return null;
  const confidence = near.km <= 200 ? 'medium' : near.km <= 450 ? 'low' : 'very-low';
  return {
    primaryIatas: [near.iata],
    preferredLinkIata: near.iata,
    kind: 'single',
    source: 'geo-nearest',
    confidence,
    rationale: `최근접 등록 허브 ${near.iata} (${Math.round(near.km)}km)`
  };
}

const existingAirportMap = loadExistingAirportMap();
const existingSpots = existingAirportMap.spots ?? {};

/** JSON에만 있는 검수 행 — overrides.mjs에 없을 때만 유지 (generate가 curated를 runtime으로 덮어쓰지 않도록) */
const curatedPreserved = {};
const toolkitSyncPreserved = {};
for (const [slug, row] of Object.entries(existingSpots)) {
  if (row?.source === 'curated-override') curatedPreserved[slug] = row;
  else if (row?.source === 'toolkit-sync') toolkitSyncPreserved[slug] = row;
}
const preservedPlaceIds = existingAirportMap.placeIds ?? {};

function rowFromPlaceIdOverride(override) {
  const iatas = (override.primaryIatas ?? []).filter((c) => hubByIata.has(c));
  if (!iatas.length) return null;
  const preferred =
    override.preferredLinkIata && iatas.includes(override.preferredLinkIata)
      ? override.preferredLinkIata
      : iatas[0];
  const hints = Array.isArray(override.searchHintIatas)
    ? override.searchHintIatas.filter((c) => hubByIata.has(c))
    : [];
  return {
    primaryIatas: iatas,
    preferredLinkIata: preferred,
    kind: override.kind ?? (iatas.length > 1 ? 'multi' : 'single'),
    source: 'curated-override',
    confidence: override.confidence ?? 'high',
    ...(override.bannerNote ? { bannerNote: override.bannerNote } : {}),
    ...(override.rationale ? { rationale: override.rationale } : {}),
    ...(hints.length ? { searchHintIatas: hints } : {}),
    ...(override.tripFlightArrivalIata
      ? { tripFlightArrivalIata: String(override.tripFlightArrivalIata).trim().toUpperCase() }
      : {}),
    ...flightRouteWaypointsFromOverride(override),
    ...flightRouteHubIatasFromOverride(override),
  };
}

function mergePlaceIdOverrides(placeIds) {
  const merged = { ...placeIds };
  for (const [placeId, override] of Object.entries(TRAVEL_SPOT_PLACE_ID_OVERRIDES)) {
    const row = rowFromPlaceIdOverride(override);
    if (!row) continue;
    const base = { ...row, placeId };
    for (const v of placeIdVariants(placeId)) {
      const key = normalizePlaceKey(v);
      if (key) merged[key] = base;
    }
  }
  return merged;
}

function primaryIataKey(row) {
  return (row?.primaryIatas ?? []).slice().sort().join(',');
}

/** overrides에 searchHintIatas가 없을 때 JSON 검수값 유지 */
function mergeSearchHintFromExisting(row, existingRow) {
  if (!row || !existingRow?.searchHintIatas?.length) return row;
  if (Array.isArray(row.searchHintIatas) && row.searchHintIatas.length) return row;
  const hints = filterRegisteredIatas(existingRow.searchHintIatas);
  if (!hints.length) return row;
  return { ...row, searchHintIatas: hints };
}

const map = {};
const stats = { override: 0, curatedPreserved: 0, toolkitSync: 0, runtime: 0, multiRule: 0, geo: 0, missing: 0 };
const missingSlugs = [];
const unregisteredIatas = new Set();
const overrideDriftWarnings = [];

for (const spot of TRAVEL_SPOTS) {
  const slug = spot.slug;
  let row = null;

  const override = TRAVEL_SPOT_AIRPORT_OVERRIDES[slug];
  const existingRow = existingSpots[slug];

  if (override) {
    for (const code of override.primaryIatas) {
      if (!hubByIata.has(code)) unregisteredIatas.add(code);
    }
    row = rowFromOverride(override);
    if (row) {
      row = mergeSearchHintFromExisting(row, existingRow);
      stats.override += 1;
      if (
        existingRow?.source === 'curated-override' &&
        primaryIataKey(existingRow) !== primaryIataKey(row)
      ) {
        overrideDriftWarnings.push({
          slug,
          from: existingRow.primaryIatas,
          to: row.primaryIatas
        });
      }
    }
  }

  if (!row && curatedPreserved[slug]) {
    row = curatedPreserved[slug];
    stats.curatedPreserved += 1;
  }

  if (!row && toolkitSyncPreserved[slug]) {
    row = toolkitSyncPreserved[slug];
    stats.toolkitSync += 1;
  }

  if (!row) {
    const banner = resolveRentalPickupBannerInfo(spot, { ignoreStaticAirportMap: true });
    row = rowFromBanner(spot, banner);
    if (row) stats.runtime += 1;
  }

  if (!row) {
    row = rowFromMultiRule(spot);
    if (row) stats.multiRule += 1;
  }

  if (!row) {
    row = rowFromNearest(spot);
    if (row) stats.geo += 1;
  }

  if (!row) {
    stats.missing += 1;
    missingSlugs.push(slug);
    continue;
  }

  map[slug] = row;
}

const output = {
  _meta: {
    version: 1,
    generatedAt: new Date().toISOString(),
    spotCount: Object.keys(map).length,
    placeIdCount: Object.keys(preservedPlaceIds).length,
    stats,
    missingSlugs,
    unregisteredIatasInOverrides: [...unregisteredIatas].sort(),
    runtimePriorityNote:
      '런타임: curated/high 오버라이드 > 툴킷 essential_guide > toolkit-sync(placeIds·spots) > runtime-infer > multi-rule·좌표.',
    generatePreserveNote:
      'generate: overrides.mjs > JSON curated-override(overrides 없을 때) > JSON toolkit-sync > runtime-infer. overrides가 JSON curated와 다르면 overrides 우선(경고 출력).'
  },
  spots: map,
  placeIds: mergePlaceIdOverrides(preservedPlaceIds)
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

console.log('Wrote', OUTPUT_PATH);
console.log('Mapped:', Object.keys(map).length, '/', TRAVEL_SPOTS.length);
console.log('Stats:', stats);
if (unregisteredIatas.size) {
  console.log('\nUnregistered IATA in overrides (add to rentalAirportHubs.js):', [...unregisteredIatas].sort().join(', '));
}
if (missingSlugs.length) {
  console.log('\nStill missing:', missingSlugs.join(', '));
}
if (stats.curatedPreserved) {
  console.log('\nPreserved JSON curated-override (no overrides.mjs entry):', stats.curatedPreserved);
}
if (overrideDriftWarnings.length) {
  console.log(
    '\nWarning: overrides.mjs replaced existing curated primaryIatas for:',
    overrideDriftWarnings.map((w) => `${w.slug} [${w.from?.join(',')}] → [${w.to?.join(',')}]`).join('; ')
  );
}
