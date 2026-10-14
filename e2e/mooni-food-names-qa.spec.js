/**
 * Staging gemini-proxy — typed «근처 맛집 추천해 줘» (WebKit 390×844).
 *
 * Restaurant lists come from prod tourapi-proxy (read-only). gemini-proxy stays on staging.
 * MOONI_STAGING_COMBO_QA=1 PLAYWRIGHT_BASE_URL=http://localhost:5173 \
 *   npx playwright test -c playwright.config.mooni-food-names.js
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';

const LIVE = process.env.MOONI_STAGING_COMBO_QA === '1';
const OUT_DIR = process.env.MOONI_FOOD_NAMES_OUT || '/opt/cursor/artifacts/food-names-390';
const ASK = '근처 맛집 추천해 줘';
const PROD_SUPABASE = String(process.env.GATEO_PROD_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const PROD_ANON = String(process.env.GATEO_PROD_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

const FESTIVALS = [
  { query: '국향대전', title: /국향대전/, slug: 'gukhyang', region: '전남', festivalId: '638576' },
  { query: '마산', title: /마산|가고파/, slug: 'masan', region: '경남', festivalId: '637693' },
  { query: '강릉 국수', title: /강릉 국수/, slug: 'gangneung', region: '강원', festivalId: '2930716' },
];

const WINDOW_ITEMS = [
  {
    contentId: '638576',
    contentTypeId: '15',
    title: '대한민국 국향대전',
    eventStartDate: '20261023',
    eventEndDate: '20261108',
    addr1: '전남광주통합특별시 함평군 함평읍 곤재로 27',
    mapx: '126.5221985649',
    mapy: '35.0591629478',
  },
  {
    contentId: '637693',
    contentTypeId: '15',
    title: '마산가고파국화축제',
    eventStartDate: '20261031',
    eventEndDate: '20261108',
    addr1: '경상남도 창원시 마산합포구',
    mapx: '128.489574',
    mapy: '35.194419',
  },
  {
    contentId: '2930716',
    contentTypeId: '15',
    title: '강릉 국수 축제',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    addr1: '강원특별자치도 강릉시 경강로 2111 (임당동)',
    mapx: '128.8976016584',
    mapy: '37.7557770169',
  },
];

const TOUR_CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
};

/** @type {Array<Record<string, unknown>>} */
const manifest = [];

function mdLinkRe() {
  return /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)(?:\(([^)]*)\))?/g;
}

/** Restaurant markdown on the hint food line. The rest of the hint is not kept. */
function hintRestaurants(hint) {
  const line = String(hint || '')
    .split('\n')
    .find((row) => row.includes('주변 맛집') || row.includes('Nearby restaurants')) || '';
  const rows = [];
  const re = mdLinkRe();
  let match = re.exec(line);
  while (match) {
    rows.push({
      name: match[1].replace(/\s+/g, ' ').trim(),
      url: match[2],
      meta: String(match[3] || '').trim(),
    });
    match = re.exec(line);
  }
  return rows;
}

function answerLinksFromHtml(html) {
  const rows = [];
  const re = mdLinkRe();
  let match = re.exec(String(html || ''));
  while (match) {
    rows.push({ name: match[1].replace(/\s+/g, ' ').trim(), url: match[2] });
    match = re.exec(html);
  }
  return rows;
}

async function linkStatus(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html',
      },
    });
    return res.status;
  } catch (err) {
    return err?.name === 'AbortError' ? 'timeout' : 'error';
  } finally {
    clearTimeout(timer);
  }
}

async function blockSlowExternals(context) {
  await context.route(/emrld\.ltd/i, (route) => route.abort());
  await context.route(/visitkorea\.or\.kr/i, (route) => route.abort());
}

/**
 * Staging has no tourapi-proxy. The home list is the three known festivals.
 * Detail and locationBasedList go to prod tourapi-proxy (read-only).
 */
