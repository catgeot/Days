import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DIRECT_FERRIES_RECOMMENDATIONS } from '../src/components/PlaceCard/tabs/planner/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FERRIES_PATH = join(__dirname, '../src/pages/Home/data/travelSpotFerries.json');
const AIRPORTS_PATH = join(__dirname, '../src/pages/Home/data/travelSpotAirports.json');
const OUTPUT_PATH = join(__dirname, 'outputs/ferry-audit.json');

const ALLOWED_PROVIDERS = new Set(['direct', 'direct_ferries', 'twelve_go', 'klook_ferry']);

function loadAirportBannerNotes() {
  try {
    const raw = JSON.parse(readFileSync(AIRPORTS_PATH, 'utf8'));
    const notes = {};
    for (const [slug, row] of Object.entries(raw.spots ?? {})) {
      if (row.bannerNote) notes[slug] = row.bannerNote;
    }
    return notes;
  } catch {
    return {};
  }
}

function main() {
  const data = JSON.parse(readFileSync(FERRIES_PATH, 'utf8'));
  const airportNotes = loadAirportBannerNotes();
  const gaps = [];
  const mismatches = [];
  const reviewQueue = {
    mediumConfidence: [],
    directFerriesOnly: [],
    missingDirectUrl: [],
    missingTwelveGoUrl: [],
    disallowedProvider: [],
    airportFerryHintNoRoutes: [],
  };
  const summary = { required: 0, common: 0, cruise_only: 0, none: 0, multiRoute: 0 };

  for (const [slug, profile] of Object.entries(data.spots ?? {})) {
    summary[profile.tier] = (summary[profile.tier] ?? 0) + 1;

    if (profile.confidence === 'medium') {
      reviewQueue.mediumConfidence.push(slug);
    }

    const routes = profile.routes ?? [];
    if (routes.length > 1) summary.multiRoute += 1;

    const allBookings = routes.flatMap((r) =>
      (r.bookings ?? []).map((b) => ({ ...b, routeId: r.id })),
    );
    const providers = new Set(allBookings.map((b) => b.provider));

    if (
      providers.size === 1 &&
      providers.has('direct_ferries') &&
      (profile.tier === 'required' || profile.tier === 'common')
    ) {
      reviewQueue.directFerriesOnly.push(slug);
    }

    for (const b of allBookings) {
      if (!ALLOWED_PROVIDERS.has(b.provider)) {
        reviewQueue.disallowedProvider.push({ slug, routeId: b.routeId, provider: b.provider });
      }
      if (b.provider === 'direct' && !b.url) {
        reviewQueue.missingDirectUrl.push({ slug, routeId: b.routeId, name: b.name });
      }
      if (b.provider === 'twelve_go' && !b.url) {
        reviewQueue.missingTwelveGoUrl.push({ slug, routeId: b.routeId });
      }
    }

    const airportNote = airportNotes[slug] ?? '';
    if (
      /페리/.test(airportNote) &&
      (profile.tier === 'none' || !routes.length) &&
      /버스·페리|페리·|페리가/.test(airportNote)
    ) {
      reviewQueue.airportFerryHintNoRoutes.push(slug);
    }

    if (profile.tier !== 'required' && profile.tier !== 'common') continue;

    const hasBooking = routes.some((r) => (r.bookings ?? []).length > 0);
    const hasFallback = (profile.fallbacks ?? []).length > 0;

    if (!hasBooking && !hasFallback) {
      gaps.push({ slug, tier: profile.tier, issue: 'no_bookings_or_fallback' });
    }

    for (const route of routes) {
      if (route.directFerries && !(route.bookings ?? []).some((b) => b.provider === 'direct_ferries')) {
        mismatches.push({ slug, routeId: route.id, issue: 'directFerries_flag_without_provider' });
      }
      if (
        route.directFerries &&
        !DIRECT_FERRIES_RECOMMENDATIONS[slug] &&
        !(profile.dfRecommendations?.length)
      ) {
        mismatches.push({ slug, routeId: route.id, issue: 'directFerries_without_df_recommendations' });
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    meta: data.meta ?? null,
    summary,
    gapCount: gaps.length,
    mismatchCount: mismatches.length,
    reviewQueue,
    gaps,
    mismatches,
    notes: [
      'SSOT 등록 slug는 수동 전수 검증 대상. 전체 travelSpots 전수는 불필요.',
      '상세 절차: plans/ferry-ssot-validation.md',
    ],
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const reviewTotal =
    reviewQueue.mediumConfidence.length +
    reviewQueue.directFerriesOnly.length +
    reviewQueue.airportFerryHintNoRoutes.length;

  console.log(`Ferry audit: ${gaps.length} gaps, ${mismatches.length} mismatches, review hints: ${reviewTotal}`);
  console.log('Summary:', summary);
  if (reviewQueue.mediumConfidence.length) {
    console.log('medium confidence:', reviewQueue.mediumConfidence.join(', '));
  }
  if (reviewQueue.directFerriesOnly.length) {
    console.log('DF-only:', reviewQueue.directFerriesOnly.join(', '));
  }
  if (gaps.length) {
    console.log('Gaps:', gaps.slice(0, 10));
  }
  process.exitCode = gaps.length > 0 ? 1 : 0;
}

main();
