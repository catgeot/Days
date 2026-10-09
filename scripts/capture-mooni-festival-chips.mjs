/**
 * Real traveler route for festival MOONi chips.
 * Festival home → region chip → open festival → scroll the body → tap MOONi → ask.
 * Not a direct ?festival= URL. Live TourAPI data through the app.
 * Gemini: try the deployed edge; if it rejects the new chip id or is unreachable, mock the reply
 * and still save the local prompt the edge mirror would send.
 */
import { mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { renderMooniSystem } from '../supabase/functions/_shared/gemini/templates.js';
import { buildGeminiProxyMockBody } from '../e2e/gemini-proxy-mock-response.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'artifacts/mooni-festival-chips');
const previewBase = process.env.MOONI_CAPTURE_BASE || 'https://127.0.0.1:4173';
const GANGNEUNG_ID = '2930716';
const HONGCHEON_ID = '790124';

mkdirSync(outDir, { recursive: true });

const log = [];
function note(line) {
  log.push(line);
  console.log(line);
}

function mockAnswer(hint, locale) {
  const en = String(locale || '').slice(0, 2) === 'en';
  const facts = String(hint || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) =>
      /^- (제목|개요|프로그램|시간|요금|장소|주소|근처|기간|일정|GATEO|공식|Title|Overview|Program|Hours|Fee|Venue|Address|Nearby|Period|Dates|Official)/.test(
        line,
      ),
    )
    .map((line) => line.replace(/^- [^:]+:\s*/, '').trim())
    .filter(Boolean);
  const sentences = facts.map((bit) => (/[.!?。]$/.test(bit) ? bit : `${bit}.`));
  const next = en
    ? 'Next you can plan how to get there from ICN.'
    : '다음으로 가는 법을 정할 수 있습니다.';
  if (!sentences.length) {
    return en
      ? `Confirmed facts for this turn are the dates and the GATEO detail link in the session. ${next}`
      : `이 턴에서 확인된 사실은 세션의 기간과 GATEO 상세 링크입니다. ${next}`;
  }
  return `${sentences.join(' ')} ${next}`;
}

const gemini = {
  mode: 'not-called',
  status: null,
  error: null,
  promptPath: null,
};

async function probeGemini() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    gemini.mode = 'no-local-anon-key';
    note('gemini probe: anon key missing');
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${url}/functions/v1/gemini-proxy`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        task: 'mooni_chat',
        params: {
          locale: 'ko',
          persona: 'GENERAL',
          tier: 'fast',
          isMooni: true,
          locationName: 'MOONi',
          boundPlaceName: '',
          userText: '이번 주말에 국내 축제 하나만 짧게 알려줘',
          history: [],
          showPlannerHeader: false,
          koreaFestivalHint: '',
          cta: null,
          ctaPlace: '',
        },
      }),
    });
    gemini.status = response.status;
    const data = await response.json().catch(() => null);
    if (response.ok && data?.success && data?.text) {
      gemini.mode = 'live-reachable';
      note(`gemini probe: live HTTP ${response.status}, text length ${String(data.text).length}`);
    } else {
      gemini.mode = 'live-rejected';
      gemini.error = data?.error || data?.message || `http-${response.status}`;
      note(`gemini probe: HTTP ${response.status} error=${gemini.error}`);
    }
  } catch (error) {
    gemini.mode = 'unreachable';
    gemini.error = error?.name === 'AbortError' ? 'timeout' : String(error?.message || error);
    note(`gemini probe: ${gemini.error}`);
  } finally {
    clearTimeout(timer);
  }
}

async function installGeminiRoute(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const post = route.request().postDataJSON() || {};
    const params = post.params || {};
    if (post.task === 'mooni_chat') {
      const system = renderMooniSystem({
        locale: params.locale,
        persona: params.persona,
        locationName: params.locationName || '',
        boundPlaceName: params.boundPlaceName || '',
        isMooni: params.isMooni === true,
        tripSession: params.tripSession || null,
        chipId: params.chipId || null,
        chipFacts: params.facts || null,
        cta: params.cta || null,
        ctaPlace: params.ctaPlace || '',
        koreaFestivalHint: params.koreaFestivalHint || '',
        showPlannerHeader: params.showPlannerHeader === true,
      });
      const promptFile = join(outDir, `prompt-${params.chipId || 'typed'}-${params.locale || 'ko'}.txt`);
      writeFileSync(promptFile, system);
      gemini.promptPath = promptFile;
      note(`saved prompt ${promptFile} (${system.length} chars) chip=${params.chipId || 'none'}`);
    }

    let liveStatus = 0;
    let liveError = '';
    try {
      const response = await route.fetch({ timeout: 28000 });
      liveStatus = response.status();
      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      if (response.ok() && data?.success && data?.text) {
        gemini.mode = 'live-ui';
        gemini.status = liveStatus;
        await route.fulfill({
          status: liveStatus,
          contentType: 'application/json',
          body: text,
        });
        note(`gemini ui: live HTTP ${liveStatus}`);
        return;
      }
      liveError = data?.error || data?.message || `http-${liveStatus}`;
    } catch (error) {
      liveError = String(error?.message || error);
    }

    gemini.mode = 'mocked';
    gemini.status = liveStatus || null;
    gemini.error = liveError;
    note(`gemini ui mocked after ${liveError || 'empty'}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody(mockAnswer(params.koreaFestivalHint, params.locale), {
          modelUsed: 'mock-local-edge-not-redeployed',
        }),
      ),
    });
  });
}

