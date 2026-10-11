import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';

/** Visible in screenshots + assertions — festival_sights-style chip answer (not generic health mock). */
export const FESTIVAL_CHIP_MOCK_MARKER = 'GATEO_E2E_CHIP_SIGHTS_7c2a';

export const FESTIVAL_CHIP_MOCK_REPLY =
  `확인된 프로그램 기준으로 태권도·의장대 시연과 체험 부스가 이어져 분위기가 활기차요. ${FESTIVAL_CHIP_MOCK_MARKER} 자세한 내용은 [축제 페이지](https://www.gateo.kr/korea/?festival=2989642)에서 볼 수 있어요.`;

/**
 * Route-mock gemini-proxy (realistic festival chip body). Does not call prod Edge — avoids
 * local-preview CORS/Origin limits; same JSON shape as v27 gemini-proxy.
 */
export async function installFestivalChipGeminiMock(contextOrPage, { delayMs = 0 } = {}) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();
  await target.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody(FESTIVAL_CHIP_MOCK_REPLY, {
          modelUsed: 'mock-e2e-festival-sights',
        }),
      ),
    });
  });
}
