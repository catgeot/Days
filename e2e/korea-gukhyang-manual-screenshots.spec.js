import { test, expect } from './fixtures.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = '/opt/cursor/artifacts/screenshots/gukhyang-manual-638576';
const GUKHYANG_ID = '638576';
const LOADING_DETAIL_RE = /상세 불러오는 중|Loading detail/i;
const LOADING_SCHEDULE_RE = /축제 일정을 불러오는 중|Loading festival schedule/i;

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function shot(page, name, options = {}) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: options.fullPage !== false, ...options });
  return path;
}

function sidoChipButton(page, label) {
  return page.getByRole('button', { name: new RegExp(`^${label} \\d+$`) });
}

async function ensureFestivalWindowLoaded(page) {
  const loadError = page.getByText('축제 목록을 불러오지 못했습니다');
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (!(await loadError.isVisible().catch(() => false))) break;
    await page.getByRole('button', { name: '다시 시도' }).click();
    await page.waitForTimeout(4000);
  }
  await expect(page.getByRole('button', { name: /^전남 \d+$/ })).toBeVisible({
    timeout: 120_000,
  });
}

async function waitForDecodedFestivalPhoto(page, locator, { timeout = 120_000 } = {}) {
  await expect(locator).toBeVisible({ timeout });
  await expect(async () => {
    const nw = await locator.evaluate((el) => el.naturalWidth);
    expect(nw, 'festival photo naturalWidth').toBeGreaterThan(0);
  }).toPass({ timeout });
}

async function waitForFestivalDetailBody(page, { timeout = 120_000 } = {}) {
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout });
  await expect(page.getByText(LOADING_SCHEDULE_RE)).toHaveCount(0, { timeout });
  await expect(dialog.getByText(LOADING_DETAIL_RE)).toHaveCount(0, { timeout });
  const loaded = dialog
    .getByRole('tab', { name: /정보|Info/i })
    .or(dialog.getByText(/개요|Overview/i))
    .or(dialog.locator('[data-festival-detail-asof]'));
  await expect(loaded.first()).toBeVisible({ timeout });
  return dialog;
}

async function waitForPromoThumbDecoded(page, contentId = GUKHYANG_ID) {
  const card = page.locator(`[data-social-promo-card][data-festival-id="${contentId}"]`);
  await expect(card).toBeVisible({ timeout: 120_000 });
  await card.scrollIntoViewIfNeeded();
  const img = card.locator('img[data-festival-photo]');
  await expect(img).toBeAttached({ timeout: 120_000 });
  await expect(async () => {
    const nw = await img.evaluate((el) => el.naturalWidth);
    expect(nw, 'promo thumb naturalWidth').toBeGreaterThan(0);
  }).toPass({ timeout: 120_000 });
}

async function collectImageAudit(page) {
  return page.evaluate(() => {
    const row = (el) => ({
      src: el.src || '',
      naturalWidth: el.naturalWidth || 0,
      complete: Boolean(el.complete),
    });
    const promo = [
      ...document.querySelectorAll(
        '[data-social-promo-card] img[data-festival-photo]',
      ),
    ].map(row);
    const list = [
      ...document.querySelectorAll('[data-festival-id] img[data-festival-photo]'),
    ]
      .filter((el) => !el.closest('[data-social-promo-card]'))
      .map(row);
    const heroEl = document.querySelector(
      '[data-festival-hero] img[data-festival-photo]',
    );
    const hero = heroEl ? [row(heroEl)] : [];
    const nearRoot = document.querySelector('[data-festival-section="nearAttractions"]');
    const nearby = nearRoot
      ? [...nearRoot.querySelectorAll('img[data-festival-photo]')].map(row)
      : [];
    const nearbyEmpty = nearRoot
      ? nearRoot.querySelectorAll('[data-nearby-thumb="empty"]').length
      : 0;
    const nearbyPending = nearRoot
      ? nearRoot.querySelectorAll('[data-nearby-thumb-pending]').length
      : 0;
    return { promo, list, hero, nearby, nearbyEmpty, nearbyPending };
  });
}

