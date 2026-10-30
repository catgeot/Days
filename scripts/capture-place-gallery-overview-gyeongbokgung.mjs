#!/usr/bin/env node
/**
 * Place gallery overview — 경복궁 KO/EN @ 390px and 1280px.
 * Stubs place_chat_intro miss + Tour detailCommon overview for deterministic QA.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const OUT = '/opt/cursor/artifacts/place-gallery-overview-gyeongbokgung';
const BASE = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OVERVIEW =
  '경복궁은 조선 태조 이성계가 1395년에 창건한 조선 왕조의 법궁입니다. ' +
  '광화문과 근정전, 경회루 등 웅장한 전각과 아름다운 정원을 갖춘 서울의 대표 고궁으로, ' +
  '한복을 입고 궁궐을 거닐며 조선의 역사와 문화를 체험할 수 있습니다.';

async function stubRoutes(page) {
  await page.route('**/rest/v1/place_chat_intro**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
  await page.route('**/functions/v1/tourapi-proxy**', async (route) => {
    const body = route.request().postDataJSON?.() || {};
    if (body.action === 'detailCommon') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [{ contentId: '126508', title: '경복궁', overview: OVERVIEW }],
        }),
      });
      return;
    }
    if (body.action === 'searchKeyword') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [{ contentId: '126508', title: '경복궁' }] }),
      });
      return;
    }
    await route.continue();
  });
}

async function waitOverview(page) {
  const updating = page.getByText(/이 장소에 대한 정보가 업데이트 중입니다|Information for this place is being updated/);
  await updating.waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  const overview = page.getByText(/조선 태조|조선 왕조의 법궁/).first();
  await overview.waitFor({ state: 'attached', timeout: 45_000 });
  await overview.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
}

async function capture(page, lang, width) {
  const height = width >= 1280 ? 900 : 844;
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}place/gyeongbokgung-palace/gallery?lang=${lang}`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  });
  await waitOverview(page);
  const suffix = `${lang}-${width}`;
  await page.screenshot({
    path: join(OUT, `gyeongbokgung-gallery-overview-${suffix}.png`),
    clip: { x: 0, y: 0, width, height },
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await stubRoutes(page);
  for (const lang of ['ko', 'en']) {
    for (const width of [390, 1280]) {
      await capture(page, lang, width);
    }
  }
  await browser.close();
  console.log(`Saved screenshots under ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
