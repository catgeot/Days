import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseSmokeJson,
  runSummarize,
  writeSummaryLines,
} from './summarize.mjs';
import { buildCauseKey } from './reason-codes.mjs';

test('(a) smoke JSON — fail 1건 요약 한 줄, causeKey에 HTTP status 숫자만 id에 포함', () => {
  const smoke = {
    ok: false,
    checks: [
      { id: 'P0-1', name: 'x', status: 'pass', detail: 'HTTP 200', priority: 'P0' },
      { id: 'P0-2', name: 'x', status: 'pass', detail: 'ok', priority: 'P0' },
      { id: 'P0-3', name: 'x', status: 'pass', detail: 'HTTP 200', priority: 'P0' },
      { id: 'P0-4', name: 'x', status: 'fail', detail: 'Timeout 15000ms', priority: 'P0' },
      { id: 'P0-5', name: 'x', status: 'pass', detail: 'ok', priority: 'P0' },
      { id: 'P1-1', name: 'x', status: 'pass', detail: 'ok', priority: 'P1' },
    ],
  };
  const results = parseSmokeJson(smoke, 'smoke');
  const fail = results.find((r) => r.status === 'fail');
  assert.equal(fail.feature, '축제 목록 캐시');
  assert.equal(fail.causeKey, 'smoke:P0-4:timeout');
  assert.match(fail.causeKey, /^smoke:P0-4:timeout$/);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'health-sum-'));
  const summaryPath = path.join(tmp, 'summary.txt');
  process.env.GITHUB_STEP_SUMMARY = summaryPath;
  writeSummaryLines('smoke', results);
  const lines = fs.readFileSync(summaryPath, 'utf8').trim().split('\n');
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^❌ \[축제 목록 캐시\]/);
  delete process.env.GITHUB_STEP_SUMMARY;
});

test('(b) Playwright JSON — fail 1 + flaky 1 줄', () => {
  const report = {
    suites: [
      {
        title: 'e2e/smoke-health-pages.spec.js',
        file: 'e2e/smoke-health-pages.spec.js',
        specs: [
          {
            title: '홈',
            file: 'e2e/smoke-health-pages.spec.js',
            tests: [
              {
                title: '지구본',
                status: 'failed',
                results: [{ status: 'failed', error: { message: 'Timeout 45000ms exceeded' } }],
              },
              {
                title: 'paris',
                status: 'flaky',
                results: [{ status: 'passed' }, { status: 'passed' }],
              },
            ],
          },
        ],
      },
    ],
  };

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'health-pw-'));
  const pwPath = path.join(tmp, 'pages.json');
  fs.writeFileSync(pwPath, JSON.stringify(report));

  const outPath = path.join(tmp, 'health-result.json');
  runSummarize({ layer: 'pages', playwrightPath: pwPath, outPath, runUrl: 'https://example/run', sha: 'abc' });

  const summaryPath = path.join(tmp, 'step-summary.md');
  process.env.GITHUB_STEP_SUMMARY = summaryPath;
  const payload = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  writeSummaryLines('pages', payload.results);
  const lines = fs.readFileSync(summaryPath, 'utf8').trim().split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^❌ \[/);
  assert.match(lines[1], /^🔁 \[/);
  delete process.env.GITHUB_STEP_SUMMARY;
});

test('(d) feature-map 없는 smoke id', () => {
  const smoke = {
    ok: true,
    checks: [{ id: 'P9-9', name: 'x', status: 'fail', detail: 'HTTP 500', priority: 'P0' }],
  };
  const results = parseSmokeJson(smoke, 'smoke');
  assert.match(results[0].feature, /^기능 미지정\(P9-9\)/);
});

test('simulate_failure adds SIM-1 without failing write', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'health-sim-'));
  const smokePath = path.join(tmp, 'smoke.json');
  fs.writeFileSync(
    smokePath,
    JSON.stringify({ ok: true, checks: [{ id: 'P0-1', status: 'pass', detail: 'ok', priority: 'P0' }] }),
  );
  process.env.HEALTH_SIMULATE_FAILURE = 'true';
  const outPath = path.join(tmp, 'out.json');
  const payload = runSummarize({ layer: 'smoke', smokePath, outPath });
  assert.ok(payload.results.some((r) => r.id === 'SIM-1'));
  delete process.env.HEALTH_SIMULATE_FAILURE;
});
