import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { runSummarize } from './summarize.mjs';

const require = createRequire(import.meta.url);
const report = require('./report-issues.cjs');

const ctx = { repo: { owner: 'o', repo: 'r' } };
const core = { summary: { addRaw() { return core.summary; }, async write() {} }, warning() {} };

function gh() {
  const s = { issues: [], comments: [], calls: [], next: 1 };
  const L = (n) => s.calls.push(n);
  return {
    s,
    api: {
      rest: {
        issues: {
          createLabel: async () => {
            const e = new Error('x');
            e.status = 422;
            throw e;
          },
          listForRepo: async ({ state, labels }) => ({
            data: s.issues.filter((i) => i.state === state && i.labels.includes(labels)),
          }),
          create: async ({ title, body, labels }) => {
            L('create');
            const i = {
              number: s.next++,
              title,
              body,
              labels,
              state: 'open',
              closed_at: null,
            };
            s.issues.push(i);
            return { data: i };
          },
          update: async ({ issue_number, body, labels, state, title }) => {
            L(`update:${state || 'body'}`);
            const i = s.issues.find((x) => x.number === issue_number);
            if (body) i.body = body;
            if (title) i.title = title;
            if (labels) i.labels = labels;
            if (state) {
              i.state = state;
              i.closed_at = state === 'closed' ? new Date().toISOString() : null;
            }
            return { data: i };
          },
          listComments: async ({ issue_number, since, per_page = 30, page = 1 }) => {
            L('listComments');
            let c = s.comments.filter((x) => x.issue_number === issue_number);
            if (since) c = c.filter((x) => x.updated_at >= since);
            const pp = Math.min(per_page, 100);
            return { data: c.slice((page - 1) * pp, page * pp) };
          },
          createComment: async ({ issue_number, body }) => {
            L('createComment');
            s.comments.push({
              issue_number,
              body,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user: { login: 'github-actions[bot]', type: 'Bot' },
            });
          },
        },
      },
    },
  };
}

function tmpResult(payload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim1-'));
  const file = path.join(dir, 'result.json');
  fs.writeFileSync(file, JSON.stringify(payload));
  return file;
}

function simFailRow() {
  return {
    id: 'SIM-1',
    feature: '모의 실패',
    status: 'fail',
    reasonCode: 'unknown',
    reason: '원인 미분류',
    causeKey: 'smoke:SIM-1:unknown',
    source: 'scripts/health/summarize.mjs',
  };
}

function simPassRow() {
  return {
    id: 'SIM-1',
    feature: '모의 실패',
    status: 'pass',
    reasonCode: 'unknown',
    causeKey: 'smoke:SIM-1:unknown',
    source: 'scripts/health/summarize.mjs',
  };
}

function p0PassRow() {
  return {
    id: 'P0-1',
    feature: '사이트 HTML',
    status: 'pass',
    reasonCode: 'unknown',
    causeKey: 'smoke:P0-1:unknown',
    source: 'scripts/smoke-health.mjs',
  };
}

async function cleanSmokePass(api, extra = []) {
  const f = tmpResult({
    layer: 'smoke',
    runUrl: 'https://run/pass',
    results: [p0PassRow(), simPassRow(), ...extra],
  });
  await report({ github: api, context: ctx, core, resultFile: f, layer: 'smoke' });
}

test('SIM-1 fail then 3 clean runs auto-closes', async () => {
  process.env.DRY_RUN = '0';
  const { s, api } = gh();
  const failFile = tmpResult({
    layer: 'smoke',
    runUrl: 'https://run/fail',
    results: [p0PassRow(), simFailRow()],
  });
  await report({ github: api, context: ctx, core, resultFile: failFile, layer: 'smoke' });
  assert.equal(s.issues.length, 1);
  assert.equal(s.issues[0].state, 'open');
  for (let i = 0; i < 3; i++) await cleanSmokePass(api);
  assert.equal(s.issues[0].state, 'closed');
});

test('SIM-1 reopen needs 6 clean runs before close', async () => {
  process.env.DRY_RUN = '0';
  const { s, api } = gh();
  const failFile = tmpResult({ layer: 'smoke', results: [simFailRow()] });
  await report({ github: api, context: ctx, core, resultFile: failFile, layer: 'smoke' });
  for (let i = 0; i < 3; i++) await cleanSmokePass(api);
  assert.equal(s.issues[0].state, 'closed');
  await report({ github: api, context: ctx, core, resultFile: failFile, layer: 'smoke' });
  assert.equal(s.issues[0].state, 'open');
  assert.equal(report.passStreakRequired('smoke', s.issues[0].body), 6);
  for (let i = 0; i < 5; i++) {
    await cleanSmokePass(api);
    assert.equal(s.issues[0].state, 'open');
  }
  await cleanSmokePass(api);
  assert.equal(s.issues[0].state, 'closed');
});

