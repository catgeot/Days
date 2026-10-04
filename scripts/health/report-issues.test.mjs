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
  const botLogin = reportIssues.BOT_LOGIN;
  const marker = reportIssues.BOT_COMMENT_MARKER;
  const api = {
    rest: {
      issues: {
        createLabel: async () => {
          log('createLabel');
        },
        listForRepo: async ({ labels, state: st }) => {
          log('listForRepo');
          let data = state.issues.filter((i) => i.state === st);
          if (labels) data = data.filter((i) => i.labels.includes(labels));
          return { data };
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
        update: async ({ issue_number, body, labels, state: st, title }) => {
          log('update');
          const issue = state.issues.find((i) => i.number === issue_number);
          if (body) issue.body = body;
          if (labels) issue.labels = labels;
          if (title) issue.title = title;
          if (st) {
            issue.state = st;
            issue.closed_at = st === 'closed' ? new Date().toISOString() : null;
          }
          return { data: issue };
        },
        listComments: async ({ issue_number, since, per_page = 100, page = 1 }) => {
          log('listComments');
          let data = state.comments.filter((c) => c.issue_number === issue_number);
          if (since) data = data.filter((c) => c.updated_at >= since);
          const start = (page - 1) * per_page;
          return { data: data.slice(start, start + per_page) };
        },
        createComment: async ({ issue_number, body }) => {
          log('createComment');
          const now = new Date().toISOString();
          state.comments.push({
            issue_number,
            body,
            created_at: now,
            updated_at: now,
            user: { login: botLogin },
          });
        },
      },
    },
  };
  return { api, state, botLogin, marker };
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

test('auto-close posts run URL even after promote bot comment within 24h', async () => {
  const { api, state, marker } = fakeGithub();
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {}, write() {} }, warning() {} };
  process.env.DRY_RUN = '0';
  const runUrl = 'https://github.com/o/r/actions/runs/37170552104';
  state.issues.push({
    number: 7,
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
  state.comments.push({
    issue_number: 7,
    body: `${marker}\n의심 상태에서 반복 실패로 health:fail로 승격했습니다.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: reportIssues.BOT_LOGIN },
  });
  const resultFile = tmpResult({
    layer: 'smoke',
    runUrl,
    results: [{ id: 'P0-4', status: 'pass' }],
  });
  await reportIssues({ github: api, context, core, resultFile, layer: 'smoke' });
  assert.equal(state.issues[0].state, 'closed');
  const closeComments = state.comments.filter(
    (c) => c.body.includes(marker) && c.body.includes('연속 통과'),
  );
  assert.equal(closeComments.length, 1);
  assert.ok(closeComments[0].body.includes(runUrl));
});

test('reopen posts bot comment even when another bot notify exists within 24h', async () => {
  const { api, state, marker } = fakeGithub();
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {}, write() {} }, warning() {} };
  process.env.DRY_RUN = '0';
  const runUrl = 'https://github.com/o/r/actions/runs/37171122473';
  const closedAt = new Date().toISOString();
  state.issues.push({
    number: 8,
    title: 't',
    body: [
      '<!-- health-key: smoke:P0-1:timeout -->',
      '<!-- first-seen: 2026-01-01T00:00:00.000Z -->',
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
      '<!-- health-last-close: 2026-01-02T00:00:00.000Z -->',
    ].join('\n'),
    labels: ['site-health', 'health:fail', 'layer:smoke'],
    state: 'closed',
    closed_at: closedAt,
  });
  state.comments.push({
    issue_number: 8,
    body: `${marker}\n연속 통과 3회로 자동 종료. run: https://old/run`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: reportIssues.BOT_LOGIN },
  });
  const resultFile = tmpResult({
    layer: 'smoke',
    runUrl,
    results: [
      {
        id: 'P0-1',
        feature: '사이트 HTML',
        status: 'fail',
        reasonCode: 'timeout',
        reason: '응답 시간 초과',
        causeKey: 'smoke:P0-1:timeout',
        source: 'scripts/smoke-health.mjs',
      },
    ],
  });
  await reportIssues({ github: api, context, core, resultFile, layer: 'smoke' });
  assert.equal(state.issues[0].state, 'open');
  const reopenComments = state.comments.filter(
    (c) => c.body.includes(marker) && c.body.includes('자동 재개'),
  );
  assert.equal(reopenComments.length, 1);
  assert.ok(reopenComments[0].body.includes('P0-1'));
  assert.ok(reopenComments[0].body.includes('응답 시간 초과'));
  assert.ok(reopenComments[0].body.includes(runUrl));
});

test('invalid runUrl omitted from state-change comment', () => {
  const line = reportIssues.formatAutoCloseComment({
    streak: 3,
    runUrl: 'https://evil.com/?token=ghp_secret',
    orphanClose: false,
    owner: 'o',
    repo: 'r',
  });
  assert.match(line, /run: \(없음\)/);
  assert.doesNotMatch(line, /ghp_secret/);
});

test('24h throttle blocks second ordinary fail notify', async () => {
  const { api, state, marker } = fakeGithub();
  const context = { repo: { owner: 'o', repo: 'r' } };
  const core = { summary: { addRaw() {}, write() {} }, warning() {} };
  process.env.DRY_RUN = '0';
  state.issues.push({
    number: 9,
    title: 't',
    body: [
      '<!-- health-key: smoke:P0-4:timeout -->',
      '<!-- first-seen: 2026-01-01T00:00:00.000Z -->',
      '',
      '요약',
      '',
      '최초: x (KST)',
      '최근: y (KST)',
      '횟수: 2',
      'pass-streak: 0',
      'run: u',
      '',
      '대응 후 연속 통과하면 자동으로 닫힘',
    ].join('\n'),
    labels: ['site-health', 'health:fail', 'layer:smoke'],
    state: 'open',
  });
  state.comments.push({
    issue_number: 9,
    body: `${marker}\n동일 원인으로 다시 실패했습니다.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { login: reportIssues.BOT_LOGIN },
  });
  const row = {
    id: 'P0-4',
    feature: '축제 목록 캐시',
    status: 'fail',
    reasonCode: 'timeout',
    reason: '응답 시간 초과',
    causeKey: 'smoke:P0-4:timeout',
    source: 'scripts/smoke-health.mjs',
  };
  const resultFile = tmpResult({ layer: 'smoke', runUrl: 'u', results: [row] });
  await reportIssues({ github: api, context, core, resultFile, layer: 'smoke' });
  const repeatNotify = state.comments.filter(
    (c) => c.body.includes(marker) && c.body.includes('동일 원인'),
  );
  assert.equal(repeatNotify.length, 1);
  assert.match(state.issues[0].body, /횟수: 3/);
});
