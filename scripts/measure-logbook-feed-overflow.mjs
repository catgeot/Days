/**
 * Read-only: document scrollWidth vs innerWidth on /blog?tab=public
 * Usage: node scripts/measure-logbook-feed-overflow.mjs [baseUrl]
 */
import { webkit } from '@playwright/test';

const baseUrl = process.argv[2] || 'https://www.gateo.kr';
const widths = [1280, 1440];

const browser = await webkit.launch();
for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    locale: 'ko-KR',
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => !/동기화하는 중/.test(document.body?.innerText || ''),
    null,
    { timeout: 120_000 },
  );
  await page.waitForTimeout(800);
  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    const hub = document.querySelector('[data-testid="logbook-official-review-hub"]');
    const hubToggle = document.querySelector('[data-testid="logbook-official-review-hub-toggle"]');
    const hubCount = document.querySelector('[data-testid="logbook-official-review-hub-count"]');
    const main = document.querySelector('[data-logbook-main-scroll]');
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      };
    };
    const vw = window.innerWidth;
    const hubCountRect = rect(hubCount);
    return {
      innerWidth: vw,
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      overflowPx: de.scrollWidth - vw,
      mainScroll: rect(main),
      hub: rect(hub),
      hubToggle: rect(hubToggle),
      hubCount: hubCountRect,
      hubCountFullyVisible: hubCountRect ? hubCountRect.right <= vw : null,
      hubPresent: Boolean(hub),
    };
  });
  console.log(JSON.stringify({ baseUrl, width, ...metrics }));
  await context.close();
}
await browser.close();
