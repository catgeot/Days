/**
 * 테마여행 모듈 SSOT → koreaThemeModules.json
 *
 *   npm run generate:korea-theme-modules
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KOREA_THEME_MODULE_OVERRIDES } from './data/korea-theme-modules-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/koreaThemeModules.json');

const ALLOWED_IDS = new Set([
  'festivals',
  'top10',
  'scenic',
  'courses',
  'regions',
  'packages',
]);
const ALLOWED_ICONS = new Set([
  'calendar',
  'mountain',
  'landmark',
  'route',
  'map',
  'package',
]);

/** @param {typeof KOREA_THEME_MODULE_OVERRIDES} src */
function normalizeModules(src) {
  if (!src || typeof src !== 'object') {
    throw new Error('[korea-theme-modules] overrides must be object');
  }
  const list = src.modules;
  if (!Array.isArray(list) || list.length < 1) {
    throw new Error('[korea-theme-modules] modules non-empty array required');
  }

  const seenIds = new Set();
  const seenOrders = new Set();
  const modules = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('[korea-theme-modules] module entry must be object');
    }
    const id = String(raw.id || '').trim();
    if (!ALLOWED_IDS.has(id)) {
      throw new Error(`[korea-theme-modules] unknown id: ${raw.id}`);
    }
    if (seenIds.has(id)) {
      throw new Error(`[korea-theme-modules] duplicate id: ${id}`);
    }
    seenIds.add(id);

    const label = String(raw.label || '').trim();
    if (!label || label.length > 40) {
      throw new Error(`[korea-theme-modules] ${id}: label required (1–40)`);
    }
    const blurb = String(raw.blurb || '').trim();
    if (!blurb || blurb.length > 80) {
      throw new Error(`[korea-theme-modules] ${id}: blurb required (1–80)`);
    }

    const order = Number(raw.order);
    if (!Number.isFinite(order) || !Number.isInteger(order) || order < 1) {
      throw new Error(`[korea-theme-modules] ${id}: order must be positive integer`);
    }
    if (seenOrders.has(order)) {
      throw new Error(`[korea-theme-modules] duplicate order: ${order}`);
    }
    seenOrders.add(order);

    const enabled = raw.enabled !== false;
    const path = String(raw.path || '').trim();
    const expectedPath = id === 'festivals' ? '/korea' : `/korea/theme/${id}`;
    if (path !== expectedPath) {
      throw new Error(`[korea-theme-modules] ${id}: path must be ${expectedPath}`);
    }

    const icon = String(raw.icon || '').trim();
    if (!ALLOWED_ICONS.has(icon)) {
      throw new Error(`[korea-theme-modules] ${id}: unknown icon ${raw.icon}`);
    }

    modules.push({ id, label, blurb, order, enabled, path, icon });
  }

  for (const required of ALLOWED_IDS) {
    if (!seenIds.has(required)) {
      throw new Error(`[korea-theme-modules] missing required id: ${required}`);
    }
  }

  modules.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return modules;
}

function main() {
  const modules = normalizeModules(KOREA_THEME_MODULE_OVERRIDES);
  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      moduleCount: modules.length,
      source: 'scripts/data/korea-theme-modules-overrides.mjs',
    },
    modules,
  };
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `[korea-theme-modules] wrote ${modules.length} modules → ${OUTPUT_PATH}`,
  );
}

main();
