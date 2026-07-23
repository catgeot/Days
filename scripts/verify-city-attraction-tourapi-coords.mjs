#!/usr/bin/env node
/**
 * cityAttractionHubs KR tip — TourAPI mapy/mapx 좌표 대조·HIT 패치.
 *
 * 등급: HIT · AMBIG · MISS · FAR · SKIP
 * 적용: HIT만 tip 필드 스냅 (--apply). 갤러리 slug SSOT와 분리.
 *
 *   npm run verify:city-attraction-tourapi-coords
 *   npm run verify:city-attraction-tourapi-coords -- --smoke
 *   npm run verify:city-attraction-tourapi-coords -- --hubs=chuncheon,yanggu
 *   npm run verify:city-attraction-tourapi-coords -- --hubs=… --apply
 *   npm run verify:city-attraction-tourapi-coords -- --write-queue
 *
 * Auth: TOUR_API_SERVICE_KEY (직접) 또는 VITE_SUPABASE_URL+ANON → Edge tourapi-proxy
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { haversineM, normalizeKey, isKrHub, WIDE_HUB_IDS } from './lib/geo.mjs';
import { loadEnvFile } from './lib/load-env-file.mjs';

loadEnvFile();

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hubsPath = join(root, 'src/pages/Home/data/cityAttractionHubs.json');
const cachePath = join(root, 'scripts/.cache/attraction-tourapi-coord.json');
const queuePath = join(root, 'plans/city-attraction-tourapi-coord-queue.md');
const patchesOutDefault = join(root, 'scripts/.cache/attraction-tourapi-coord-patches.json');

const KOR_BASE = 'https://apis.data.go.kr/B551011/KorService2';
const SERVICE_KEY = (process.env.TOUR_API_SERVICE_KEY || '').trim();
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const args = process.argv.slice(2);
const argVal = (name) => {
  const hit = args.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
};
const hubsFilter = (argVal('--hubs') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const smokeOnly = args.includes('--smoke');
const doApply = args.includes('--apply');
const writeQueue = args.includes('--write-queue');
const dryRun = args.includes('--dry-run');
const limit = Number(argVal('--limit') || 0) || 0;
const patchesOut = argVal('--patches-out') || patchesOutDefault;

/** Seed hubs — tip attraction overwrite 금지 */
const PROTECTED_HUB_IDS = new Set(['sokcho', 'paris']);

/** Tip 회귀 고정 (김유정 contentId=127933) */
const FIXED_ATTRACTIONS = [
  {
    hubId: 'chuncheon',
    nameIncludes: '김유정문학촌',
    contentId: '127933',
    lat: 37.8183632,
    lng: 127.7176781,
    maxM: 5,
  },
];

const P0_SMOKE = [
  { hubId: 'yanggu', nameIncludes: '박수근미술관' },
  { hubId: 'yanggu', nameIncludes: '한반도섬' },
  { hubId: 'chuncheon', nameIncludes: '김유정문학촌' },
  { hubId: 'hanam', nameIncludes: '덕풍시장' },
  { hubId: 'jindo', nameIncludes: '진도타워' },
];

const CITY_MAX_M = 3000;
const WIDE_MAX_M = 15000;
const TIP_NEAR_M = 8000;
const HIT_SCORE = 0.8;
const AMBIG_GAP = 0.05;
const APPLY_MIN_DELTA_M = 5;
const REJECT_TITLE_RE =
  /(버스정류장|버스\s*정류장|휴게소|톨게이트|IC\b|나들목|지하차도|교차로|사거리|정류장)$/;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadCache() {
  if (!existsSync(cachePath)) {
    return { version: 1, byContentId: {}, bySearch: {} };
  }
  try {
    const raw = JSON.parse(readFileSync(cachePath, 'utf8'));
    return {
      version: 1,
      byContentId: raw.byContentId || {},
      bySearch: raw.bySearch || {},
    };
  } catch {
    return { version: 1, byContentId: {}, bySearch: {} };
  }
}

