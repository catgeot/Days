import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { RENTAL_AIRPORT_HUBS, DEFAULT_HUB_RADIUS_KM } from '../src/utils/rentalAirportHubs.js';
import {
  distanceKm,
  resolveRentalAirport,
  resolveRentalPickupBannerInfo,
  resolveCinemaDestIata,
  resolvePlannerFlightArrivalIata
} from '../src/utils/rentalAirportMatch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'rental-airport-audit.json');
const STATIC_AIRPORTS_PATH = join(__dirname, '../src/pages/Home/data/travelSpotAirports.json');

const hubByIata = new Map(RENTAL_AIRPORT_HUBS.map((h) => [h.iata, h]));
const hubIatas = new Set(hubByIata.keys());

function nearestHubDist(lat, lng) {
  let best = Infinity;
  let bestIata = null;
  for (const h of RENTAL_AIRPORT_HUBS) {
    const d = distanceKm(lat, lng, h.lat, h.lng);
    if (d < best) {
      best = d;
      bestIata = h.iata;
    }
  }
  return { d: best, iata: bestIata };
}

function bannerSummary(info) {
  if (!info) return null;
  if (info.kind === 'single') {
    return { kind: 'single', iatas: info.iata ? [info.iata] : [], linkIata: info.iata };
  }
  return {
    kind: 'multi',
    iatas: info.airports.map((a) => a.iata),
    linkIata: info.linkHub?.iata
  };
}

const geoGaps = [];
const farMatch = [];
const noBanner = [];
const withBanner = [];
const staticMapCandidates = [];

let singleCount = 0;
let multiCount = 0;

for (const spot of TRAVEL_SPOTS) {
  const lat = spot.lat;
  const lng = spot.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

  const nearest = nearestHubDist(lat, lng);
  const resolved = resolveRentalAirport(spot);
  const banner = resolveRentalPickupBannerInfo(spot, {});
  const bannerMeta = bannerSummary(banner);

  const withinRadius = RENTAL_AIRPORT_HUBS.some((h) => {
    const maxR = h.radiusKm ?? DEFAULT_HUB_RADIUS_KM;
    return distanceKm(lat, lng, h.lat, h.lng) <= maxR;
  });

  const row = {
    slug: spot.slug,
    name: spot.name,
    name_en: spot.name_en,
    country: spot.country,
    continent: spot.continent,
    lat,
    lng,
    nearestHub: nearest.iata,
    nearestKm: Math.round(nearest.d),
    withinHubRadius: withinRadius,
    resolvedIata: resolved?.iata ?? null,
    banner: bannerMeta
  };

  if (!banner) {
    noBanner.push(row);
  } else {
    if (banner.kind === 'single') singleCount += 1;
    else multiCount += 1;
    withBanner.push(row);
  }

  if (!withinRadius && nearest.d < 600) {
    geoGaps.push({
      ...row,
      issue: 'no_hub_within_radius',
      suggestedHub: nearest.iata,
      hubRegistered: hubIatas.has(nearest.iata)
    });
  }

  if (resolved?.iata && nearest.d > 150) {
    const sh = hubByIata.get(resolved.iata);
    if (sh) {
      const dResolved = distanceKm(lat, lng, sh.lat, sh.lng);
      if (dResolved > nearest.d + 80) {
        farMatch.push({
          slug: spot.slug,
          name: spot.name,
          resolved: resolved.iata,
          resolvedKm: Math.round(dResolved),
          nearest: nearest.iata,
          nearestKm: Math.round(nearest.d)
        });
      }
    }
  }

  if (!banner && nearest.iata && hubIatas.has(nearest.iata)) {
    staticMapCandidates.push({
      slug: spot.slug,
      name: spot.name,
      suggestedIatas: [nearest.iata],
      nearestKm: Math.round(nearest.d),
      note: withinRadius ? 'expand_radius_or_static_map' : 'add_hub_or_static_map'
    });
  }
}

geoGaps.sort((a, b) => a.nearestKm - b.nearestKm);
farMatch.sort((a, b) => a.nearestKm - b.nearestKm);
noBanner.sort((a, b) => a.nearestKm - b.nearestKm);

/** generate가 넣은 runtime-infer 등 — 최근접 허브와 다르면 툴킷·관문 공항 검수 후보 */
const inferNearestMismatch = [];
try {
  const staticAirports = JSON.parse(readFileSync(STATIC_AIRPORTS_PATH, 'utf-8'));
  const spotMap = staticAirports.spots ?? {};
  for (const spot of TRAVEL_SPOTS) {
    const row = spotMap[spot.slug];
    if (!row?.primaryIatas?.length) continue;
    if (row.source !== 'runtime-infer' && row.source !== 'geo-nearest') continue;
    const nearest = nearestHubDist(spot.lat, spot.lng);
    const primary = row.primaryIatas[0];
    if (!primary || primary === nearest.iata) continue;
    const primaryHub = hubByIata.get(primary);
    const nearestHub = hubByIata.get(nearest.iata);
    if (!primaryHub || !nearestHub) continue;
    const primaryKm = distanceKm(spot.lat, spot.lng, primaryHub.lat, primaryHub.lng);
    if (nearest.d + 25 < primaryKm) {
      inferNearestMismatch.push({
        slug: spot.slug,
        name: spot.name,
        staticPrimary: primary,
        staticPrimaryKm: Math.round(primaryKm),
        nearestHub: nearest.iata,
        nearestKm: Math.round(nearest.d),
        note: '툴킷 여정과 다를 수 있음 — overrides 검수 또는 툴킷 로드 시 자동 보정'
      });
    }
  }
  inferNearestMismatch.sort((a, b) => b.staticPrimaryKm - a.staticPrimaryKm);
} catch (err) {
  console.warn('[audit:airports] inferNearestMismatch skipped:', err.message);
}

