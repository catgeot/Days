import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const report = require('./report-issues.cjs');

const realNow = Date.now;
let T = realNow();
const clock = (t) => {
  T = t;
  Date.now = () => T;
};
const iso = () => new Date(T).toISOString();

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MARKER = report.BOT_COMMENT_MARKER;

function isStateChangeComment(body) {
  const text = String(body || '');
  return (
    text.includes('연속 통과') ||
    text.includes('자동 재개') ||
    text.includes('복구 확인 아님')
  );
}

function maxEventsInWindow(events, startMs, endMs) {
  let max = 0;
  for (let wStart = startMs; wStart <= endMs - WINDOW_MS; wStart += 15 * 60 * 1000) {
    const wEnd = wStart + WINDOW_MS;
    const n = events.filter((e) => e.t >= wStart && e.t < wEnd).length;
    if (n > max) max = n;
  }
  return max;
}

function gh() {
  const s = { issues: [], comments: [], transitions: [], next: 1 };
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
            const i = s.issues.find((x) => x.number === issue_number);
            const prev = i.state;
            if (body) i.body = body;
            if (title) i.title = title;
            if (labels) i.labels = labels;
            if (state && state !== prev) {
              s.transitions.push({ from: prev, to: state, t: T });
            }
            if (state) {
              i.state = state;
              i.closed_at = state === 'closed' ? iso() : null;
            }
            return { data: i };
          },
          listComments: async ({ issue_number, since, per_page = 100, page = 1 }) => {
            let c = s.comments.filter((x) => x.issue_number === issue_number);
            if (since) c = c.filter((x) => x.updated_at >= since);
            return { data: c.slice((page - 1) * per_page, page * per_page) };
          },
          createComment: async ({ issue_number, body }) => {
            s.comments.push({
              issue_number,
              body,
              created_at: iso(),
              updated_at: iso(),
              user: { login: report.BOT_LOGIN, type: 'Bot' },
            });
          },
        },
      },
    },
  };
}

const ctx = { repo: { owner: 'o', repo: 'r' } };
const core = { summary: { addRaw() { return core.summary; }, async write() {} }, warning() {} };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r387-'));

function p0Pass() {
  return {
    id: 'P0-1',
    feature: '사이트 HTML',
    status: 'pass',
    reasonCode: 'unknown',
    causeKey: 'smoke:P0-1:unknown',
    source: 'scripts/smoke-health.mjs',
  };
}

function simPass() {
  return {
    id: 'SIM-1',
    feature: '모의 실패',
    status: 'pass',
    reasonCode: 'unknown',
    causeKey: 'smoke:SIM-1:unknown',
    source: 'scripts/health/summarize.mjs',
  };
}

function failRow() {
  return {
    id: 'P0-1',
    feature: '사이트 HTML',
    status: 'fail',
    reasonCode: 'timeout',
    reason: 'raw',
    causeKey: 'smoke:P0-1:timeout',
    immediate: true,
  };
}

function writeResult(name, results, runUrl) {
  const f = path.join(dir, `${name}-${T}.json`);
  fs.writeFileSync(f, JSON.stringify({ layer: 'smoke', runUrl, results }));
  return f;
}

async function runPattern(api, { steps, stepMs, pattern }) {
  const runUrl = 'https://github.com/o/r/actions/runs/1001';
  for (let i = 0; i < steps; i += 1) {
    const kind = pattern[i % pattern.length];
    const results =
      kind === 'F'
        ? [failRow(), p0Pass(), simPass()]
        : [p0Pass(), simPass()];
    await report({
      github: api,
      context: ctx,
      core,
      resultFile: writeResult(kind, results, runUrl),
      layer: 'smoke',
    });
    clock(T + stepMs);
  }
}

function assertNoSilentStateChanges(s) {
  const stateComments = s.comments.filter((c) => c.body.includes(MARKER) && isStateChangeComment(c.body));
  assert.equal(
    s.transitions.length,
    stateComments.length,
    `transitions=${s.transitions.length} comments=${stateComments.length}`,
  );
}

