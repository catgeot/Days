#!/usr/bin/env node
/**
 * Stale cached index → missing/wrong hashed bundle evidence (WebKit + Chromium @390/1280).
 *
 *   npm run build
 *   node scripts/capture-stale-bundle-recovery-evidence.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium, webkit } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.STALE_BUNDLE_EVIDENCE_OUT || '/opt/cursor/artifacts/stale-bundle-recovery';
const PORT = Number(process.env.STALE_BUNDLE_PORT || 4179);
const BASE = `http://127.0.0.1:${PORT}`;

function readDistIndexEntrySrc() {
  const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (!match) throw new Error('dist/index.html missing hashed entry script');
  return match[1];
}

function createSpaServer(distDir) {
  return createServer((req, res) => {
    const url = new URL(req.url || '/', BASE);
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const filePath = join(distDir, path);
    if (existsSync(filePath) && !path.endsWith('/')) {
      const ext = path.split('.').pop();
      const types = {
        html: 'text/html; charset=utf-8',
        js: 'application/javascript; charset=utf-8',
        css: 'text/css; charset=utf-8',
        json: 'application/json; charset=utf-8',
        png: 'image/png',
        svg: 'image/svg+xml',
        woff2: 'font/woff2',
      };
      const body = readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Cache-Control': path.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache, must-revalidate',
      });
      res.end(body);
      return;
    }
    if (path.startsWith('/assets/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const index = readFileSync(join(distDir, 'index.html'));
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, must-revalidate',
    });
    res.end(index);
  });
}

async function clipShot(page, fileName) {
  const { width = 390, height = 844 } = page.viewportSize() || {};
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width, height },
  });
}

async function runScenario(browserType, viewport, entrySrc, mode) {
  const browser = await browserType.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  let staleEntryHits = 0;
  let navigationCount = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigationCount += 1;
  });

  const entryPattern = new RegExp(`${entrySrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

  if (mode === 'main-blank') {
    await page.addInitScript(() => {
      const stop = (e) => {
        e.preventDefault?.();
        e.stopImmediatePropagation?.();
      };
      window.addEventListener('vite:preloadError', stop, true);
      window.addEventListener('unhandledrejection', stop, true);
      window.addEventListener('error', stop, true);
    });
  }

  await page.route(entryPattern, async (route) => {
    if (mode === 'main-blank' || mode === 'branch-recover') {
      staleEntryHits += 1;
      if (staleEntryHits === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: '<!doctype html><html><body>stale html shell</body></html>',
        });
        return;
      }
    }
    await route.continue();
  });

  const nav = page.goto(`${BASE}/place/cairo`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  if (mode === 'branch-recover') {
    await page.waitForURL(/\/place\/cairo/, { timeout: 60_000 }).catch(() => {});
    await page
      .locator('[data-place-gallery-scroll]')
      .waitFor({ state: 'attached', timeout: 120_000 })
      .catch(() => {});
  } else {
    await nav;
    await page.waitForTimeout(2500);
  }

  const rootChildren = await page.evaluate(() => document.getElementById('root')?.childElementCount ?? 0);
  const appMounted = await page.locator('[data-place-gallery-scroll]').count().then((n) => n > 0).catch(() => false);
  const fallbackVisible = await page.locator('#gateo-stale-bundle-fallback').isVisible().catch(() => false);

  const tag = `${browserType.name()}-${viewport.width}x${viewport.height}-${mode}`;
  await clipShot(page, `${tag}.png`);

  await browser.close();

  return {
    mode,
    browser: browserType.name(),
    viewport: `${viewport.width}x${viewport.height}`,
    navigationCount,
    staleEntryHits,
    rootChildren,
    appMounted,
    fallbackVisible,
  };
}

async function runPersistentFailure(browserType, viewport, entrySrc) {
  const browser = await browserType.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  let navigationCount = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigationCount += 1;
  });

  const entryPattern = new RegExp(`${entrySrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  await page.route(entryPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: '<!doctype html><html><body>always stale</body></html>',
    });
  });

  await page.goto(`${BASE}/place/cairo`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(3000);

  const fallbackVisible = await page.locator('#gateo-stale-bundle-fallback').isVisible().catch(() => false);
  const tag = `${browserType.name()}-${viewport.width}x${viewport.height}-persistent-failure`;
  await clipShot(page, `${tag}.png`);
  await browser.close();

  return {
    mode: 'persistent-failure',
    browser: browserType.name(),
    viewport: `${viewport.width}x${viewport.height}`,
    navigationCount,
    fallbackVisible,
  };
}

async function main() {
  const distDir = join(root, 'dist');
  if (!existsSync(join(distDir, 'index.html'))) {
    throw new Error('Run npm run build first');
  }
  const entrySrc = readDistIndexEntrySrc();
  await mkdir(OUT, { recursive: true });

  const server = createSpaServer(distDir);
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  const viewports = [{ width: 390, height: 844 }, { width: 1280, height: 800 }];
  const browsers = [
    { name: 'webkit', type: webkit },
    { name: 'chromium', type: chromium },
  ];

  const results = [];
  for (const { type } of browsers) {
    for (const viewport of viewports) {
      results.push(await runScenario(type, viewport, entrySrc, 'main-blank'));
      results.push(await runScenario(type, viewport, entrySrc, 'branch-recover'));
      results.push(await runPersistentFailure(type, viewport, entrySrc));
    }
  }

  server.close();

  const notes = [
    '# Stale bundle recovery evidence',
    '',
    `Entry script: \`${entrySrc}\``,
    '',
    '| browser | viewport | mode | navigationCount | appMounted | fallback |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...results.map((r) =>
      `| ${r.browser} | ${r.viewport} | ${r.mode} | ${r.navigationCount ?? '-'} | ${r.appMounted === undefined ? '-' : r.appMounted ? 'yes' : 'no'} | ${r.fallbackVisible ? 'yes' : 'no'} |`,
    ),
    '',
    'main-blank simulates pre-fix behavior (recovery listeners disabled, stale entry returns text/html).',
    'branch-recover uses built recovery (one auto-reload, then place gallery attaches).',
    'persistent-failure always serves HTML for the entry script (fallback UI, no reload loop).',
    '',
  ].join('\n');

  await writeFile(join(OUT, 'NOTES.md'), notes, 'utf8');
  console.log(notes);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
