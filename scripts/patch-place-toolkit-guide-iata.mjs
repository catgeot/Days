/**
 * geoMismatch·오탐 IATA가 들어간 place_toolkit.essential_guide 보정 (Phase 3).
 *
 *   npm run toolkit:patch-guide-iata -- --dry-run
 *   npm run toolkit:patch-guide-iata -- --apply
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parseEssentialGuide } from '../src/utils/toolkitPlaceIdResolve.js';
import { fetchAllPlaceToolkits } from './lib/fetch-place-toolkit.mjs';
import { normalizePlaceKey } from './lib/travel-spot-place-resolve.mjs';
import { createSupabaseScriptClient } from './lib/supabase-script-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, 'outputs/place-toolkit-guide-iata-patch.json');

const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

if (!dryRun && !apply) {
  console.error('Use --dry-run or --apply');
  process.exit(1);
}

/** @type {Array<{ matchPlaceIds: string[], primaryIatas: string[], note: string }>} */
const PATCHES = [
  {
    matchPlaceIds: ['우수아이아', 'Ushuaia', 'ushuaia'],
    primaryIatas: ['USH'],
    note: 'EZE 오탐 → USH'
  },
  {
    matchPlaceIds: ['쿠스코', 'Cusco', 'cusco'],
    primaryIatas: ['CUZ'],
    note: 'ATL 오탐 → CUZ'
  },
  {
    matchPlaceIds: ['남극 대륙', 'Antarctica', 'antarctica'],
    primaryIatas: ['USH'],
    note: 'ICN·ATL 등 제거 — 남극 크루즈 관문 USH'
  },
  {
    matchPlaceIds: ['파타고니아', 'Patagonia', 'patagonia'],
    primaryIatas: ['USH', 'PUQ'],
    note: 'EZE 단독 오탐 → USH·PUQ'
  },
  // Phase D — skippedNoIata 우선 slug (essential_guide IATA 보강)
  {
    matchPlaceIds: ['싱가포르', 'Singapore', 'singapore'],
    primaryIatas: ['SIN'],
    note: 'Phase D — primary IATA SIN'
  },
  {
    matchPlaceIds: ['런던', 'London', 'london'],
    primaryIatas: ['LHR'],
    note: 'Phase D — primary IATA LHR'
  },
  {
    matchPlaceIds: ['서울', 'Seoul', 'seoul'],
    primaryIatas: ['ICN', 'GMP'],
    note: 'Phase D — ICN·GMP (GMP 단독 오탐 보정)'
  },
  {
    matchPlaceIds: ['제주', 'Jeju', 'jeju'],
    primaryIatas: ['CJU'],
    note: 'Phase D — primary IATA CJU'
  },
  {
    matchPlaceIds: ['킬리만자로', 'Kilimanjaro', 'kilimanjaro'],
    primaryIatas: ['JRO', 'NBO'],
    note: 'Phase D — JRO·NBO 관문'
  },
  {
    matchPlaceIds: ['에베레스트 베이스캠프', 'Everest Base Camp', 'everest-base-camp', '에베레스트'],
    primaryIatas: ['KTM'],
    note: 'Phase D — KTM 관문'
  },
  {
    matchPlaceIds: ['쿠알라룸푸르', 'Kuala Lumpur', 'kuala-lumpur'],
    primaryIatas: ['KUL'],
    note: 'Phase D — primary IATA KUL'
  },
  {
    matchPlaceIds: ['암스테르담', 'Amsterdam', 'amsterdam'],
    primaryIatas: ['AMS'],
    note: 'Phase D — primary IATA AMS'
  },
  {
    matchPlaceIds: ['케이프타운', 'Cape Town', 'cape-town'],
    primaryIatas: ['CPT'],
    note: 'Phase D — primary IATA CPT'
  },
  {
    matchPlaceIds: ['룩소르', 'Luxor', 'luxor'],
    primaryIatas: ['LXR'],
    note: 'Phase D — primary IATA LXR'
  },
  {
    matchPlaceIds: ['세렝게티', 'Serengeti', 'serengeti'],
    primaryIatas: ['JRO', 'NBO'],
    note: 'Phase D — JRO·NBO 관문'
  }
];

function matchesPatch(placeId, patch) {
  const n = normalizePlaceKey(placeId);
  return patch.matchPlaceIds.some((m) => normalizePlaceKey(m) === n);
}

function patchGuide(guide, primaryIatas) {
  const allowed = new Set(primaryIatas.map((c) => String(c).toUpperCase()));
  const next = {
    ...guide,
    primary_arrival_airports_iata: primaryIatas
  };

  if (Array.isArray(next.journey_timeline)) {
    next.journey_timeline = next.journey_timeline.map((step) => {
      if (!step?.title || typeof step.title !== 'string') return step;
      let title = step.title;
      for (const m of title.matchAll(/\(([A-Z]{3})\)/g)) {
        if (!allowed.has(m[1])) {
          title = title.replace(`(${m[1]})`, '').replace(/\s{2,}/g, ' ').trim();
        }
      }
      return { ...step, title };
    });
  }

  return next;
}

async function main() {
  const supabase = createSupabaseScriptClient();
  const rows = await fetchAllPlaceToolkits(supabase);
  const plan = {
    generatedAt: new Date().toISOString(),
    dryRun,
    apply,
    patches: [],
    skipped: 0
  };

  for (const row of rows) {
    const guide = parseEssentialGuide(row.essential_guide);
    if (!guide) continue;

    const patchRule = PATCHES.find((p) => matchesPatch(row.place_id, p));
    if (!patchRule) continue;

    const before = Array.isArray(guide.primary_arrival_airports_iata)
      ? [...guide.primary_arrival_airports_iata]
      : [];
    const after = patchRule.primaryIatas;
    const same =
      before.length === after.length &&
      before.every((c, i) => String(c).toUpperCase() === after[i]);

    if (same) {
      plan.skipped += 1;
      continue;
    }

    const entry = {
      place_id: row.place_id,
      note: patchRule.note,
      before,
      after
    };
    plan.patches.push(entry);

    if (apply) {
      const nextGuide = patchGuide(guide, after);
      const { error } = await supabase
        .from('place_toolkit')
        .update({
          essential_guide: nextGuide,
          toolkit_updated_at: new Date().toISOString()
        })
        .eq('place_id', row.place_id);
      if (error) throw error;
    }
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

  console.log(
    `${apply ? 'Applied' : 'Dry-run'}: ${plan.patches.length} row(s) to patch, ${plan.skipped} already OK`
  );
  console.log(`Report: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
