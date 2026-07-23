#!/usr/bin/env node
/**
 * cityAttractionHubs Mapbox(+Nominatim fallback) 좌표 대조.
 *
 * 등급:
 *   NAMED  — 이름 매칭 POI/지명 → tip과 >50m 이면 SNAP
 *   AREA   — 자연·광역류 (kind beach/park/viewpoint 등) · KR >300m soft / >800m hard
 *   NO_HIT — 안정 매칭 없음
 *
 * Mapbox Search Box가 KR POI에 빈 결과를 자주 내므로 Nominatim(OSM) 폴백.
 * 토큰: VITE_MAPBOX_TOKEN 또는 MAPBOX_TOKEN
 *
 *   npm run verify:city-attraction-coords
 *   npm run verify:city-attraction-coords -- --hubs=yanggu,chuncheon,hanam,jindo
 *   npm run verify:city-attraction-coords -- --smoke
 *   npm run verify:city-attraction-coords -- --write-queue
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { haversineM, normalizeKey, isKrHub } from './lib/geo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hubsPath = join(root, 'src/pages/Home/data/cityAttractionHubs.json');
const cachePath = join(root, 'scripts/.cache/attraction-coord-verify.json');

const TOKEN = process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '';
const SEARCHBOX = 'https://api.mapbox.com/search/searchbox/v1';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

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
const writeQueue = args.includes('--write-queue');
const countryFilter = argVal('--country'); // kr | all
const limit = Number(argVal('--limit') || 0) || 0;

const NAMED_SNAP_M = 50;
const AREA_SOFT_M_KR = 300;
const AREA_HARD_M_KR = 800;
const AREA_SOFT_M_INTL = 1500;
const AREA_HARD_M_INTL = 5000;

const AREA_KINDS = new Set(['beach', 'park', 'neighborhood']);

/** Reject weak / false-positive OSM classes for NAMED. */
const REJECT_OSM_TYPES = new Set([
  'bus_stop',
  'fuel',
  'convenience',
  'supermarket',
  'yes',
  'tertiary',
  'secondary',
  'primary',
  'residential',
  'unclassified',
  'path',
  'footway',
]);

function coreTokens(name) {
  return normalizeKey(name)
    .replace(/^(양구|춘천|하남|진도|해남|서울|부산)/, '')
    .split(/[^a-z0-9가-힣]+/)
    .filter((t) => t.length >= 2);
}