test('30m F+3P flap 7d: no silent state changes, <=5 transitions per 24h', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const startMs = T;
  const { s, api } = gh();
  const steps = ((24 * 60) / 30) * 7;
  await runPattern(api, { steps, stepMs: 30 * 60 * 1000, pattern: ['F', 'P', 'P', 'P'] });
  Date.now = realNow;
  assertNoSilentStateChanges(s);
  const max24 = maxEventsInWindow(s.transitions, startMs, T);
  assert.ok(max24 <= 5, `max state changes per 24h: ${max24}`);
});

test('2h F+6P flap 7d: no silent state changes, <=5 transitions per 24h', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const startMs = T;
  const { s, api } = gh();
  const stepsPerDay = 24 / 2;
  const steps = stepsPerDay * 7;
  const pattern = ['F', 'P', 'P', 'P', 'P', 'P', 'P'];
  await runPattern(api, { steps, stepMs: 2 * 3600e3, pattern });
  Date.now = realNow;
  assertNoSilentStateChanges(s);
  const max24 = maxEventsInWindow(s.transitions, startMs, T);
  assert.ok(max24 <= 5, `max state changes per 24h: ${max24}`);
});

test('scenario 8: 6th clean pass after reopen closes with comment and run URL', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const { s, api } = gh();
  const runUrl = 'https://github.com/o/r/actions/runs/37170552104';
  await report({
    github: api,
    context: ctx,
    core,
    resultFile: writeResult('f1', [failRow(), p0Pass(), simPass()], runUrl),
    layer: 'smoke',
  });
  for (let i = 0; i < 3; i += 1) {
    await report({
      github: api,
      context: ctx,
      core,
      resultFile: writeResult(`p${i}`, [p0Pass(), simPass()], runUrl),
      layer: 'smoke',
    });
  }
  assert.equal(s.issues[0].state, 'closed');
  await report({
    github: api,
    context: ctx,
    core,
    resultFile: writeResult('f2', [failRow(), p0Pass(), simPass()], runUrl),
    layer: 'smoke',
  });
  assert.equal(s.issues[0].state, 'open');
  for (let i = 0; i < 5; i += 1) {
    await report({
      github: api,
      context: ctx,
      core,
      resultFile: writeResult(`p2-${i}`, [p0Pass(), simPass()], runUrl),
      layer: 'smoke',
    });
    assert.equal(s.issues[0].state, 'open');
  }
  await report({
    github: api,
    context: ctx,
    core,
    resultFile: writeResult('p2-6', [p0Pass(), simPass()], runUrl),
    layer: 'smoke',
  });
  assert.equal(s.issues[0].state, 'closed');
  const closeComments = s.comments.filter((c) => c.body.includes('연속 통과'));
  assert.ok(closeComments.length >= 2, 'expected two close comments');
  assert.ok(closeComments.at(-1).body.includes(runUrl));
  assertNoSilentStateChanges(s);
  Date.now = realNow;
});

test('24h outage not buried: fail×3 after reopen keeps issue open', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const { s, api } = gh();
  const runUrl = 'https://github.com/o/r/actions/runs/2002';
  await report({
    github: api,
    context: ctx,
    core,
    resultFile: writeResult('o1', [failRow(), p0Pass(), simPass()], runUrl),
    layer: 'smoke',
  });
  for (let i = 0; i < 3; i += 1) {
    await report({
      github: api,
      context: ctx,
      core,
      resultFile: writeResult(`c${i}`, [p0Pass(), simPass()], runUrl),
      layer: 'smoke',
    });
  }
  assert.equal(s.issues[0].state, 'closed');
  await report({
    github: api,
    context: ctx,
    core,
    resultFile: writeResult('r1', [failRow(), p0Pass(), simPass()], runUrl),
    layer: 'smoke',
  });
  assert.equal(s.issues[0].state, 'open');
  for (let i = 0; i < 3; i += 1) {
    clock(T + 2 * 3600e3);
    await report({
      github: api,
      context: ctx,
      core,
      resultFile: writeResult(`o${i}`, [failRow(), p0Pass(), simPass()], runUrl),
      layer: 'smoke',
    });
    assert.equal(s.issues[0].state, 'open');
  }
  Date.now = realNow;
});
