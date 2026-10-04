import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { maskPrivate } from './mask-private.mjs';

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
            L(`update:${state || ''}`);
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r3-'));
const mk = (n, status) => {
  const f = path.join(dir, `${n}.json`);
  fs.writeFileSync(
    f,
    JSON.stringify({
      layer: 'smoke',
      results: [
        {
          id: 'P0-1',
          feature: 'f',
          status,
          reasonCode: 'timeout',
          causeKey: status === 'fail' ? 'smoke:P0-1:timeout' : 'smoke:P0-1:ok',
          immediate: true,
        },
      ],
    }),
  );
  return f;
};
const F = mk('f', 'fail');
const P = mk('p', 'pass');
const bot = (s) => s.comments.filter((c) => c.user.type === 'Bot');

test('HUMAN comments interleaved + human spoofing marker: 48h @2h ≤ 2 bot comments', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const { s, api } = gh();
  for (let i = 0; i < 24; i++) {
    await report({ github: api, context: ctx, core, resultFile: F });
    if (s.issues[0] && i % 3 === 0) {
      s.comments.push({
        issue_number: 1,
        body: i % 2 ? 'human note' : '<!-- health-bot-notify --> spoof',
        created_at: iso(),
        updated_at: iso(),
        user: { login: 'alice', type: 'User' },
      });
    }
    clock(T + 2 * 3600e3);
  }
  assert.ok(bot(s).length <= 2);
});

test('FLAP fail,pass×3 repeated 48h: bot comments (incl. close) bounded', async () => {
  process.env.DRY_RUN = '0';
  clock(realNow());
  const { s, api } = gh();
  const pat = [F, P, P, P];
  for (let i = 0; i < 24; i++) {
    await report({ github: api, context: ctx, core, resultFile: pat[i % 4] });
    clock(T + 2 * 3600e3);
  }
  assert.equal(s.issues.length, 1);
  assert.ok(bot(s).length <= 3);
});

test('MASK coverage (must be masked)', () => {
  const cases = {
    ipv4: 'from 203.0.113.7',
    ipv6full: '2001:0db8:0000:0000:0000:ff00:0042:8329',
    ipv6comp: 'addr 2001:db8::1 end',
    ipv6loop: 'ip ::1 end',
    ipv4mapped: '::ffff:198.51.100.2',
    usage: 'used 6000u of 10000u',
    units: '6000 units used',
    credits: '1200 credits',
    tokens: '35000 tokens',
    cost$: 'cost $12.50',
    costWon: '₩15,000 charged',
    costKRW: '15000 KRW',
    costKRW2: 'KRW 15,000',
    jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.c2ln',
    jwtTrunc: 'apikey eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoi',
    bearer: 'Authorization: Bearer abc.def-ghi',
    apikeyEq: 'apikey=sb_secret_ABCdef123456',
    sbPub: 'key sb_publishable_ABCdef123456',
    quota: '{"quota":{"used":9876,"limit":10000}}',
    quotaSp: '{"quota": {"used": 9876, "limit": 10000}}',
    usageJson: '{"usage":{"used":9876}}',
    remaining: 'remaining=9876',
  };
  const leaks = {};
  for (const [k, v] of Object.entries(cases)) {
    const m = maskPrivate(v);
    if (/\d{3,}|eyJ|sb_|abc\.def|db8|ffff|::1\b|₩|KRW 1/.test(m.replace(/\[[a-z-]+\]/g, ''))) {
      leaks[k] = m;
    }
  }
  assert.deepEqual(Object.keys(leaks), []);
});

test('MASK over-masking (must be preserved: data-quality counts / ids / times)', () => {
  const keep = [
    'items=12 age=40h',
    'paris videos=7',
    'cache_key=rolling12:ko items=0',
    'HTTP 503',
    'at 10:03:22 KST',
    '2026-10-04T01:02:19Z',
    'place id 4821',
    'Timeout 120000ms exceeded',
    'spec.js:42:15',
    'bundle (183412 bytes)',
  ];
  const changed = keep.map((k) => [k, maskPrivate(k)]).filter(([a, b]) => a !== b);
  assert.deepEqual(changed, []);
});
