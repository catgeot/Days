/**
 * place_toolkit.place_id 병합·리네임 (Phase 0)
 *
 *   npm run toolkit:reconcile-place-id -- --dry-run
 *   npm run toolkit:reconcile-place-id -- --apply
 *   npm run toolkit:reconcile-place-id -- --apply --only=borneo,angkor-wat
 *
 * --apply 전 Supabase Table Editor 백업 권장.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { essentialGuideHasContent, parseEssentialGuide } from '../src/utils/toolkitPlaceIdResolve.js';
import {
  PLACE_TOOLKIT_DELETE_ONLY,
  PLACE_TOOLKIT_RECONCILE_RULES
} from './data/place-toolkit-reconcile-rules.mjs';
import { auditPlaceToolkitRows } from './lib/audit-place-toolkit.mjs';
import { fetchAllPlaceToolkits } from './lib/fetch-place-toolkit.mjs';
import { normalizePlaceKey } from './lib/travel-spot-place-resolve.mjs';
import { createSupabaseScriptClient } from './lib/supabase-script-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, 'outputs/place-toolkit-place-id-reconcile.json');

const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const onlyIds = onlyArg
  ? onlyArg
      .slice('--only='.length)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

function guideRichnessScore(row) {
  const guide = parseEssentialGuide(row?.essential_guide);
  if (!guide || !essentialGuideHasContent(guide)) return 0;
  let score = 1;
  if (guide.categories && typeof guide.categories === 'object') {
    score += Object.keys(guide.categories).length;
  }
  if (Array.isArray(guide.journey_timeline)) score += guide.journey_timeline.length;
  return score;
}

function matchesMergeFrom(placeId, mergeFrom) {
  const n = normalizePlaceKey(placeId);
  return mergeFrom.some((m) => normalizePlaceKey(m) === n);
}

function buildReconcilePlan(toolkitRows, rules) {
  const audit = auditPlaceToolkitRows(toolkitRows);
  const spotsBySlug = new Map(TRAVEL_SPOTS.map((s) => [s.slug, s]));

  const plan = {
    generatedAt: new Date().toISOString(),
    dryRun,
    apply,
    onlyIds,
    auditSummary: audit.summary,
    rules: [],
    skipped: [],
    deleteOnly: [],
    totals: { rename: 0, merge: 0, delete: 0, deleteOnly: 0, flagOnly: 0 }
  };

  const activeRules = onlyIds
    ? rules.filter((r) => onlyIds.includes(r.id))
    : rules;

  for (const rule of activeRules) {
    const rulePlan = {
      id: rule.id,
      canonicalPlaceId: rule.canonicalPlaceId,
      action: rule.action ?? 'merge_into_canonical',
      note: rule.note ?? null,
      flagOnly: [],
      renames: [],
      merges: [],
      deletes: []
    };

    const matchingRows = toolkitRows.filter((row) => matchesMergeFrom(row.place_id, rule.mergeFrom));

    if (rule.action === 'flag_only') {
      for (const row of matchingRows) {
        rulePlan.flagOnly.push({
          place_id: row.place_id,
          toolkit_updated_at: row.toolkit_updated_at,
          note: rule.note
        });
      }
      plan.totals.flagOnly += rulePlan.flagOnly.length;
      plan.rules.push(rulePlan);
      continue;
    }

    const canonicalPlaceId = rule.canonicalPlaceId;
    const canonicalRow =
      toolkitRows.find((r) => r.place_id === canonicalPlaceId) ??
      toolkitRows.find((r) => normalizePlaceKey(r.place_id) === normalizePlaceKey(canonicalPlaceId));
    /** 표기만 다른 중복(앙코르 와트 / 앙코르와트) — 정규화 키가 같아도 문자열이 다르면 병합 대상 */
    const nonCanonical = matchingRows.filter((r) => r.place_id !== canonicalPlaceId);

    if (!canonicalRow && nonCanonical.length) {
      const best = [...nonCanonical].sort(
        (a, b) =>
          guideRichnessScore(b) - guideRichnessScore(a) ||
          (b.toolkit_updated_at || '').localeCompare(a.toolkit_updated_at || '')
      )[0];
      rulePlan.renames.push({
        from: best.place_id,
        to: canonicalPlaceId,
        reason: 'canonical 행 없음 — 가장 풍부한 행을 canonical로 리네임'
      });
      plan.totals.rename += 1;

      const rest = nonCanonical.filter((r) => r !== best);
      for (const row of rest) {
        rulePlan.merges.push({
          from: row.place_id,
          into: canonicalPlaceId,
          guideScore: guideRichnessScore(row)
        });
        rulePlan.deletes.push({ place_id: row.place_id, after: 'merge_into_canonical' });
        plan.totals.merge += 1;
        plan.totals.delete += 1;
      }
    } else {
      for (const row of nonCanonical) {
        rulePlan.merges.push({
          from: row.place_id,
          into: canonicalPlaceId,
          guideScore: guideRichnessScore(row),
          canonicalExists: Boolean(canonicalRow)
        });
        rulePlan.deletes.push({ place_id: row.place_id, after: 'merge_into_canonical' });
        plan.totals.merge += 1;
        plan.totals.delete += 1;
      }
    }

    const spot = rule.slugs?.[0] ? spotsBySlug.get(rule.slugs[0]) : null;
    if (spot) {
      rulePlan.spot = { slug: spot.slug, name: spot.name, lat: spot.lat, lng: spot.lng };
    }

    plan.rules.push(rulePlan);
  }

  const runDeleteOnly =
    !onlyIds || onlyIds.includes(PLACE_TOOLKIT_DELETE_ONLY.ruleId);
  const deleteOnlyIds = runDeleteOnly ? PLACE_TOOLKIT_DELETE_ONLY.placeIds : [];
  for (const placeId of deleteOnlyIds) {
    const row = toolkitRows.find((r) => r.place_id === placeId);
    if (row) {
      plan.deleteOnly.push({ place_id: placeId, reason: 'SSOT slug 없음·허브 IATA 오탐' });
      plan.totals.deleteOnly += 1;
      plan.totals.delete += 1;
    }
  }

  return plan;
}

