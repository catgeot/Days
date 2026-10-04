'use strict';

const HEALTH_KEY_RE = /<!--\s*health-key:\s*([^>]+?)\s*-->/i;
const PASS_STREAK_RE = /pass-streak:\s*(\d+)/i;
const COUNT_RE = /횟수:\s*(\d+)/i;

const ALL_LABELS = [
  'site-health',
  'health:fail',
  'health:suspect',
  'health:flaky',
  'health:weekly',
  'layer:smoke',
  'layer:pages',
  'layer:e2e',
  'layer:ci',
];

const PASS_STREAK_CLOSE = {
  smoke: 3,
  pages: 3,
  e2e: 2,
  ci: 1,
};

function isDryRun(env = process.env) {
  return env.DRY_RUN === 'true' || env.DRY_RUN === '1';
}

function sanitizeText(input, maxLen = 300) {
  let text = String(input || '')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxLen) text = `${text.slice(0, maxLen - 1)}…`;
  return text;
}

function formatKst(iso = new Date().toISOString()) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function parseHealthKey(body) {
  const m = String(body || '').match(HEALTH_KEY_RE);
  return m ? m[1].trim() : null;
}

function parsePassStreak(body) {
  const m = String(body || '').match(PASS_STREAK_RE);
  return m ? Number(m[1]) : 0;
}

function parseCount(body) {
  const m = String(body || '').match(COUNT_RE);
  return m ? Number(m[1]) : 1;
}

function buildIssueBody({ causeKey, summaryLine, firstSeen, lastSeen, count, passStreak, runUrl }) {
  const toIso = (value, fallback) => {
    if (typeof value === 'string' && value.includes('T')) return value;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
  };
  const nowIso = new Date().toISOString();
  const firstIso = toIso(firstSeen, nowIso);
  const lastIso = toIso(lastSeen, nowIso);
  return [
    `<!-- health-key: ${causeKey} -->`,
    `<!-- first-seen: ${firstIso} -->`,
    '',
    sanitizeText(summaryLine),
    '',
    `최초: ${formatKst(firstIso)} (KST)`,
    `최근: ${formatKst(lastIso)} (KST)`,
    `횟수: ${count}`,
    `pass-streak: ${passStreak}`,
    `run: ${runUrl || '(없음)'}`,
    '',
    '대응 후 연속 통과하면 자동으로 닫힘',
  ].join('\n');
}

function immediateFailLabels(layer, id, immediate) {
  if (immediate) return ['health:fail'];
  if (layer === 'smoke' && (id === 'P0-1' || id === 'P0-2')) return ['health:fail'];
  return ['health:suspect'];
}

async function ensureLabels(github, owner, repo) {
  for (const name of ALL_LABELS) {
    try {
      await github.rest.issues.createLabel({ owner, repo, name, color: '1d76db' });
    } catch (error) {
      if (error.status !== 422) throw error;
    }
  }
}

async function listOpenSiteHealthIssues(github, owner, repo) {
  const issues = [];
  let page = 1;
  for (;;) {
    const res = await github.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      labels: 'site-health',
      per_page: 100,
      page,
    });
    issues.push(...res.data.filter((i) => !i.pull_request));
    if (res.data.length < 100) break;
    page += 1;
  }
  return issues;
}

function findIssueByCauseKey(issues, causeKey) {
  return issues.find((issue) => parseHealthKey(issue.body) === causeKey);
}

function findIssuesByIdPrefix(issues, layer, id) {
  const prefix = `${layer}:${id}:`;
  return issues.filter((issue) => {
    const key = parseHealthKey(issue.body);
    return key && key.startsWith(prefix);
  });
}

async function lastIssueCommentTime(github, owner, repo, issueNumber) {
  const res = await github.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 1,
    page: 1,
  });
  const latest = res.data[0];
  return latest ? new Date(latest.created_at).getTime() : 0;
}

async function maybeComment(github, owner, repo, issueNumber, body, force = false) {
  if (!force) {
    const last = await lastIssueCommentTime(github, owner, repo, issueNumber);
    if (Date.now() - last < 24 * 60 * 60 * 1000) return;
  }
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: sanitizeText(body),
  });
}

