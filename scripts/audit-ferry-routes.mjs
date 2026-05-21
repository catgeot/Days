import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DIRECT_FERRIES_RECOMMENDATIONS } from '../src/components/PlaceCard/tabs/planner/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FERRIES_PATH = join(__dirname, '../src/pages/Home/data/travelSpotFerries.json');
const OUTPUT_PATH = join(__dirname, 'outputs/ferry-audit.json');

function main() {
  const data = JSON.parse(readFileSync(FERRIES_PATH, 'utf8'));
  const gaps = [];
  const mismatches = [];
  const summary = { required: 0, common: 0, cruise_only: 0, none: 0 };

  for (const [slug, profile] of Object.entries(data.spots ?? {})) {
    summary[profile.tier] = (summary[profile.tier] ?? 0) + 1;

    if (profile.tier !== 'required' && profile.tier !== 'common') continue;

    const routes = profile.routes ?? [];
    const hasBooking = routes.some((r) => (r.bookings ?? []).length > 0);
    const hasFallback = (profile.fallbacks ?? []).length > 0;

    if (!hasBooking && !hasFallback) {
      gaps.push({ slug, tier: profile.tier, issue: 'no_bookings_or_fallback' });
    }

    for (const route of routes) {
      if (route.directFerries && !(route.bookings ?? []).some((b) => b.provider === 'direct_ferries')) {
        mismatches.push({ slug, routeId: route.id, issue: 'directFerries_flag_without_provider' });
      }
      if (route.directFerries && !DIRECT_FERRIES_RECOMMENDATIONS[slug] && !(profile.dfRecommendations?.length)) {
        mismatches.push({ slug, routeId: route.id, issue: 'directFerries_without_df_recommendations' });
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    gapCount: gaps.length,
    mismatchCount: mismatches.length,
    gaps,
    mismatches,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Ferry audit: ${gaps.length} gaps, ${mismatches.length} mismatches`);
  console.log('Summary:', summary);
  if (gaps.length) {
    console.log('Gaps:', gaps.slice(0, 10));
  }
  process.exitCode = gaps.length > 0 ? 1 : 0;
}

main();
