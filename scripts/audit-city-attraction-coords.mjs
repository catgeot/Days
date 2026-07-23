#!/usr/bin/env node
/**
 * cityAttractionHubs 좌표 기하 감사 (보조).
 *
 * - soft: report only (exit 0 unless --fail-soft)
 * - hard: exit 1 when --hard (default on)
 *
 * 사람 재현(양구·춘천·하남)은 hub 거리만으로는 미탐 — Mapbox/Nominatim verify 필요.
 *   npm run audit:city-attraction-coords
 *   npm run audit:city-attraction-coords -- --report
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  haversineKm,
  decimalPlaces,
  normalizeKey,
  WIDE_HUB_IDS,
  isKrHub,
} from './lib/geo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'src/pages/Home/data/cityAttractionHubs.json');
const args = new Set(process.argv.slice(2));
const wantHard = !args.has('--soft-only');
const wantReport = args.has('--report') || args.has('--write-queue');
const failSoft = args.has('--fail-soft');

const hubs = JSON.parse(readFileSync(path, 'utf8'));
if (!Array.isArray(hubs)) {
  console.error('FAIL: root must be array');
  process.exit(1);
}

const hard = [];
const soft = [];
const coordIndex = new Map(); // key -> [{hubId,name}]

function pushHard(msg) {
  hard.push(msg);
}
function pushSoft(msg) {
  soft.push(msg);
}

for (const h of hubs) {
  if (!h?.hubId || !Array.isArray(h.attractions)) continue;
  const wide = WIDE_HUB_IDS.has(h.hubId);
  const softKm = wide ? 150 : isKrHub(h) ? 50 : 80;
  const hardKm = wide ? 400 : 120;
  const seenInHub = new Map();

  for (const a of h.attractions) {
    if (a?.lat == null || a?.lng == null) continue;
    const lat = Number(a.lat);
    const lng = Number(a.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      pushHard(`${h.hubId}: "${a.name}" non-finite coords`);
      continue;
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      pushHard(`${h.hubId}: "${a.name}" out of range lat/lng`);
    }

    const dLat = decimalPlaces(a.lat);
    const dLng = decimalPlaces(a.lng);
    if (dLat <= 1 || dLng <= 1) {
      pushHard(`${h.hubId}: "${a.name}" coarse precision (≤1 decimal) lat=${a.lat} lng=${a.lng}`);
    } else if (dLat <= 2 && dLng <= 2 && isKrHub(h)) {
      pushSoft(`${h.hubId}: "${a.name}" KR coarse ≤2 decimals`);
    }

    if (Number.isFinite(h.lat) && Number.isFinite(h.lng)) {
      const km = haversineKm(h.lat, h.lng, lat, lng);
      if (km > hardKm) {
        pushHard(`${h.hubId}: "${a.name}" ${km.toFixed(1)}km > hard ${hardKm}km`);
      } else if (km > softKm) {
        pushSoft(`${h.hubId}: "${a.name}" ${km.toFixed(1)}km > soft ${softKm}km (hub-distance; POI identity not checked)`);
      }
      if (km < 0.05 && a.kind !== 'neighborhood') {
        pushSoft(`${h.hubId}: "${a.name}" hub-clone <50m (kind=${a.kind})`);
      }
    }

    const key4 = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (seenInHub.has(key4)) {
      pushHard(
        `${h.hubId}: duplicate coords ${key4} "${seenInHub.get(key4)}" vs "${a.name}"`,
      );
    } else {
      seenInHub.set(key4, a.name);
    }

    if (!coordIndex.has(key4)) coordIndex.set(key4, []);
    coordIndex.get(key4).push({ hubId: h.hubId, name: a.name });
  }
}

for (const [key, items] of coordIndex) {
  if (items.length < 2) continue;
  const hubsSet = new Set(items.map((x) => x.hubId));
  if (hubsSet.size < 2) continue;
  const names = new Set(items.map((x) => normalizeKey(x.name)));
  if (names.size < 2) continue;
  pushHard(
    `cross-hub same coords ${key}: ${items
      .slice(0, 4)
      .map((x) => `${x.hubId}/${x.name}`)
      .join(' · ')}`,
  );
}

const summary = {
  hubs: hubs.length,
  hard: hard.length,
  soft: soft.length,
  note:
    'KR repro (yanggu 한반도섬/박수근, chuncheon 김유정, hanam 풍산) are typically hub-near and miss hub-distance gates — use verify:city-attraction-coords',
};

console.log(JSON.stringify(summary, null, 2));

if (wantReport) {
  const outDir = join(root, 'plans');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'city-attraction-coord-repair-queue.md');
  const lines = [
    '# cityAttractionHubs — 좌표 수리 큐 (오프라인 audit)',
    '',
    `생성: audit:city-attraction-coords · hard ${hard.length} · soft ${soft.length}`,
    '',
    '## Hard',
    ...hard.slice(0, 200).map((l) => `- ${l}`),
    hard.length > 200 ? `- … +${hard.length - 200} more` : '',
    '',
    '## Soft',
    ...soft.slice(0, 100).map((l) => `- ${l}`),
    soft.length > 100 ? `- … +${soft.length - 100} more` : '',
    '',
    '## Note',
    '- hub 거리만으로는 사람 재현(양구·춘천·하남) 미탐 → `npm run verify:city-attraction-coords`',
    '',
  ].filter(Boolean);
  writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`wrote ${outPath}`);
}

if (hard.length && wantHard) {
  console.error('HARD:');
  for (const line of hard.slice(0, 40)) console.error(` - ${line}`);
  if (hard.length > 40) console.error(` ... +${hard.length - 40} more`);
  process.exit(1);
}

if (failSoft && soft.length) {
  console.error('SOFT (fail-soft):');
  for (const line of soft.slice(0, 40)) console.error(` - ${line}`);
  process.exit(1);
}

console.log('OK');