async function closeIssue(github, owner, repo, issueNumber, comment) {
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: sanitizeText(comment),
  });
  await github.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: 'closed',
  });
}

function layerLabel(layer) {
  return `layer:${layer}`;
}

function buildTitle(feature, reason) {
  const title = `[site-health] ${feature}: ${reason}`;
  return title.length > 80 ? `${title.slice(0, 77)}…` : title;
}

async function upsertFailIssue(github, context, core, row, layer, openIssues) {
  const { owner, repo } = context.repo;
  const causeKey = row.causeKey;
  const runUrl = row.runUrl || context.payload?.runUrl || '';
  const summaryLine = `${row.feature} — ${row.reason}`;
  const now = new Date().toISOString();

  let issue = findIssueByCauseKey(openIssues, causeKey);
  const baseLabels = ['site-health', layerLabel(layer), ...immediateFailLabels(layer, row.id, row.immediate)];

  if (!issue) {
    const body = buildIssueBody({
      causeKey,
      summaryLine,
      firstSeen: now,
      lastSeen: now,
      count: 1,
      passStreak: 0,
      runUrl,
    });
    const title = buildTitle(row.feature, row.reason);
    if (isDryRun()) {
      core.summary.addRaw(`(dry-run) 이슈 생성 예정: ${title}\n`);
      return openIssues;
    }
    const created = await github.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels: baseLabels,
    });
    openIssues.push(created.data);
    return openIssues;
  }

  const prevCount = parseCount(issue.body);
  const nextCount = prevCount + 1;
  const firstSeen =
    issue.body.match(/<!-- first-seen: ([^>]+) -->/)?.[1]?.trim() || now;

  let labels = issue.labels.map((l) => (typeof l === 'string' ? l : l.name));
  const hadSuspect = labels.includes('health:suspect');
  if (hadSuspect && nextCount >= 2) {
    labels = labels.filter((l) => l !== 'health:suspect');
    if (!labels.includes('health:fail')) labels.push('health:fail');
  }

  const body = buildIssueBody({
    causeKey,
    summaryLine,
    firstSeen,
    lastSeen: now,
    count: nextCount,
    passStreak: 0,
    runUrl,
  });

  if (isDryRun()) {
    core.summary.addRaw(`(dry-run) 이슈 갱신 예정: #${issue.number} (${causeKey})\n`);
    return openIssues;
  }

  await github.rest.issues.update({
    owner,
    repo,
    issue_number: issue.number,
    body,
    labels: [...new Set(labels)],
  });

  if (hadSuspect && nextCount >= 2) {
    await maybeComment(
      github,
      owner,
      repo,
      issue.number,
      '의심 상태에서 반복 실패로 health:fail로 승격했습니다.',
      true,
    );
  } else {
    await maybeComment(github, owner, repo, issue.number, `다시 실패했습니다. run: ${runUrl}`);
  }

  issue.body = body;
  return openIssues;
}

async function upsertFlakyIssue(github, context, core, row, layer, openIssues) {
  const { owner, repo } = context.repo;
  const causeKey = row.causeKey;
  const runUrl = row.runUrl || '';
  const summaryLine = `${row.feature} — flaky`;
  const now = new Date().toISOString();

  let issue = findIssueByCauseKey(openIssues, causeKey);
  const labels = ['site-health', 'health:flaky', layerLabel(layer)];

  if (!issue) {
    const body = buildIssueBody({
      causeKey,
      summaryLine,
      firstSeen: now,
      lastSeen: now,
      count: 1,
      passStreak: 0,
      runUrl,
    });
    const title = buildTitle(row.feature, 'flaky');
    if (isDryRun()) {
      core.summary.addRaw(`(dry-run) flaky 이슈 생성 예정: ${title}\n`);
      return openIssues;
    }
    const created = await github.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
    openIssues.push(created.data);
    return openIssues;
  }

  const nextCount = parseCount(issue.body) + 1;
  const firstSeen =
    issue.body.match(/<!-- first-seen: ([^>]+) -->/)?.[1]?.trim() || now;
  const body = buildIssueBody({
    causeKey,
    summaryLine,
    firstSeen,
    lastSeen: now,
    count: nextCount,
    passStreak: 0,
    runUrl,
  });

  if (isDryRun()) {
    core.summary.addRaw(`(dry-run) flaky 이슈 갱신 예정: #${issue.number}\n`);
    return openIssues;
  }

  await github.rest.issues.update({
    owner,
    repo,
    issue_number: issue.number,
    body,
    labels,
  });
  return openIssues;
}

