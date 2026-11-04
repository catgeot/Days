const CORS = {
  'access-control-allow-origin': '*',
};

/** Geocoding v5 «평양» — 북한 수도 place (해역 «남태평양» 오탐 회귀) */
export const GEOCODE_PYONGYANG_KO = {
  type: 'Feature',
  id: 'place.e2e-pyongyang',
  text: '평양',
  place_name: '평양, 북한',
  center: [125.7625, 39.0392],
  place_type: ['place'],
  context: [{ id: 'country.e2e-kp', text: '북한', short_code: 'kp' }],
};

export const GEOCODE_PYONGYANG_EN = {
  ...GEOCODE_PYONGYANG_KO,
  text: 'Pyongyang',
  place_name: 'Pyongyang, North Korea',
  context: [{ id: 'country.e2e-kp', text: 'North Korea', short_code: 'kp' }],
};

export async function installExplorePyongyangGeocodeMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();

  await target.route(/api\.mapbox\.com\/geocoding\/v5\/mapbox\.places\/.*\.json/i, async (route) => {
    const url = decodeURIComponent(route.request().url());
    const hit = /평양|평양시|pyongyang/i.test(url);
    const features = hit ? [/language=en/.test(url) ? GEOCODE_PYONGYANG_EN : GEOCODE_PYONGYANG_KO] : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ type: 'FeatureCollection', features }),
    });
  });
}
