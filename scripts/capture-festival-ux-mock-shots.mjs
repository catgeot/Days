import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const mockPath = join(root, 'fixtures/festival-detail-ux-mock.html');
const OUT = '/opt/cursor/artifacts/festival-detail-ux';

const panels = [
  ['sections', '01-festival-bottom-sections'],
  ['course', '02-course-modal-footer'],
  ['palgyeong', '03-palgyeong-grouping'],
  ['mooni', '04-mooni-festival-opening'],
  ['origin', '05-mooni-origin-row'],
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fileUrl = `file://${mockPath}`;

  for (const [panel, name] of panels) {
    await page.goto(`${fileUrl}#${panel}`);
    await page.evaluate((id) => {
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      document.getElementById(id)?.classList.add('active');
    }, panel);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: join(OUT, `${name}-${width}.png`) });
      console.log('saved', join(OUT, `${name}-${width}.png`));
    }
  }
  await browser.close();
}

main();
