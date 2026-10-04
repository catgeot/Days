// Place page regressions shipped in #372–#376 (persona stars, gallery manage, YouTube cap, booking hrefs)
import { test, expect } from './fixtures.js';
import { editorialReviewCards, starRatingIn } from './review-star-locators.js';

const PLACE_SLUG = 'paris';
const PLACE_TITLE = '파리';

function parseExternalHref(href) {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

function isTripComHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  return h === 'trip.com' || h.endsWith('.trip.com');
}

function isKlookHost(hostname) {
  return hostname.includes('klook.com');
}

function isMyRealTripHost(hostname) {
  return hostname.includes('myrealtrip.com') || hostname === 'myrealt.rip';
}

async function collectPlannerAffiliateHrefs(page) {
  return page.locator('a[href^="http"]').evaluateAll((anchors) => {
    const isTrip = (h) => h === 'trip.com' || h.endsWith('.trip.com');
    const isKlook = (h) => h.includes('klook.com');
    const isMrt = (h) => h.includes('myrealtrip.com') || h === 'myrealt.rip';
    return anchors
      .map((a) => ({
        href: a.getAttribute('href') || '',
        text: (a.innerText || a.textContent || '').trim(),
      }))
      .filter((x) => {
        if (!/^https?:\/\//.test(x.href) || x.href.includes('gateo.kr')) return false;
        const u = new URL(x.href);
        if (['mapbox.com', 'openstreetmap.org', 'maxar.com'].some((d) => u.hostname.includes(d))) {
          return false;
        }
        return (
          isTrip(u.hostname) ||
          isKlook(u.hostname) ||
          isMrt(u.hostname) ||
          u.hostname.includes('ticketlink.co.kr') ||
          u.hostname.includes('getyourguide.com')
        );
      });
  });
}

async function assertPlannerBookingLinks(page) {
  await switchPlaceTab(page, /^여행 플래너$/);
  await page
    .locator('#planner-prep-flight-booking')
    .first()
    .scrollIntoViewIfNeeded()
    .catch(() => {});

  const hrefs = await collectPlannerAffiliateHrefs(page);
  expect(hrefs.length, 'planner affiliate/booking links').toBeGreaterThan(0);
  for (const { href, text } of hrefs) {
    const u = parseExternalHref(href);
    expect(u, `parseable href: ${href}`).toBeTruthy();
    expect(text, `link label not placeholder: ${href}`).not.toMatch(
      /^(placeholder|준비 중|coming soon|tbd)$/i,
    );
    if (isTripComHost(u.hostname)) {
      expect(isMyRealTripHost(u.hostname), 'trip.com host must not be myrealtrip subdomain').toBe(
        false,
      );
      const qs = u.searchParams.toString();
      expect(
        u.searchParams.has('Allianceid') ||
          u.searchParams.has('AllianceId') ||
          u.searchParams.has('SID') ||
          /trip_sub1=|partners\/ad\//i.test(`${u.pathname}?${u.searchParams}`),
        `trip.com affiliate params: ${href}`,
      ).toBe(true);
    }
    if (isMyRealTripHost(u.hostname)) {
      const affiliateOk =
        /mylink_id=\d+/.test(href) ||
        (u.hostname === 'myrealt.rip' && u.pathname.length > 1);
      expect(affiliateOk, `MRT affiliate link: ${href}`).toBe(true);
    }
    if (isKlookHost(u.hostname)) {
      expect(u.searchParams.toString() || href, `klook tracking: ${href}`).not.toBe('');
    }
  }
}

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

    await galleryTiles.first().dblclick({ modifiers: ['ControlOrMeta'] });
    await expect(page.getByRole('button', { name: /이 사진 숨기기/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /부적절|신고/i })).toBeVisible();
    await page.getByRole('button', { name: /취소/i }).click();
    await expect(page.getByRole('button', { name: /이 사진 숨기기/i })).toBeHidden({
      timeout: 10_000,
    });

    await switchPlaceTab(page, /^리뷰$/);
    const editorialCards = editorialReviewCards(page);
    await expect(editorialCards.first()).toBeVisible({ timeout: 90_000 });
    const editorialCount = await editorialCards.count();
    expect(editorialCount, 'editorial persona reviews').toBeGreaterThan(0);
    for (let i = 0; i < editorialCount; i += 1) {
      await expect(starRatingIn(editorialCards.nth(i))).toHaveCount(0);
    }

    await switchPlaceTab(page, /유튜브 영상/i);
    await expect(page.getByText(/관련 영상을 불러오는 중|불러오는 중/i)).toHaveCount(0, {
      timeout: 120_000,
    });
    const emptyVideo = page.getByRole('heading', { name: /아직 등록된 영상이 없습니다/i });
    if (!(await emptyVideo.isVisible().catch(() => false))) {
      const thumbCount = await page.evaluate(
        () => document.querySelectorAll('[class*="group/item"]').length,
      );
      expect(thumbCount, 'initial YouTube playlist visible count').toBeGreaterThan(0);
      expect(thumbCount, 'initial YouTube playlist ≤10').toBeLessThanOrEqual(10);
      const loadMore = page.getByRole('button', { name: /영상 더 보기/i });
      if (await loadMore.isVisible().catch(() => false)) {
        await expect(loadMore).toBeEnabled();
      }
    } else {
      await expect(page.getByText(/멋진 영상을 알고/i)).toBeVisible();
    }

    await assertPlannerBookingLinks(page);
  });
});
