import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  toolkitSectionFreshnessBand,
  resolveToolkitSectionCheckedIso,
  formatToolkitCheckedBadgeDate,
  summarizeToolkitFreshness,
  maxAgeDaysForToolkitSection,
} from '../../src/data/toolkitFreshness/policy.js';
import { isGateoToolkitFreshnessEnabled, GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';
import { submitToolkitReport } from '../../src/utils/submitToolkitReport.js';
import { fetchToolkitSectionMetaMap } from '../../src/utils/fetchToolkitSectionMeta.js';

test('toolkit section volatility windows', () => {
  assert.equal(maxAgeDaysForToolkitSection('visa'), 30);
  assert.equal(maxAgeDaysForToolkitSection('flight'), 60);
  assert.equal(maxAgeDaysForToolkitSection('pre_travel'), 180);
});

test('freshness band uses checked_at meta then toolkit_updated_at fallback', () => {
  const checked = resolveToolkitSectionCheckedIso('visa', null, '2026-09-01T00:00:00Z');
  assert.equal(checked, '2026-09-01');
  assert.equal(toolkitSectionFreshnessBand('visa', checked, '2026-10-25'), 'overdue');
  assert.equal(toolkitSectionFreshnessBand('visa', '2026-10-20', '2026-10-25'), 'fresh');
  assert.equal(toolkitSectionFreshnessBand('visa', '2026-08-20', '2026-10-25'), 'critical');
});

test('badge date formatting ko/en', () => {
  assert.equal(formatToolkitCheckedBadgeDate('2026-10-12', 'ko'), '2026.10.12');
  assert.equal(formatToolkitCheckedBadgeDate('2026-10-12', 'en'), '10/12/2026');
});

test('summarize flags overdue sections', () => {
  const summary = summarizeToolkitFreshness(
    { visa: { checked_at: '2026-08-01' } },
    '2026-08-01',
    '2026-10-25',
  );
  assert.equal(summary.showBanner, true);
  assert.equal(summary.hasOverdue, true);
});

test('VITE_GATEO_TOOLKIT_FRESHNESS defaults off in test harness', () => {
  const key = GATEO_ENV_FLAG_NAMES.TOOLKIT_FRESHNESS;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = '';
  assert.equal(isGateoToolkitFreshnessEnabled(), false);
  globalThis.__VITE_ENV__[key] = '1';
  assert.equal(isGateoToolkitFreshnessEnabled(), true);
  globalThis.__VITE_ENV__[key] = prev;
});

test('submitToolkitReport honeypot short-circuits', async () => {
  const result = await submitToolkitReport(
    { from: () => ({ insert: () => Promise.resolve({ error: null }) }) },
    { placeId: 'x', section: 'visa', note: 'n', honeypot: 'bot' },
  );
  assert.equal(result.ok, true);
  assert.equal(result.skipped, true);
});

test('fetchToolkitSectionMetaMap does not call supabase without place_id', async () => {
  let calls = 0;
  const supabase = {
    from() {
      calls += 1;
      return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
    },
  };
  assert.deepEqual(await fetchToolkitSectionMetaMap(supabase, ''), {});
  assert.equal(calls, 0);
});

test('flag off: planner wires section meta hook with enabled=false gate', () => {
  const planner = readFileSync(
    new URL('../../src/components/PlaceCard/tabs/PlannerTab.jsx', import.meta.url),
    'utf8',
  );
  assert.match(planner, /toolkitFreshnessOn = isGateoToolkitFreshnessEnabled\(\)/);
  assert.match(planner, /useToolkitSectionMeta\(\s*plannerData\?\.place_id,\s*toolkitFreshnessOn\s*\)/);
  const hook = readFileSync(
    new URL('../../src/components/PlaceCard/hooks/useToolkitSectionMeta.js', import.meta.url),
    'utf8',
  );
  assert.match(hook, /if \(!enabled\)[\s\S]*return;/);
});

test('QA fixture routes gated in App (not always-on baseline)', () => {
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /toolkitFreshnessQaBundled/);
  assert.match(app, /import\.meta\.env\.DEV/);
  assert.match(app, /VITE_GATEO_TOOLKIT_FRESHNESS/);
  assert.doesNotMatch(app, /ToolkitFreshnessBaselineFixturePage/);
  assert.match(app, /\{ToolkitFreshnessFixturePage \?/);
});
