'use strict';

function kstParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = fmt.format(date).split('-').map(Number);
  return { y, m, d, date };
}

function isoWeekKst(date = new Date()) {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const day = utc.getDay() || 7;
  utc.setDate(utc.getDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getFullYear(), 0, 1));
  const week = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
  return { year: utc.getFullYear(), week };
}

function sevenDaysAgoIso() {
  const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function countableRuns(runs) {
  return runs.filter((r) => r.conclusion && r.conclusion !== 'skipped');
}

async function listRuns(github, owner, repo, workflowId, createdGte) {
  const runs = [];
  let page = 1;
  for (;;) {
    const res = await github.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowId,
      branch: 'main',
      per_page: 100,
      page,
      created: `>=${createdGte.slice(0, 10)}`,
    });
    runs.push(...res.data.workflow_runs.filter((r) => r.created_at >= createdGte));
    if (res.data.workflow_runs.length < 100) break;
    page += 1;
  }
  return runs;
}

function passRate(runs) {
  const eligible = countableRuns(runs);
  if (eligible.length === 0) return '— (run 없음)';
  const ok = eligible.filter((r) => r.conclusion === 'success').length;
  return `${Math.round((ok / eligible.length) * 1000) / 10}% (${ok}/${eligible.length})`;
}

async function smokeJobRates(github, owner, repo, runs) {
  const jobs = { probe: [], pages: [] };
  for (const run of countableRuns(runs)) {
    let page = 1;
    for (;;) {
      const res = await github.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: run.id,
        per_page: 100,
        page,
      });
      for (const job of res.data.jobs) {
        if (job.conclusion === 'skipped') continue;
        if (job.name === 'probe') jobs.probe.push(job);
        if (job.name === 'pages') jobs.pages.push(job);
      }
      if (res.data.jobs.length < 100) break;
      page += 1;
    }
  }
  const toRun = (list) =>
    list.map((j) => ({
      conclusion: j.conclusion === 'success' ? 'success' : 'failure',
    }));
  return {
    probe: passRate(toRun(jobs.probe)),
    pages: passRate(toRun(jobs.pages)),
  };
}

async function listOpenHealthIssues(github, owner, repo, labels) {
  const all = [];
  for (const label of labels) {
    let page = 1;
    for (;;) {
      const res = await github.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        labels: label,
        per_page: 100,
        page,
      });
      all.push(...res.data.filter((i) => !i.pull_request));
      if (res.data.length < 100) break;
      page += 1;
    }
  }
  const seen = new Set();
  return all.filter((i) => {
    if (seen.has(i.number)) return false;
    seen.add(i.number);
    return true;
  });
}

async function run({ github, context, core }) {
  const reportIssues = require('./report-issues.cjs');
  const dry = reportIssues.isDryRun();
  const { owner, repo } = context.repo;
  const createdGte = sevenDaysAgoIso();
  const { year, week } = isoWeekKst();
  const weekTag = `${year}-W${String(week).padStart(2, '0')}`;

  let md = `# gateo 사이트 건강 주간 요약 (${weekTag})\n\n`;
  md += `기간: 지난 7일 (main, KST 기준 집계 · skipped run 제외)\n\n`;

  if (dry) {
    md += `(dry-run) Actions API·이슈 API 호출 생략\n\n`;
    await reportIssues.writeSummary(core, md);
    return { md, weekTag, dry: true };
  }

  const wfSmoke = await github.rest.actions.listRepoWorkflows({ owner, repo });
  const findId = (name) => wfSmoke.data.workflows.find((w) => w.name === name || w.path.endsWith(name))?.id;

  const smokeId = findId('Smoke Health');
  const e2eId = findId('E2E Health');
  const ciId = findId('CI');

  const smokeRuns = smokeId ? await listRuns(github, owner, repo, smokeId, createdGte) : [];
  const e2eRuns = e2eId ? await listRuns(github, owner, repo, e2eId, createdGte) : [];
  const ciRuns = ciId ? await listRuns(github, owner, repo, ciId, createdGte) : [];
  const smokeJobs = smokeRuns.length ? await smokeJobRates(github, owner, repo, smokeRuns) : { probe: '—', pages: '—' };

  md += `## 워크플로 통과율\n\n`;
  md += `| 워크플로 | 통과율 |\n|---|---|\n`;
  md += `| Smoke probe | ${smokeJobs.probe} |\n`;
  md += `| Smoke pages | ${smokeJobs.pages} |\n`;
  md += `| E2E Health | ${passRate(e2eRuns)} |\n`;
  md += `| CI (main) | ${passRate(ciRuns)} |\n\n`;

  md += `## 데이터 건강·사용량 추이\n\n`;
  md += `PR-2 이후 상태(정상·주의·초과)만 표시 — **수치 없음**\n\n`;

  const openIssues = await listOpenHealthIssues(github, owner, repo, [
    'health:fail',
    'health:suspect',
    'health:flaky',
  ]);

  md += `## 열린 site-health 이슈 (${openIssues.length})\n\n`;
  if (openIssues.length === 0) {
    md += `- 없음\n`;
  } else {
    for (const issue of openIssues.slice(0, 30)) {
      md += `- [#${issue.number} ${issue.title}](${issue.html_url})\n`;
    }
  }

  await reportIssues.writeSummary(core, `${md}\n`);

  const prevWeekly = await github.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: 'health:weekly',
    per_page: 20,
  });
  for (const issue of prevWeekly.data) {
    await github.rest.issues.update({
      owner,
      repo,
      issue_number: issue.number,
      state: 'closed',
    });
  }

  const fs = require('node:fs');
  const artifactName = `weekly-health-${weekTag}.md`;
  fs.mkdirSync('health', { recursive: true });
  fs.writeFileSync(`health/${artifactName}`, md, 'utf8');

  await github.rest.issues.create({
    owner,
    repo,
    title: `[site-health] 주간 요약 ${weekTag}`,
    body: `${md}\n\n<!-- health-weekly: ${weekTag} -->`,
    labels: ['site-health', 'health:weekly'],
  });

  return { md, weekTag, artifactName };
}

module.exports = run;
