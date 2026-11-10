import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { micromark } from 'micromark';
import mooniRemarkGfm, { mooniRemarkGfmHtml } from '../src/components/chat/mooniRemarkGfm.js';
import { getMooniModelMarkdownForRender } from '../src/pages/Home/lib/mooniModelMessageText.js';

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts';
const PROD_TABLE =
  '구분 | 괌 (Guam) | 오키나와 (Okinawa) | 팔라우 (Palau) | 보홀 (Bohol) : | : | : | : | : 주요 매력 | 쇼핑, 휴양, 가족 친화적 | 드라이브, 미식, 역사 탐방 | 최고의 다이빙 및 스노클링 | 자연 경관, 돌고래 투어 분위기 | 세련되고 편리한 휴양지 | 일본 감성의 여유로운 섬 | 원시 자연 그대로의 평화 | 자연과 어우러진 이동 편의 | 렌터카 선호, 교통 편리 | 렌터카 필수 | 투어 위주 이동 | 렌터카/툭툭 이동 추천 대상 | 쇼핑과 휴식을 중시하는 커플 | 먹거리와 문화 체험 선호 커플 | 바다 속 풍경을 사랑하는 커플 | 이색적인 자연 체험 선호 커플';
const UDO_BOLD = '우도에는 ** 천진항과 ** 하우목동항 ** 이 있어요';

function renderMooniGfm(markdown) {
  const store = {};
  mooniRemarkGfm.call({ data: () => store });
  return micromark(markdown, {
    extensions: store.micromarkExtensions,
    htmlExtensions: [mooniRemarkGfmHtml({ singleTilde: false })],
  });
}

const mdTable = getMooniModelMarkdownForRender(PROD_TABLE, { stripPhantomTicketMention: true });
const mdBold = getMooniModelMarkdownForRender(UDO_BOLD, { stripPhantomTicketMention: true });
const tableHtml = renderMooniGfm(mdTable);
const boldHtml = renderMooniGfm(mdBold);

if (!tableHtml.includes('<table')) {
  throw new Error('expected GFM table in rendered HTML');
}
if (!boldHtml.includes('<strong>천진항과</strong>') || !boldHtml.includes('<strong>하우목동항</strong>')) {
  throw new Error('expected both ferry bold labels');
}

await mkdir(outDir, { recursive: true });
const htmlPath = path.join(outDir, 'mooni-markdown-fix-mock.html');
await writeFile(
  htmlPath,
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><style>
body{margin:0;background:#111827;font:16px/1.6 system-ui,sans-serif;color:#e5e7eb}
.bubble{max-width:36rem;margin:16px;padding:16px;background:#1f2937;border-radius:16px}
.mooni-chat-markdown table{border-collapse:collapse;width:100%;font-size:14px}
.mooni-chat-markdown th,.mooni-chat-markdown td{border:1px solid #374151;padding:6px 8px}
.mooni-chat-markdown th{background:#111827}
.mooni-chat-markdown strong{color:#fff}
h2{font-size:12px;color:#22d3ee;margin:0 0 8px;text-transform:uppercase}
</style></head><body>
<section id="table"><h2>괌 compare table (11/10)</h2><div class="bubble mooni-chat-markdown">${tableHtml}</div></section>
<section id="bold"><h2>우도 bold (11/9)</h2><div class="bubble mooni-chat-markdown">${boldHtml}</div></section>
</body></html>`,
  'utf8',
);

const browser = await chromium.launch();
for (const { width, height, suffix } of [
  { width: 390, height: 844, suffix: '390' },
  { width: 1280, height: 800, suffix: '1280' },
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
  const tableBox = await page.locator('#table').boundingBox();
  if (tableBox) {
    await page.screenshot({
      path: path.join(outDir, `prod-guam-compare-${suffix}.png`),
      clip: {
        x: 0,
        y: Math.max(0, Math.floor(tableBox.y)),
        width: Math.min(width, 390),
        height: Math.min(height, Math.ceil(tableBox.height) + 8),
      },
    });
  }
  const boldBox = await page.locator('#bold').boundingBox();
  if (boldBox) {
    await page.screenshot({
      path: path.join(outDir, `udo-spaced-bold-${suffix}.png`),
      clip: {
        x: 0,
        y: Math.max(0, Math.floor(boldBox.y)),
        width: Math.min(width, 390),
        height: Math.min(200, Math.ceil(boldBox.height) + 8),
      },
    });
  }
  await page.close();
}
await browser.close();
console.log(`artifacts → ${outDir}`);
