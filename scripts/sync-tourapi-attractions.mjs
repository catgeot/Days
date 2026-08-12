#!/usr/bin/env node
/**
 * TourAPI contentTypeId=12 → Supabase tourapi_attraction 주간 sync.
 * 목록만 · 시도≈17회 · detail 전수 금지.
 * + GATEO 선정 contentId 보강: areacode 공백 POI는 areaBasedList에 없어
 *   searchKeyword로 붙이고 주소·lclsSystm으로 area/cat을 채운다.
 *
 * 필요 env:
 *   TOUR_API_SERVICE_KEY
 *   VITE_SUPABASE_URL (또는 SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 *   npm run sync:tourapi-attractions
 *   npm run sync:tourapi-attractions -- --area=1
 *   npm run sync:tourapi-attractions -- --dry-run
 *   npm run sync:tourapi-attractions -- --curated-only
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TOURAPI_AREA_CODES } from './lib/tourapi-attraction-areas.mjs';
import { fillTourAttractionMeta } from './lib/tourapi-attraction-infer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY = String(process.env.TOUR_API_SERVICE_KEY || '').trim();
const SUPABASE_URL = String(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
).trim();
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const CONTENT_TYPE_ID = '12';
const PAGE_ROWS = 1000;
const UPSERT_CHUNK = 200;
const SLEEP_MS = 120;
const CURATED_BACKFILL_SLEEP_MS = 220;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const curatedOnly = args.includes('--curated-only');
const areaOnly = (() => {
  const hit = args.find((a) => a.startsWith('--area='));
  return hit ? String(hit.slice('--area='.length)).trim() : '';
})();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function asItemArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') return [raw];
  return [];
}

function pickStr(item, ...keys) {
  for (const k of keys) {
    const v = item?.[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function pickNum(item, ...keys) {
  const s = pickStr(item, ...keys);
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function getJson(path, params) {
  const qs = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: 'gateo',
    _type: 'json',
    ...params,
  });
  const url = `${BASE}/${path}?serviceKey=${KEY}&${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

function mapRow(item, syncedAt) {
  const filled = fillTourAttractionMeta(item);
  const contentId = pickStr(filled, 'contentid', 'contentId');
  const title = pickStr(filled, 'title');
  if (!contentId || !/^\d{1,32}$/.test(contentId) || !title) return null;
  return {
    content_id: contentId,
    content_type_id: pickStr(filled, 'contenttypeid', 'contentTypeId') || CONTENT_TYPE_ID,
    title,
    addr1: pickStr(filled, 'addr1'),
    addr2: pickStr(filled, 'addr2'),
    area_code: pickStr(filled, 'areacode', 'areaCode'),
    sigungu_code: pickStr(filled, 'sigungucode', 'sigunguCode'),
    cat1: pickStr(filled, 'cat1'),
    cat2: pickStr(filled, 'cat2'),
    cat3: pickStr(filled, 'cat3'),
    mapx: pickNum(filled, 'mapx', 'mapX'),
    mapy: pickNum(filled, 'mapy', 'mapY'),
    first_image: pickStr(filled, 'firstimage', 'firstImage'),
    tel: pickStr(filled, 'tel'),
    modified_time: pickStr(filled, 'modifiedtime', 'modifiedTime'),
    active: true,
    synced_at: syncedAt,
    updated_at: syncedAt,
  };
}

/**
 * GATEO 선정 contentId — areaBasedList에 없는(areacode 공백) POI 보강.
 * @returns {{ id: string, keyword: string, addr1: string | null }[]}
 */
function loadCuratedAttractionSeeds() {
  const path = join(
    __dirname,
    '../src/pages/Home/data/koreaScenicSpots.json',
  );
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  /** @type {Map<string, { id: string, keyword: string, addr1: string | null }>} */
  const byId = new Map();
  for (const s of Array.isArray(raw?.spots) ? raw.spots : []) {
    const id = String(s?.contentId || '').trim();
    if (!/^\d{1,32}$/.test(id)) continue;
    const keyword = String(s?.attractionName || s?.name || '').trim();
    if (!keyword) continue;
    if (byId.has(id)) continue;
    byId.set(id, {
      id,
      keyword,
      addr1: null,
    });
  }
  return [...byId.values()];
}

