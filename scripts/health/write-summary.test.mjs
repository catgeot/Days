import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('@actions/core');
const { writeSummary } = require('./report-issues.cjs');

test('writeSummary uses addRaw + write to GITHUB_STEP_SUMMARY file', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-summary-'));
  const summaryPath = path.join(dir, 'step-summary.md');
  fs.writeFileSync(summaryPath, '', 'utf8');
  process.env.GITHUB_STEP_SUMMARY = summaryPath;
  process.env.GITHUB_WORKSPACE = dir;

  await writeSummary(core, '(dry-run) 테스트 요약 한 줄\n');

  assert.ok(fs.existsSync(summaryPath), 'summary file should exist after write()');
  const text = fs.readFileSync(summaryPath, 'utf8');
  assert.match(text, /\(dry-run\)/);

  delete process.env.GITHUB_STEP_SUMMARY;
  delete process.env.GITHUB_WORKSPACE;
});
