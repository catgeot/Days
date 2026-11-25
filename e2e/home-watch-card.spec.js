import fs from 'node:fs';
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

async function expectCaptionBands(page) {
  const bands = page.getByTestId('home-watch-caption-band');
  const count = await bands.count();
  expect(count).toBeGreaterThan(0);
  const slots = page.locator('[data-testid^="home-watch-slot-"]');
  expect(count).toBe(await slots.count());
  for (let i = 0; i < count; i += 1) {
    const band = bands.nth(i);
    await expect(band).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const lines = band.locator('[data-caption-role]');
    const lineCount = await lines.count();
    expect(lineCount).toBeGreaterThan(0);
    for (let line = 0; line < lineCount; line += 1) {
      await expect(lines.nth(line)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.86)');
    }
    const bandBox = await box(band);
    expect(bandBox.height, `caption band is ${bandBox.height}px`).toBeLessThan(42.5);
  }
  const card = page.getByTestId('home-watch-card');
  const cardBox = await box(card);
  expect(cardBox.height).toBeGreaterThanOrEqual(85);
  expect(cardBox.height).toBeLessThan(86);
}

async function captionProbe(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-testid="home-watch-card"]').getBoundingClientRect();
    const tiles = [...document.querySelectorAll('[data-testid="home-watch-caption-band"]')].map((band) => {
      const slot = band.closest('[data-slot-type]');
      const bandRect = band.getBoundingClientRect();
      const lines = [...band.querySelectorAll('[data-caption-role]')].map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          role: el.getAttribute('data-caption-role'),
          text: (el.textContent || '').trim(),
          color: getComputedStyle(el).color,
          x: rect.left,
          y: rect.top,
          w: rect.width,
          h: rect.height,
        };
      });
      return {
        type: slot?.getAttribute('data-slot-type') || '',
        slug: slot?.getAttribute('data-slug') || '',
        bandColor: getComputedStyle(band).backgroundColor,
        band: { x: bandRect.left, y: bandRect.top, w: bandRect.width, h: bandRect.height },
        lines,
      };
    });
    return {
      card: { height: card.height, top: card.top, left: card.left, width: card.width },
      tiles,
    };
  });
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

  test('continue slot shows a place photo or the site fallback', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 390;
    const khaoPhoto =
      'https://images.unsplash.com/photo-1645051049747-265f8c124875?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400';
    const busanPhoto = 'https://tong.visitkorea.or.kr/cms/resource/01/2947001_image2_1.jpg';
    const cases = [
      {
        slug: 'khao-lak',
        name: '카오락',
        imageUrl: khaoPhoto,
        state: 'photo',
        src: /photo-1645051049747-265f8c124875/,
      },
      {
        slug: 'busan',
        name: '부산',
        imageUrl: busanPhoto,
        state: 'photo',
        src: /tong\.visitkorea\.or\.kr\/cms\/resource\/01\/2947001_image2_1\.jpg/,
      },
      {
        slug: 'bang-niang-market',
        name: '방니앙 시장',
        imageUrl: '',
        state: 'fallback',
      },
    ];

    await page.route(/\/rest\/v1\/place_stats/i, async (route) => {
      const url = decodeURIComponent(route.request().url());
      const hit = cases.find((row) => row.imageUrl && url.includes(row.slug));
      if (!hit) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            place_id: hit.slug,
            image_url: hit.imageUrl,
            gallery_urls: [{ urls: { regular: hit.imageUrl, small: hit.imageUrl } }],
          },
        ]),
      });
    });

    const contrastRows = [];
    for (const row of cases) {
      await page.addInitScript((payload) => {
        localStorage.setItem('gateo_recent_visited_destinations', JSON.stringify([payload]));
      }, { name: row.name, slug: row.slug });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const slot = page.getByTestId('home-watch-slot-continue');
      await expect(slot).toContainText(row.name);
      await expect(slot).toContainText('최근에 보신 장소예요');
      const photo = slot.getByTestId('home-watch-continue-photo');
      await expect(photo).toHaveAttribute('data-image-state', row.state);
      await expect(photo).toHaveAttribute('data-photo-slug', row.slug);
      if (row.state === 'photo') {
        await expect(photo).toHaveAttribute('src', row.src);
        await expect.poll(() => photo.evaluate((img, state) => (
          img.getAttribute('data-image-state') === state && img.complete ? img.naturalWidth : 0
        ), row.state)).toBeGreaterThan(0);
      } else {
        await expect(photo).toHaveAttribute('data-photo-fallback', 'gradient');
        await expect(photo).toHaveClass(/from-slate-800/);
        await expect(photo).toHaveClass(/to-slate-950/);
        await expect(slot.locator('img')).toHaveCount(0);
        await expect(slot.locator('text=/GATEO|og-image/')).toHaveCount(0);
      }
      await expectCaptionBands(page);
      const file = width >= 1280
        ? `/opt/cursor/artifacts/home-watch-continue-${row.slug}-1280.png`
        : `/opt/cursor/artifacts/home-watch-continue-${row.slug}-390.png`;
      const probeFile = file.replace(/\.png$/, '.json');
      fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
      fs.writeFileSync(probeFile, JSON.stringify(await captionProbe(page)));
      await page.screenshot({
        path: file,
        clip: width >= 1280 ? undefined : { x: 0, y: 0, width: 390, height: 844 },
      });
      const table = await page.evaluate(() => {
        const lum = (rgb) => {
          const [r, g, b] = rgb.map((c) => {
            const x = c / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const ratio = (fg, bg) => {
          const l1 = lum(fg);
          const l2 = lum(bg);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };
        const parse = (color) => {
          const match = String(color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (!match) return null;
          const alpha = match[4] == null ? 1 : Number(match[4]);
          const rgb = [Number(match[1]), Number(match[2]), Number(match[3])];
          if (alpha >= 0.99) return rgb;
          return rgb.map((channel) => Math.round(channel * alpha + 255 * (1 - alpha)));
        };
        const wanted = ['khao-lak', 'busan', 'bang-niang-market', 'kyoto', 'chiang-mai'];
        return [...document.querySelectorAll('[data-testid^="home-watch-slot-"]')].flatMap((slot) => {
          const href = slot.querySelector('a')?.getAttribute('href') || '';
          const slug = slot.getAttribute('data-slug') || href.split('/').filter(Boolean).pop() || '';
          if (!wanted.includes(slug)) return [];
          const photo = slot.querySelector('[data-photo-fallback], img');
          return [...slot.querySelectorAll('[data-caption-role]')].map((el) => {
            const fg = parse(getComputedStyle(el).color);
            const bg = parse(getComputedStyle(el).backgroundColor);
            return {
              slug,
              role: el.getAttribute('data-caption-role'),
              text: (el.textContent || '').trim(),
              color: getComputedStyle(el).color,
              band: getComputedStyle(el).backgroundColor,
              contrast: fg && bg ? Math.round(ratio(fg, bg) * 100) / 100 : null,
              photo: photo?.getAttribute('data-photo-fallback') || (photo?.getAttribute('src') ? 'photo' : ''),
            };
          });
        });
      });
      for (const entry of table) {
        if (!contrastRows.some((row) => row.slug === entry.slug && row.role === entry.role && row.text === entry.text)) {
          contrastRows.push(entry);
        }
      }
    }
    fs.writeFileSync(
      `/opt/cursor/artifacts/home-watch-contrast-${width}.json`,
      JSON.stringify(contrastRows, null, 2),
    );
    for (const entry of contrastRows) {
      expect(entry.contrast, `${entry.slug} ${entry.role}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('continue slot swaps a broken place photo for the fallback', async ({ page }) => {
    const broken = 'https://example.invalid/khao-lak-missing.jpg';
    await page.route(/\/rest\/v1\/place_stats/i, async (route) => {
      const url = decodeURIComponent(route.request().url());
      if (!url.includes('khao-lak')) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { place_id: 'khao-lak', image_url: broken, gallery_urls: [] },
        ]),
      });
    });
    await page.route(broken, (route) => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem(
        'gateo_recent_visited_destinations',
        JSON.stringify([{ name: '카오락', slug: 'khao-lak' }]),
      );
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const slot = page.getByTestId('home-watch-slot-continue');
    const photo = slot.getByTestId('home-watch-continue-photo');
    await expect(photo).toHaveAttribute('data-image-state', 'error');
    await expect(photo).toHaveAttribute('data-photo-fallback', 'gradient');
    await expect(photo).toHaveClass(/from-slate-800/);
    await expect(slot.locator('img')).toHaveCount(0);
    await expect(slot).toContainText('카오락');
  });
});
