#!/usr/bin/env node
/**
 * Festival detail bottom sections — client gating + optional LIVE nearby fetches.
 *
 *   node scripts/health/festival-detail-section-scan.mjs
 *   FESTIVAL_SECTION_SCAN_LIVE=0 node scripts/health/festival-detail-section-scan.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateFestivalDetailSections,
  sectionIsHiddenByGating,
} from '../../src/pages/Korea/lib/festivalDetailSectionGate.js';
import {
  scanFetchNearbyAttractions,
  scanFetchNearbyCulture,
  scanFetchNearbyCourses,
  scanFetchNearbyLeports,
  scanFetchNearbyRestaurants,
} from '../lib/festivalScanHttp.mjs';
import { festivalLngLat } from '../../src/pages/Korea/koreaFestivalCorridors.js';
import { detectSidoCode } from '../../src/pages/Korea/festivalRegionTags.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const outDir = join(root, 'artifacts/festival-section-scan');

const LIVE = process.env.FESTIVAL_SECTION_SCAN_LIVE !== '0';
const THROTTLE_MS = Number(process.env.FESTIVAL_SECTION_SCAN_THROTTLE_MS || 120);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadFestivalItems() {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY required');
  const cacheUrl =
    `${url}/rest/v1/tourapi_festival_cache` +
    '?select=payload' +
    '&cache_key=like.list:ko:rolling12*' +
    '&order=fetched_at.desc' +
    '&limit=1';
  const res = await fetch(cacheUrl, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  if (!res.ok) throw new Error(`festival cache HTTP ${res.status}`);
  const rows = await res.json();
  const items = rows?.[0]?.payload?.items;
  if (!Array.isArray(items) || !items.length) {
    throw new Error('festival cache empty');
  }
  return items;
}

function mapFetchStatus(res, spots) {
  const list = Array.isArray(spots) ? spots : Array.isArray(res?.spots) ? res.spots : [];
  if (res?.error) return { status: 'error', count: list.length };
  if (!list.length) return { status: 'empty', count: 0 };
  return { status: 'ok', count: list.length };
}

async function fetchNearbyBundle(item) {
  const pt = festivalLngLat(item?.mapx, item?.mapy);
  const areaCode = String(
    item?.areaCode ?? item?.areacode ?? detectSidoCode(item?.addr1) ?? '',
  ).trim();
  if (!pt) {
    return {
      attractions: { status: 'nocoords', count: 0 },
      food: { status: 'nocoords', count: 0 },
      leports: { status: 'nocoords', count: 0 },
      culture: { status: 'nocoords', count: 0 },
      courses: { status: 'noarea', count: 0 },
    };
  }
  const [attr, food, leports, culture, courses] = await Promise.all([
    scanFetchNearbyAttractions({ lat: pt.lat, lng: pt.lng, radiusKm: 8, limit: 8 }),
    scanFetchNearbyRestaurants({
      lat: pt.lat,
      lng: pt.lng,
      radiusKm: 3,
      limit: 8,
      areaCode,
    }),
    scanFetchNearbyLeports({
      lat: pt.lat,
      lng: pt.lng,
      radiusKm: 5,
      limit: 6,
      areaCode,
    }),
    scanFetchNearbyCulture({
      lat: pt.lat,
      lng: pt.lng,
      radiusKm: 5,
      limit: 6,
      areaCode,
    }),
    areaCode
      ? scanFetchNearbyCourses({
          lat: pt.lat,
          lng: pt.lng,
          areaCode,
          radiusKm: 80,
          limit: 6,
        })
      : Promise.resolve({ spots: [], error: 'areaCode required' }),
  ]);
  return {
    attractions: mapFetchStatus(attr, attr?.spots),
    food: mapFetchStatus(food, food?.spots),
    leports: mapFetchStatus(leports, leports?.spots),
    culture: mapFetchStatus(culture, culture?.spots),
    courses: areaCode
      ? mapFetchStatus(courses, courses?.spots)
      : { status: 'noarea', count: 0 },
  };
}

function lodgingCell(lodging) {
  if (lodging.shell === 'hidden') return 'hidden|no_stay_location';
  if (lodging.strip === 'visible') return 'visible|';
  return `hidden|${lodging.reason || 'gating'}`;
}

function sectionCell(sec) {
  if (sec.shell === 'hidden') return `hidden|${sec.reason}`;
  if (sec.content === 'hidden') return `hidden|${sec.reason}`;
  if (sec.content === 'visible') return 'visible|has_items';
  if (sec.content === 'empty') return `visible_empty|${sec.reason}`;
  if (sec.content === 'loading') return 'visible|loading';
  return `visible|${sec.reason || ''}`;
}

function csvEscape(s) {
  const t = String(s ?? '');
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export async function runFestivalDetailSectionScan() {
  const items = await loadFestivalItems();
  const rows = [];
  const hiddenGating = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = {
      ...items[i],
      contentId: String(items[i]?.contentId ?? '').trim(),
    };
    const nearby = LIVE ? await fetchNearbyBundle(item) : undefined;
    if (LIVE && THROTTLE_MS > 0) await sleep(THROTTLE_MS);

    const branch = evaluateFestivalDetailSections(item, { nearby });
    const main = evaluateFestivalDetailSections(item, {
      nearby,
      legacyCategoryInference: true,
    });

    const record = {
      contentId: branch.contentId,
      title: branch.title,
      hubId: branch.hubId,
      hubName: branch.hubName,
      lodging_main: lodgingCell(main.sections.lodging),
      lodging_branch: lodgingCell(branch.sections.lodging),
      nearAttractions: sectionCell(branch.sections.nearAttractions),
      packages: sectionCell(branch.sections.packages),
      nearFood: sectionCell(branch.sections.nearFood),
      nearLeports: sectionCell(branch.sections.nearLeports),
      nearCulture: sectionCell(branch.sections.nearCulture),
      nearCourses: sectionCell(branch.sections.nearCourses),
    };
    rows.push(record);

    for (const [key, sec] of Object.entries(branch.sections)) {
      if (key === 'lodging') {
        if (branch.sections.lodging.strip !== 'visible' && branch.sections.lodging.shell === 'visible') {
          hiddenGating.push({
            contentId: branch.contentId,
            title: branch.title,
            hubId: branch.hubId,
            section: 'lodging',
            reason: branch.sections.lodging.reason,
          });
        }
        continue;
      }
      if (sectionIsHiddenByGating(sec)) {
        hiddenGating.push({
          contentId: branch.contentId,
          title: branch.title,
          hubId: branch.hubId,
          section: key,
          reason: sec.reason,
        });
      }
    }

    if ((i + 1) % 25 === 0) {
      console.error(`scan ${i + 1}/${items.length}`);
    }
  }

  const header = [
    'contentId',
    'title',
    'hubId',
    'hubName',
    'lodging_main',
    'lodging_branch',
    'nearAttractions',
    'packages',
    'nearFood',
    'nearLeports',
    'nearCulture',
    'nearCourses',
  ];
  const csv = [
    header.join(','),
    ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(',')),
  ].join('\n');

  const sectionCounts = {};
  for (const id of [
    'nearAttractions',
    'packages',
    'nearFood',
    'nearLeports',
    'nearCulture',
    'nearCourses',
  ]) {
    sectionCounts[id] = { visible: 0, visible_empty: 0, hidden: 0 };
  }
  sectionCounts.lodging = { main_visible: 0, branch_visible: 0, hidden_gating: 0 };

  const lodgingMainGatingBranchVisible = rows.filter(
    (r) =>
      r.lodging_main.startsWith('hidden|') &&
      r.lodging_main.includes('canShowMrtStayStrip_false') &&
      r.lodging_branch.startsWith('visible|'),
  );

  for (const r of rows) {
    if (r.lodging_branch.startsWith('visible|')) sectionCounts.lodging.branch_visible += 1;
    if (r.lodging_main.startsWith('visible|')) sectionCounts.lodging.main_visible += 1;
    if (r.lodging_branch.startsWith('hidden|') && !r.lodging_branch.includes('no_stay_location')) {
      sectionCounts.lodging.hidden_gating += 1;
    }
    for (const id of Object.keys(sectionCounts)) {
      if (id === 'lodging') continue;
      const cell = r[id];
      if (cell.startsWith('hidden|')) sectionCounts[id].hidden += 1;
      else if (cell.startsWith('visible_empty|')) sectionCounts[id].visible_empty += 1;
      else sectionCounts[id].visible += 1;
    }
  }

  const summary = `# Festival detail section scan

- Festivals: **${items.length}**
- LIVE nearby fetches: **${LIVE}** (throttle ${THROTTLE_MS}ms)
- Generated: ${new Date().toISOString()}

## Lodging strip (main legacy vs branch)

| | count |
| --- | --- |
| main (legacy 릉) strip visible | ${sectionCounts.lodging.main_visible} |
| branch strip visible | ${sectionCounts.lodging.branch_visible} |
| branch shell visible but strip hidden (gating) | ${sectionCounts.lodging.hidden_gating} |

## Section visibility (branch)

| section | visible (content) | visible empty shell | hidden shell |
| --- | --- | --- | --- |
| nearAttractions | ${sectionCounts.nearAttractions.visible} | ${sectionCounts.nearAttractions.visible_empty} | ${sectionCounts.nearAttractions.hidden} |
| packages | ${sectionCounts.packages.visible} | ${sectionCounts.packages.visible_empty} | ${sectionCounts.packages.hidden} |
| nearFood | ${sectionCounts.nearFood.visible} | ${sectionCounts.nearFood.visible_empty} | ${sectionCounts.nearFood.hidden} |
| nearLeports | ${sectionCounts.nearLeports.visible} | ${sectionCounts.nearLeports.visible_empty} | ${sectionCounts.nearLeports.hidden} |
| nearCulture | ${sectionCounts.nearCulture.visible} | ${sectionCounts.nearCulture.visible_empty} | ${sectionCounts.nearCulture.hidden} |
| nearCourses | ${sectionCounts.nearCourses.visible} | ${sectionCounts.nearCourses.visible_empty} | ${sectionCounts.nearCourses.hidden} |

## Lodging: main legacy strip hidden, branch visible

${lodgingMainGatingBranchVisible.length ? lodgingMainGatingBranchVisible.map((r) => `- ${r.contentId} ${r.title} · ${r.hubId} — ${r.lodging_main}`).join('\n') : '_none_'}

## Hidden by gating (branch, excluding no-data empty shells)

${hiddenGating.length ? hiddenGating.map((h) => `- ${h.contentId} ${h.title} · ${h.hubId} · **${h.section}** — ${h.reason}`).join('\n') : '_none_'}

Per-festival section cells (visible / \`visible_empty|reason\` / \`hidden|reason\`) including **lodging_main** vs **lodging_branch**: \`artifacts/festival-section-scan/scan.csv\`

Full CSV: \`artifacts/festival-section-scan/scan.csv\`
`;

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'scan.csv'), `${csv}\n`, 'utf8');
  writeFileSync(join(outDir, 'summary.md'), summary, 'utf8');

  return { items: items.length, rows, hiddenGating, sectionCounts, summary };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runFestivalDetailSectionScan()
    .then((r) => {
      console.log(r.summary);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
