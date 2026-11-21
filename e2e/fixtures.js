import { test as base, expect } from '@playwright/test';
import { installReadOnlyGuard } from './readOnlyGuard.js';

export const test = base.extend({
  context: async ({ context }, use, testInfo) => {
    const blocked = [];
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('gateo_qa', '1');
      } catch {
        /* ignore */
      }
    });
    await installReadOnlyGuard(context, blocked);
    await use(context);
    if (blocked.length) {
      await testInfo.attach('blocked-prod-writes.json', {
        body: JSON.stringify(blocked, null, 2),
        contentType: 'application/json',
      });
    }
  },
});

export { expect };

export async function newGuardedContext(browser, options, log = []) {
  const ctx = await browser.newContext(options);
  await installReadOnlyGuard(ctx, log);
  return ctx;
}
