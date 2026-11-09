#!/usr/bin/env node
/**
 * Sync published editorial LogBook rows → src/data/logbookEditorialPublished.json (sitemap + crawler SSOT).
 *
 *   npm run sync:logbook-editorial-published
 *
 * Env: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'src/data/logbookEditorialPublished.json');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const endpoint =
  `${url}/rest/v1/reports?select=slug,title,disclosure_badge,published_at,place_slug,locale` +
  '&is_editorial=eq.true&status=eq.published&order=published_at.desc';

const res = await fetch(endpoint, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!res.ok) {
  console.error('Fetch failed:', res.status, await res.text());
  process.exit(1);
}

const rows = await res.json();
if (!Array.isArray(rows)) {
  console.error('Unexpected response:', rows);
  process.exit(1);
}

for (const row of rows) {
  if (!row?.slug || !row?.title) {
    console.error('Invalid row (slug/title required):', row);
    process.exit(1);
  }
}

writeFileSync(outFile, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
console.log(`sync:logbook-editorial-published — ${rows.length} row(s) → ${outFile}`);
