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
    primaryIatas: ['BRC', 'EZE'],
    note: '북부 파타고니아 — EZE·BRC (USH/PUQ는 ushuaia·torres-del-paine)'
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
    matchPlaceIds: ['tukao', 'Manihiki', 'manihiki', 'Tukao'],
    primaryIatas: ['MHX', 'RAR'],
    note: 'RAR 단독 geoMismatch → MHX·RAR (쿡 제도 관문)'
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
  },
  // Phase D-2 — skippedNoIata slug 우선 (essential_guide IATA 보강)
  {
    matchPlaceIds: ['안나푸르나 서킷', 'Annapurna Circuit', 'annapurna-circuit'],
    primaryIatas: ['KTM', 'PKR'],
    note: 'Phase D-2 — KTM·PKR 관문'
  },
  {
    matchPlaceIds: ['디에고 가르시아', 'Diego Garcia', 'diego-garcia'],
    primaryIatas: ['MLE'],
    note: 'Phase D-2 — MLE 참고 허브(민간 출입 불가)'
  },
  {
    matchPlaceIds: ['사하라 사막', 'Sahara Desert', 'sahara-desert'],
    primaryIatas: ['RAK'],
    note: 'Phase D-2 — RAK 관문'
  },
  {
    matchPlaceIds: ['시미란 제도', 'Similan Islands', 'similan-islands'],
    primaryIatas: ['HKT'],
    note: 'Phase D-2 — HKT 후 보트'
  },
  {
    matchPlaceIds: ['보홀', 'Bohol', 'bohol'],
    primaryIatas: ['CEB', 'TAG'],
    note: 'Phase D-2 — CEB·TAG 관문'
  },
  {
    matchPlaceIds: ['대마도', 'Tsushima', 'tsushima'],
    primaryIatas: ['TSJ', 'FUK'],
    note: 'Phase D-2 — TSJ·FUK 관문'
  },
  {
    matchPlaceIds: ['요코하마', 'Yokohama', 'yokohama'],
    primaryIatas: ['HND', 'NRT'],
    note: 'Phase D-2 — HND·NRT 관문'
  },
  // Phase D-3 — skippedNoIata (비공식 place_id, placeIds·배너만)
  {
    matchPlaceIds: ['발레타', 'Valletta', 'valletta'],
    primaryIatas: ['MLA'],
    note: 'Phase D-3 — MLA'
  },
  {
    matchPlaceIds: ['마데이라', 'Madeira', 'madeira'],
    primaryIatas: ['FNC'],
    note: 'Phase D-3 — FNC'
  },
  {
    matchPlaceIds: ['블라디보스토크', 'Vladivostok', 'vladivostok'],
    primaryIatas: ['VVO'],
    note: 'Phase D-3 — VVO'
  },
  {
    matchPlaceIds: ['이르쿠츠크', 'Irkutsk', 'irkutsk'],
    primaryIatas: ['IKT'],
    note: 'Phase D-3 — IKT'
  },
  {
    matchPlaceIds: ['앨리스스프링스', 'Alice Springs', 'alice-springs'],
    primaryIatas: ['ASP'],
    note: 'Phase D-3 — ASP'
  },
  {
    matchPlaceIds: ['아오시마', 'Aoshima', 'aoshima'],
    primaryIatas: ['OIT'],
    note: 'Phase D-3 — 미야자키 OIT'
  },
  {
    matchPlaceIds: ['Ad Dakhiliyah Governorate'],
    primaryIatas: ['MCT'],
    note: 'Phase D-3 — 오만 MCT 참고'
  },
  {
    matchPlaceIds: ['엘칼라파테', 'El Calafate', 'el-calafate', 'Calafate'],
    primaryIatas: ['FTE'],
    note: '세션 G — 페리토 모레노·남부 파타고니아 FTE'
  },
  {
    matchPlaceIds: ['아바나', 'Havana', 'havana'],
    primaryIatas: ['HAV'],
    note: 'Phase D-4 — citiesData havana, travelSpots 승격 전 placeIds만'
  },
  // 세션 C — placeIds_only 승격 (2026-05-21)
  { matchPlaceIds: ['함부르크', 'Hamburg', 'hamburg'], primaryIatas: ['HAM'], note: '세션 C — HAM' },
  {
    matchPlaceIds: ['코코스 제도', '코코스제도', 'cocos-islands'],
    primaryIatas: ['CCK', 'PER'],
    note: '세션 C — CCK·PER'
  },
  { matchPlaceIds: ['핏케언 제도', 'pitcairn-islands'], primaryIatas: ['PPT'], note: '세션 C — PPT 관문' },
  { matchPlaceIds: ['그린란드', 'greenland'], primaryIatas: ['CPH', 'GOH'], note: '세션 C — CPH·GOH' },
  {
    matchPlaceIds: ['포클랜드', '포클랜드 제도', 'falkland-islands'],
    primaryIatas: ['MPM', 'SCL'],
    note: '세션 C — MPM·SCL'
  },
  {
    matchPlaceIds: ['솔로몬 제도', 'solomon-islands'],
    primaryIatas: ['HIR', 'BNE'],
    note: '세션 C — HIR·BNE'
  },
  { matchPlaceIds: ['나우루', 'nauru'], primaryIatas: ['INU', 'BNE'], note: '세션 C — INU·BNE' },
  { matchPlaceIds: ['퀸스타운', 'Queenstown', 'queenstown'], primaryIatas: ['ZQN'], note: '세션 C — ZQN' },
  { matchPlaceIds: ['미니애폴리스', 'Minneapolis', 'minneapolis'], primaryIatas: ['MSP'], note: '세션 C — MSP' },
  { matchPlaceIds: ['퍼스', 'Perth', 'perth'], primaryIatas: ['PER'], note: '세션 C — PER' },
  {
    matchPlaceIds: ['바하마', 'Bahamas', 'bahamas'],
    primaryIatas: ['NAS', 'MIA', 'ATL'],
    note: '세션 C — NAS·MIA·ATL'
  },
  {
    matchPlaceIds: ['스리자야와르데네푸라코테', 'sri-jayawardenapura'],
    primaryIatas: ['CMB'],
    note: '세션 C — CMB'
  },
  { matchPlaceIds: ['베네수엘라', 'Venezuela', 'venezuela'], primaryIatas: ['CCS'], note: '세션 C — CCS(IST/MAD 오탐 보정)' },
  {
    matchPlaceIds: ['어센션 섬', 'Ascension Island', 'ascension'],
    primaryIatas: ['ASI', 'JNB'],
    note: 'placeIds-only — ASI·JNB (ASC=볼리비아 오매핑·LHR 오탐 보정)'
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
