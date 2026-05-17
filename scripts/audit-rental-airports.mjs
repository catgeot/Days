import { readFileSync } from 'fs';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';
import { resolveRentalAirport, distanceKm } from '../src/utils/rentalAirportMatch.js';

const hubIatas = new Set(RENTAL_AIRPORT_HUBS.map((h) => h.iata));

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

const gaps = [];
const aliasOnly = [];
const farMatch = [];

for (const spot of TRAVEL_SPOTS) {
  const lat = spot.lat;
  const lng = spot.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

  const nearest = nearestHubDist(lat, lng);
  const resolved = resolveRentalAirport(spot);
  const withinRadius = RENTAL_AIRPORT_HUBS.some((h) => {
    const maxR = h.radiusKm ?? 320;
    return distanceKm(lat, lng, h.lat, h.lng) <= maxR;
  });

  if (!withinRadius && nearest.d < 600) {
    gaps.push({
      slug: spot.slug,
      name: spot.name,
      country: spot.country,
      nearest: nearest.iata,
      nearestKm: Math.round(nearest.d),
      resolved: resolved?.iata
    });
  }

  if (resolved?.iata && nearest.d > 150 && distanceKm(lat, lng, RENTAL_AIRPORT_HUBS.find((h) => h.iata === resolved.iata).lat, RENTAL_AIRPORT_HUBS.find((h) => h.iata === resolved.iata).lng) > nearest.d + 80) {
    farMatch.push({
      slug: spot.slug,
      name: spot.name,
      resolved: resolved.iata,
      nearest: nearest.iata,
      nearestKm: Math.round(nearest.d)
    });
  }
}

gaps.sort((a, b) => a.nearestKm - b.nearestKm);
farMatch.sort((a, b) => a.nearestKm - b.nearestKm);

console.log('Hub count:', hubIatas.size);
console.log('\n--- Spots with NO hub within radius (nearest < 600km) ---');
for (const g of gaps.slice(0, 40)) {
  console.log(`${g.slug} (${g.name}, ${g.country}): nearest ${g.nearest} ${g.nearestKm}km, resolved ${g.resolved ?? '-'}`);
}
if (gaps.length > 40) console.log(`... and ${gaps.length - 40} more`);

console.log('\n--- Resolved hub much farther than geographic nearest ---');
for (const f of farMatch.slice(0, 25)) {
  console.log(`${f.slug} (${f.name}): resolved ${f.resolved}, geo-nearest ${f.nearest} ${f.nearestKm}km`);
}
