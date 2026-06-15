/**
 * 3D tour quality scan — ocean black-screen risk & missing globeLandmarks.
 * Usage: node scripts/scan-tour-ocean-mismatch.mjs
 */
import fs from 'fs';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';

const ISLAND_TOUR_SLUGS = new Set([
  'maldives', 'seychelles', 'samoa', 'zanzibar', 'la-reunion', 'rarotonga',
  'boracay', 'bora-bora', 'mauritius', 'tahiti', 'langkawi', 'ibiza', 'cebu',
  'komodo-island', 'andaman-islands', 'jeju', 'hvar', 'sicily', 'canary-islands',
  'cocos-islands', 'falkland-islands', 'faroe-islands', 'christmas-island',
  'similan-islands', 'phi-phi-islands', 'bali', 'santorini', 'phuket', 'madeira',
  'crete', 'lombok', 'hawaii', 'palawan', 'bohol', 'gili-meno', 'phu-quoc',
  'el-nido', 'honolulu', 'kiribati'
]);

const landmarks = JSON.parse(
  fs.readFileSync('src/pages/Home/data/globeLandmarks.json', 'utf8')
);
const airports = JSON.parse(
  fs.readFileSync('src/pages/Home/data/travelSpotAirports.json', 'utf8')
);

const src = fs.readFileSync('src/pages/Home/data/travelSpots.js', 'utf8');
const spots = [];
for (const block of src.split(/\n  \{\n    "id":/)) {
  const slug = block.match(/"slug": "([^"]+)"/)?.[1];
  const lat = parseFloat(block.match(/"lat": ([-\d.]+)/)?.[1]);
  const lng = parseFloat(block.match(/"lng": ([-\d.]+)/)?.[1]);
  const cat =
    block.match(/"primaryCategory": "([^"]+)"/)?.[1] ||
    block.match(/"category": "([^"]+)"/)?.[1];
  const keywords = block.match(/"keywords": \[([\s\S]*?)\]/)?.[1] || '';
  const name = block.match(/"name": "([^"]+)"/)?.[1] || '';
  const desc = block.match(/"desc": "([^"]+)"/)?.[1] || '';
  if (!slug || !Number.isFinite(lat)) continue;
  spots.push({ slug, lat, lng, cat, keywords, name, desc });
}

const ISLAND_KW =
  /섬|아일랜드|아톨|군도|island|islands|atoll|archipelago/i;

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

// A) Pin vs hub — island/paradise tours without curated keyframes
const OCEAN_THRESH_KM = 25;
const oceanRisk = [];
for (const s of spots) {
  if (landmarks[s.slug]?.keyframes?.length) continue;
  if (!usesIslandCinematic(s)) continue;
  const hub = hubForSlug(s.slug);
  if (!hub) {
    oceanRisk.push({
      slug: s.slug,
      name: s.name,
      risk: 'no-hub',
      distKm: null,
      template: 'islandCinematic'
    });
    continue;
  }
  const dist = km(s.lat, s.lng, hub.lat, hub.lng);
  if (dist >= OCEAN_THRESH_KM) {
    oceanRisk.push({
      slug: s.slug,
      name: s.name,
      risk: 'ocean-overview',
      distKm: Math.round(dist),
      spot: [s.lng, s.lat],
      hub: [hub.lng, hub.lat],
      iata: hub.iata,
      template: 'islandCinematic'
    });
  }
}

// B) ISLAND_TOUR_SLUGS missing globeLandmarks (quality backlog)
const islandSetMissing = [...ISLAND_TOUR_SLUGS]
  .filter((slug) => !landmarks[slug])
  .map((slug) => {
    const s = spots.find((x) => x.slug === slug);
    const hub = hubForSlug(slug);
    const dist =
      s && hub ? Math.round(km(s.lat, s.lng, hub.lat, hub.lng)) : null;
    return { slug, name: s?.name, distKm: dist, hasHub: Boolean(hub) };
  });

// C) Paradise + island keyword, no globeLandmarks at all (any template)
const paradiseNoLandmark = spots
  .filter((s) => {
    if (landmarks[s.slug]) return false;
    const blob = `${s.keywords}${s.name}${s.desc}`;
    return s.cat === 'paradise' && ISLAND_KW.test(blob);
  })
  .map((s) => {
    const hub = hubForSlug(s.slug);
    const dist = hub ? Math.round(km(s.lat, s.lng, hub.lat, hub.lng)) : null;
    const template = usesIslandCinematic(s) ? 'islandCinematic' : 'coastalOrbit';
    return {
      slug: s.slug,
      name: s.name,
      template,
      distKm: dist,
      iata: hub?.iata ?? null
    };
  })
  .sort((a, b) => (b.distKm ?? -1) - (a.distKm ?? -1));

console.log(JSON.stringify({ oceanRisk, islandSetMissing, paradiseNoLandmark }, null, 2));
