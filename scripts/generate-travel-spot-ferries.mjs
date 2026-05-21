import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { DIRECT_FERRIES_RECOMMENDATIONS } from '../src/components/PlaceCard/tabs/planner/constants.js';
import {
  TRAVEL_SPOT_FERRY_OVERRIDES,
  FERRY_SLUG_ALIASES,
} from './data/travel-spot-ferry-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/travelSpotFerries.json');
const CANDIDATES_PATH = join(__dirname, 'outputs/ferry-candidates.json');

const FALSE_POSITIVE_PATTERNS = [
  /페리토\s*모레노/i,
  /페리토모레노/i,
  /드래곤\s*보트/i,
  /항구\s*도시/i,
  /항구도시/i,
  /아마존\s*강을\s*따라\s*보트/i,
  /와이헤케/i,
];

const REQUIRED_PATTERNS = [
  /페리가\s*주\s*경로/i,
  /버스·페리/i,
  /버스\s*·\s*페리/i,
  /페리·전용선/i,
  /페리\s*·\s*전용선/i,
  /쾌속페리\(약/i,
  /페리로\s*만/i,
  /페리\s*없이\s*목적지/i,
  /직항\s*항공\s*은\s*없/i,
  /직항\s*은\s*없/i,
];

const FERRY_PATTERNS = [
  /\b페리\b/i,
  /\bferry\b/i,
  /쾌속선/i,
  /fast\s*boat/i,
  /스피드보at/i,
  /스피드\s*보트/i,
  /쾌속페리/i,
  /국제여객터미널/i,
  /페리\s*환승/i,
  /페리\s*탑승/i,
];

const CRUISE_ONLY_PATTERNS = [
  /크루즈의\s*관문/i,
  /크루즈\s*기항/i,
  /크루즈\s*출발/i,
  /남극\s*크루즈/i,
  /관광\s*크루즈/i,
  /하롱베이/i,
  /하롱\s*베이/i,
];

const ISLAND_HINTS = [/섬/i, /island/i, /제도/i, / atol/i, /atoll/i];

function loadAirportNotes() {
  try {
    const raw = JSON.parse(
      readFileSync(join(__dirname, '../src/pages/Home/data/travelSpotAirports.json'), 'utf8')
    );
    const notes = {};
    for (const [slug, row] of Object.entries(raw.spots ?? {})) {
      if (row.bannerNote) notes[slug] = row.bannerNote;
    }
    return notes;
  } catch {
    return {};
  }
}

function resolveOverrideSlug(slug) {
  return FERRY_SLUG_ALIASES[slug] ?? slug;
}

function textBlob(spot, airportNotes) {
  const parts = [
    spot.desc ?? '',
    ...(spot.keywords ?? []),
    airportNotes[spot.slug] ?? '',
  ];
  return parts.join(' ');
}

function isFalsePositive(text) {
  return FALSE_POSITIVE_PATTERNS.some((re) => re.test(text));
}

function scoreSpot(spot, airportNotes) {
  const text = textBlob(spot, airportNotes);
  const slug = spot.slug;

  if (TRAVEL_SPOT_FERRY_OVERRIDES[resolveOverrideSlug(slug)]) {
    return { tier: TRAVEL_SPOT_FERRY_OVERRIDES[resolveOverrideSlug(slug)].tier, source: 'override' };
  }

  if (DIRECT_FERRIES_RECOMMENDATIONS[slug]) {
    return { tier: 'common', source: 'direct-ferries-seed' };
  }

  if (isFalsePositive(text)) {
    if (CRUISE_ONLY_PATTERNS.some((re) => re.test(text))) {
      return { tier: 'cruise_only', source: 'cruise-keyword' };
    }
    return { tier: 'none', source: 'false-positive' };
  }

  if (CRUISE_ONLY_PATTERNS.some((re) => re.test(text)) && !FERRY_PATTERNS.some((re) => re.test(text))) {
    return { tier: 'cruise_only', source: 'cruise-only' };
  }

  if (REQUIRED_PATTERNS.some((re) => re.test(text))) {
    return { tier: 'required', source: 'required-keyword' };
  }

  const airportNote = airportNotes[slug] ?? '';
  if (/페리/.test(airportNote) && /버스·페리|페리·|페리가/.test(airportNote)) {
    return { tier: 'required', source: 'airport-banner' };
  }
  if (/페리/.test(airportNote)) {
    return { tier: 'common', source: 'airport-banner' };
  }

  const ferryHits = FERRY_PATTERNS.filter((re) => re.test(text)).length;
  const islandHit = ISLAND_HINTS.some((re) => re.test(text));

  if (ferryHits >= 2 || (ferryHits >= 1 && islandHit)) {
    return { tier: 'common', source: 'keyword-score' };
  }
  if (ferryHits >= 1) {
    return { tier: 'common', source: 'keyword' };
  }

  return { tier: 'none', source: 'none' };
}

function buildDfRouteFromRecommendations(slug, tips) {
  const primary = tips[0] ?? `${slug} 페리 노선`;
  const id = primary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return {
    id: id || `${slug}-ferry`,
    label: primary.replace(/\s*\(약.*\)\s*$/, '').trim(),
    duration: (primary.match(/\(약[^)]+\)/) ?? [])[0]?.replace(/[()]/g, '') ?? undefined,
    directFerries: true,
    tips,
    bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
  };
}

