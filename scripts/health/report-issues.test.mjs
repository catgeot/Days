import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const reportIssues = require('./report-issues.cjs');

function fakeGithub() {
  const state = { issues: [], comments: [], next: 1000, labels: new Set() };
  const api = {
    rest: {
      issues: {
        createLabel: async ({ name }) => {
          state.labels.add(name);
        },
        listForRepo: async ({ labels, state: st }) => ({
          data: state.issues.filter(
            (i) => i.state === st && (!labels || i.labels.includes(labels)),
          ),
        }),
        create: async ({ title, body, labels }) => {
          const issue = {
            number: state.next++,
            title,
            body,
            labels: labels || [],
            state: 'open',
            html_url: `https://github.com/o/r/issues/${state.next - 1}`,
          };
          state.issues.push(issue);
          return { data: issue };
        },
        update: async ({ issue_number, body, labels, state: st }) => {
          const issue = state.issues.find((i) => i.number === issue_number);
          if (body) issue.body = body;
          if (labels) issue.labels = labels;
          if (st) issue.state = st;
          return { data: issue };
        },
        listComments: async () => ({ data: state.comments.slice(-1) }),
        createComment: async ({ issue_number, body }) => {
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
  const core = { summary: { addRaw() {} }, warning() {} };
  process.env.DRY_RUN = '0';

  const resultFile = 'health/health-result.json';
  const fs = await import('node:fs');
  fs.mkdirSync('health', { recursive: true });
  fs.writeFileSync(
    resultFile,
    JSON.stringify({
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
    }),
  );

  await reportIssues({ github: api, context, core, resultFile });
  await reportIssues({ github: api, context, core, resultFile });
  assert.equal(state.issues.length, 1);
  assert.match(state.issues[0].body, /횟수: 2/);
});

test('suspect → fail 승격', async () => {
  const { api, state } = fakeGithub();
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {} }, warning() {} };
  process.env.DRY_RUN = '0';
  const fs = await import('node:fs');
  const resultFile = 'health/health-result-suspect.json';
  const row = {
    id: 'P0-4',
    feature: '축제 목록 캐시',
    status: 'fail',
    reasonCode: 'timeout',
    reason: '응답 시간 초과',
    causeKey: 'smoke:P0-4:timeout',
    source: 'scripts/smoke-health.mjs',
  };
  const write = (count) => {
    const body = [
      '<!-- health-key: smoke:P0-4:timeout -->',
      '',
      '요약',
      '',
      '최초: 2026. 1. 1. (KST)',
      '최근: 2026. 1. 2. (KST)',
      `횟수: ${count}`,
      'pass-streak: 0',
      'run: u',
      '',
      '대응 후 연속 통과하면 자동으로 닫힘',
    ].join('\n');
    if (state.issues.length === 0) {
      state.issues.push({
        number: 1,
        title: 't',
        body,
        labels: ['site-health', 'health:suspect', 'layer:smoke'],
        state: 'open',
      });
    } else {
      state.issues[0].body = body;
    }
  };
  write(1);
  fs.writeFileSync(resultFile, JSON.stringify({ layer: 'smoke', runUrl: 'u', results: [row] }));
  await reportIssues({ github: api, context, core, resultFile: resultFile });
  assert.ok(state.issues[0].labels.includes('health:fail'));
});

test('pass-streak 3 closes smoke issue', async () => {
  const { api, state } = fakeGithub();
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {} }, warning() {} };
  process.env.DRY_RUN = '0';
  state.issues.push({
    number: 5,
    title: 't',
    body: [
      '<!-- health-key: smoke:P0-4:timeout -->',
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
  const fs = await import('node:fs');
  const resultFile = 'health/health-result-pass.json';
  fs.writeFileSync(
    resultFile,
    JSON.stringify({
      layer: 'smoke',
      runUrl: 'u',
      results: [{ id: 'P0-4', status: 'pass' }],
    }),
  );
  await reportIssues({ github: api, context, core, resultFile });
  assert.equal(state.issues[0].state, 'closed');
});

test('DRY_RUN — API 0', async () => {
  const { api, state } = fakeGithub();
  process.env.DRY_RUN = '1';
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {} }, warning() {} };
  const fs = await import('node:fs');
  fs.writeFileSync(
    'health/health-dry.json',
    JSON.stringify({
      layer: 'smoke',
      results: [
        {
          id: 'P0-1',
          feature: '사이트 HTML',
          status: 'fail',
          reason: 'HTTP 500',
          causeKey: 'smoke:P0-1:http_5xx',
          source: 'scripts/smoke-health.mjs',
        },
      ],
    }),
  );
  await reportIssues({ github: api, context, core, resultFile: 'health/health-dry.json' });
  assert.equal(state.issues.length, 0);
  delete process.env.DRY_RUN;
});

test('JWT redacted in sanitize', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig';
  const out = reportIssues.sanitizeText(`token ${jwt} end`);
  assert.match(out, /\[redacted\]/);
  assert.doesNotMatch(out, /eyJ/);
});
