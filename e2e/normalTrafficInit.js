/**
 * Playwright 기본 webdriver·fixtures gateo_qa 없이 일반 트래픽처럼 보이게 함 (GA·조회수 RPC E2E).
 */
export async function installNormalGateoTraffic(page) {
  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
        configurable: true,
      });
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem('gateo_qa');
    } catch {
      /* ignore */
    }
  });
}