import { test, expect } from './fixtures.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = '/opt/cursor/artifacts/screenshots/hotfix-thumb-pin';
const GUKHYANG_ID = '638576';
const WAIT_AFTER_ENTRY_MS = 20_000;

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

async function openNationwideFestivalHub(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i }).click({
    timeout: 180_000,
  });
  const festivalEntry = page.getByRole('link', {
    name: /한국의 축제로 이동|Go to Korea festivals/i,
  });
  await expect(festivalEntry).toBeVisible({ timeout: 60_000 });
  await festivalEntry.click();
  await expect(page.getByRole('heading', { name: /한국의 축제|Korea festivals/i })).toBeVisible({
    timeout: 120_000,
  });
  await dismissLocHint(page);
  const nationwide = page.getByRole('button', { name: /^전국/ });
  await expect(nationwide).toBeVisible({ timeout: 120_000 });
  await nationwide.click();
  await expect(page.locator('[data-social-promo-festival-row]')).toBeVisible({
    timeout: 120_000,
  });
}

async function collectPromoAndHeroAudit(page) {
  return page.evaluate(() => {
    const row = (el) => ({
      src: el.src || '',
      naturalWidth: el.naturalWidth || 0,
      complete: Boolean(el.complete),
    });
    const promoImgs = [
      ...document.querySelectorAll('[data-social-promo-card] img[data-festival-photo]'),
    ];
    const pinFallbacks = document.querySelectorAll(
      '[data-social-promo-card] [data-thumb-fallback]',
    ).length;
    const heroEl = document.querySelector('[data-festival-hero] img[data-festival-photo]');
    const heroPins = document.querySelectorAll('[data-festival-hero-fallback]').length;
    return {
      promo: {
        total: promoImgs.length,
        loaded: promoImgs.filter((el) => el.naturalWidth > 0).length,
        pin: pinFallbacks,
        imgs: promoImgs.map(row),
      },
      hero: {
        total: heroEl ? 1 : 0,
        loaded: heroEl && heroEl.naturalWidth > 0 ? 1 : 0,
        pin: heroPins,
        imgs: heroEl ? [row(heroEl)] : [],
      },
    };
  });
}

async function writeScenarioAudit(scenario, audit) {
  await mkdir(OUT_DIR, { recursive: true });
  const lines = [
    `scenario: ${scenario}`,
    `promo total=${audit.promo.total} loaded=${audit.promo.loaded} pin=${audit.promo.pin}`,
    `hero total=${audit.hero.total} loaded=${audit.hero.loaded} pin=${audit.hero.pin}`,
    '',
    JSON.stringify(audit, null, 2),
  ];
  await writeFile(join(OUT_DIR, `image-audit-${scenario}.txt`), `${lines.join('\n')}\n`, 'utf8');
}

async function shotIntroCards(page, scenario) {
  await mkdir(OUT_DIR, { recursive: true });
  const row = page.locator('[data-social-promo-festival-row]');
  await row.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: join(OUT_DIR, `${scenario}-intro-cards-20s.png`),
    fullPage: false,
  });
}

async function shotDetailHero(page, scenario) {
  await mkdir(OUT_DIR, { recursive: true });
  const hero = page.locator('[data-festival-hero]').first();
  await expect(hero).toBeVisible({ timeout: 120_000 });
  await page.screenshot({
    path: join(OUT_DIR, `${scenario}-detail-hero.png`),
    fullPage: false,
  });
}

async function closeFestivalDetailIfOpen(page) {
  const dialog = page.getByRole('dialog').first();
  if (!(await dialog.isVisible().catch(() => false))) return;
  await page.getByRole('button', { name: /^닫기$|^Close$/i }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });
}

async function openGukhyangDetail(page) {
  if (/festival=638576/.test(page.url())) {
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 120_000 });
    return;
  }
  await closeFestivalDetailIfOpen(page);
  const card = page.locator(`[data-social-promo-card][data-festival-id="${GUKHYANG_ID}"]`);
  await expect(card).toBeVisible({ timeout: 120_000 });
  await card.scrollIntoViewIfNeeded();
  await card.click({ timeout: 60_000 });
  await expect(page).toHaveURL(/festival=638576/, { timeout: 60_000 });
  await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 120_000 });
}

test.describe('hotfix thumb pin — WebKit 390 real network', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test('a/b/c intro thumbs stay photos after 20s', async ({ page }) => {
    test.setTimeout(900_000);

    await openNationwideFestivalHub(page);
    await page.waitForTimeout(WAIT_AFTER_ENTRY_MS);
    let audit = await collectPromoAndHeroAudit(page);
    await writeScenarioAudit('a-first-entry', audit);
    await shotIntroCards(page, 'a-first-entry');
    await openGukhyangDetail(page);
    audit = await collectPromoAndHeroAudit(page);
    await writeScenarioAudit('a-first-entry-detail', audit);
    await shotDetailHero(page, 'a-first-entry');
    expect(audit.promo.loaded, JSON.stringify(audit.promo)).toBeGreaterThan(0);
    expect(audit.promo.pin, 'promo pin after first entry').toBe(0);

    await closeFestivalDetailIfOpen(page);
    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await page.getByRole('button', { name: /^전국/ }).click();
    await expect(page.locator('[data-social-promo-festival-row]')).toBeVisible({
      timeout: 120_000,
    });
    await page.waitForTimeout(WAIT_AFTER_ENTRY_MS);
    audit = await collectPromoAndHeroAudit(page);
    await writeScenarioAudit('b-reload', audit);
    await shotIntroCards(page, 'b-reload');
    await openGukhyangDetail(page);
    audit = await collectPromoAndHeroAudit(page);
    await writeScenarioAudit('b-reload-detail', audit);
    await shotDetailHero(page, 'b-reload');
    expect(audit.promo.loaded).toBeGreaterThan(0);
    expect(audit.promo.pin).toBe(0);

    await closeFestivalDetailIfOpen(page);
    await page.waitForTimeout(WAIT_AFTER_ENTRY_MS);
    audit = await collectPromoAndHeroAudit(page);
    await writeScenarioAudit('c-back-list', audit);
    await shotIntroCards(page, 'c-back-list');
    await openGukhyangDetail(page);
    audit = await collectPromoAndHeroAudit(page);
    await writeScenarioAudit('c-reenter-detail', audit);
    await shotDetailHero(page, 'c-reenter');
    expect(audit.promo.loaded).toBeGreaterThan(0);
    expect(audit.promo.pin).toBe(0);
    expect(audit.hero.loaded, JSON.stringify(audit.hero)).toBe(1);

    const combined = [
      'hotfix-thumb-pin image audit (WebKit 390, 20s wait per list step)',
      '',
      ...(await Promise.all(
        ['a-first-entry', 'a-first-entry-detail', 'b-reload', 'b-reload-detail', 'c-back-list', 'c-reenter-detail'].map(
          async (name) => {
            const { readFile } = await import('node:fs/promises');
            try {
              return await readFile(join(OUT_DIR, `image-audit-${name}.txt`), 'utf8');
            } catch {
              return `${name}: (missing)`;
            }
          },
        ),
      )),
    ];
    await writeFile(join(OUT_DIR, 'image-audit.txt'), combined.join('\n'), 'utf8');
  });
});
