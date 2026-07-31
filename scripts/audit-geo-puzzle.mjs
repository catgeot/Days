#!/usr/bin/env node
/**
 * 범지구적 퍼즐 SSOT audit — 카탈로그 커버리지 · 중복 · 캠페인 정렬
 */
import {
  GEO_PUZZLE_CONTINENTS,
  getCampaignContinents,
  listContinentCountryIds,
} from '../src/pages/PlayGeo/data/geoPuzzleTree.js';
import { GEO_PUZZLE_SILHOUETTES } from '../src/pages/PlayGeo/data/geoPuzzleSilhouettes.js';
import { GEO_PUZZLE_COUNTRY_POLYGONS } from '../src/pages/PlayGeo/data/geoPuzzleCountryPolygons.js';
import { GLOBE_COUNTRY_CATALOG } from '../src/pages/Home/lib/globeCountryCatalog.js';
import { pointInBbox } from '../src/pages/PlayGeo/lib/geoPuzzleHitTest.js';

let fails = 0;
function fail(msg) {
  fails += 1;
  console.error(`FAIL ${msg}`);
}
function ok(msg) {
  console.log(`OK   ${msg}`);
}

const allIds = [];
const seen = new Set();
for (const continent of GEO_PUZZLE_CONTINENTS) {
  const ids = listContinentCountryIds(continent);
  if (!ids.length) fail(`continent ${continent.id} has 0 countries`);
  for (const id of ids) {
    if (seen.has(id)) fail(`duplicate countryId ${id}`);
    seen.add(id);
    allIds.push(id);
    if (!GLOBE_COUNTRY_CATALOG[id]) fail(`missing catalog ${id}`);
    const c = GLOBE_COUNTRY_CATALOG[id];
    if (!c?.iso) fail(`no iso ${id}`);
    if (!Array.isArray(c?.bbox) || c.bbox.length < 4) fail(`no bbox ${id}`);
    else if (!pointInBbox(c.lng, c.lat, c.bbox)) fail(`centroid outside bbox ${id}`);
    const sil = GEO_PUZZLE_SILHOUETTES[id];
    if (!sil?.d || !sil?.viewBox) fail(`missing silhouette ${id}`);
    const poly = GEO_PUZZLE_COUNTRY_POLYGONS[id];
    if (!poly?.type || !poly?.coordinates) fail(`missing polygon ${id}`);
    else if (poly.type !== 'Polygon' && poly.type !== 'MultiPolygon') {
      fail(`bad polygon type ${id}:${poly.type}`);
    }
  }
}

const campaign = getCampaignContinents();
const counts = campaign.map((c) => listContinentCountryIds(c).length);
for (let i = 1; i < counts.length; i += 1) {
  if (counts[i] < counts[i - 1]) fail(`campaign not ascending by count: ${counts.join(',')}`);
}
ok(`countries ${allIds.length} · continents ${GEO_PUZZLE_CONTINENTS.length}`);
ok(`silhouettes ${Object.keys(GEO_PUZZLE_SILHOUETTES).length}`);
ok(`polygons ${Object.keys(GEO_PUZZLE_COUNTRY_POLYGONS).length}`);
ok(`campaign order ${campaign.map((c, i) => `${c.labelKo}(${counts[i]})`).join(' → ')}`);

if (fails) {
  console.error(`\naudit:geo-puzzle FAIL (${fails})`);
  process.exit(1);
}
console.log('\naudit:geo-puzzle PASS');
