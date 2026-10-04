'use strict';

const HEALTH_KEY_RE = /<!--\s*health-key:\s*([^>]+?)\s*-->/i;
const PASS_STREAK_RE = /pass-streak:\s*(\d+)/i;
const COUNT_RE = /횟수:\s*(\d+)/i;
const REOPEN_DAYS = 7;
const BOT_COMMENT_MARKER = '<!-- health-bot-notify -->';
/** GitHub Actions 기본 봇 로그인 — PAT/App 토큰으로 바꾸면 listComments 필터가 깨져 24h 스로틀 무효(스팸) */
const BOT_LOGIN = 'github-actions[bot]';
const BOT_NOTIFY_WINDOW_MS = 24 * 60 * 60 * 1000;
const STATE_CHANGE_WINDOW_MS = 24 * 60 * 60 * 1000;
const LAST_REOPEN_RE = /<!-- health-last-reopen: ([^>]+) -->/;
const LAST_CLOSE_RE = /<!-- health-last-close: ([^>]+) -->/;
const CLOSE_LOG_RE = /<!-- health-close-log: ([^>]+) -->/;
const CHECK_ID_ALLOW_RE = /^[a-z0-9:._/-]{1,80}$/i;
const FLAP_DEFER_LINE = '플랩으로 종료 보류';

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeRunUrlForComment(runUrl, owner, repo) {
  const s = String(runUrl || '').trim();
  if (!owner || !repo) return '';
  const re = new RegExp(
    `^https://github\\.com/${escapeRegExp(owner)}/${escapeRegExp(repo)}/actions/runs/\\d+(?:/attempts/\\d+)?$`,
  );
  return re.test(s) ? s : '';
}

function runUrlCommentLine(runUrl, owner, repo) {
  const safe = sanitizeRunUrlForComment(runUrl, owner, repo);
  return safe ? ` run: ${safe}` : ' run: (없음)';
}

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

const INJECTED_SIM_PASS_SOURCE = 'scripts/health/summarize.mjs';

function isInjectedSimPassRow(row, layer) {
  if (layer !== 'smoke') return false;
  if (row.id !== 'SIM-1' || row.status !== 'pass') return false;
  return row.source === INJECTED_SIM_PASS_SOURCE;
}

function substantiveHealthResults(results, layer) {
  if (!Array.isArray(results)) return [];
  return results.filter((r) => !isInjectedSimPassRow(r, layer));
}

function formatAutoCloseComment({ streak, runUrl, orphanClose, owner, repo }) {
  const runLine = runUrlCommentLine(runUrl, owner, repo);
  if (orphanClose) {
    return `해당 검사가 더 이상 실행되지 않아 자동 종료했어요(복구 확인 아님).${runLine}`;
  }
  return `연속 통과 ${streak}회로 자동 종료.${runLine}`;
}

function formatReopenComment({ runUrl, checkId, reasonCode, owner, repo }) {
  const runLine = runUrlCommentLine(runUrl, owner, repo);
  const reason = publicReason(reasonCode);
  const id = publicCheckId(checkId);
  return `${id}: ${reason} — 종료 후 동일 원인 재발로 자동 재개.${runLine}`;
}

function publicCheckId(checkId) {
  const s = String(checkId || '').trim();
  return CHECK_ID_ALLOW_RE.test(s) ? s : '알 수 없는 검사';
}

function isDryRun(env = process.env) {
  return env.DRY_RUN === 'true' || env.DRY_RUN === '1';
}

async function writeSummary(core, text) {
  if (core.summary?.addRaw) {
    core.summary.addRaw(text);
  }
  if (typeof core.summary?.write === 'function') {
    await core.summary.write();
  }
}

