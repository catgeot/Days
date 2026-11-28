/**
 * 390px — festival 1095732 lightbox slide 2 (before=HTML mock, after=preview+fixtures).
 */
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { installFestivalPoster1095732Fixtures } from '../e2e/festival-poster-1095732-fixture.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(ROOT, '..');
const OUT = '/opt/cursor/artifacts/festival-poster-lightbox-390';
const VIEWPORT = { width: 390, height: 844 };
const PORT = Number(process.env.FESTIVAL_CAPTURE_PORT || 4179);
const LOCAL = `http://127.0.0.1:${PORT}`;

async function expectExpandEnabled(locator) {
  await locator.evaluate((el) => {
    if (el instanceof HTMLButtonElement && el.disabled) {
      throw new Error('hero expand still disabled');
    }
  });
  for (let i = 0; i < 40; i += 1) {
    const ready = await locator.getAttribute('data-festival-hero-expand');
    if (ready === 'ready') return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('hero expand not ready');
}

async function dismissLocHint(page) {
  const close = page.getByRole('button', { name: /^(닫기|Close)$/i });
  if (await close.count()) {
    await close.first().click({ timeout: 3000 }).catch(() => {});
  }
}

async function openLightboxSlide2(page) {
  const sheet = page.locator('[role="dialog"][aria-labelledby="korea-festival-sheet-title"]');
  await sheet.waitFor({ state: 'visible', timeout: 120_000 });
  await sheet.locator('[data-festival-hero-expand="ready"]').waitFor({
    state: 'visible',
    timeout: 60_000,
  });
  const scroller = sheet.locator('[data-festival-hero-thumbs-scroller]');
  const thumbs = scroller.locator('button[role="option"]');
  await thumbs.nth(1).waitFor({ state: 'visible', timeout: 30_000 });
  await thumbs.nth(1).click();
  const expand = sheet.getByRole('button', {
    name: /사진 확대보기|Expand/i,
  });
  await expand.waitFor({ state: 'visible', timeout: 30_000 });
  await expectExpandEnabled(expand);
  await expand.click();
  const lightbox = page.getByRole('dialog', { name: '사진 확대보기' });
  await lightbox.waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(500);
  return lightbox;
}

async function shotViewport(page, outFile) {
  await page.screenshot({
    path: outFile,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  console.log('saved', outFile);
}

function startPreview() {
  return spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: REPO,
    stdio: 'ignore',
    env: { ...process.env, DEV_SSL: '0' },
  });
}

async function waitPreviewReady() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${LOCAL}/`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview not ready');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const beforeHtml = path.join(OUT, 'before-mock-lightbox-slide2.html');
  const beforeSrc = await readFile(beforeHtml, 'utf8').catch(() => null);
  if (!beforeSrc) {
    throw new Error(`missing ${beforeHtml} — create mock first`);
  }
  const pageMock = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await pageMock.setContent(beforeSrc, { waitUntil: 'domcontentloaded' });
  await shotViewport(pageMock, path.join(OUT, 'before-mock-lightbox-slide2-390.png'));
  await pageMock.close();

  const preview = startPreview();
  try {
    await waitPreviewReady();
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      locale: 'ko-KR',
    });
    await installFestivalPoster1095732Fixtures(context);
    const page = await context.newPage();
    await page.goto(`${LOCAL}/korea/?festival=1095732`, {
      waitUntil: 'domcontentloaded',
      locale: 'ko-KR',
    });
    await dismissLocHint(page);
    const lightbox = await openLightboxSlide2(page);
    await shotViewport(page, path.join(OUT, 'after-preview-lightbox-slide2-390.png'));
    console.log('thumb2 prior poster attr:', await sheetPriorAttr(page));
    await context.close();
  } finally {
    preview.kill('SIGTERM');
  }
  await browser.close();
}

async function sheetPriorAttr(page) {
  const sheet = page.locator('[role="dialog"][aria-labelledby="korea-festival-sheet-title"]');
  return sheet.locator('[data-festival-prior-poster]').first().getAttribute('data-festival-prior-poster');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});