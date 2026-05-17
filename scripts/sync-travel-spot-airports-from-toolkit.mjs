/**
 * Supabase place_toolkit.essential_guide → travelSpotAirports.json 동기화
 *
 * - DB는 **읽기만** 합니다 (place_toolkit 수정 없음).
 * - 수동 오버라이드(travel-spot-airport-overrides.mjs)가 있는 slug는 건너뜁니다.
 * - 툴킷이 없거나 IATA를 추출할 수 없는 여행지는 기존 JSON 행을 유지합니다.
 *
 * 환경 변수 (.env 또는 셸):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (권장) 또는 VITE_SUPABASE_ANON_KEY
 *
 * 사용:
 *   npm run sync:airports-from-toolkit
 *   npm run sync:airports-from-toolkit -- --dry-run
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';
import { extractArrivalIataCodesFromEssentialGuide } from '../src/utils/rentalAirportMatch.js';
import { TRAVEL_SPOT_AIRPORT_OVERRIDES } from './data/travel-spot-airport-overrides.mjs';
import {
  buildSpotLookup,
  normalizePlaceKey,
  placeIdVariants,
  resolveTravelSpotFromPlaceId
} from './lib/travel-spot-place-resolve.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MAP_PATH = join(ROOT, 'src/pages/Home/data/travelSpotAirports.json');
const REPORT_PATH = join(__dirname, 'outputs/travel-spot-airports-toolkit-sync.json');

const hubByIata = new Map(RENTAL_AIRPORT_HUBS.map((h) => [h.iata, h]));
const dryRun = process.argv.includes('--dry-run');

function loadEnvFile() {
  for (const name of ['.env', '.env.local']) {
    const envPath = join(ROOT, name);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') process.env[key] = val;
    }
  }
}

function rowFromToolkitGuide(guide) {
  const codes = extractArrivalIataCodesFromEssentialGuide(guide);
  if (!codes?.length) return null;

  const registered = codes.filter((c) => hubByIata.has(c));
  if (!registered.length) return null;

  const structured = guide.primary_arrival_airports_iata;
  let preferred = registered[0];
  if (Array.isArray(structured)) {
    const fromStructured = structured.find((c) => typeof c === 'string' && registered.includes(c.toUpperCase()));
    if (fromStructured) preferred = fromStructured.toUpperCase();
  }

  return {
    primaryIatas: registered,
    preferredLinkIata: preferred,
    kind: registered.length > 1 ? 'multi' : 'single',
    source: 'toolkit-sync',
    confidence: 'high',
    rationale: 'place_toolkit essential_guide 동기화'
  };
}

function writePlaceIdRows(placeIds, placeId, airportRow, linkedSlug) {
  const base = {
    ...airportRow,
    placeId,
    ...(linkedSlug ? { linkedSlug } : {})
  };
  for (const v of placeIdVariants(placeId)) {
    const key = normalizePlaceKey(v);
    if (key) placeIds[key] = base;
  }
}

async function fetchAllToolkits(supabase) {
  const rows = [];
  const pageSize = 500;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('place_toolkit')
      .select('place_id, essential_guide, toolkit_updated_at')
      .not('essential_guide', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function loadExistingMap() {
  try {
    return JSON.parse(readFileSync(MAP_PATH, 'utf8'));
  } catch {
    return { _meta: {}, spots: {} };
  }
}

async function main() {
  loadEnvFile();

  const url = process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      'Supabase 연결 정보가 없습니다. .env에 VITE_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY(권장) 또는 VITE_SUPABASE_ANON_KEY를 설정하세요.'
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const lookup = buildSpotLookup(TRAVEL_SPOTS);
  const overrideSlugs = new Set(Object.keys(TRAVEL_SPOT_AIRPORT_OVERRIDES));

  console.log(dryRun ? '[dry-run] ' : '', 'place_toolkit 조회 중…');
  const toolkits = await fetchAllToolkits(supabase);
  console.log('툴킷 행:', toolkits.length);

  const existing = loadExistingMap();
  const spots = { ...(existing.spots ?? {}) };
  const placeIds = { ...(existing.placeIds ?? {}) };

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    toolkitRows: toolkits.length,
    synced: [],
    syncedPlaceIdOnly: [],
    skippedOverride: [],
    skippedNoSpot: [],
    skippedNoIata: [],
    skippedInvalidGuide: [],
    matchedByAlias: [],
    matchedByFuzzy: []
  };

  for (const row of toolkits) {
    const placeId = row.place_id;
    const guide = row.essential_guide;

    if (!guide || typeof guide !== 'object') {
      report.skippedInvalidGuide.push({ place_id: placeId });
      continue;
    }

    const resolved = resolveTravelSpotFromPlaceId(lookup, TRAVEL_SPOTS, placeId);
    const spot = resolved?.spot ?? null;
    const matchKind = resolved?.matchKind ?? null;

    if (!spot) report.skippedNoSpot.push({ place_id: placeId });
    else if (matchKind === 'alias') report.matchedByAlias.push({ place_id: placeId, slug: spot.slug });
    else if (matchKind === 'fuzzy') report.matchedByFuzzy.push({ place_id: placeId, slug: spot.slug });

    const airportRow = rowFromToolkitGuide(guide);
    if (!airportRow) {
      report.skippedNoIata.push({
        place_id: placeId,
        slug: spot?.slug ?? null,
        name: spot?.name ?? null
      });
      continue;
    }

    writePlaceIdRows(placeIds, placeId, airportRow, spot?.slug ?? null);

    if (!spot) {
      report.syncedPlaceIdOnly.push({
        place_id: placeId,
        primaryIatas: airportRow.primaryIatas
      });
      continue;
    }

    if (overrideSlugs.has(spot.slug)) {
      report.skippedOverride.push({ place_id: placeId, slug: spot.slug });
      continue;
    }

    const prev = spots[spot.slug];
    spots[spot.slug] = airportRow;
    report.synced.push({
      slug: spot.slug,
      name: spot.name,
      place_id: placeId,
      primaryIatas: airportRow.primaryIatas,
      previousPrimary: prev?.primaryIatas ?? null,
      previousSource: prev?.source ?? null
    });
  }

  const output = {
    _meta: {
      ...(existing._meta ?? {}),
      lastToolkitSyncAt: new Date().toISOString(),
      spotCount: Object.keys(spots).length,
      placeIdCount: Object.keys(placeIds).length,
      toolkitSyncNote:
        'spots: travelSpots slug. placeIds: DB place_id·사용자 지명(별칭 키 포함). DB는 읽기만. 런타임 live essential_guide > toolkit-sync.'
    },
    spots,
    placeIds
  };

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  if (!dryRun) {
    writeFileSync(MAP_PATH, JSON.stringify(output, null, 2), 'utf-8');
    console.log('Wrote', MAP_PATH);
  } else {
    console.log('[dry-run] JSON 미저장');
  }

  console.log('slug 동기화:', report.synced.length);
  console.log('placeId만 동기화(사용자·비공식 지명):', report.syncedPlaceIdOnly.length);
  console.log('placeIds 키 수:', Object.keys(placeIds).length);
  console.log('건너뜀 — 오버라이드:', report.skippedOverride.length);
  console.log('건너뜀 — travelSpots 미매칭:', report.skippedNoSpot.length);
  console.log('건너뜀 — IATA 없음:', report.skippedNoIata.length);
  console.log('별칭으로 매칭:', report.matchedByAlias.length);
  console.log('퍼지(유일) 매칭:', report.matchedByFuzzy.length);
  console.log('리포트:', REPORT_PATH);

  if (report.synced.length) {
    const changed = report.synced.filter(
      (r) => JSON.stringify(r.previousPrimary) !== JSON.stringify(r.primaryIatas)
    );
    if (changed.length) {
      console.log('\n변경된 slug (최대 15):');
      for (const r of changed.slice(0, 15)) {
        console.log(
          `  ${r.slug}: ${(r.previousPrimary ?? ['—']).join(',')} → ${r.primaryIatas.join(',')}`
        );
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
