/**
 * OurAirports(또는 Supabase) → src/pages/Home/data/airportsIndex.json
 *
 * npm run generate:airports-index
 * npm run generate:airports-index -- --from-csv
 * npm run generate:airports-index -- --dry-run
 *
 * hub/index 갱신 후 Edge 검증 좌표도 맞추려면:
 *   npm run generate:toolkit-airport-coords
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';
import { createSupabaseScriptClient, loadEnvFile } from './lib/supabase-script-env.mjs';
import { loadOurAirportsRecords } from './lib/ourairports.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_PATH = join(ROOT, 'src/pages/Home/data/airportsIndex.json');

const dryRun = process.argv.includes('--dry-run');
const fromCsv = process.argv.includes('--from-csv');
const skipDownload = process.argv.includes('--skip-download');

const rentalByIata = new Map(RENTAL_AIRPORT_HUBS.map((h) => [h.iata, h]));

async function loadFromSupabase() {
  loadEnvFile();
  const supabase = createSupabaseScriptClient();
  const PAGE = 1000;
  /** @type {Array<{ iata_code: string, latitude_deg: number, longitude_deg: number, name?: string, name_ko?: string, scheduled_service?: string }>} */
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('airports')
      .select('iata_code, latitude_deg, longitude_deg, name, name_ko, scheduled_service')
      .eq('scheduled_service', 'yes')
      .not('iata_code', 'is', null)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`  fetched ${all.length} scheduled rows from Supabase`);
  return all;
}

/**
 * @param {Array<{ iata_code: string, latitude_deg: number, longitude_deg: number, name?: string, name_ko?: string, scheduled_service?: string }>} rows
 */
function buildIndex(rows) {
  /** @type {Record<string, { lat: number, lng: number }>} */
  const byIata = {};

  for (const row of rows) {
    const iata = String(row.iata_code || '').trim().toUpperCase();
    const lat = Number(row.latitude_deg);
    const lng = Number(row.longitude_deg);
    if (!/^[A-Z]{3}$/.test(iata) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (rentalByIata.has(iata)) continue;
    if (row.scheduled_service && row.scheduled_service !== 'yes') continue;

    byIata[iata] = { lat, lng };
  }

  return {
    generatedAt: new Date().toISOString(),
    source: fromCsv ? 'ourairports-csv' : 'supabase-airports',
    rentalHubCount: RENTAL_AIRPORT_HUBS.length,
    count: Object.keys(byIata).length,
    scheduledOnly: true,
    excludesRentalHubs: true,
    byIata,
  };
}

async function main() {
  let rows;
  if (fromCsv) {
    console.log('Building index from OurAirports CSV cache/download...');
    const records = await loadOurAirportsRecords({ skipDownload });
    rows = records;
  } else {
    try {
      console.log('Loading from Supabase airports...');
      rows = await loadFromSupabase();
      if (!rows.length) {
        console.warn('Supabase returned 0 rows — falling back to OurAirports CSV');
        rows = await loadOurAirportsRecords({ skipDownload });
      }
    } catch (err) {
      console.warn(`Supabase unavailable (${err.message}) — falling back to OurAirports CSV`);
      rows = await loadOurAirportsRecords({ skipDownload });
    }
  }

  const index = buildIndex(rows);
  console.log(`airportsIndex: ${index.count} IATA (rental hubs: ${index.rentalHubCount})`);

  if (dryRun) {
    console.log('[dry-run] Skipping write');
    process.exit(0);
  }

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  console.log(`Written: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
