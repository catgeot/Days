/**
 * GATEO 선정 명소 SSOT → koreaScenicSpots.json
 *
 *   npm run generate:korea-scenic-spots
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KOREA_SCENIC_SPOTS_OVERRIDES } from './data/korea-scenic-spots-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');

const MIN_COUNT = 12;
const MAX_COUNT = 100;
const ALLOWED_REGIONS = new Set(['제주', '강원', '전라', '경상', '수도권', '충청']);

function toUrlSlug(nameEn) {
  if (!nameEn) return '';
  return String(nameEn)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function loadHubIndex() {
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  /** @type {Map<string, { hub: object, attraction: object }>} */
  const byHubAttraction = new Map();
  for (const hub of hubs) {
    for (const attraction of hub.attractions || []) {
      const key = `${normalizeKey(hub.hubId)}::${normalizeKey(attraction.name)}`;
      byHubAttraction.set(key, { hub, attraction });
    }
  }
  return byHubAttraction;
}

/** @param {typeof KOREA_SCENIC_SPOTS_OVERRIDES} src */
function normalizeSpots(src, hubIndex) {
  if (!src || typeof src !== 'object') {
    throw new Error('[korea-scenic-spots] overrides must be object');
  }
  const list = src.spots;
  if (!Array.isArray(list) || list.length < MIN_COUNT || list.length > MAX_COUNT) {
    throw new Error(
      `[korea-scenic-spots] spots must be ${MIN_COUNT}–${MAX_COUNT} (got ${list?.length})`,
    );
  }

  const seenIds = new Set();
  const seenOrders = new Set();
  const spots = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('[korea-scenic-spots] spot entry must be object');
    }

    const order = Number(raw.order);
    if (!Number.isInteger(order) || order < 1) {
      throw new Error(`[korea-scenic-spots] order must be positive int: ${raw.order}`);
    }
    if (seenOrders.has(order)) {
      throw new Error(`[korea-scenic-spots] duplicate order: ${order}`);
    }
    seenOrders.add(order);

    const id = String(raw.id || '').trim();
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      throw new Error(`[korea-scenic-spots] id kebab required: ${raw.id}`);
    }
    if (seenIds.has(id)) {
      throw new Error(`[korea-scenic-spots] duplicate id: ${id}`);
    }
    seenIds.add(id);

    const name = String(raw.name || '').trim();
    if (!name || name.length > 40) {
      throw new Error(`[korea-scenic-spots] ${id}: name required (1–40)`);
    }
    const blurb = String(raw.blurb || '').trim();
    if (!blurb || blurb.length > 80) {
      throw new Error(`[korea-scenic-spots] ${id}: blurb required (1–80)`);
    }
    const region = String(raw.region || '').trim();
    if (!ALLOWED_REGIONS.has(region)) {
      throw new Error(`[korea-scenic-spots] ${id}: unknown region ${raw.region}`);
    }

    const hubId = String(raw.hubId || '').trim();
    const attractionName = String(raw.attractionName || '').trim();
    if (!hubId || !attractionName) {
      throw new Error(`[korea-scenic-spots] ${id}: hubId + attractionName required`);
    }

    const hit = hubIndex.get(`${normalizeKey(hubId)}::${normalizeKey(attractionName)}`);
    if (!hit) {
      throw new Error(
        `[korea-scenic-spots] ${id}: hub attraction not found (${hubId} / ${attractionName})`,
      );
    }

    const placeSlug = toUrlSlug(hit.attraction.name_en || hit.attraction.name);
    if (!placeSlug) {
      throw new Error(`[korea-scenic-spots] ${id}: placeSlug empty`);
    }

    const lat = Number(hit.attraction.lat ?? hit.hub.lat);
    const lng = Number(hit.attraction.lng ?? hit.hub.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(`[korea-scenic-spots] ${id}: lat/lng required`);
    }

    let contentId = null;
    if (raw.contentId != null && String(raw.contentId).trim()) {
      contentId = String(raw.contentId).trim();
      if (!/^\d+$/.test(contentId)) {
        throw new Error(`[korea-scenic-spots] ${id}: contentId must be digits`);
      }
    }

    spots.push({
      order,
      id,
      name,
      blurb,
      region,
      hubId,
      attractionName,
      attractionNameEn: hit.attraction.name_en || hit.attraction.name,
      placeSlug,
      lat,
      lng,
      contentId,
    });
  }

  spots.sort((a, b) => a.order - b.order);
  return spots;
}

function main() {
  const hubIndex = loadHubIndex();
  const spots = normalizeSpots(KOREA_SCENIC_SPOTS_OVERRIDES, hubIndex);
  const regions = [...new Set(spots.map((s) => s.region))];
  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      count: spots.length,
      curation: 'GATEO',
      disclaimer: 'GATEO 선정 명소 — 공식 지정 목록이 아닙니다. 많이 찾는 인기 관광지를 골랐습니다.',
      source: 'scripts/data/korea-scenic-spots-overrides.mjs',
      regions,
    },
    spots,
  };
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`[korea-scenic-spots] wrote ${spots.length} spots → ${OUTPUT_PATH}`);
}

main();
