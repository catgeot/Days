#!/usr/bin/env node
/**
 * 블로그 AI 큐레이션 → 홈/장소카드 브리지 회귀.
 * Usage: node scripts/smoke-curation-place-bridge.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const store = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => {
    store.set(k, String(v));
  },
  removeItem: (k) => {
    store.delete(k);
  },
};

const {
  hasValidCurationCoords,
  hydrateLocationFromCuration,
  queueCurationHomeOpen,
  consumeCurationHomeOpen,
  buildCurationHomeNavigateState,
  resolveCurationHomeHandoff,
  scheduleCurationHomeHandoffApply,
  isCurationHomeHandoffApplyScheduled,
  cancelCurationHomeHandoffApply,
  clearCurationPendingHomeSession,
  CURATION_PENDING_HOME_KEY,
} = await import(pathToFileURL(join(root, 'src/pages/Home/lib/curationPlaceBridge.js')).href);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL ${msg}`);
    failed += 1;
  } else {
    console.log(`PASS ${msg}`);
  }
}

assert(!hasValidCurationCoords({ lat: 0, lng: 0 }), 'reject 0,0');
assert(!hasValidCurationCoords({ lat: NaN, lng: 10 }), 'reject NaN');
assert(!hasValidCurationCoords(null), 'reject null');
assert(hasValidCurationCoords({ lat: -18.85, lng: -159.78 }), 'accept Aitutaki-ish');

const uiPlace = hydrateLocationFromCuration({
  location: '가상낙원테스트',
  locationEn: 'Virtual Paradise Test, Nowhere',
  title: '테스트',
  description: '설명',
  lat: -18.85,
  lng: -159.78,
  country: '쿡 제도',
  country_en: 'Cook Islands',
});
assert(uiPlace?.uiPlace === true, 'uiPlace when not in SSOT');
assert(uiPlace?.name === '가상낙원테스트', 'uiPlace keeps KO name');
assert(hasValidCurationCoords(uiPlace), 'uiPlace coords valid');

const noCoords = hydrateLocationFromCuration({
  location: '좌표없는곳',
  locationEn: 'No Coords Place',
  title: 'x',
  description: 'y',
});
assert(noCoords === null, 'null without coords and no catalog');

const bali = hydrateLocationFromCuration({
  location: '발리',
  locationEn: 'Bali, Indonesia',
  title: '발리 테스트',
  description: '카탈로그 매칭',
});
assert(bali?.slug === 'bali', 'SSOT slug bali');
assert(bali?.uiPlace !== true, 'catalog spot not forced uiPlace');
assert(hasValidCurationCoords(bali), 'catalog coords');

store.clear();
assert(queueCurationHomeOpen(uiPlace, { openMooni: true }) === true, 'queue ok');
assert(store.has(CURATION_PENDING_HOME_KEY), 'session key set');
const pending = consumeCurationHomeOpen();
assert(pending?.openMooni === true, 'consume openMooni');
assert(pending?.location?.name === '가상낙원테스트', 'consume location');
assert(consumeCurationHomeOpen() === null, 'second consume empty');

store.clear();
queueCurationHomeOpen(uiPlace, { openMooni: false });
const staleRaw = JSON.parse(store.get(CURATION_PENDING_HOME_KEY));
staleRaw.at = Date.now() - 999999;
store.set(CURATION_PENDING_HOME_KEY, JSON.stringify(staleRaw));
assert(consumeCurationHomeOpen({ maxAgeMs: 1000 }) === null, 'expire stale handoff');

const navState = buildCurationHomeNavigateState(uiPlace, { openMooni: true });
const routeResolved = resolveCurationHomeHandoff(navState);
assert(routeResolved?.source === 'route-state', 'route-state handoff');
assert(routeResolved?.openMooni === true, 'route openMooni');
assert(routeResolved?.location?.name === '가상낙원테스트', 'route location name');
assert(consumeCurationHomeOpen() === null, 'route handoff does not require session consume');

cancelCurationHomeHandoffApply();
let applyRuns = 0;
const applyAt = Date.now();
assert(
  scheduleCurationHomeHandoffApply(applyAt, 15, () => {
    applyRuns += 1;
  }) === true,
  'schedule apply',
);
assert(isCurationHomeHandoffApplyScheduled(applyAt), 'apply scheduled');
assert(
  scheduleCurationHomeHandoffApply(applyAt, 15, () => {
    applyRuns += 1;
  }) === false,
  'dedup apply schedule',
);
await new Promise((resolve) => setTimeout(resolve, 30));
assert(applyRuns === 1, 'apply runs once');
assert(!isCurationHomeHandoffApplyScheduled(applyAt), 'apply cleared after run');

store.clear();
queueCurationHomeOpen(uiPlace, { openMooni: true });
clearCurationPendingHomeSession();
assert(consumeCurationHomeOpen() === null, 'clear pending session');

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nOK smoke-curation-place-bridge');
