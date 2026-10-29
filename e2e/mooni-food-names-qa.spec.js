/**
 * Staging gemini-proxy — typed «근처 맛집 추천해 줘» (WebKit 390×844).
 *
 * Restaurant lists come from prod tourapi-proxy (read-only). gemini-proxy stays on staging.
 * MOONI_STAGING_COMBO_QA=1 PLAYWRIGHT_BASE_URL=http://localhost:5173 \
 *   npx playwright test -c playwright.config.mooni-food-names.js
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';

const LIVE = process.env.MOONI_STAGING_COMBO_QA === '1';
const OUT_DIR = process.env.MOONI_FOOD_NAMES_OUT || '/opt/cursor/artifacts/food-names-390';
const FOOD_ASK = '근처 맛집 추천해 줘';
const PARKING_ASK = '주차장 어디예요?';
const SIGHTS_ASK = '이 축제에서 볼 수 있는 것과 현장 분위기를 알려줘. 확인된 프로그램과 시간만 말하고, 데이터에 없는 붐비는 시간은 지어내지 마.';
const PROD_SUPABASE = String(process.env.GATEO_PROD_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const PROD_ANON = String(process.env.GATEO_PROD_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

const FESTIVALS = [
  { query: '국향대전', title: /국향대전/, slug: 'gukhyang', region: '전남', festivalId: '638576', ask: FOOD_ASK, kind: 'food' },
  { query: '마산', title: /마산|가고파/, slug: 'masan', region: '경남', festivalId: '637693', ask: FOOD_ASK, kind: 'food' },
  { query: '강릉 국수', title: /강릉 국수/, slug: 'gangneung', region: '강원', festivalId: '2930716', ask: FOOD_ASK, kind: 'food' },
  { query: '광명동굴', title: /광명동굴 빛/, slug: 'gwangmyeong-park', region: '경기', festivalId: '3551206', ask: PARKING_ASK, kind: 'parking' },
  { query: '국향대전', title: /국향대전/, slug: 'gukhyang-park', region: '전남', festivalId: '638576', ask: PARKING_ASK, kind: 'parking' },
  { query: '국향대전', title: /국향대전/, slug: 'gukhyang-sights', region: '전남', festivalId: '638576', ask: SIGHTS_ASK, kind: 'sights' },
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
  {
    contentId: '3551206',
    contentTypeId: '15',
    title: '광명동굴 빛 축제',
    eventStartDate: '20261016',
    eventEndDate: '20261017',
    addr1: '경기도 광명시 가학로 85번길',
    mapx: '126.8627080043',
    mapy: '37.4210442021',
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
  if (!PROD_SUPABASE || !PROD_ANON) return;
  await context.route(/\/rest\/v1\/tourapi_attraction/i, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'GET, HEAD, OPTIONS',
        },
      });
      return;
    }
    const url = new URL(req.url());
    const prod = new URL(PROD_SUPABASE);
    url.protocol = prod.protocol;
    url.host = prod.host;
    const res = await fetch(url, {
      headers: {
        apikey: PROD_ANON,
        Authorization: `Bearer ${PROD_ANON}`,
        Accept: 'application/json',
      },
    });
    const body = await res.text();
    console.log(`[food-names] attractions ${res.status} bytes=${body.length}`);
    await route.fulfill({
      status: res.status,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'content-type': 'application/json',
      },
      body,
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

async function openFestivalFromHome(page, { query, title, kind }) {
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
  if (kind === 'food') {
    const food = dialog.locator('[data-festival-section="nearFood"]');
    await expect(food).toBeVisible({ timeout: 90_000 });
    await expect(food.locator('li').first()).toBeVisible({ timeout: 30_000 });
  }
  await expect(dialog).toHaveAttribute('data-nearby-parking', 'ready', { timeout: 90_000 });
  return { festivalId, dialog };
}

async function openMooniAndAsk(page, ask) {
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
    return raw.includes(ask);
  }, { timeout: 240_000 });
  await input.fill(ask);
  await input.locator('xpath=ancestor::form').locator('button[type="submit"]').click();
  const response = await responsePromise;
  const posted = response.request().postDataJSON();
  const hint = String(posted?.params?.koreaFestivalHint || '');
  const host = new URL(response.url()).hostname;
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
    const byId = new Map();
    for (const name of readdirSync(OUT_DIR).filter((file) => file.endsWith('.result.json'))) {
      const row = JSON.parse(readFileSync(join(OUT_DIR, name), 'utf8'));
      if (row?.slug) byId.set(String(row.slug), row);
    }
    for (const row of manifest) byId.set(String(row.slug), row);
    const rows = FESTIVALS.map((fest) => byId.get(fest.slug)).filter(Boolean);
    if (!rows.length) return;
    manifest.splice(0, manifest.length, ...rows);
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
      'WebKit 390 on staging gemini-proxy. Food asks, parking asks, and the 국향대전 sights ask.',
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
        `### ${row.region} ${row.slug} ${row.festivalId}`,
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
    test(`${fest.slug} ${fest.kind}`, async ({ page }) => {
      await blockSlowExternals(page.context());
      await installTourApi(page.context());
      const { festivalId } = await openFestivalFromHome(page, fest);
      expect(festivalId).toBe(fest.festivalId);
      const captured = await openMooniAndAsk(page, fest.ask);
      expect(captured.status).toBe(200);
      expect(captured.host).toBe('qeqszwxjvhnbzhkchera.supabase.co');
      expect(captured.hintChars).toBeGreaterThan(0);
      expect(captured.hintChars).toBeLessThanOrEqual(8000);
      const hintNames = captured.hintRestaurants.map((row) => row.name);
      const places = fest.kind === 'food'
        ? captured.answerLinks
          .filter((row) => hintNames.includes(row.name) || hintNames.some((name) => name.includes(row.name) || row.name.includes(name)))
          .filter((row) => row.name && !/gateo\.kr|상세/.test(row.name))
        : [];
      const unique = [];
      for (const row of places) {
        if (unique.some((item) => item.name === row.name)) continue;
        const hint = captured.hintRestaurants.find((item) => item.name === row.name)
          || captured.hintRestaurants.find((item) => item.name.includes(row.name) || row.name.includes(item.name));
        const meta = String(hint?.meta || '');
        const distance = (meta.match(/도보\s*\d+분|차로\s*\d+분|\d+m|\d+-min walk|\d+-min drive/) || [])[0]
          || '';
        const type = (meta.split('·').map((part) => part.trim()).find((part) => part && !/도보|차로|drive|\d+m|walk/.test(part))) || '';
        unique.push({
          name: row.name,
          url: row.url || hint?.url || '',
          inHint: Boolean(hint),
          type,
          distance,
          httpStatus: null,
        });
      }
      const invented = fest.kind === 'food'
        ? captured.answerLinks
          .map((row) => row.name)
          .filter((name) => name && !/gateo\.kr|상세|숙소|기차|버스|페이지|홈페이지|안내/.test(name))
          .filter((name) => !hintNames.some((hintName) => hintName.includes(name) || name.includes(hintName)))
        : [];
      const file = `${fest.slug}-${festivalId}.png`;
      await page.screenshot({ path: join(OUT_DIR, file), fullPage: false });
      const row = {
        file,
        slug: fest.slug,
        kind: fest.kind,
        ask: fest.ask,
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
        answerLinks: captured.answerLinks,
      };
      manifest.push(row);
      writeFileSync(join(OUT_DIR, `${fest.slug}.result.json`), `${JSON.stringify(row)}\n`, 'utf8');
      const gapCount = captured.answerText.split('확인된 정보가 없어요').length - 1;
      expect(gapCount).toBeLessThanOrEqual(1);
      expect(captured.answerText).not.toMatch(/여행자는 이 답을 보고 바로 찾아갈 수 있어요|링크를 누르면 그 가게를 바로 찾을 수 있어요|사용자는 이 답을 보고 실제로 가게를 찾아가요/);
      if (fest.kind === 'food') {
        expect(hintNames.length).toBeGreaterThan(0);
        expect(hintNames.length).toBeLessThanOrEqual(4);
        expect(invented).toEqual([]);
        expect(unique.length).toBe(hintNames.length);
        expect(unique.length).toBeLessThanOrEqual(4);
        for (const place of unique) {
          expect(place.inHint).toBe(true);
          expect(place.url).toMatch(/^https?:\/\//);
          expect(place.distance).toBeTruthy();
          expect(captured.answerText).toContain(place.name);
          if (place.type) expect(captured.answerText).toContain(place.type);
        }
        if (fest.festivalId === '637693') {
          expect(captured.answerText).toMatch(/많지 않아요/);
          expect(captured.answerText).toMatch(/차로/);
          expect(captured.answerText).toMatch(/축제 페이지/);
        }
        expect(captured.answerText).not.toMatch(/주차 안내는 공식 홈페이지에 있어요/);
      }
      const linkBlob = `${captured.answerText}\n${captured.answerLinks.map((row) => `${row.name} ${row.url}`).join('\n')}`;
      if (fest.kind === 'parking' && fest.festivalId === '3551206') {
        expect(linkBlob).toMatch(/광명동굴/);
        expect(linkBlob).toMatch(/가능/);
        expect(linkBlob).toMatch(/가학로/);
        expect(captured.answerText).not.toMatch(/걸어서\s*\d+\s*분|도보\s*\d+\s*분/);
        expect(captured.answerText).not.toMatch(/^주차 안내는 공식 홈페이지에 있어요\.?$/);
      }
      if (fest.kind === 'parking' && fest.festivalId === '638576') {
        expect(linkBlob).toMatch(/hpftf\.or\.kr/);
        expect(captured.answerText).not.toMatch(/보광사/);
        expect(captured.answerText).not.toMatch(/^주차 안내는 공식 홈페이지에 있어요\.?$/);
      }
    });
  }
});