function summarizeBuckets(audit) {
  const bucket = (items) => ({
    total: items.length,
    loaded: items.filter((i) => i.naturalWidth > 0).length,
    failed: items.filter((i) => i.complete && i.naturalWidth === 0).length,
    loading: items.filter((i) => !i.complete).length,
  });
  return {
    promo: bucket(audit.promo),
    list: bucket(audit.list),
    hero: bucket(audit.hero),
    nearby: bucket(audit.nearby),
    nearbyPlaceholders: audit.nearbyEmpty,
    nearbyPending: audit.nearbyPending,
  };
}

async function writeImageAuditReport(summary, audit) {
  const lines = [
    '국향대전 638576 — image naturalWidth audit (WebKit 390)',
    JSON.stringify(summary, null, 2),
    '',
    'samples:',
    JSON.stringify(audit, null, 2),
  ];
  const path = join(OUT_DIR, 'image-audit-r5.txt');
  await writeFile(path, `${lines.join('\n')}\n`, 'utf8');
  return path;
}

async function scrollFestivalListForLazyThumbs(page) {
  await page.evaluate(async () => {
    const roots = [
      document.querySelector('main'),
      document.scrollingElement,
      document.documentElement,
    ].filter(Boolean);
    for (const root of roots) {
      const max = root.scrollHeight || 0;
      for (let y = 0; y <= max; y += 300) {
        root.scrollTop = y;
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  });
}

/** Wait until list-row photos finished loading or fell back (no in-flight <img>). */
async function waitForListThumbsSettled(page) {
  await expect(async () => {
    const state = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-festival-id]')].filter(
        (el) => !el.closest('[data-social-promo-card]'),
      );
      let loading = 0;
      for (const row of rows) {
        const img = row.querySelector('img[data-festival-photo]');
        if (img && !img.complete) loading += 1;
      }
      return { ok: loading === 0, loading, rows: rows.length };
    });
    expect(state.ok, JSON.stringify(state)).toBe(true);
  }).toPass({ timeout: 120_000 });
}

async function waitForNearbyThumbsSettled(page) {
  const near = page.locator('[data-festival-section="nearAttractions"]');
  await expect(near).toBeVisible({ timeout: 180_000 });
  await near.scrollIntoViewIfNeeded();
  await expect(async () => {
    const pending = await near.locator('[data-nearby-thumb-pending]').count();
    expect(pending, 'nearby thumb pending').toBe(0);
  }).toPass({ timeout: 180_000 });
}

async function openMooniFromDetail(page) {
  const mooniBtn = page
    .locator('[data-festival-mooni-inline]')
    .or(page.getByRole('button', { name: /무니에게 이 축제 물어보기/i }))
    .first();
  await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
  await mooniBtn.click();
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
    timeout: 120_000,
  });
}

