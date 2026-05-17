import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { RENTAL_AIRPORT_HUBS, DEFAULT_HUB_RADIUS_KM } from '../src/utils/rentalAirportHubs.js';
import {
  distanceKm,
  resolveRentalAirport,
  resolveRentalPickupBannerInfo
} from '../src/utils/rentalAirportMatch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'rental-airport-audit.json');

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
    staticMapCandidates: staticMapCandidates.length
  },
  noBanner,
  geoGaps,
  farMatch: farMatch.slice(0, 50),
  staticMapCandidates: staticMapCandidates.slice(0, 80)
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), 'utf-8');

console.log('Hub count:', report.hubCount);
console.log('Spots:', report.spotCount);
console.log('Banner — single:', singleCount, 'multi:', multiCount, 'none:', noBanner.length);
console.log('Geo gaps (no hub in radius, nearest <600km):', geoGaps.length);
console.log('Far match (resolved >> nearest):', farMatch.length);
console.log('\nWrote', OUTPUT_JSON);

console.log('\n--- No banner (first 25) ---');
for (const g of noBanner.slice(0, 25)) {
  console.log(
    `${g.slug} (${g.name}, ${g.country}): nearest ${g.nearestHub} ${g.nearestKm}km, resolved ${g.resolvedIata ?? '-'}`
  );
}
if (noBanner.length > 25) console.log(`... and ${noBanner.length - 25} more (see JSON)`);
