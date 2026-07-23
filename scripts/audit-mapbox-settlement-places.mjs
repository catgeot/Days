#!/usr/bin/env node
/**
 * mapboxSettlementPlaces.json 감사 — 오케스트레이터 게이트.
 * exit 0 = 이슈 0, exit 1 = 실패.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const settlementPath = join(root, 'src/pages/Home/data/mapboxSettlementPlaces.json');
const hubsPath = join(root, 'src/pages/Home/data/cityAttractionHubs.json');

const FEATURE = new Set(['place', 'city', 'locality']);
const MAX_KM = 50;
const MIN_N = 2;
const MAX_N = 5;

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const rows = JSON.parse(readFileSync(settlementPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));
if (!Array.isArray(rows)) {
  console.error('FAIL: settlements root must be array');
  process.exit(1);
}
if (!Array.isArray(hubs)) {
  console.error('FAIL: hubs root must be array');
  process.exit(1);
}

const hubById = new Map(hubs.map((h) => [h.hubId, h]));
const issues = [];
const hubIds = new Map();
const placeIds = new Map();
const nameMap = new Map();
let settlementTotal = 0;

for (const row of rows) {
  if (!row?.hubId) {
    issues.push('row missing hubId');
    continue;
  }
  if (hubIds.has(row.hubId)) issues.push(`dup hubId row ${row.hubId}`);
  hubIds.set(row.hubId, true);

  if (!hubById.has(row.hubId)) {
    issues.push(`${row.hubId}: not in cityAttractionHubs`);
  }

  const list = row.settlements;
  if (!Array.isArray(list)) {
    issues.push(`${row.hubId}: settlements not array`);
    continue;
  }
  if (list.length < MIN_N || list.length > MAX_N) {
    issues.push(`${row.hubId}: settlements length ${list.length} (want ${MIN_N}..${MAX_N})`);
  }

  const hub = hubById.get(row.hubId);
  for (const s of list) {
    settlementTotal += 1;
    if (!s?.placeId || !s?.name || !s?.name_en || !s?.featureType) {
      issues.push(`${row.hubId}: settlement missing placeId/name/name_en/featureType`);
    }
    if (s.featureType && !FEATURE.has(s.featureType)) {
      issues.push(`${row.hubId}: bad featureType ${s.featureType}`);
    }
    if (s.kind != null || s.attractionKind != null) {
      issues.push(`${row.hubId}: POI fields forbidden on "${s?.name}"`);
    }
    if (s.lat == null || s.lng == null || !Number.isFinite(Number(s.lat)) || !Number.isFinite(Number(s.lng))) {
      issues.push(`${row.hubId}: "${s?.name}" bad coords`);
    } else if (hub && Number.isFinite(hub.lat) && Number.isFinite(hub.lng)) {
      const km = haversineKm(hub.lat, hub.lng, Number(s.lat), Number(s.lng));
      if (km > MAX_KM) {
        issues.push(`${row.hubId}: "${s.name}" ${km.toFixed(1)}km > ${MAX_KM}km`);
      }
    }
    if (s.mapboxId != null && typeof s.mapboxId !== 'string') {
      issues.push(`${row.hubId}: mapboxId must be string|null`);
    }

    if (s.placeId) {
      if (placeIds.has(s.placeId)) issues.push(`dup placeId ${s.placeId}`);
      placeIds.set(s.placeId, row.hubId);
    }

    for (const k of [s.name, s.name_en, ...(s.aliases || [])]) {
      const nk = normalizeKey(k);
      if (!nk) continue;
      if (nameMap.has(nk) && nameMap.get(nk) !== row.hubId) {
        issues.push(`name collide "${k}" ${nameMap.get(nk)} vs ${row.hubId}`);
      } else {
        nameMap.set(nk, row.hubId);
      }
    }
  }
}

const summary = {
  hubs: rows.length,
  uniqueHubIds: hubIds.size,
  settlements: settlementTotal,
  issues: issues.length,
};

console.log(JSON.stringify(summary, null, 2));
if (issues.length) {
  console.error('ISSUES:');
  for (const line of issues.slice(0, 50)) console.error(' -', line);
  if (issues.length > 50) console.error(` ... +${issues.length - 50} more`);
  process.exit(1);
}

console.log('OK');
