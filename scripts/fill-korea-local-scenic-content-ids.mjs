/**
 * 팔경·구경 멤버 — Tour contentId 보강 (DB 우선 · LIVE 잔여).
 *
 *   node scripts/fill-korea-local-scenic-content-ids.mjs --db-only --lists=mungyeong-palgyeong
 *   node scripts/fill-korea-local-scenic-content-ids.mjs --dry-run --limit=30
 *   node scripts/fill-korea-local-scenic-content-ids.mjs --keyword-only --resume
 *
 * 쓰기: koreaLocalScenicLists.json members + 동명 hub attraction contentId
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './lib/load-env-file.mjs';
import {
  createSupabaseClient,
  fetchKeywordItems,
  loadDbRows,
  normalizeKey,
  pickBest,
  sleep,
} from './lib/tour-content-id-match.mjs';

loadEnvFile();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LISTS_PATH = join(ROOT, 'src/pages/Home/data/koreaLocalScenicLists.json');
const HUBS_PATH = join(ROOT, 'src/pages/Home/data/cityAttractionHubs.json');
const SIGUNGU_PATH = join(ROOT, 'src/pages/Home/data/koreaSigunguByHub.json');
const RESUME_PATH = join(__dirname, '.cache/local-scenic-content-id-resume.json');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dbOnly = args.includes('--db-only');
const keywordOnly = args.includes('--keyword-only');
const useResume = args.includes('--resume');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) || 0 : 0;
const listsArg = args.find((a) => a.startsWith('--lists='));
const listsFilter = listsArg
  ? new Set(
      listsArg
        .slice('--lists='.length)
        .split(/[,|\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    )
  : null;
const hubArg = args.find((a) => a.startsWith('--hub='));
const hubFilter = hubArg
  ? hubArg
      .slice('--hub='.length)
      .trim()
      .toLowerCase()
  : null;

function memberKey(listId, attractionName) {
  return `${listId}::${attractionName}`;
}

function loadResume() {
  if (!existsSync(RESUME_PATH)) return { processed: [], rateLimitedAt: null };
  try {
    return JSON.parse(readFileSync(RESUME_PATH, 'utf8'));
  } catch {
    return { processed: [], rateLimitedAt: null };
  }
}

function saveResume(data) {
  mkdirSync(dirname(RESUME_PATH), { recursive: true });
  writeFileSync(RESUME_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function collectTargets(lists, resumeProcessed) {
  const resumeSet = new Set(resumeProcessed || []);
  const targets = [];
  for (const list of lists) {
    if (list.status !== 'verified') continue;
    if (listsFilter && !listsFilter.has(String(list.listId).toLowerCase())) continue;
    if (hubFilter && String(list.hubId).toLowerCase() !== hubFilter) continue;
    for (const member of list.members || []) {
      if (!member?.attractionName) continue;
      if (member.contentId && /^\d{1,32}$/.test(String(member.contentId))) continue;
      const key = memberKey(list.listId, member.attractionName);
      if (useResume && resumeSet.has(key)) continue;
      targets.push({ list, member, key });
    }
  }
  return limit > 0 ? targets.slice(0, limit) : targets;
}

function applyHits(lists, hubs, hits) {
  let memberApplied = 0;
  let hubApplied = 0;

  for (const { listId, attractionName, hit } of hits) {
    const list = lists.find((l) => l.listId === listId);
    if (!list) continue;
    const member = (list.members || []).find((m) => m.attractionName === attractionName);
    if (!member) continue;
    if (member.contentId === hit.contentId) continue;
    member.contentId = hit.contentId;
    memberApplied += 1;

    const hub = hubs.find((h) => h.hubId === list.hubId);
    if (!hub) continue;
    const memberKeyNorm = normalizeKey(attractionName);
    const attr = (hub.attractions || []).find((a) => normalizeKey(a.name) === memberKeyNorm);
    if (attr && attr.contentId !== hit.contentId) {
      attr.contentId = hit.contentId;
      hubApplied += 1;
    }
  }

  return { memberApplied, hubApplied };
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('Need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }
  if (dbOnly && keywordOnly) {
    throw new Error('Use only one of --db-only or --keyword-only');
  }

  const resume = loadResume();
  if (resume.rateLimitedAt) {
    const day = resume.rateLimitedAt.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (day === today && keywordOnly) {
      console.error(`[blocked: quota] rateLimitedAt=${resume.rateLimitedAt} — keyword pass skipped today`);
      process.exit(2);
    }
  }

  const lists = JSON.parse(readFileSync(LISTS_PATH, 'utf8'));
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const sigungu = JSON.parse(readFileSync(SIGUNGU_PATH, 'utf8'));
  const byHubSig = sigungu.byHubId || {};
  const hubById = new Map(hubs.map((h) => [String(h.hubId).toLowerCase(), h]));

  const targets = collectTargets(lists, resume.processed);
  console.log(
    `[fill-local-scenic-contentId] targets=${targets.length}${
      listsFilter ? ` · lists=${[...listsFilter].join(',')}` : ''
    }${hubFilter ? ` · hub=${hubFilter}` : ''}${dbOnly ? ' · db-only' : ''}${
      keywordOnly ? ' · keyword-only' : ''
    }${useResume ? ' · resume' : ''}`,
  );

  const sb = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON);
  /** @type {Array<{ listId: string, attractionName: string, hit: object }>} */
  const appliedHits = [];
  const processedKeys = [...(resume.processed || [])];

  if (!keywordOnly) {
    const dbRows = await loadDbRows(sb);
    console.log(`[fill-local-scenic-contentId] DB rows=${dbRows.length}`);
    for (const { list, member, key } of targets) {
      if (appliedHits.some((h) => h.listId === list.listId && h.attractionName === member.attractionName)) {
        continue;
      }
      const hub = hubById.get(String(list.hubId).toLowerCase()) || {
        hubId: list.hubId,
        name: list.hubId,
      };
      const sig = byHubSig[String(list.hubId).toLowerCase()];
      const scoped =
        sig?.areaCode != null && sig.sigunguCode != null
          ? dbRows.filter(
              (r) =>
                r.areaCode === String(sig.areaCode) &&
                r.sigunguCode === String(sig.sigunguCode),
            )
          : dbRows;
      const best =
        pickBest(member, hub, scoped) ||
        (scoped !== dbRows ? pickBest(member, hub, dbRows) : null);
      if (best) {
        appliedHits.push({
          listId: list.listId,
          attractionName: member.attractionName,
          hit: { ...best, src: 'db' },
        });
        console.log(
          `OK  DB  ${list.listId}/${member.attractionName} → ${best.contentId} ${best.tourTitle} (${best.score})`,
        );
      } else {
        console.log(`MISS DB  ${list.listId}/${member.attractionName}`);
      }
      if (!processedKeys.includes(key)) processedKeys.push(key);
    }
  }

  if (!dbOnly) {
    const remain = targets.filter(
      ({ list, member }) =>
        !appliedHits.some(
          (h) => h.listId === list.listId && h.attractionName === member.attractionName,
        ),
    );
    console.log(`[fill-local-scenic-contentId] keyword pass remain=${remain.length}`);
    let rateLimited = false;
    for (const { list, member, key } of remain) {
      if (rateLimited) break;
      const hub = hubById.get(String(list.hubId).toLowerCase()) || {
        hubId: list.hubId,
        name: list.hubId,
      };
      const queries = [...new Set([member.attractionName])];
      let best = null;
      for (const q of queries) {
        if (rateLimited) break;
        const res = await fetchKeywordItems(SUPABASE_URL, SUPABASE_ANON, q);
        if (res.rateLimited) {
          console.warn(`[keyword] 429 — stop keyword pass at ${list.listId}/${member.attractionName}`);
          rateLimited = true;
          resume.rateLimitedAt = new Date().toISOString();
          break;
        }
        if (!res.ok || !res.items.length) continue;
        const hit = pickBest(member, hub, res.items);
        if (hit && (!best || hit.score > best.score)) best = hit;
      }
      if (best) {
        appliedHits.push({
          listId: list.listId,
          attractionName: member.attractionName,
          hit: { ...best, src: 'keyword' },
        });
        console.log(
          `OK  KW  ${list.listId}/${member.attractionName} → ${best.contentId} ${best.tourTitle} (${best.score})`,
        );
      } else if (!rateLimited) {
        console.log(`MISS KW  ${list.listId}/${member.attractionName}`);
      }
      if (!processedKeys.includes(key)) processedKeys.push(key);
    }
    if (rateLimited) {
      saveResume({ processed: processedKeys, rateLimitedAt: resume.rateLimitedAt });
      console.warn('[blocked: quota] resume saved — no same-day keyword retry');
    }
  }

  console.log(`\nsummary hits=${appliedHits.length}/${targets.length}`);
  if (useResume || !dbOnly) {
    saveResume({
      processed: processedKeys,
      rateLimitedAt: resume.rateLimitedAt,
    });
  }

  if (dryRun) {
    for (const row of appliedHits) {
      console.log(
        `  ${row.listId} ${row.attractionName} ${row.hit.contentId} ${row.hit.tourTitle} [${row.hit.src}]`,
      );
    }
    console.log('dry-run: JSON not written');
    return;
  }
  if (!appliedHits.length) {
    console.log('no hits — nothing to write');
    return;
  }

  const { memberApplied, hubApplied } = applyHits(lists, hubs, appliedHits);
  writeFileSync(LISTS_PATH, `${JSON.stringify(lists, null, 2)}\n`, 'utf8');
  writeFileSync(HUBS_PATH, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
  console.log(`wrote members=${memberApplied} hubAttrs=${hubApplied}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
