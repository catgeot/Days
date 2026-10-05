// YouTube tab session: load-more must survive channel switches and card re-entry.
// Edge and place_videos are mocked. A full reload is the only path back to the DB row.
import { test, expect } from './fixtures.js';

const VIEWPORT = { width: 390, height: 844 };

function rows(prefix, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix}-title-${i}`,
    ai_context: { tags: [], timeline: [] },
  }));
}

function placePrefix(urlOrId) {
  return /hanoi|하노이|Hanoi/i.test(String(urlOrId || '')) ? 'hanoi' : 'sapa';
}

async function installVideoMocks(page, state) {
  state.db = 0;
  state.edge = 0;

  await page.route(/\.supabase\.co\//i, async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'not logged in' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });

  await page.route('**/rest/v1/place_videos**', async (route) => {
    state.db += 1;
    const prefix = placePrefix(decodeURIComponent(route.request().url()));
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.pgrst.object+json',
      body: JSON.stringify({ videos: rows(prefix, 5) }),
    });
  });

  await page.route('**/functions/v1/fetch-place-videos**', async (route) => {
    state.edge += 1;
    let placeId = '';
    try {
      placeId = route.request().postDataJSON()?.placeId || '';
    } catch {
      placeId = '';
    }
    const prefix = `${placePrefix(placeId)}-more`;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        videos: rows(prefix, 10),
        nextPageToken: 'T1',
        paginationSource: 'primary',
      }),
    });
  });

  await page.route('**/functions/v1/pexels-proxy**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ photos: [] }),
    });
  });
}

async function openPlaceVideo(page, slug, title) {
  await page.addInitScript(() => {
    window.localStorage.setItem('gateo.locale', 'ko');
  });
  await page.goto(`/place/${slug}/video`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: title }).first()).toBeVisible();
  await expect(page.getByText('관련 영상을 불러오는 중...')).toHaveCount(0);
}

function playlistHeading(page) {
  return page.getByRole('heading', { name: /재생 목록 \(\d+\)/ });
}

async function openPlaylist(page) {
  const heading = playlistHeading(page);
  if (!(await heading.isVisible().catch(() => false))) {
    await page.locator('.bottom-32.right-4 button').first().click();
  }
  await expect(heading).toBeVisible();
  const text = await heading.innerText();
  return Number(text.match(/\((\d+)\)/)?.[1]);
}

async function closePlaylist(page) {
  const heading = playlistHeading(page);
  if (!(await heading.isVisible().catch(() => false))) return;
  const sheet = page.locator('div.fixed.inset-0').filter({ hasText: '재생 목록' }).last();
  await sheet.getByRole('button').first().click();
  await expect(heading).toBeHidden();
}

async function clientNavigate(page, path) {
  await page.evaluate((href) => {
    const url = new URL(href, window.location.origin);
    window.history.pushState(window.history.state, '', `${url.pathname}${url.search}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
  }, path);
  await expect.poll(() => page.evaluate(() => window.location.pathname)).toBe(path);
}

