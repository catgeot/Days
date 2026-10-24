/**
 * PR #548 QA — /korea manual 235076 + two other region chips. 390px Chromium + WebKit.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, webkit } from '@playwright/test';

const outDir = process.env.QA_OUT || '/cursor/stores/self/qa548';
const baseUrl = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173';

mkdirSync(outDir, { recursive: true });

function pngWidth(path) {
  return readFileSync(path).readUInt32BE(16);
}

async function shoot(page, name) {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  if (pngWidth(path) !== 390) throw new Error(`${name} width !== 390`);
  console.log(`shot ${name}.png`);
}

async function mockApis(page) {
  await page.route('**/functions/v1/tourapi-proxy**', async (route) => {
    let action = '';
    try {
      action = String(route.request().postDataJSON()?.action || '');
    } catch {
      action = '';
    }
    if (action === 'festivalWindow') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          action: 'festivalWindow',
          items: [
            {
              contentId: '999888',
              title: '부산 바다 축제(캡처용 보조)',
              eventStartDate: '20261110',
              eventEndDate: '20261110',
              addr1: '부산광역시 해운대구 해운대해변로 264',
              firstimage:
                'https://tong.visitkorea.or.kr/cms/resource/92/4107992_image2_1.jpg',
            },
            {
              contentId: '235076',
              title: '부산불꽃축제',
              eventStartDate: '20241102',
              eventEndDate: '20241102',
              addr1: '부산광역시 수영구',
              firstimage: 'https://example.invalid/stale.jpg',
            },
            {
              contentId: '111001',
              title: '서울 문화축제(캡처)',
              eventStartDate: '20261101',
              eventEndDate: '20261130',
              addr1: '서울특별시 종로구',
            },
            {
              contentId: '111002',
              title: '서울 가을축제(캡처)',
              eventStartDate: '20261105',
              eventEndDate: '20261120',
              addr1: '서울특별시 중구',
            },
            {
              contentId: '222001',
              title: '제주 해변축제(캡처)',
              eventStartDate: '20261101',
              eventEndDate: '20261115',
              addr1: '제주특별자치도 제주시',
            },
            {
              contentId: '222002',
              title: '제주 음악축제(캡처)',
              eventStartDate: '20261108',
              eventEndDate: '20261122',
              addr1: '제주특별자치도 서귀포시',
            },
          ],
          rawCount: 6,
          fromCache: false,
        }),
      });
      return;
    }
    if (action === 'festivalDetail') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          action: 'festivalDetail',
          message: 'not found (capture mock)',
        }),
      });
      return;
    }
    await route.continue();
  });
}

async function clickRegionChip(page, pattern) {
  const chip = page.getByRole('button', { name: pattern }).first();
  await chip.click({ timeout: 20000, force: true });
  await page.waitForTimeout(1500);
}

async function run(browserName, launcher) {
  const browser = await launcher.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'ko-KR',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  await context.addInitScript(() => {
    try {
      localStorage.removeItem('gateo.locale');
    } catch {
      /* */
    }
  });
  const page = await context.newPage();
  await mockApis(page);
  await page.goto(`${baseUrl}/korea`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3500);
  await shoot(page, `${browserName}-korea-all`);

  await clickRegionChip(page, /^부산\s+\d+$/);
  await shoot(page, `${browserName}-busan-chip`);

  const card = page.locator('[data-festival-id="235076"]').first();
  await card.waitFor({ state: 'visible', timeout: 20000 });
  await card.click({ timeout: 20000, force: true });
  await page.waitForTimeout(2500);
  await shoot(page, `${browserName}-busan-detail`);

  await page.goto(`${baseUrl}/korea`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2500);
  await clickRegionChip(page, /^서울\s+\d+$/);
  await shoot(page, `${browserName}-seoul-chip`);

  await page.goto(`${baseUrl}/korea`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2500);
  await clickRegionChip(page, /^제주\s+\d+$/);
  await shoot(page, `${browserName}-jeju-chip`);

  await browser.close();
}

for (const [name, launcher] of [['chromium', chromium], ['webkit', webkit]]) {
  await run(name, launcher);
}

console.log(`done out=${outDir}`);