function sanitizeText(input, maxLen = 300) {
  let text = String(input || '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxLen) text = `${text.slice(0, maxLen - 1)}…`;
  return text;
}

function publicReason(reasonCode) {
  const map = {
    timeout: '응답 시간 초과',
    http_5xx: '서버 오류(5xx)',
    http_4xx: '요청 거부(4xx)',
    missing_element: '화면 요소 없음',
    assert: '검증 실패',
    network: '네트워크 오류',
    unknown: '원인 미분류',
    missing_result: '결과 파일 없음',
  };
  return map[reasonCode] || map.unknown;
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

function carryForwardStateMarkers(newBody, oldBody) {
  let body = String(newBody || '');
  const prev = String(oldBody || '');
  for (const re of [LAST_REOPEN_RE, LAST_CLOSE_RE, CLOSE_LOG_RE]) {
    const oldTag = prev.match(re)?.[0];
    if (oldTag && !re.test(body)) body = `${body}\n${oldTag}`;
  }
  return body;
}

function parseCloseLogMs(body) {
  const m = String(body || '').match(CLOSE_LOG_RE);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((x) => Date.parse(x.trim()))
    .filter(Number.isFinite);
}

function closeCountInWindow(body, windowMs = STATE_CHANGE_WINDOW_MS) {
  const now = Date.now();
  return parseCloseLogMs(body).filter((t) => now - t <= windowMs).length;
}

function canCloseWithComment(body) {
  return closeCountInWindow(body) < 2;
}

function appendCloseLog(body) {
  const now = Date.now();
  const times = parseCloseLogMs(body).filter((t) => now - t <= STATE_CHANGE_WINDOW_MS);
  times.push(now);
  const tag = `<!-- health-close-log: ${times.map((t) => new Date(t).toISOString()).join(',')} -->`;
  if (CLOSE_LOG_RE.test(body)) return String(body).replace(CLOSE_LOG_RE, tag);
  return `${body}\n${tag}`;
}

function clearFlapDeferLine(body) {
  return String(body || '')
    .split('\n')
    .filter((line) => !line.includes(FLAP_DEFER_LINE))
    .join('\n');
}

function setFlapDeferLine(body) {
  const cleaned = clearFlapDeferLine(body);
  return `${cleaned}\n${FLAP_DEFER_LINE}`;
}

function passStreakRequired(layer, issueBody) {
  const base = PASS_STREAK_CLOSE[layer] ?? 3;
  const lastReopen = parseStateMarkerTimestamp(issueBody, LAST_REOPEN_RE);
  if (Number.isFinite(lastReopen) && withinMs(lastReopen, STATE_CHANGE_WINDOW_MS)) {
    return base * 2;
  }
  return base;
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
  if (isDryRun()) return;
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

async function findClosedIssueByCauseKey(github, owner, repo, causeKey) {
  let page = 1;
  for (;;) {
    const res = await github.rest.issues.listForRepo({
      owner,
      repo,
      state: 'closed',
      labels: 'site-health',
      per_page: 100,
      page,
      sort: 'updated',
      direction: 'desc',
    });
    const hit = res.data.find((i) => !i.pull_request && parseHealthKey(i.body) === causeKey);
    if (hit) return hit;
    if (res.data.length < 100) break;
    page += 1;
  }
  return null;
}

function closedWithinReopenWindow(issue) {
  const closedAt = issue.closed_at ? Date.parse(issue.closed_at) : NaN;
  if (!Number.isFinite(closedAt)) return false;
  return Date.now() - closedAt <= REOPEN_DAYS * 24 * 60 * 60 * 1000;
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

function parseTimestampFromBody(body, re) {
  const m = String(body || '').match(re);
  if (!m) return NaN;
  return Date.parse(m[1].trim());
}

function parseStateMarkerTimestamp(body, re) {
  const t = parseTimestampFromBody(body, re);
  if (!Number.isFinite(t) || t > Date.now()) return NaN;
  return t;
}

function withinMs(isoOrMs, windowMs) {
  const t = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= windowMs;
}

function canChangeIssueState(body, kind) {
  const re = kind === 'reopen' ? LAST_REOPEN_RE : LAST_CLOSE_RE;
  const last = parseStateMarkerTimestamp(body, re);
  if (!Number.isFinite(last)) return true;
  return !withinMs(last, STATE_CHANGE_WINDOW_MS);
}

function stampStateChange(body, kind) {
  const iso = new Date(Date.now()).toISOString();
  const tag =
    kind === 'reopen'
      ? `<!-- health-last-reopen: ${iso} -->`
      : `<!-- health-last-close: ${iso} -->`;
  const re = kind === 'reopen' ? LAST_REOPEN_RE : LAST_CLOSE_RE;
  if (re.test(body)) return String(body).replace(re, tag);
  return `${body}\n${tag}`;
}

async function countRecentBotNotifyComments(github, owner, repo, issueNumber, withinMs = BOT_NOTIFY_WINDOW_MS) {
  const since = new Date(Date.now() - withinMs).toISOString();
  let page = 1;
  let count = 0;
  for (;;) {
    const res = await github.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100,
      page,
      since,
    });
    for (const comment of res.data) {
      const login = comment.user?.login;
      if (login === BOT_LOGIN && String(comment.body || '').includes(BOT_COMMENT_MARKER)) {
        count += 1;
      }
    }
    if (res.data.length < 100) break;
    page += 1;
  }
  return count;
}

async function postBotComment(github, owner, repo, issueNumber, body, { force = false } = {}) {
  if (isDryRun()) return false;
  if (!force) {
    const recent = await countRecentBotNotifyComments(github, owner, repo, issueNumber);
    if (recent >= 1) return false;
  }
  const { maskPrivate } = await import('./mask-private.mjs');
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: sanitizeText(`${BOT_COMMENT_MARKER}\n${maskPrivate(body)}`),
  });
  return true;
}

