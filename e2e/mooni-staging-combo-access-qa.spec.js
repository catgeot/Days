/**
 * Staging gemini-proxy + combo Preview — real MOONi 가는 법 answers (WebKit 390×844).
 *
 * MOONI_STAGING_COMBO_QA=1 PLAYWRIGHT_BASE_URL=http://localhost:5173 \
 *   npx playwright test -c playwright.config.mooni-route-origin.js
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';
import { buildFestivalDetailFixture } from './mooni-festival-tourapi-fixture.js';

const LIVE = process.env.MOONI_STAGING_COMBO_QA === '1';
const OUT_DIR =
  process.env.MOONI_STAGING_COMBO_OUT ||
  '/opt/cursor/artifacts/mooni-staging-combo-390';

const LOADING_DETAIL_RE = /상세 불러오는 중|Loading detail/i;

const FESTIVALS = [
  { festivalId: '638576', slug: 'gukhyang', title: /국향/ },
  { festivalId: '637693', slug: 'masan', title: /국화|마산|가고파/ },
  { festivalId: '2930716', slug: 'gangneung', title: /국수|강릉/ },
];

const ORIGINS = ['seoul', 'daegu', 'incheon'];

/** @type {Array<{ file: string, md5: string, festivalId: string, originId: string, answerText: string }>} */
const manifest = [];

function md5File(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex');
}

/** QA-only — keep WebKit from waiting on ads / TourAPI image hosts. */
async function blockSlowExternals(context) {
  await context.route(/emrld\.ltd/i, (route) => route.abort());
  await context.route(/visitkorea\.or\.kr/i, (route) => route.abort());
}

/** 638576 is manual SSOT — only stub TourAPI detail for promo deep links (637693, 2930716). */
async function installStagingFestivalDetailStub(context, festivalId) {
  if (festivalId === '638576') return;
  const detail = buildFestivalDetailFixture(festivalId);
  await context.route(/tourapi-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const action = String(body.action || '');
    const contentId = String(body.contentId || body.contentid || '').trim();
    if (action === 'festivalDetail' && contentId === String(festivalId)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      });
      return;
    }
    await route.continue();
  });
}

function assertAccessAnswerPolished(answerText, { festivalId, originId } = {}) {
  if (/설정 오류|관리자에게 문의/.test(answerText)) {
    throw new Error(`gemini-proxy failed in browser: ${answerText}`);
  }
  expect(answerText).not.toMatch(/12\s*Go|12Go|교통편\s*검색/i);
  expect(answerText).not.toMatch(/교통\s*·\s*티켓/);
  expect(answerText).not.toMatch(/출발 전 준비/);
  if (festivalId === '638576' && originId === 'daegu') {
    expect(answerText).not.toMatch(/환승을\s*거쳐/);
    expect(answerText).not.toMatch(/돼요\s*역으로/);
    expect(answerText).toMatch(/유·스퀘어|유ㆍ스퀘어/);
    expect(answerText).toMatch(/함평공용버스터미널|함평행 버스|함평행/);
  }
}

async function assertAccessNumberTokensSingleLine(page, bubble) {
  const broken = await bubble.locator('[data-mooni-access-number]').evaluateAll((els) =>
    els
      .filter((el) => el.getClientRects().length !== 1)
      .map((el) => ({
        text: el.textContent,
        rects: el.getClientRects().length,
      })),
  );
  expect(broken, `number token split across lines: ${JSON.stringify(broken)}`).toEqual([]);
}

async function clearClientAuthStorage(page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

async function openKoreaFromHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.locator('#root')).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('.mapboxgl-map, .mapboxgl-canvas').first()).toBeVisible({
    timeout: 120_000,
  });
  const koreaHref = page.locator('a[href="/korea"], a[href="/korea/"]').first();
  await koreaHref.evaluate((el) => el.click());
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function openFestivalCard(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await dismissLocHint(page);
  await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), { timeout: 90_000 });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  try {
    await expect(dialog.getByText(LOADING_DETAIL_RE)).toHaveCount(0, { timeout: 90_000 });
  } catch {
    /* TourAPI detail may stay empty on staging — MOONi dock still works */
  }
  await dialog.evaluate((el) => {
    el.scrollTop = Math.min(el.scrollHeight, el.scrollHeight * 0.35);
  });
}

