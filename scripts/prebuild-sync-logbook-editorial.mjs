#!/usr/bin/env node
/**
 * Run sync:logbook-editorial-published when Supabase env is present (Vercel build).
 * CI without secrets keeps committed src/data/logbookEditorialPublished.json.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log('prebuild-sync-logbook-editorial: SKIP (no VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  process.exit(0);
}

const result = spawnSync(process.execPath, [join(root, 'scripts/sync-logbook-editorial-published.mjs')], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