async function installTourApi(context) {
  await context.route(/tourapi-proxy/i, async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 200, headers: TOUR_CORS, body: '' });
      return;
    }
    if (method !== 'POST') {
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
    if (action === 'festivalWindow') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: TOUR_CORS,
        body: JSON.stringify({ ok: true, items: WINDOW_ITEMS, fromCache: false }),
      });
      return;
    }
    if (!PROD_SUPABASE || !PROD_ANON) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        headers: TOUR_CORS,
        body: JSON.stringify({ ok: false, error: 'prod_tourapi_unset' }),
      });
      return;
    }
    const res = await fetch(`${PROD_SUPABASE}/functions/v1/tourapi-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PROD_ANON}`,
        apikey: PROD_ANON,
      },
      body: route.request().postData() || '{}',
    });
    const text = await res.text();
    let count = null;
    try {
      const parsed = JSON.parse(text);
      count = Array.isArray(parsed?.items) ? parsed.items.length : null;
    } catch {
      count = null;
    }
    console.log(`[food-names] tourapi ${action} ${res.status} items=${count ?? 'n/a'}`);
    await route.fulfill({
      status: res.status,
      contentType: 'application/json',
      headers: TOUR_CORS,
      body: text,
    });
  });
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
  await expect(card).toBeVisible({ timeout: 90_000 });
  const festivalId = await card.getAttribute('data-festival-id');
  await card.click();
  await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), { timeout: 60_000 });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  const food = dialog.locator('[data-festival-section="nearFood"]');
  await expect(food).toBeVisible({ timeout: 90_000 });
  await expect(food.locator('li').first()).toBeVisible({ timeout: 30_000 });
  return { festivalId, dialog };
}

async function openMooniAndAsk(page) {
  const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
  await mooniBtn.scrollIntoViewIfNeeded();
  await mooniBtn.click({ timeout: 90_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 180_000 });
  const replies = page.getByTestId('mooni-model-reply');
  const repliesBefore = await replies.count();
  const input = page.locator('input[enterkeyhint="send"]:visible').first();
  await expect(input).toBeEnabled({ timeout: 180_000 });
  const responsePromise = page.waitForResponse((res) => {
    if (res.request().method() !== 'POST' || !res.url().includes('/functions/v1/gemini-proxy')) return false;
    const raw = res.request().postData() || '';
    return raw.includes(ASK);
  }, { timeout: 180_000 });
  await input.fill(ASK);
  await input.locator('xpath=ancestor::form').locator('button[type="submit"]').click();
  const response = await responsePromise;
  const posted = response.request().postDataJSON();
  const hint = String(posted?.params?.koreaFestivalHint || '');
  const host = new URL(response.url()).hostname;
  await expect(page.getByText(ASK).first()).toBeVisible({ timeout: 30_000 });
  await expect(replies).toHaveCount(repliesBefore + 1, { timeout: 180_000 });
  const reply = replies.last();
  await expect(reply).not.toContainText(/설정 오류|관리자에게 문의/);
  const scrollArea = page.locator('div.flex-1.overflow-y-auto.custom-scrollbar').last();
  await reply.scrollIntoViewIfNeeded();
  await scrollArea.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(600);
  const answerText = (await reply.innerText()).replace(/[ \t]+\n/g, '\n').trim();
  const html = await reply.innerHTML();
  const anchors = await reply.locator('a').evaluateAll((els) => els.map((el) => ({
    name: (el.textContent || '').replace(/\s+/g, ' ').trim(),
    url: el.getAttribute('href') || '',
  })));
  return {
    status: response.status(),
    host,
    hintChars: hint.length,
    hintRestaurants: hintRestaurants(hint),
    answerText,
    answerLinks: anchors.length ? anchors : answerLinksFromHtml(html),
  };
}

