/**
 * Staging gemini-proxy — typed «근처 맛집 추천해 줘» (WebKit 390×844).
 *
 * MOONI_STAGING_COMBO_QA=1 PLAYWRIGHT_BASE_URL=http://localhost:5173 \
 *   npx playwright test -c playwright.config.mooni-hint-budget.js
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';

const LIVE = process.env.MOONI_STAGING_COMBO_QA === '1';
const OUT_DIR = process.env.MOONI_HINT_BUDGET_OUT || '/cursor/stores/self/hint-budget-390';
const ASK = '근처 맛집 추천해 줘';

const FESTIVALS = [
  { query: '국향대전', title: /국향대전/, slug: 'gukhyang', region: '전남' },
  { query: '광명동굴', title: /광명동굴/, slug: 'gwangmyeong', region: '경기' },
  { query: '강릉 국수', title: /강릉 국수/, slug: 'gangneung', region: '강원' },
];

/** @type {Array<Record<string, unknown>>} */
const manifest = [];

function md5File(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex');
}

async function blockSlowExternals(context) {
  await context.route(/emrld\.ltd/i, (route) => route.abort());
  await context.route(/visitkorea\.or\.kr/i, (route) => route.abort());
}

async function openKoreaHome(page) {
  await page.goto('/korea', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function openFestivalFromHome(page, { query, title }) {
  await openKoreaHome(page);
  const searchToggle = page.getByRole('button', { name: /축제 검색|Search festivals/i });
  await searchToggle.click();
  const searchInput = page.getByRole('searchbox').first();
  await searchInput.fill(query);
  await searchInput.press('Enter');
  const card = page.locator('[data-festival-id]').filter({ hasText: title }).first();
  await expect(card).toBeVisible({ timeout: 60_000 });
  const festivalId = await card.getAttribute('data-festival-id');
  await card.click();
  await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), { timeout: 60_000 });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  return { festivalId, dialog };
}

async function openMooniAndAsk(page) {
  const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
  await mooniBtn.scrollIntoViewIfNeeded();
  await mooniBtn.click({ timeout: 90_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 180_000 });
  const replies = page.getByTestId('mooni-model-reply');
  await expect(replies.first()).toBeVisible({ timeout: 180_000 });
  const repliesBefore = await replies.count();
  const input = page.locator('input[enterkeyhint="send"]:visible').first();
  await expect(input).toBeEnabled({ timeout: 180_000 });
  await page.evaluate(() => {
    if (Array.isArray(window.__GATEO_HINT_BUDGET_PROBE__)) {
      window.__GATEO_HINT_BUDGET_PROBE__.length = 0;
    }
  });
  const responsePromise = page.waitForResponse((res) => {
    if (res.request().method() !== 'POST' || !res.url().includes('/functions/v1/gemini-proxy')) {
      return false;
    }
    const raw = res.request().postData() || '';
    return raw.includes(ASK);
  }, { timeout: 180_000 });
  await input.fill(ASK);
  await input.locator('xpath=ancestor::form').locator('button[type="submit"]').click();
  const response = await responsePromise;
  const posted = response.request().postDataJSON();
  const hint = String(posted?.params?.koreaFestivalHint || '');
  await expect(page.getByText(ASK).first()).toBeVisible({ timeout: 30_000 });
  await expect(replies).toHaveCount(repliesBefore + 1, { timeout: 180_000 });
  const reply = replies.last();
  await expect(reply).not.toContainText(/설정 오류|관리자에게 문의/);
  const scrollArea = page.locator('div.flex-1.overflow-y-auto.custom-scrollbar').last();
  await scrollArea.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(400);
  const probes = await page.evaluate(() => (
    Array.isArray(window.__GATEO_HINT_BUDGET_PROBE__) ? window.__GATEO_HINT_BUDGET_PROBE__ : []
  ));
  const answerText = (await reply.innerText()).replace(/\s+/g, ' ').trim();
  return {
    status: response.status(),
    chipId: posted?.params?.chipId ?? null,
    hintChars: hint.length,
    hintBefore: probes[0]?.before ?? null,
    hintAfter: probes.length ? probes[probes.length - 1].after : null,
    probeSteps: probes,
    answerText,
  };
}

test.describe('MOONi staging hint budget — typed food ask (WebKit 390)', () => {
  test.skip(!LIVE, 'set MOONI_STAGING_COMBO_QA=1 and PLAYWRIGHT_BASE_URL');

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test.afterAll(() => {
    if (!manifest.length) return;
    const lines = [
      '# MOONi hint budget — typed food ask (WebKit 390×844)',
      '',
      'Staging gemini-proxy only. Typed «근처 맛집 추천해 줘» after festival home → festival → MOONi.',
      '',
      '| file | md5 | region | festival | status | hint before | hint after | wire |',
      '|------|-----|--------|----------|--------|-------------|------------|------|',
    ];
    for (const row of manifest) {
      lines.push(
        `| ${row.file} | \`${row.md5}\` | ${row.region} | ${row.festivalId} | ${row.status} | ${row.hintBefore} | ${row.hintAfter} | ${row.hintChars} |`,
      );
    }
    lines.push('', '## answers', '');
    for (const row of manifest) {
      lines.push(`### ${row.region} ${row.festivalId}`, '', row.answerText, '');
    }
    writeFileSync(join(OUT_DIR, 'README.md'), `${lines.join('\n')}\n`, 'utf8');
    writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  });

  for (const fest of FESTIVALS) {
    test(`${fest.region} ${fest.query} typed food ask returns 200`, async ({ page }) => {
      await page.addInitScript(() => {
        window.__GATEO_HINT_BUDGET_PROBE__ = [];
      });
      await blockSlowExternals(page.context());
      const { festivalId } = await openFestivalFromHome(page, fest);
      const captured = await openMooniAndAsk(page);
      expect(captured.status).toBe(200);
      expect(captured.hintChars).toBeLessThanOrEqual(8000);
      expect(captured.hintChars).toBeGreaterThan(0);
      const file = `${fest.slug}-${festivalId}.png`;
      const shot = join(OUT_DIR, file);
      await page.screenshot({ path: shot, fullPage: false });
      manifest.push({
        file,
        md5: md5File(shot),
        region: fest.region,
        query: fest.query,
        festivalId,
        status: captured.status,
        chipId: captured.chipId,
        hintBefore: captured.hintBefore,
        hintAfter: captured.hintAfter,
        hintChars: captured.hintChars,
        probeSteps: captured.probeSteps,
        answerText: captured.answerText,
      });
    });
  }
});
