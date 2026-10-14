/**
 * Logged-in festival MOONi wipe capture on staging (WebKit 390×844).
 * MOONI_LOGIN_WIPE_QA=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 \
 *   npx playwright test -c playwright.config.mooni-login-wipe.js
 *
 * Does not call prod. TourAPI is stubbed because staging has no tourapi-proxy.
 * gemini-proxy and saved_trips hit staging.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';

const LIVE = process.env.MOONI_LOGIN_WIPE_QA === '1';
const PHASE = process.env.MOONI_LOGIN_WIPE_PHASE || 'before';
const STRICT = PHASE === 'after';
const OUT_ROOT =
  process.env.MOONI_LOGIN_WIPE_OUT ||
  '/cursor/stores/self/mooni-login-wipe-390';
const OUT_DIR = join(OUT_ROOT, PHASE);
const STAGING_HOST = 'qeqszwxjvhnbzhkchera.supabase.co';

const FESTIVALS = [
  {
    contentId: '3551206',
    slug: 'gwangmyeong',
    title: '광명동굴 빛 축제',
    region: '경기',
    eventStartDate: '20261016',
    eventEndDate: '20261017',
    addr1: '경기도 광명시 가학로85번길 142',
    mapx: '126.864',
    mapy: '37.419',
    overview: '광명동굴 일원에서 열리는 빛 축제. 드론 라이트쇼와 공연, 체험이 있다.',
    venue: '광명동굴 일원',
  },
  {
    contentId: '638576',
    slug: 'gukhyang',
    title: '대한민국 국향대전',
    region: '전남',
    eventStartDate: '20261023',
    eventEndDate: '20261108',
    addr1: '전라남도 함평군 함평읍 곤재로 27',
    mapx: '126.5221985649',
    mapy: '35.0591629478',
    overview: '함평 엑스포공원에서 열리는 국화 축제.',
    venue: '함평 엑스포공원 일원',
  },
  {
    contentId: '2930716',
    slug: 'gangneung',
    title: '강릉 국수 축제',
    region: '강원',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    addr1: '강원특별자치도 강릉시 월화거리',
    mapx: '128.896',
    mapy: '37.751',
    overview: '강릉 월화거리에서 열리는 국수 축제.',
    venue: '강릉 월화거리 일원',
  },
];

/** @type {Array<Record<string, string>>} */
const manifest = [];

function md5File(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex');
}

function listItem(row) {
  return {
    contentId: row.contentId,
    contentTypeId: '15',
    title: row.title,
    eventStartDate: row.eventStartDate,
    eventEndDate: row.eventEndDate,
    addr1: row.addr1,
    mapx: row.mapx,
    mapy: row.mapy,
    overview: row.overview,
  };
}

function detailPayload(row) {
  return {
    ok: true,
    contentId: row.contentId,
    common: {
      contentid: row.contentId,
      title: row.title,
      addr1: row.addr1,
      mapx: row.mapx,
      mapy: row.mapy,
      overview: row.overview,
    },
    intro: {
      contentid: row.contentId,
      title: row.title,
      eventstartdate: row.eventStartDate,
      eventenddate: row.eventEndDate,
      eventplace: row.venue,
      overview: row.overview,
      playtime: '11:00~21:00',
    },
  };
}

async function installFestivalStub(context) {
  await context.route(/tourapi-proxy/i, async (route) => {
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const action = String(body.action || '');
    if (action === 'festivalWindow') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          action: 'festivalWindow',
          items: FESTIVALS.map(listItem),
          rawCount: FESTIVALS.length,
        }),
      });
      return;
    }
    const contentId = String(body.contentId || body.contentid || '');
    const row = FESTIVALS.find((item) => item.contentId === contentId);
    if (row && (action === 'festivalDetail' || action === 'detailIntro' || action === 'detailCommon')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detailPayload(row)),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [] }),
    });
  });
  await context.route(/emrld\.ltd|visitkorea\.or\.kr|google-analytics/i, (route) => route.abort());
}

