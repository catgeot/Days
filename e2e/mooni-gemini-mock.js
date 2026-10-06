import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';

export const MOONI_MOCK_REPLY =
  'E2E-MOCK-9f3a: 게이트오 헬스체크용 고정 응답입니다.';

export async function installMooniGeminiMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function'
      ? contextOrPage
      : contextOrPage.context();
  await target.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody(MOONI_MOCK_REPLY, { modelUsed: 'mock-e2e-health' }),
      ),
    });
  });
}
