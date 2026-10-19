#!/usr/bin/env node
/**
 * R2 QA evidence — lazy-chunk swap, persistent 60s, Vercel curl headers.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { execSync } from 'node:child_process';
import { webkit } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.STALE_BUNDLE_R2_OUT || '/opt/cursor/artifacts/stale-bundle-recovery/r2';
const PREVIEW_URL = (process.env.PREVIEW_URL || '').replace(/\/$/, '');
const PORT = Number(process.env.STALE_BUNDLE_R2_PORT || 4182);

function readMainEntryFromDist(distDir) {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (!match) throw new Error(`missing main entry in ${distDir}/index.html`);
  return match[1];
}

function listAssetChunks(distDir) {
  return readdirSync(join(distDir, 'assets')).filter((n) => n.endsWith('.js'));
}

function createMutableSpaServer(getDistDir) {
  return createServer((req, res) => {
    const distDir = getDistDir();
    const url = new URL(req.url || '/', 'http://127.0.0.1');
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

async function archiveDist(label) {
  const distDir = join(root, 'dist');
  const archive = join(OUT, `_dist-${label}`);
  await rm(archive, { recursive: true, force: true });
  await cp(distDir, archive, { recursive: true });
  return {
    dir: archive,
    mainEntry: readMainEntryFromDist(archive),
    chunks: listAssetChunks(archive),
  };
}

async function ensureBuildA() {
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
  return archiveDist('A');
}

async function ensureBuildB() {
  const entryPath = join(root, 'src/boot/staleBundleRecoveryEntry.js');
  const original = await readFile(entryPath, 'utf8');
  const marker = '\n// r2-build-b-marker\n';
  if (!original.includes('r2-build-b-marker')) {
    await writeFile(entryPath, `${original}${marker}`);
  }
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
  await writeFile(entryPath, original.replace(marker, ''));
  return archiveDist('B');
}

async function runLazyChunkSwap(viewport, buildA, buildB) {
  let activeDist = buildA.dir;
  const server = createMutableSpaServer(() => activeDist);
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  const base = `http://127.0.0.1:${PORT}`;

  const browser = await webkit.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const navLog = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) navLog.push({ t: Date.now(), url: f.url() });
  });

  await page.goto(`${base}/?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(2000);
  await clipShot(page, `lazy-swap-${viewport.width}-before.png`);

  activeDist = buildB.dir;

  const koreaLink = page.locator('a[href="/korea"]').first();
  if (await koreaLink.count()) {
    await koreaLink.click();
  } else {
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '/korea';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
    });
  }

  await page.waitForURL(/\/korea/, { timeout: 90_000 }).catch(() => {});
  await page.waitForTimeout(6000);

  const appMounted = await page
    .locator('main, [data-korea-festival-hub], h1')
    .first()
    .isVisible()
    .catch(() => false);
  await clipShot(page, `lazy-swap-${viewport.width}-after.png`);

  server.close();
  await browser.close();

  const staleChunks = buildA.chunks.filter((c) => !buildB.chunks.includes(c));

  return {
    viewport: `${viewport.width}x${viewport.height}`,
    navigationCount: navLog.length,
    navLog,
    buildAMain: buildA.mainEntry,
    buildBMain: buildB.mainEntry,
    staleChunkCount: staleChunks.length,
    appMounted,
  };
}

async function runPersistentFailure60s(viewport, distDir) {
  const entry = readMainEntryFromDist(distDir);
  const server = createMutableSpaServer(() => distDir);
  const port = PORT + 1;
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const base = `http://127.0.0.1:${port}`;

  const browser = await webkit.launch();
  const page = await browser.newContext({ viewport }).then((c) => c.newPage());
  const navLog = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) navLog.push({ t: Date.now(), url: f.url() });
  });

  const entryPattern = new RegExp(`${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\?|$)`);
  await page.route((url) => entryPattern.test(url.pathname), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: '<!doctype html><html><body>stale</body></html>',
    });
  });

  await page.goto(`${base}/place/cairo?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const checkpoints = [{ atSec: 0, navigationCount: navLog.length }];
  for (let i = 1; i <= 4; i += 1) {
    await page.waitForTimeout(15_000);
    checkpoints.push({ atSec: i * 15, navigationCount: navLog.length });
  }
  const fallbackVisible = await page.locator('#gateo-stale-bundle-fallback').isVisible().catch(() => false);
  const fallbackText = await page.locator('#gateo-stale-bundle-fallback').innerText().catch(() => '');
  await clipShot(page, `persistent-${viewport.width}-60s.png`);
  server.close();
  await browser.close();

  return {
    viewport: `${viewport.width}x${viewport.height}`,
    navigationCount: navLog.length,
    navLog,
    checkpoints,
    fallbackVisible,
    fallbackText,
  };
}

function curlHeaders(previewUrl) {
  const lines = [];
  const paths = ['/', '/index.html', '/place/cairo', '/korea'];
  for (const p of paths) {
    const out = execSync(`curl -sI "${previewUrl}${p}"`, { encoding: 'utf8', maxBuffer: 2_000_000 });
    const status = out.match(/^HTTP\/[^\n]+/m)?.[0] ?? '';
    const cc = out.match(/^cache-control:\s*(.+)$/im)?.[1]?.trim() ?? '(none)';
    lines.push(`${p}: ${status} | Cache-Control: ${cc}`);
  }
  const html = execSync(`curl -sL "${previewUrl}/"`, { encoding: 'utf8', maxBuffer: 8_000_000 });
  const assetMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (assetMatch) {
    const assetPath = assetMatch[1];
    const out = execSync(`curl -sI "${previewUrl}${assetPath}"`, { encoding: 'utf8' });
    const status = out.match(/^HTTP\/[^\n]+/m)?.[0] ?? '';
    const cc = out.match(/^cache-control:\s*(.+)$/im)?.[1]?.trim() ?? '(none)';
    lines.push(`${assetPath}: ${status} | Cache-Control: ${cc}`);
  }
  const missing = execSync(`curl -sI "${previewUrl}/assets/x.js"`, { encoding: 'utf8' });
  const missStatus = missing.match(/^HTTP\/[^\n]+/m)?.[0] ?? '';
  const missCc = missing.match(/^cache-control:\s*(.+)$/im)?.[1]?.trim() ?? '(none)';
  const missCt = missing.match(/^content-type:\s*(.+)$/im)?.[1]?.trim() ?? '';
  lines.push(`/assets/x.js: ${missStatus} | Cache-Control: ${missCc} | Content-Type: ${missCt}`);
  return lines;
}

async function resolvePreviewUrl() {
  if (PREVIEW_URL) return PREVIEW_URL;
  const candidates = [
    'https://days-git-cursor-stale-bundle-recovery-544f-catgeots-projects.vercel.app',
    'https://days-catgeots-projects.vercel.app',
  ];
  for (const url of candidates) {
    try {
      const code = execSync(`curl -s -o /dev/null -w "%{http_code}" -L "${url}/"`, { encoding: 'utf8' }).trim();
      if (code === '200') return url;
    } catch {
      /* next */
    }
  }
  return '';
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const buildA = await ensureBuildA();
  const buildB = await ensureBuildB();

  const lazy390 = await runLazyChunkSwap({ width: 390, height: 844 }, buildA, buildB);
  const lazy1280 = await runLazyChunkSwap({ width: 1280, height: 800 }, buildA, buildB);

  const persist390 = await runPersistentFailure60s({ width: 390, height: 844 }, buildA.dir);
  const persist1280 = await runPersistentFailure60s({ width: 1280, height: 800 }, buildA.dir);

  const previewUrl = await resolvePreviewUrl();
  let curlSection = 'Preview URL not reachable yet — re-run with PREVIEW_URL after Vercel deploy.';
  if (previewUrl) {
    curlSection = [`Preview: ${previewUrl}`, ...curlHeaders(previewUrl)].join('\n');
    await writeFile(join(OUT, 'curl-headers.txt'), `${curlSection}\n`, 'utf8');
  }

  const notes = [
    '# Stale bundle recovery R2 QA',
    '',
    '## Fallback copy (해요체)',
    '- 사이트가 업데이트됐어요',
    '- 새로고침하면 이어서 볼 수 있어요.',
    '- 새로고침',
    '',
    '## Lazy chunk during navigation (build A → swap dist B, client /korea)',
    '',
    `### 390x844 — navigationCount=${lazy390.navigationCount}, appMounted=${lazy390.appMounted}`,
    `- A main: \`${lazy390.buildAMain}\` → B main: \`${lazy390.buildBMain}\``,
    `- stale chunk files removed: ${lazy390.staleChunkCount}`,
    ...lazy390.navLog.map((e, i) => `  - nav ${i + 1}: ${e.url}`),
    '',
    `### 1280x800 — navigationCount=${lazy1280.navigationCount}, appMounted=${lazy1280.appMounted}`,
    '',
    '## Persistent failure (60s, expect navigationCount=2, no loop)',
    '',
    `### 390 — final navigationCount=${persist390.navigationCount}, fallback=${persist390.fallbackVisible}`,
    ...persist390.checkpoints.map((c) => `  - t=${c.atSec}s: navigationCount=${c.navigationCount}`),
    `  - fallback text sample: ${persist390.fallbackText.replace(/\s+/g, ' ').slice(0, 120)}`,
    '',
    `### 1280 — final navigationCount=${persist1280.navigationCount}, fallback=${persist1280.fallbackVisible}`,
    ...persist1280.checkpoints.map((c) => `  - t=${c.atSec}s: navigationCount=${c.navigationCount}`),
    '',
    '## Vercel Preview curl -I',
    '',
    curlSection,
    '',
  ].join('\n');

  await writeFile(join(OUT, 'NOTES.md'), notes, 'utf8');
  console.log(notes);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
