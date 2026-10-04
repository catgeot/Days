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

function maxStateChangeCommentsInAnyWindow(comments, startMs, endMs) {
  let max = 0;
  for (let wStart = startMs; wStart <= endMs - WINDOW_MS; wStart += 30 * 60 * 1000) {
    const wEnd = wStart + WINDOW_MS;
    let n = 0;
    for (const c of comments) {
      const t = Date.parse(c.updated_at);
      if (t >= wStart && t < wEnd) n += 1;
    }
    if (n > max) max = n;
  }
  return max;
}

function gh() {
  const s = { issues: [], comments: [], next: 1 };
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
            if (body) i.body = body;
            if (title) i.title = title;
            if (labels) i.labels = labels;
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

function failFile(runUrl) {
  const f = path.join(dir, `fail-${T}.json`);
  fs.writeFileSync(
    f,
    JSON.stringify({
      layer: 'smoke',
      runUrl,
      results: [
        {
          id: 'P0-1',
          feature: '사이트 HTML',
          status: 'fail',
          reasonCode: 'timeout',
          reason: 'raw secret',
          causeKey: 'smoke:P0-1:timeout',
          immediate: true,
        },
        p0Pass(),
        simPass(),
      ],
    }),
  );
  return f;
}

function passFile(runUrl) {
  const f = path.join(dir, `pass-${T}.json`);
  fs.writeFileSync(
    f,
    JSON.stringify({
      layer: 'smoke',
      runUrl,
      results: [p0Pass(), simPass()],
    }),
  );
  return f;
}

async function runFlap30m(api, steps) {
  const runUrl = 'https://github.com/o/r/actions/runs/1001';
  const pat = [failFile(runUrl), passFile(runUrl), passFile(runUrl), passFile(runUrl)];
  for (let i = 0; i < steps; i += 1) {
    await report({ github: api, context: ctx, core, resultFile: pat[i % 4], layer: 'smoke' });
    clock(T + 30 * 60 * 1000);
  }
}

test('30m F,P,P,P flap: <=2 state-change bot comments per 24h (24h and 7d)', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const startMs = T;
  const { s, api } = gh();
  const steps24h = (24 * 60) / 30;
  const steps7d = steps24h * 7;
  await runFlap30m(api, steps7d);
  Date.now = realNow;

  const stateComments = s.comments.filter((c) => c.body.includes(MARKER) && isStateChangeComment(c.body));
  const max24 = maxStateChangeCommentsInAnyWindow(stateComments, startMs, T);
  assert.ok(max24 <= 2, `max state-change comments in any 24h window: ${max24}`);
  assert.equal(s.issues.length, 1);
});
