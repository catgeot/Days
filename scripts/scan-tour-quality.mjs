/**
 * 3D tour quality scan — fallback gaps, pin–hub distance, curation priority.
 * Usage: node scripts/scan-tour-quality.mjs
 */
import fs from 'fs';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';

const ISLAND_TOUR_SLUGS = new Set([
  'maldives', 'seychelles', 'samoa', 'zanzibar', 'la-reunion', 'rarotonga',
  'aitutaki', 'boracay', 'bora-bora', 'mauritius', 'tahiti', 'langkawi', 'ibiza',
  'cebu', 'komodo-island', 'andaman-islands', 'jeju', 'hvar', 'sicily',
  'canary-islands', 'cocos-islands', 'falkland-islands', 'faroe-islands',
  'christmas-island', 'similan-islands', 'phi-phi-islands', 'bali', 'santorini',
  'phuket', 'madeira', 'crete', 'lombok', 'hawaii', 'palawan', 'bohol',
  'gili-meno', 'phu-quoc', 'el-nido', 'honolulu', 'kiribati', 'cape-verde',
  'bermuda', 'azores', 'corsica', 'miyakojima', 'ishigaki', 'bahamas', 'guam',
  'fernando-de-noronha'
]);

const landmarks = JSON.parse(
  fs.readFileSync('src/pages/Home/data/globeLandmarks.json', 'utf8')
);
const airports = JSON.parse(
  fs.readFileSync('src/pages/Home/data/travelSpotAirports.json', 'utf8')
);

const ISLAND_KW =
  /섬|아일랜드|아톨|군도|island|islands|atoll|archipelago/i;
const PIN_HUB_THRESH_KM = 25;

const spots = TRAVEL_SPOTS.map((s) => ({
  slug: s.slug,
  lat: Number(s.lat),
  lng: Number(s.lng),
  cat: s.primaryCategory || s.category || (s.categories && s.categories[0]) || null,
  keywords: Array.isArray(s.keywords) ? s.keywords.join(' ') : '',
  name: s.name || '',
  desc: s.desc || ''
})).filter((s) => s.slug && Number.isFinite(s.lat) && Number.isFinite(s.lng));

function hubForSlug(slug) {
  const entry = airports.spots?.[slug];
  const iata = entry?.preferredLinkIata || entry?.primaryIatas?.[0];
  if (!iata) return null;
  return RENTAL_AIRPORT_HUBS.find((h) => h.iata === iata) || null;
}

function km(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function usesIslandCinematic(s) {
  const blob = `${s.keywords}${s.name}${s.desc}`;
  return (
    s.cat === 'paradise' &&
    (ISLAND_TOUR_SLUGS.has(s.slug) || ISLAND_KW.test(blob))
  );
}

function scoreFallback(s, distKm) {
  let score = 10;
  if (usesIslandCinematic(s)) score += 100;
  else if (s.cat === 'paradise') score += 70;
  else if (s.cat === 'urban' || s.cat === 'culture') score += 40;
  else if (s.cat === 'nature' || s.cat === 'adventure') score += 30;
  if (distKm != null && distKm >= PIN_HUB_THRESH_KM) {
    score += Math.min(80, Math.round(distKm / 5));
  }
  if (ISLAND_TOUR_SLUGS.has(s.slug) && !landmarks[s.slug]) score += 50;
  return score;
}

const categoryFallback = spots
  .filter((s) => !landmarks[s.slug])
  .map((s) => {
    const hub = hubForSlug(s.slug);
    const distKm = hub ? Math.round(km(s.lat, s.lng, hub.lat, hub.lng)) : null;
    return {
      slug: s.slug,
      name: s.name,
      cat: s.cat,
      lat: s.lat,
      lng: s.lng,
      distKm,
      iata: hub?.iata ?? null,
      islandLike: usesIslandCinematic(s),
      score: scoreFallback(s, distKm)
    };
  })
  .sort((a, b) => b.score - a.score);

const thinLandmarks = Object.entries(landmarks)
  .filter(([, lm]) => {
    if (lm.keyframes?.length) return false;
    const t = lm.template || '';
    if (!/coastal|mountain|alpine|region/i.test(t)) return false;
    const hasApproach = Boolean(lm.orbit?.approachPoint || lm.orbit?.overviewCenter);
    return !hasApproach;
  })
  .map(([slug, lm]) => {
    const s = spots.find((x) => x.slug === slug);
    return {
      slug,
      name: s?.name || lm.landmarkName,
      template: lm.template || '(none)',
      cat: s?.cat,
      hasOrbit: Boolean(lm.orbit)
    };
  });

const pinHubFar = spots
  .map((s) => {
    const hub = hubForSlug(s.slug);
    if (!hub) return null;
    const distKm = Math.round(km(s.lat, s.lng, hub.lat, hub.lng));
    if (distKm < PIN_HUB_THRESH_KM) return null;
    return {
      slug: s.slug,
      name: s.name,
      cat: s.cat,
      distKm,
      iata: hub.iata,
      hasLandmark: Boolean(landmarks[s.slug]),
      hasKeyframes: Boolean(landmarks[s.slug]?.keyframes?.length)
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.distKm - a.distKm);

const byCat = {};
for (const row of categoryFallback) {
  const c = row.cat || '?';
  byCat[c] = (byCat[c] || 0) + 1;
}

console.log(
  JSON.stringify(
    {
      summary: {
        spots: spots.length,
        landmarks: Object.keys(landmarks).length,
        categoryFallback: categoryFallback.length,
        thinLandmarks: thinLandmarks.length,
        pinHubFar: pinHubFar.length,
        fallbackByCat: byCat
      },
      priorityQueue: categoryFallback.slice(0, 40),
      thinLandmarks: thinLandmarks.slice(0, 30),
      pinHubFar: pinHubFar.slice(0, 25)
    },
    null,
    2
  )
);
