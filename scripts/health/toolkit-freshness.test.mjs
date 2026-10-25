import assert from 'node:assert/strict';
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
