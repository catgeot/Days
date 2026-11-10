import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EXPLORE_MONTHLY_PICK_DESKTOP_ROWS,
  resolveExploreMonthlyPickDesktopVariant,
  resolveExploreMonthlyPickLayoutBGridClass,
  resolveExploreMonthlyPickLayoutBVariant,
} from '../../src/pages/Home/components/SearchDiscovery/exploreMonthlyGridLayout.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const EXPECTED_ORDER = [
  'kyoto',
  'chiang-mai',
  'phu-quoc',
  'jeju',
  'dubai',
  'melbourne',
];

test('(a) xl desktop rows: row1 2+1, row2 1:1, row3 1+2 on six-column grid', () => {
  const layout = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/ExploreMonthlyPicksLayoutB.jsx'),
    'utf8',
  );
  const gridLayout = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/exploreMonthlyGridLayout.js'),
    'utf8',
  );
  const item = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/ExploreMonthlyPickItem.jsx'),
    'utf8',
  );
  assert.match(gridLayout, /grid-cols-6/);
  assert.match(gridLayout, /col-span-4/);
  assert.match(gridLayout, /col-span-2/);
  assert.match(gridLayout, /col-span-3/);
  assert.match(layout, /useExploreMonthlyPickDesktopLayout/);
  assert.match(item, /line-clamp-2/);
  const [row1, row2, row3] = EXPLORE_MONTHLY_PICK_DESKTOP_ROWS;
  assert.equal(row1[0].colClass, 'col-span-4');
  assert.equal(row1[1].colClass, 'col-span-2');
  assert.equal(row2[0].colClass, 'col-span-3');
  assert.equal(row2[1].colClass, 'col-span-3');
  assert.equal(row3[0].colClass, 'col-span-2');
  assert.equal(row3[1].colClass, 'col-span-4');
});

test('(b) sub-xl layout B: hero full, half tiles, index 3 or jeju full width', () => {
  assert.equal(resolveExploreMonthlyPickLayoutBGridClass(0, 'kyoto'), 'col-span-12');
  assert.equal(resolveExploreMonthlyPickLayoutBGridClass(1, 'chiang-mai'), 'col-span-6');
  assert.equal(resolveExploreMonthlyPickLayoutBGridClass(3, 'jeju'), 'col-span-12');
  assert.equal(resolveExploreMonthlyPickLayoutBGridClass(4, 'dubai'), 'col-span-6');
  assert.equal(resolveExploreMonthlyPickLayoutBVariant(0, 'kyoto'), 'hero');
  assert.equal(resolveExploreMonthlyPickLayoutBVariant(3, 'jeju'), 'wide');
});

test('(c–d) desktop slot variants: mirror tall vs mid vs wide', () => {
  assert.equal(resolveExploreMonthlyPickDesktopVariant(1), 'tall');
  assert.equal(resolveExploreMonthlyPickDesktopVariant(4), 'tall');
  assert.equal(resolveExploreMonthlyPickDesktopVariant(2), 'mid');
  assert.equal(resolveExploreMonthlyPickDesktopVariant(0), 'wide');
  const gridLayout = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/exploreMonthlyGridLayout.js'),
    'utf8',
  );
  const item = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/ExploreMonthlyPickItem.jsx'),
    'utf8',
  );
  assert.match(gridLayout, /items-stretch/);
  assert.match(item, /variant === 'tall'/);
  assert.match(item, /variant === 'mid'/);
  assert.match(item, /min-h-\[16rem\]/);
});

test('(e) xl title and summary use two-line clamp', () => {
  const item = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/ExploreMonthlyPickItem.jsx'),
    'utf8',
  );
  assert.match(item, /const clampClass = desktop \? 'line-clamp-2'/);
  assert.match(item, /\$\{clampClass\}/);
});

test('(f) preview row reuses same layout component', () => {
  const section = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/ExploreMonthlyPicksSection.jsx'),
    'utf8',
  );
  assert.match(section, /ExploreMonthlyPicksLayoutB/);
  assert.match(section, /explore-v2-monthly-preview-section/);
});

test('(g) desktop mapping follows array order 1–6 without jeju slot exception', () => {
  const flat = EXPLORE_MONTHLY_PICK_DESKTOP_ROWS.flat();
  assert.deepEqual(
    flat.map((s) => s.index),
    [0, 1, 2, 3, 4, 5],
  );
  assert.deepEqual(
    flat.map((_, i) => EXPECTED_ORDER[i]),
    EXPECTED_ORDER,
  );
  assert.equal(resolveExploreMonthlyPickDesktopVariant(3), 'mid');
  assert.notEqual(resolveExploreMonthlyPickDesktopVariant(3), 'wide');
});
