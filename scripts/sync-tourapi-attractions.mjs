#!/usr/bin/env node
/**
 * TourAPI contentTypeId=12 → Supabase tourapi_attraction 주간 sync.
 * 목록만 · 시도≈17회 · detail 전수 금지.
 *
 * 필요 env:
 *   TOUR_API_SERVICE_KEY
 *   VITE_SUPABASE_URL (또는 SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 *   npm run sync:tourapi-attractions
 *   npm run sync:tourapi-attractions -- --area=1
 *   npm run sync:tourapi-attractions -- --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { TOURAPI_AREA_CODES } from './lib/tourapi-attraction-areas.mjs';

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

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
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
  const contentId = pickStr(item, 'contentid', 'contentId');
  const title = pickStr(item, 'title');
  if (!contentId || !/^\d{1,32}$/.test(contentId) || !title) return null;
  return {
    content_id: contentId,
    content_type_id: pickStr(item, 'contenttypeid', 'contentTypeId') || CONTENT_TYPE_ID,
    title,
    addr1: pickStr(item, 'addr1'),
    addr2: pickStr(item, 'addr2'),
    area_code: pickStr(item, 'areacode', 'areaCode'),
    sigungu_code: pickStr(item, 'sigungucode', 'sigunguCode'),
    cat1: pickStr(item, 'cat1'),
    cat2: pickStr(item, 'cat2'),
    cat3: pickStr(item, 'cat3'),
    mapx: pickNum(item, 'mapx', 'mapX'),
    mapy: pickNum(item, 'mapy', 'mapY'),
    first_image: pickStr(item, 'firstimage', 'firstImage'),
    tel: pickStr(item, 'tel'),
    modified_time: pickStr(item, 'modifiedtime', 'modifiedTime'),
    active: true,
    synced_at: syncedAt,
    updated_at: syncedAt,
  };
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

  const areas = areaOnly
    ? TOURAPI_AREA_CODES.filter(([code]) => code === areaOnly)
    : TOURAPI_AREA_CODES;
  if (!areas.length) {
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

  let deactivated = 0;
  if (!dryRun && !areaOnly) {
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
  if (!dryRun && !areaOnly && (activeCount == null || activeCount < 5000)) {
    console.error(`FAIL active≈7k expected (got ${activeCount})`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
