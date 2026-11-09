import { expect } from './fixtures.js';

const HOME_SEARCH = /여행지 검색|여행지 탐색|Search destinations|Search on 3D globe|Explore places with 3D Globe/i;

export function homeSearchLocator(page) {
  return page.getByRole('button', { name: HOME_SEARCH }).first();
}

/** Home chrome that must be visible (not merely non-empty #root). */
export async function expectHomeShellVisible(page, { timeout = 60_000 } = {}) {
  await expect(page).toHaveTitle(/GATEO/, { timeout });
  await expect(homeSearchLocator(page)).toBeVisible({ timeout });
}