async function shot(page, name) {
  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  note(`screenshot ${file}`);
  return file;
}

async function clickChip(page, pattern) {
  const button = page.getByRole('button', { name: pattern }).first();
  await button.scrollIntoViewIfNeeded();
  await button.click();
}

async function waitForCards(page) {
  await page.evaluate(() => window.localStorage.removeItem('days_guest_trips')).catch(() => {});
  await page.goto(`${previewBase}/korea`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-festival-id]').first().waitFor({ timeout: 90000 });
}

async function cardIds(page) {
  return page.locator('[data-festival-id]').evaluateAll((els) =>
    els.map((el) => ({
      id: el.getAttribute('data-festival-id') || '',
      text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 180),
    })),
  );
}

async function revealFestival(page, contentId, regionPattern) {
  await waitForCards(page);
  await clickChip(page, regionPattern);
  await page.waitForTimeout(400);
  let cards = await cardIds(page);
  if (cards.some((card) => card.id === contentId)) {
    return { via: `region ${regionPattern}`, cards };
  }
  await clickChip(page, /시간 대분류/);
  await clickChip(page, /가을|Autumn/);
  await clickChip(page, regionPattern);
  await page.waitForTimeout(500);
  cards = await cardIds(page);
  if (!cards.some((card) => card.id === contentId)) {
    throw new Error(
      `${contentId} not in live list after region/season chips. sample=${cards
        .slice(0, 8)
        .map((card) => card.id)
        .join(',')}`,
    );
  }
  return { via: `autumn + region ${regionPattern}`, cards };
}

async function openMooniFromList(page, contentId) {
  await page.evaluate(() => window.localStorage.removeItem('days_guest_trips'));
  await page.locator(`[data-festival-id="${contentId}"]`).first().click();
  const inline = page.locator('[data-festival-mooni-inline]');
  await inline.first().waitFor({ timeout: 30000 });
  await page.getByText(/개요|Overview/).first().waitFor({ timeout: 20000 }).catch(() => {});
  await page.locator('[data-festival-section="nearFood"], [data-festival-section="nearAttractions"]').first().waitFor({
    timeout: 20000,
  }).catch(() => {});
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-festival-section="nearFood"]');
    if (!el) return true;
    return !/불러오는|Loading/.test(el.innerText || '');
  }, null, { timeout: 25000 }).catch(() => {});
  await inline.first().scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const button = document.querySelector('[data-festival-mooni-inline]');
    const scroller = button?.closest('.overflow-y-auto') || document.querySelector('.overflow-y-auto');
    if (button && scroller) {
      const top = button.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTop = Math.max(0, top - 80);
    }
  });
  await page.waitForTimeout(400);
  await inline.first().click();
  try {
    await page.getByTestId('mooni-festival-opening').waitFor({ timeout: 20000 });
  } catch (error) {
    const debug = await page.evaluate(() => ({
      locale: window.localStorage.getItem('gateo.locale'),
      trips: (window.localStorage.getItem('days_guest_trips') || '').slice(0, 180),
      lang: document.documentElement.lang,
      buttons: [...document.querySelectorAll('button')].slice(0, 30).map((el) => (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').slice(0, 80)),
    }));
    note(`opening missing ${JSON.stringify(debug)}`);
    await shot(page, 'debug-opening-missing');
    throw error;
  }
}

async function captureFestival(page, { id, region, slug }) {
  const found = await revealFestival(page, id, region);
  note(`${slug} ${id} via ${found.via}`);
  await shot(page, `${slug}-list`);
  await openMooniFromList(page, id);
  await shot(page, `${slug}-opening`);
  const replies = page.locator('[data-testid="mooni-quick-replies"]:visible').first();
  await replies.waitFor({ timeout: 20000 });
  await replies.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    for (const row of document.querySelectorAll('[data-testid="mooni-quick-replies"] .overflow-x-auto')) {
      row.scrollLeft = 0;
    }
  });
  await shot(page, `${slug}-chips`);
  return found;
}

async function closeChat(page) {
  const close = page.getByRole('button', { name: /채팅 닫기|Close chat/ });
  if (await close.count()) await close.first().click();
}

async function newPage(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  });
  await installGeminiRoute(context);
  const page = await context.newPage();
  return { context, page };
}

