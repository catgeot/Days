#!/usr/bin/env node
/**
 * Upsert one editorial LogBook row (service_role). No end-user login.
 *
 * Usage:
 *   node scripts/upsert-editorial-logbook.mjs path/to/post.json
 *   npm run upsert:editorial-logbook -- scripts/fixtures/editorial-logbook-draft.sample.json
 *
 * Env: .env.local — VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import fs from 'node:fs';
import path from 'node:path';
import { createSupabaseScriptClient } from './lib/supabase-script-env.mjs';
import { validateEditorialLogbookPayload } from './lib/validate-editorial-logbook-payload.mjs';

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Usage: node scripts/upsert-editorial-logbook.mjs <payload.json>');
  process.exit(1);
}

const abs = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(abs)) {
  console.error(`File not found: ${abs}`);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(abs, 'utf8'));
} catch (err) {
  console.error('Invalid JSON:', err.message);
  process.exit(1);
}

const { ok, errors, data } = validateEditorialLogbookPayload(payload);
if (!ok) {
  console.error('Validation failed:\n', errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

const supabase = createSupabaseScriptClient();

const { data: existing, error: findError } = await supabase
  .from('reports')
  .select('id, slug, status')
  .eq('is_editorial', true)
  .eq('slug', data.slug)
  .maybeSingle();

if (findError) {
  console.error('Lookup failed:', findError.message);
  process.exit(1);
}

let result;
if (existing?.id) {
  const { data: updated, error } = await supabase
    .from('reports')
    .update(data)
    .eq('id', existing.id)
    .select('id, slug, status, published_at, canonical_url')
    .single();
  if (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
  result = { action: 'updated', row: updated };
} else {
  const { data: inserted, error } = await supabase.from('reports').insert([data]).select('id, slug, status, published_at, canonical_url').single();
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }
  result = { action: 'inserted', row: inserted };
}

console.log(JSON.stringify(result, null, 2));
