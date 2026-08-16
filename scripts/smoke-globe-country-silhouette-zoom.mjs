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
  resolveSilhouetteViewport,
  GLOBE_FACE_REGION_MAX_ZOOM,
  GLOBE_FACE_REGION_CAMERA_PADDING_MOBILE,
  GLOBE_FACE_REGION_CAMERA_PADDING_DESKTOP,
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

{
  const vpMobile = { width: 390, height: 844 };
  const kr = getGlobeCountryById('kr');
  const withoutPad = resolveFaceRegionCameraBounds(kr, vpMobile);
  const withPad = resolveFaceRegionCameraBounds(kr, vpMobile, GLOBE_FACE_REGION_CAMERA_PADDING_MOBILE);
  assert(
    withPad.maxZoom < withoutPad.maxZoom,
    `mobile KR maxZoom ${withPad.maxZoom} < unpadded ${withoutPad.maxZoom}`,
  );
  assert(
    withPad.maxZoom <= 4.8,
    `mobile KR padded maxZoom ${withPad.maxZoom} keeps peninsula silhouette visible`,
  );
}

{
  const vpMobile = { width: 390, height: 844 };
  const jp = getGlobeCountryById('jp');
  const { maxZoom } = resolveFaceRegionCameraBounds(jp, vpMobile, GLOBE_FACE_REGION_CAMERA_PADDING_MOBILE);
  assert(maxZoom <= 4.5, `mobile JP padded maxZoom ${maxZoom} fits archipelago silhouette`);
}

{
  const eff = resolveSilhouetteViewport(
    { width: 390, height: 844 },
    GLOBE_FACE_REGION_CAMERA_PADDING_MOBILE,
  );
  assert(eff.width === 250 && eff.height === 564, 'resolveSilhouetteViewport subtracts mobile padding');
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}

console.log('\nAll silhouette zoom checks passed');
