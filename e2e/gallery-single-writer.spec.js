import { expect, test } from '@playwright/test';

const PROD_HOST = 'phdjnbfitvmrguqzverm';
const MOCK_ORIGIN = 'https://gallery-writer-mock.invalid';
const AUTH_KEY = 'sb-gallery-writer-mock-auth-token';
const HIDDEN_KEY = 'days_gallery_hidden_v1.23_qa-gallery-writer';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function photo(id) {
  return {
    id,
    width: 1600,
    height: 1000,
    alt_description: 'harbor landscape',
    description: 'harbor landscape',
    urls: {
      small: `https://images.unsplash.com/${id}/small`,
      regular: `https://images.unsplash.com/${id}/regular`,
      full: `https://images.unsplash.com/${id}/full`,
    },
    user: { name: 'Tester', links: { html: 'https://unsplash.com/@tester' } },
    links: { html: `https://unsplash.com/photos/${id}` },
  };
}

function sessionFor(userId) {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 86_400,
    expires_at: Math.floor(Date.now() / 1000) + 86_400,
    token_type: 'bearer',
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'qa@example.com',
    },
  };
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'content-type': 'application/json',
  };
}

async function installMocks(page, scene) {
  const bag = { rpc: [], writes: [], prod: [], reports: [], moderate: [], admin: [] };
  const headers = corsHeaders();

  await page.route(/phdjnbfitvmrguqzverm/, (route) => {
    bag.prod.push(route.request().url());
    return route.abort();
  });
  await page.route('https://images.unsplash.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  );
  await page.route('https://api.unsplash.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: scene.unsplash || [] }),
    }),
  );
  await page.route('https://api.pexels.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ photos: [] }),
    }),
  );
  await page.route(`${MOCK_ORIGIN}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }
    const path = url.pathname;
    const isPlaceStats = path.includes('/rest/v1/place_stats');
    if (isPlaceStats && req.method() !== 'GET' && req.method() !== 'HEAD') {
      bag.writes.push({ method: req.method(), path, body: req.postData() });
    }
    if (path.includes('/rpc/persist_place_gallery') && req.method() === 'POST') {
      bag.rpc.push(JSON.parse(req.postData() || '{}'));
      const status = scene.persistStatus || 200;
      if (status !== 200) {
        return route.fulfill({
          status,
          headers,
          body: JSON.stringify({
            code: status === 404 ? 'PGRST202' : '500',
            message: status === 404 ? 'Could not find the function' : 'persist failed',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          applied: 'ok',
          count: 1,
          image_url: null,
          dropped_ids: scene.droppedIds || [],
        }),
      });
    }
    if (path.includes('/rpc/am_i_app_admin')) {
      bag.admin.push(req.postData() || '');
      if (scene.adminHold) await scene.adminHold;
      if (scene.adminStatus && scene.adminStatus !== 200) {
        return route.fulfill({
          status: scene.adminStatus,
          headers,
          body: JSON.stringify({ code: String(scene.adminStatus), message: 'admin probe failed' }),
        });
      }
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(scene.admin === true),
      });
    }
    if (path.includes('/rpc/gallery_report_queue')) {
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(scene.queue || []),
      });
    }
    if (path.includes('/rpc/gallery_exclusion_list')) {
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(scene.exclusions || []),
      });
    }
    if (path.includes('/rest/v1/place_stats') && req.method() === 'GET') {
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify(scene.rows || []),
      });
    }
    if (path.includes('/rest/v1/gallery_photo_reports') && req.method() === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      bag.reports.push(body);
      if (scene.reportCode === '23505') {
        return route.fulfill({
          status: 409,
          headers,
          body: JSON.stringify({
            code: '23505',
            message: 'duplicate key value violates unique constraint',
          }),
        });
      }
      if (scene.reportCode === '23503') {
        return route.fulfill({
          status: 409,
          headers,
          body: JSON.stringify({
            code: '23503',
            message: 'insert or update violates foreign key constraint',
          }),
        });
      }
      if (scene.reportCode === 'PGRST205') {
        return route.fulfill({
          status: 404,
          headers,
          body: JSON.stringify({
            code: 'PGRST205',
            message: "Could not find the table 'public.gallery_photo_reports' in the schema cache",
          }),
        });
      }
      return route.fulfill({ status: 201, headers, body: '{}' });
    }
    if (path.includes('/functions/v1/gallery-moderate') && req.method() === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      bag.moderate.push(body);
      const status = scene.moderateStatus || 200;
      if (status !== 200) {
        return route.fulfill({
          status,
          headers,
          body: JSON.stringify({ ok: false, code: String(status), message: 'moderate rejected' }),
        });
      }
      return route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({ ok: true, result: { action: body.action } }),
      });
    }
    if (req.method() === 'GET') {
      return route.fulfill({ status: 200, headers, body: '[]' });
    }
    return route.fulfill({ status: 200, headers, body: 'null' });
  });

  await page.addInitScript(
    ({ hiddenKey, hiddenIds, authKey, session, hideStorageFails }) => {
      localStorage.setItem('gateo.locale', 'ko');
      if (hiddenIds?.length) localStorage.setItem(hiddenKey, JSON.stringify(hiddenIds));
      if (session) localStorage.setItem(authKey, JSON.stringify(session));
      if (hideStorageFails) {
        const proto = Storage.prototype;
        const orig = proto.setItem;
        proto.setItem = function setItem(key, value) {
          if (String(key).includes('days_gallery_hidden_')) {
            throw new Error('quota');
          }
          return orig.call(this, key, value);
        };
      }
    },
    {
      hiddenKey: HIDDEN_KEY,
      hiddenIds: scene.hiddenIds || [],
      authKey: AUTH_KEY,
      session: scene.userId ? sessionFor(scene.userId) : null,
      hideStorageFails: scene.hideStorageFails === true,
    },
  );
  return bag;
}

function assertNoProdOrDirectWrites(bag) {
  expect(bag.prod, 'prod supabase host must receive zero requests').toEqual([]);
  expect(bag.writes, 'logged-out and general users must not write place_stats directly').toEqual([]);
}

async function expectRpcSettled(page, bag, count) {
  await expect.poll(() => bag.rpc.length).toBe(count);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  expect(bag.rpc.length).toBe(count);
  expect(bag.writes).toEqual([]);
}

test.beforeAll(() => {
  const url = process.env.VITE_SUPABASE_URL || '';
  if (!url || url.includes(PROD_HOST)) {
    throw new Error(`ABORT: VITE_SUPABASE_URL points at ${PROD_HOST}`);
  }
});

test('첫 방문 replace 1회, 숨긴 사진도 저장용 목록에 포함', async ({ page }) => {
  const unsplash = [photo('hidden-photo'), ...Array.from({ length: 7 }, (_, i) => photo(`vis-${i + 1}`))];
  const bag = await installMocks(page, {
    rows: [],
    unsplash,
    hiddenIds: ['hidden-photo'],
  });
  await page.goto('/qa/gallery-single-writer');
  await expect(page.locator('.break-inside-avoid')).toHaveCount(7);
  await expectRpcSettled(page, bag, 1);
  const body = bag.rpc[0];
  expect(body.p_mode).toBe('replace');
  expect(body.p_place_id).toBe('qa-gallery-writer');
  const ids = body.p_images.map((img) => img.id);
  expect(ids).toContain('hidden-photo');
  expect(ids).toContain('vis-1');
  expect(ids).toHaveLength(8);
  assertNoProdOrDirectWrites(bag);
});

test('SWR merge_keep_hero 는 fresh 만, 로드한 행 id', async ({ page }) => {
  const stored = [photo('hidden-photo'), ...Array.from({ length: 9 }, (_, i) => photo(`vis-${i + 1}`))];
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: stored }],
    unsplash: [photo('fresh-photo')],
    hiddenIds: ['hidden-photo'],
  });
  await page.goto('/qa/gallery-single-writer');
  await expect.poll(() => bag.rpc.length).toBe(1);
  const body = bag.rpc[0];
  expect(body.p_mode).toBe('merge_keep_hero');
  expect(body.p_place_id).toBe('loaded-latin-row');
  expect(body.p_images.map((img) => img.id)).toEqual(['fresh-photo']);
  expect(body.p_images.some((img) => img.id === 'hidden-photo')).toBe(false);
  assertNoProdOrDirectWrites(bag);
});

test('로그아웃 신고는 로그인 안내, insert 없음', async ({ page }) => {
  const stored = Array.from({ length: 8 }, (_, i) => photo(`vis-${i + 1}`));
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: stored }],
    unsplash: [],
  });
  await page.goto('/qa/gallery-single-writer');
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: '갤러리에서 제거 (모든 사용자)' })).toHaveCount(0);
  await page.getByRole('button', { name: '관련 없음' }).click();
  await expect(page.getByText('신고하려면 로그인해 주세요.')).toBeVisible();
  expect(bag.reports).toEqual([]);
  assertNoProdOrDirectWrites(bag);
});

test('로그인 신고 성공 토스트', async ({ page }) => {
  const stored = Array.from({ length: 8 }, (_, i) => photo(`vis-${i + 1}`));
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: stored }],
    unsplash: [],
    userId: '11111111-1111-1111-1111-111111111111',
    admin: false,
  });
  await page.goto('/qa/gallery-single-writer');
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await page.getByRole('button', { name: '관련 없음' }).click();
  await expect(page.getByRole('status').filter({ hasText: '신고했어요. 확인 후 정리할게요.' })).toBeVisible();
  expect(bag.reports).toHaveLength(1);
  expect(bag.reports[0].place_id).toBe('loaded-latin-row');
  expect(bag.reports[0].image_id).toBe('vis-1');
  expect(bag.reports[0].reason).toBe('irrelevant');
  expect(bag.reports[0].reporter_id).toBeUndefined();
  expect(bag.reports[0].status).toBeUndefined();
  assertNoProdOrDirectWrites(bag);
});

test('중복 신고는 이미 신고했어요', async ({ page }) => {
  const stored = Array.from({ length: 8 }, (_, i) => photo(`vis-${i + 1}`));
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: stored }],
    unsplash: [],
    userId: '11111111-1111-1111-1111-111111111111',
    reportCode: '23505',
  });
  await page.goto('/qa/gallery-single-writer');
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await page.getByRole('button', { name: '관련 없음' }).click();
  await expect(page.getByRole('status').filter({ hasText: '이미 신고했어요' })).toBeVisible();
  assertNoProdOrDirectWrites(bag);
});

test('관리자 제거 후 화면에서 사라짐', async ({ page }) => {
  const stored = Array.from({ length: 8 }, (_, i) => photo(`vis-${i + 1}`));
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: stored }],
    unsplash: [],
    userId: '22222222-2222-2222-2222-222222222222',
    admin: true,
  });
  await page.goto('/qa/gallery-single-writer');
  await expect(page.locator('.break-inside-avoid')).toHaveCount(8);
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await page.getByRole('button', { name: '갤러리에서 제거 (모든 사용자)' }).click();
  await expect(page.locator('.break-inside-avoid')).toHaveCount(7);
  expect(bag.moderate).toEqual([
    { action: 'remove', placeId: 'loaded-latin-row', imageId: 'vis-1' },
  ]);
  assertNoProdOrDirectWrites(bag);
});

test('비관리자 /admin/gallery 는 빈 화면', async ({ page }) => {
  const bag = await installMocks(page, { rows: [] });
  await page.goto('/admin/gallery');
  await expect(page.getByRole('heading', { name: '갤러리 신고' })).toHaveCount(0);
  expect(bag.prod).toEqual([]);
});

test('관리자 큐 제거·기각·복원', async ({ page }) => {
  const bag = await installMocks(page, {
    userId: '22222222-2222-2222-2222-222222222222',
    admin: true,
    queue: [
      {
        place_id: 'loaded-latin-row',
        image_id: 'vis-1',
        report_count: 3,
        reasons: { irrelevant: 3 },
      },
    ],
    exclusions: [{ id: 1, place_id: 'loaded-latin-row', image_id: 'old-photo' }],
  });
  await page.goto('/admin/gallery');
  await expect(page.getByRole('heading', { name: '갤러리 신고' })).toBeVisible();
  await page.getByRole('button', { name: '제거', exact: true }).click();
  await expect.poll(() => bag.moderate.length).toBe(1);
  await page.getByRole('button', { name: '기각', exact: true }).click();
  await expect.poll(() => bag.moderate.length).toBe(2);
  await page.getByRole('button', { name: '복원', exact: true }).click();
  await expect.poll(() => bag.moderate.map((row) => row.action).join(',')).toBe('remove,dismiss,restore');
  expect(bag.prod).toEqual([]);
  expect(bag.writes).toEqual([]);
});

function storedPhotos() {
  return Array.from({ length: 8 }, (_, i) => photo(`vis-${i + 1}`));
}

for (const status of [404, 500]) {
  test(`persist ${status}는 직접 쓰기와 재시도가 없다`, async ({ page }) => {
    const bag = await installMocks(page, {
      rows: [],
      unsplash: storedPhotos(),
      persistStatus: status,
    });
    await page.goto('/qa/gallery-single-writer');
    await expect(page.locator('.break-inside-avoid')).toHaveCount(8);
    await expectRpcSettled(page, bag, 1);
    expect(bag.rpc[0].p_mode).toBe('replace');
    assertNoProdOrDirectWrites(bag);
  });
}

test('관리자 확인이 늦거나 실패하면 제거 버튼은 숨는다', async ({ page }) => {
  let releaseAdmin = () => {};
  const adminHold = new Promise((resolve) => {
    releaseAdmin = resolve;
  });
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: storedPhotos() }],
    unsplash: [],
    userId: '22222222-2222-2222-2222-222222222222',
    admin: true,
    adminHold,
    adminStatus: 500,
  });
  await page.goto('/qa/gallery-single-writer');
  await expect(page.locator('.break-inside-avoid')).toHaveCount(8);
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: '갤러리에서 제거 (모든 사용자)' })).toHaveCount(0);
  releaseAdmin();
  await page.waitForTimeout(500);
  await expect(page.getByRole('button', { name: '갤러리에서 제거 (모든 사용자)' })).toHaveCount(0);
  expect(bag.admin).toHaveLength(1);
  assertNoProdOrDirectWrites(bag);
});

test('dropped_ids는 화면에서 빠진다', async ({ page }) => {
  const bag = await installMocks(page, {
    rows: [],
    unsplash: storedPhotos(),
    droppedIds: ['vis-1'],
  });
  await page.goto('/qa/gallery-single-writer');
  await expect(page.locator('img[src*="vis-1"]')).toHaveCount(0);
  await expect(page.locator('.break-inside-avoid')).toHaveCount(7);
  await expectRpcSettled(page, bag, 1);
  assertNoProdOrDirectWrites(bag);
});

test('숨기기는 화면에서만 빠지고 저장 요청은 없다', async ({ page }) => {
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: storedPhotos() }],
    unsplash: [],
  });
  await page.goto('/qa/gallery-single-writer');
  await expect(page.locator('.break-inside-avoid')).toHaveCount(8);
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await page.getByRole('button', { name: '이 사진 숨기기' }).click();
  await expect(page.locator('.break-inside-avoid')).toHaveCount(7);
  await expect(page.locator('img[src*="vis-1"]')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  expect(bag.rpc).toEqual([]);
  assertNoProdOrDirectWrites(bag);
});

test('숨기기 저장이 실패하면 안내하고 사진은 남는다', async ({ page }) => {
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: storedPhotos() }],
    unsplash: [],
    hideStorageFails: true,
  });
  await page.goto('/qa/gallery-single-writer');
  await expect(page.locator('.break-inside-avoid')).toHaveCount(8);
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await page.getByRole('button', { name: '이 사진 숨기기' }).click();
  await expect(page.getByRole('status').filter({ hasText: '이 사진을 숨기지 못했어요.' })).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.break-inside-avoid')).toHaveCount(8);
  assertNoProdOrDirectWrites(bag);
});

test('갤러리에 없는 사진 신고는 안내한다', async ({ page }) => {
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: storedPhotos() }],
    unsplash: [],
    userId: '11111111-1111-1111-1111-111111111111',
    reportCode: '23503',
  });
  await page.goto('/qa/gallery-single-writer');
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await page.getByRole('button', { name: '관련 없음' }).click();
  await expect(page.getByRole('status').filter({ hasText: '이 사진은 갤러리에 없어요.' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  assertNoProdOrDirectWrites(bag);
});

test('신고 테이블이 없으면 안내한다', async ({ page }) => {
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: storedPhotos() }],
    unsplash: [],
    userId: '11111111-1111-1111-1111-111111111111',
    reportCode: 'PGRST205',
  });
  await page.goto('/qa/gallery-single-writer');
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await page.getByRole('button', { name: '관련 없음' }).click();
  await expect(page.getByRole('status').filter({ hasText: '지금은 신고를 받을 수 없어요.' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  assertNoProdOrDirectWrites(bag);
});

test('관리자 제거 403은 권한 안내를 보여 준다', async ({ page }) => {
  const bag = await installMocks(page, {
    rows: [{ place_id: 'loaded-latin-row', gallery_urls: storedPhotos() }],
    unsplash: [],
    userId: '22222222-2222-2222-2222-222222222222',
    admin: true,
    moderateStatus: 403,
  });
  await page.goto('/qa/gallery-single-writer');
  await expect(page.locator('.break-inside-avoid')).toHaveCount(8);
  await page.locator('.break-inside-avoid').first().dblclick({ modifiers: ['Control'] });
  await page.getByRole('button', { name: '갤러리에서 제거 (모든 사용자)' }).click();
  await expect(page.getByRole('status').filter({ hasText: '제거 권한이 없어요.' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.break-inside-avoid')).toHaveCount(8);
  expect(bag.moderate).toEqual([
    { action: 'remove', placeId: 'loaded-latin-row', imageId: 'vis-1' },
  ]);
  assertNoProdOrDirectWrites(bag);
});
