/** Explore Enter AI typo fallback — gemini-proxy blocked by read-only guard in E2E. */
export const EXPLORE_GIBAEK_MOCK_JSON = {
  intent_type: 'typo',
  name: '기백산',
  name_en: 'Gibaeksan',
  country: '대한민국',
  country_en: 'South Korea',
  lat: 35.334,
  lng: 127.729,
  reason: '기백산 국립공원으로 교정',
};

export async function installExploreGeminiMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();
  await target.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        modelUsed: 'mock-e2e-explore',
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(EXPLORE_GIBAEK_MOCK_JSON) }],
              },
            },
          ],
        },
      }),
    });
  });
}
