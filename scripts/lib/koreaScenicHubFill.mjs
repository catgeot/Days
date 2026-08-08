/**
 * GATEO 선정 명소 — 빈 hub 보강용 공통 헬퍼.
 * report / draft / queue 스크립트가 공유.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  placeUrlSlug,
  resolveCityAttractionHub,
} from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  scenicRegionForAreaCode,
  SCENIC_REGION_ORDER,
} from '../../src/pages/Home/lib/koreaTourAttractionMap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

export const SCENIC_FILL_REGION_ORDER = SCENIC_REGION_ORDER;

function isDomesticKoreaHub(hub) {
  const c = String(hub?.country || '').trim();
  const ce = String(hub?.country_en || '').trim().toLowerCase();
  return c === '대한민국' || ce === 'south korea' || ce === 'korea';
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function loadJson(relPath) {
  return JSON.parse(readFileSync(join(ROOT, relPath), 'utf8'));
}

/** 자치구(…구) hub — 선정 보강 큐에서 제외(시·군·섬 우선) */
export function isDistrictHub(hub) {
  const aliases = Array.isArray(hub?.aliases) ? hub.aliases : [];
  return aliases.some((a) => {
    const s = String(a || '').trim();
    return /구$/.test(s) && !/군$/.test(s);
  });
}

export function loadScenicFillContext() {
  const scenic = loadJson('src/pages/Home/data/koreaScenicSpots.json');
  const hubs = loadJson('src/pages/Home/data/cityAttractionHubs.json');
  const areas = loadJson('src/pages/Home/data/koreaAreaCodes.json');
  const tour = loadJson('src/pages/Home/data/koreaThemeRegionTour.json');
  const byHubId = areas?.byHubId && typeof areas.byHubId === 'object' ? areas.byHubId : {};
  const byAttractionId =
    tour?.byAttractionId && typeof tour.byAttractionId === 'object'
      ? tour.byAttractionId
      : {};

  /** @type {Map<string, number>} */
  const curatedCount = new Map();
  let maxOrder = 0;
  for (const s of Array.isArray(scenic?.spots) ? scenic.spots : []) {
    const hubId = String(s?.hubId || '')
      .trim()
      .toLowerCase();
    if (hubId) curatedCount.set(hubId, (curatedCount.get(hubId) || 0) + 1);
    const order = Number(s?.order);
    if (Number.isInteger(order) && order > maxOrder) maxOrder = order;
  }

  return {
    scenic,
    hubs: Array.isArray(hubs) ? hubs : [],
    byHubId,
    byAttractionId,
    curatedCount,
    maxOrder,
  };
}

/**
 * @param {object} hub
 * @param {Record<string, { contentId?: string }>} byAttractionId
 */
export function listHubAttractionCandidates(hub, byAttractionId) {
  const hubId = String(hub?.hubId || '')
    .trim()
    .toLowerCase();
  const out = [];
  for (const attraction of hub?.attractions || []) {
    const name = String(attraction?.name || '').trim();
    if (!name) continue;
    const slug = placeUrlSlug(attraction?.name_en, name);
    const key = `${hubId}:${slug}`;
    const hit = byAttractionId[key];
    const contentId = String(hit?.contentId || '').trim();
    out.push({
      name,
      nameEn: String(attraction?.name_en || name).trim(),
      kind: String(attraction?.kind || '').trim() || null,
      slug,
      attractionKey: key,
      contentId: /^\d{1,32}$/.test(contentId) ? contentId : null,
      lat: Number(attraction?.lat),
      lng: Number(attraction?.lng),
    });
  }
  return out.sort((a, b) => {
    if (Boolean(b.contentId) !== Boolean(a.contentId)) {
      return a.contentId ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'ko');
  });
}

/**
 * @param {object} hub
 * @param {Record<string, string|number>} byHubId
 * @param {object[]} allHubs
 */
function inferRegion(hub, byHubId, allHubs) {
  const hubId = String(hub?.hubId || '')
    .trim()
    .toLowerCase();
  const linked = byHubId[hubId];
  if (linked != null) {
    const region = scenicRegionForAreaCode(String(linked));
    if (region) {
      return { region, areaCode: String(linked), regionSource: 'area-link' };
    }
  }

  const lat = Number(hub?.lat);
  const lng = Number(hub?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { region: null, areaCode: null, regionSource: 'unknown' };
  }

  let nearest = null;
  for (const other of allHubs) {
    if (!isDomesticKoreaHub(other) || !other?.hubId) continue;
    const oid = String(other.hubId).trim().toLowerCase();
    const areaCode = byHubId[oid];
    if (areaCode == null) continue;
    const oLat = Number(other.lat);
    const oLng = Number(other.lng);
    if (!Number.isFinite(oLat) || !Number.isFinite(oLng)) continue;
    const km = haversineKm(lat, lng, oLat, oLng);
    if (!nearest || km < nearest.km) {
      nearest = { areaCode: String(areaCode), km };
    }
  }
  if (nearest && nearest.km <= 200) {
    const region = scenicRegionForAreaCode(nearest.areaCode);
    if (region) {
      return {
        region,
        areaCode: nearest.areaCode,
        regionSource: 'coords-nearest',
      };
    }
  }
  return { region: null, areaCode: null, regionSource: 'unknown' };
}

/**
 * curated=0 인 국내 hub 목록 (구 제외 기본).
 * @param {{ includeDistricts?: boolean }} [opts]
 */
