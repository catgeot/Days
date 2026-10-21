// 장소 카드 현지 정보 v2 — 검색 → 카드 → 탭. WebKit 390.
import { test, expect } from './fixtures.js';

test.use({ ignoreHTTPSErrors: true });

async function openHomeSearch(page) {
  await page.goto('/?lang=ko');
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible();
  return input;
}

async function openPlaceFromSearch(page, query, resultText) {
  const input = await openHomeSearch(page);
  await input.fill(query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: resultText })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
}

async function openTab(page, name) {
  const button = page.getByRole('button', { name, exact: true }).locator('visible=true').first();
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
}

test.describe('place card local info v2', () => {
  test('카이로 검색에서 각 탭의 확인된 사실만 접어서 보여 준다', async ({ page }) => {
    await openPlaceFromSearch(page, '카이로', '카이로여행지');
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });

    const gallery = page.locator('[data-local-info="gallery"]:visible');
    await expect(gallery).toBeVisible();
    await expect(gallery).toContainText('현지 정보');
    await expect(gallery).toContainText('4개 주제');
    await expect(gallery).toHaveAttribute(
      'data-unverified-items',
      '확인 안 된 항목: 머물 지역, 시즌',
    );
    const factsHeader = page.getByRole('button', { name: /현지 정보/ }).first();
    await factsHeader.click();
    const rows = page.locator('[data-local-info-row]:visible');
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText('입국');
    await expect(rows.nth(1)).toContainText('공항→시내');
    await expect(rows.nth(2)).toContainText('1·2·3일 동선');
    await expect(rows.nth(3)).toContainText('돈·치안');
    await expect(page.locator('[data-local-info-row="stay-area"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-local-info-row="season"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-fact-source]:visible')).toHaveCount(0);

    const urlBefore = page.url();
    await page.locator('[data-local-info-row="entry"]:visible button').click();
    await expect(page.locator('[data-fact-source]:visible')).toContainText('visa2egypt.gov.eg');
    await expect(page.locator('[data-fact-checked-at]:visible')).toContainText('2026-10-11');
    await expect(page).toHaveURL(urlBefore);

    const airportRow = page.locator('[data-local-info-row="airport"]:visible');
    await airportRow.locator('button').click();
    const airportMeta = airportRow.locator('[data-fact-checked-at]');
    await expect(airportMeta).toContainText('카이로국제공항 교통 안내 · 확인일 2026-10-11');
    await expect(airportMeta.locator('a')).toHaveCount(0);

    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    if (await storiesHeader.isVisible().catch(() => false)) {
      await storiesHeader.click();
    }
    const storyTitles = await page.locator('[data-visit-story-title]:visible').allTextContents();
    for (const title of storyTitles) {
      const text = title.trim();
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toBe('카이로');
      expect(text).not.toBe('Cairo');
      expect(text).not.toMatch(/예시|placeholder|lorem/i);
    }

    await openTab(page, '여행 스케치');
    await expect(page).toHaveURL(/\/place\/cairo\/wiki/);
    await expect(page.locator('[data-verified-facts]:visible')).toHaveCount(0);
    await expect(page.getByText('GATEO 여행 스케치').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-local-info="sketch"]:visible').first()).toBeVisible({ timeout: 30_000 });
    const sketchSlots = await page.locator('[data-local-info="sketch"]:visible').evaluateAll((els) => (
      els.map((el) => el.getAttribute('data-fact-slot'))
    ));
    expect(sketchSlots.length).toBeGreaterThan(0);
    expect(new Set(sketchSlots).size).toBe(sketchSlots.length);

    await openTab(page, '유튜브 영상');
    await expect(page).toHaveURL(/\/place\/cairo\/video/);
    await openTab(page, '리뷰');
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/);
    await expect(page.getByRole('button', { name: '사진 보기' }).first()).toBeVisible();

    await openTab(page, '여행 플래너');
    await expect(page).toHaveURL(/\/place\/cairo\/planner/);
    await expect(page.locator('[data-verified-facts]:visible')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '확인된 입국 정보' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: '확인된 돈·치안 정보' })).toBeVisible();
    await expect(page.locator('[data-fact-slot="itinerary"]:visible')).toHaveCount(0);
    await page.getByRole('tab', { name: '이동·통신' }).click();
    await expect(page.getByRole('button', { name: '확인된 공항→시내 정보' })).toBeVisible();
  });

  test('기자 피라미드 검색에서 명소 슬롯도 같은 접힘 규칙이다', async ({ page }) => {
    await openPlaceFromSearch(page, '기자 피라미드', '카이로 기자피라미드');
    await expect(page).toHaveURL(/\/place\/giza-pyramids(?:\/|$|\?)/, { timeout: 30_000 });

    await page.getByRole('button', { name: /현지 정보/ }).first().click();
    const rows = page.locator('[data-local-info-row]:visible');
    await expect(rows).toHaveCount(5);
    await expect(page.locator('[data-local-info-row="hours"]:visible')).toContainText('운영시간');
    await expect(page.locator('[data-local-info-row="fee"]:visible')).toContainText('요금');
    await expect(page.locator('[data-local-info-row="duration"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-local-info-row="nearby-food"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-fact-source]:visible')).toHaveCount(0);

    await page.locator('[data-local-info-row="hours"]:visible button').click();
    await expect(page.locator('[data-fact-checked-at]:visible')).toContainText('2026-10-11');
    await expect(page).toHaveURL(/\/place\/giza-pyramids(?:\/|$|\?)/);

    await openTab(page, '여행 스케치');
    await expect(page).toHaveURL(/\/place\/giza-pyramids\/wiki/);
    await expect(page.locator('[data-verified-facts]:visible')).toHaveCount(0);
    await openTab(page, '유튜브 영상');
    await expect(page).toHaveURL(/\/place\/giza-pyramids\/video/);
    await openTab(page, '리뷰');
    await expect(page).toHaveURL(/\/place\/giza-pyramids\/reviews/);
    await openTab(page, '여행 플래너');
    await expect(page).toHaveURL(/\/place\/giza-pyramids\/planner/);
    await expect(page.locator('[data-local-info="planner"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-verified-facts]:visible')).toHaveCount(0);
  });

  test('확인된 사실이 없는 도시는 빈 현지 정보 칸이 없다', async ({ page }) => {
    const places = [
      ['paris', '파리'],
      ['gangneung', '강릉'],
      ['addis-ababa', '아디스아바바'],
    ];
    for (const [slug, label] of places) {
      for (const tab of ['', '/wiki', '/planner']) {
        await page.goto(`/place/${slug}${tab}?lang=ko`);
        await expect(page.getByText(label).first()).toBeVisible({ timeout: 30_000 });
        await expect(page.locator('[data-local-info]:visible')).toHaveCount(0);
        await expect(page.locator('[data-visit-stories]:visible')).toHaveCount(0);
        await expect(page.locator('[data-verified-facts]:visible')).toHaveCount(0);
      }
    }
  });
});