const SMOKE = [
  { hubId: 'yanggu', nameIncludes: '박수근미술관', expect: 'SNAP_OR_NAMED' },
  { hubId: 'yanggu', nameIncludes: '한반도섬', expect: 'SNAP_OR_NAMED' },
  { hubId: 'chuncheon', nameIncludes: '김유정문학촌', expect: 'ANY' },
  { hubId: 'hanam', nameIncludes: '덕풍시장', expect: 'NAMED' },
  { hubId: 'jindo', nameIncludes: '진도타워', expect: 'NAMED' },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nameScore(query, candidate) {
  const q = normalizeKey(query);
  const c = normalizeKey(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.includes(q) || q.includes(c)) return 0.85;
  // strip hub prefix noise
  const q2 = q.replace(/^(양구|춘천|하남|진도|해남)/, '');
  const c2 = c.replace(/^(양구|춘천|하남|진도|해남)/, '');
  if (q2 && c2 && (c2.includes(q2) || q2.includes(c2))) return 0.8;
  return 0;
}

async function mapboxForward(query, hub, { types = 'poi' } = {}) {
  if (!TOKEN) return [];
  const params = new URLSearchParams({
    q: query,
    access_token: TOKEN,
    language: 'ko',
    limit: '5',
    auto_complete: 'true',
    types,
  });
  if (isKrHub(hub)) params.set('country', 'kr');
  if (Number.isFinite(hub.lng) && Number.isFinite(hub.lat)) {
    params.set('proximity', `${hub.lng},${hub.lat}`);
  }
  try {
    const res = await fetch(`${SEARCHBOX}/forward?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f) => {
      const props = f.properties || {};
      const coords = f.geometry?.coordinates || [];
      return {
        source: 'mapbox',
        name: String(props.name || props.name_preferred || '').trim(),
        mapboxId: props.mapbox_id || null,
        featureType: String(props.feature_type || '').toLowerCase(),
        lat: Number(coords[1]),
        lng: Number(coords[0]),
      };
    }).filter((x) => x.name && Number.isFinite(x.lat) && Number.isFinite(x.lng));
  } catch {
    return [];
  }
}

async function nominatimSearch(query, hub) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '5',
    addressdetails: '1',
    'accept-language': 'ko',
  });
  if (isKrHub(hub)) params.set('countrycodes', 'kr');
  try {
    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: { 'User-Agent': 'gateo-attraction-coord-verify/1.0 (https://gateo.kr)' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((d) => ({
      source: 'nominatim',
      name: String(d.namedetails?.name || d.display_name?.split(',')[0] || d.display_name || '').trim(),
      displayName: d.display_name,
      mapboxId: null,
      featureType: String(d.type || d.class || '').toLowerCase(),
      lat: Number(d.lat),
      lng: Number(d.lon),
      osmClass: d.class,
      osmType: d.type,
    })).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
  } catch {
    return [];
  }
}

function pickBest(hits, attraction, hub) {
  let best = null;
  let bestScore = 0;
  const cores = [...coreTokens(attraction.name), ...coreTokens(attraction.name_en || '')];
  for (const h of hits) {
    if (h.source === 'nominatim' && REJECT_OSM_TYPES.has(h.osmType)) continue;
    const sName = Math.max(
      nameScore(attraction.name, h.name),
      nameScore(attraction.name_en, h.name),
      nameScore(attraction.name, h.displayName || ''),
      nameScore(attraction.name_en, h.displayName || ''),
    );
    if (sName < 0.75) continue;
    // false positive: "펀치볼주유소" for "양구 펀치볼"
    const cand = normalizeKey(h.name);
    const coreHit = cores.some((t) => t.length >= 3 && cand === t);
    const coreContained = cores.some((t) => t.length >= 3 && cand.includes(t));
    if (coreContained && !coreHit && cand.length > Math.max(...cores.map((t) => t.length), 0) + 3) {
      // candidate much longer than core → likely compound false hit
      continue;
    }
    const poiBoost =
      h.featureType === 'poi' ||
      h.osmClass === 'tourism' ||
      ['attraction', 'museum', 'arts_centre', 'viewpoint', 'islet', 'island', 'tower'].includes(
        h.osmType || h.featureType,
      )
        ? 0.05
        : 0;
    let distPenalty = 0;
    if (Number.isFinite(hub.lat) && Number.isFinite(hub.lng)) {
      const m = haversineM(hub.lat, hub.lng, h.lat, h.lng);
      if (m > 80000) distPenalty = -1;
      else if (m > 30000) distPenalty = -0.2;
    }
    const score = sName + poiBoost + distPenalty;
    if (score > bestScore) {
      bestScore = score;
      best = { ...h, matchScore: score };
    }
  }
  return bestScore >= 0.75 ? best : null;
}

function gradeRow(attraction, hub, match) {
  const areaKind = AREA_KINDS.has(attraction.kind);
  if (!match) {
    return {
      grade: 'NO_HIT',
      action: areaKind ? 'review' : 'drop_or_manual',
      deltaM: null,
    };
  }
  const deltaM = haversineM(attraction.lat, attraction.lng, match.lat, match.lng);
  const kr = isKrHub(hub);

  // Strong named POI/landmark/museum/viewpoint → NAMED (exact snap)
  const namedLike =
    !areaKind ||
    match.osmClass === 'tourism' ||
    ['attraction', 'museum', 'arts_centre', 'viewpoint', 'islet', 'island', 'tower', 'poi'].includes(
      match.osmType || match.featureType,
    );

  if (namedLike && match.matchScore >= 0.8) {
    return {
      grade: 'NAMED',
      action: deltaM > NAMED_SNAP_M ? 'snap' : 'ok',
      deltaM,
    };
  }

  if (areaKind) {
    const soft = kr ? AREA_SOFT_M_KR : AREA_SOFT_M_INTL;
    const hard = kr ? AREA_HARD_M_KR : AREA_HARD_M_INTL;
    if (deltaM > hard) return { grade: 'AREA', action: 'snap', deltaM };
    if (deltaM > soft) return { grade: 'AREA', action: 'review', deltaM };
    return { grade: 'AREA', action: 'ok', deltaM };
  }

  return {
    grade: 'NAMED',
    action: deltaM > NAMED_SNAP_M ? 'snap' : 'ok',
    deltaM,
  };
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

const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));
const cache = loadCache();
const rows = [];

let targets = hubs.filter((h) => h?.hubId);
if (hubsFilter.length) targets = targets.filter((h) => hubsFilter.includes(h.hubId));
if (countryFilter === 'kr') targets = targets.filter((h) => isKrHub(h));
if (smokeOnly) {
  const ids = new Set(SMOKE.map((s) => s.hubId));
  targets = hubs.filter((h) => ids.has(h.hubId));
}

let processed = 0;
for (const hub of targets) {
  for (const attraction of hub.attractions || []) {
    if (limit && processed >= limit) break;
    processed += 1;
    const cacheKey = `${hub.hubId}::${normalizeKey(attraction.name)}`;

    let match = null;
    if (cache[cacheKey]?.match) {
      match = cache[cacheKey].match;
    } else {
      const queries = [attraction.name, attraction.name_en].filter(Boolean);
      let hits = [];
      for (const q of queries) {
        hits = hits.concat(await mapboxForward(q, hub, { types: 'poi' }));
        if (!hits.length) {
          hits = hits.concat(await mapboxForward(q, hub, { types: 'poi,place' }));
        }
      }
      match = pickBest(hits, attraction, hub);
      if (!match) {
        await sleep(1100);
        let nomHits = [];
        for (const q of queries) {
          nomHits = nomHits.concat(await nominatimSearch(q, hub));
          await sleep(1100);
        }
        match = pickBest(nomHits, attraction, hub);
      }
      cache[cacheKey] = {
        at: new Date().toISOString(),
        match: match
          ? {
              source: match.source,
              name: match.name,
              mapboxId: match.mapboxId,
              featureType: match.featureType,
              lat: match.lat,
              lng: match.lng,
              matchScore: match.matchScore,
              osmType: match.osmType,
              osmClass: match.osmClass,
            }
          : null,
      };
    }

    const graded = gradeRow(attraction, hub, match);
    rows.push({
      hubId: hub.hubId,
      name: attraction.name,
      name_en: attraction.name_en,
      kind: attraction.kind,
      ssotLat: attraction.lat,
      ssotLng: attraction.lng,
      grade: graded.grade,
      action: graded.action,
      deltaM: graded.deltaM == null ? null : Math.round(graded.deltaM),
      suggestedLat: match?.lat ?? null,
      suggestedLng: match?.lng ?? null,
      mapboxId: match?.mapboxId ?? null,
      matchSource: match?.source ?? null,
      matchName: match?.name ?? null,
    });
  }
  if (limit && processed >= limit) break;
}

saveCache(cache);

const summary = {
  scanned: rows.length,
  NAMED: rows.filter((r) => r.grade === 'NAMED').length,
  AREA: rows.filter((r) => r.grade === 'AREA').length,
  NO_HIT: rows.filter((r) => r.grade === 'NO_HIT').length,
  snap: rows.filter((r) => r.action === 'snap').length,
  token: TOKEN ? 'set' : 'missing',
};

console.log(JSON.stringify(summary, null, 2));

if (smokeOnly || hubsFilter.length) {
  console.log('ROWS:');
  for (const r of rows) {
    console.log(
      ` - ${r.hubId} | ${r.name} | ${r.grade}/${r.action} | Δ${r.deltaM ?? '-'}m | ${r.matchSource || '-'} ${r.matchName || ''} → ${r.suggestedLat},${r.suggestedLng}`,
    );
  }
}

if (writeQueue) {
  const snaps = rows.filter((r) => r.action === 'snap' || r.action === 'drop_or_manual' || r.action === 'manual');
  const outPath = join(root, 'plans/city-attraction-coord-verify-queue.md');
  const lines = [
    '# cityAttractionHubs — Mapbox/Nominatim 좌표 verify 큐',
    '',
    `스캔 ${summary.scanned} · SNAP ${summary.snap} · NAMED ${summary.NAMED} · NO_HIT ${summary.NO_HIT}`,
    '',
    '| hubId | name | grade | action | Δm | source | suggested |',
    '|-------|------|-------|--------|----|--------|-----------|',
    ...snaps.map(
      (r) =>
        `| ${r.hubId} | ${r.name} | ${r.grade} | ${r.action} | ${r.deltaM ?? ''} | ${r.matchSource || ''} | ${r.suggestedLat ?? ''},${r.suggestedLng ?? ''} |`,
    ),
    '',
  ];
  writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`wrote ${outPath}`);
}

// Smoke expectations
if (smokeOnly) {
  let failed = 0;
  for (const s of SMOKE) {
    const row = rows.find((r) => r.hubId === s.hubId && String(r.name).includes(s.nameIncludes));
    if (!row) {
      console.error(`SMOKE FAIL: missing ${s.hubId}/${s.nameIncludes}`);
      failed += 1;
      continue;
    }
    const ok =
      (s.expect === 'SNAP_OR_NAMED' && (row.action === 'snap' || row.grade === 'NAMED')) ||
      (s.expect === 'NAMED' && row.grade === 'NAMED') ||
      (s.expect === 'NO_HIT_OR_SNAP' && (row.grade === 'NO_HIT' || row.action === 'snap')) ||
      s.expect === 'ANY';
    // 박수근/한반도섬: SSOT wrong → must be snap when match exists
    if (s.nameIncludes === '박수근' || s.nameIncludes === '한반도') {
      if (row.grade === 'NAMED' && row.action !== 'snap' && (row.deltaM ?? 0) > NAMED_SNAP_M) {
        console.error(`SMOKE FAIL: ${row.name} expected SNAP, got ${row.action} Δ${row.deltaM}`);
        failed += 1;
        continue;
      }
      if (row.action === 'snap' || (row.grade === 'NAMED' && (row.deltaM ?? 0) > NAMED_SNAP_M)) {
        console.log(`SMOKE OK: ${row.name} ${row.grade}/${row.action} Δ${row.deltaM}`);
        continue;
      }
      if (row.grade === 'NO_HIT') {
        console.error(`SMOKE FAIL: ${row.name} NO_HIT (expected geocode match)`);
        failed += 1;
        continue;
      }
    }
    if (!ok) {
      console.error(`SMOKE FAIL: ${row.name} got ${row.grade}/${row.action}`);
      failed += 1;
    } else {
      console.log(`SMOKE OK: ${row.name} ${row.grade}/${row.action}`);
    }
  }
  if (failed) process.exit(1);
}

console.log('OK');
