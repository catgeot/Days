#!/usr/bin/env node
/**
 * cityAttractionHubs KR tip — TourAPI(한국관광공사) mapy/mapx 좌표 대조.
 * (plans/city-attraction-tourapi-coord-plan.md G0)
 *
 * 파이프: hub 근접 + searchKeyword2 → 후보 → (필요 시) detailCommon2 mapy/mapx 재확인.
 * 등급: HIT(단일 신뢰 후보) · AMBIG(동점 다수) · MISS(무매칭) · FAR(매칭은 있으나 hub와 원거리).
 * HIT만 tip 패치 대상 — apply-attraction-coord-patches.mjs 재사용(동일 스키마: hubId,name,lat,lng,action=snap).
 *
 * 인증: TOUR_API_SERVICE_KEY(직접) 또는 VITE_SUPABASE_URL+VITE_SUPABASE_ANON_KEY(Edge tourapi-proxy) 중 하나.
 * 일일 쿼터 소진 시 상위 data.go.kr가 HTTP 429 "API token quota exceeded"를 반환 — 이 경우 SKIP(재시도 안내) 처리.
 *
 *   npm run verify:city-attraction-tourapi-coords -- --smoke
 *   npm run verify:city-attraction-tourapi-coords -- --hubs=yanggu,chuncheon,hanam,jindo --write-queue
 *   npm run verify:city-attraction-tourapi-coords -- --country=kr --write-queue
 *   npm run verify:city-attraction-tourapi-coords -- --unit   (네트워크 없이 등급 로직만 검증)
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

const SERVICE_KEY = (process.env.TOUR_API_SERVICE_KEY || '').trim();
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const KOR_BASE = 'https://apis.data.go.kr/B551011/KorService2';

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
const unitOnly = args.includes('--unit');
const writeQueue = args.includes('--write-queue');
const countryFilter = argVal('--country');
const limit = Number(argVal('--limit') || 0) || 0;
const applyOut = argVal('--apply-out');

const NAMED_SNAP_M = 50;
// hub center ↔ 후보 거리 상한. KR 시/군 단위는 광역(강원 산간 등)이라 3km는 과도 —
// 동일 시군 내 원거리 명소(예: 김유정문학촌↔춘천 중심 ~7km)는 정상 HIT, 타 시군 동명 충돌만 걸러낸다.
const CITY_RADIUS_KM = 60;
const WIDE_RADIUS_KM = 150;

/** TourAPI 결과가 명소가 아닌 정류장·도로·휴게소류일 때 거부 (plan §3 거부 규칙). */
const REJECT_TITLE_RE = /(정류장|정류소|버스터미널|고속도로|휴게소|IC$|교차로|사거리)/;

const P0_HUBS = ['yanggu', 'chuncheon', 'hanam', 'jindo'];
const KIM_YOUJEONG_CONTENT_ID = '127933';
const KIM_YOUJEONG_EXPECT = { lat: 37.8183632, lng: 127.7176781 };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function coreTokens(name) {
  return normalizeKey(name)
    .split(/[^a-z0-9가-힣]+/)
    .filter((t) => t.length >= 2);
}

function nameScore(query, title) {
  const q = normalizeKey(query);
  const t = normalizeKey(title);
  if (!q || !t) return 0;
  if (q === t) return 1;
  if (t.includes(q) || q.includes(t)) return 0.85;
  const qCore = coreTokens(query);
  const tCore = coreTokens(title);
  const overlap = qCore.filter((c) => tCore.includes(c));
  if (overlap.length && overlap.length >= Math.ceil(qCore.length * 0.6)) return 0.75;
  return 0;
}

/** 순수 함수 — 네트워크 없이 단위 테스트 가능 (--unit). */
export function pickCandidates(items, attraction, hub) {
  const scored = [];
  for (const it of items) {
    const title = it.title || '';
    if (REJECT_TITLE_RE.test(title)) continue;
    const sName = Math.max(nameScore(attraction.name, title), nameScore(attraction.name_en, title));
    if (sName < 0.75) continue;
    const lat = Number(it.mapy);
    const lng = Number(it.mapx);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const hubDistKm =
      Number.isFinite(hub?.lat) && Number.isFinite(hub?.lng) ? haversineM(hub.lat, hub.lng, lat, lng) / 1000 : null;
    scored.push({ ...it, lat, lng, nameScore: sName, hubDistKm });
  }
  return scored.sort((a, b) => b.nameScore - a.nameScore);
}