function saveCache(cache) {
  mkdirSync(dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

function parseCoord(mapy, mapx) {
  const lat = Number(mapy);
  const lng = Number(mapx);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 33 || lat > 39.5 || lng < 124 || lng > 132.5) return null;
  return { lat, lng };
}

function stripHubPrefix(name, hub) {
  const original = String(name || '').trim();
  let q = original;
  const prefixes = [hub?.name, hub?.hubId, hub?.name_en]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter((s) => s.length >= 2);
  for (const p of prefixes) {
    // only strip when delimiter/space follows — avoid 진도타워→타워
    const re = new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s+|-)`, 'i');
    q = q.replace(re, '');
  }
  // common KR city prefixes with whitespace only (양구 박수근미술관)
  q = q.replace(
    /^(양구|춘천|하남|진도|해남|서울|부산|제주|인천|대구|광주|대전|울산|속초|강릉|전주|경주|여수|포항|평창|양양|남해)(?:\s+|-)/,
    '',
  );
  q = q.trim();
  // reject over-stripped generic leftovers
  if (!q || q.length < 2 || /^(타워|공원|시장|박물관|해변|해수욕장|다리|섬)$/.test(q)) {
    return original;
  }
  return q;
}

function nameScore(query, candidate) {
  const q = normalizeKey(query);
  const c = normalizeKey(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.includes(q) || q.includes(c)) return 0.9;
  const qTokens = q.split(/[^a-z0-9가-힣]+/).filter((t) => t.length >= 2);
  const cNorm = c;
  if (!qTokens.length) return 0;
  const hit = qTokens.filter((t) => cNorm.includes(t)).length;
  return hit / qTokens.length >= 0.7 ? 0.8 : hit / qTokens.length >= 0.5 ? 0.65 : 0;
}

function maxDistM(hub) {
  if (WIDE_HUB_IDS.has(hub.hubId) || /island|섬|ulleung|wando|sinan|ongjin|geoje|tongyeong/i.test(hub.hubId)) {
    return WIDE_MAX_M;
  }
  return CITY_MAX_M;
}

function asItemArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') return [raw];
  return [];
}

async function tourDirect(path, query) {
  const params = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: 'gateo',
    _type: 'json',
    ...query,
  });
  const url = `${KOR_BASE}/${path}?serviceKey=${SERVICE_KEY}&${params}`;
  const res = await fetch(url);
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, items: [], message: 'invalid json' };
  }
  const header = parsed?.response?.header;
  const body = parsed?.response?.body;
  const code = header?.resultCode != null ? String(header.resultCode) : null;
  if (code && code !== '0000' && code !== '0') {
    return { ok: false, items: [], message: header?.resultMsg || code };
  }
  const items = asItemArray(body?.items?.item).map((it) => ({
    contentId: String(it.contentid ?? it.contentId ?? '').trim(),
    title: String(it.title ?? '').trim(),
    addr1: String(it.addr1 ?? '').trim(),
    mapx: it.mapx ?? it.mapX ?? null,
    mapy: it.mapy ?? it.mapY ?? null,
    contentTypeId: String(it.contenttypeid ?? it.contentTypeId ?? '').trim() || null,
  }));
  return { ok: true, items, message: 'OK' };
}

async function tourEdge(action, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json().catch(() => null);
  if (!data?.ok) {
    return { ok: false, items: [], message: data?.message || data?.error || `HTTP ${res.status}` };
  }
  const items = (data.items || []).map((it) => ({
    contentId: String(it.contentId ?? '').trim(),
    title: String(it.title ?? '').trim(),
    addr1: String(it.addr1 ?? '').trim(),
    mapx: it.mapx ?? null,
    mapy: it.mapy ?? null,
    contentTypeId: it.contentTypeId ? String(it.contentTypeId) : null,
  }));
  return { ok: true, items, message: 'OK' };
}

async function tourApi(action, body) {
  if (SERVICE_KEY) {
    if (action === 'searchKeyword') {
      return tourDirect('searchKeyword2', {
        keyword: body.keyword,
        numOfRows: String(body.numOfRows || 10),
        pageNo: String(body.pageNo || 1),
      });
    }
    if (action === 'detailCommon') {
      return tourDirect('detailCommon2', { contentId: String(body.contentId) });
    }
  }
  if (SUPABASE_URL && SUPABASE_ANON) {
    return tourEdge(action, body);
  }
  throw new Error('Need TOUR_API_SERVICE_KEY or VITE_SUPABASE_URL+VITE_SUPABASE_ANON_KEY');
}

async function searchKeywordCached(cache, keyword) {
  const key = normalizeKey(keyword);
  if (cache.bySearch[key]?.items) {
    return cache.bySearch[key].items;
  }
  const res = await tourApi('searchKeyword', { keyword, numOfRows: 10, pageNo: 1 });
  await sleep(120);
  const items = res.ok ? res.items : [];
  cache.bySearch[key] = { items, fetchedAt: new Date().toISOString(), ok: res.ok };
  return items;
}

async function detailCached(cache, contentId) {
  const id = String(contentId);
  if (cache.byContentId[id]?.mapy != null && cache.byContentId[id]?.mapx != null) {
    return cache.byContentId[id];
  }
  const res = await tourApi('detailCommon', { contentId: id });
  await sleep(120);
  const it = res.ok ? res.items[0] : null;
  if (!it) {
    cache.byContentId[id] = { contentId: id, ok: false, fetchedAt: new Date().toISOString() };
    return null;
  }
  const entry = {
    contentId: id,
    title: it.title,
    addr1: it.addr1,
    mapx: it.mapx,
    mapy: it.mapy,
    contentTypeId: it.contentTypeId,
    ok: true,
    fetchedAt: new Date().toISOString(),
  };
  cache.byContentId[id] = entry;
  return entry;
}

function gradeAttraction(hub, attr, candidates) {
  const query = stripHubPrefix(attr.name, hub);
  const usable = [];
  for (const c of candidates) {
    if (!c.contentId || !c.title) continue;
    if (REJECT_TITLE_RE.test(c.title)) continue;
    const score = nameScore(query, c.title);
    if (score < 0.65) continue;
    const coords = parseCoord(c.mapy, c.mapx);
    if (!coords) continue;
    const dHub = haversineM(hub.lat, hub.lng, coords.lat, coords.lng);
    const dTip = haversineM(attr.lat, attr.lng, coords.lat, coords.lng);
    usable.push({ ...c, score, ...coords, dHub, dTip });
  }
  usable.sort((a, b) => b.score - a.score || a.dHub - b.dHub);

  if (!usable.length) {
    return { grade: 'MISS', query, reason: 'no_candidate' };
  }

  const best = usable[0];
  const second = usable[1];
  if (second && best.score - second.score < AMBIG_GAP && best.score >= HIT_SCORE) {
    // same contentId duplicates OK
    if (best.contentId !== second.contentId) {
      return {
        grade: 'AMBIG',
        query,
        reason: 'multi_title',
        contentId: best.contentId,
        title: best.title,
        lat: best.lat,
        lng: best.lng,
        dHub: Math.round(best.dHub),
        dTip: Math.round(best.dTip),
        candidates: usable.slice(0, 3).map((u) => ({
          contentId: u.contentId,
          title: u.title,
          score: u.score,
          lat: u.lat,
          lng: u.lng,
        })),
      };
    }
  }

  if (best.score < HIT_SCORE) {
    return {
      grade: 'MISS',
      query,
      reason: 'low_score',
      best: { contentId: best.contentId, title: best.title, score: best.score },
    };
  }

  const limitM = maxDistM(hub);
  if (best.dHub > limitM && best.dTip > TIP_NEAR_M) {
    return {
      grade: 'FAR',
      query,
      reason: 'distance',
      contentId: best.contentId,
      title: best.title,
      lat: best.lat,
      lng: best.lng,
      dHub: Math.round(best.dHub),
      dTip: Math.round(best.dTip),
    };
  }

  return {
    grade: 'HIT',
    query,
    contentId: best.contentId,
    title: best.title,
    lat: best.lat,
    lng: best.lng,
    score: best.score,
    dHub: Math.round(best.dHub),
    dTip: Math.round(best.dTip),
    addr1: best.addr1 || null,
  };
}

async function resolveAttraction(cache, hub, attr) {
  if (PROTECTED_HUB_IDS.has(hub.hubId)) {
    return { hubId: hub.hubId, name: attr.name, grade: 'SKIP', reason: 'protected_hub' };
  }
  const query = stripHubPrefix(attr.name, hub);
  const queries = [query];
  if (query !== attr.name) queries.push(String(attr.name).trim());
  let items = [];
  for (const q of queries) {
    const found = await searchKeywordCached(cache, q);
    if (found.length) {
      items = found;
      break;
    }
  }
  // enrich missing coords via detailCommon
  const enriched = [];
  for (const it of items.slice(0, 8)) {
    let row = { ...it };
    if (!parseCoord(row.mapy, row.mapx) && row.contentId) {
      const d = await detailCached(cache, row.contentId);
      if (d?.ok) {
        row = { ...row, mapx: d.mapx, mapy: d.mapy, addr1: d.addr1 || row.addr1, title: d.title || row.title };
      }
    }
    enriched.push(row);
  }
  const g = gradeAttraction(hub, attr, enriched);
  return {
    hubId: hub.hubId,
    name: attr.name,
    tipLat: attr.lat,
    tipLng: attr.lng,
    ...g,
  };
}

function findAttr(hub, nameIncludes) {
  return (hub.attractions || []).find((a) => String(a.name).includes(nameIncludes));
}

async function runFixedSmoke(cache) {
  let failed = 0;
  for (const fix of FIXED_ATTRACTIONS) {
    const detail = await detailCached(cache, fix.contentId);
    const coords = detail ? parseCoord(detail.mapy, detail.mapx) : null;
    if (!coords) {
      console.error(`FAIL  fixed contentId=${fix.contentId} detail missing`);
      failed += 1;
      continue;
    }
    const d = haversineM(fix.lat, fix.lng, coords.lat, coords.lng);
    if (d > fix.maxM) {
      console.error(
        `FAIL  fixed ${fix.contentId} TourAPI ${coords.lat},${coords.lng} ≠ expect ${fix.lat},${fix.lng} (${d.toFixed(1)}m)`,
      );
      failed += 1;
    } else {
      console.log(
        `OK    fixed contentId=${fix.contentId} → ${coords.lat},${coords.lng} (Δ${d.toFixed(2)}m)`,
      );
    }

    const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));
    const hub = hubs.find((h) => h.hubId === fix.hubId);
    const attr = hub && findAttr(hub, fix.nameIncludes);
    if (!attr) {
      console.error(`FAIL  tip missing ${fix.hubId}/${fix.nameIncludes}`);
      failed += 1;
      continue;
    }
    const tipD = haversineM(fix.lat, fix.lng, attr.lat, attr.lng);
    if (tipD > fix.maxM) {
      console.error(
        `FAIL  tip regress ${fix.hubId}/${attr.name} ${attr.lat},${attr.lng} (Δ${tipD.toFixed(1)}m vs fixed)`,
      );
      failed += 1;
    } else {
      console.log(`OK    tip ${fix.hubId}/${attr.name} matches fixed (Δ${tipD.toFixed(2)}m)`);
    }
  }
  return failed;
}

async function runP0Smoke(cache, hubs) {
  let failed = 0;
  for (const s of P0_SMOKE) {
    const hub = hubs.find((h) => h.hubId === s.hubId);
    const attr = hub && findAttr(hub, s.nameIncludes);
    if (!hub || !attr) {
      console.error(`FAIL  P0 missing ${s.hubId}/${s.nameIncludes}`);
      failed += 1;
      continue;
    }
    const row = await resolveAttraction(cache, hub, attr);
    if (row.grade === 'HIT') {
      const d = haversineM(attr.lat, attr.lng, row.lat, row.lng);
      console.log(
        `OK    P0 ${s.hubId}/${attr.name} HIT contentId=${row.contentId} tipΔ=${Math.round(d)}m`,
      );
      continue;
    }
    // 김유정: tip already fixed — search grade non-blocking (fixed smoke covers coords)
    if (s.nameIncludes === '김유정문학촌') {
      console.log(`OK    P0 ${s.hubId}/${attr.name} tip-fixed grade=${row.grade} (search non-blocking)`);
      continue;
    }
    // tip already within 50m of TourAPI candidate
    if (row.dTip != null && row.dTip <= 50 && (row.grade === 'FAR' || row.grade === 'AMBIG')) {
      console.log(`OK    P0 ${s.hubId}/${attr.name} tip≈TourAPI tipΔ=${row.dTip}m grade=${row.grade}`);
      continue;
    }
    // TourAPI 미수록(MISS): tip 유지 OK — 추정 스냅 금지이므로 회귀만 아니면 PASS
    if (row.grade === 'MISS') {
      console.log(`OK    P0 ${s.hubId}/${attr.name} TourAPI MISS · tip kept (${attr.lat},${attr.lng})`);
      continue;
    }
    console.error(`FAIL  P0 ${s.hubId}/${attr.name} grade=${row.grade} ${row.reason || ''}`);
    failed += 1;
  }
  return failed;
}

function writeQueueMd(rows) {
  const ambig = rows.filter((r) => r.grade === 'AMBIG');
  const miss = rows.filter((r) => r.grade === 'MISS');
  const far = rows.filter((r) => r.grade === 'FAR');
  const hit = rows.filter((r) => r.grade === 'HIT');
  const lines = [
    '# cityAttractionHubs — TourAPI 좌표 큐',
    '',
    `생성: ${new Date().toISOString().slice(0, 10)} · 스크립트 verify-city-attraction-tourapi-coords`,
    '',
    `| 등급 | 건수 |`,
    `|---|---|`,
    `| HIT | ${hit.length} |`,
    `| AMBIG | ${ambig.length} |`,
    `| FAR | ${far.length} |`,
    `| MISS | ${miss.length} |`,
    '',
    '## AMBIG (수동)',
    '',
    ...ambig.slice(0, 80).map(
      (r) =>
        `- \`${r.hubId}\` / ${r.name} — ${r.reason}${r.candidates ? ` · ${r.candidates.map((c) => c.contentId).join(',')}` : ''}`,
    ),
    ambig.length === 0 ? '- (없음)' : '',
    '',
    '## FAR',
    '',
    ...far.slice(0, 80).map(
      (r) => `- \`${r.hubId}\` / ${r.name} — dHub=${r.dHub}m dTip=${r.dTip}m · ${r.contentId || ''}`,
    ),
    far.length === 0 ? '- (없음)' : '',
    '',
    '## MISS (샘플)',
    '',
    ...miss.slice(0, 80).map((r) => `- \`${r.hubId}\` / ${r.name} — ${r.reason || ''}`),
    miss.length === 0 ? '- (없음)' : '',
    '',
  ];
  writeFileSync(queuePath, `${lines.filter((x) => x !== undefined).join('\n')}\n`, 'utf8');
  console.log(`Wrote queue ${queuePath}`);
}

