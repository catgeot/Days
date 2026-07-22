#!/usr/bin/env node
/**
 * cityAttractionHubs.json 감사 — 오케스트레이터 게이트용.
 * exit 0 = 이슈 0, exit 1 = 실패.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'src/pages/Home/data/cityAttractionHubs.json');

const KIND = new Set([
  'beach',
  'market',
  'temple',
  'shrine',
  'viewpoint',
  'landmark',
  'museum',
  'neighborhood',
  'park',
]);

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const hubs = JSON.parse(readFileSync(path, 'utf8'));
if (!Array.isArray(hubs)) {
  console.error('FAIL: root must be array');
  process.exit(1);
}

const issues = [];
const hubIds = new Map();
const aliasMap = new Map();
const attrNames = new Map();
let attrTotal = 0;

for (const h of hubs) {
  if (!h?.hubId) {
    issues.push('hub missing hubId');
    continue;
  }
  if (hubIds.has(h.hubId)) issues.push(`dup hubId ${h.hubId}`);
  hubIds.set(h.hubId, true);

  for (const field of ['name', 'name_en', 'country', 'country_en']) {
    if (!h[field]) issues.push(`${h.hubId}: missing ${field}`);
  }
  if (h.lat == null || h.lng == null) issues.push(`${h.hubId}: missing coords`);

  for (const k of [h.name, h.name_en, h.hubId, ...(h.aliases || [])]) {
    const nk = normalizeKey(k);
    if (!nk) continue;
    if (aliasMap.has(nk) && aliasMap.get(nk) !== h.hubId) {
      issues.push(`alias collide "${k}" ${aliasMap.get(nk)} vs ${h.hubId}`);
    } else {
      aliasMap.set(nk, h.hubId);
    }
  }

  if (!Array.isArray(h.attractions)) {
    issues.push(`${h.hubId}: attractions not array`);
    continue;
  }
  if (h.attractions.length < 4) {
    issues.push(`${h.hubId}: too few attractions (${h.attractions.length})`);
  }

  for (const a of h.attractions) {
    attrTotal += 1;
    if (!a?.name || !a?.name_en || !a?.kind) {
      issues.push(`${h.hubId}: attr missing name/name_en/kind`);
    }
    if (a.lat == null || a.lng == null) {
      issues.push(`${h.hubId}: attr "${a?.name}" missing coords`);
    }
    if (a.kind && !KIND.has(a.kind)) {
      issues.push(`${h.hubId}: bad kind ${a.kind}`);
    }
    for (const k of [a.name, a.name_en]) {
      const nk = normalizeKey(k);
      if (!nk) continue;
      if (attrNames.has(nk) && attrNames.get(nk) !== h.hubId) {
        issues.push(`attr collide "${k}" ${attrNames.get(nk)} vs ${h.hubId}`);
      } else {
        attrNames.set(nk, h.hubId);
      }
    }
  }
}

const summary = {
  hubs: hubs.length,
  uniqueHubIds: hubIds.size,
  attractions: attrTotal,
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
