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
              i.closed_at = state === 'closed' ? iso() : null;
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
              created_at: iso(),
              updated_at: iso(),
              user: { login: 'github-actions[bot]', type: 'Bot' },
            });
          },
        },
      },
    },
  };
}

const ctx = { repo: { owner: 'o', repo: 'r' } };
const core = { summary: { addRaw() { return core.summary; }, async write() {} }, warning() {} };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r4-'));

function writeLayer(layer, status, id = 'P0-1') {
  const f = path.join(dir, `${layer}-${status}-${id}-${T}.json`);
  fs.writeFileSync(
    f,
    JSON.stringify({
      layer,
      results: [
        {
          id,
          feature: 'f',
          status,
          reasonCode: status === 'fail' ? `${layer}:${id}:timeout` : 'ok',
          causeKey:
            status === 'fail'
              ? `${layer}:${id}:timeout`
              : `${layer}:${id}:ok`,
          immediate: true,
        },
      ],
    }),
  );
  return f;
}

async function closeWithPasses(api, layer, id, n = 3) {
  for (let i = 0; i < n; i++) {
    await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'pass', id) });
  }
}

test('r4: P0 fail×3 over 6h after reopen stays open', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const { s, api } = gh();
  const layer = 'smoke';
  const id = 'P0-1';
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  await closeWithPasses(api, layer, id, 3);
  assert.equal(s.issues[0].state, 'closed');
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  assert.equal(s.issues[0].state, 'open');
  for (let i = 0; i < 2; i++) {
    clock(T + 2 * 3600e3);
    await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
    assert.equal(s.issues[0].state, 'open');
  }
  Date.now = realNow;
});

test('r4: close→fail→close→fail×2 within 24h reopens both times', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const { s, api } = gh();
  const layer = 'smoke';
  const id = 'P0-2';
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  await closeWithPasses(api, layer, id, 3);
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  assert.equal(s.issues[0].state, 'open');
  clock(T + 2 * 3600e3);
  await closeWithPasses(api, layer, id, 6);
  assert.equal(s.issues[0].state, 'closed');
  clock(T + 2 * 3600e3);
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  assert.equal(s.issues[0].state, 'open');
  clock(T + 2 * 3600e3);
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  assert.equal(s.issues[0].state, 'open');
  Date.now = realNow;
});

test('r4: recently reopened needs doubled clean runs before auto-close', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const { s, api } = gh();
  const layer = 'smoke';
  const id = 'P0-3';
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  await closeWithPasses(api, layer, id, 3);
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  assert.equal(s.issues[0].state, 'open');
  assert.equal(report.passStreakRequired(layer, s.issues[0].body), 6);
  for (let i = 0; i < 5; i++) {
    await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'pass', id) });
    assert.equal(s.issues[0].state, 'open');
  }
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'pass', id) });
  assert.equal(s.issues[0].state, 'closed');
  Date.now = realNow;
});

test('r4: reopen marker survives body regeneration on repeat fail', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const { s, api } = gh();
  const layer = 'smoke';
  const id = 'P0-4';
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  await closeWithPasses(api, layer, id, 3);
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  const reopenTag = s.issues[0].body.match(report.LAST_REOPEN_RE)?.[1];
  assert.ok(reopenTag);
  clock(T + 3600e3);
  await report({ github: api, context: ctx, core, resultFile: writeLayer(layer, 'fail', id) });
  assert.match(s.issues[0].body, report.LAST_REOPEN_RE);
  assert.equal(s.issues[0].body.match(report.LAST_REOPEN_RE)?.[1], reopenTag);
  Date.now = realNow;
});
