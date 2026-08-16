#!/usr/bin/env node
/**
 * 나라 칩 포커스 — 실루엣(전체 윤곽) 줌 정책.
 * Usage: node scripts/smoke-globe-country-silhouette-zoom.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

const {
  expandBboxForSilhouette,
  resolveSilhouetteMaxZoom,
  resolveFaceRegionCameraBounds,
  GLOBE_FACE_REGION_MAX_ZOOM,
} = await load('src/pages/Home/lib/globeFaceRegions.js');
const { getGlobeCountryById } = await load('src/pages/Home/lib/globeCountryCatalog.js');

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`OK: ${msg}`);
  }
}

const viewport = { width: 1200, height: 800 };

{
  const kr = getGlobeCountryById('kr');
  const { bounds, maxZoom } = resolveFaceRegionCameraBounds(kr, viewport);
  assert(bounds && bounds !== kr.bbox, 'KR bounds expanded for silhouette margin');
  assert(maxZoom < GLOBE_FACE_REGION_MAX_ZOOM, `KR maxZoom ${maxZoom} < legacy cap ${GLOBE_FACE_REGION_MAX_ZOOM}`);
  assert(maxZoom <= 5.4, `KR maxZoom ${maxZoom} keeps peninsula outline visible`);
}

{
  const jp = getGlobeCountryById('jp');
  const { maxZoom } = resolveFaceRegionCameraBounds(jp, viewport);
  assert(maxZoom <= 4.8, `JP maxZoom ${maxZoom} fits archipelago silhouette`);
}

{
  const ru = getGlobeCountryById('ru');
  const { bounds, maxZoom, usedHub } = resolveFaceRegionCameraBounds(ru, viewport);
  assert(usedHub, 'RU uses hubBbox');
  assert(maxZoom <= 3.8, `RU maxZoom ${maxZoom} for continental span`);
  assert(bounds[0] < ru.hubBbox[0], 'RU hub bounds expanded west');
}

{
  const sg = getGlobeCountryById('sg');
  const maxZoom = resolveSilhouetteMaxZoom(sg.bbox, viewport);
  assert(maxZoom <= GLOBE_FACE_REGION_MAX_ZOOM, 'SG tiny state capped at global max');
  assert(maxZoom >= 5, `SG maxZoom ${maxZoom} still readable`);
}

{
  const expanded = expandBboxForSilhouette([0, 0, 10, 10], 0.2);
  assert(expanded[0] === -2 && expanded[2] === 12, 'expandBboxForSilhouette 20% margin');
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}

console.log('\nAll silhouette zoom checks passed');
