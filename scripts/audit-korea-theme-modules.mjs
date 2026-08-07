/**
 * 테마여행 모듈 SSOT audit — schema / path / order.
 *
 *   npm run audit:korea-theme-modules
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/koreaThemeModules.json');

const REQUIRED_IDS = [
  'festivals',
  'top10',
  'scenic',
  'courses',
  'regions',
  'packages',
];
const ALLOWED_ICONS = new Set([
  'calendar',
  'mountain',
  'landmark',
  'route',
  'map',
  'package',
]);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const modules = data.modules || [];

  assert(data.meta?.version === 1, 'meta.version === 1');
  assert(Array.isArray(modules), 'modules is array');
  assert(modules.length === REQUIRED_IDS.length, `moduleCount === ${REQUIRED_IDS.length}`);

  const byId = new Map();
  const orders = new Set();
  let prevOrder = -Infinity;

  for (const mod of modules) {
    const id = String(mod?.id || '');
    assert(REQUIRED_IDS.includes(id), `known id: ${id || '(empty)'}`);
    assert(!byId.has(id), `unique id: ${id}`);
    byId.set(id, mod);

    const label = String(mod?.label || '').trim();
    assert(Boolean(label) && label.length <= 40, `${id}: label`);
    const blurb = String(mod?.blurb || '').trim();
    assert(Boolean(blurb) && blurb.length <= 80, `${id}: blurb`);

    const order = Number(mod?.order);
    assert(Number.isInteger(order) && order >= 1, `${id}: order integer ≥1`);
    assert(!orders.has(order), `${id}: unique order ${order}`);
    orders.add(order);
    assert(order >= prevOrder, `${id}: sorted by order (got ${order} after ${prevOrder})`);
    prevOrder = order;

    assert(typeof mod?.enabled === 'boolean', `${id}: enabled boolean`);
    assert(ALLOWED_ICONS.has(String(mod?.icon || '')), `${id}: icon`);

    const path = String(mod?.path || '');
    const expected = id === 'festivals' ? '/korea' : `/korea/theme/${id}`;
    assert(path === expected, `${id}: path === ${expected}`);
  }

  for (const id of REQUIRED_IDS) {
    assert(byId.has(id), `required module present: ${id}`);
  }

  const festivals = byId.get('festivals');
  assert(festivals?.path === '/korea', 'festivals → /korea');
  assert(festivals?.enabled === true, 'festivals enabled');

  if (failed) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log(`\nkorea-theme-modules audit PASS — ${modules.length} modules`);
}

main();
