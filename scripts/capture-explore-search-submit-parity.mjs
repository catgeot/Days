/**
 * Explore search submit parity QA — 390 + 1440, flag ON/OFF.
 * Run: node scripts/capture-explore-search-submit-parity.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const OUT = '/opt/cursor/artifacts';
const QUERIES = [
  { key: 'bin', label: '빈 (Vienna KO alias)', text: '빈' },
  { key: 'festival', label: '산천어 (festival)', text: '산천어' },
];
const WIDTHS = [390, 1440];

async function pngWidth(filePath) {
  const buf = await readFile(filePath);
  return buf.readUInt32BE(16);
}

async function injectBanner(page, lines) {
  await page.evaluate((rows) => {
    let el = document.getElementById('qa-parity-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'qa-parity-banner';
      el.style.cssText =
        'position:fixed;top:0;left:0;width:100%;z-index:2147483647;background:rgba(0,0,0,.92);color:#86efac;font:11px/1.35 ui-monospace,monospace;padding:8px;box-sizing:border-box;word-break:break-all;border-bottom:1px solid #334155';
      document.body.prepend(el);
    }
    el.textContent = rows.join(' | ');
  }, lines);
}

async function startPreview(port, env) {
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: '/workspace',
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const base = `https://127.0.0.1:${port}`;
  const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  try {
    for (let i = 0; i < 60; i += 1) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await fetch(`${base}/explore`, { redirect: 'follow' });
        if (res.ok) return { child, base };
      } catch {
        /* retry */
      }
    }
  } finally {
    if (prevTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
  }
  child.kill('SIGTERM');
  throw new Error(`preview failed on port ${port}`);
}

function stopPreview(child) {
  if (child && !child.killed) child.kill('SIGTERM');
}

async function buildWithFlags(flags) {
  const env = {
    ...process.env,
    VITE_GATEO_SITE_SEARCH: '1',
    VITE_GATEO_EXPLORE_SEARCH_SUBMIT_PARITY: flags.parity ? '1' : '',
  };
  await new Promise((resolve, reject) => {
    const p = spawn('npm', ['run', 'build'], { cwd: '/workspace', env, stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build exit ${code}`))));
  });
}

async function installGeminiMock(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'quota' }),
    });
  });
}

async function openExploreSearch(page, base) {
  await page.goto(`${base}/explore`, { waitUntil: 'domcontentloaded' });
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await searchInput.waitFor({ state: 'visible', timeout: 120_000 });
  return searchInput;
}

async function captureScenario(page, base, { flagLabel, query, stage, width, fileName }) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  const input = await openExploreSearch(page, base);
  await input.fill('');
  await input.fill(query.text);
  if (stage === 'autocomplete') {
    await page.waitForTimeout(800);
  } else {
    await input.press('Enter');
    await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 120_000 });
    await page.waitForTimeout(600);
  }
  await injectBanner(page, [flagLabel, query.label, stage, `${width}px`, page.url()]);
  const path = join(OUT, fileName);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  const w = await pngWidth(path);
  if (w !== width) throw new Error(`${fileName}: width ${w} !== ${width}`);
  return path;
}

async function captureProdFlagOff(page, query, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.goto('https://www.gateo.kr/explore', { waitUntil: 'domcontentloaded' });
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await input.waitFor({ state: 'visible', timeout: 120_000 });
  await input.fill(query.text);
  await input.press('Enter');
  await page.waitForTimeout(2500);
  const fileName = `explore-search-parity-prod-off-${query.key}-enter-${width}.png`;
  await injectBanner(page, ['PROD flag OFF', query.label, 'enter', `${width}px`, page.url()]);
  const path = join(OUT, fileName);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  return path;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const report = [];

  await buildWithFlags({ parity: false });
  const offPreview = await startPreview(4173, {});
  const browser = await chromium.launch({ headless: true });
  try {
    const offContext = await browser.newContext({ ignoreHTTPSErrors: true });
    await installGeminiMock(offContext);
    const offPage = await offContext.newPage();
    for (const query of QUERIES) {
      for (const width of WIDTHS) {
        const file = `explore-search-parity-off-${query.key}-enter-${width}.png`;
        await captureScenario(offPage, offPreview.base, {
          flagLabel: 'SUBMIT_PARITY=0',
          query,
          stage: 'enter',
          width,
          fileName: file,
        });
        report.push(file);
      }
    }
    await offContext.close();
  } finally {
    stopPreview(offPreview.child);
  }

  await buildWithFlags({ parity: true });
  const onPreview = await startPreview(4174, {});
  try {
    const onContext = await browser.newContext({ ignoreHTTPSErrors: true });
    await installGeminiMock(onContext);
    const onPage = await onContext.newPage();
    for (const query of QUERIES) {
      for (const width of WIDTHS) {
        for (const stage of ['autocomplete', 'enter']) {
          const file = `explore-search-parity-on-${query.key}-${stage}-${width}.png`;
          await captureScenario(onPage, onPreview.base, {
            flagLabel: 'SUBMIT_PARITY=1',
            query,
            stage,
            width,
            fileName: file,
          });
          report.push(file);
        }
      }
    }
    await onContext.close();
  } finally {
    stopPreview(onPreview.child);
  }

  const prodContext = await browser.newContext({ ignoreHTTPSErrors: true });
  const prodPage = await prodContext.newPage();
  for (const query of QUERIES.slice(0, 1)) {
    for (const width of WIDTHS) {
      report.push(await captureProdFlagOff(prodPage, query, width));
    }
  }
  await prodContext.close();
  await browser.close();

  await writeFile(join(OUT, 'explore-search-submit-parity-capture-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