async function maybeComment(github, owner, repo, issueNumber, body, force = false) {
  return postBotComment(github, owner, repo, issueNumber, body, { force });
}

async function closeIssue(github, owner, repo, issueNumber, comment, issueBody = '') {
  if (isDryRun()) return 'dry';
  if (issueBody && !canCloseWithComment(issueBody)) {
    return 'deferred';
  }
  await postBotComment(github, owner, repo, issueNumber, comment, { force: true });
  let body = clearFlapDeferLine(issueBody);
  body = stampStateChange(body, 'close');
  body = appendCloseLog(body);
  await github.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: 'closed',
    body,
  });
  return 'closed';
}

function layerLabel(layer) {
  return `layer:${layer}`;
}

function buildTitle(feature, reasonCode) {
  const reason = publicReason(reasonCode);
  const title = `[site-health] ${feature}: ${reason}`;
  return title.length > 80 ? `${title.slice(0, 77)}…` : title;
}

function publicSummaryLine(row) {
  const code = row.reasonCode || 'unknown';
  return `${row.feature} — ${publicReason(code)}`;
}

async function upsertFailIssue(github, context, core, row, layer, openIssues) {
  const { owner, repo } = context.repo;
  const causeKey = row.causeKey;
  const runUrl = row.runUrl || context.payload?.runUrl || '';
  const reasonCode = row.reasonCode || 'unknown';
  const summaryLine = publicSummaryLine(row);
  const now = new Date().toISOString();

  let issue = findIssueByCauseKey(openIssues, causeKey);
  const baseLabels = ['site-health', layerLabel(layer), ...immediateFailLabels(layer, row.id, row.immediate)];

  if (!issue) {
    if (!isDryRun()) {
      const closed = await findClosedIssueByCauseKey(github, owner, repo, causeKey);
      if (closed && closedWithinReopenWindow(closed)) {
        let body = buildIssueBody({
          causeKey,
          summaryLine,
          firstSeen:
            closed.body.match(/<!-- first-seen: ([^>]+) -->/)?.[1]?.trim() || now,
          lastSeen: now,
          count: 1,
          passStreak: 0,
          runUrl,
        });
        body = carryForwardStateMarkers(body, closed.body);
        body = stampStateChange(body, 'reopen');
        const title = buildTitle(row.feature, reasonCode);
        await github.rest.issues.update({
          owner,
          repo,
          issue_number: closed.number,
          state: 'open',
          title,
          body,
          labels: baseLabels,
        });
        await maybeComment(
          github,
          owner,
          repo,
          closed.number,
          formatReopenComment({ runUrl, checkId: row.id, reasonCode, owner, repo }),
          true,
        );
        const reopened = { ...closed, body, title, state: 'open', labels: baseLabels };
        openIssues.push(reopened);
        return openIssues;
      }
    }

    const body = buildIssueBody({
      causeKey,
      summaryLine,
      firstSeen: now,
      lastSeen: now,
      count: 1,
      passStreak: 0,
      runUrl,
    });
    const title = buildTitle(row.feature, reasonCode);
    if (isDryRun()) {
      await writeSummary(core, `(dry-run) 이슈 생성 예정: ${title}\n`);
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

  const body = carryForwardStateMarkers(
    buildIssueBody({
      causeKey,
      summaryLine,
      firstSeen,
      lastSeen: now,
      count: nextCount,
      passStreak: 0,
      runUrl,
    }),
    issue.body,
  );

  if (isDryRun()) {
    await writeSummary(core, `(dry-run) 이슈 갱신 예정: #${issue.number} (${causeKey})\n`);
    return openIssues;
  }

  await github.rest.issues.update({
    owner,
    repo,
    issue_number: issue.number,
    title: buildTitle(row.feature, reasonCode),
    body,
    labels: [...new Set(labels)],
    state: 'open',
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
  } else if (nextCount > 1) {
    await maybeComment(github, owner, repo, issue.number, '동일 원인으로 다시 실패했습니다.');
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
    const title = buildTitle(row.feature, 'unknown');
    if (isDryRun()) {
      await writeSummary(core, `(dry-run) flaky 이슈 생성 예정: ${title}\n`);
      return openIssues;
    }
    const created = await github.rest.issues.create({
      owner,
      repo,
      title: `[site-health] ${row.feature}: flaky`.slice(0, 80),
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
    await writeSummary(core, `(dry-run) flaky 이슈 갱신 예정: #${issue.number}\n`);
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

async function handlePassForRun(
  github,
  context,
  core,
  row,
  layer,
  openIssues,
  failedCauseKeys,
  failedMatchIds,
  { orphanClose = false } = {},
) {
  const { owner, repo } = context.repo;
  const matchId = row.matchId || row.id;
  const runUrl = row.runUrl || '';
  if (failedMatchIds.has(matchId)) return openIssues;

  const matches = findIssuesByIdPrefix(openIssues, layer, matchId);
  if (matches.length === 0) return openIssues;

  for (const issue of matches) {
    const need = passStreakRequired(layer, issue.body);
    const causeKey = parseHealthKey(issue.body);
    if (causeKey && failedCauseKeys.has(causeKey)) continue;

    const streak = parsePassStreak(issue.body) + 1;
    const body = issue.body.replace(PASS_STREAK_RE, `pass-streak: ${streak}`);

    if (isDryRun()) {
      await writeSummary(core, `(dry-run) pass-streak ${streak}/${need} — #${issue.number}\n`);
      continue;
    }

    if (streak >= need) {
      const outcome = await closeIssue(
        github,
        owner,
        repo,
        issue.number,
        formatAutoCloseComment({ streak, runUrl, orphanClose, owner, repo }),
        body,
      );
      if (outcome === 'closed') {
        openIssues = openIssues.filter((i) => i.number !== issue.number);
      } else if (outcome === 'deferred') {
        const deferredBody = setFlapDeferLine(body);
        await github.rest.issues.update({
          owner,
          repo,
          issue_number: issue.number,
          body: deferredBody,
          state: 'open',
        });
        issue.body = deferredBody;
      }
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
    reasonCode: 'unknown',
    reason,
    causeKey,
    runUrl,
    immediate,
  };
  if (!isDryRun()) await ensureLabels(github, context.repo.owner, context.repo.repo);
  let openIssues = isDryRun()
    ? []
    : await listOpenSiteHealthIssues(github, context.repo.owner, context.repo.repo);
  openIssues = await upsertFailIssue(github, context, core, row, layer, openIssues);
  return openIssues;
}

async function handlePassByCauseKey(github, context, core, causeKey, layer) {
  if (isDryRun()) {
    await writeSummary(core, `(dry-run) CI pass-streak 처리: ${causeKey}\n`);
    return;
  }
  const { owner, repo } = context.repo;
  const openIssues = await listOpenSiteHealthIssues(github, owner, repo);
  const issue = findIssueByCauseKey(openIssues, causeKey);
  if (!issue) return;

  const id = causeKey.split(':')[1] || 'ci';
  return handlePassForRun(
    github,
    context,
    core,
    { id, matchId: id },
    layer,
    openIssues,
    new Set(),
    new Set(),
  );
}

async function reportMissingResultFile(github, context, core, layer, runUrl) {
  const row = {
    id: '_missing',
    feature: '점검 결과',
    reasonCode: 'missing_result',
    reason: publicReason('missing_result'),
    causeKey: `${layer}:_missing:missing_result`,
    runUrl,
    immediate: true,
  };
  let openIssues = isDryRun()
    ? []
    : await listOpenSiteHealthIssues(github, context.repo.owner, context.repo.repo);
  return upsertFailIssue(github, context, core, row, layer, openIssues);
}

async function run({ github, context, core, resultFile, layer: layerHint = 'smoke' }) {
  const fs = require('node:fs');
  const { owner, repo } = context.repo;
  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : '';

  if (!fs.existsSync(resultFile)) {
    if (isDryRun()) {
      await writeSummary(
        core,
        `(dry-run) 결과 파일 없음 — 이슈 생성 예정 (${layerHint}:_missing:missing_result)\n`,
      );
      return;
    }
    await ensureLabels(github, owner, repo);
    await reportMissingResultFile(github, context, core, layerHint, runUrl);
    core.warning(`health result file missing: ${resultFile}`);
    return;
  }

  if (!isDryRun()) await ensureLabels(github, owner, repo);

  const payload = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  const layer = payload.layer || 'smoke';
  const payloadRunUrl = payload.runUrl || runUrl;
  let openIssues = isDryRun()
    ? []
    : await listOpenSiteHealthIssues(github, owner, repo);

  const results = payload.results || [];
  const failedCauseKeys = new Set();
  const failedMatchIds = new Set();

  for (const row of results) {
    if (row.status === 'fail') {
      if (row.causeKey) failedCauseKeys.add(row.causeKey);
      failedMatchIds.add(row.matchId || row.id);
    }
  }

  for (const row of results) {
    if (row.status !== 'fail') continue;
    const enriched = { ...row, runUrl: payloadRunUrl };
    openIssues = await upsertFailIssue(github, context, core, enriched, layer, openIssues);
  }

  for (const row of results) {
    if (row.status !== 'flaky') continue;
    const enriched = { ...row, runUrl: payloadRunUrl };
    openIssues = await upsertFlakyIssue(github, context, core, enriched, layer, openIssues);
  }

  const passByMatchId = new Map();
  for (const row of results) {
    if (row.status !== 'pass') continue;
    const mid = row.matchId || row.id;
    if (failedMatchIds.has(mid)) continue;
    if (!passByMatchId.has(mid)) passByMatchId.set(mid, row);
  }

  const passStreakAllowed = substantiveHealthResults(results, layer).length > 0;

  if (passStreakAllowed) {
    for (const row of passByMatchId.values()) {
      const enriched = { ...row, runUrl: payloadRunUrl };
      openIssues = await handlePassForRun(
        github,
        context,
        core,
        enriched,
        layer,
        openIssues,
        failedCauseKeys,
        failedMatchIds,
      );
    }
  }

  const presentMatchIds = new Set(results.map((r) => r.matchId || r.id));
  const layerTag = layerLabel(layer);

  if (passStreakAllowed) {
    const missingCauseKey = `${layer}:_missing:missing_result`;
    if (!failedCauseKeys.has(missingCauseKey)) {
      openIssues = await handlePassForRun(
        github,
        context,
        core,
        { id: '_missing', matchId: '_missing', runUrl: payloadRunUrl },
        layer,
        openIssues,
        failedCauseKeys,
        failedMatchIds,
      );
    }

    const orphanCandidates = openIssues.filter((issue) => {
      if (!issue.labels.some((l) => (typeof l === 'string' ? l : l.name) === layerTag)) {
        return false;
      }
      const causeKey = parseHealthKey(issue.body);
      if (!causeKey) return false;
      const [issueLayer, id] = causeKey.split(':');
      if (issueLayer !== layer || !id || id === '_missing') return false;
      if (presentMatchIds.has(id)) return false;
      if (failedMatchIds.has(id)) return false;
      if (failedCauseKeys.has(causeKey)) return false;
      return true;
    });

    for (const issue of orphanCandidates) {
      const causeKey = parseHealthKey(issue.body);
      const id = causeKey.split(':')[1];
      openIssues = await handlePassForRun(
        github,
        context,
        core,
        { id, matchId: id, runUrl: payloadRunUrl },
        layer,
        openIssues,
        failedCauseKeys,
        failedMatchIds,
        { orphanClose: true },
      );
    }
  }
}

module.exports = run;
module.exports.upsertSimple = upsertSimple;
module.exports.handlePassByCauseKey = handlePassByCauseKey;
module.exports.sanitizeText = sanitizeText;
module.exports.publicReason = publicReason;
module.exports.parseHealthKey = parseHealthKey;
module.exports.PASS_STREAK_CLOSE = PASS_STREAK_CLOSE;
module.exports.passStreakRequired = passStreakRequired;
module.exports.carryForwardStateMarkers = carryForwardStateMarkers;
module.exports.STATE_CHANGE_WINDOW_MS = STATE_CHANGE_WINDOW_MS;
module.exports.LAST_REOPEN_RE = LAST_REOPEN_RE;
module.exports.isDryRun = isDryRun;
module.exports.writeSummary = writeSummary;
module.exports.BOT_COMMENT_MARKER = BOT_COMMENT_MARKER;
module.exports.BOT_LOGIN = BOT_LOGIN;
module.exports.countRecentBotNotifyComments = countRecentBotNotifyComments;
module.exports.isInjectedSimPassRow = isInjectedSimPassRow;
module.exports.substantiveHealthResults = substantiveHealthResults;
module.exports.formatAutoCloseComment = formatAutoCloseComment;
module.exports.formatReopenComment = formatReopenComment;
module.exports.sanitizeRunUrlForComment = sanitizeRunUrlForComment;
module.exports.publicCheckId = publicCheckId;
module.exports.canCloseWithComment = canCloseWithComment;
module.exports.closeCountInWindow = closeCountInWindow;
module.exports.FLAP_DEFER_LINE = FLAP_DEFER_LINE;
