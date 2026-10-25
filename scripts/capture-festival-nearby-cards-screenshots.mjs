/**
 * Screenshots for PR — VITE_GATEO_NEARBY_CARDS on/off.
 */
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const OUT = '/opt/cursor/artifacts/screenshots/nearby-cards';
const BASE_ON = process.env.CAPTURE_BASE_URL_ON || 'http://127.0.0.1:5196';
const BASE_OFF = process.env.CAPTURE_BASE_URL_OFF || 'http://127.0.0.1:5197';

const FESTIVALS = [
  { id: '825295', label: 'gangwon-825295' },
  { id: '4128786', label: 'jeju-4128786' },
  { id: '4106717', label: 'gyeongbuk-4106717' },
];

mkdirSync(OUT, { recursive: true });

async function captureSection(browserType, baseURL, festivalId, section, filename, viewport) {
  const browser = await browserType.launch();
  const context = await browser.newContext({
    viewport,
    locale: 'ko-KR',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/korea/?festival=${festivalId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  const root = page.locator(`[data-festival-section="${section}"]`).last();
  await root.waitFor({ state: 'visible', timeout: 120_000 });
  await root.locator('li, [data-nearby-photo-card]').first().waitFor({
    state: 'visible',
    timeout: 120_000,
  });
  await page.waitForTimeout(2000);
  await root.screenshot({ path: `${OUT}/${filename}`, timeout: 60_000 });
  await browser.close();
}

async function main() {
  for (const f of FESTIVALS) {
    await captureSection(
      webkit,
      BASE_ON,
      f.id,
      'nearAttractions',
      `${f.label}-nearAttractions-390-flag-on.png`,
      { width: 390, height: 844 },
    );
    if (f.id !== '4106717') {
      await captureSection(
        webkit,
        BASE_ON,
        f.id,
        'nearFood',
        `${f.label}-nearFood-390-flag-on.png`,
        { width: 390, height: 844 },
      );
    }
    await captureSection(
      chromium,
      BASE_ON,
      f.id,
      'nearAttractions',
      `${f.label}-nearAttractions-1280-flag-on.png`,
      { width: 1280, height: 720 },
    );
  }

  await captureSection(
    webkit,
    BASE_OFF,
    '825295',
    'nearAttractions',
    'gangwon-825295-nearAttractions-390-flag-off.png',
    { width: 390, height: 844 },
  );

  console.log(`Wrote screenshots under ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
