#!/usr/bin/env node
/**
 * cityAttractionHubs tip 필드 패치 (좌표 수리).
 * 입력: JSON 배열 [{hubId,name,lat,lng,mapboxId|null,action:snap|drop|rename,newName?}]
 *
 *   node scripts/apply-attraction-coord-patches.mjs path/to/patches.json
 *   node scripts/apply-attraction-coord-patches.mjs --stdin < patches.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hubsPath = join(root, 'src/pages/Home/data/cityAttractionHubs.json');

const args = process.argv.slice(2);
const useStdin = args.includes('--stdin');
const fileArg = args.find((a) => !a.startsWith('--'));

function loadPatches() {
  if (useStdin) {
    return JSON.parse(readFileSync(0, 'utf8'));
  }
  if (!fileArg) {
    console.error('usage: apply-attraction-coord-patches.mjs <patches.json> | --stdin');
    process.exit(2);
  }
  return JSON.parse(readFileSync(fileArg, 'utf8'));
}

const patches = loadPatches();
const list = Array.isArray(patches) ? patches : patches.items || patches.patches || [];
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));
const byHub = new Map(hubs.map((h) => [h.hubId, h]));

let snapped = 0;
let dropped = 0;
let renamed = 0;
const missing = [];

for (const p of list) {
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
  const action = String(p.action || 'snap').toLowerCase();
  if (action === 'drop') {
    hub.attractions.splice(idx, 1);
    dropped += 1;
    continue;
  }
  const a = hub.attractions[idx];
  if (action === 'rename' && p.newName) {
    a.name = p.newName;
    if (p.name_en) a.name_en = p.name_en;
    renamed += 1;
  }
  if (action === 'snap' || action === 'rename') {
    if (Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))) {
      a.lat = Number(p.lat);
      a.lng = Number(p.lng);
      snapped += 1;
    }
    if (p.mapboxId !== undefined) {
      if (p.mapboxId) a.mapboxId = p.mapboxId;
      else if (a.mapboxId != null) a.mapboxId = null;
    }
  }
}

writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify({ ok: true, snapped, dropped, renamed, missing: missing.length, missingSample: missing.slice(0, 10) }, null, 2),
);
if (missing.length) process.exit(1);
