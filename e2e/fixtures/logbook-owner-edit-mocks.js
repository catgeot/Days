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

function sessionResponse(userId) {
  const session = buildSession(userId);
  if (!session) {
    return { access_token: null, token_type: null, user: null };
  }
  return session;
}

export { REPORT_ID, OWNER_ID, OTHER_ID, MOCK_REPORT };

export async function seedAuthSession(page, userId) {
  const storageKey = supabaseAuthStorageKey();
  await page.addInitScript(({ key, session }) => {
    if (!key) return;
    if (session) localStorage.setItem(key, JSON.stringify(session));
    else localStorage.removeItem(key);
  }, { key: storageKey, session: buildSession(userId) });
}

function fulfillOwnedReport(route, sessionUserId) {
  const url = new URL(route.request().url());
  if (route.request().method() !== 'GET') {
    return route.fulfill({ status: 405, body: '{}' });
  }
  const idParam = url.searchParams.get('id');
  if (idParam !== `eq.${REPORT_ID}`) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  }

  const userIdParam = url.searchParams.get('user_id');
  if (userIdParam) {
    const wanted = userIdParam.replace(/^eq\./, '');
    if (sessionUserId && wanted === sessionUserId) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REPORT),
      });
    }
    return route.fulfill({
      status: 406,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' }),
    });
  }

  if (url.searchParams.get('is_public') === 'eq.true') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_REPORT),
    });
  }

  return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
}

export async function installLogbookReportRoutes(page, sessionUserId) {
  await page.route('**/auth/v1/user**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authUserJson(sessionUserId)),
    }),
  );

  await page.route('**/auth/v1/session**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionResponse(sessionUserId)),
    }),
  );

  await page.route('**/auth/v1/token**', (route) => route.abort());

  await page.route('**/rest/v1/reports**', (route) => fulfillOwnedReport(route, sessionUserId));

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

/** @deprecated use installLogbookReportRoutes */
export async function installRoutes(page, sessionUserId) {
  return installLogbookReportRoutes(page, sessionUserId);
}