function applyHits(hits) {
  const patches = hits
    .filter((r) => r.grade === 'HIT' && Number.isFinite(r.lat) && Number.isFinite(r.lng))
    .filter((r) => (r.dTip == null ? true : r.dTip >= APPLY_MIN_DELTA_M))
    .map((r) => ({
      hubId: r.hubId,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      mapboxId: null,
      action: 'snap',
      contentId: r.contentId,
      source: 'tourapi',
    }));

  mkdirSync(dirname(patchesOut), { recursive: true });
  writeFileSync(patchesOut, `${JSON.stringify(patches, null, 2)}\n`, 'utf8');
  console.log(`Patches ${patches.length} → ${patchesOut}`);

  if (!patches.length) {
    return { snapped: 0, missing: 0 };
  }
  if (dryRun) {
    console.log('dry-run: skip tip write');
    return { snapped: 0, missing: 0, dryRun: true, patches: patches.length };
  }

  // inline apply (same semantics as apply-attraction-coord-patches.mjs snap)
  const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));
  const byHub = new Map(hubs.map((h) => [h.hubId, h]));
  let snapped = 0;
  const missing = [];
  for (const p of patches) {
    if (PROTECTED_HUB_IDS.has(p.hubId)) continue;
    const hub = byHub.get(p.hubId);
    if (!hub) {
      missing.push(`${p.hubId}/${p.name}`);
      continue;
    }
    const idx = (hub.attractions || []).findIndex((a) => a.name === p.name);
    if (idx < 0) {
      missing.push(`${p.hubId}/${p.name}`);
      continue;
    }
    const a = hub.attractions[idx];
    a.lat = Number(p.lat);
    a.lng = Number(p.lng);
    // do not invent mapboxId; clear stale if present when TourAPI wins
    if (a.mapboxId != null) a.mapboxId = null;
    snapped += 1;
  }
  writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ ok: true, snapped, missing: missing.length, missingSample: missing.slice(0, 8) }));
  return { snapped, missing: missing.length };
}

