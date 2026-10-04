import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { parseSmokeJson, parsePlaywrightJson, writeSummaryLines } from './summarize.mjs';

const require = createRequire(import.meta.url);
const report = require('./report-issues.cjs');

const SENSITIVE = [/6000u/, /\$12/, /page_ip_limited/, /\b429\b/, /203\.0\.113\.7/, /2001:db8::1/, /quota/i, /"used"/, /9876/];

function fakeGithub({ ascendingComments = false } = {}) {
  const s = { issues: [], comments: [], labelCalls: 0, apiCalls: [], next: 1 };
  const log = (n) => s.apiCalls.push(n);
  return {
    s,
    api: {
      rest: {
        issues: {
          createLabel: async () => {
            log('createLabel');
            s.labelCalls++;
            const e = new Error('exists');
            e.status = 422;
            throw e;
          },
          listForRepo: async ({ state, labels }) => {
            log('listForRepo');
            return {
              data: s.issues.filter((i) => i.state === state && i.labels.includes(labels)),
            };
          },
          create: async ({ title, body, labels }) => {
            log('create');
            const i = { number: s.next++, title, body, labels, state: 'open', closed_at: null };
            s.issues.push(i);
            return { data: i };
          },
          update: async ({ issue_number, body, labels, state }) => {
            log('update');
            const i = s.issues.find((x) => x.number === issue_number);
            if (body) i.body = body;
            if (labels) i.labels = labels;
            if (state) i.state = state;
            return { data: i };
          },
          listComments: async ({ issue_number, direction }) => {
            log('listComments');
            const c = s.comments.filter((x) => x.issue_number === issue_number);
            if (direction === 'desc') return { data: c.slice(-1) };
            if (ascendingComments) return { data: c.slice(0, 1) };
            return { data: c.slice(-1) };
          },
          createComment: async ({ issue_number, body }) => {
            log('createComment');
            s.comments.push({
              issue_number,
              body,
              created_at: new Date(globalThis.__now ?? Date.now()).toISOString(),
            });
          },
        },
      },
    },
  };
}

const ctx = { repo: { owner: 'o', repo: 'r' } };
const core = {
  summary: {
    addRaw(x) {
      core.buf += x;
      return core.summary;
    },
    write(x) {
      core.buf += x;
    },
  },
  buf: '',
  warning() {},
};

function writeResult(payload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-qa-'));
  const f = path.join(dir, 'r.json');
  fs.writeFileSync(f, JSON.stringify(payload));
  return f;
}

const DETAIL =
  'HTTP 429 page_ip_limited from 203.0.113.7 / 2001:db8::1 — used 6000u of 10000u, cost $12 {"quota":{"used":9876,"limit":10000}}';

test('LEAK: smoke detail → title/body/comments/step-summary', async () => {
  process.env.DRY_RUN = '0';
  const results = parseSmokeJson(
    {
      ok: false,
      checks: [{ id: 'P0-4', name: 'x', status: 'fail', detail: DETAIL, priority: 'P0' }],
    },
    'smoke',
  );
  const sumFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'step-')), 'sum.md');
  process.env.GITHUB_STEP_SUMMARY = sumFile;
  writeSummaryLines('smoke', results);
  const stepSummary = fs.readFileSync(sumFile, 'utf8');
  const { s, api } = fakeGithub();
  const f = writeResult({ layer: 'smoke', runUrl: 'https://run/1', results });
  await report({ github: api, context: ctx, core, resultFile: f, layer: 'smoke' });
  await report({ github: api, context: ctx, core, resultFile: f, layer: 'smoke' });
  const surfaces = {
    title: s.issues[0].title,
    body: s.issues[0].body,
    labels: s.issues[0].labels.join(','),
    comments: s.comments.map((c) => c.body).join('\n'),
    stepSummary,
    reason: results[0].reason,
    causeKey: results[0].causeKey,
  };
  const leaks = [];
  for (const [k, v] of Object.entries(surfaces)) {
    for (const re of SENSITIVE) {
      if (re.test(String(v))) leaks.push(`${k}:${re}`);
    }
  }
  assert.deepEqual(leaks, [], 'sensitive strings must not reach public surfaces');
  delete process.env.GITHUB_STEP_SUMMARY;
});

