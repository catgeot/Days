/**
 * 10대 절경 SSOT → koreaTop10Scenic.json
 *
 *   npm run generate:korea-top10-scenic
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KOREA_TOP10_SCENIC_OVERRIDES } from './data/korea-top10-scenic-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/koreaTop10Scenic.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');

const EXPECTED_COUNT = 10;
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

/** @param {typeof KOREA_TOP10_SCENIC_OVERRIDES} src */
function normalizeSpots(src, hubIndex) {
  if (!src || typeof src !== 'object') {
    throw new Error('[korea-top10-scenic] overrides must be object');
  }
  const list = src.spots;
  if (!Array.isArray(list) || list.length !== EXPECTED_COUNT) {
    throw new Error(`[korea-top10-scenic] spots must be exactly ${EXPECTED_COUNT}`);
  }

  const seenIds = new Set();
  const seenRanks = new Set();
  const spots = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('[korea-top10-scenic] spot entry must be object');
    }

    const rank = Number(raw.rank);
    if (!Number.isInteger(rank) || rank < 1 || rank > EXPECTED_COUNT) {
      throw new Error(`[korea-top10-scenic] rank must be 1–${EXPECTED_COUNT}: ${raw.rank}`);
    }
    if (seenRanks.has(rank)) {
      throw new Error(`[korea-top10-scenic] duplicate rank: ${rank}`);
    }
    seenRanks.add(rank);

    const id = String(raw.id || '').trim();
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      throw new Error(`[korea-top10-scenic] id kebab required: ${raw.id}`);
    }
    if (seenIds.has(id)) {
      throw new Error(`[korea-top10-scenic] duplicate id: ${id}`);
    }
    seenIds.add(id);

    const name = String(raw.name || '').trim();
    if (!name || name.length > 40) {
      throw new Error(`[korea-top10-scenic] ${id}: name required (1–40)`);
    }
    const blurb = String(raw.blurb || '').trim();
    if (!blurb || blurb.length > 80) {
      throw new Error(`[korea-top10-scenic] ${id}: blurb required (1–80)`);
    }
    const region = String(raw.region || '').trim();
    if (!ALLOWED_REGIONS.has(region)) {
      throw new Error(`[korea-top10-scenic] ${id}: unknown region ${raw.region}`);
    }

    const hubId = String(raw.hubId || '').trim();
    const attractionName = String(raw.attractionName || '').trim();
    if (!hubId || !attractionName) {
      throw new Error(`[korea-top10-scenic] ${id}: hubId + attractionName required`);
    }

    const hit = hubIndex.get(`${normalizeKey(hubId)}::${normalizeKey(attractionName)}`);
    if (!hit) {
      throw new Error(
        `[korea-top10-scenic] ${id}: hub attraction not found (${hubId} / ${attractionName})`,
      );
    }

    const placeSlug = toUrlSlug(hit.attraction.name_en || hit.attraction.name);
    if (!placeSlug) {
      throw new Error(`[korea-top10-scenic] ${id}: placeSlug empty`);
    }

    const lat = Number(hit.attraction.lat ?? hit.hub.lat);
    const lng = Number(hit.attraction.lng ?? hit.hub.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(`[korea-top10-scenic] ${id}: lat/lng required`);
    }

    let contentId = null;
    if (raw.contentId != null && String(raw.contentId).trim()) {
      contentId = String(raw.contentId).trim();
      if (!/^\d+$/.test(contentId)) {
        throw new Error(`[korea-top10-scenic] ${id}: contentId must be digits`);
      }
    }

    spots.push({
      rank,
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

  for (let r = 1; r <= EXPECTED_COUNT; r += 1) {
    if (!seenRanks.has(r)) {
      throw new Error(`[korea-top10-scenic] missing rank: ${r}`);
    }
  }

  spots.sort((a, b) => a.rank - b.rank);
  return spots;
}

function main() {
  const hubIndex = loadHubIndex();
  const spots = normalizeSpots(KOREA_TOP10_SCENIC_OVERRIDES, hubIndex);
  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      count: spots.length,
      curation: 'GATEO',
      disclaimer: 'GATEO 선정 — 공식 국가 지정 10대가 아닙니다.',
      source: 'scripts/data/korea-top10-scenic-overrides.mjs',
    },
    spots,
  };
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`[korea-top10-scenic] wrote ${spots.length} spots → ${OUTPUT_PATH}`);
}

main();
