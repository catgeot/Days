/**
 * 팔경 멤버 contentId — 키워드 종결 (LIVE 후보만 · AI 숫자 기입 금지).
 *
 *   node scripts/close-korea-local-scenic-content-ids.mjs --inventory
 *   node scripts/close-korea-local-scenic-content-ids.mjs --bucket=short --limit=40 --dry-run
 *   node scripts/close-korea-local-scenic-content-ids.mjs --bucket=short --limit=40 --apply-unique
 *
 * 종결: unique_hit | tour_missing | hub_mismatch | ambiguous | siho_wait
 * 쓰기: koreaLocalScenicLists.json + korea-local-scenic-content-id-close.json
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './lib/load-env-file.mjs';
import {
  CLOSE_BUCKETS,
  acceptUniqueLiveHit,
  classifyScenicMember,
  fetchKeywordItems,
  normalizeKey,
  strategyQueries,
} from './lib/tour-content-id-match.mjs';

loadEnvFile();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LISTS_PATH = join(ROOT, 'src/pages/Home/data/koreaLocalScenicLists.json');
const HUBS_PATH = join(ROOT, 'src/pages/Home/data/cityAttractionHubs.json');
const CLOSE_PATH = join(__dirname, 'data/korea-local-scenic-content-id-close.json');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const args = process.argv.slice(2);
const inventoryOnly = args.includes('--inventory');
const dryRun = args.includes('--dry-run');
const applyUnique = args.includes('--apply-unique');
const retryClosed = args.includes('--retry-closed');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) || 0 : 0;
const bucketArg = args.find((a) => a.startsWith('--bucket='));
const bucketFilter = bucketArg ? bucketArg.slice('--bucket='.length).trim().toLowerCase() : '';

const TERMINAL = new Set(['unique_hit', 'tour_missing', 'hub_mismatch']);

function memberKey(listId, attractionName) {
  return `${listId}::${attractionName}`;
}

function loadClose() {
  try {
    return JSON.parse(readFileSync(CLOSE_PATH, 'utf8'));
  } catch {
    return { version: 1, items: {} };
  }
}

function emptyCloseDoc() {
  return {
    version: 1,
    note: 'P0 팔경 멤버 contentId 종결. LIVE 행만 unique_hit. AI 숫자 기입 금지.',
    updated: new Date().toISOString().slice(0, 10),
    items: {},
  };
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

function collectOpen(lists, hubs, closeDoc) {
  const hubById = new Map(hubs.map((h) => [String(h.hubId).toLowerCase(), h]));
  const rows = [];
  for (const list of lists) {
    if (list.status !== 'verified') continue;
    for (const member of list.members || []) {
      if (!member?.attractionName) continue;
      if (member.contentId && /^\d{1,32}$/.test(String(member.contentId))) continue;
      const key = memberKey(list.listId, member.attractionName);
      const prev = closeDoc.items[key];
      if (!retryClosed && prev && TERMINAL.has(prev.status)) continue;
      const hub = hubById.get(String(list.hubId).toLowerCase()) || {
        hubId: list.hubId,
        name: list.hubId,
      };
      const bucket = classifyScenicMember(member, hub);
      const queries = strategyQueries(member, hub);
      rows.push({ list, member, hub, key, bucket, queries, prev });
    }
  }
  return rows;
}

async function liveClose(row) {
  const items = [];
  let rateLimited = false;
  const seenKw = new Set();
  for (const q of row.queries) {
    if (rateLimited) break;
    if (seenKw.has(q)) continue;
    seenKw.add(q);
    const res = await fetchKeywordItems(SUPABASE_URL, SUPABASE_ANON, q);
    if (res.rateLimited) {
      rateLimited = true;
      break;
    }
    if (res.ok && res.items?.length) items.push(...res.items);
  }
  if (rateLimited) return { status: 'rate_limited', items };
  let verdict = acceptUniqueLiveHit(row.member, row.hub, items);
  if (verdict.status === 'tour_missing' && row.bucket === 'siho') {
    verdict = { ...verdict, status: 'siho_wait' };
  }
  return { ...verdict, itemCount: items.length };
}

async function main() {
  const lists = JSON.parse(readFileSync(LISTS_PATH, 'utf8'));
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const closeDoc = loadClose();
  if (!closeDoc.items) closeDoc.items = {};

  const open = collectOpen(lists, hubs, closeDoc);
  const counts = Object.fromEntries(CLOSE_BUCKETS.map((b) => [b, 0]));
  counts.closed = Object.values(closeDoc.items).filter((it) => TERMINAL.has(it.status)).length;
  for (const row of open) counts[row.bucket] = (counts[row.bucket] || 0) + 1;

  if (inventoryOnly) {
    const next = emptyCloseDoc();
    next.items = { ...closeDoc.items };
    for (const row of open) {
      const prev = next.items[row.key];
      if (prev && TERMINAL.has(prev.status)) continue;
      next.items[row.key] = {
        status: prev?.status === 'siho_wait' ? 'siho_wait' : 'open',
        bucket: row.bucket,
        hubId: row.list.hubId,
        queries: row.queries,
      };
    }
    writeFileSync(CLOSE_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log(
      `[close-local-scenic] inventory open=${open.length} ${JSON.stringify(counts)} wrote ${CLOSE_PATH}`,
    );
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('Need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }
  if (bucketFilter && !CLOSE_BUCKETS.includes(bucketFilter)) {
    throw new Error(`--bucket= one of ${CLOSE_BUCKETS.join(',')}`);
  }
  if (!applyUnique && !dryRun) {
    throw new Error('Use --dry-run or --apply-unique');
  }

  let targets = bucketFilter ? open.filter((r) => r.bucket === bucketFilter) : open;
  if (limit > 0) targets = targets.slice(0, limit);

  console.log(
    `[close-local-scenic] targets=${targets.length}${
      bucketFilter ? ` · bucket=${bucketFilter}` : ''
    }${dryRun ? ' · dry-run' : ''}${applyUnique ? ' · apply-unique' : ''}`,
  );

  const hits = [];
  const tallies = {
    unique_hit: 0,
    tour_missing: 0,
    hub_mismatch: 0,
    ambiguous: 0,
    siho_wait: 0,
    rate_limited: 0,
  };

  for (const row of targets) {
    const verdict = await liveClose(row);
    tallies[verdict.status] = (tallies[verdict.status] || 0) + 1;
    const rec = {
      status: verdict.status,
      bucket: row.bucket,
      hubId: row.list.hubId,
      queries: row.queries,
    };
    if (verdict.contentId) rec.contentId = verdict.contentId;
    if (verdict.tourTitle) rec.tourTitle = verdict.tourTitle;
    if (verdict.titles) rec.titles = verdict.titles;
    if (verdict.contentIds) rec.contentIds = verdict.contentIds;
    closeDoc.items[row.key] = rec;

    const label = `${row.list.listId}/${row.member.attractionName}`;
    if (verdict.status === 'unique_hit') {
      console.log(`HIT  ${label} → ${verdict.contentId} ${verdict.tourTitle}`);
      hits.push({
        listId: row.list.listId,
        attractionName: row.member.attractionName,
        hit: { contentId: verdict.contentId, tourTitle: verdict.tourTitle },
      });
    } else if (verdict.status === 'rate_limited') {
      console.warn(`429  ${label} — stop`);
      break;
    } else {
      console.log(
        `CLOSE ${verdict.status} ${label}${
          verdict.tourTitle ? ` · ${verdict.tourTitle}` : ''
        }${verdict.titles ? ` · ${verdict.titles.join('|')}` : ''}`,
      );
    }
  }

  closeDoc.updated = new Date().toISOString().slice(0, 10);
  closeDoc.note =
    'P0 팔경 멤버 contentId 종결. LIVE 행만 unique_hit. AI 숫자 기입 금지.';

  console.log(`\nsummary ${JSON.stringify(tallies)} hits=${hits.length}/${targets.length}`);

  if (dryRun) {
    console.log('dry-run: JSON not written');
    return;
  }

  writeFileSync(CLOSE_PATH, `${JSON.stringify(closeDoc, null, 2)}\n`, 'utf8');
  if (hits.length) {
    const { memberApplied, hubApplied } = applyHits(lists, hubs, hits);
    writeFileSync(LISTS_PATH, `${JSON.stringify(lists, null, 2)}\n`, 'utf8');
    writeFileSync(HUBS_PATH, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
    console.log(`wrote members=${memberApplied} hubAttrs=${hubApplied} close=${CLOSE_PATH}`);
  } else {
    console.log(`wrote close=${CLOSE_PATH} (no list hits)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
