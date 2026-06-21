/**
 * OurAirports → Supabase public.airports upsert
 *
 * 환경: .env.local — VITE_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
 *
 * npm run import:airports
 * npm run import:airports -- --dry-run
 * npm run import:airports -- --skip-download
 */
import { createSupabaseScriptClient, loadEnvFile } from './lib/supabase-script-env.mjs';
import { loadOurAirportsRecords } from './lib/ourairports.mjs';

const BATCH_SIZE = 400;
const dryRun = process.argv.includes('--dry-run');
const skipDownload = process.argv.includes('--skip-download');

async function upsertBatch(supabase, batch) {
  const { error } = await supabase.from('airports').upsert(batch, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

async function main() {
  loadEnvFile();
  console.log('Loading OurAirports CSV...');
  const records = await loadOurAirportsRecords({ skipDownload });
  console.log(`Parsed ${records.length} airports with valid IATA`);

  const scheduled = records.filter((r) => r.scheduled_service === 'yes').length;
  const transitHubs = records.filter((r) => r.is_transit_hub).length;
  const withKo = records.filter((r) => r.name_ko).length;
  console.log(`  scheduled: ${scheduled} · transit hubs: ${transitHubs} · name_ko: ${withKo}`);

  if (dryRun) {
    console.log('[dry-run] Skipping Supabase upsert');
    process.exit(0);
  }

  const supabase = createSupabaseScriptClient();
  let uploaded = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await upsertBatch(supabase, batch);
    uploaded += batch.length;
    process.stdout.write(`\rUpserted ${uploaded}/${records.length}`);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
