const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
};

/** LIVE place_stats (anon SELECT 2026-11) — «제주특별자치도» Enter 카드 visited-jeju-do 원본 */
export const LIVE_PLACE_STATS_JEJU_DO = {
  place_id: 'jeju-do',
  name_ko: '제주특별자치도',
  name_en: 'Jeju-do',
  lat: 33.499829,
  lng: 126.53139,
  image_url: null,
};

const ROWS = [LIVE_PLACE_STATS_JEJU_DO];

function rowMatchesUrl(row, url) {
  return [row.place_id, row.name_ko, row.name_en].some((v) => url.includes(`"${v}"`) || url.includes(`.${v},`) || url.endsWith(`.${v})`));
}

export async function installExplorePlaceStatsVisitedMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();

  await target.route('**/rest/v1/place_stats**', async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    if (method !== 'GET') {
      await route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: '[]' });
      return;
    }
    const url = decodeURIComponent(route.request().url());
    const rows = ROWS.filter((row) => rowMatchesUrl(row, url));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(rows),
    });
  });
}