/** 순수 함수 — 네트워크 없이 단위 테스트 가능 (--unit). */
export function gradeCandidates(scored, hub) {
  if (!scored.length) return { grade: 'MISS', action: 'drop_or_manual', best: null };
  const radiusKm = WIDE_HUB_IDS.has(hub?.hubId) ? WIDE_RADIUS_KM : CITY_RADIUS_KM;
  const best = scored[0];
  const top = scored.filter((s) => s.nameScore >= best.nameScore - 0.05);
  const distinctSpots = new Set(top.map((s) => `${s.contentId || ''}:${s.lat.toFixed(3)},${s.lng.toFixed(3)}`));
  if (distinctSpots.size > 1 && top.length > 1) {
    return { grade: 'AMBIG', action: 'review', best };
  }
  if (best.hubDistKm != null && best.hubDistKm > radiusKm) {
    return { grade: 'FAR', action: 'review', best };
  }
  return { grade: 'HIT', action: 'snap', best };
}

async function searchKeywordDirect(keyword) {
  const params = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: 'gateo',
    _type: 'json',
    keyword,
    numOfRows: '10',
    pageNo: '1',
  });
  const url = `${KOR_BASE}/searchKeyword2?serviceKey=${SERVICE_KEY}&${params.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const text = await res.text();
  if (res.status === 429 || /quota exceeded/i.test(text)) {
    return { ok: false, quotaExceeded: true, items: [] };
  }
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, quotaExceeded: false, items: [] };
  }
  const body = parsed?.response?.body;
  const resultCode = String(parsed?.response?.header?.resultCode ?? '');
  if (resultCode && resultCode !== '0000' && resultCode !== '0') {
    return { ok: false, quotaExceeded: false, items: [], resultCode };
  }
  const raw = body?.items?.item;
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return {
    ok: true,
    quotaExceeded: false,
    items: arr.map((it) => ({
      contentId: it.contentid,
      title: it.title,
      addr1: it.addr1,
      mapx: it.mapx,
      mapy: it.mapy,
      contentTypeId: it.contenttypeid,
    })),
  };
}

async function searchKeywordEdge(keyword) {
  if (!SUPABASE_URL || !SUPABASE_ANON) return { ok: false, quotaExceeded: false, items: [] };
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ANON}`, apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'searchKeyword', keyword, numOfRows: 10 }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 429 || /quota exceeded/i.test(data?.message || '')) {
    return { ok: false, quotaExceeded: true, items: [] };
  }
  if (!data?.ok) return { ok: false, quotaExceeded: false, items: [] };
  return { ok: true, quotaExceeded: false, items: data.items || [] };
}

async function searchKeyword(keyword) {
  if (SERVICE_KEY) return searchKeywordDirect(keyword);
  return searchKeywordEdge(keyword);
}

