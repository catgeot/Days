import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { resolveLogbookPublicDashboardSubtitle } from '../../src/pages/DailyReport/logbookPublicDashboardSubtitle.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const koJson = join(root, 'src/i18n/locales/ko.json');
const enJson = join(root, 'src/i18n/locales/en.json');

const TEMPLATES = {
  'logbook.dashboard.syncing': '…syncing…',
  'logbook.dashboard.countPublicFiltered': "'{{location}}' {{count}}",
  'logbook.dashboard.countPublicCombined':
    'TOTAL={{total}} TRAV={{travelogues}} REV={{reviews}}',
  'logbook.dashboard.countPublic': 'LEGACY={{count}}',
};

function mockT(key, opts = {}) {
  let out = TEMPLATES[key] ?? key;
  for (const [k, v] of Object.entries(opts)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

const baseReady = {
  reportsLoading: false,
  travelogueCount: 3,
  reviewHubEnabled: true,
  reviewsLoading: false,
  reviewsLoadFailed: false,
  reviewCount: 7,
  locationFilter: null,
  filteredTravelogueCount: 0,
};

test('combined subtitle sums travelogues and reviews from inputs', () => {
  const message = resolveLogbookPublicDashboardSubtitle({
    ...baseReady,
    travelogueCount: 12,
    reviewCount: 34,
    t: mockT,
  });
  assert.equal(message, 'TOTAL=46 TRAV=12 REV=34');
  assert.doesNotMatch(message, /\b41\b|\b117\b|\b158\b/);
});

test('while reviews are loading, use legacy public count (no premature total)', () => {
  const message = resolveLogbookPublicDashboardSubtitle({
    ...baseReady,
    travelogueCount: 12,
    reviewsLoading: true,
    reviewCount: 0,
    t: mockT,
  });
  assert.equal(message, 'LEGACY=12');
  assert.doesNotMatch(message, /TOTAL=/);
});

test('while reports are syncing, show syncing copy', () => {
  const message = resolveLogbookPublicDashboardSubtitle({
    ...baseReady,
    reportsLoading: true,
    t: mockT,
  });
  assert.equal(message, '…syncing…');
});

test('i18n templates use interpolation tokens, not production literals', () => {
  const ko = readFileSync(koJson, 'utf8');
  const en = readFileSync(enJson, 'utf8');
  assert.match(ko, /countPublicCombined/);
  assert.match(en, /countPublicCombined/);
  assert.match(ko, /\{\{total\}\}.*\{\{travelogues\}\}.*\{\{reviews\}\}/);
  assert.match(en, /\{\{total\}\}.*\{\{travelogues\}\}.*\{\{reviews\}\}/);
  for (const blob of [ko, en]) {
    assert.doesNotMatch(blob, /"41"|"117"|"158"/);
  }
});

test('Dashboard wires subtitle helper and review hub hook', () => {
  const dash = readFileSync(
    join(root, 'src/pages/DailyReport/Dashboard.jsx'),
    'utf8',
  );
  assert.match(dash, /resolveLogbookPublicDashboardSubtitle/);
  assert.match(dash, /useLogbookOfficialReviewHub/);
  assert.doesNotMatch(dash, /\b41\b|\b117\b|\b158\b/);
});