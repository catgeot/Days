import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';

const OUT = join(process.cwd(), 'docs/qa/pr493');
const VIEWPORT = { width: 390, height: 844 };
const K_DRONE_ID = '4116994';
const GANGNEUNG_NOODLES_ID = '2930716';
const GUKHYANG_ID = '638576';
const manifest = [];

const MOONI_CONFIG_CAUSE =
  'MOONi «설정 오류 — 관리자에게 문의» = gemini-proxy CONFIG (HTTP 401 / Invalid JWT) when VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY were empty at vite build. ' +
  'With keys baked in, local https://127.0.0.1:4173 preview still cannot complete MOONi: gemini-proxy returns 403 origin_not_allowed (only www.gateo.kr, gateo.kr, and days-git-*-catgeots-projects.vercel.app). ' +
  'Automated shot 03 uses PR preview + Playwright gemini-proxy mock; humans verify live MOONi on www.gateo.kr or Vercel git preview (allowed Origin).';
const MOONI_CAPTURE_BASE = (process.env.PR493_MOONI_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || '')
  .replace(/\/$/, '') || 'https://127.0.0.1:4173';

async function installPr493AccessGeminiMock(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const text =
      '서울역에서 KTX로 강릉역까지 이동할 수 있습니다. 출발편·시각은 코레일 앱에서 확인하세요.';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody(text, { modelUsed: 'pr493-qa-access-mock' }),
      ),
    });
  });
}

const ACCESS_ANSWER_RE =
  /버스타고|KTX|SRT|고속버스|시외버스|출발편|동대구|서울역|마산역|강릉역|함평|광주송정|인천종합|대중교통|이동할 수/i;

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

async function shot(page, file, meta = {}) {
  const path = join(OUT, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  manifest.push({ file, ...meta });
  return path;
}

async function assertNoBrokenImageGlyphs(page, scope = page) {
  const broken = await scope.locator('img').evaluateAll((imgs) =>
    imgs.filter((el) => {
      const visible = el.offsetParent !== null || el.getClientRects().length > 0;
      return visible && el.complete && el.naturalWidth === 0 && el.src && !el.src.startsWith('data:');
    }).length,
  );
  expect(broken, 'broken-image glyphs (visible img naturalWidth=0)').toBe(0);
}

async function openFestivalHubFromHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i })
    .click({ timeout: 180_000 });
  await page
    .getByRole('link', { name: /한국의 축제로 이동|Go to Korea festivals/i })
    .click();
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function selectSidoChip(page, namePattern) {
  const chip = page.getByRole('button', { name: namePattern }).first();
  await expect(chip).toBeVisible({ timeout: 60_000 });
  await chip.click();
}

async function openFestivalById(page, festivalId) {
  const card = page.locator(`[data-festival-id="${festivalId}"]`).first();
  await expect(card).toBeVisible({ timeout: 120_000 });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog;
}

async function openFirstMatchingCard(page, pattern) {
  const cards = page.getByRole('main').locator('[data-festival-id]');
  await expect(cards.first()).toBeVisible({ timeout: 120_000 });
  const card = cards.filter({ hasText: pattern }).first();
  await expect(card).toBeVisible({ timeout: 120_000 });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog;
}

async function waitNearbySectionsSettled(dialog) {
  await expect(dialog.getByText(/주변.*불러오는 중|Loading nearby/i)).toHaveCount(0, {
    timeout: 120_000,
  });
}

