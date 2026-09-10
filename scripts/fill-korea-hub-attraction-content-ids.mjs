/**
 * hub attractions[] — Tour contentId 보강 (DB 우선 · LIVE 잔여).
 *
 *   node scripts/fill-korea-hub-attraction-content-ids.mjs --db-only --hubs=yeongdong,gyeongju
 *   node scripts/fill-korea-hub-attraction-content-ids.mjs --dry-run --limit=30
 *   node scripts/fill-korea-hub-attraction-content-ids.mjs --keyword-only --resume
 *
 * 쓰기: cityAttractionHubs.json attractions + 동명 팔경 멤버 contentId
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
const RESUME_PATH = join(__dirname, '.cache/hub-attraction-content-id-resume.json');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dbOnly = args.includes('--db-only');
const keywordOnly = args.includes('--keyword-only');
const useResume = args.includes('--resume');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) || 0 : 0;
const hubsArg = args.find((a) => a.startsWith('--hubs='));
const hubsFilter = hubsArg
  ? new Set(
      hubsArg
        .slice('--hubs='.length)
        .split(/[,|\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    )
  : null;

function targetKey(hubId, attractionName) {
  return `${hubId}::${attractionName}`;
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

function collectTargets(hubs, resumeProcessed) {
  const resumeSet = new Set(resumeProcessed || []);
  const targets = [];
  for (const hub of hubs) {
    if (hubsFilter && !hubsFilter.has(String(hub.hubId).toLowerCase())) continue;
    for (const attr of hub.attractions || []) {
      if (!attr?.name) continue;
      if (attr.contentId && /^\d{1,32}$/.test(String(attr.contentId))) continue;
      const key = targetKey(hub.hubId, attr.name);
      if (useResume && resumeSet.has(key)) continue;
      targets.push({ hub, attr, key });
    }
  }
  return limit > 0 ? targets.slice(0, limit) : targets;
}

function applyHits(lists, hubs, hits) {
  let hubApplied = 0;
  let memberApplied = 0;

  for (const { hubId, attractionName, hit } of hits) {
    const hub = hubs.find((h) => h.hubId === hubId);
    if (!hub) continue;
    const attr = (hub.attractions || []).find((a) => a.name === attractionName);
    if (!attr) continue;
    if (attr.contentId === hit.contentId) continue;
    attr.contentId = hit.contentId;
    hubApplied += 1;

    const nameKey = normalizeKey(attractionName);
    for (const list of lists) {
      if (list.hubId !== hubId || list.status !== 'verified') continue;
      const member = (list.members || []).find(
        (m) => normalizeKey(m.attractionName) === nameKey,
      );
      if (member && member.contentId !== hit.contentId) {
        member.contentId = hit.contentId;
        memberApplied += 1;
      }
    }
  }

  return { hubApplied, memberApplied };
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

  const targets = collectTargets(hubs, resume.processed);
  console.log(
    `[fill-hub-attraction-contentId] targets=${targets.length}${
      hubsFilter ? ` · hubs=${[...hubsFilter].join(',')}` : ''
    }${dbOnly ? ' · db-only' : ''}${keywordOnly ? ' · keyword-only' : ''}${
      useResume ? ' · resume' : ''
    }`,
  );

  const sb = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON);
  /** @type {Array<{ hubId: string, attractionName: string, hit: object }>} */
  const appliedHits = [];
  const processedKeys = [...(resume.processed || [])];

  if (!keywordOnly) {
    const dbRows = await loadDbRows(sb);
    console.log(`[fill-hub-attraction-contentId] DB rows=${dbRows.length}`);
    for (const { hub, attr, key } of targets) {
      if (
        appliedHits.some((h) => h.hubId === hub.hubId && h.attractionName === attr.name)
      ) {
        continue;
      }
      const sig = byHubSig[String(hub.hubId).toLowerCase()];
      const scoped =
        sig?.areaCode != null && sig.sigunguCode != null
          ? dbRows.filter(
              (r) =>
                r.areaCode === String(sig.areaCode) &&
                r.sigunguCode === String(sig.sigunguCode),
            )
          : dbRows;
      const member = {
        attractionName: attr.name,
        name: attr.name,
        lat: attr.lat,
        lng: attr.lng,
      };
      const best =
        pickBest(member, hub, scoped) ||
        (scoped !== dbRows ? pickBest(member, hub, dbRows) : null);
      if (best) {
        appliedHits.push({
          hubId: hub.hubId,
          attractionName: attr.name,
          hit: { ...best, src: 'db' },
        });
        console.log(
          `OK  DB  ${hub.hubId}/${attr.name} → ${best.contentId} ${best.tourTitle} (${best.score})`,
        );
      } else {
        console.log(`MISS DB  ${hub.hubId}/${attr.name}`);
      }
      if (!processedKeys.includes(key)) processedKeys.push(key);
    }
  }

  if (!dbOnly) {
    const remain = targets.filter(
      ({ hub, attr }) =>
        !appliedHits.some(
          (h) => h.hubId === hub.hubId && h.attractionName === attr.name,
        ),
    );
    console.log(`[fill-hub-attraction-contentId] keyword pass remain=${remain.length}`);
    let rateLimited = false;
    for (const { hub, attr, key } of remain) {
      if (rateLimited) break;
      const member = {
        attractionName: attr.name,
        name: attr.name,
        lat: attr.lat,
        lng: attr.lng,
      };
      const queries = [...new Set([attr.name])];
      let best = null;
      for (const q of queries) {
        if (rateLimited) break;
        const res = await fetchKeywordItems(SUPABASE_URL, SUPABASE_ANON, q);
        if (res.rateLimited) {
          console.warn(`[keyword] 429 — stop keyword pass at ${hub.hubId}/${attr.name}`);
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
          hubId: hub.hubId,
          attractionName: attr.name,
          hit: { ...best, src: 'keyword' },
        });
        console.log(
          `OK  KW  ${hub.hubId}/${attr.name} → ${best.contentId} ${best.tourTitle} (${best.score})`,
        );
      } else if (!rateLimited) {
        console.log(`MISS KW  ${hub.hubId}/${attr.name}`);
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
        `  ${row.hubId} ${row.attractionName} ${row.hit.contentId} ${row.hit.tourTitle} [${row.hit.src}]`,
      );
    }
    console.log('dry-run: JSON not written');
    return;
  }
  if (!appliedHits.length) {
    console.log('no hits — nothing to write');
    return;
  }

  const { hubApplied, memberApplied } = applyHits(lists, hubs, appliedHits);
  writeFileSync(HUBS_PATH, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
  writeFileSync(LISTS_PATH, `${JSON.stringify(lists, null, 2)}\n`, 'utf8');
  console.log(`wrote hubAttrs=${hubApplied} members=${memberApplied}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
