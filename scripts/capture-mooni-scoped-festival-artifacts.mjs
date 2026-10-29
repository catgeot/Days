#!/usr/bin/env node
/**
 * Deterministic MOONi scoped-festival artifacts (no live Gemini).
 * VITE_GATEO_MOONI_SCOPED_FESTIVAL=1
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ || {}),
  VITE_GATEO_MOONI_SCOPED_FESTIVAL: '1',
};

const { mergeMooniKoreaFestivalReply, buildMooniKoreaFestivalSystemHint, selectMooniKoreaFestivalCandidates } =
  await import('../src/shared/korea/mooniKoreaFestivalAssist.js');
const { readMooniLastChatId, persistMooniLastChatId } = await import('../src/pages/Home/lib/tripChatUtils.js');

const NOW = new Date(2026, 9, 26, 12, 0, 0);
const FIXTURE = [
  {
    contentId: '1718491',
    title: '설악문화제',
    eventStartDate: '20261002',
    eventEndDate: '20261004',
    addr1: '강원특별자치도 속초시',
  },
  {
    contentId: '900010',
    title: '서울 빛초롱축제',
    eventStartDate: '20261108',
    eventEndDate: '20261109',
    addr1: '서울특별시',
  },
];

function festivalAnswer(userText, locale = 'ko') {
  const { candidates } = selectMooniKoreaFestivalCandidates(FIXTURE, { userText, now: NOW });
  const hint = buildMooniKoreaFestivalSystemHint({
    userText,
    items: FIXTURE,
    locale,
    now: NOW,
  });
  const reply = mergeMooniKoreaFestivalReply('(모델 원문 생략 — 플래그 ON 0후보 치환)', {
    candidates,
    userText,
    locale,
    now: NOW,
  });
  return { hint: hint.trim(), reply: reply.trim(), candidateCount: candidates.length };
}

const sokcho = festivalAnswer('속초 이번주 축제');
const seoul = festivalAnswer('서울 이번주 축제');

const session = new Map();
const local = new Map();
globalThis.sessionStorage = {
  getItem: (k) => session.get(k) ?? null,
  setItem: (k, v) => session.set(k, v),
};
globalThis.localStorage = {
  getItem: (k) => local.get(k) ?? null,
  setItem: (k, v) => local.set(k, v),
};
persistMooniLastChatId('trip-seoul-42', null, { mooniPlaceContext: { slug: 'seoul', name: '서울' } });
const generalResume = readMooniLastChatId(null, 'general');
const seoulScoped = readMooniLastChatId(null, { mooniPlaceContext: { slug: 'seoul' } });

const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=390"/>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; width: 390px; box-sizing: border-box; background: #0b0f14; color: #e8ecf0; }
  h1 { font-size: 15px; margin: 0 0 8px; color: #7dd3fc; }
  h2 { font-size: 13px; margin: 20px 0 6px; color: #a5b4fc; }
  pre { white-space: pre-wrap; font-size: 12px; line-height: 1.45; background: #121820; padding: 10px; border-radius: 8px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
</style></head><body>
  <h1>VITE_GATEO_MOONI_SCOPED_FESTIVAL=1 (deterministic)</h1>
  <p class="meta">Live Gemini unavailable — hint + mergeMooniKoreaFestivalReply output · now=2026-10-26</p>
  <h2>속초 이번주 축제 (후보 ${sokcho.candidateCount}건)</h2>
  <pre>${escapeHtml(sokcho.reply)}</pre>
  <details><summary>시스템 힌트</summary><pre>${escapeHtml(sokcho.hint)}</pre></details>
  <h2>서울 이번주 축제 (후보 ${seoul.candidateCount}건)</h2>
  <pre>${escapeHtml(seoul.reply)}</pre>
  <details><summary>시스템 힌트</summary><pre>${escapeHtml(seoul.hint)}</pre></details>
</body></html>`;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const resumeHtml = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=390"/>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; width: 390px; background: #0b0f14; color: #e8ecf0; }
  h1 { font-size: 15px; color: #7dd3fc; }
  .ok { color: #86efac; } .dim { color: #94a3b8; font-size: 12px; }
  pre { background: #121820; padding: 10px; border-radius: 8px; font-size: 12px; }
</style></head><body>
  <h1>MOONi 재진입 — scope 분리</h1>
  <p class="dim">서울 place 대화 저장 후 general MOONi FAB</p>
  <pre>place:seoul → ${seoulScoped ?? '(null)'}
general scope → ${generalResume ?? '(null) — 새 대화'}</pre>
  <p class="ok">${generalResume ? 'FAIL: general이 서울 trip 복원' : 'PASS: general은 서울 chat 상속 안 함'}</p>
</body></html>`;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });
const tmpDir = join(outDir, '_mooni_scoped_html');
mkdirSync(tmpDir, { recursive: true });
writeFileSync(join(tmpDir, 'answers.html'), html, 'utf8');
writeFileSync(join(tmpDir, 'resume-scope.html'), resumeHtml, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

await page.goto(`file://${join(tmpDir, 'answers.html')}`);
await page.screenshot({
  path: join(outDir, 'mooni-scoped-festival-sokcho-seoul-390.png'),
  clip: { x: 0, y: 0, width: 390, height: 844 },
});

await page.goto(`file://${join(tmpDir, 'resume-scope.html')}`);
await page.screenshot({
  path: join(outDir, 'mooni-scoped-festival-general-no-seoul-resume-390.png'),
  clip: { x: 0, y: 0, width: 390, height: 844 },
});

await browser.close();
console.log('Wrote mooni-scoped-festival-* artifacts to', outDir);
