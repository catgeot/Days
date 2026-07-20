/**
 * place_id → canonical slug migration (newest-wins + archive)
 *
 *   npm run migrate:place-id-to-slug -- --dry-run
 *   npm run migrate:place-id-to-slug -- --apply
 *   npm run migrate:place-id-to-slug -- --apply --tables=place_wiki,place_stats
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { buildStaticAliasToSlugMap, resolveCanonicalSlug, rowRecencyScore } from './lib/resolve-canonical-slug.mjs';
import { createSupabaseScriptClient } from './lib/supabase-script-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_ROOT = join(__dirname, 'outputs');

const ALL_TABLES = ['place_wiki', 'place_stats', 'place_videos', 'place_toolkit'];
const ARCHIVE_TABLE = {
  place_wiki: 'place_wiki_archive',
  place_stats: 'place_stats_archive',
  place_videos: 'place_videos_archive',
  place_toolkit: 'place_toolkit_archive',
};

const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');
const tablesArg = process.argv.find((a) => a.startsWith('--tables='));
const tables = tablesArg
  ? tablesArg.slice('--tables='.length).split(',').map((t) => t.trim())
  : ALL_TABLES;

function todayStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

/** place_wiki: summary/sections 있으면 큰 가산점 (빈 slug 껍데기 승자 방지) */
function magazineContentScore(row, tableName) {
  if (tableName !== 'place_wiki' || !row) return 0;
  let score = 0;
  if (row.summary && row.summary !== '[[LOADING]]' && String(row.summary).trim()) score += 1e12;
  if (Array.isArray(row.sections) && row.sections.length > 0) score += 1e12;
  if (row.ai_practical_info && row.ai_practical_info !== '[[LOADING]]') score += 1e10;
  return score;
}

async function fetchAllRows(supabase, table) {
  const rows = [];
  const pageSize = 500;
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

function buildMigrationPlan(rows, tableName, aliasMap) {
  const plan = {
    table: tableName,
    total: rows.length,
    kept: 0,
    rekeyed: 0,
    merged: 0,
    archived: 0,
    unresolved: [],
    groups: [],
    actions: [],
  };

  const bySlug = new Map();

  for (const row of rows) {
    const oldId = row.place_id;
    const resolved = resolveCanonicalSlug(oldId, {
      lat: row.lat,
      lng: row.lng,
      aliasMap,
    });

    if (!resolved.slug) {
      plan.unresolved.push({ place_id: oldId, matchKind: resolved.matchKind });
      continue;
    }

    const slug = resolved.slug;
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push({
      row,
      oldId,
      resolved,
    });
  }

  for (const [slug, members] of bySlug) {
    const sorted = [...members].sort((a, b) => {
      // 매거진/본문 있는 행이 빈 slug 껍데기보다 우선 (과거: slug 행 +1e12로 빈 껍데기 승자 사고)
      const magB = magazineContentScore(b.row, tableName);
      const magA = magazineContentScore(a.row, tableName);
      if (magB !== magA) return magB - magA;
      const scoreB = rowRecencyScore(b.row, tableName) + (b.oldId === slug ? 1e9 : 0);
      const scoreA = rowRecencyScore(a.row, tableName) + (a.oldId === slug ? 1e9 : 0);
      return scoreB - scoreA;
    });
    const winner = sorted[0];
    const losers = sorted.slice(1);

    const winnerNeedsRekey = winner.oldId !== slug;
    if (winnerNeedsRekey) plan.rekeyed += 1;
    else plan.kept += 1;

    if (losers.length) plan.merged += losers.length;

    plan.groups.push({
      canonical_slug: slug,
      winner: winner.oldId,
      losers: losers.map((l) => l.oldId),
      winnerNeedsRekey,
    });

    for (const loser of losers) {
      plan.archived += 1;
      plan.actions.push({
        type: 'archive_and_delete',
        table: tableName,
        archiveTable: ARCHIVE_TABLE[tableName],
        place_id: loser.oldId,
        superseded_by: slug,
        reason: 'newest-wins-merge',
      });
    }

    if (winnerNeedsRekey) {
      plan.actions.push({
        type: 'update_place_id',
        table: tableName,
        from: winner.oldId,
        to: slug,
        name_ko: winner.resolved.matchKind !== 'slug' ? winner.oldId : null,
      });
    }
  }

  return plan;
}

async function applyAction(supabase, action) {
  if (action.type === 'archive_and_delete') {
    const { data: row, error: selErr } = await supabase
      .from(action.table)
      .select('*')
      .eq('place_id', action.place_id)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!row) return;

    const archiveRow = {
      ...row,
      archived_at: new Date().toISOString(),
      archive_reason: action.reason,
      superseded_by: action.superseded_by,
    };
    const { error: insErr } = await supabase.from(action.archiveTable).insert(archiveRow);
    if (insErr) throw insErr;

    const { error: delErr } = await supabase.from(action.table).delete().eq('place_id', action.place_id);
    if (delErr) throw delErr;
    return;
  }

  if (action.type === 'update_place_id') {
    const patch = { place_id: action.to };
    if (action.name_ko) {
      patch.name_ko = action.name_ko;
      const spot = TRAVEL_SPOTS.find((s) => s.slug === action.to);
      if (spot?.name_en) patch.name_en = spot.name_en;
      patch.source = 'migrate-place-id-to-slug';
    }
    const { error } = await supabase.from(action.table).update(patch).eq('place_id', action.from);
    if (error) throw error;
  }
}