async function waitDetailBottomFullySettled(page, dialog) {
  await waitNearbySectionsSettled(dialog);
  await expect(dialog.locator('[data-festival-below-loading]')).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect(dialog.locator('[data-festival-below-reserve]')).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect(dialog.locator('[data-festival-lodging-reserve]')).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect(dialog.locator('[data-festival-food-reserve]')).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect(dialog.locator('[data-festival-leports-reserve]')).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect(dialog.locator('[data-festival-culture-reserve]')).toHaveCount(0, {
    timeout: 120_000,
  });
  await expect
    .poll(
      async () => await dialog.locator('[data-nearby-thumb-pending]').count(),
      { timeout: 120_000 },
    )
    .toBe(0);
  await page.waitForLoadState('networkidle', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function openFirstMatchingCardWithId(page, pattern) {
  const cards = page.getByRole('main').locator('[data-festival-id]');
  await expect(cards.first()).toBeVisible({ timeout: 120_000 });
  const card = cards.filter({ hasText: pattern }).first();
  await expect(card).toBeVisible({ timeout: 120_000 });
  const festivalId = await card.getAttribute('data-festival-id');
  const title = (await card.innerText()).split('\n')[0]?.trim();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return { dialog, festivalId, title };
}

async function closeDetail(page) {
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) {
    await page.getByRole('button', { name: /^닫기$|^Close$/i }).last().click();
    await expect(dialog).toHaveCount(0, { timeout: 30_000 });
  }
}

function accessAnswerBubble(page) {
  return page
    .locator('.flex.flex-col.w-full.items-start')
    .filter({ has: page.getByText('MOONi', { exact: true }) })
    .filter({ hasNotText: /뒤 시작해요/ })
    .filter({ hasText: ACCESS_ANSWER_RE })
    .last()
    .locator('div.rounded-2xl')
    .last();
}

function festivalMooniEntry(page) {
  return page
    .getByRole('button', { name: /무니에게 이 축제|Ask MOONi about this festival/i })
    .or(page.locator('[data-festival-mooni-inline]').first());
}

async function captureMooniAccessAnswer(page, festivalId, file, meta) {
  const base = MOONI_CAPTURE_BASE;
  const isLocalPreview = /127\.0\.0\.1|localhost/.test(base);
  if (isLocalPreview) {
    await page.goto(`${base}/korea`, { waitUntil: 'load', timeout: 120_000 });
    await dismissLocHint(page);
    await ensureFestivalWindowLoaded(page);
    await selectSidoChip(page, /강원/);
    await openFestivalById(page, festivalId);
  } else {
    await page.goto(`${base}/korea?festival=${festivalId}`, {
      waitUntil: 'load',
      timeout: 120_000,
    });
    await dismissLocHint(page);
  }
  await expect(page.locator('[data-festival-hero]').first()).toBeVisible({ timeout: 120_000 });
  const mooniBtn = festivalMooniEntry(page);
  await mooniBtn.scrollIntoViewIfNeeded();
  await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
  await mooniBtn.click({ timeout: 60_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 180_000 });
  await page.getByRole('button', { name: /🚆\s*가는 법/ }).first().click({ force: true });
  const dock = page.getByTestId('mooni-festival-access-dock');
  await expect(dock).toBeVisible({ timeout: 30_000 });
  await dock.locator('[data-festival-origin="seoul"]').click({ force: true });
  const answer = accessAnswerBubble(page);
  await expect(answer).toBeVisible({ timeout: 300_000 });
  await expect(answer).not.toContainText('설정 오류');
  const answerText = (await answer.innerText()).trim();
  expect(answerText).toMatch(ACCESS_ANSWER_RE);
  await answer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, file, {
    ...meta,
    mooniCaptureBase: MOONI_CAPTURE_BASE,
    mooniOrigin: 'seoul',
    mooniAnswerExcerpt: answerText.replace(/\s+/g, ' ').slice(0, 160),
    mooniConfigCause: MOONI_CONFIG_CAUSE,
  });
  const appBase = (process.env.PLAYWRIGHT_BASE_URL || 'https://www.gateo.kr').replace(/\/$/, '');
  await page.goto(`${appBase}/korea`, { waitUntil: 'domcontentloaded' });
  await dismissLocHint(page);
}

