#!/usr/bin/env node
/**
 * 프라하 탐색 검색 선택 카드 mock — 390·1280 · Chromium·WebKit PNG.
 * node --import ./scripts/register-src-esm.mjs scripts/capture-explore-prague-search-thumb-mock.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  enrichSearchCandidateScenicMedia,
  hubAttractionSearchGroupTitle,
} from '../src/pages/Home/lib/koreaLocalScenicLists.js';
import { attractionToSuggestion, resolveCityAttractionHub } from '../src/pages/Home/lib/cityAttractionHubs.js';
import { isGenericPlaceOgImageUrl } from '../src/pages/Home/lib/placeSeoOg.js';
import {
  formatExploreSearchThumbnailCreditPlain,
  normalizeExploreSearchThumbnailCredit,
} from '../src/pages/Home/lib/exploreSearchThumbnailCredit.js';

const OUT_DIR = '/opt/cursor/artifacts';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function buildPragueCards() {
  const hub = resolveCityAttractionHub('prague');
  if (!hub?.attractions?.length) throw new Error('prague hub missing');
  const groupTitle = hubAttractionSearchGroupTitle(hub, 'ko');
  return hub.attractions.map((attraction) => {
    const base = attractionToSuggestion(hub, attraction);
    const enriched = enrichSearchCandidateScenicMedia(base);
    const thumb = String(enriched.imageUrl || enriched.thumbUrl || '').trim();
    if (thumb && isGenericPlaceOgImageUrl(thumb)) {
      throw new Error(`generic og thumb leaked for ${attraction.name}`);
    }
    return { ...enriched, groupTitle, showIcon: !thumb };
  });
}

function creditHtml(item) {
  const credit = normalizeExploreSearchThumbnailCredit(item.thumbnailCredit);
  if (!credit) return '';
  const label = formatExploreSearchThumbnailCreditPlain(credit, 'ko');
  const parts = label.split(' / ');
  const author = parts[0].replace(/^사진\s*/, '');
  const authorHref = esc(credit.photographerHref || '#');
  const unsplashHref = esc(credit.unsplashHref);
  return `<p class="credit" data-explore-search-thumbnail-credit=""><span>${esc(parts[0].split(/\s+/)[0])}</span> <a href="${authorHref}" target="_blank" rel="noopener noreferrer">${esc(author)}</a> <span>/</span> <a href="${unsplashHref}" target="_blank" rel="noopener noreferrer">Unsplash</a></p>`;
}

function cardHtml(item) {
  const thumbBlock = item.showIcon
    ? `<div class="thumb icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fbbf24" stroke-width="2"><path d="M3 21h18M6 21V9l6-4 6 4v12"/></svg></div>`
    : `<img class="thumb" src="${esc(item.imageUrl)}" alt="" />`;
  const credit = creditHtml(item);
  return `<article class="card">
  ${item.groupTitle ? `<p class="group">${esc(item.groupTitle)}</p>` : ''}
  <div class="row">
    ${thumbBlock}
    <div class="body">
      <span class="badge">명소</span>
      <h2>${esc(item.name)}</h2>
      <p class="loc">${esc(item.parentCity || '프라하')} · 체코</p>
    </div>
  </div>
  ${credit}
</article>`;
}

function pageHtml(width, cards) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>프라하 탐색 mock ${width}px</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#1a1410;color:#fff;font:14px/1.4 system-ui,sans-serif;width:${width}px;padding:12px}
  h1{font-size:13px;color:#9bb0c4;margin:0 0 10px;font-weight:600}
  .group{font-size:11px;font-weight:800;color:#fde68a;margin:8px 0 6px}
  .card{border:1px solid rgba(255,255,255,.25);border-radius:16px;background:#32281f;margin-bottom:8px;overflow:hidden}
  .row{display:flex;gap:12px;padding:12px;align-items:stretch}
  .thumb{width:80px;height:80px;border-radius:12px;object-fit:cover;flex-shrink:0;background:rgba(255,255,255,.08)}
  .thumb.icon{display:flex;align-items:center;justify-content:center}
  .badge{display:inline-block;font-size:10px;border:1px solid rgba(251,191,36,.5);color:#fde68a;border-radius:999px;padding:2px 8px;margin-bottom:6px}
  h2{font-size:15px;margin:0;font-weight:700}
  .loc{font-size:12px;color:rgba(255,255,255,.65);margin:4px 0 0}
  .credit{margin:0 12px 10px;display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;font-size:10px;line-height:1.35;color:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.25);border-radius:999px;background:rgba(255,255,255,.06);padding:3px 8px}
  .credit a{color:#7dd3fc;font-weight:600;text-decoration:underline;text-underline-offset:2px}
</style></head><body>
<h1>프라하 검색 — 선택 카드 (mock)</h1>
${cards.map(cardHtml).join('\n')}
</body></html>`;
}

async function capture(browserType, width, cards, suffix) {
  const { chromium, webkit } = await import('playwright');
  const launcher = browserType === 'webkit' ? webkit : chromium;
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height: 844 },
    deviceScaleFactor: 1,
  });
  await page.setContent(pageHtml(width, cards), { waitUntil: 'load' });
  const file = path.join(OUT_DIR, `explore-prague-search-cards-${width}-${suffix}.png`);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width, height: Math.min(844, 130 + cards.length * 118) },
  });
  await browser.close();
  return file;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cards = buildPragueCards();
  const paths = [];
  if (process.argv.includes('--only-390-chromium')) {
    paths.push(await capture('chromium', 390, cards, 'chromium'));
  } else {
    for (const [suffix, engine] of [
      ['chromium', 'chromium'],
      ['webkit', 'webkit'],
    ]) {
      paths.push(await capture(engine, 390, cards, suffix));
      paths.push(await capture(engine, 1280, cards, suffix));
    }
  }
  console.log(JSON.stringify({ cards: cards.length, captures: paths }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});