function printSummary(report) {
  console.log('\n=== migrate place_id → slug ===');
  console.log('mode:', report.mode);
  console.log('tables:', report.tables.join(', '));
  for (const p of report.plans) {
    console.log(`\n[${p.table}] rows=${p.total} kept=${p.kept} rekeyed=${p.rekeyed} merged=${p.merged} archived=${p.archived} unresolved=${p.unresolved.length}`);
    if (p.unresolved.length) {
      for (const u of p.unresolved.slice(0, 15)) {
        console.log(`  unresolved: ${u.place_id}`);
      }
      if (p.unresolved.length > 15) console.log(`  ... +${p.unresolved.length - 15} more`);
    }
    for (const g of p.groups.filter((x) => x.losers.length > 0 || x.winnerNeedsRekey).slice(0, 20)) {
      console.log(`  ${g.canonical_slug}: winner="${g.winner}" losers=[${g.losers.join(', ')}] rekey=${g.winnerNeedsRekey}`);
    }
  }
}

async function main() {
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  if (dryRun && apply) {
    console.error('--dry-run and --apply are mutually exclusive');
    process.exit(1);
  }

  const supabase = createSupabaseScriptClient();
  const aliasMap = buildStaticAliasToSlugMap();
  const stamp = todayStamp();
  const outDir = join(OUTPUT_ROOT, `place_id_backup_${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry-run',
    tables,
    plans: [],
  };

  for (const table of tables) {
    if (!ALL_TABLES.includes(table)) {
      console.warn(`Skip unknown table: ${table}`);
      continue;
    }
    console.log(`\nFetching ${table}…`);
    const rows = await fetchAllRows(supabase, table);
    writeFileSync(join(outDir, `${table}.ndjson`), rows.map((r) => JSON.stringify(r)).join('\n'), 'utf8');
    console.log(`  ${rows.length} rows → backup ${table}.ndjson`);

    const plan = buildMigrationPlan(rows, table, aliasMap);
    report.plans.push(plan);

    if (apply) {
      console.log(`  Applying ${plan.actions.length} actions…`);
      for (const action of plan.actions) {
        await applyAction(supabase, action);
      }
    }
  }

  const reportPath = join(outDir, `migrate-report-${stamp}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  printSummary(report);
  console.log('\nReport:', reportPath);
  if (!apply) console.log('\nNo DB changes (dry-run).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