test.describe('gukhyang manual — real TourAPI @390 webkit', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test('전남·경남 list counts and single promo', async ({ page }) => {
    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await expect(page.locator('[data-social-promo-card], [data-social-promo-card-skeleton]').first()).toBeVisible({
      timeout: 120_000,
    });
    await ensureFestivalWindowLoaded(page);

    const jeonnam = sidoChipButton(page, '전남');
    await expect(jeonnam).toBeVisible({ timeout: 60_000 });
    await expect(jeonnam).toContainText('14');
    await jeonnam.click();
    await expect(page.locator('[data-festival-list-meta]')).toContainText('14');
    await expect(page.locator(`[data-social-promo-card][data-festival-id="${GUKHYANG_ID}"]`)).toBeVisible({
      timeout: 60_000,
    });
    await waitForPromoThumbDecoded(page);
    await expect(async () => {
      const count = await page.locator(`[data-festival-id="${GUKHYANG_ID}"]`).count();
      expect(count).toBe(1);
    }).toPass({ timeout: 30_000 });
    await shot(page, 'jeonnam-list-single-promo-390');

    const gyeongnam = sidoChipButton(page, '경남');
    await expect(gyeongnam).toBeVisible({ timeout: 60_000 });
    await expect(gyeongnam).toContainText('10');
    await gyeongnam.click();
    await expect(page.locator('[data-festival-list-meta]')).toContainText('10');
    await expect(page.locator('[data-social-promo-card][data-festival-id="637693"]')).toBeVisible({
      timeout: 60_000,
    });
    await shot(page, 'gyeongnam-list-single-promo-390');
  });

  test('QA r5 — image audit + captures (home → 전남 → 국향 → MOONi)', async ({
    page,
  }) => {
    test.setTimeout(420_000);
    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await ensureFestivalWindowLoaded(page);

    const jeonnam = sidoChipButton(page, '전남');
    await jeonnam.click();
    await waitForPromoThumbDecoded(page);
    let audit = await collectImageAudit(page);
    let summary = summarizeBuckets(audit);
    expect(
      summary.promo.loaded,
      `promo image audit: ${JSON.stringify(summary.promo)}`,
    ).toBeGreaterThan(0);
    await shot(page, 'r5-jeonnam-promo-thumb-390');
    await scrollFestivalListForLazyThumbs(page);
    await page.locator('[data-social-promo-festival-row]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const afterScroll = await collectImageAudit(page);
    audit = { ...afterScroll, promo: audit.promo };
    summary = summarizeBuckets(audit);
    await shot(page, 'r5-jeonnam-promo-and-list-thumbs-390');

    await page.locator(`[data-social-promo-card][data-festival-id="${GUKHYANG_ID}"]`).click();
    await expect(page).toHaveURL(/festival=638576/, { timeout: 60_000 });
    await waitForFestivalDetailBody(page, { timeout: 180_000 });

    const heroImg = page.locator('[data-festival-hero] img[data-festival-photo]').first();
    await waitForDecodedFestivalPhoto(page, heroImg);
    await expect(page.locator('[data-festival-photo-credit]')).toBeVisible({
      timeout: 30_000,
    });
    await shot(page, 'r5-gukhyang-detail-hero-and-credit-390', { fullPage: false });

    await waitForNearbyThumbsSettled(page);
    await shot(page, 'r5-gukhyang-nearby-thumbs-390', { fullPage: false });

    audit = await collectImageAudit(page);
    summary = summarizeBuckets(audit);
    expect(summary.hero.loaded).toBe(1);
    const auditPath = await writeImageAuditReport(summary, audit);
    test.info().annotations.push({
      type: 'image-audit-r5',
      description: JSON.stringify(summary),
    });
    test.info().attach('image-audit-r5.txt', { path: auditPath });

    await openMooniFromDetail(page);
    await shot(page, 'r5-gukhyang-mooni-390', { fullPage: false });
  });

  test('blocked VisitKorea — hero icon, no credit, detail not stuck loading', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await page.route('**/*tong.visitkorea.or.kr/**', (route) => route.abort());
    await page.route('**/*cdn.visitkorea.or.kr/**', (route) => route.abort());

    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await ensureFestivalWindowLoaded(page);
    await page.goto(`/korea?festival=${GUKHYANG_ID}`, { waitUntil: 'domcontentloaded' });
    await waitForFestivalDetailBody(page, { timeout: 180_000 });

    await expect(page.locator('[data-festival-hero-fallback]')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('[data-festival-photo-credit]')).toHaveCount(0);
    await expect(page.getByText(LOADING_DETAIL_RE)).toHaveCount(0);

    const audit = await collectImageAudit(page);
    const summary = summarizeBuckets(audit);
    expect(summary.hero.loaded).toBe(0);
    await writeImageAuditReport(summary, audit);
    await shot(page, 'r5-blocked-visitkorea-hero-no-credit-390', { fullPage: false });
  });

  test('home → 전남 → 국향 detail photo + MOONi @390', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await ensureFestivalWindowLoaded(page);

    const jeonnam = sidoChipButton(page, '전남');
    await jeonnam.click();
    await waitForPromoThumbDecoded(page);
    await page.locator(`[data-social-promo-card][data-festival-id="${GUKHYANG_ID}"]`).click();
    await expect(page).toHaveURL(/festival=638576/, { timeout: 60_000 });
    await expect(page.locator('#korea-festival-sheet-title')).toContainText('국향대전', {
      timeout: 180_000,
    });

    const heroImg = page.locator('[data-festival-hero] img[data-festival-photo]').first();
    await waitForDecodedFestivalPhoto(page, heroImg);
    await expect(page.locator('[data-festival-photo-credit]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-festival-photo-credit]')).toContainText('한국관광공사');

    await shot(page, 'gukhyang-detail-hero-decoded-390', { fullPage: false });

    await openMooniFromDetail(page);
    await shot(page, 'gukhyang-mooni-from-jeonnam-flow-390', { fullPage: false });
  });

  test('국향 detail — no event hours, layout, trust bar', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await ensureFestivalWindowLoaded(page);
    await page.goto(`/korea?festival=${GUKHYANG_ID}`, { waitUntil: 'domcontentloaded' });
    await waitForFestivalDetailBody(page, { timeout: 180_000 });
    await expect(page.locator('#korea-festival-sheet-title')).toContainText('국향대전', {
      timeout: 60_000,
    });
    await expect(page.getByText(/2026\.10\.13 확인/)).toBeVisible({
      timeout: 30_000,
    });

    const heroImg = page.locator('[data-festival-hero] img[data-festival-photo]').first();
    await waitForDecodedFestivalPhoto(page, heroImg);
    await expect(page.locator('[data-festival-photo-credit]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-festival-summary-fee]')).toContainText('사전예매 10%');
    await expect(page.locator('[data-festival-summary-fee]')).toContainText('함평군민');

    const summary = page.locator('[data-festival-detail-summary]');
    await expect(summary).toBeVisible();
    await expect(summary).not.toContainText(/행사\s*시간/);
    await expect(summary).not.toContainText(/\d{1,2}:\d{2}/);

    await expect(page.locator('[data-festival-summary-time]')).toHaveCount(0);

    const hero = page.locator('[data-festival-photo-strip]').first();
    await expect(hero).toBeVisible();
    const title = page.locator('#korea-festival-sheet-title');
    await expect(title).toBeVisible();
    await shot(page, 'gukhyang-detail-sheet-top-photo-title-390', {
      fullPage: false,
      clip: await hero.boundingBox().then(async (box) => {
        const titleBox = await title.boundingBox();
        if (!box || !titleBox) return undefined;
        return {
          x: Math.min(box.x, titleBox.x),
          y: box.y,
          width: Math.max(box.width, titleBox.width),
          height: titleBox.y + titleBox.height - box.y,
        };
      }),
    });

    await shot(page, 'gukhyang-detail-asof-credit-390');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('navigation', { name: /소개|About|회사/i })).toHaveCount(0);
    await shot(page, 'gukhyang-detail-sheet-bottom-no-trust-band-390', { fullPage: false });
  });
});

test.describe('live prod trust bar @390 webkit', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test('gateo.kr main — festival deeplink trust bar', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('https://www.gateo.kr/korea?festival=638576', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await mkdir(OUT_DIR, { recursive: true });
    await page.waitForTimeout(4000);
    const trustVisible = await page
      .getByRole('navigation')
      .filter({ hasText: /소개|이용약관|개인정보/ })
      .first()
      .isVisible()
      .catch(() => false);
    await page.screenshot({
      path: join(OUT_DIR, 'live-gateo-festival-638576-trust-bar-390.png'),
      fullPage: false,
    });
    test.info().annotations.push({
      type: 'live-trust-bar-visible',
      description: String(trustVisible),
    });
  });
});