test('LEAK: playwright error message (ANSI + numbers) → public reason', () => {
  const pw = {
    suites: [
      {
        file: 'place-shipped-health.spec.js',
        specs: [
          {
            title: 't',
            file: 'place-shipped-health.spec.js',
            tests: [
              {
                status: 'unexpected',
                results: [
                  {
                    status: 'failed',
                    error: {
                      message:
                        '\u001b[31mError: expect(received).toBe(expected)\u001b[39m Received: "quota 6000u exceeded ip 203.0.113.7"',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const rows = parsePlaywrightJson(pw, 'e2e');
  assert.doesNotMatch(rows[0].reason, /6000u|203\.0\.113\.7|\u001b/);
});

test('DRY_RUN: API writes must be 0 (labels too)', async () => {
  process.env.DRY_RUN = 'true';
  const { s, api } = fakeGithub();
  const f = writeResult({
    layer: 'smoke',
    results: [
      {
        id: 'P0-4',
        feature: 'f',
        status: 'fail',
        reasonCode: 'timeout',
        reason: '응답 시간 초과',
        causeKey: 'smoke:P0-4:timeout',
      },
    ],
  });
  await report({ github: api, context: ctx, core, resultFile: f, layer: 'smoke' });
  const writes = s.apiCalls.filter((c) => ['createLabel', 'create', 'update', 'createComment'].includes(c));
  delete process.env.DRY_RUN;
  assert.equal(writes.length, 0, 'dry-run must not call write APIs (createLabel included)');
  assert.match(core.buf, /dry-run/i);
});

test('SPAM: 24h comment throttle with ascending listComments order', async () => {
  process.env.DRY_RUN = '0';
  const { s, api } = fakeGithub({ ascendingComments: true });
  const f = writeResult({
    layer: 'smoke',
    results: [
      {
        id: 'P0-1',
        feature: 'f',
        status: 'fail',
        reasonCode: 'timeout',
        reason: '응답 시간 초과',
        causeKey: 'smoke:P0-1:timeout',
      },
    ],
  });
  const realNow = Date.now;
  let t = realNow();
  Date.now = () => t;
  globalThis.__now = t;
  for (let i = 0; i < 24; i += 1) {
    await report({ github: api, context: ctx, core, resultFile: f, layer: 'smoke' });
    t += 2 * 3600e3;
    globalThis.__now = t;
  }
  Date.now = realNow;
  assert.ok(s.comments.length <= 3, 'expected ≤ ~2 comments in 48h');
});

test('CLOSE-IN-SAME-RUN: e2e spec with fail + 2 passes stays open over 3 days', async () => {
  process.env.DRY_RUN = '0';
  const { s, api } = fakeGithub();
  const pw = {
    suites: [
      {
        file: 'explore-search-enter.spec.js',
        specs: [
          {
            title: 'a',
            file: 'explore-search-enter.spec.js',
            tests: [{ status: 'unexpected', results: [{ error: { message: 'Timeout 120000ms exceeded' } }] }],
          },
          {
            title: 'b',
            file: 'explore-search-enter.spec.js',
            tests: [{ status: 'expected', results: [{}] }],
          },
          {
            title: 'c',
            file: 'explore-search-enter.spec.js',
            tests: [{ status: 'expected', results: [{}] }],
          },
        ],
      },
    ],
  };
  const rows = parsePlaywrightJson(pw, 'e2e');
  const f = writeResult({ layer: 'e2e', results: rows });
  for (let day = 1; day <= 3; day += 1) {
    await report({ github: api, context: ctx, core, resultFile: f, layer: 'e2e' });
  }
  assert.equal(s.issues.length, 1, 'one persistent failure should be one issue');
  assert.equal(s.issues[0].state, 'open');
});

test('missing result file creates missing_result issue on main', async () => {
  process.env.DRY_RUN = '0';
  const { s, api } = fakeGithub();
  const missing = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'health-m-')), 'nope.json');
  await report({ github: api, context: ctx, core, resultFile: missing, layer: 'pages' });
  assert.equal(s.issues.length, 1);
  assert.match(s.issues[0].title, /결과 파일 없음/);
});
