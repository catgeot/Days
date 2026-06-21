/**
 * OpenFlights routes.dat → Supabase public.air_routes upsert
 *
 * 환경: .env.local — VITE_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
 *
 * npm run import:routes
 * npm run import:routes -- --dry-run
 * npm run import:routes -- --skip-download
 */
import { createSupabaseScriptClient, loadEnvFile } from './lib/supabase-script-env.mjs';
import { loadOpenFlightsRoutes, mapRouteToDbRow } from './lib/openflights.mjs';

const BATCH_SIZE = 500;
const dryRun = process.argv.includes('--dry-run');
const skipDownload = process.argv.includes('--skip-download');

async function upsertBatch(supabase, batch) {
  const { error } = await supabase.from('air_routes').upsert(batch, {
    onConflict: 'source_iata,dest_iata',
  });
  if (error) throw new Error(error.message);
}

async function main() {
  loadEnvFile();
  console.log('Loading OpenFlights routes.dat...');
  const routes = await loadOpenFlightsRoutes({ skipDownload });
  console.log(`Parsed ${routes.length} unique route legs`);

  const uniquePairs = new Set(routes.map((r) => `${r.sourceIata}->${r.destIata}`));
  const icnOut = routes.filter((r) => r.sourceIata === 'ICN').length;
  const icnIn = routes.filter((r) => r.destIata === 'ICN').length;
  console.log(`  unique pairs: ${uniquePairs.size} · ICN outbound: ${icnOut} · ICN inbound: ${icnIn}`);

  if (dryRun) {
    console.log('[dry-run] Skipping Supabase upsert');
    process.exit(0);
  }

  const supabase = createSupabaseScriptClient();
  /** @type {Map<string, ReturnType<typeof mapRouteToDbRow>>} */
  const pairMap = new Map();
  for (const route of routes) {
    const key = `${route.sourceIata}|${route.destIata}`;
    if (!pairMap.has(key)) pairMap.set(key, mapRouteToDbRow(route));
  }
  const pairs = [...pairMap.values()];
  console.log(`  collapsed to ${pairs.length} unique directed pairs`);

  let uploaded = 0;
  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);
    await upsertBatch(supabase, batch);
    uploaded += batch.length;
    process.stdout.write(`\rUpserted ${uploaded}/${pairs.length}`);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
