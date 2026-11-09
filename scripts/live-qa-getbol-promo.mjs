#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.LIVE_QA_BASE || 'https://www.gateo.kr';

async function gotoHome(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (page.url().startsWith('chrome-error')) {
    await page.goto(BASE.replace('https://', 'http://'), {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
  }
}
const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });

const QUERIES = ['갯벌', '한국의 갯벌', '서천갯벌', '순천만', '신안갯벌'];

async function clipShot(page, width, basename) {
  const height = width >= 1000 ? 900 : 844;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(OUT, `${basename}-${width}.png`),
    clip: { x: 0, y: 0, width, height },
  });
}

async function openSearch(page) {
  const searchBtn = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i })
    .first();
  await searchBtn.waitFor({ state: 'visible', timeout: 60000 });
  await searchBtn.click();
  await page.waitForURL(/\/explore/, { timeout: 30000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.waitFor({ state: 'visible', timeout: 20000 });
  return input;
}

async function runQuery(browser, query) {
  const ctx = await browser.newContext({
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('gateo.locale', 'ko');
    } catch (_) {}
  });
  const page = await ctx.newPage();
  const slug = query.replace(/\s+/g, '-');
  const result = {
    query,
    searchCards: [],
    cardClick: 'SKIP',
    detail: { overview: 'SKIP', photos: 'SKIP', attractions: 'SKIP', info: 'SKIP' },
    mooni: 'SKIP',
    notes: [],
  };

  try {
    await gotoHome(page);
    await page.waitForTimeout(2000);
    await clipShot(page, 390, `live-home-${slug}`);

    const input = await openSearch(page);
    await input.fill('');
    await input.fill(query);
    await page.waitForTimeout(1200);

    const suggestions = page
      .locator('[data-search-popover] button')
      .filter({ hasNotText: 'MOONi' });
    let texts = [];
    const count = await suggestions.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 12); i++) {
        const t = (await suggestions.nth(i).innerText()).replace(/\s+/g, ' ').trim();
        if (t) texts.push(t.slice(0, 120));
      }
    } else {
      const listText = await page.locator('body').innerText();
      const lines = listText.split('\n').filter((l) => /갯벌|순천|고창|신안|서천|습지|유네스코|자연유산/i.test(l));
      texts = lines.slice(0, 12).map((l) => l.trim().slice(0, 120));
    }
    result.searchCards = texts;
    await clipShot(page, 390, `live-search-${slug}`);
    await clipShot(page, 1280, `live-search-${slug}`);

    const pick = page
      .locator('[data-search-popover] button')
      .filter({ hasNotText: 'MOONi' })
      .filter({ hasText: /고창\s*갯벌|순천만습지|유부도|증도|서천갯벌|신안|자연유산/i })
      .first();
    if (await pick.isVisible().catch(() => false)) {
      await pick.click();
      await page.waitForTimeout(2500);
      result.cardClick = 'PASS';
      const body = await page.locator('main, [class*="place"], #root').first().innerText().catch(() => '');
      result.detail.overview = /개요|소개|갯벌|습지|유네스코/.test(body) ? 'PASS' : 'FAIL';
      result.detail.photos =
        (await page.locator('img[src*="visitkorea"], img[src*="khs"], img[src*="gateo"]').count()) > 0
          ? 'PASS'
          : 'FAIL';
      result.detail.attractions = /볼거리|명소|주변|nearby/i.test(body) ? 'PASS' : 'FAIL';
      result.detail.info = /안내|information|주소|문의/i.test(body) ? 'PASS' : 'FAIL';
      await clipShot(page, 390, `live-detail-${slug}`);
      await clipShot(page, 1280, `live-detail-${slug}`);

      const mooni = page.locator('.place-header-mooni-btn, button:has-text("무니"), button:has-text("MOONi")').first();
      if (await mooni.isVisible().catch(() => false)) {
        await mooni.click();
        await page.waitForTimeout(1500);
        const chat = page.locator('form input[type="text"]:visible, [class*="mooni"]').first();
        result.mooni = (await chat.isVisible().catch(() => false)) ? 'PASS' : 'FAIL';
        await clipShot(page, 390, `live-mooni-${slug}`);
        await clipShot(page, 1280, `live-mooni-${slug}`);
      } else {
        result.mooni = 'FAIL';
      }
    } else {
      result.cardClick = texts.length ? 'PARTIAL' : 'FAIL';
      result.notes.push('no tidal-flat card clicked');
    }
  } catch (e) {
    result.notes.push(String(e?.message || e));
    result.cardClick = 'FAIL';
  } finally {
    await ctx.close();
  }
  return result;
}

const browser = await chromium.launch({ headless: true });
const rows = [];
for (const q of QUERIES) {
  rows.push(await runQuery(browser, q));
}
await browser.close();

const md = ['# 라이브 QA — 한국의 갯벌 홍보 (PROD)', '', `Base: ${BASE}`, '', '| 검색어 | 카드 | 클릭 | 개요 | 사진 | 볼거리 | 안내 | 무니 | 비고 |', '|---|---|---|---|---|---|---|---|---|'];
for (const r of rows) {
  const cards = r.searchCards.length ? `${r.searchCards.length}건` : '0';
  const note = r.notes.join('; ') || (r.searchCards[0] ? r.searchCards[0] : '—');
  md.push(
    `| ${r.query} | ${cards} | ${r.cardClick} | ${r.detail.overview} | ${r.detail.photos} | ${r.detail.attractions} | ${r.detail.info} | ${r.mooni} | ${note} |`,
  );
}
const checklistName =
  process.env.LIVE_QA_CHECKLIST || (BASE.includes('gateo.kr') ? 'live-qa-checklist-prod-getbol.md' : 'live-qa-checklist-local-getbol.md');
writeFileSync(join(OUT, checklistName), md.join('\n'), 'utf8');
console.log(JSON.stringify(rows, null, 2));
