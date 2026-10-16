/**
 * Enter race — type 흥정계곡 and press Enter with 0ms delay (Chromium + WebKit).
 * Requires VITE_GATEO_SITE_SEARCH=1 preview at PLAYWRIGHT_BASE_URL.
 */
import { chromium, webkit } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:5173';
const QUERY = '흥정계곡';

async function run(browserType, tag) {
  const launcher = browserType === 'webkit' ? webkit : chromium;
  const browser = await launcher.launch({
    headless: true,
    args: tag === 'chromium' ? ['--ignore-certificate-errors'] : [],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  await page.goto(`${BASE}/explore`, { waitUntil: 'commit', timeout: 60_000 });
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await input.waitFor({ state: 'visible', timeout: 120_000 });
  await input.fill(QUERY);
  await input.press('Enter');
  await page
    .waitForFunction(
      () => {
        const p = window.location.pathname;
        return p.startsWith('/place/') || p === '/';
      },
      { timeout: 90_000 },
    )
    .catch(() => {});
  const disambig = await page.getByText('원하는 장소를 선택하세요').isVisible().catch(() => false);
  const url = page.url();
  const cardOpen = await page
    .getByText('흥정계곡', { exact: true })
    .first()
    .isVisible()
    .catch(() => false);
  await browser.close();
  if (disambig) {
    throw new Error(`${tag}: disambiguation list after instant Enter (url=${url})`);
  }
  const deepLink =
    url.includes('흥정계곡') || url.includes('%ED%9D%A5%EC%A0%95%EA%B3%84%EA%B3%A1');
  if (!deepLink && !cardOpen) {
    throw new Error(`${tag}: expected 흥정계곡 card or /place URL, got ${url}`);
  }
  console.log(`OK ${tag} instant Enter → ${url} card=${cardOpen}`);
}

async function main() {
  await run('chromium', 'chromium');
  await run('webkit', 'webkit');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
