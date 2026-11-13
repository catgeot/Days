#!/usr/bin/env node
/**
 * Soft sync published editorial LogBook before build. Never fails the build.
 *
 * When VITE_SUPABASE_* exist: try REST sync (10s timeout). On error, WARN and keep
 * committed src/data/logbookEditorialPublished.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TIMEOUT_MS = 10_000;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'src/data/logbookEditorialPublished.json');

const url = String(process.env.VITE_SUPABASE_URL || '').trim();
const key = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!url || !key) {
  console.log('prebuild-sync-logbook-editorial: SKIP (no VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  process.exit(0);
}

const priorBytes = existsSync(outFile) ? readFileSync(outFile) : null;

const select =
  'slug,title,dek,content,images,disclosure_badge,published_at,place_slug,locale';

const endpoint =
  `${url.replace(/\/$/, '')}/rest/v1/reports?select=${encodeURIComponent(select)}` +
  '&is_editorial=eq.true&status=eq.published&is_deleted=eq.false&order=published_at.desc';

try {
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${body ? ` ${body.slice(0, 120)}` : ''}`);
  }

  const rows = await res.json();
  if (!Array.isArray(rows)) {
    throw new Error('response is not an array');
  }

  for (const row of rows) {
    if (!row?.slug || !row?.title) {
      throw new Error('invalid row (slug/title required)');
    }
  }

  writeFileSync(outFile, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`prebuild-sync-logbook-editorial: synced ${rows.length} row(s) → ${outFile}`);
} catch (err) {
  const reason = err instanceof Error ? err.message : String(err);
  console.warn(`prebuild-sync-logbook-editorial: WARN sync skipped (${reason}) — keeping committed SSOT`);
  if (priorBytes) {
    writeFileSync(outFile, priorBytes);
  }
}

process.exit(0);
