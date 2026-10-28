/**
 * Explore search submit parity QA — Korean UI, 390 + 1440, flag ON/OFF.
 * Run: node scripts/capture-explore-search-submit-parity.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const OUT = '/opt/cursor/artifacts';
const WIDTHS = [390, 1440];

const ENTER_QUERIES = [
  { key: 'bin', label: '빈', text: '빈' },
  { key: 'vienna-ko', label: '비엔나', text: '비엔나' },
  { key: 'festival', label: '산천어', text: '산천어' },
];

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

async function startPreview(port) {
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: '/workspace',
    stdio: 'ignore',
  });
  const base = `https://127.0.0.1:${port}`;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`${base}/explore?lang=ko`);
      if (res.ok) return { child, base };
    } catch {
      /* retry */
    }
  }
  child.kill('SIGTERM');
  throw new Error(`preview failed on port ${port}`);
}

function stopPreview(child) {
  if (child && !child.killed) child.kill('SIGTERM');
}

async function buildWithFlags(parity) {
  const env = {
    ...process.env,
    VITE_GATEO_SITE_SEARCH: '1',
    VITE_GATEO_EXPLORE_SEARCH_SUBMIT_PARITY: parity ? '1' : '',
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

async function openExploreSearchKo(page, base) {
  await page.goto(`${base}/explore?lang=ko`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.setItem('i18nextLng', 'ko');
    } catch {
      /* ignore */
    }
  });
  const searchInput = page.getByRole('textbox', { name: /예:\s*속초/i }).first();
  await searchInput.waitFor({ state: 'visible', timeout: 120_000 });
  return searchInput;
}

async function waitAutocompleteReady(page) {
  await page.getByText('불러오는 중').waitFor({ state: 'hidden', timeout: 120_000 }).catch(() => {});
  await page
    .getByRole('button', { name: /MOONi|무니|비엔나|축제|도시|여행지|명소/i })
    .first()
    .waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForTimeout(400);
}

async function waitEnterPanelReady(page, parityOn) {
  const titleRe = parityOn
    ? /도시·명소·여행지|도시와 명소를 골라주세요/
    : /도시와 명소를 골라주세요|도시·명소·여행지/;
  await page.getByText(titleRe).first().waitFor({ state: 'visible', timeout: 120_000 });
  await page.getByText(/Finding this place|Checking the map/i).waitFor({ state: 'hidden', timeout: 120_000 }).catch(() => {});
  await page.getByText('불러오는 중').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function captureShot(page, base, opts) {
  const { flagLabel, query, stage, width, fileName, parityOn } = opts;
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  const input = await openExploreSearchKo(page, base);
  await input.fill('');
  await input.fill(query.text);
  if (stage === 'autocomplete') {
    await waitAutocompleteReady(page);
  } else {
    await input.press('Enter');
    await waitEnterPanelReady(page, parityOn);
  }
  await injectBanner(page, [flagLabel, query.label, stage, `${width}px`, page.url()]);
  const path = join(OUT, fileName);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  if ((await pngWidth(path)) !== width) throw new Error(`bad width ${fileName}`);
  return fileName;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const report = [];
  const browser = await chromium.launch({ headless: true });

  await buildWithFlags(false);
  const offPreview = await startPreview(4173);
  try {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, locale: 'ko-KR' });
    await installGeminiMock(ctx);
    const page = await ctx.newPage();
    for (const query of ENTER_QUERIES) {
      for (const width of WIDTHS) {
        const file = `explore-search-parity-off-${query.key}-enter-${width}.png`;
        await captureShot(page, offPreview.base, {
          flagLabel: 'SUBMIT_PARITY=0',
          query,
          stage: 'enter',
          width,
          fileName: file,
          parityOn: false,
        });
        report.push(file);
      }
    }
    await ctx.close();
  } finally {
    stopPreview(offPreview.child);
  }

  await buildWithFlags(true);
  const onPreview = await startPreview(4174);
  try {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, locale: 'ko-KR' });
    await installGeminiMock(ctx);
    const page = await ctx.newPage();
    for (const width of WIDTHS) {
      const autoFile = `explore-search-parity-on-bin-autocomplete-${width}.png`;
      await captureShot(page, onPreview.base, {
        flagLabel: 'SUBMIT_PARITY=1',
        query: ENTER_QUERIES[0],
        stage: 'autocomplete',
        width,
        fileName: autoFile,
        parityOn: true,
      });
      report.push(autoFile);
    }
    for (const query of ENTER_QUERIES) {
      for (const width of WIDTHS) {
        const file = `explore-search-parity-on-${query.key}-enter-${width}.png`;
        await captureShot(page, onPreview.base, {
          flagLabel: 'SUBMIT_PARITY=1',
          query,
          stage: 'enter',
          width,
          fileName: file,
          parityOn: true,
        });
        report.push(file);
      }
    }
    await ctx.close();
  } finally {
    stopPreview(onPreview.child);
  }

  await browser.close();
  await writeFile(join(OUT, 'explore-search-submit-parity-capture-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
