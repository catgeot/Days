/**
 * Manual WebKit 390 walk: home → festival chip → region chip → festival → 가는 법 → MOONi.
 * Calls the live transport-proxy. Not part of CI.
 *
 *   DEV server on http://127.0.0.1:5173
 *   node scripts/festival-access-card-shots.mjs
 */
import { mkdirSync } from 'node:fs';
import { webkit } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';
const outDir = process.env.FESTIVAL_ACCESS_SHOTS_DIR || '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });

const targets = [
  { id: 'gangneung', region: '강원', title: /강릉 국수/ },
  { id: 'hampyeong', region: '전남', title: /국향대전/ },
  { id: 'masan', region: '경남', title: /마산가고파|가고파국화/ },
];

function shot(page, name) {
  return page.screenshot({ path: `${outDir}/${name}.png` });
}

async function dismissHint(page) {
  const close = page.getByRole('button', { name: /^닫기$|^Close$/ }).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  }
}

async function openKoreaFromHome(page, { captureHome = false, label = 'flow' } = {}) {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  const expand = page.getByRole('button', { name: /바로가기 메뉴 펼치기/ });
  await expand.waitFor({ timeout: 30_000 });
  if (captureHome) await shot(page, `${label}-00-home`);
  await expand.click();
  if (captureHome) await shot(page, `${label}-01-chips`);
  await page.locator('a[href="/korea"]:visible').first().click();
  await page.getByRole('heading', { name: /한국의 축제|Korea festivals/ }).waitFor({ timeout: 60_000 });
  await dismissHint(page);
}