async function main() {
  const mode = SERVICE_KEY ? 'direct' : SUPABASE_URL ? 'edge' : 'none';
  if (mode === 'none') {
    console.error('FAIL  no TourAPI auth (TOUR_API_SERVICE_KEY or Edge anon)');
    process.exit(2);
  }
  console.log(`TourAPI mode=${mode}`);

  const cache = loadCache();
  const hubsAll = JSON.parse(readFileSync(hubsPath, 'utf8'));

  if (smokeOnly) {
    let failed = await runFixedSmoke(cache);
    failed += await runP0Smoke(cache, hubsAll);
    saveCache(cache);
    if (failed) {
      console.error(`SMOKE FAIL (${failed})`);
      process.exit(1);
    }
    console.log('SMOKE PASS');
    return;
  }

  const krHubs = hubsAll.filter((h) => isKrHub(h));
  let targets = krHubs;
  if (hubsFilter.length) {
    const set = new Set(hubsFilter);
    targets = krHubs.filter((h) => set.has(h.hubId));
  }
  if (limit > 0) targets = targets.slice(0, limit);

  const rows = [];
  let scanned = 0;
  for (const hub of targets) {
    for (const attr of hub.attractions || []) {
      scanned += 1;
      const row = await resolveAttraction(cache, hub, attr);
      rows.push(row);
      if (scanned % 25 === 0) {
        saveCache(cache);
        console.log(`… scanned ${scanned} last=${row.hubId}/${row.name} ${row.grade}`);
      }
    }
  }
  saveCache(cache);

  const counts = rows.reduce((acc, r) => {
    acc[r.grade] = (acc[r.grade] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({ scanned, hubs: targets.length, counts }, null, 2));

  const hits = rows.filter((r) => r.grade === 'HIT');
  mkdirSync(dirname(patchesOut), { recursive: true });
  writeFileSync(
    patchesOut,
    `${JSON.stringify(
      hits.map((r) => ({
        hubId: r.hubId,
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        mapboxId: null,
        action: 'snap',
        contentId: r.contentId,
        source: 'tourapi',
        dTip: r.dTip,
      })),
      null,
      2,
    )}\n`,
    'utf8',
  );

  if (writeQueue) writeQueueMd(rows);

  if (doApply) {
    applyHits(hits);
    // post-apply fixed regression
    const failed = await runFixedSmoke(cache);
    if (failed) {
      console.error('FAIL  post-apply fixed regression');
      process.exit(1);
    }
  }

  // always re-check fixed tip when touching chuncheon
  if (!hubsFilter.length || hubsFilter.includes('chuncheon')) {
    const failed = await runFixedSmoke(cache);
    if (failed) process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
