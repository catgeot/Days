/**
 * place_toolkit.place_id 감사 — slug 매칭·중복·지리 불일치·정책 위반 별칭
 *
 * 환경: .env.local + SUPABASE_SERVICE_ROLE_KEY
 *
 *   npm run toolkit:audit-place-id
 *   npm run toolkit:audit-place-id -- --json
 *   npm run toolkit:audit-place-id -- --p0
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { auditPlaceToolkitRows, filterP0Audit } from './lib/audit-place-toolkit.mjs';
import { fetchAllPlaceToolkits } from './lib/fetch-place-toolkit.mjs';
import { createSupabaseScriptClient } from './lib/supabase-script-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, 'outputs/place-toolkit-place-id-audit.json');

const jsonOnly = process.argv.includes('--json');
const p0Only = process.argv.includes('--p0');

function logSection(title, items, max = 12) {
  console.log(`\n${title}: ${items.length}`);
  for (const item of items.slice(0, max)) {
    if (item.place_id) {
      console.log(`  · ${item.place_id} → ${item.slug ?? '(unmapped)'}${item.matchKind ? ` [${item.matchKind}]` : ''}`);
    } else if (item.slug) {
      console.log(`  · ${item.slug}: ${item.placeIds?.join(', ')}`);
    }
  }
  if (items.length > max) console.log(`  … 외 ${items.length - max}건`);
}

async function main() {
  const supabase = createSupabaseScriptClient();

  console.log('place_toolkit 조회 중…');
  const rows = await fetchAllPlaceToolkits(supabase);
  console.log('툴킷 행:', rows.length);

  const audit = auditPlaceToolkitRows(rows);
  const p0 = filterP0Audit(audit);

  const output = {
    ...audit,
    p0
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

  if (jsonOnly) {
    console.log(JSON.stringify(output.summary, null, 2));
    console.log('Wrote', OUTPUT_PATH);
    return;
  }

  console.log('\n=== place_toolkit place_id 감사 ===');
  console.log('요약:', audit.summary);
  console.log('P0 요약:', {
    wrongAlias: p0.wrongAlias.length,
    unmapped: p0.unmapped.length,
    duplicateSlug: p0.duplicateSlug.length,
    geoMismatch: p0.geoMismatch.length,
    removedAliasWouldMap: p0.removedAliasWouldMap.length
  });

  logSection('wrongAlias (정책 위반)', audit.wrongAlias);
  logSection('removedAliasWouldMap', audit.removedAliasWouldMap);
  logSection('duplicateSlug', audit.duplicateSlug);
  logSection('geoMismatch', audit.geoMismatch);
  logSection('unmapped (샘플)', audit.unmapped);

  if (p0Only) {
    console.log('\n--- P0만 ---');
    logSection('P0 wrongAlias', p0.wrongAlias);
    logSection('P0 duplicateSlug', p0.duplicateSlug);
    logSection('P0 geoMismatch', p0.geoMismatch);
  }

  console.log('\n리포트:', OUTPUT_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
