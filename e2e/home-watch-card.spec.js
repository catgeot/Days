import { test, expect } from './fixtures.js';

function rectsOverlap(a, b) {
  if (!a || !b) return false;
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function box(locator) {
  const raw = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  });
  return raw;
}

async function gotoHome(page, path = '/') {
  await page.addInitScript(() => {
    window.__gateoGaEvents = window.__gateoGaEvents || [];
  });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('home-watch-card')).toBeVisible({ timeout: 60_000 });
}

async function expectTasteLabelsFit(page) {
  const tastes = page.getByTestId('home-watch-taste');
  const count = await tastes.count();
  for (let i = 0; i < count; i += 1) {
    const fit = await tastes.nth(i).evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(fit, `home-watch-taste[${i}] truncates`).toBe(true);
  }
}

test.describe('home watch card', () => {
  test('renders on plain home without query flag', async ({ page }) => {
    await gotoHome(page, '/');
    await expect(page.url()).not.toContain('home_watch_card=');
  });

  test('shows the row, clears MOONi and map tools, and records a view', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 390;
    const height = testInfo.project.use.viewport?.height ?? 844;
    await gotoHome(page);
    const card = page.getByTestId('home-watch-card');
    await expect(card).toHaveAttribute('data-slot-count', width >= 1280 ? '4' : '3');
    await expect(page.getByTestId('home-watch-slot-reels')).toHaveCount(0);
    await expect(page.getByTestId('home-watch-slot-destination')).toHaveCount(width >= 1280 ? 4 : 3);
    await expect(card).toContainText('지금 볼 거리');
    if (width < 1280) {
      await expectTasteLabelsFit(page);
    }

    const cardBox = await box(card);
    expect(cardBox.height).toBeGreaterThanOrEqual(80);
    expect(cardBox.height).toBeLessThanOrEqual(96);
    if (width >= 1280) {
      expect(cardBox.left).toBeGreaterThanOrEqual(290);
      expect(cardBox.left).toBeLessThanOrEqual(310);
      expect(height - cardBox.bottom).toBeGreaterThanOrEqual(100);
      expect(height - cardBox.bottom).toBeLessThanOrEqual(120);
    } else {
      expect(cardBox.left).toBeGreaterThanOrEqual(10);
      expect(cardBox.left).toBeLessThanOrEqual(16);
      expect(cardBox.top).toBeGreaterThanOrEqual(500);
      expect(cardBox.top).toBeLessThanOrEqual(570);
      const fabRoot = page.getByTestId('mooni-fab-open').locator('xpath=ancestor::*[contains(@class,"fixed")][1]');
      const bubbles = fabRoot.locator('p');
      const bubbleCount = await bubbles.count();
      for (let i = 0; i < bubbleCount; i += 1) {
        const bubble = bubbles.nth(i);
        if (!(await bubble.isVisible())) continue;
        const bubbleBox = await box(bubble);
        expect(rectsOverlap(cardBox, bubbleBox), JSON.stringify({ cardBox, bubbleBox })).toBe(false);
      }
    }

    const mooni = page.getByTestId('mooni-fab-open');
    await expect(mooni).toBeVisible();
    const mooniBox = await box(mooni);
    expect(rectsOverlap(cardBox, mooniBox), JSON.stringify({ cardBox, mooniBox })).toBe(false);

    const tools = page.getByRole('toolbar', { name: '지도 도구' });
    if (await tools.count()) {
      const toolsBox = await box(tools);
      expect(rectsOverlap(cardBox, toolsBox), JSON.stringify({ cardBox, toolsBox })).toBe(false);
    }

    const chat = page.getByRole('button', { name: /AI와 대화하기|Chat with AI/ });
    if (await chat.count()) {
      const chatBox = await box(chat.first());
      expect(rectsOverlap(cardBox, chatBox), JSON.stringify({ cardBox, chatBox })).toBe(false);
    }

    await page.waitForFunction(() =>
      (window.__gateoGaEvents || []).some((event) => event.name === 'home_watch_card_view'),
    );
    const view = await page.evaluate(() =>
      (window.__gateoGaEvents || []).find((event) => event.name === 'home_watch_card_view'),
    );
    expect(view.params).toEqual({ slot_count: width >= 1280 ? 4 : 3 });
    expect(JSON.stringify(view.params)).not.toMatch(/kyoto|교토|jeju|제주/);

    const hint = page.getByText('여행을 찾아봐요');
    if (await hint.count()) {
      await expect(hint).toBeHidden({ timeout: 8_000 });
    }

    const shotName = width >= 1280 ? 'home-watch-1280' : 'home-watch-390';
    await page.screenshot({
      path: `/opt/cursor/artifacts/${shotName}.png`,
      clip: width >= 1280
        ? undefined
        : { x: 0, y: 0, width: 390, height: 844 },
    });

    await page.mouse.move(12, 12);
    await page.mouse.down();
    await expect(card).toHaveAttribute('data-globe-drag-passthrough', 'true');
    await page.mouse.up();
    await expect(card).toHaveAttribute('data-globe-drag-passthrough', 'false');
  });

  test('English taste labels fit at 390 without truncation', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 390;
    test.skip(width >= 1280, '390-only layout check');
    await page.addInitScript(() => {
      window.__gateoGaEvents = window.__gateoGaEvents || [];
      localStorage.setItem('i18nextLng', 'en');
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-watch-card')).toBeVisible({ timeout: 60_000 });
    await expectTasteLabelsFit(page);
    const subtitles = page.locator('[data-testid^="home-watch-slot-"] p.truncate.text-\\[9px\\]');
    const subCount = await subtitles.count();
    for (let i = 0; i < subCount; i += 1) {
      const fit = await subtitles.nth(i).evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
      expect(fit, `continue subtitle[${i}] truncates`).toBe(true);
    }
  });

  test('destination click routes and the card hides on the place', async ({ page }) => {
    await gotoHome(page);
    const slot = page.getByTestId('home-watch-slot-destination').first();
    await slot.locator('a').click();
    await expect(page).toHaveURL(/\/place\/kyoto/, { timeout: 30_000 });
    await expect(page.getByTestId('home-watch-card')).toHaveCount(0);
    const click = await page.evaluate(() =>
      (window.__gateoGaEvents || []).find((event) => event.name === 'home_watch_card_click'),
    );
    expect(click?.params).toEqual({ slot_type: 'destination' });
  });

  test('continue slot routes to the saved place', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'gateo_recent_visited_destinations',
        JSON.stringify([{ name: '부산', slug: 'busan' }]),
      );
    });
    await gotoHome(page);
    const slot = page.getByTestId('home-watch-slot-continue');
    await expect(slot).toContainText('부산');
    await expect(slot).toContainText('최근에 보신 장소예요');
    await slot.locator('a').click();
    await expect(page).toHaveURL(/\/place\/busan/);
  });

  test('reviewer badge opens the logbook list filtered to that reviewer', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'gateo:logbook-review-hub-rows',
        JSON.stringify([
          {
            id: 'rev-kyoto',
            place_slug: 'kyoto',
            place_name: '교토',
            persona_label: '야경렌즈',
            created_at: '2026-11-20T00:00:00.000Z',
          },
        ]),
      );
    });
    await gotoHome(page);
    const badge = page.getByTestId('home-watch-reviewer').first();
    await expect(badge).toHaveText('야경렌즈');
    await badge.click();
    await expect(page).toHaveURL(/\/blog\?reviewer=/);
    const params = new URL(page.url()).searchParams;
    expect(params.get('reviewer')).toBe('야경렌즈');
    const click = await page.evaluate(() =>
      (window.__gateoGaEvents || []).find(
        (event) => event.name === 'home_watch_card_click' && event.params?.slot_type === 'reviewer',
      ),
    );
    expect(click?.params).toEqual({ slot_type: 'reviewer' });
  });

  test('dismiss hides the card for 7 days on this device', async ({ page }) => {
    await gotoHome(page);
    await page.getByTestId('home-watch-dismiss').click();
    await expect(page.getByTestId('home-watch-card')).toHaveCount(0);
    const until = await page.evaluate(() => Number(localStorage.getItem('gateo:home-watch-card:dismissed-until')));
    const delta = until - Date.now();
    expect(delta).toBeGreaterThan(7 * 24 * 60 * 60 * 1000 - 60_000);
    expect(delta).toBeLessThan(7 * 24 * 60 * 60 * 1000 + 60_000);
    const dismissEvent = await page.evaluate(() =>
      (window.__gateoGaEvents || []).find((event) => event.name === 'home_watch_card_dismiss'),
    );
    expect(dismissEvent?.params).toEqual({});
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-watch-card')).toHaveCount(0);
    await page.evaluate(() => {
      localStorage.setItem('gateo:home-watch-card:dismissed-until', String(Date.now() - 1000));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-watch-card')).toBeVisible();
  });

  test('hides for explore, MOONi, the place card, and a site notice', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => {
      const notice = document.createElement('div');
      notice.setAttribute('data-site-update-notice', '');
      document.body.appendChild(notice);
    });
    await expect(page.getByTestId('home-watch-card')).toHaveCount(0);
    await page.evaluate(() => document.querySelector('[data-site-update-notice]')?.remove());
    await expect(page.getByTestId('home-watch-card')).toBeVisible();

    await page.getByTestId('mooni-fab-open').click();
    await expect(page.getByTestId('home-watch-card')).toHaveCount(0);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-watch-card')).toBeVisible();

    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-watch-card')).toHaveCount(0);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-watch-card')).toBeVisible();
    await page.getByTestId('home-watch-slot-destination').first().locator('a').click();
    await expect(page).toHaveURL(/\/place\/kyoto/);
    await expect(page.getByTestId('home-watch-card')).toHaveCount(0);
  });
});