async function searchKeywordItems(keyword) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const body = await getJson('searchKeyword2', {
        keyword: String(keyword).slice(0, 40),
        contentTypeId: CONTENT_TYPE_ID,
        numOfRows: '20',
        pageNo: '1',
      });
      const header = body?.response?.header;
      const resultCode =
        header?.resultCode != null ? String(header.resultCode) : null;
      if (resultCode && resultCode !== '0000') {
        throw new Error(
          `searchKeyword ${keyword}: ${resultCode} ${header?.resultMsg || ''}`,
        );
      }
      return asItemArray(body?.response?.body?.items?.item);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (!/429|LIMIT|rate/i.test(msg) || attempt === 3) break;
      await sleep(CURATED_BACKFILL_SLEEP_MS * attempt * 3);
    }
  }
  throw lastErr;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} sb
 * @param {string} syncedAt
 * @param {string[]} keepIds
 * @param {boolean} dryRun
 */
async function backfillCuratedMissing(sb, syncedAt, keepIds, dryRun) {
  const seeds = loadCuratedAttractionSeeds();
  const keep = new Set(keepIds);
  const need = seeds.filter((s) => !keep.has(s.id));
  console.log(`curated backfill candidates=${need.length} (seeds=${seeds.length})`);
  let upserted = 0;
  let skipped = 0;
  for (const seed of need) {
    try {
      const items = await searchKeywordItems(seed.keyword);
      const hit =
        items.find(
          (it) => String(it?.contentid || it?.contentId || '').trim() === seed.id,
        ) || null;
      if (!hit) {
        skipped += 1;
        await sleep(CURATED_BACKFILL_SLEEP_MS);
        continue;
      }
      const row = mapRow(
        fillTourAttractionMeta(hit, { addr1: pickStr(hit, 'addr1') }),
        syncedAt,
      );
      if (!row || !row.area_code) {
        // area 추론 실패 시에도 제목 검색은 되게 active 유지 시도
        if (row && !row.area_code) {
          const inferred = fillTourAttractionMeta({
            ...hit,
            addr1: pickStr(hit, 'addr1') || seed.keyword,
          });
          const again = mapRow(inferred, syncedAt);
          if (again?.area_code) {
            Object.assign(row, again);
          }
        }
      }
      if (!row) {
        skipped += 1;
        await sleep(CURATED_BACKFILL_SLEEP_MS);
        continue;
      }
      if (!dryRun && sb) {
        await upsertChunk(sb, [row]);
      }
      keepIds.push(row.content_id);
      upserted += 1;
    } catch (err) {
      console.warn(`backfill skip ${seed.id} ${seed.keyword}:`, err?.message || err);
      skipped += 1;
    }
    await sleep(CURATED_BACKFILL_SLEEP_MS);
  }
  console.log(`curated backfill upserted=${upserted} skipped=${skipped}`);
  return upserted;
}

async function fetchAreaAll(areaCode) {
  const rows = [];
  let pageNo = 1;
  let totalCount = null;
  for (;;) {
    const body = await getJson('areaBasedList2', {
      contentTypeId: CONTENT_TYPE_ID,
      areaCode: String(areaCode),
      numOfRows: String(PAGE_ROWS),
      pageNo: String(pageNo),
    });
    const header = body?.response?.header;
    const resultCode = header?.resultCode != null ? String(header.resultCode) : null;
    if (resultCode && resultCode !== '0000') {
      throw new Error(
        `TourAPI ${areaCode} p${pageNo}: ${resultCode} ${header?.resultMsg || ''}`,
      );
    }
    const respBody = body?.response?.body;
    if (totalCount == null) {
      const n = Number(respBody?.totalCount);
      totalCount = Number.isFinite(n) ? n : 0;
    }
    const items = asItemArray(respBody?.items?.item);
    rows.push(...items);
    if (items.length < PAGE_ROWS) break;
    if (totalCount != null && rows.length >= totalCount) break;
    pageNo += 1;
    if (pageNo > 20) break;
    await sleep(SLEEP_MS);
  }
  return { totalCount: totalCount ?? rows.length, items: rows };
}

async function upsertChunk(sb, chunk) {
  const { error } = await sb.from('tourapi_attraction').upsert(chunk, {
    onConflict: 'content_id',
  });
  if (error) throw new Error(`upsert: ${error.message}`);
}