test.describe('MOONi festival food names — typed ask (WebKit 390)', () => {
  test.skip(!LIVE, 'set MOONI_STAGING_COMBO_QA=1 and PLAYWRIGHT_BASE_URL');

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    if (!manifest.length) return;
    const cache = new Map();
    for (const row of manifest) {
      for (const link of row.places) {
        if (!link.url || cache.has(link.url)) continue;
        cache.set(link.url, await linkStatus(link.url));
      }
    }
    for (const row of manifest) {
      for (const link of row.places) {
        link.httpStatus = link.url ? cache.get(link.url) : 'missing';
      }
    }
    const lines = [
      '# MOONi festival food names (WebKit 390×844)',
      '',
      'Typed «근처 맛집 추천해 줘» on staging gemini-proxy. Restaurant rows are from prod tourapi-proxy.',
      'Hint text is not stored. Names below are the answer shops, checked against the hint food line.',
      '',
      '| festival | answer names | in hint | type | distance | link | HTTP |',
      '|----------|--------------|---------|------|----------|------|------|',
    ];
    for (const row of manifest) {
      if (!row.places.length) {
        lines.push(`| ${row.festivalId} | (none) | | | | | |`);
      }
      for (const place of row.places) {
        lines.push(
          `| ${row.festivalId} | ${place.name} | ${place.inHint ? 'yes' : 'NO'} | ${place.type || ''} | ${place.distance || ''} | ${place.url ? 'yes' : 'no'} | ${place.httpStatus} |`,
        );
      }
    }
    lines.push('', '## answers', '');
    for (const row of manifest) {
      lines.push(
        `### ${row.region} ${row.festivalId}`,
        '',
        `status ${row.status} · gemini ${row.host} · hint ${row.hintChars} chars · invented ${row.invented.join(', ') || 'none'}`,
        '',
        row.answerText,
        '',
      );
    }
    writeFileSync(join(OUT_DIR, 'README.md'), `${lines.join('\n')}\n`, 'utf8');
    writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  });

  for (const fest of FESTIVALS) {
    test(`${fest.region} ${fest.query} names type distance and link`, async ({ page }) => {
      await blockSlowExternals(page.context());
      await installTourApi(page.context());
      const { festivalId } = await openFestivalFromHome(page, fest);
      expect(festivalId).toBe(fest.festivalId);
      const captured = await openMooniAndAsk(page);
      expect(captured.status).toBe(200);
      expect(captured.host).toBe('qeqszwxjvhnbzhkchera.supabase.co');
      expect(captured.hintChars).toBeGreaterThan(0);
      expect(captured.hintChars).toBeLessThanOrEqual(8000);
      const hintNames = captured.hintRestaurants.map((row) => row.name);
      expect(hintNames.length).toBeGreaterThanOrEqual(3);
      expect(hintNames.length).toBeLessThanOrEqual(4);
      const places = captured.answerLinks
        .filter((row) => hintNames.includes(row.name) || hintNames.some((name) => name.includes(row.name) || row.name.includes(name)))
        .filter((row) => row.name && !/gateo\.kr|상세/.test(row.name));
      const unique = [];
      for (const row of places) {
        if (unique.some((item) => item.name === row.name)) continue;
        const hint = captured.hintRestaurants.find((item) => item.name === row.name)
          || captured.hintRestaurants.find((item) => item.name.includes(row.name) || row.name.includes(item.name));
        const meta = String(hint?.meta || '');
        const distance = (captured.answerText.match(new RegExp(`${row.name}[\\s\\S]{0,80}?(도보\\s*\\d+분|\\d+m|\\d+-min walk)`)) || [])[1]
          || (meta.match(/도보\s*\d+분|\d+m|\d+-min walk/) || [])[0]
          || '';
        const type = (meta.split('·').map((part) => part.trim()).find((part) => part && !/도보|\d+m|walk/.test(part))) || '';
        unique.push({
          name: row.name,
          url: row.url || hint?.url || '',
          inHint: Boolean(hint),
          type,
          distance,
          httpStatus: null,
        });
      }
      const invented = captured.answerLinks
        .map((row) => row.name)
        .filter((name) => name && !/gateo\.kr|상세|숙소|기차|버스/.test(name))
        .filter((name) => !hintNames.some((hintName) => hintName.includes(name) || name.includes(hintName)));
      expect(unique.length).toBeGreaterThanOrEqual(3);
      expect(unique.length).toBeLessThanOrEqual(4);
      expect(invented).toEqual([]);
      for (const place of unique) {
        expect(place.inHint).toBe(true);
        expect(place.url).toMatch(/^https?:\/\//);
        expect(place.distance).toBeTruthy();
        expect(captured.answerText).toContain(place.name);
      }
      const file = `${fest.slug}-${festivalId}.png`;
      await page.screenshot({ path: join(OUT_DIR, file), fullPage: false });
      manifest.push({
        file,
        region: fest.region,
        query: fest.query,
        festivalId,
        status: captured.status,
        host: captured.host,
        hintChars: captured.hintChars,
        hintNames,
        places: unique,
        invented,
        answerText: captured.answerText,
      });
    });
  }
});
