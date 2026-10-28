/**
 * Real-user captures: /korea → season chip → 지역 → 전국 (390 + 1280).
 * Env: CAPTURE_BASE_URL (default https://www.gateo.kr), CAPTURE_VARIANT=before|after
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = process.env.CAPTURE_OUT_DIR || join(root, '../opt/cursor/artifacts/region-chips');
const baseUrl = (process.env.CAPTURE_BASE_URL || 'https://www.gateo.kr').replace(/\/$/, '');
const variant = process.env.CAPTURE_VARIANT || 'after';
const secondSeason = process.env.CAPTURE_SECOND_SEASON || 'spring';

mkdirSync(outRoot, { recursive: true });

function pngWidth(path) {
  return readFileSync(path).readUInt32BE(16);
}

async function dismissLocHint(page) {
  const close = page.getByRole('button', { name: /^닫기$/ }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function openRegionRow(page) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
}

async function selectNationwide(page) {
  await page.getByRole('button', { name: /^전국/ }).click();
}

async function selectSeasonChip(page, label) {
  await page.getByRole('button', { name: /시간 대분류/ }).click();
  await page.locator('[data-period-id]').filter({ hasText: label }).first().click();
}

async function readChipStats(page) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  return page.evaluate(() => {
    const scroll =
      document.querySelector('[aria-label="세부 칩"]') ||
      document.querySelector('[aria-label="Detail chips"]');
    const scope = scroll || document.querySelector('main');
    const chips = [...(scope?.querySelectorAll('button') || [])]
      .map((btn) => {
        const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || text.startsWith('전국')) return null;
        const m = text.match(/(\d+)\s*$/);
        if (!m) return null;
        const count = Number(m[1]);
        const label = text.slice(0, m.index).trim();
        if (!label || /테마 전체/.test(label)) return null;
        return { label, count };
      })
      .filter(Boolean);
    const cards = document.querySelectorAll('main [data-festival-id]').length;
    const chipSum = chips.reduce((a, c) => a + c.count, 0);
    const heading = document.querySelector('[data-festival-list-heading] h2')?.textContent?.trim() || '';
    const meta = document.querySelector('[data-festival-list-meta]')?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const countMatch = meta.match(/(\d+)\s*건/);
    const metaCount = countMatch ? Number(countMatch[1]) : null;
    return {
      chips,
      chipSum,
      cards,
      metaCount,
      heading,
      meta,
      path: `${location.pathname}${location.search}`,
    };
  });
}

async function injectOverlay(page, lines) {
  await page.evaluate((rows) => {
    const id = 'gateo-capture-overlay';
    document.getElementById(id)?.remove();
    const el = document.createElement('div');
    el.id = id;
    el.setAttribute('data-capture-overlay', '');
    Object.assign(el.style, {
      position: 'fixed',
      left: '8px',
      top: '8px',
      zIndex: '99999',
      maxWidth: 'calc(100vw - 16px)',
      padding: '6px 8px',
      background: 'rgba(0,0,0,0.78)',
      color: '#fff',
      font: '11px/1.35 ui-monospace, monospace',
      borderRadius: '6px',
      pointerEvents: 'none',
      whiteSpace: 'pre-wrap',
    });
    el.textContent = rows.join('\n');
    document.body.appendChild(el);
  }, lines);
}

async function screenshotViewport(page, filePath, overlayLines) {
  await injectOverlay(page, overlayLines);
  const vp = page.viewportSize() || { width: 390, height: 844 };
  await page.screenshot({
    path: filePath,
    clip: { x: 0, y: 0, width: vp.width, height: vp.height },
    timeout: 90_000,
  });
  const w = pngWidth(filePath);
  if (w !== vp.width) {
    throw new Error(`${filePath} width ${w} !== viewport ${vp.width}`);
  }
}

async function captureFlow(page, viewport, slug) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseUrl}/korea/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }).waitFor({
    timeout: 120_000,
  });
  await dismissLocHint(page);

  await selectSeasonChip(page, '겨울');
  await openRegionRow(page);
  await selectNationwide(page);

  await page.waitForFunction(
    () => document.querySelectorAll('main [data-festival-id]').length > 0,
    null,
    { timeout: 120_000 },
  );

  const stats = await readChipStats(page);
  const overlay = [
    `${variant.toUpperCase()} · ${baseUrl}`,
    stats.path,
    '겨울 → 지역 → 전국',
    `chips=${stats.chips.length} chipSum=${stats.chipSum} cards=${stats.cards}`,
    stats.meta.slice(0, 120),
  ];

  const fileName = `${variant}-winter-nationwide-${slug}-${viewport.width}.png`;
  const filePath = join(outRoot, fileName);
  await screenshotViewport(page, filePath, overlay);

  if (variant === 'after') {
    const total = stats.metaCount ?? stats.cards;
    if (stats.chipSum !== total) {
      throw new Error(
        `${slug}: chipSum ${stats.chipSum} !== list ${total} (${JSON.stringify(stats.chips)})`,
      );
    }
  }

  return { filePath, stats };
}

async function captureSecondSeason(page, viewport, slug, seasonLabel) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseUrl}/korea/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await dismissLocHint(page);
  await selectSeasonChip(page, seasonLabel);
  await openRegionRow(page);
  await selectNationwide(page);
  await page.waitForFunction(
    () => document.querySelectorAll('main [data-festival-id]').length > 0,
    null,
    { timeout: 120_000 },
  );
  const stats = await readChipStats(page);
  const overlay = [
    `${variant.toUpperCase()} · ${baseUrl}`,
    `${seasonLabel} → 지역 → 전국`,
    `chips=${stats.chips.length} chipSum=${stats.chipSum} cards=${stats.cards}`,
  ];
  const fileName = `${variant}-${seasonLabel}-nationwide-${slug}-${viewport.width}.png`;
  const filePath = join(outRoot, fileName);
  await screenshotViewport(page, filePath, overlay);
  if (variant === 'after') {
    const total = stats.metaCount ?? stats.cards;
    if (stats.chipSum !== total) {
      throw new Error(`${seasonLabel} ${slug}: chipSum ${stats.chipSum} !== list ${total}`);
    }
  }
  return { filePath, stats };
}

const browser = await webkit.launch();
const context = await browser.newContext({
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  deviceScaleFactor: 1,
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

const results = [];
for (const vp of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  const slug = vp.width === 390 ? '390' : '1280';
  results.push(await captureFlow(page, vp, slug));
  results.push(
    await captureSecondSeason(page, vp, slug, secondSeason === 'spring' ? '봄' : secondSeason),
  );
}

await browser.close();

const summaryPath = join(outRoot, `${variant}-capture-summary.json`);
writeFileSync(summaryPath, JSON.stringify({ baseUrl, variant, results }, null, 2));
console.log(JSON.stringify({ outRoot, summaryPath, results }, null, 2));