async function stagingSession() {
  const anon = process.env.VITE_SUPABASE_ANON_KEY || '';
  const email = process.env.MOONI_STAGING_EMAIL || '';
  const password = process.env.MOONI_STAGING_PASSWORD || '';
  if (!anon || !email || !password) {
    throw new Error('Missing staging anon or test-user env. Do not use prod keys.');
  }
  const response = await fetch(
    `https://${STAGING_HOST}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error(`staging sign-in failed status=${response.status}`);
  }
  return body;
}

function attachNetworkLog(page) {
  const logPath = join(OUT_DIR, 'network.log');
  page.on('response', async (response) => {
    const url = response.url();
    if (!/saved_trips|gemini-proxy/.test(url)) return;
    if (response.status() < 400) return;
    let path = url;
    try {
      path = new URL(url).pathname;
    } catch {
      /* keep */
    }
    let body = '';
    try {
      body = (await response.text()).replace(/[A-Za-z0-9_-]{24,}/g, '<redacted>').slice(0, 220);
    } catch {
      body = '';
    }
    appendFileSync(logPath, `${response.status()} ${response.request().method()} ${path} ${body}\n`);
  });
}

async function shot(page, name) {
  mkdirSync(OUT_DIR, { recursive: true });
  const file = `${name}.png`;
  const target = join(OUT_DIR, file);
  const chat = page.locator('div.fixed.inset-0').filter({
    has: page.getByTestId('mooni-festival-opening'),
  });
  const dialog = page.getByRole('dialog').first();
  let targetLocator = page;
  let text = '';
  if (await chat.count()) {
    const scroll = chat.locator('div.flex-1.overflow-y-auto').first();
    await scroll.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    }).catch(() => {});
    await chat.first().evaluate((el) => {
      el.style.setProperty('backdrop-filter', 'none', 'important');
      el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      el.style.setProperty('background', 'rgba(8, 15, 30, 0.94)', 'important');
      const sheet = el.firstElementChild;
      if (sheet instanceof HTMLElement) {
        sheet.style.setProperty('background', '#f8fafc', 'important');
      }
    }).catch(() => {});
    await page.waitForTimeout(250);
    targetLocator = chat.first();
    text = await chat.first().innerText().catch(() => '');
  } else if (await dialog.count()) {
    targetLocator = dialog;
    text = await dialog.innerText().catch(() => '');
  } else {
    text = await page.locator('body').innerText().catch(() => '');
  }
  await targetLocator.screenshot({ path: target, animations: 'disabled' });
  const flat = text.replace(/\s+/g, ' ').trim();
  const excerpt = flat.length > 520 ? `${flat.slice(0, 220)} … ${flat.slice(-280)}` : flat;
  writeFileSync(join(OUT_DIR, `${name}.txt`), flat);
  manifest.push({
    phase: PHASE,
    file,
    md5: md5File(target),
    excerpt,
  });
}

async function openFestivalHome(page) {
  await page.goto('/korea', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await dismissLocHint(page);
  await expect(page.getByRole('heading', { name: /한국의 축제|Korea festivals/i })).toBeVisible({
    timeout: 90_000,
  });
}

async function openFestival(page, row) {
  const card = page.locator(`[data-festival-id="${row.contentId}"]`).first();
  await card.scrollIntoViewIfNeeded({ timeout: 20_000 }).catch(() => {});
  if (await card.isVisible().catch(() => false)) {
    await card.click({ timeout: 20_000 });
  } else {
    await page.goto(`/korea/?festival=${row.contentId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
  }
  await dismissLocHint(page);
  await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 90_000 });
}

async function openMooni(page) {
  const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
  await mooniBtn.scrollIntoViewIfNeeded().catch(() => {});
  await mooniBtn.click({ timeout: 60_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 180_000 });
}

async function modelReplyCount(page) {
  return page.getByTestId('mooni-model-reply').count();
}

async function waitForAnswer(page, previousCount) {
  const started = Date.now();
  while (Date.now() - started < 70_000) {
    const count = await modelReplyCount(page);
    if (count > previousCount) {
      const text = await page.getByTestId('mooni-model-reply').last().innerText().catch(() => '');
      if (text.trim().length > 8) return text;
    }
    await page.waitForTimeout(500);
  }
  return '';
}