async function applyPlan(supabase, plan) {
  for (const rule of plan.rules) {
    if (rule.action === 'flag_only') continue;

    for (const rename of rule.renames) {
      const { error } = await supabase
        .from('place_toolkit')
        .update({ place_id: rename.to })
        .eq('place_id', rename.from);
      if (error) throw new Error(`rename ${rename.from} → ${rename.to}: ${error.message}`);
    }

    for (const del of rule.deletes) {
      const { error } = await supabase.from('place_toolkit').delete().eq('place_id', del.place_id);
      if (error) throw new Error(`delete ${del.place_id}: ${error.message}`);
    }
  }

  for (const del of plan.deleteOnly ?? []) {
    const { error } = await supabase.from('place_toolkit').delete().eq('place_id', del.place_id);
    if (error) throw new Error(`delete-only ${del.place_id}: ${error.message}`);
  }
}

function printPlan(plan) {
  console.log('\n=== reconcile plan ===');
  console.log('모드:', plan.apply ? 'APPLY' : plan.dryRun ? 'dry-run' : '(지정 없음 — dry-run으로 처리)');
  console.log('audit 요약:', plan.auditSummary);
  console.log('예정:', plan.totals);

  for (const rule of plan.rules) {
    console.log(`\n[${rule.id}] → canonical "${rule.canonicalPlaceId}" (${rule.action ?? 'merge'})`);
    if (rule.note) console.log('  note:', rule.note);
    if (rule.flagOnly?.length) {
      for (const f of rule.flagOnly) console.log(`  flag: ${f.place_id}`);
    }
    for (const r of rule.renames ?? []) console.log(`  rename: ${r.from} → ${r.to}`);
    for (const m of rule.merges ?? []) console.log(`  merge+delete: ${m.from} → ${m.into} (score ${m.guideScore})`);
    if (!rule.renames?.length && !rule.merges?.length && !rule.flagOnly?.length) {
      console.log('  (DB 변경 없음 — canonical 단일 또는 매칭 행 없음)');
    }
  }

  if (plan.deleteOnly?.length) {
    console.log('\n[delete-only] SSOT slug 없음·오탐 행');
    for (const d of plan.deleteOnly) console.log(`  delete: ${d.place_id} — ${d.reason}`);
  }
}

async function main() {
  if (!dryRun && !apply) {
    console.error('--dry-run 또는 --apply 중 하나를 지정하세요.');
    process.exit(1);
  }

  if (apply && dryRun) {
    console.error('--dry-run과 --apply는 동시에 사용할 수 없습니다.');
    process.exit(1);
  }

  const supabase = createSupabaseScriptClient();

  console.log(apply ? '[apply] ' : '[dry-run] ', 'place_toolkit 조회 중…');
  const rows = await fetchAllPlaceToolkits(supabase);
  console.log('툴킷 행:', rows.length);

  const plan = buildReconcilePlan(rows, PLACE_TOOLKIT_RECONCILE_RULES);
  plan.dryRun = dryRun || !apply;

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(plan, null, 2), 'utf-8');

  printPlan(plan);
  console.log('\n리포트:', OUTPUT_PATH);

  if (apply) {
    console.log('\nDB 적용 중…');
    await applyPlan(supabase, plan);
    console.log('적용 완료.');
  } else {
    console.log('\nDB 변경 없음 (dry-run). 적용은 세션 3에서 --apply --only=…');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
