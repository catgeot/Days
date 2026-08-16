#!/usr/bin/env node
/**
 * seaBasins + travelSpotCoast 감사.
 * - basin id/스키마 · 중복
 * - spot seaIds orphan
 * - travelSpots slug 존재
 * - tier 1–2 칩 후보: 스팟 < 1 → FAIL (빈 칩 방지)
 * - tier 3: 스팟 수 무관 (지도 라벨만)
 * exit 0 = PASS, exit 1 = FAIL
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const basinsPath = join(root, 'src/pages/Home/data/seaBasins.json');
const coastPath = join(root, 'src/pages/Home/data/travelSpotCoast.json');
const spotsJsPath = join(root, 'src/pages/Home/data/travelSpots.js');

const COAST_KINDS = new Set(['island', 'archipelago', 'coastal-city', 'reef', 'peninsula']);
const CHIP_MIN_SPOTS = 1;

async function loadSpots() {
  const mod = await import(pathToFileURL(spotsJsPath).href);
  const list = mod.TRAVEL_SPOTS || mod.default || mod.travelSpots;
  if (!Array.isArray(list)) {
    const raw = readFileSync(spotsJsPath, 'utf8');
    const i = raw.indexOf('[');
    const j = raw.lastIndexOf(']');
    return JSON.parse(raw.slice(i, j + 1).replace(/,\s*([\]}])/g, '$1'));
  }
  return list;
}

const basinsJson = JSON.parse(readFileSync(basinsPath, 'utf8'));
const coastJson = JSON.parse(readFileSync(coastPath, 'utf8'));
const basins = basinsJson.basins || [];
const coastSpots = coastJson.spots || {};

const errors = [];
const warnings = [];

const basinById = new Map();
for (const b of basins) {
  if (!b?.id || typeof b.id !== 'string') {
    errors.push(`basin missing id: ${JSON.stringify(b)}`);
    continue;
  }
  if (basinById.has(b.id)) errors.push(`duplicate basin id: ${b.id}`);
  basinById.set(b.id, b);
  if (!b.name || !b.name_en) errors.push(`${b.id}: name/name_en required`);
  if (![1, 2, 3].includes(b.tier)) errors.push(`${b.id}: tier must be 1|2|3`);
  if (!b.center || typeof b.center.lat !== 'number' || typeof b.center.lng !== 'number') {
    errors.push(`${b.id}: center.lat/lng required`);
  }
  if (!Array.isArray(b.bbox) || b.bbox.length !== 4) errors.push(`${b.id}: bbox [W,S,E,N] required`);
}

const spots = await loadSpots();
const slugSet = new Set(spots.map((s) => s.slug));

const spotsBySea = new Map();
for (const id of basinById.keys()) spotsBySea.set(id, []);

for (const [slug, entry] of Object.entries(coastSpots)) {
  if (!slugSet.has(slug)) {
    errors.push(`coast slug not in travelSpots: ${slug}`);
    continue;
  }
  if (!COAST_KINDS.has(entry.coastKind)) {
    errors.push(`${slug}: invalid coastKind ${entry.coastKind}`);
  }
  if (!entry.seaPrimary || !basinById.has(entry.seaPrimary)) {
    errors.push(`${slug}: seaPrimary orphan ${entry.seaPrimary}`);
  }
  const ids = Array.isArray(entry.seaIds) ? entry.seaIds : [];
  if (!ids.includes(entry.seaPrimary)) {
    errors.push(`${slug}: seaIds must include seaPrimary`);
  }
  for (const sid of ids) {
    if (!basinById.has(sid)) errors.push(`${slug}: seaIds orphan ${sid}`);
    else spotsBySea.get(sid).push(slug);
  }
}

for (const [id, b] of basinById) {
  const n = spotsBySea.get(id)?.length || 0;
  if (b.tier === 1 || b.tier === 2) {
    if (n < CHIP_MIN_SPOTS) {
      errors.push(`chip basin ${id} (tier ${b.tier}) has ${n} spots (min ${CHIP_MIN_SPOTS})`);
    }
  } else if (b.tier === 3 && n === 0) {
    warnings.push(`tier3 ${id}: 0 spots (ok — label-only)`);
  }
}

console.log(`basins: ${basins.length} · coast spots: ${Object.keys(coastSpots).length}`);
const chipOk = [...basinById.values()].filter((b) => b.tier <= 2);
const chipCounts = chipOk.map((b) => `${b.id}:${spotsBySea.get(b.id)?.length || 0}`);
console.log(`tier1–2 spot counts: ${chipCounts.join(' ')}`);

if (warnings.length) {
  console.log(`warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  · ${w}`);
}

if (errors.length) {
  console.error(`FAIL (${errors.length}):`);
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}

console.log('PASS');
process.exit(0);