async function describeGreyPlaceholders(page, dialog) {
  return dialog.evaluate(() => {
    const pendingNearby = document.querySelectorAll('[data-nearby-thumb-pending]').length;
    const emptyNearby = document.querySelectorAll('[data-nearby-thumb="empty"]').length;
    const photoReserve = document.querySelectorAll('[data-festival-photo-reserve]').length;
    const heroPending = document.querySelectorAll('[data-festival-photo-pending]').length;
    const belowLoading = document.querySelectorAll('[data-festival-below-loading]').length;
    return { pendingNearby, emptyNearby, photoReserve, heroPending, belowLoading };
  });
}

async function abortVisitKoreaImages(page) {
  await page.route('**/*tong.visitkorea.or.kr/**', (route) => route.abort());
  await page.route('**/*cdn.visitkorea.or.kr/**', (route) => route.abort());
}

const LOADING_DETAIL_RE = /상세.*불러오는 중|Loading.*detail/i;

async function ensureFestivalWindowLoaded(page) {
  const loadError = page.getByText('축제 목록을 불러오지 못했습니다');
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (!(await loadError.isVisible().catch(() => false))) break;
    await page.getByRole('button', { name: '다시 시도' }).click();
    await page.waitForTimeout(4000);
  }
  await expect(page.getByRole('button', { name: /^(전남|서울|강원) \d+$/ }).first()).toBeVisible({
    timeout: 120_000,
  });
}

async function waitForFestivalDetailBody(page, { timeout = 120_000 } = {}) {
  const hero = page.locator('[data-festival-hero]').first();
  await expect(hero).toBeVisible({ timeout });
  const dialog = page.getByRole('dialog').filter({ has: hero });
  if (await dialog.count()) {
    await expect(dialog.getByText(LOADING_DETAIL_RE)).toHaveCount(0, { timeout });
    return dialog.first();
  }
  return hero.locator('xpath=ancestor::*[@role="dialog"][1]').or(hero.locator('..').locator('..'));
}

