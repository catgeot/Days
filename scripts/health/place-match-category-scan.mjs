#!/usr/bin/env node
/**
 * placeMatchCategory name-regex false-positive scan (시·군·구 + festival titles).
 *
 *   node scripts/health/place-match-category-scan.mjs
 *   node scripts/health/place-match-category-scan.mjs --markdown
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectKoAdminLocalityNames,
  inferPlaceMatchCategory,
  inferPlaceMatchCategoryFromNameOnly,
  inferPlaceMatchCategoryLegacy,
} from '../../src/pages/Home/lib/placeMatchCategory.js';
import { resolveFestivalThemeCrossLinks } from '../../src/pages/Home/lib/koreaThemeCrossLinks.js';
import { canShowMrtStayStrip } from '../../src/utils/mrtStayQuery.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

function loadSigunguSupplement() {
  try {
    const raw = readFileSync(join(__dirname, '../data/ko-sigungu-admin-names.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.names) ? parsed.names : [];
  } catch {
    return [];
  }
}

function categoryLabel(cat) {
  if (!cat) return '';
  return cat;
}

function scanNames(names, { legacy = false } = {}) {
  const hits = [];
  for (const name of names) {
    const cat = inferPlaceMatchCategoryFromNameOnly(name, { legacy });
    if (cat) hits.push({ name, category: cat });
  }
  return hits;
}

async function loadFestivalItems() {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (url && anon) {
    const cacheUrl =
      `${url}/rest/v1/tourapi_festival_cache` +
      '?select=payload' +
      '&cache_key=like.list:ko:rolling12*' +
      '&order=fetched_at.desc' +
      '&limit=1';
    try {
      const res = await fetch(cacheUrl, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      });
      if (res.ok) {
        const rows = await res.json();
        const items = rows?.[0]?.payload?.items;
        if (Array.isArray(items) && items.length) return items;
      }
    } catch {
      /* optional LIVE */
    }
  }
  return [
    {
      contentId: '2930716',
      title: '강릉 국수 축제',
      addr1: '강원특별자치도 강릉시',
      mapx: '128.876',
      mapy: '37.751',
      areaCode: '32',
    },
    {
      contentId: '825295',
      title: '강릉커피축제',
      addr1: '강원특별자치도 강릉시',
      mapx: '128.876',
      mapy: '37.751',
      areaCode: '32',
    },
    {
      contentId: '4116994',
      title: 'K-Drone Festival',
      addr1: '강원특별자치도 강릉시',
      mapx: '128.876',
      mapy: '37.751',
      areaCode: '32',
    },
    {
      contentId: '790124',
      title: '홍천 인삼한우 명품축제',
      addr1: '강원특별자치도 홍천군',
      mapx: '127.88',
      mapy: '37.69',
      areaCode: '32',
    },
  ];
}

function scanFestivalStayLocations(items, { legacy = false } = {}) {
  const hits = [];
  for (const item of items) {
    const areaCode = String(item?.areaCode || item?.areacode || '').trim() || undefined;
    const cross = resolveFestivalThemeCrossLinks(item, { areaCode });
    const loc = cross?.stay?.location;
    if (!loc) continue;
    const cat = legacy ? inferPlaceMatchCategoryLegacy(loc) : inferPlaceMatchCategory(loc);
    const canShow = canShowMrtStayStrip(loc, {
      legacyCategoryInference: legacy,
    });
    if (cat || !canShow) {
      hits.push({
        name: `${item.contentId}: ${item.title}`,
        category: cat,
        canShowMrtStayStrip: canShow,
        hub: loc.slug,
      });
    }
  }
  return hits;
}

export function scanPlaceMatchCategoryFalsePositives() {
  const supplement = loadSigunguSupplement();
  const localities = collectKoAdminLocalityNames(supplement);
  return {
    localityCount: localities.length,
    localityBefore: scanNames(localities, { legacy: true }),
    localityAfter: scanNames(localities, { legacy: false }),
    festivalTitles: [],
    festivalBefore: [],
    festivalAfter: [],
  };
}

export async function scanPlaceMatchCategoryFalsePositivesAsync() {
  const base = scanPlaceMatchCategoryFalsePositives();
  const festivalItems = await loadFestivalItems();
  return {
    ...base,
    festivalCount: festivalItems.length,
    festivalBefore: scanFestivalStayLocations(festivalItems, { legacy: true }),
    festivalAfter: scanFestivalStayLocations(festivalItems, { legacy: false }),
  };
}

function diffTable(before, after) {
  const beforeMap = new Map(before.map((r) => [r.name, r.category]));
  const afterMap = new Map(after.map((r) => [r.name, r.category]));
  const names = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const rows = [];
  for (const name of [...names].sort((a, b) => a.localeCompare(b, 'ko'))) {
    const b = beforeMap.get(name) || '';
    const a = afterMap.get(name) || '';
    if (b || a) rows.push({ name, before: b, after: a });
  }
  return rows;
}

function printMarkdown(report) {
  const locRows = diffTable(report.localityBefore, report.localityAfter);
  console.log('# placeMatchCategory false-positive scan\n');
  console.log(`- Locality labels scanned: **${report.localityCount}**`);
  console.log(`- Festivals scanned (stay location): **${report.festivalCount}**\n`);
  console.log('## 시·군·구 / hub locality labels\n');
  console.log('| name | before | after |');
  console.log('| --- | --- | --- |');
  for (const r of locRows) {
    console.log(`| ${r.name} | ${r.before || '—'} | ${r.after || '—'} |`);
  }
  console.log('\n## Festival stay locations (category / canShow)\n');
  console.log('| festival | before category | after category | before canShow | after canShow |');
  console.log('| --- | --- | --- | --- | --- |');
  const festMap = new Map();
  for (const r of report.festivalBefore) {
    festMap.set(r.name, { ...festMap.get(r.name), before: r.category, beforeShow: r.canShowMrtStayStrip });
  }
  for (const r of report.festivalAfter) {
    festMap.set(r.name, { ...festMap.get(r.name), after: r.category, afterShow: r.canShowMrtStayStrip });
  }
  for (const [name, row] of [...festMap.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ko'))) {
    console.log(
      `| ${name} | ${row.before || '—'} | ${row.after || '—'} | ${row.beforeShow ?? '—'} | ${row.afterShow ?? '—'} |`,
    );
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const markdown = process.argv.includes('--markdown');
  scanPlaceMatchCategoryFalsePositivesAsync().then((report) => {
    if (markdown) {
      printMarkdown(report);
      return;
    }
    console.log(JSON.stringify(report, null, 2));
  });
}