test.describe('YouTube load-more session', () => {
  test.use({ viewport: VIEWPORT });

  test('load more then other channels keeps the playlist', async ({ page }) => {
    const state = {};
    await installVideoMocks(page, state);
    await openPlaceVideo(page, 'sapa', '사파');
    expect(await openPlaylist(page)).toBe(5);
    await closePlaylist(page);
    const dbAfterOpen = state.db;
    const edgeAfterOpen = state.edge;
    expect(edgeAfterOpen).toBe(0);

    const more = page.waitForResponse((res) => res.url().includes('fetch-place-videos'));
    await page.getByRole('button', { name: '영상 더 보기' }).click();
    await more;
    expect(await openPlaylist(page)).toBe(15);
    await closePlaylist(page);
    expect(state.edge).toBe(edgeAfterOpen + 1);
    expect(state.db).toBe(dbAfterOpen);

    await page.getByRole('button', { name: '갤러리 복귀' }).click();
    await page.getByRole('button', { name: '유튜브 영상' }).click();
    await expect(page.getByRole('heading', { name: '아직 등록된 영상이 없습니다' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '재생 가능한 영상이 없어요' })).toHaveCount(0);
    expect(await openPlaylist(page)).toBe(15);
    await closePlaylist(page);

    await page.getByRole('button', { name: '여행 스케치' }).click();
    await page.getByRole('button', { name: '갤러리 복귀' }).click();
    await page.getByRole('button', { name: '유튜브 영상' }).click();
    expect(await openPlaylist(page)).toBe(15);
    await closePlaylist(page);

    await page.getByRole('button', { name: '리뷰' }).click();
    await page.getByRole('button', { name: '갤러리 복귀' }).click();
    await page.getByRole('button', { name: '유튜브 영상' }).click();
    expect(await openPlaylist(page)).toBe(15);
    await closePlaylist(page);
    expect(state.db).toBe(dbAfterOpen);
    expect(state.edge).toBe(edgeAfterOpen + 1);
  });

  test('tab round-trip without load more keeps the DB count', async ({ page }) => {
    const state = {};
    await installVideoMocks(page, state);
    await openPlaceVideo(page, 'sapa', '사파');
    expect(await openPlaylist(page)).toBe(5);
    await closePlaylist(page);
    const dbAfterOpen = state.db;

    await page.getByRole('button', { name: '갤러리 복귀' }).click();
    await page.getByRole('button', { name: '유튜브 영상' }).click();
    await expect(page.getByRole('heading', { name: '아직 등록된 영상이 없습니다' })).toHaveCount(0);
    expect(await openPlaylist(page)).toBe(5);
    await closePlaylist(page);
    expect(state.db).toBe(dbAfterOpen);
    expect(state.edge).toBe(0);
  });

  test('close and reopen keeps load-more results', async ({ page }) => {
    const state = {};
    await installVideoMocks(page, state);
    await openPlaceVideo(page, 'sapa', '사파');
    const more = page.waitForResponse((res) => res.url().includes('fetch-place-videos'));
    await page.getByRole('button', { name: '영상 더 보기' }).click();
    await more;
    expect(await openPlaylist(page)).toBe(15);
    await closePlaylist(page);
    const dbAfter = state.db;
    const edgeAfter = state.edge;

    await page.getByRole('button', { name: '홈으로 이동' }).first().click();
    await page.waitForURL((url) => url.pathname === '/');
    await page.goBack();
    await page.waitForURL((url) => url.pathname === '/place/sapa/video');
    await expect(page.getByText('관련 영상을 불러오는 중...')).toHaveCount(0);
    expect(await openPlaylist(page)).toBe(15);
    await closePlaylist(page);
    expect(state.db).toBe(dbAfter);
    expect(state.edge).toBe(edgeAfter);
    await expect(page.getByRole('button', { name: '영상 더 보기' })).toBeVisible();
  });

  test('switching place clears the previous playlist', async ({ page }) => {
    const state = {};
    await installVideoMocks(page, state);
    await openPlaceVideo(page, 'sapa', '사파');
    const more = page.waitForResponse((res) => res.url().includes('fetch-place-videos'));
    await page.getByRole('button', { name: '영상 더 보기' }).click();
    await more;
    expect(await openPlaylist(page)).toBe(15);
    await closePlaylist(page);

    await clientNavigate(page, '/place/hanoi/video');
    await expect(page.getByRole('button', { name: '하노이' }).first()).toBeVisible();
    await expect(page.getByText('관련 영상을 불러오는 중...')).toHaveCount(0);
    expect(await openPlaylist(page)).toBe(5);
    await expect(page.getByText('sapa-title-0')).toHaveCount(0);
    await expect(page.getByText('sapa-more-title-0')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'thumb hanoi-title-0' })).toBeVisible();
    await closePlaylist(page);

    await clientNavigate(page, '/place/sapa/video');
    await expect(page.getByRole('button', { name: '사파' }).first()).toBeVisible();
    await expect.poll(async () => openPlaylist(page)).toBe(15);
    await closePlaylist(page);
  });

  test('reload falls back to the DB row', async ({ page }) => {
    const state = {};
    await installVideoMocks(page, state);
    await openPlaceVideo(page, 'sapa', '사파');
    const more = page.waitForResponse((res) => res.url().includes('fetch-place-videos'));
    await page.getByRole('button', { name: '영상 더 보기' }).click();
    await more;
    expect(await openPlaylist(page)).toBe(15);
    await closePlaylist(page);
    const dbAfter = state.db;

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: '사파' }).first()).toBeVisible();
    await expect(page.getByText('관련 영상을 불러오는 중...')).toHaveCount(0);
    expect(await openPlaylist(page)).toBe(5);
    await closePlaylist(page);
    expect(state.db).toBeGreaterThan(dbAfter);
  });
});
