#!/usr/bin/env node
/**
 * 홈 지구본 첫 로딩 지명 — 자전 hold · overlay reveal 회귀.
 * 네트워크 없음. Usage: node scripts/smoke-globe-label-first-reveal.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const {
    GLOBE_LABEL_PLACEMENT_SETTLE_MS,
    GLOBE_LABEL_FIRST_HOLD_MAX_MS,
    GLOBE_LABEL_APPLY_PUMP_MS,
    shouldHoldGlobeAutoRotate,
    shouldMarkGlobeLabelsSettled,
    shouldRetryBasemapLabelApply,
    hasPaintedBasemapContextLabels,
    shouldRetryOverlayRevealAfterRotatePause,
  } = await load('src/pages/Home/lib/globeLabelFirstReveal.js');

  assert(GLOBE_LABEL_PLACEMENT_SETTLE_MS >= 200, 'settle window too short for Mapbox placement');
  assert(GLOBE_LABEL_PLACEMENT_SETTLE_MS <= 800, 'settle window too long (globe freeze)');
  assert(GLOBE_LABEL_FIRST_HOLD_MAX_MS >= 1000, 'Safari CJK glyphs need >1s hold');
  assert(GLOBE_LABEL_FIRST_HOLD_MAX_MS <= 2500, 'first-load hold too long (globe freeze)');
  assert(Array.isArray(GLOBE_LABEL_APPLY_PUMP_MS) && GLOBE_LABEL_APPLY_PUMP_MS.length >= 4, 'need label apply pumps');
  assert(GLOBE_LABEL_APPLY_PUMP_MS[0] === 0, 'first pump must be immediate');

  assert(
    shouldHoldGlobeAutoRotate({ pauseRender: false, labelsSettled: false }) === true,
    'hold rotate until first labels settle',
  );
  assert(
    shouldHoldGlobeAutoRotate({ pauseRender: false, labelsSettled: true }) === false,
    'resume rotate after labels settle',
  );
  assert(
    shouldHoldGlobeAutoRotate({ pauseRender: true, labelsSettled: true }) === true,
    'pauseRender still holds rotate',
  );

  assert(
    shouldMarkGlobeLabelsSettled({ overlayRevealed: true, basemapLabelsApplied: false }) === false,
    'overlay setData is not enough — wait for basemap text-field',
  );
  assert(
    shouldMarkGlobeLabelsSettled({ overlayRevealed: true, basemapLabelsApplied: true }) === true,
    'settle after overlay + basemap apply',
  );

  assert(
    shouldRetryBasemapLabelApply({ appliedCount: 0, contextLayerCount: 0, isStyleLoaded: true }) === true,
    'retry when context layers not catalogued yet',
  );
  assert(
    shouldRetryBasemapLabelApply({ appliedCount: 3, contextLayerCount: 3, isStyleLoaded: true }) === false,
    'stop retry after text-field applied',
  );

  assert(hasPaintedBasemapContextLabels([]) === false, 'empty query is unpainted');
  assert(hasPaintedBasemapContextLabels([{}]) === true, 'any rendered symbol counts');

  assert(
    shouldRetryOverlayRevealAfterRotatePause({
      cameraAnimating: false,
      globeCameraBusy: false,
      isMoving: true,
    }) === true,
    'isMoving without flyTo should pause+retry overlay reveal',
  );
  assert(
    shouldRetryOverlayRevealAfterRotatePause({
      cameraAnimating: false,
      globeCameraBusy: false,
      isMoving: true,
    }) === true,
    'Safari globe init isMoving without autoRotate must still retry',
  );
  assert(
    shouldRetryOverlayRevealAfterRotatePause({
      cameraAnimating: true,
      globeCameraBusy: false,
      isMoving: true,
    }) === false,
    'flyTo/easeTo must not retry overlay reveal via rotate pause',
  );
  assert(
    shouldRetryOverlayRevealAfterRotatePause({
      cameraAnimating: false,
      globeCameraBusy: true,
      isMoving: true,
    }) === false,
    'marked camera-busy must not retry overlay reveal via rotate pause',
  );

  const globeSrc = readFileSync(
    join(root, 'src/pages/Home/components/HomeGlobeMapbox.jsx'),
    'utf8',
  );
  assert(
    !globeSrc.includes('const autoRotateRef = useRef(!pauseRender)'),
    'autoRotate must not start true on mount (starves first label placement)',
  );
  assert(
    globeSrc.includes('shouldHoldGlobeAutoRotate'),
    'HomeGlobeMapbox must gate auto-rotate with shouldHoldGlobeAutoRotate',
  );
  assert(
    globeSrc.includes('armAutoRotateAfterLabelSettle'),
    'HomeGlobeMapbox must arm rotate only after overlay reveal',
  );
  assert(
    globeSrc.includes('beginFirstLabelSettle'),
    'HomeGlobeMapbox must pump basemap labels before first rotate',
  );
  assert(
    globeSrc.includes('applyFirstLoadBasemapLabels'),
    'first load must reuse EN-toggle text-field apply',
  );
  assert(
    globeSrc.includes('[locale, globeTheme, applySatelliteBasemapLabels, mapReady]'),
    'locale effect must wait for mapReady (Safari first mount mapRef is null)',
  );
  assert(
    globeSrc.includes('updateGateoMarkerSource(map, markerGeoJSONRef.current)'),
    'first overlay reveal must flush gateo GeoJSON (schedule stuck while rotating)',
  );
  assert(
    globeSrc.includes('applyPlaceLabelVisibility({ force: true })'),
    'first load must apply context visibility even if Safari isMoving sticks',
  );

  console.log('smoke-globe-label-first-reveal: PASS');
}

main().catch((err) => {
  console.error('smoke-globe-label-first-reveal: FAIL', err);
  process.exit(1);
});