async function captureGeneral(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${previewBase}/place/miyakojima`, { waitUntil: 'domcontentloaded' });
  const mooni = page.locator('.place-header-mooni-btn');
  await mooni.first().waitFor({ timeout: 30000 });
  await mooni.first().click();
  await page.locator('[data-testid="mooni-quick-replies"]:visible').first().waitFor({ timeout: 20000 });
  await shot(page, '390-general-l1');
  await page.getByRole('button', { name: /출발 준비/ }).click();
  await page.getByRole('button', { name: /현지 교통/ }).waitFor({ timeout: 10000 });
  await shot(page, '390-general-prep');
}

async function main() {
  await probeGemini();
  const browser = await chromium.launch({ headless: true });
  if (process.env.CAPTURE_ONLY === 'general') {
    const { page } = await newPage(browser, { width: 390, height: 844 });
    await captureGeneral(page);
    writeFileSync(join(outDir, 'capture-log.txt'), log.join('\n'));
    const artifactDir = '/opt/cursor/artifacts/mooni-festival-chips';
    mkdirSync(artifactDir, { recursive: true });
    cpSync(outDir, artifactDir, { recursive: true });
    await browser.close();
    note('general capture done');
    return;
  }
  const { context, page } = await newPage(browser, { width: 390, height: 844 });

  const gangneung = await captureFestival(page, {
    id: GANGNEUNG_ID,
    region: /강원/,
    slug: '390-gangneung',
  });
  const opening = await page.getByTestId('mooni-festival-opening').innerText();
  writeFileSync(join(outDir, 'gangneung-opening.txt'), opening);

  await page.getByRole('button', { name: /해외에서 오시나요/ }).click();
  await page.getByRole('button', { name: /입국·비자/ }).waitFor({ timeout: 10000 });
  await shot(page, '390-gangneung-overseas');
  await page.getByRole('button', { name: '다른 주제' }).click();
  await page.getByRole('button', { name: /볼거리·분위기/ }).click();
  await page.waitForTimeout(1500);
  await shot(page, '390-gangneung-ask');
  await closeChat(page);

  await page.goto(`${previewBase}/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /English로 전환/ }).click({ timeout: 30000 });
  await page.waitForFunction(() => window.localStorage.getItem('gateo.locale') === 'en', null, {
    timeout: 10000,
  });
  note('locale switched to en from the home toggle');
  await revealFestival(page, GANGNEUNG_ID, /강원|Gangwon/);
  await openMooniFromList(page, GANGNEUNG_ID);
  await shot(page, '390-gangneung-en-opening');
  await page.locator('[data-testid="mooni-quick-replies"]:visible').first().scrollIntoViewIfNeeded();
  await shot(page, '390-gangneung-en-chips');
  const enOpening = await page.getByTestId('mooni-festival-opening').innerText();
  writeFileSync(join(outDir, 'gangneung-opening-en.txt'), enOpening);
  await closeChat(page);

  await page.goto(`${previewBase}/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Switch to Korean|한국어/ }).click({ timeout: 20000 }).catch(async () => {
    await page.evaluate(() => window.localStorage.setItem('gateo.locale', 'ko'));
  });

  let hongcheonNote = '';
  try {
    await captureFestival(page, { id: HONGCHEON_ID, region: /강원/, slug: '390-hongcheon' });
    hongcheonNote = 'opened 790124';
  } catch (error) {
    hongcheonNote = String(error.message || error);
    note(hongcheonNote);
  }

  await page.goto(`${previewBase}/korea`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-festival-id]').first().waitFor({ timeout: 90000 });
  const regionButtons = [/제주/, /부산/, /서울/, /경기/, /전남/, /경남/];
  let third = null;
  for (const region of regionButtons) {
    await clickChip(page, region).catch(() => {});
    await page.waitForTimeout(300);
    const cards = await cardIds(page);
    const pick = cards.find((card) => card.id && card.id !== GANGNEUNG_ID && card.id !== HONGCHEON_ID);
    if (pick) {
      third = { ...pick, region: region.source };
      break;
    }
  }
  if (!third) throw new Error('no third-province festival in the live list');
  note(`third festival ${third.id} ${third.text} region ${third.region}`);
  await captureFestival(page, { id: third.id, region: new RegExp(third.region), slug: '390-third' });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => window.localStorage.setItem('gateo.locale', 'ko'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await captureFestival(page, { id: GANGNEUNG_ID, region: /강원/, slug: '1280-gangneung' });

  await captureGeneral(page);

  const summary = {
    route: 'festival home → region or season chip → open festival → scroll body → MOONi → ask',
    gangneung: { id: GANGNEUNG_ID, via: gangneung.via },
    hongcheon: hongcheonNote,
    third,
    gemini,
    openingExcerpt: opening.slice(0, 500),
    enOpeningExcerpt: enOpening.slice(0, 500),
  };
  writeFileSync(join(outDir, 'capture-results.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(outDir, 'capture-log.txt'), log.join('\n'));
  const artifactDir = '/opt/cursor/artifacts/mooni-festival-chips';
  mkdirSync(artifactDir, { recursive: true });
  cpSync(outDir, artifactDir, { recursive: true });
  await browser.close();
  note('capture done');
}

main().catch((error) => {
  console.error(error);
  writeFileSync(join(outDir, 'capture-log.txt'), `${log.join('\n')}\n${error?.stack || error}`);
  process.exit(1);
});
