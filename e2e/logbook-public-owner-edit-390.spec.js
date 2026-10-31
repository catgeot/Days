import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_390 = '/opt/cursor/artifacts/logbook-public-owner-edit-390';
const OUT_1280 = '/opt/cursor/artifacts/logbook-public-owner-edit-1280';

const REPORT_ID = 'e2e-chuncheon-merong';
const OWNER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const MOCK_REPORT = {
  id: REPORT_ID,
  user_id: OWNER_ID,
  title: '메롱',
  dek: null,
  content: '춘천 탐험 피드 E2E 목업 기록입니다.',
  location: '춘천',
  date: '2026-04-30',
  images: [],
  is_public: true,
  is_deleted: false,
  is_editorial: false,
  view_count: 3,
  like_count: 0,
  comment_count: 0,
};

function authUserJson(userId) {
  if (!userId) {
    return { user: null };
  }
  return {
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@example.com',
    },
  };
}

function supabaseAuthStorageKey() {
  const url = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
  try {
    const host = new URL(url).hostname.split('.')[0];
    return host ? `sb-${host}-auth-token` : '';
  } catch {
    return '';
  }
}

function buildSession(userId) {
  if (!userId) return null;
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'e2e-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'e2e-refresh-token',
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@example.com',
    },
  };
}

async function seedAuthSession(page, userId) {
  const storageKey = supabaseAuthStorageKey();
  await page.addInitScript(({ key, session }) => {
    if (!key) return;
    if (session) localStorage.setItem(key, JSON.stringify(session));
    else localStorage.removeItem(key);
  }, { key: storageKey, session: buildSession(userId) });
}

async function installRoutes(page, sessionUserId) {
  await page.route('**/auth/v1/user**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authUserJson(sessionUserId)),
    }),
  );

  await page.route('**/auth/v1/token**', (route) => route.abort());

  await page.route('**/rest/v1/reports**', (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET') {
      return route.fulfill({ status: 405, body: '{}' });
    }
    const idParam = url.searchParams.get('id');
    if (idParam === `eq.${REPORT_ID}`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REPORT),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/rpc/increment_report_view**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '4' }),
  );

  await page.route('**/rest/v1/profiles**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: OWNER_ID, display_name: 'E2E 작성자' }]),
    }),
  );

  await page.route('**/rest/v1/report_likes**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );

  await page.route('**/rest/v1/report_comments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

async function shot(page, outDir, file, width, height) {
  await page.screenshot({
    path: join(outDir, file),
    clip: { x: 0, y: 0, width, height: Math.min(height, 844) },
  });
}

async function openPublicDetail(page) {
  await page.goto(`/p/${REPORT_ID}?lang=ko`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('메롱')).toBeVisible({ timeout: 30_000 });
}

function defineViewportSuite({ tag, width, height, outDir }) {
  test.describe(`logbook public detail owner edit (${tag}px, mocked Supabase)`, () => {
    test.use({
      viewport: { width, height },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
    });

    test.beforeAll(async () => {
      await mkdir(outDir, { recursive: true });
    });

    test('owner sees edit button', async ({ page }) => {
      await seedAuthSession(page, OWNER_ID);
      await installRoutes(page, OWNER_ID);
      await openPublicDetail(page);
      const edit = page.getByRole('button', { name: '기록 수정' });
      await expect(edit).toBeVisible();
      await expect(edit).toContainText('수정');
      const box = await page.locator('[data-logbook-owner-edit]').boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      await shot(page, outDir, 'owner-edit-visible.png', width, height);
    });

    test('other user does not see edit button', async ({ page }) => {
      await seedAuthSession(page, OTHER_ID);
      await installRoutes(page, OTHER_ID);
      await openPublicDetail(page);
      await expect(page.locator('[data-logbook-owner-edit]')).toHaveCount(0);
      await shot(page, outDir, 'other-user-no-edit.png', width, height);
    });

    test('logged out does not see edit button', async ({ page }) => {
      await seedAuthSession(page, null);
      await installRoutes(page, null);
      await openPublicDetail(page);
      await expect(page.locator('[data-logbook-owner-edit]')).toHaveCount(0);
      await shot(page, outDir, 'logged-out-no-edit.png', width, height);
    });
  });
}

defineViewportSuite({ tag: '390', width: 390, height: 844, outDir: OUT_390 });
defineViewportSuite({ tag: '1280', width: 1280, height: 720, outDir: OUT_1280 });
