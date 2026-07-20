/**
 * place_wiki_archive → 공식 slug 복원
 *
 * slug-first 마이그레이션 때 관문 keywords가 공식 한글명을 가로채
 * (울루루→alice-springs 등) 빈 slug 껍데기가 승자가 되고, 원본 매거진이
 * 아카이브로 밀린 케이스를 복구한다.
 *
 *   node scripts/restore-place-wiki-from-archive.mjs --dry-run
 *   node scripts/restore-place-wiki-from-archive.mjs --apply
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { createSupabaseScriptClient } from './lib/supabase-script-env.mjs';
import { resolveCanonicalSlug, buildStaticAliasToSlugMap } from './lib/resolve-canonical-slug.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

/** archive place_id → SSOT slug (수동 큐레이션 — 자동 alias에 의존하지 않음) */
const SAFE_RESTORES = [
  { archiveId: '로마', targetSlug: 'rome' },
  { archiveId: '쿠알라룸푸르', targetSlug: 'kuala-lumpur' },
  { archiveId: '울루루', targetSlug: 'uluru' },
  { archiveId: '친퀘테레', targetSlug: 'cinque-terre' },
  { archiveId: '파타고니아', targetSlug: 'patagonia' },
  { archiveId: '아이투타키', targetSlug: 'aitutaki' },
  { archiveId: '포클랜드', targetSlug: 'falkland-islands' },
  // Jul-19 짧은 재생성분보다 아카이브 원본이 풍부
  { archiveId: '하와이', targetSlug: 'hawaii', force: true },
];

/** SSOT에 없는 잘못된 live place_id — 복원 후 아카이브로 이동 */
const ORPHAN_LIVE_DELETE = [
  {
    place_id: 'australia',
    reason: 'non-ssot-place-id',
    note: '킹스캐년 테마 매거진이 australia 키로 저장됨. uluru는 아카이브 울루루로 복원.',
  },
];

function magScore(row) {
  if (!row) return -1;
  let score = 0;
  if (row.summary && row.summary !== '[[LOADING]]' && String(row.summary).trim()) score += 4;
  if (Array.isArray(row.sections) && row.sections.length > 0) score += 4;
  return score;
}

function spotBySlug(slug) {
  return TRAVEL_SPOTS.find((s) => String(s.slug).toLowerCase() === slug) || null;
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
  const report = {
    generatedAt: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry-run',
    aliasSanity: {},
    restores: [],
    orphans: [],
  };

  // 별칭 회귀 체크
  for (const [name, expect] of [
    ['울루루', 'uluru'],
    ['친퀘테레', 'cinque-terre'],
    ['파타고니아', 'patagonia'],
    ['하와이', 'hawaii'],
    ['로마', 'rome'],
  ]) {
    const got = resolveCanonicalSlug(name, { aliasMap }).slug;
    report.aliasSanity[name] = { expect, got, ok: got === expect };
    if (got !== expect) {
      console.error(`Alias sanity FAIL: ${name} → ${got} (expected ${expect})`);
      process.exit(1);
    }
  }
  console.log('Alias sanity OK:', report.aliasSanity);

  for (const item of SAFE_RESTORES) {
    const spot = spotBySlug(item.targetSlug);
    if (!spot) {
      report.restores.push({ ...item, status: 'skip', error: 'unknown-slug' });
      continue;
    }

    const { data: arch, error: archErr } = await supabase
      .from('place_wiki_archive')
      .select('*')
      .eq('place_id', item.archiveId)
      .maybeSingle();
    if (archErr) throw archErr;
    if (!arch || magScore(arch) < 4) {
      report.restores.push({ ...item, status: 'skip', error: 'archive-missing-or-empty' });
      continue;
    }

    const { data: live, error: liveErr } = await supabase
      .from('place_wiki')
      .select('place_id, name_ko, summary, sections')
      .eq('place_id', item.targetSlug)
      .maybeSingle();
    if (liveErr) throw liveErr;

    const liveScore = magScore(live);
    if (liveScore >= 4 && !item.force) {
      report.restores.push({
        ...item,
        status: 'skip',
        error: 'live-already-has-magazine',
        liveSummaryLen: String(live.summary || '').length,
        archSummaryLen: String(arch.summary || '').length,
      });
      continue;
    }

    const patch = {
      place_id: item.targetSlug,
      summary: arch.summary,
      sections: arch.sections,
      source_url: arch.source_url ?? null,
      name_ko: spot.name,
      name_en: spot.name_en ?? arch.name_en ?? null,
      lat: arch.lat ?? spot.lat ?? null,
      lng: arch.lng ?? spot.lng ?? null,
      source: 'restore-from-archive',
    };
    // AI 실무 정보는 있으면 때만 (빈 껍데기 덮어쓰기 방지 아님 — 원본 우선)
    if (arch.ai_practical_info && arch.ai_practical_info !== '[[LOADING]]') {
      patch.ai_practical_info = arch.ai_practical_info;
      patch.ai_info_updated_at = arch.ai_info_updated_at ?? null;
    }
    if (arch.essential_guide) patch.essential_guide = arch.essential_guide;

    report.restores.push({
      ...item,
      status: apply ? 'applied' : 'would-apply',
      liveStatus: live ? (liveScore >= 4 ? 'had-magazine' : 'empty-shell') : 'no-row',
      live_name_ko: live?.name_ko ?? null,
      archSummaryLen: String(arch.summary || '').length,
      archSections: Array.isArray(arch.sections) ? arch.sections.length : 0,
      preview: String(arch.summary || '').slice(0, 80),
    });

    if (apply) {
      const { error: upsertErr } = await supabase
        .from('place_wiki')
        .upsert(patch, { onConflict: 'place_id' });
      if (upsertErr) throw upsertErr;
      console.log(`Restored ${item.archiveId} → ${item.targetSlug}`);
    } else {
      console.log(`Would restore ${item.archiveId} → ${item.targetSlug} (${live ? 'empty-shell/overwrite' : 'insert'})`);
    }
  }

  for (const orphan of ORPHAN_LIVE_DELETE) {
    const { data: row, error } = await supabase
      .from('place_wiki')
      .select('*')
      .eq('place_id', orphan.place_id)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      report.orphans.push({ ...orphan, status: 'skip', error: 'not-found' });
      continue;
    }

    report.orphans.push({
      ...orphan,
      status: apply ? 'archived-and-deleted' : 'would-archive-and-delete',
      summaryLen: String(row.summary || '').length,
      sections: Array.isArray(row.sections) ? row.sections.length : 0,
    });

    if (apply) {
      const archiveRow = {
        ...row,
        archived_at: new Date().toISOString(),
        archive_reason: orphan.reason,
        superseded_by: 'uluru',
      };
      // archive PK may be place_id — insert; if conflict, ignore
      const { error: insErr } = await supabase.from('place_wiki_archive').insert(archiveRow);
      if (insErr && !String(insErr.message || '').includes('duplicate')) throw insErr;
      const { error: delErr } = await supabase
        .from('place_wiki')
        .delete()
        .eq('place_id', orphan.place_id);
      if (delErr) throw delErr;
      console.log(`Archived+deleted orphan live ${orphan.place_id}`);
    } else {
      console.log(`Would archive+delete orphan ${orphan.place_id}`);
    }
  }

  const outDir = join(__dirname, 'outputs');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'place-wiki-restore-apply.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('\nReport:', outPath);
  console.log(JSON.stringify({ restores: report.restores.map((r) => ({ id: r.archiveId, to: r.targetSlug, status: r.status })), orphans: report.orphans }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