async function openFestival(page, target) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const region = page.locator('header').getByRole('button', { name: new RegExp(`^${target.region}(?:\\s|$)`) });
  await region.click();
  const row = page.getByRole('main').getByRole('button').filter({ hasText: target.title }).first();
  try {
    await row.waitFor({ timeout: 90_000 });
  } catch (error) {
    const names = await page.getByRole('main').getByRole('button').allInnerTexts();
    console.log(`${target.id} list sample:\n${names.slice(0, 25).join('\n')}`);
    throw error;
  }
  await row.scrollIntoViewIfNeeded();
  await shot(page, `${target.id}-01-list`);
  await row.click();
  await page.locator('#korea-festival-sheet-title').waitFor({ timeout: 30_000 });
  const card = page.locator('#festival-access');
  await card.waitFor({ timeout: 30_000 });
  await card.scrollIntoViewIfNeeded();
  const status = card.locator('[data-festival-access-status]');
  await status.waitFor();
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-festival-access-status]');
    return node && node.getAttribute('data-festival-access-status') !== 'loading';
  }, null, { timeout: 45_000 });
  const state = await status.getAttribute('data-festival-access-status');
  const text = (await card.innerText()).replace(/\s+/g, ' ');
  console.log(`${target.id} status=${state} text=${text.slice(0, 500)}`);
  if (state !== 'ready') throw new Error(`${target.id} access status ${state}`);
  if (!/\d{2}:\d{2}/.test(text)) throw new Error(`${target.id} has no clock`);
  if (/무료|(^|[^\d,])0원/.test(text)) throw new Error(`${target.id} shows a zero fare`);
  if (!/고르세요/.test(text)) throw new Error(`${target.id} has no segment hint`);
  await page.waitForFunction(() => (
    !document.querySelector('[data-festival-summary-reserve]')
    && !document.querySelector('[data-festival-overview-reserve]')
    && !document.querySelector('[data-festival-detail-skeleton]')
  ), null, { timeout: 45_000 });
  const pressed = await card.locator('[data-festival-access-origin][aria-pressed="true"]').getAttribute('data-festival-access-origin');
  const segments = await card.locator('[data-festival-access-segment]').count();
  const books = await card.locator('[data-festival-access-book]').count();
  console.log(`${target.id} origin=${pressed} segments=${segments} books=${books}`);
  if (segments < 1 || segments > 3) throw new Error(`${target.id} segment cards ${segments}`);
  if (books !== segments) throw new Error(`${target.id} booking links ${books} for ${segments} cards`);
  if (target.id === 'hampyeong' && pressed !== 'yongsan') {
    throw new Error(`hampyeong origin ${pressed}`);
  }
  await page.evaluate(() => {
    document.querySelector('[data-flight-debug-panel]')?.remove();
    document.querySelector('[data-cloud-preview-work-log]')?.remove();
  });
  await card.evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await card.screenshot({ path: `${outDir}/${target.id}-02-access.png` });
  const fare = text.match(/\d{1,3}(?:,\d{3})+원/)?.[0] || '';
  const clock = text.match(/\d{2}:\d{2}(?:~\d{2}:\d{2})?/)?.[0] || '';
  if (!fare || !clock) throw new Error(`${target.id} missing fare or clock`);
  const marks = { fare, clock };
  await page.locator('[data-festival-access-mooni]').click();
  await page.getByRole('button', { name: '채팅 닫기' }).waitFor({ timeout: 20_000 });
  await page.getByTestId('mooni-festival-opening').waitFor({ timeout: 20_000 });
  await shot(page, `${target.id}-03-mooni`);
  const box = page.locator('input[enterkeyhint="send"]:visible');
  if (target.id === 'hampyeong') {
    await box.waitFor({ timeout: 15_000 });
    await box.fill('용산역에서 어떻게 가요? 시각과 요금도 알려줘');
    await box.press('Enter');
    await page.getByText(/출발\s*·\s*용산/).waitFor({ timeout: 15_000 });
  } else if (target.id === 'masan') {
    await box.waitFor({ timeout: 15_000 });
    await box.fill('서울역에서 어떻게 가요? 시각과 요금도 알려줘');
    await box.press('Enter');
    await page.getByText(/출발\s*·\s*서울/).waitFor({ timeout: 15_000 });
  } else {
    await page.getByRole('button', { name: '🚆 가는 법' }).click();
  }
  const answer = page.getByTestId('mooni-model-reply').last();
  await answer.waitFor({ timeout: 20_000 });
  const answerRaw = await answer.innerText();
  const answerText = answerRaw.replace(/\u2060/g, '').replace(/\s+/g, ' ');
  console.log(`${target.id} mooni ${answerText.slice(0, 400)}`);
  if (target.id === 'masan') {
    if ((answerRaw.match(/05:03~20:38/g) || []).length !== 1) {
      throw new Error(`masan answer repeated a grade: ${answerText.slice(0, 500)}`);
    }
    if ((answerRaw.match(/서울→마산/g) || []).length !== 1) {
      throw new Error('masan answer repeated the route');
    }
    const blocks = await answer.locator('p').count();
    if (!/\n/.test(answerRaw) && blocks < 5) throw new Error('masan answer is not line-broken');
    if (answerRaw.includes('까지')) throw new Error('masan answer still repeats 까지');
    console.log(`masan lines=${blocks} sample=${JSON.stringify(answerRaw.slice(0, 80))}`);
  }
  const clockBits = clock.split('~');
  if (!answerText.includes(marks.fare) || clockBits.some((bit) => bit && !answerText.includes(bit))) {
    throw new Error(`${target.id} MOONi answer missed ${marks.clock} / ${marks.fare}`);
  }
  if (clock.includes('~') && !answerText.includes('~')) {
    throw new Error(`${target.id} answer dropped tildes`);
  }
  const answerHtml = await answer.innerHTML();
  if (/<del\b|<s\b/.test(answerHtml)) {
    throw new Error(`${target.id} strikethrough ate a range`);
  }
  if (target.id === 'hampyeong') {
    const asked = page.getByText('용산역에서 어떻게 가요');
    await asked.evaluate((node) => node.scrollIntoView({ block: 'start' }));
  } else {
    await answer.evaluate((node) => node.scrollIntoView({ block: 'center' }));
  }
  await shot(page, `${target.id}-04-mooni-access`);
  if (target.id === 'masan') {
    // gemini-proxy allows www.gateo.kr, not the vite host. Relay the app's own POST.
    await page.route('**/functions/v1/gemini-proxy', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') {
        await route.continue();
        return;
      }
      const headers = { ...req.headers(), origin: 'https://www.gateo.kr' };
      delete headers['content-length'];
      const upstream = await fetch(req.url(), {
        method: 'POST',
        headers,
        body: req.postDataBuffer(),
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      const posted = req.postData() || '';
      console.log(`masan food upstream=${upstream.status} foodAsk=${posted.includes('맛집')} bytes=${body.length}`);
      await route.fulfill({
        status: upstream.status,
        contentType: upstream.headers.get('content-type') || 'application/json',
        body,
      });
    });
    await box.fill('근처 맛집 추천해줘');
    await box.press('Enter');
    await page.waitForFunction(() => {
      const nodes = [...document.querySelectorAll('[data-testid="mooni-model-reply"]')];
      const text = (nodes[nodes.length - 1]?.innerText || '').replace(/\s+/g, ' ');
      return text.length > 12 && !text.includes('KTX-산천') && !text.includes('서울→');
    }, null, { timeout: 70_000 });
    const food = page.getByTestId('mooni-model-reply').last();
    const foodText = (await food.innerText()).replace(/\s+/g, ' ');
    console.log(`masan food ${foodText.slice(0, 300)}`);
    await food.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await shot(page, 'masan-05-mooni-food');
  }
  await page.getByRole('button', { name: '채팅 닫기' }).click();
  const suseo = card.locator('[data-festival-access-origin="suseo"]');
  if (await suseo.count()) {
    await suseo.click();
    const srLink = card.locator('[data-festival-access-mode="train"] a[data-festival-access-book]').first();
    await srLink.waitFor({ timeout: 10_000 });
    const srHref = await srLink.getAttribute('href');
    const srPick = await card.locator('[data-festival-access-mode="train"] [data-festival-access-pick]').count();
    console.log(`${target.id} sr href=${srHref} pickRows=${srPick}`);
    if (!srHref?.includes('selectScheduleList.do') || !srHref.includes('dptRsStnCd=0551')) {
      throw new Error(`${target.id} SR link is not a prefilled search`);
    }
    await srLink.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await shot(page, `${target.id}-02c-sr`);
  }
  const busChip = card.getByRole('button', { name: /동서울|서울경부/ }).first();
  if (await busChip.count()) {
    await busChip.click();
    const busRow = card.locator('[data-festival-access-mode="expBus"], [data-festival-access-mode="suburbsBus"]').first();
    await busRow.waitFor({ timeout: 10_000 });
    await busRow.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    const busSegments = await card.locator('[data-festival-access-segment]').count();
    const busBooks = await card.locator('[data-festival-access-book]').count();
    if (busSegments < 1 || busSegments > 3 || busBooks !== busSegments) {
      throw new Error(`${target.id} bus cards ${busSegments} links ${busBooks}`);
    }
    const busText = (await card.innerText()).replace(/\s+/g, ' ');
    if (!/고속버스 예매|시외버스 예매/.test(busText)) throw new Error(`${target.id} bus booking label missing`);
    console.log(`${target.id} bus ${busText.slice(0, 280)}`);
    await shot(page, `${target.id}-02b-bus`);
  }
}

async function openUnsupported(page) {
  await openKoreaFromHome(page);
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  await page.locator('header').getByRole('button', { name: /^서울(?:\s|$)/ }).click();
  const row = page.getByRole('main').getByRole('button').filter({ hasText: /축제|제|페스티벌/ }).first();
  await row.waitFor({ timeout: 90_000 });
  await row.click();
  await page.locator('#korea-festival-sheet-title').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const count = await page.locator('#festival-access').count();
  const title = await page.locator('#korea-festival-sheet-title').innerText();
  console.log(`unsupported title=${title.replace(/\s+/g, ' ')} accessCards=${count}`);
  if (count !== 0) throw new Error('unsupported festival rendered an access card');
  await shot(page, 'seoul-fallback-sheet');
}

const browser = await webkit.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
});
page.setDefaultTimeout(30_000);
try {
  const only = String(process.env.SHOT_ONLY || '').trim();
  for (const target of targets) {
    if (only && target.id !== only) continue;
    await openKoreaFromHome(page, { captureHome: true, label: target.id });
    await openFestival(page, target);
  }
  if (!only) await openUnsupported(page);
  console.log('shots ok');
} finally {
  await browser.close();
}
