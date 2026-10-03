// Place page regressions shipped in #372–#376 (persona stars, gallery manage, YouTube cap, booking hrefs)
import { test, expect } from './fixtures.js';

const PLACE_SLUG = 'paris';
const PLACE_TITLE = '파리';

const AFFILIATE_LINK_SELECTOR =
  'a[href*="myrealtrip.com"], a[href*="myrealt.rip"], a[href*="klook.com"], a[href*="trip.com"], a[href*="ticketlink.co.kr"], a[href*="getyourguide"]';

async function openPlace(page) {
  await page.goto(`/place/${PLACE_SLUG}`);
  await expect(page.getByRole('button', { name: PLACE_TITLE }).first()).toBeVisible({
    timeout: 60_000,
  });
}

async function switchPlaceTab(page, nameRe) {
  const tab = page.getByRole('button', { name: nameRe }).first();
  await expect(tab).toBeVisible({ timeout: 30_000 });
  await tab.click();
}

test.describe('Place shipped features (read-only)', () => {
  test('Paris — persona, gallery manage, YouTube, planner CTAs', async ({ page }) => {
    test.setTimeout(300_000);
    await openPlace(page);

    const galleryTiles = page.locator('.columns-2 .break-inside-avoid');
    await expect(galleryTiles.first()).toBeVisible({ timeout: 120_000 });
    const tileCount = await galleryTiles.count();
    expect(tileCount, 'gallery tiles on live place').toBeGreaterThan(0);
    const brokenGallery = await galleryTiles.locator('img').evaluateAll((imgs) =>
      imgs.filter((img) => img.complete && img.naturalWidth === 0).length,
    );
    expect(brokenGallery, 'broken gallery thumbnails').toBe(0);

    // Hide / report actions (open manage sheet, cancel — do not hide or report)
    await galleryTiles.first().dblclick({ modifiers: ['ControlOrMeta'] });
    await expect(page.getByRole('button', { name: /이 사진 숨기기/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /부적절|신고/i })).toBeVisible();
    await page.getByRole('button', { name: /취소/i }).click();
    await expect(page.getByRole('button', { name: /이 사진 숨기기/i })).toBeHidden({
      timeout: 10_000,
    });

    // Persona / official (editorial) reviews — no star row (#372)
    await switchPlaceTab(page, /^리뷰$/);
    const editorialCards = page.locator('.border-indigo-100');
    await expect(editorialCards.first()).toBeVisible({ timeout: 90_000 });
    const editorialCount = await editorialCards.count();
    expect(editorialCount, 'editorial persona reviews').toBeGreaterThan(0);
    for (let i = 0; i < editorialCount; i += 1) {
      await expect(editorialCards.nth(i).locator('[data-review-stars]')).toHaveCount(0);
    }

    // YouTube section — initial cap 10, load-more when more pages exist (#375/#376)
    await switchPlaceTab(page, /유튜브 영상/i);
    await expect(page.getByText(/관련 영상을 불러오는 중|불러오는 중/i)).toHaveCount(0, {
      timeout: 120_000,
    });
    const emptyVideo = page.getByRole('heading', { name: /아직 등록된 영상이 없습니다/i });
    if (await emptyVideo.isVisible().catch(() => false)) {
      await expect(page.getByText(/멋진 영상을 알고/i)).toBeVisible();
      return;
    }

    const thumbCount = await page.evaluate(
      () => document.querySelectorAll('[class*="group/item"]').length,
    );
    expect(thumbCount, 'initial YouTube playlist visible count').toBeGreaterThan(0);
    expect(thumbCount, 'initial YouTube playlist ≤10').toBeLessThanOrEqual(10);

    const loadMore = page.getByRole('button', { name: /영상 더 보기/i });
    if (await loadMore.isVisible().catch(() => false)) {
      await expect(loadMore).toBeEnabled();
    }

    // Booking / affiliate CTAs on planner — valid hrefs, not placeholder copy
    await switchPlaceTab(page, /^여행 플래너$/);
    await page.locator('#planner-prep-flight-booking, [href*="trip.com"], [href*="klook"]').first().scrollIntoViewIfNeeded().catch(() => {});

    const affiliateLinks = page.locator(AFFILIATE_LINK_SELECTOR);
    const hrefs = await affiliateLinks.evaluateAll((anchors) =>
      anchors
        .map((a) => ({
          href: a.getAttribute('href') || '',
          text: (a.innerText || a.textContent || '').trim(),
        }))
        .filter((x) => /^https?:\/\//.test(x.href) && !x.href.includes('gateo.kr')),
    );
    expect(hrefs.length, 'planner affiliate/booking links').toBeGreaterThan(0);
    for (const { href, text } of hrefs) {
      expect(href, `booking/affiliate href: ${href}`).toMatch(/^https?:\/\//);
      expect(href, `non-empty href: ${href}`).not.toMatch(/^(https?:\/\/[^/?#]+)?\/?#?$/);
      expect(text, `link label not placeholder: ${href}`).not.toMatch(
        /^(placeholder|준비 중|coming soon|tbd)$/i,
      );
    }
  });
});