async function deactivateMissing(sb, keepIds, syncedAt) {
  const { data, error } = await sb
    .from('tourapi_attraction')
    .select('content_id')
    .eq('content_type_id', CONTENT_TYPE_ID)
    .eq('active', true);
  if (error) throw new Error(`select active: ${error.message}`);
  const keep = new Set(keepIds);
  const toOff = (data || [])
    .map((r) => r.content_id)
    .filter((id) => id && !keep.has(id));
  for (let i = 0; i < toOff.length; i += UPSERT_CHUNK) {
    const ids = toOff.slice(i, i + UPSERT_CHUNK);
    const { error: upErr } = await sb
      .from('tourapi_attraction')
      .update({ active: false, updated_at: syncedAt, synced_at: syncedAt })
      .in('content_id', ids);
    if (upErr) throw new Error(`deactivate: ${upErr.message}`);
  }
  return toOff.length;
}

async function main() {
  if (!KEY) {
    console.error('TOUR_API_SERVICE_KEY missing');
    process.exit(2);
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(2);
  }

  const areas = curatedOnly
    ? []
    : areaOnly
      ? TOURAPI_AREA_CODES.filter(([code]) => code === areaOnly)
      : TOURAPI_AREA_CODES;
  if (!curatedOnly && !areas.length) {
    console.error(`unknown --area=${areaOnly}`);
    process.exit(1);
  }

  const sb = dryRun
    ? null
    : createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

  const syncedAt = new Date().toISOString();
  const keepIds = [];
  let upserted = 0;

  console.log(
    `=== sync tourapi_attraction type12 · areas=${areas.length}` +
      `${curatedOnly ? ' · curated-only' : ''}` +
      `${dryRun ? ' · dry-run' : ''} ===`,
  );

  for (const [code, name] of areas) {
    const { totalCount, items } = await fetchAreaAll(code);
    const mapped = [];
    for (const item of items) {
      const row = mapRow(item, syncedAt);
      if (!row) continue;
      mapped.push(row);
      keepIds.push(row.content_id);
    }
    console.log(`${code}\t${name}\ttotal=${totalCount}\tmapped=${mapped.length}`);
    if (!dryRun) {
      for (let i = 0; i < mapped.length; i += UPSERT_CHUNK) {
        await upsertChunk(sb, mapped.slice(i, i + UPSERT_CHUNK));
      }
    }
    upserted += mapped.length;
    await sleep(SLEEP_MS);
  }

  // areaBased에 없는 선정 POI(areacode 공백) 보강 — deactivate 전에 keepIds에 포함
  if (!areaOnly || curatedOnly) {
    const existing = new Set(keepIds);
    if (sb && !dryRun) {
      const { data, error } = await sb
        .from('tourapi_attraction')
        .select('content_id')
        .eq('content_type_id', CONTENT_TYPE_ID)
        .eq('active', true);
      if (error) throw new Error(`select active for keep: ${error.message}`);
      for (const r of data || []) {
        if (r.content_id) existing.add(r.content_id);
      }
    }
    const seedKeep = [...existing];
    const backfilled = await backfillCuratedMissing(
      sb,
      syncedAt,
      seedKeep,
      dryRun,
    );
    for (const id of seedKeep) {
      if (!keepIds.includes(id)) keepIds.push(id);
    }
    upserted += backfilled;
  }

  let deactivated = 0;
  if (!dryRun && !areaOnly && !curatedOnly) {
    deactivated = await deactivateMissing(sb, keepIds, syncedAt);
  }

  let activeCount = null;
  if (!dryRun) {
    const { count, error } = await sb
      .from('tourapi_attraction')
      .select('content_id', { count: 'exact', head: true })
      .eq('content_type_id', CONTENT_TYPE_ID)
      .eq('active', true);
    if (error) throw new Error(`count: ${error.message}`);
    activeCount = count;
  }

  console.log(
    `DONE upserted≈${upserted} deactivated=${deactivated}` +
      (activeCount != null ? ` active=${activeCount}` : ''),
  );
  if (!dryRun && !areaOnly && !curatedOnly && (activeCount == null || activeCount < 5000)) {
    console.error(`FAIL active≈7k expected (got ${activeCount})`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
