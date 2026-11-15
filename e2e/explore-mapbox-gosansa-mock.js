const CORS = {
  'access-control-allow-origin': '*',
};

/** 라이브 submit-parity — Mapbox 「고산사 · Jangheung」 후보 재현 */
export const MAPBOX_GOSANSA_JANGHEUNG_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [126.7842, 34.6415] },
  properties: {
    mapbox_id: 'e2e-gosansa-jangheung',
    feature_type: 'poi',
    name: '고산사',
    name_preferred: '고산사',
    place_formatted: 'Jangheung, South Jeolla, South Korea',
    full_address: 'Jangheung, South Jeolla, South Korea',
    context: {
      place: { name: 'Jangheung' },
      region: { name: 'South Jeolla' },
      country: { name: 'South Korea', country_code: 'kr' },
    },
  },
};

/** 라이브 Search Box — «강화 고인돌» POI. 125565(37.77408, 126.43679)와 약 70m. */
export const MAPBOX_GANGHWA_DOLMEN_SHORT_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [126.43732031, 37.77364886] },
  properties: {
    mapbox_id: 'e2e-ganghwa-dolmen-short',
    feature_type: 'poi',
    name: '강화 고인돌',
    name_preferred: '강화 고인돌',
    place_formatted: 'Incheon, South Korea',
    full_address: 'Incheon, South Korea',
    context: {
      place: { name: 'Incheon' },
      region: { name: 'Incheon' },
      country: { name: 'South Korea', country_code: 'kr' },
    },
  },
};

export async function installExploreMapboxGosansaMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();

  await target.route(/api\.mapbox\.com\/search\/searchbox\/v1\/forward/i, async (route) => {
    const url = decodeURIComponent(route.request().url());
    if (/고인돌|부근리/.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          type: 'FeatureCollection',
          features: [MAPBOX_GANGHWA_DOLMEN_SHORT_FEATURE],
        }),
      });
      return;
    }
    if (!/고산사|%ea%b3%a0%ec%82%b0%ec%82%ac|gosansa/i.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: [MAPBOX_GOSANSA_JANGHEUNG_FEATURE],
      }),
    });
  });
}
