/**
 * 축제 로드(벨트) SSOT → koreaFestivalBelts.json
 *
 *   npm run generate:korea-festival-belts
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KOREA_FESTIVAL_BELT_OVERRIDES } from './data/korea-festival-belt-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Korea/data/koreaFestivalBelts.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');
const AREA_PATH = join(__dirname, '../src/pages/Home/data/koreaAreaCodes.json');

const PHASE1_BELT_IDS = [
  'gw-north-inland',
  'gw-east-coast',
  'gw-central',
  'gw-west-jungbu',
];

/** @param {typeof KOREA_FESTIVAL_BELT_OVERRIDES} src */
function normalizeBelts(src) {
  if (!src || typeof src !== 'object') {
    throw new Error('[korea-festival-belts] overrides must be object');
  }
  const pilotRegion = String(src.pilotRegion || '').trim();
  if (!pilotRegion) {
    throw new Error('[korea-festival-belts] pilotRegion required');
  }

  const list = src.belts;
  if (!Array.isArray(list) || list.length < 1) {
    throw new Error('[korea-festival-belts] belts non-empty array required');
  }

  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const areaData = JSON.parse(readFileSync(AREA_PATH, 'utf8'));
  const hubById = new Map();
  for (const h of hubs) {
    if (h?.hubId) hubById.set(String(h.hubId).toLowerCase(), h);
  }
  const byHubId = areaData?.byHubId || {};

  const seenIds = new Set();
  const seenOrders = new Set();
  const belts = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('[korea-festival-belts] belt entry must be object');
    }
    const id = String(raw.id || '').trim();
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      throw new Error(`[korea-festival-belts] invalid id: ${raw.id}`);
    }
    if (seenIds.has(id)) {
      throw new Error(`[korea-festival-belts] duplicate id: ${id}`);
    }
    seenIds.add(id);

    const label = String(raw.label || '').trim();
    if (!label || label.length > 40) {
      throw new Error(`[korea-festival-belts] ${id}: label required (1–40)`);
    }
    const labelEn = String(raw.labelEn || '').trim();
    if (!labelEn || labelEn.length > 60) {
      throw new Error(`[korea-festival-belts] ${id}: labelEn required (1–60)`);
    }

    const order = Number(raw.order);
    if (!Number.isFinite(order) || !Number.isInteger(order) || order < 1) {
      throw new Error(`[korea-festival-belts] ${id}: order must be positive integer`);
    }
    if (seenOrders.has(order)) {
      throw new Error(`[korea-festival-belts] duplicate order: ${order}`);
    }
    seenOrders.add(order);

    const stopIds = raw.stops;
    if (!Array.isArray(stopIds) || stopIds.length < 2) {
      throw new Error(`[korea-festival-belts] ${id}: stops need ≥2 hubIds`);
    }

    const seenStops = new Set();
    const stops = [];
    for (let i = 0; i < stopIds.length; i += 1) {
      const hubId = String(stopIds[i] || '').trim().toLowerCase();
      if (!hubId) {
        throw new Error(`[korea-festival-belts] ${id}: empty stop at index ${i}`);
      }
      if (seenStops.has(hubId)) {
        throw new Error(`[korea-festival-belts] ${id}: duplicate stop ${hubId}`);
      }
      seenStops.add(hubId);

      const hub = hubById.get(hubId);
      if (!hub) {
        throw new Error(`[korea-festival-belts] ${id}: hub not found ${hubId}`);
      }
      const lat = Number(hub.lat);
      const lng = Number(hub.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(`[korea-festival-belts] ${id}: hub ${hubId} missing lat/lng`);
      }
      const areaCode = byHubId[hubId] != null ? String(byHubId[hubId]) : null;

      stops.push({
        hubId,
        name: String(hub.name || hubId),
        nameEn: String(hub.name_en || hub.name || hubId),
        lat,
        lng,
        areaCode,
        stopIndex: i,
      });
    }

    const blurb = String(raw.blurb || '').trim();
    if (blurb && blurb.length > 120) {
      throw new Error(`[korea-festival-belts] ${id}: blurb max 120`);
    }

    belts.push({
      id,
      label,
      labelEn,
      order,
      pilot: raw.pilot === true,
      blurb: blurb || undefined,
      stops,
    });
  }

  for (const required of PHASE1_BELT_IDS) {
    if (!seenIds.has(required)) {
      throw new Error(`[korea-festival-belts] missing phase-1 belt: ${required}`);
    }
  }

  belts.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return { pilotRegion, belts };
}

function main() {
  const { pilotRegion, belts } = normalizeBelts(KOREA_FESTIVAL_BELT_OVERRIDES);
  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      pilotRegion,
      beltCount: belts.length,
      source: 'scripts/data/korea-festival-belt-overrides.mjs',
    },
    belts,
  };
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `[korea-festival-belts] wrote ${belts.length} belts → ${OUTPUT_PATH}`,
  );
}

main();
