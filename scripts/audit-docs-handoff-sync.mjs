#!/usr/bin/env node
/**
 * 핸드오프 문서 — feature ↔ origin/main 동기화 감사
 *
 *   npm run audit:docs-handoff-sync
 *
 * feature(`cursor/*`)에서 origin/main의 plans 핸드오프가 merge되지 않았으면 FAIL.
 * 세션 시작(merge main 후) · 세션 종료(merge main 후)에 실행.
 */
import { execSync } from 'node:child_process';

const DOCS_GLOBS = ['plans/feature-handoff-index.md', 'plans/docs-on-main-workflow.md'];

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf8', cwd: process.cwd() }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return '';
  }
}

function isFeatureBranch(branch) {
  return branch.startsWith('cursor/');
}

function main() {
  tryGit('fetch origin main');
  const branch = tryGit('rev-parse --abbrev-ref HEAD');
  if (!branch || branch === 'HEAD') {
    console.error('FAIL  could not resolve current branch');
    process.exit(1);
  }

  if (!isFeatureBranch(branch)) {
    console.log(`OK    audit:docs-handoff-sync — skip (branch=${branch}, not cursor/*)`);
    process.exit(0);
  }

  const behind = Number(
    tryGit(`rev-list --count HEAD..origin/main -- ${DOCS_GLOBS.join(' ')}`) || '0',
  );
  if (behind > 0) {
    console.error(
      `FAIL  ${branch}: origin/main has ${behind} handoff doc commit(s) not merged into feature`,
    );
    console.error('      fix: git fetch origin && git checkout ' + branch + ' && git merge origin/main');
    console.error('      see plans/docs-on-main-workflow.md §충돌 방지');
    process.exit(1);
  }

  const plansAhead = Number(tryGit(`rev-list --count origin/main..HEAD -- plans/`) || '0');
  if (plansAhead > 0) {
    console.warn(
      `WARN  ${branch}: ${plansAhead} commit(s) touch plans/ on feature but not on origin/main`,
    );
    console.warn('      prefer: plans/** 커밋은 main에서만 (docs-on-main-workflow §충돌 방지)');
  }

  console.log(`OK    audit:docs-handoff-sync — ${branch} includes origin/main handoff docs`);
}

main();