/**
 * 시네마 dest는 있는데 Trip 도착이 비거나, cinema dest가 허브 미등록인 경우
 * (상태바만 IATA 표시 · aAirportCode 누락 유형)
 */
const cinemaTripGap = [];
function pushCinemaTripGap(entry) {
  cinemaTripGap.push(entry);
}

for (const spot of TRAVEL_SPOTS) {
  const lat = spot.lat;
  const lng = spot.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

  const cinemaDest = resolveCinemaDestIata(spot, {});
  if (!cinemaDest) continue;

  const tripDest = resolvePlannerFlightArrivalIata(spot, {});
  const cinemaInHubs = hubIatas.has(cinemaDest);
  const tripMissing = !tripDest;
  const cinemaNotInHubs = !cinemaInHubs;

  if (tripMissing || cinemaNotInHubs) {
    pushCinemaTripGap({
      key: spot.slug,
      name: spot.name,
      kind: 'slug',
      cinemaDest,
      tripDest: tripDest ?? null,
      cinemaInHubs,
      hubRegistered: cinemaInHubs,
      issue: tripMissing ? 'trip_missing' : 'cinema_dest_not_in_hubs'
    });
  }
}

try {
  const staticAirports = JSON.parse(readFileSync(STATIC_AIRPORTS_PATH, 'utf-8'));
  const placeIds = staticAirports.placeIds ?? {};
  for (const [placeId, row] of Object.entries(placeIds)) {
    const preferred = String(row?.preferredLinkIata ?? row?.primaryIatas?.[0] ?? '')
      .trim()
      .toUpperCase();
    const tripOverride = String(row?.tripFlightArrivalIata ?? '')
      .trim()
      .toUpperCase();
    const cinemaDest = preferred.length === 3 ? preferred : null;
    if (!cinemaDest) continue;

    const location = {
      name: placeId,
      place_id: placeId,
      lat: typeof row.lat === 'number' ? row.lat : undefined,
      lng: typeof row.lng === 'number' ? row.lng : undefined
    };
    const tripDest =
      (tripOverride.length === 3 && hubIatas.has(tripOverride) ? tripOverride : null) ||
      resolvePlannerFlightArrivalIata(location, {}) ||
      (hubIatas.has(cinemaDest) ? cinemaDest : null);

    const cinemaInHubs = hubIatas.has(cinemaDest);
    const tripMissing = !tripDest;
    const cinemaNotInHubs = !cinemaInHubs;

    if (tripMissing || cinemaNotInHubs) {
      pushCinemaTripGap({
        key: placeId,
        name: placeId,
        kind: 'placeId',
        cinemaDest,
        tripDest: tripDest ?? null,
        cinemaInHubs,
        hubRegistered: cinemaInHubs,
        issue: tripMissing ? 'trip_missing' : 'cinema_dest_not_in_hubs'
      });
    }
  }
} catch (err) {
  console.warn('[audit:airports] cinemaTripGap placeIds skipped:', err.message);
}

cinemaTripGap.sort((a, b) => String(a.key).localeCompare(String(b.key)));

const report = {
  generatedAt: new Date().toISOString(),
  hubCount: hubIatas.size,
  spotCount: TRAVEL_SPOTS.length,
  summary: {
    withBanner: withBanner.length,
    noBanner: noBanner.length,
    single: singleCount,
    multi: multiCount,
    geoGaps: geoGaps.length,
    farMatch: farMatch.length,
    staticMapCandidates: staticMapCandidates.length,
    inferNearestMismatch: inferNearestMismatch.length,
    cinemaTripGap: cinemaTripGap.length
  },
  noBanner,
  geoGaps,
  farMatch: farMatch.slice(0, 50),
  staticMapCandidates: staticMapCandidates.slice(0, 80),
  inferNearestMismatch: inferNearestMismatch.slice(0, 80),
  cinemaTripGap: cinemaTripGap.slice(0, 80)
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), 'utf-8');

console.log('Hub count:', report.hubCount);
console.log('Spots:', report.spotCount);
console.log('Banner — single:', singleCount, 'multi:', multiCount, 'none:', noBanner.length);
console.log('Geo gaps (no hub in radius, nearest <600km):', geoGaps.length);
console.log('Far match (resolved >> nearest):', farMatch.length);
console.log('Infer vs nearest (runtime-infer 검수 후보):', inferNearestMismatch.length);
console.log('Cinema/Trip gap (상태바 dest vs Trip aAirportCode):', cinemaTripGap.length);
console.log('\nWrote', OUTPUT_JSON);

console.log('\n--- No banner (first 25) ---');
for (const g of noBanner.slice(0, 25)) {
  console.log(
    `${g.slug} (${g.name}, ${g.country}): nearest ${g.nearestHub} ${g.nearestKm}km, resolved ${g.resolvedIata ?? '-'}`
  );
}
if (noBanner.length > 25) console.log(`... and ${noBanner.length - 25} more (see JSON)`);

if (cinemaTripGap.length) {
  console.log('\n--- Cinema/Trip gap (first 25) ---');
  for (const g of cinemaTripGap.slice(0, 25)) {
    console.log(
      `${g.kind} ${g.key}: cinema ${g.cinemaDest}, trip ${g.tripDest ?? 'null'}, ${g.issue}${g.hubRegistered ? '' : ' (hub missing)'}`
    );
  }
  if (cinemaTripGap.length > 25) console.log(`... and ${cinemaTripGap.length - 25} more (see JSON)`);
}
