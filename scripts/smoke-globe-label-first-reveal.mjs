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
    shouldHoldGlobeAutoRotate,
    shouldRetryOverlayRevealAfterRotatePause,
  } = await load('src/pages/Home/lib/globeLabelFirstReveal.js');

  assert(GLOBE_LABEL_PLACEMENT_SETTLE_MS >= 200, 'settle window too short for Mapbox placement');
  assert(GLOBE_LABEL_PLACEMENT_SETTLE_MS <= 800, 'settle window too long (globe freeze)');

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
    shouldRetryOverlayRevealAfterRotatePause({
      cameraAnimating: false,
      globeCameraBusy: false,
      isMoving: true,
      autoRotate: true,
    }) === true,
    'auto-rotate jumpTo should pause+retry overlay reveal',
  );
  assert(
    shouldRetryOverlayRevealAfterRotatePause({
      cameraAnimating: true,
      globeCameraBusy: false,
      isMoving: true,
      autoRotate: true,
    }) === false,
    'flyTo/easeTo must not retry overlay reveal via rotate pause',
  );
  assert(
    shouldRetryOverlayRevealAfterRotatePause({
      cameraAnimating: false,
      globeCameraBusy: true,
      isMoving: true,
      autoRotate: true,
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
    globeSrc.includes('updateGateoMarkerSource(map, markerGeoJSONRef.current)'),
    'first overlay reveal must flush gateo GeoJSON (schedule stuck while rotating)',
  );

  console.log('smoke-globe-label-first-reveal: PASS');
}

main().catch((err) => {
  console.error('smoke-globe-label-first-reveal: FAIL', err);
  process.exit(1);
});
