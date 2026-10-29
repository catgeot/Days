#!/usr/bin/env node
/**
 * MOONi scoped-festival QA artifacts — live festivalWindow (anon) + deterministic merge.
 * VITE_GATEO_MOONI_SCOPED_FESTIVAL=1 · now = 2026-10-29 KST
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fetchKoreaFestivalsRolling12ForNode } from './lib/fetchKoreaFestivalsRolling12ForNode.mjs';

globalThis.__VITE_ENV__ = {
  ...(globalThis.__VITE_ENV__ || {}),
  VITE_GATEO_MOONI_SCOPED_FESTIVAL: '1',
};

const {
  mergeMooniKoreaFestivalReply,
  buildMooniKoreaFestivalSystemHint,
  selectMooniKoreaFestivalCandidates,
  selectMooniKoreaFestivalUpcomingFallback,
  GATEO_KOREA_FESTIVAL_BASE,
} = await import('../src/shared/korea/mooniKoreaFestivalAssist.js');
const { readMooniLastChatId, persistMooniLastChatId } = await import('../src/pages/Home/lib/tripChatUtils.js');

const NOW = new Date('2026-10-29T12:00:00+09:00');
const NOW_LABEL = '2026-10-29 (KST) · 이번 주 10.26–11.01';

const live = await fetchKoreaFestivalsRolling12ForNode({ now: NOW, force: true });
if (!live.ok || !live.items.length) {
  console.error('festivalWindow fetch failed:', live.error || 'empty items');
  process.exit(1);
}

function festivalAnswer(userText, locale = 'ko') {
  const picked = selectMooniKoreaFestivalCandidates(live.items, { userText, now: NOW });
  const upcomingFallback =
    !picked.candidates.length
      ? selectMooniKoreaFestivalUpcomingFallback(live.items, { userText, now: NOW }).candidates
      : [];
  const hint = buildMooniKoreaFestivalSystemHint({
    userText,
    items: live.items,
    locale,
    now: NOW,
  });
  const modelStub =
    picked.candidates.length > 0
      ? '(Preview Gemini 생략 — 아래 «최종 답변»은 mergeMooniKoreaFestivalReply가 모델 답변에 GATEO 후보 링크를 보강한 결과입니다.)'
      : '(Preview Gemini 생략 — 후보 0건이면 merge가 모델 답변을 치환합니다.)';
  const reply = mergeMooniKoreaFestivalReply(modelStub, {
    candidates: picked.candidates,
    userText,
    locale,
    now: NOW,
    upcomingFallback,
  });
  const candidateLines = picked.candidates.map(
    (c) => `• ${c.title} (${c.periodLabel}) · ${c.url}`,
  );
  return {
    hint: hint.trim(),
    reply: reply.trim(),
    candidateLines,
    candidateCount: picked.candidates.length,
    upcomingFallback,
  };
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sectionHtml(title, data) {
  const candidatesBlock = data.candidateCount
    ? `<h3>후보 ${data.candidateCount}건 (selectMooniKoreaFestivalCandidates)</h3><pre>${escapeHtml(data.candidateLines.join('\n'))}</pre>`
    : `<h3>후보 0건</h3><p class="dim">upcoming fallback ${data.upcomingFallback?.length || 0}건</p>`;
  return `
  <section>
    <h2>${escapeHtml(title)}</h2>
    ${candidatesBlock}
    <h3>시스템 힌트</h3>
    <pre>${escapeHtml(data.hint || '(힌트 없음)')}</pre>
    <h3>최종 답변 (mergeMooniKoreaFestivalReply)</h3>
    <pre>${escapeHtml(data.reply)}</pre>
  </section>`;
}

const pageCss = `
  body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; width: 390px; box-sizing: border-box; background: #0b0f14; color: #e8ecf0; }
  h1 { font-size: 15px; margin: 0 0 8px; color: #7dd3fc; }
  h2 { font-size: 14px; margin: 16px 0 8px; color: #a5b4fc; }
  h3 { font-size: 12px; margin: 12px 0 4px; color: #cbd5e1; }
  pre { white-space: pre-wrap; font-size: 11px; line-height: 1.45; background: #121820; padding: 10px; border-radius: 8px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 8px; line-height: 1.4; }
  section { border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 12px; }
`;

function wrapPage(body) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=390"/><style>${pageCss}</style></head><body>${body}</body></html>`;
}

const meta = `<h1>VITE_GATEO_MOONI_SCOPED_FESTIVAL=1</h1>
<p class="meta">Live festivalWindow ${live.items.length}건 · ${NOW_LABEL}<br/>목록 SSOT: fetchKoreaFestivalsRolling12 (tourapi-proxy anon)<br/>Gemini: VM Origin 제한으로 미호출 — 힌트·후보·merge만 캡처</p>`;

const sokchoHtml = wrapPage(meta + sectionHtml('속초 이번주 축제', sokcho));
const seoulHtml = wrapPage(meta + sectionHtml('서울 이번주 축제', seoul));

const resumeHtml = wrapPage(`
  <h1>MOONi 재진입 — scope 분리</h1>
  <p class="meta">${NOW_LABEL}</p>
  <p class="dim" style="font-size:12px;color:#94a3b8">서울 place 대화 저장 후 general MOONi FAB</p>
  <pre>place:seoul → ${seoulScoped ?? '(null)'}
general scope → ${generalResume ?? '(null) — 새 대화'}</pre>
  <p style="color:#86efac;font-size:13px">${generalResume ? 'FAIL: general이 서울 trip 복원' : 'PASS: general은 서울 chat 상속 안 함'}</p>
  <p class="meta">축제 목록 링크 SSOT: ${GATEO_KOREA_FESTIVAL_BASE}</p>
`);

const outDir = '/opt/cursor/artifacts';
const tmpDir = join(outDir, '_mooni_scoped_html');
mkdirSync(tmpDir, { recursive: true });
writeFileSync(join(tmpDir, 'sokcho.html'), sokchoHtml, 'utf8');
writeFileSync(join(tmpDir, 'seoul.html'), seoulHtml, 'utf8');
writeFileSync(join(tmpDir, 'resume-scope.html'), resumeHtml, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

async function shot(fileName, htmlName) {
  await page.goto(`file://${join(tmpDir, htmlName)}`);
  await page.screenshot({
    path: join(outDir, fileName),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

await shot('mooni-scoped-festival-sokcho-390.png', 'sokcho.html');
await shot('mooni-scoped-festival-seoul-390.png', 'seoul.html');
await shot('mooni-scoped-festival-general-no-seoul-resume-390.png', 'resume-scope.html');

await browser.close();
console.log('sokcho candidates:', sokcho.candidateCount, 'seoul candidates:', seoul.candidateCount);
console.log('Wrote artifacts to', outDir);