test.describe('PR493 festival detail follow-ups — WebKit 390 user flow', () => {
  test.setTimeout(600_000);

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.afterAll(async () => {
    const readme = [
      '# PR493 QA captures',
      '',
      '## MOONi config error (shot 03)',
      MOONI_CONFIG_CAUSE,
      '',
      '## Grey boxes (shots 04–05 vs 04b/05b)',
      '04/05 = scroll snap while nearby thumbs still pending. 04b/05b = after `networkidle`, `[data-festival-below-reserve]` count 0, and `[data-nearby-thumb-pending]` count 0 (same festivalId as 04/05 in manifest).',
      '',
      'See `manifest.json` for per-file metadata.',
    ].join('\n');
    await writeFile(join(OUT, 'README.md'), `${readme}\n`);
    await writeFile(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  });

  test('A — MOONi 가는 법 답변', async ({ page, context }) => {
    test.setTimeout(300_000);
    await installPr493AccessGeminiMock(context);
    await captureMooniAccessAnswer(page, K_DRONE_ID, '03-gangwon-mooni-access-answer.png', {
      surface: 'MOONi 가는 법 — 서울 출발 칩 탭 후 답변 (PR preview + gemini mock)',
      region: '강원',
      festivalId: K_DRONE_ID,
      geminiNote:
        'Live gemini-proxy on local preview: 403 origin_not_allowed; on www.gateo.kr automated WebKit still showed CONFIG — mock used for stable QA capture.',
    });
  });

  test('강원 K-Drone · 서울·영남 스크롤', async ({ page }) => {
    await openFestivalHubFromHome(page);
    await shot(page, '01-festival-hub.png', { surface: 'festival hub after home entry' });

    await selectSidoChip(page, /강원/);
    await openFestivalById(page, K_DRONE_ID);
    const kDroneDialog = page.getByRole('dialog');
    await waitNearbySectionsSettled(kDroneDialog);

    const heroState = await page.evaluate(() => {
      const heroImg = document.querySelector('[data-festival-hero] img[data-festival-photo]');
      const underlay = document.querySelector('[data-festival-hero-underlay]');
      const fallbackSlot = document.querySelector('[data-festival-hero-fallback]');
      return {
        heroSrc: heroImg?.getAttribute('src') || '',
        heroNaturalWidth: heroImg?.naturalWidth || 0,
        heroComplete: Boolean(heroImg?.complete),
        underlayVisible: Boolean(underlay),
        fallbackSlotVisible: Boolean(fallbackSlot),
      };
    });

    await shot(page, '02-gangwon-k-drone-hero.png', {
      surface: '강원 K-Drone Festival hero (pin underlay while CDN loads; not an empty festival)',
      region: '강원',
      festivalId: K_DRONE_ID,
      heroHasVisitKoreaUrl: /visitkorea/i.test(heroState.heroSrc),
      heroDecodedAtCapture: heroState.heroNaturalWidth > 0,
      heroNote:
        heroState.heroNaturalWidth > 0
          ? 'Hero photo decoded before capture (VisitKorea CDN).'
          : 'Hero still loading at capture — amber pin gradient underlay (`data-festival-hero-underlay`) replaces plain grey box.',
      ...heroState,
    });

    await openFestivalHubFromHome(page);
    await selectSidoChip(page, /서울/);
    const seoulOpen = await openFirstMatchingCardWithId(page, /서울|한강|문화|축제/i);
    const seoulDialog = seoulOpen.dialog;
    await waitNearbySectionsSettled(seoulDialog);
    const seoulGrey = await describeGreyPlaceholders(page, seoulDialog);
    await seoulDialog.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await page.waitForTimeout(500);
    await shot(page, '04-seoul-detail-scroll.png', {
      surface: '서울 권역 축제 상세 하단 스크롤 (주변 로딩 중 스냅)',
      region: '서울',
      festivalId: seoulOpen.festivalId,
      festivalTitle: seoulOpen.title,
      greyPlaceholderReport: {
        ...seoulGrey,
        interpretation:
          'Grey tiles = nearby thumb pending shimmers / inline strip loading — not broken images. Sections appear when `belowSectionsLoading` clears.',
      },
    });
    await waitDetailBottomFullySettled(page, seoulDialog);
    const seoulSettledGrey = await describeGreyPlaceholders(page, seoulDialog);
    await seoulDialog.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await page.waitForTimeout(500);
    await shot(page, '04b-seoul-settled.png', {
      surface: '서울 권역 — 명소 더보기 아래 food/leports/culture/stay 정착 후',
      region: '서울',
      festivalId: seoulOpen.festivalId,
      festivalTitle: seoulOpen.title,
      settled: true,
      greyPlaceholderReport: seoulSettledGrey,
      belowReserveCount: await seoulDialog.locator('[data-festival-below-reserve]').count(),
      pendingNearbyCount: seoulSettledGrey.pendingNearby,
    });
    await closeDetail(page);

    await selectSidoChip(page, /경남|부산|대구|울산|경북/);
    const yeongnamOpen = await openFirstMatchingCardWithId(page, /축제|페스티벌|문화|대회/i);
    const yeongnamDialog = yeongnamOpen.dialog;
    await waitNearbySectionsSettled(yeongnamDialog);
    const foodVisible = await yeongnamDialog.locator('[data-festival-section="nearFood"]').count();
    const leportsVisible = await yeongnamDialog.locator('[data-festival-section="nearLeports"]').count();
    const yeongnamGrey = await describeGreyPlaceholders(page, yeongnamDialog);
    await yeongnamDialog.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight });
    });
    await page.waitForTimeout(500);
    await shot(page, '05-yeongnam-detail-empty-sections.png', {
      surface: '영남·부산 권 축제 — 맛집/레포츠 0건이면 섹션 없음 (주변 로딩 중 스냅)',
      region: '영남',
      festivalId: yeongnamOpen.festivalId,
      festivalTitle: yeongnamOpen.title,
      nearFoodVisible: foodVisible > 0,
      nearLeportsVisible: leportsVisible > 0,
      greyPlaceholderReport: yeongnamGrey,
    });
    await waitDetailBottomFullySettled(page, yeongnamDialog);
    const yeongnamSettledGrey = await describeGreyPlaceholders(page, yeongnamDialog);
    await yeongnamDialog.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight });
    });
    await page.waitForTimeout(500);
    await shot(page, '05b-yeongnam-settled.png', {
      surface: '영남·부산 권 — 명소 더보기 아래 정착 후',
      region: '영남',
      festivalId: yeongnamOpen.festivalId,
      festivalTitle: yeongnamOpen.title,
      settled: true,
      nearFoodVisible: await yeongnamDialog.locator('[data-festival-section="nearFood"]').count(),
      nearLeportsVisible: await yeongnamDialog.locator('[data-festival-section="nearLeports"]').count(),
      greyPlaceholderReport: yeongnamSettledGrey,
      belowReserveCount: await yeongnamDialog.locator('[data-festival-below-reserve]').count(),
      pendingNearbyCount: yeongnamSettledGrey.pendingNearby,
    });
    await closeDetail(page);
  });

  test('VisitKorea images aborted — pin fallbacks, no broken glyphs', async ({ page }) => {
    await abortVisitKoreaImages(page);
    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await ensureFestivalWindowLoaded(page);
    await page.goto(`/korea?festival=${GUKHYANG_ID}`, { waitUntil: 'domcontentloaded' });
    const dialog = await waitForFestivalDetailBody(page);
    await expect(dialog.locator('[data-festival-hero-underlay]').first()).toBeVisible({
      timeout: 45_000,
    });
    await assertNoBrokenImageGlyphs(page, dialog);
    await shot(page, '06-abort-hero.png', { surface: 'image abort — hero pin fallback', festivalId: GUKHYANG_ID });

    const stripMode = await dialog.locator('[data-festival-hero-thumbs]').getAttribute('data-festival-photo-strip');
    if (stripMode === 'open') {
      const strip = dialog.locator('[data-festival-hero-thumbs] [role="listbox"]');
      await expect(strip.locator('[data-thumb-fallback="1"]').first()).toBeVisible({ timeout: 60_000 });
      await shot(page, '07-abort-filmstrip.png', { surface: 'image abort — filmstrip thumbs', stripMode });
    } else {
      await shot(page, '07-abort-filmstrip.png', {
        surface: 'image abort — hero (filmstrip collapsed: <2 decoded photos when CDN aborted)',
        stripMode: stripMode || 'collapsed',
      });
    }

    const photosTab = dialog.getByRole('tab', { name: /사진|Photos/i });
    if (await photosTab.count()) {
      await photosTab.click();
      await page.waitForTimeout(600);
      await expect(dialog.locator('[data-thumb-fallback="1"]').first()).toBeVisible({ timeout: 60_000 });
      await assertNoBrokenImageGlyphs(page, dialog);
      await shot(page, '08-abort-photo-tab.png', { surface: 'image abort — photo tab' });
    }

    await dialog.locator('[data-festival-hero]').first().click();
    const lightbox = page.getByRole('dialog', { name: /확대|lightbox|사진/i });
    await expect(lightbox).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(400);
    await assertNoBrokenImageGlyphs(page);
    await shot(page, '09-abort-lightbox.png', { surface: 'image abort — lightbox' });
    await page.getByRole('button', { name: /닫기|Close/i }).last().click();

    await waitNearbySectionsSettled(dialog);
    const near = dialog.locator('[data-festival-section="nearAttractions"]');
    if (await near.count()) {
      await near.scrollIntoViewIfNeeded();
      await expect(near.locator('[data-nearby-thumb="empty"], [data-thumb-fallback="1"]').first()).toBeVisible({
        timeout: 120_000,
      });
      await assertNoBrokenImageGlyphs(page, near);
      await shot(page, '10-abort-nearby-cards.png', { surface: 'image abort — nearby cards' });
    }
  });
});
