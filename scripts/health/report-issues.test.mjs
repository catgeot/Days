import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const reportIssues = require('./report-issues.cjs');

function tmpResult(payload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-unit-'));
  const file = path.join(dir, 'result.json');
  fs.writeFileSync(file, JSON.stringify(payload));
  return file;
}

function fakeGithub() {
  const state = { issues: [], comments: [], next: 1000, apiCalls: [] };
  const log = (n) => state.apiCalls.push(n);
  const api = {
    rest: {
      issues: {
        createLabel: async () => {
          log('createLabel');
        },
        listForRepo: async ({ labels, state: st }) => {
          log('listForRepo');
          return {
            data: state.issues.filter(
              (i) => i.state === st && (!labels || i.labels.includes(labels)),
            ),
          };
        },
        create: async ({ title, body, labels }) => {
          log('create');
          const issue = {
            number: state.next++,
            title,
            body,
            labels: labels || [],
            state: 'open',
            html_url: `https://github.com/o/r/issues/${state.next - 1}`,
            closed_at: null,
          };
          state.issues.push(issue);
          return { data: issue };
        },
        update: async ({ issue_number, body, labels, state: st }) => {
          log('update');
          const issue = state.issues.find((i) => i.number === issue_number);
          if (body) issue.body = body;
          if (labels) issue.labels = labels;
          if (st) issue.state = st;
          return { data: issue };
        },
        listComments: async () => {
          log('listComments');
          return { data: state.comments.slice(-1) };
        },
        createComment: async ({ issue_number, body }) => {
          log('createComment');
          state.comments.push({ issue_number, body, created_at: new Date().toISOString() });
        },
      },
    },
  };
  return { api, state };
}

test('(c) create then update — duplicate 0', async () => {
  const { api, state } = fakeGithub();
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {}, write() {} }, warning() {} };
  process.env.DRY_RUN = '0';

  const resultFile = tmpResult({
    layer: 'smoke',
    runUrl: 'https://run/1',
    results: [
      {
        id: 'P0-4',
        feature: '축제 목록 캐시',
        status: 'fail',
        reasonCode: 'timeout',
        reason: '응답 시간 초과',
        causeKey: 'smoke:P0-4:timeout',
        source: 'scripts/smoke-health.mjs',
      },
    ],
  });

  await reportIssues({ github: api, context, core, resultFile, layer: 'smoke' });
  await reportIssues({ github: api, context, core, resultFile, layer: 'smoke' });
  assert.equal(state.issues.length, 1);
  assert.match(state.issues[0].body, /횟수: 2/);
});

test('suspect → fail 승격', async () => {
  const { api, state } = fakeGithub();
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {}, write() {} }, warning() {} };
  process.env.DRY_RUN = '0';
  const row = {
    id: 'P0-4',
    feature: '축제 목록 캐시',
    status: 'fail',
    reasonCode: 'timeout',
    reason: '응답 시간 초과',
    causeKey: 'smoke:P0-4:timeout',
    source: 'scripts/smoke-health.mjs',
  };
  state.issues.push({
    number: 1,
    title: 't',
    body: [
      '<!-- health-key: smoke:P0-4:timeout -->',
      '<!-- first-seen: 2026-01-01T00:00:00.000Z -->',
      '',
      '요약',
      '',
      '최초: 2026. 1. 1. (KST)',
      '최근: 2026. 1. 2. (KST)',
      '횟수: 1',
      'pass-streak: 0',
      'run: u',
      '',
      '대응 후 연속 통과하면 자동으로 닫힘',
    ].join('\n'),
    labels: ['site-health', 'health:suspect', 'layer:smoke'],
    state: 'open',
  });
  const resultFile = tmpResult({ layer: 'smoke', runUrl: 'u', results: [row] });
  await reportIssues({ github: api, context, core, resultFile, layer: 'smoke' });
  assert.ok(state.issues[0].labels.includes('health:fail'));
});

test('pass-streak 3 closes smoke issue', async () => {
  const { api, state } = fakeGithub();
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {}, write() {} }, warning() {} };
  process.env.DRY_RUN = '0';
  state.issues.push({
    number: 5,
    title: 't',
    body: [
      '<!-- health-key: smoke:P0-4:timeout -->',
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
  const resultFile = tmpResult({
    layer: 'smoke',
    runUrl: 'u',
    results: [{ id: 'P0-4', status: 'pass' }],
  });
  await reportIssues({ github: api, context, core, resultFile, layer: 'smoke' });
  assert.equal(state.issues[0].state, 'closed');
});

test('DRY_RUN — write API 0', async () => {
  const { api, state } = fakeGithub();
  process.env.DRY_RUN = '1';
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {}, write() {} }, warning() {} };
  const resultFile = tmpResult({
    layer: 'smoke',
    results: [
      {
        id: 'P0-1',
        feature: '사이트 HTML',
        status: 'fail',
        reasonCode: 'http_5xx',
        reason: '서버 오류(5xx)',
        causeKey: 'smoke:P0-1:http_5xx',
        source: 'scripts/smoke-health.mjs',
      },
    ],
  });
  await reportIssues({ github: api, context, core, resultFile, layer: 'smoke' });
  const writes = state.apiCalls.filter((c) =>
    ['createLabel', 'create', 'update', 'createComment'].includes(c),
  );
  assert.equal(writes.length, 0);
  assert.equal(state.issues.length, 0);
  delete process.env.DRY_RUN;
});

test('JWT sanitize helper', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig';
  const out = reportIssues.sanitizeText(`token ${jwt} end`);
  assert.match(out, /\[redacted\]/);
  assert.doesNotMatch(out, /eyJ/);
});