async function handlePass(github, context, core, row, layer, openIssues) {
  const { owner, repo } = context.repo;
  const matchId = row.matchId || row.id;
  const matches = findIssuesByIdPrefix(openIssues, layer, matchId);
  if (matches.length === 0) return openIssues;

  const need = PASS_STREAK_CLOSE[layer] ?? 3;

  for (const issue of matches) {
    const streak = parsePassStreak(issue.body) + 1;
    const causeKey = parseHealthKey(issue.body);
    const body = issue.body.replace(PASS_STREAK_RE, `pass-streak: ${streak}`);

    if (isDryRun()) {
      core.summary.addRaw(`(dry-run) pass-streak ${streak}/${need} — #${issue.number}\n`);
      continue;
    }

    if (streak >= need) {
      await closeIssue(
        github,
        owner,
        repo,
        issue.number,
        `연속 통과 ${streak}회로 자동 종료 (${causeKey}).`,
      );
      openIssues = openIssues.filter((i) => i.number !== issue.number);
    } else {
      await github.rest.issues.update({
        owner,
        repo,
        issue_number: issue.number,
        body,
      });
      issue.body = body;
    }
  }
  return openIssues;
}

async function upsertSimple({ github, context, core, causeKey, feature, reason, runUrl, layer, immediate = false }) {
  const row = {
    id: causeKey.split(':')[1] || 'ci',
    feature,
    reason,
    causeKey,
    runUrl,
    immediate,
  };
  await ensureLabels(github, context.repo.owner, context.repo.repo);
  let openIssues = await listOpenSiteHealthIssues(github, context.repo.owner, context.repo.repo);
  openIssues = await upsertFailIssue(github, context, core, row, layer, openIssues);
  return openIssues;
}

async function handlePassByCauseKey(github, context, core, causeKey, layer) {
  const { owner, repo } = context.repo;
  const openIssues = await listOpenSiteHealthIssues(github, owner, repo);
  const issue = findIssueByCauseKey(openIssues, causeKey);
  if (!issue) {
    if (isDryRun()) core.summary.addRaw(`(dry-run) pass 대상 이슈 없음: ${causeKey}\n`);
    return;
  }

  const id = causeKey.split(':')[1] || 'ci';
  return handlePass(
    github,
    context,
    core,
    { id, causeKey },
    layer,
    openIssues,
  );
}

async function run({ github, context, core, resultFile }) {
  const fs = require('node:fs');
  const { owner, repo } = context.repo;

  await ensureLabels(github, owner, repo);

  if (!fs.existsSync(resultFile)) {
    core.warning(`health result file missing: ${resultFile}`);
    return;
  }

  const payload = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  const layer = payload.layer || 'smoke';
  const runUrl = payload.runUrl || '';
  let openIssues = await listOpenSiteHealthIssues(github, owner, repo);

  for (const row of payload.results || []) {
    const enriched = { ...row, runUrl };
    if (row.status === 'fail') {
      openIssues = await upsertFailIssue(github, context, core, enriched, layer, openIssues);
    } else if (row.status === 'flaky') {
      openIssues = await upsertFlakyIssue(github, context, core, enriched, layer, openIssues);
    } else if (row.status === 'pass') {
      openIssues = await handlePass(github, context, core, enriched, layer, openIssues);
    }
  }
}

module.exports = run;
module.exports.upsertSimple = upsertSimple;
module.exports.handlePassByCauseKey = handlePassByCauseKey;
module.exports.sanitizeText = sanitizeText;
module.exports.parseHealthKey = parseHealthKey;
module.exports.PASS_STREAK_CLOSE = PASS_STREAK_CLOSE;
module.exports.isDryRun = isDryRun;