test('orphan check id closes after required passes', async () => {
  process.env.DRY_RUN = '0';
  const { s, api } = gh();
  s.issues.push({
    number: 1,
    title: '[site-health] 레거시: 원인 미분류',
    body: [
      '<!-- health-key: smoke:LEGACY-1:timeout -->',
      '<!-- first-seen: 2026-01-01T00:00:00.000Z -->',
      '',
      '요약',
      '',
      '최초: x (KST)',
      '최근: y (KST)',
      '횟수: 1',
      'pass-streak: 2',
      'run: u',
      '',
      '대응 후 연속 통과하면 자동으로 닫힘',
    ].join('\n'),
    labels: ['site-health', 'health:fail', 'layer:smoke'],
    state: 'open',
  });
  const f = tmpResult({ layer: 'smoke', results: [p0PassRow()] });
  await report({ github: api, context: ctx, core, resultFile: f, layer: 'smoke' });
  assert.equal(s.issues[0].state, 'closed');
});

test('missing result file does not advance pass-streak', async () => {
  process.env.DRY_RUN = '0';
  const { s, api } = gh();
  s.issues.push({
    number: 2,
    title: 't',
    body: [
      '<!-- health-key: smoke:SIM-1:unknown -->',
      '',
      '요약',
      '',
      '최초: x (KST)',
      '최근: y (KST)',
      '횟수: 1',
      'pass-streak: 1',
      'run: u',
      '',
      '대응 후 연속 통과하면 자동으로 닫힘',
    ].join('\n'),
    labels: ['site-health', 'health:fail', 'layer:smoke'],
    state: 'open',
  });
  const missing = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sim-m-')), 'nope.json');
  await report({ github: api, context: ctx, core, resultFile: missing, layer: 'smoke' });
  const sim = s.issues.find((i) => report.parseHealthKey(i.body) === 'smoke:SIM-1:unknown');
  assert.equal(sim.body.match(/pass-streak: (\d+)/)[1], '1');
});

test('empty results file does not advance orphan pass-streak', async () => {
  process.env.DRY_RUN = '0';
  const { s, api } = gh();
  s.issues.push({
    number: 3,
    title: 't',
    body: [
      '<!-- health-key: smoke:LEGACY-2:timeout -->',
      '',
      '요약',
      '',
      '최초: x (KST)',
      '최근: y (KST)',
      '횟수: 1',
      'pass-streak: 0',
      'run: u',
      '',
      '대응 후 연속 통과하면 자동으로 닫힘',
    ].join('\n'),
    labels: ['site-health', 'health:fail', 'layer:smoke'],
    state: 'open',
  });
  const f = tmpResult({ layer: 'smoke', results: [] });
  await report({ github: api, context: ctx, core, resultFile: f, layer: 'smoke' });
  assert.match(s.issues[0].body, /pass-streak: 0/);
});

test('future reopen marker ignored for doubled pass-streak', () => {
  const future = new Date(Date.now() + 7 * 24 * 3600e3).toISOString();
  const body = `<!-- health-key: smoke:P0-1:timeout -->\n<!-- health-last-reopen: ${future} -->\npass-streak: 0`;
  assert.equal(report.passStreakRequired('smoke', body), 3);
});

test('summarize emits SIM-1 pass on smoke without simulate flag', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-sum-'));
  const smokePath = path.join(tmp, 'smoke.json');
  fs.writeFileSync(
    smokePath,
    JSON.stringify({
      ok: true,
      checks: [{ id: 'P0-1', status: 'pass', detail: 'ok', priority: 'P0' }],
    }),
  );
  delete process.env.HEALTH_SIMULATE_FAILURE;
  const summaryPath = path.join(tmp, 'summary.md');
  process.env.GITHUB_STEP_SUMMARY = summaryPath;
  const outPath = path.join(tmp, 'out.json');
  const payload = runSummarize({ layer: 'smoke', smokePath, outPath });
  const sim = payload.results.find((r) => r.id === 'SIM-1');
  assert.equal(sim?.status, 'pass');
  const lines = fs.readFileSync(summaryPath, 'utf8').trim();
  assert.match(lines, /전 항목 정상/);
  assert.doesNotMatch(lines, /SIM-1|모의 실패/);
  delete process.env.GITHUB_STEP_SUMMARY;
});
