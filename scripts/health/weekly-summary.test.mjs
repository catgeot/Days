import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const weekly = require('./weekly-summary.cjs');
const reportIssues = require('./report-issues.cjs');

test('weekly-summary dry-run returns markdown skeleton', async () => {
  process.env.DRY_RUN = 'true';
  const core = { summary: { addRaw() {}, async write() {} }, warning() {} };
  const result = await weekly({
    github: { rest: {} },
    context: { repo: { owner: 'o', repo: 'r' } },
    core,
  });
  assert.match(result.md, /주간 요약/);
  assert.match(result.md, /dry-run/);
  assert.equal(result.dry, true);
  delete process.env.DRY_RUN;
});

test('weekly-summary module loads after syntax fix', () => {
  assert.equal(typeof weekly, 'function');
  assert.equal(typeof reportIssues.writeSummary, 'function');
});
