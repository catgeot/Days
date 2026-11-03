const CORS = {
  'access-control-allow-origin': '*',
};

/** LIVE gateo.kr «제주특별자치도» — Geocoding v5 region (Search Box forward 보조) */
export const GEOCODE_JEJU_DO_KO = {
  type: 'Feature',
  id: 'region.115836',
  text: '제주특별자치도',
  place_name: '제주특별자치도, 대한민국',
  center: [126.53139, 33.499829],
  place_type: ['region'],
  context: [{ id: 'country.123', text: '대한민국' }],
};

export const GEOCODE_JEJU_DO_EN = {
  type: 'Feature',
  id: 'region.115836',
  text: 'Jeju-do',
  place_name: 'Jeju-do, South Korea',
  center: [126.53139, 33.499829],
  place_type: ['region'],
  context: [{ id: 'country.123', text: 'South Korea' }],
};

export async function installExploreJejuGeocodeMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();

  await target.route(/api\.mapbox\.com\/geocoding\/v5\/mapbox\.places\/.*\.json/i, async (route) => {
    const url = decodeURIComponent(route.request().url());
    if (!/제주|%ec%a0%9c%ec%a3%bc|jeju/i.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
      });
      return;
    }
    const language = /language=en/.test(url) ? 'en' : 'ko';
    const features = language === 'en' ? [GEOCODE_JEJU_DO_EN] : [GEOCODE_JEJU_DO_KO];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ type: 'FeatureCollection', features }),
    });
  });

  await target.route(/api\.mapbox\.com\/search\/searchbox\/v1\/forward/i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
    });
  });
}