function mergeOverride(slug, override, scored) {
  const entry = {
    tier: override.tier ?? scored.tier,
    source: 'curated-override',
    confidence: override.confidence ?? 'high',
  };
  if (override.summary) entry.summary = override.summary;
  if (override.rationale) entry.rationale = override.rationale;
  if (override.fallbacks?.length) entry.fallbacks = override.fallbacks;

  if (override.routes?.length) {
    entry.routes = override.routes.map((r) => ({
      ...r,
      bookings: r.bookings ?? [],
    }));
  } else if (override.tier === 'required' || override.tier === 'common') {
    entry.routes = [
      {
        id: `${slug}-ferry`,
        label: override.summary ?? `${slug} 페리`,
        directFerries: Boolean(DIRECT_FERRIES_RECOMMENDATIONS[slug]),
        bookings: [
          ...(DIRECT_FERRIES_RECOMMENDATIONS[slug]
            ? [{ provider: 'direct_ferries', name: 'Direct Ferries' }]
            : []),
        ],
      },
    ];
    if (!entry.routes[0].bookings.length) {
      entry.fallbacks = [...(entry.fallbacks ?? []), 'klook_ferry'];
    }
  }

  if (override.dfRecommendations?.length) {
    entry.dfRecommendations = override.dfRecommendations;
  } else if (DIRECT_FERRIES_RECOMMENDATIONS[slug]) {
    entry.dfRecommendations = DIRECT_FERRIES_RECOMMENDATIONS[slug];
  }

  if ((entry.tier === 'required' || entry.tier === 'common') && (!entry.routes || !entry.routes.length)) {
    entry.routes = [
      {
        id: `${slug}-fallback`,
        label: '페리 예약',
        directFerries: Boolean(DIRECT_FERRIES_RECOMMENDATIONS[slug]),
        bookings: [
          ...(DIRECT_FERRIES_RECOMMENDATIONS[slug]
            ? [{ provider: 'direct_ferries', name: 'Direct Ferries' }]
            : [{ provider: 'klook_ferry', name: 'Klook 페리' }]),
        ],
      },
    ];
    entry.fallbacks = entry.fallbacks ?? ['klook_ferry'];
  }

  return entry;
}

function buildAutoEntry(slug, scored) {
  const entry = {
    tier: scored.tier,
    source: scored.source,
    confidence: 'medium',
  };

  if (scored.tier === 'none' || scored.tier === 'cruise_only') {
    return entry;
  }

  if (DIRECT_FERRIES_RECOMMENDATIONS[slug]) {
    entry.dfRecommendations = DIRECT_FERRIES_RECOMMENDATIONS[slug];
    entry.routes = [buildDfRouteFromRecommendations(slug, DIRECT_FERRIES_RECOMMENDATIONS[slug])];
    entry.fallbacks = ['klook_ferry'];
    return entry;
  }

  entry.routes = [
    {
      id: `${slug}-ferry`,
      label: '페리·쾌속선 예약',
      directFerries: false,
      bookings: [{ provider: 'klook_ferry', name: 'Klook 페리' }],
    },
  ];
  entry.fallbacks = ['klook_ferry'];
  return entry;
}

function main() {
  const airportNotes = loadAirportNotes();
  const spots = {};
  const candidates = [];

  for (const spot of TRAVEL_SPOTS) {
    const slug = spot.slug;
    const scored = scoreSpot(spot, airportNotes);
    const overrideKey = resolveOverrideSlug(slug);
    const override = TRAVEL_SPOT_FERRY_OVERRIDES[overrideKey];

    let entry;
    if (override) {
      entry = mergeOverride(slug, override, scored);
    } else {
      entry = buildAutoEntry(slug, scored);
    }

    if (entry.tier !== 'none') {
      spots[slug] = entry;
    }

    if (scored.tier !== 'none' || override) {
      candidates.push({
        slug,
        name: spot.name,
        tier: entry.tier,
        source: entry.source,
        hasRoutes: Boolean(entry.routes?.length),
        hasBookings: Boolean(entry.routes?.some((r) => r.bookings?.length)),
      });
    }
  }

  // DF slugs not in travelSpots but useful for reference — skip

  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      spotCount: Object.keys(spots).length,
    },
    spots,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  mkdirSync(dirname(CANDIDATES_PATH), { recursive: true });
  writeFileSync(CANDIDATES_PATH, `${JSON.stringify({ candidates }, null, 2)}\n`, 'utf8');

  const tiers = Object.values(spots).reduce((acc, s) => {
    acc[s.tier] = (acc[s.tier] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${OUTPUT_PATH} (${Object.keys(spots).length} spots)`);
  console.log('Tiers:', tiers);
  console.log(`Candidates report: ${CANDIDATES_PATH}`);
}

main();