test.describe('logged-in festival MOONi wipe (staging WebKit 390)', () => {
  test.skip(!LIVE, 'set MOONI_LOGIN_WIPE_QA=1');
  test.describe.configure({ mode: 'serial' });

  /** @type {object | null} */
  let session = null;

  test.beforeAll(async () => {
    mkdirSync(OUT_DIR, { recursive: true });
    session = await stagingSession();
  });

  test.beforeEach(async ({ context }) => {
    await installFestivalStub(context);
    await context.addInitScript((stored) => {
      localStorage.setItem('gateo.locale', 'ko');
      localStorage.setItem(
        'sb-qeqszwxjvhnbzhkchera-auth-token',
        JSON.stringify(stored),
      );
    }, session);
  });

  test('three festivals: chip, typed, reopen, language', async ({ page }) => {
    attachNetworkLog(page);
    await openFestivalHome(page);
    await shot(page, '00-festival-home');

    for (const row of FESTIVALS) {
      await openFestival(page, row);
      await shot(page, `${row.slug}-01-festival-open`);
      await openMooni(page);
      await shot(page, `${row.slug}-02-mooni-open`);

      const beforeChip = await modelReplyCount(page);
      const chip = page.getByRole('button', { name: /볼거리/ }).first();
      await expect(chip).toBeVisible({ timeout: 30_000 });
      await chip.click({ force: true });
      const chipText = await waitForAnswer(page, beforeChip);
      appendFileSync(
        join(OUT_DIR, 'answers.log'),
        `${row.slug} chip len=${chipText.trim().length} ${chipText.replace(/\s+/g, ' ').trim().slice(0, 180)}\n`,
      );
      await shot(page, `${row.slug}-03-chip-answer`);
      if (STRICT) expect(chipText.length, `${row.slug} chip answer`).toBeGreaterThan(8);

      const beforeTyped = await modelReplyCount(page);
      const input = page.getByRole('textbox').last();
      await input.click();
      await input.fill('주차장 어디예요?');
      await page.getByRole('button', { name: '전송' }).last().click();
      const typedText = await waitForAnswer(page, beforeTyped);
      appendFileSync(
        join(OUT_DIR, 'answers.log'),
        `${row.slug} typed len=${typedText.trim().length} ${typedText.replace(/\s+/g, ' ').trim().slice(0, 180)}\n`,
      );
      await shot(page, `${row.slug}-04-typed-answer`);
      if (STRICT) expect(typedText.length, `${row.slug} typed answer`).toBeGreaterThan(8);

      await page.getByRole('button', { name: /채팅 닫기|Close chat/i }).click();
      await expect(page.getByTestId('mooni-festival-opening')).toHaveCount(0);
      await openMooni(page);
      await shot(page, `${row.slug}-05-reopen`);
      if (STRICT) {
        await expect(page.getByText('주차장 어디예요?')).toBeVisible({ timeout: 30_000 });
        expect(await modelReplyCount(page)).toBeGreaterThan(0);
      }

      await page.getByRole('button', { name: /채팅 닫기|Close chat/i }).click();
      await page.goto(`/korea/?lang=en`, {
        waitUntil: 'domcontentloaded',
        timeout: 120_000,
      });
      await dismissLocHint(page);
      await openFestival(page, row);
      const mooniEn = page.locator('[data-festival-mooni-inline]').first();
      await mooniEn.scrollIntoViewIfNeeded().catch(() => {});
      await mooniEn.click({ timeout: 60_000 });
      await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 180_000 });
      await shot(page, `${row.slug}-06-lang-reopen`);

      await page.getByRole('button', { name: /채팅 닫기|Close chat/i }).click().catch(() => {});
      await page.goto('/korea', { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await dismissLocHint(page);
    }
  });

  test.afterAll(() => {
    if (!manifest.length) return;
    writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
    const lines = [
      `# MOONi login wipe ${PHASE} (WebKit 390×844)`,
      '',
      `Phase: **${PHASE}**`,
      `Base: ${process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173'}`,
      'Supabase: staging `qeqszwxjvhnbzhkchera` only.',
      '',
      '| file | md5 | excerpt |',
      '|------|-----|---------|',
    ];
    for (const row of manifest) {
      lines.push(`| ${row.file} | \`${row.md5}\` | ${row.excerpt.replace(/\|/g, '/')} |`);
    }
    const unique = new Set(manifest.map((row) => row.md5));
    lines.push('', `md5 unique ${unique.size} / ${manifest.length}`);
    writeFileSync(join(OUT_DIR, 'README.md'), lines.join('\n'));
  });
});