async function openMooniAccessDock(page) {
  const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
  await mooniBtn.scrollIntoViewIfNeeded();
  await mooniBtn.click({ timeout: 90_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
    timeout: 180_000,
  });
  await page.getByRole('button', { name: /🚆\s*가는 법/ }).first().click({ force: true });
  await expect(page.getByTestId('mooni-festival-access-dock')).toBeVisible({
    timeout: 30_000,
  });
}

async function scrollChatToEnd(page) {
  const scrollArea = page.locator('div.flex-1.overflow-y-auto.custom-scrollbar').last();
  await scrollArea.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(400);
}

const FESTIVAL_OPENING_LINE_RE = /뒤 시작해요/;

function accessAnswerRow(page) {
  return page
    .locator('.flex.flex-col.w-full.items-start')
    .filter({ has: page.getByText('MOONi', { exact: true }) })
    .filter({ hasNotText: FESTIVAL_OPENING_LINE_RE })
    .filter({
      hasText:
        /버스타고|KTX|SRT|고속버스|시외버스|출발편|동대구|서울역|마산역|강릉역|함평|광주송정|인천종합|대중교통|이동할 수/i,
    });
}

test.describe('MOONi staging combo — 가는 법 origins (WebKit 390)', () => {
  test.skip(!LIVE, 'set MOONI_STAGING_COMBO_QA=1 and PLAYWRIGHT_BASE_URL');

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test.afterAll(() => {
    if (!manifest.length) return;
    const tip = process.env.MOONI_STAGING_QA_GIT_TIP || '';
    const lines = [
      '# MOONi staging combo QA (390×844 WebKit)',
      '',
      tip ? `**#453 git tip:** \`${tip}\` (staging gemini-proxy; never prod)` : '',
      tip ? '' : null,
      `Base URL: ${process.env.PLAYWRIGHT_BASE_URL || '(unset)'}`,
    ].filter((line) => line !== null);
    lines.push(
      '',
      '| file | md5 | festival | origin | answer (excerpt) |',
      '|------|-----|----------|--------|----------------|',
    );
    for (const row of manifest) {
      const excerpt = row.answerText.replace(/\s+/g, ' ').slice(0, 120);
      lines.push(
        `| ${row.file} | \`${row.md5}\` | ${row.festivalId} | ${row.originId} | ${excerpt.replace(/\|/g, '/')} |`,
      );
      lines.push('');
      lines.push('<details><summary>full text</summary>');
      lines.push('');
      lines.push('```');
      lines.push(row.answerText);
      lines.push('```');
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
    const hashes = manifest.map((r) => r.md5);
    const unique = new Set(hashes);
    lines.push(`## md5 check: ${unique.size} unique / ${hashes.length} files`);
    if (unique.size !== hashes.length) {
      lines.push('');
      lines.push('**WARNING: duplicate screenshot hashes detected.**');
    }
    writeFileSync(join(OUT_DIR, 'README.md'), lines.join('\n'), 'utf8');
    writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  });

  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await blockSlowExternals(context);
  });

  for (const fest of FESTIVALS) {
    for (const originId of ORIGINS) {
      test(`${fest.slug} ${fest.festivalId} — ${originId}`, async ({ page, context }) => {
        test.setTimeout(480_000);
        await installStagingFestivalDetailStub(context, fest.festivalId);
        await clearClientAuthStorage(page);
        await openFestivalCard(page, fest.festivalId);
        await openMooniAccessDock(page);
        await page.locator(`[data-festival-origin="${originId}"]`).click({ force: true });
        const mooniBubble = accessAnswerRow(page).last().locator('div.rounded-2xl').last();
        await expect(mooniBubble).toBeVisible({ timeout: 300_000 });
        await scrollChatToEnd(page);
        await mooniBubble.scrollIntoViewIfNeeded();
        await scrollChatToEnd(page);
        const answerText = (await mooniBubble.innerText()).trim();
        assertAccessAnswerPolished(answerText, {
          festivalId: fest.festivalId,
          originId,
        });
        await assertAccessNumberTokensSingleLine(page, mooniBubble);
        const file = `${fest.slug}-${fest.festivalId}-from-${originId}-end.png`;
        const path = join(OUT_DIR, file);
        await page.screenshot({ path, fullPage: false });
        const hash = md5File(path);
        manifest.push({
          file,
          md5: hash,
          festivalId: fest.festivalId,
          originId,
          answerText,
        });
      });
    }
  }
});