function loadCache() {
  if (!existsSync(cachePath)) return {};
  try {
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  mkdirSync(dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

function runUnitTests() {
  let failed = 0;
  const assert = (cond, msg) => {
    if (!cond) {
      failed += 1;
      console.error(`UNIT FAIL: ${msg}`);
    } else {
      console.log(`UNIT OK: ${msg}`);
    }
  };

  const hub = { hubId: 'chuncheon', lat: 37.8813, lng: 127.7298 };
  const attraction = { name: '김유정문학촌', name_en: 'Kim You-jeong Literature Village' };

  const clean = pickCandidates(
    [{ contentId: '127933', title: '김유정문학촌', mapx: '127.7176781', mapy: '37.8183632' }],
    attraction,
    hub,
  );
  const gradedClean = gradeCandidates(clean, hub);
  assert(gradedClean.grade === 'HIT', 'single clean candidate → HIT');
  assert(gradedClean.action === 'snap', 'HIT action=snap');

  const busStop = pickCandidates(
    [{ contentId: '999', title: '김유정문학촌입구 정류장', mapx: '127.71', mapy: '37.82' }],
    attraction,
    hub,
  );
  assert(busStop.length === 0, 'bus stop title rejected before grading');

  const ambig = pickCandidates(
    [
      { contentId: '1', title: '김유정문학촌', mapx: '127.7176781', mapy: '37.8183632' },
      { contentId: '2', title: '김유정문학촌', mapx: '127.9000000', mapy: '38.0000000' },
    ],
    attraction,
    hub,
  );
  assert(gradeCandidates(ambig, hub).grade === 'AMBIG', 'two distinct same-score candidates → AMBIG');

  const far = pickCandidates(
    [{ contentId: '3', title: '김유정문학촌', mapx: '129.0', mapy: '35.0' }],
    attraction,
    hub,
  );
  assert(gradeCandidates(far, hub).grade === 'FAR', 'candidate far from hub → FAR');

  const miss = pickCandidates([{ contentId: '4', title: '전혀다른장소', mapx: '127.71', mapy: '37.82' }], attraction, hub);
  assert(gradeCandidates(miss, hub).grade === 'MISS', 'no name match → MISS');

  console.log(JSON.stringify({ unitFailed: failed }, null, 2));
  if (failed) process.exit(1);
  console.log('UNIT OK — all grading logic checks passed (no network)');
}

async function main() {
  if (unitOnly) {
    runUnitTests();
    return;
  }

  if (!SERVICE_KEY && !(SUPABASE_URL && SUPABASE_ANON)) {
    console.error('missing TOUR_API_SERVICE_KEY and VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY — set one path');
    process.exit(2);
  }

  const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));
  let targets = hubs.filter((h) => h?.hubId);
  if (hubsFilter.length) targets = targets.filter((h) => hubsFilter.includes(h.hubId));
  else if (smokeOnly) targets = targets.filter((h) => P0_HUBS.includes(h.hubId));
  else if (countryFilter === 'kr' || (!countryFilter && !hubsFilter.length)) targets = targets.filter((h) => isKrHub(h));

  const cache = loadCache();
  const rows = [];
  let quotaBlocked = false;
  let processed = 0;
  let cacheDirty = 0;

  outer: for (const hub of targets) {
    for (const attraction of hub.attractions || []) {
      if (limit && processed >= limit) break outer;
      processed += 1;
      const cacheKey = `${hub.hubId}::${normalizeKey(attraction.name)}`;

      let scored;
      if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
        scored = cache[cacheKey].scored;
      } else {
        if (quotaBlocked) {
          rows.push({ hubId: hub.hubId, name: attraction.name, grade: 'SKIP', action: 'skip', note: 'quota exceeded' });
          continue;
        }
        const res = await searchKeyword(attraction.name);
        if (res.quotaExceeded) {
          quotaBlocked = true;
          rows.push({ hubId: hub.hubId, name: attraction.name, grade: 'SKIP', action: 'skip', note: 'quota exceeded' });
          continue;
        }
        scored = pickCandidates(res.items, attraction, hub);
        cache[cacheKey] = { at: new Date().toISOString(), scored };
        cacheDirty += 1;
        await sleep(250);
        if (cacheDirty >= 25) {
          saveCache(cache);
          cacheDirty = 0;
          console.error(`progress ${processed}/${limit || 'all'} hub=${hub.hubId} cached=${Object.keys(cache).length}`);
        }
      }

      const graded = gradeCandidates(scored, hub);
      rows.push({
        hubId: hub.hubId,
        name: attraction.name,
        name_en: attraction.name_en,
        ssotLat: attraction.lat,
        ssotLng: attraction.lng,
        grade: graded.grade,
        action: graded.action,
        deltaM:
          graded.best && Number.isFinite(attraction.lat)
            ? Math.round(haversineM(attraction.lat, attraction.lng, graded.best.lat, graded.best.lng))
            : null,
        contentId: graded.best?.contentId ?? null,
        matchTitle: graded.best?.title ?? null,
        suggestedLat: graded.best?.lat ?? null,
        suggestedLng: graded.best?.lng ?? null,
      });
    }
  }

  saveCache(cache);

  const summary = {
    scanned: rows.length,
    HIT: rows.filter((r) => r.grade === 'HIT').length,
    AMBIG: rows.filter((r) => r.grade === 'AMBIG').length,
    MISS: rows.filter((r) => r.grade === 'MISS').length,
    FAR: rows.filter((r) => r.grade === 'FAR').length,
    SKIP: rows.filter((r) => r.grade === 'SKIP').length,
    snapCandidates: rows.filter((r) => r.grade === 'HIT' && (r.deltaM ?? 0) > NAMED_SNAP_M).length,
    quotaBlocked,
    auth: SERVICE_KEY ? 'direct' : 'edge',
  };
  console.log(JSON.stringify(summary, null, 2));

  if (smokeOnly || hubsFilter.length) {
    console.log('ROWS:');
    for (const r of rows) {
      console.log(
        ` - ${r.hubId} | ${r.name} | ${r.grade}/${r.action} | Δ${r.deltaM ?? '-'}m | ${r.matchTitle || r.note || ''} → ${r.suggestedLat ?? ''},${r.suggestedLng ?? ''}`,
      );
    }
  }

  if (writeQueue) {
    const queueRows = rows.filter((r) => r.grade !== 'HIT' || (r.deltaM ?? 0) <= NAMED_SNAP_M);
    const outPath = join(root, 'plans/city-attraction-tourapi-coord-queue.md');
    const jsonPath = join(root, 'plans/city-attraction-tourapi-coord-queue.json');
    const lines = [
      '# cityAttractionHubs — TourAPI 좌표 verify 큐 (AMBIG/MISS/FAR/SKIP)',
      '',
      `스캔 ${summary.scanned} · HIT ${summary.HIT} · AMBIG ${summary.AMBIG} · MISS ${summary.MISS} · FAR ${summary.FAR} · SKIP ${summary.SKIP}`,
      '',
      '| hubId | name | grade | action | Δm | contentId | note |',
      '|-------|------|-------|--------|----|-----------|------|',
      ...queueRows.map(
        (r) =>
          `| ${r.hubId} | ${r.name} | ${r.grade} | ${r.action} | ${r.deltaM ?? ''} | ${r.contentId ?? ''} | ${r.note || r.matchTitle || ''} |`,
      ),
      '',
    ];
    writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
    writeFileSync(jsonPath, `${JSON.stringify({ summary, items: queueRows }, null, 2)}\n`, 'utf8');
    console.log(`wrote ${outPath}`);
    console.log(`wrote ${jsonPath} (${queueRows.length} items)`);
  }

  if (applyOut) {
    const patches = rows
      .filter((r) => r.grade === 'HIT' && (r.deltaM ?? 0) > NAMED_SNAP_M)
      .map((r) => ({ hubId: r.hubId, name: r.name, lat: r.suggestedLat, lng: r.suggestedLng, action: 'snap' }));
    writeFileSync(join(root, applyOut), `${JSON.stringify(patches, null, 2)}\n`, 'utf8');
    console.log(`wrote ${applyOut} (${patches.length} snap patches)`);
  }

  if (smokeOnly) {
    let smokeFailed = 0;
    const kim = rows.find((r) => r.hubId === 'chuncheon' && r.name.includes('김유정'));
    if (!kim) {
      console.error('SMOKE FAIL: missing chuncheon/김유정문학촌 row');
      smokeFailed += 1;
    } else if (kim.grade === 'SKIP') {
      console.log(`SMOKE SKIP: 김유정문학촌 — ${kim.note} (TourAPI 쿼터 소진, 재시도 필요)`);
    } else if (kim.contentId && kim.contentId !== KIM_YOUJEONG_CONTENT_ID) {
      console.error(`SMOKE FAIL: 김유정문학촌 contentId ${kim.contentId} !== ${KIM_YOUJEONG_CONTENT_ID}`);
      smokeFailed += 1;
    } else if (
      kim.suggestedLat != null &&
      (Math.abs(kim.suggestedLat - KIM_YOUJEONG_EXPECT.lat) > 0.0005 ||
        Math.abs(kim.suggestedLng - KIM_YOUJEONG_EXPECT.lng) > 0.0005)
    ) {
      console.error(`SMOKE FAIL: 김유정문학촌 좌표 불일치 ${kim.suggestedLat},${kim.suggestedLng}`);
      smokeFailed += 1;
    } else {
      console.log(`SMOKE OK: 김유정문학촌 ${kim.grade}/${kim.action} Δ${kim.deltaM ?? '-'}m`);
    }
    if (quotaBlocked) {
      console.log('NOTE: TourAPI 일일 쿼터 소진 — 나머지 P0 항목은 SKIP 처리됨. 쿼터 회복 후 재실행 필요.');
    }
    if (smokeFailed) process.exit(1);
  }

  console.log('OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