export function listEmptyScenicHubs(opts = {}) {
  const includeDistricts = Boolean(opts.includeDistricts);
  const ctx = loadScenicFillContext();
  const empty = [];

  for (const hub of ctx.hubs) {
    if (!isDomesticKoreaHub(hub) || !hub?.hubId) continue;
    const hubId = String(hub.hubId).trim().toLowerCase();
    if ((ctx.curatedCount.get(hubId) || 0) > 0) continue;
    const district = isDistrictHub(hub);
    if (district && !includeDistricts) continue;

    const candidates = listHubAttractionCandidates(hub, ctx.byAttractionId);
    const { region, areaCode, regionSource } = inferRegion(
      hub,
      ctx.byHubId,
      ctx.hubs,
    );
    const areaLinked = ctx.byHubId[hubId] != null;

    empty.push({
      hubId,
      name: String(hub.name || hubId).trim(),
      nameEn: String(hub.name_en || '').trim() || null,
      lat: Number(hub.lat),
      lng: Number(hub.lng),
      district,
      areaLinked,
      areaCode,
      region,
      regionSource,
      attractions: candidates.length,
      withContentId: candidates.filter((c) => c.contentId).length,
      candidates,
      priority: areaLinked ? 0 : 1,
    });
  }

  empty.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ri =
      SCENIC_REGION_ORDER.indexOf(a.region || '') -
      SCENIC_REGION_ORDER.indexOf(b.region || '');
    if (ri !== 0) {
      const ai = a.region ? SCENIC_REGION_ORDER.indexOf(a.region) : 99;
      const bi = b.region ? SCENIC_REGION_ORDER.indexOf(b.region) : 99;
      if (ai !== bi) return ai - bi;
    }
    if (b.withContentId !== a.withContentId) return b.withContentId - a.withContentId;
    if (b.attractions !== a.attractions) return b.attractions - a.attractions;
    return a.hubId.localeCompare(b.hubId);
  });

  return { empty, maxOrder: ctx.maxOrder, curatedHubs: ctx.curatedCount.size };
}

/**
 * @param {string[]} hubIds
 * @param {{ perHub?: number, startOrder?: number }} [opts]
 */
export function draftScenicSpotsForHubs(hubIds, opts = {}) {
  const perHub = Math.max(1, Number(opts.perHub) || 4);
  const ctx = loadScenicFillContext();
  let order = Number.isInteger(opts.startOrder)
    ? opts.startOrder
    : ctx.maxOrder + 10;
  if (order <= ctx.maxOrder) order = ctx.maxOrder + 10;
  // keep order step 10
  if (order % 10 !== 0) order = Math.ceil(order / 10) * 10;

  const drafts = [];
  const skipped = [];

  for (const rawId of hubIds) {
    const hubId = String(rawId || '')
      .trim()
      .toLowerCase();
    if (!hubId) continue;
    const hub = resolveCityAttractionHub(hubId);
    if (!hub || !isDomesticKoreaHub(hub)) {
      skipped.push({ hubId, reason: 'hub-not-found-or-not-kr' });
      continue;
    }
    const existing = ctx.curatedCount.get(hubId) || 0;
    if (existing > 0) {
      skipped.push({ hubId, reason: `already-curated:${existing}` });
      continue;
    }
    if (isDistrictHub(hub)) {
      skipped.push({ hubId, reason: 'district-hub' });
      continue;
    }

    const { region, regionSource } = inferRegion(hub, ctx.byHubId, ctx.hubs);
    if (!region) {
      skipped.push({ hubId, reason: 'region-unknown' });
      continue;
    }

    const candidates = listHubAttractionCandidates(hub, ctx.byAttractionId).slice(
      0,
      perHub,
    );
    if (candidates.length === 0) {
      skipped.push({ hubId, reason: 'no-attractions' });
      continue;
    }

    for (const c of candidates) {
      const id = c.slug || placeUrlSlug(c.nameEn, c.name);
      const kindHint = c.kind ? ` (${c.kind})` : '';
      drafts.push({
        order,
        id,
        name: c.name,
        blurb: `${hub.name} 대표 명소${kindHint}`.slice(0, 80),
        region,
        hubId,
        attractionName: c.name,
        contentId: c.contentId,
        _meta: {
          regionSource,
          attractionKey: c.attractionKey,
          needsBlurbPolish: true,
          needsContentId: !c.contentId,
        },
      });
      order += 10;
    }
  }

  return { drafts, skipped, nextOrder: order };
}

/**
 * 빈 hub를 워커A/B 5+5 라운드로 나눔.
 * P0(area 링크) 먼저 · 이후 권역 순으로 묶어 배치가 한 권역에 모이게 함.
 * @param {ReturnType<typeof listEmptyScenicHubs>['empty']} empty
 * @param {{ batchSize?: number }} [opts]
 */
export function buildScenicFillRounds(empty, opts = {}) {
  const batchSize = Math.max(2, Number(opts.batchSize) || 10);
  const half = Math.floor(batchSize / 2);

  /** @type {(typeof empty)[]} */
  const chunks = [];
  const p0 = empty.filter((h) => h.priority === 0);
  if (p0.length) chunks.push(p0);

  for (const region of [...SCENIC_REGION_ORDER, null]) {
    const slice = empty.filter((h) => {
      if (h.priority === 0) return false;
      if (region == null) return !h.region;
      return h.region === region;
    });
    for (let i = 0; i < slice.length; i += batchSize) {
      chunks.push(slice.slice(i, i + batchSize));
    }
  }

  const rounds = [];
  for (const slice of chunks) {
    if (!slice.length) continue;
    const workerA = slice.slice(0, half).map((h) => h.hubId);
    const workerB = slice.slice(half).map((h) => h.hubId);
    const regions = [
      ...new Set(slice.map((h) => h.region || '미정').filter(Boolean)),
    ];
    rounds.push({
      round: `R${String(rounds.length + 1).padStart(2, '0')}`,
      workerA,
      workerB,
      regions,
      hubs: slice,
    });
  }
  return rounds;
}
