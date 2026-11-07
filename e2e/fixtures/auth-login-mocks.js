/** Supabase password login — mock only (no real credentials). */

const SYNTH_EMAIL = 'e2e-login-mock@fixture.invalid';
const SYNTH_PASSWORD = 'e2e-fixture-password-12';

export const AUTH_LOGIN_FIXTURE = {
  email: SYNTH_EMAIL,
  password: SYNTH_PASSWORD,
};

export async function installAuthPasswordRoute(page, { outcome = 'invalid' } = {}) {
  const state = { tokenPosts: 0 };

  await page.route(/\/auth\/v1\/token/i, async (route) => {
    if (route.request().method().toUpperCase() !== 'POST') {
      await route.continue();
      return;
    }
    state.tokenPosts += 1;
    if (outcome === 'invalid') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'e2e-mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'e2e-mock-refresh-token',
        user: { id: 'e2e-fixture-user-id', email: SYNTH_EMAIL },
      }),
    });
  });

  return state;
}

export async function readGlobeCanvasMetrics(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('.mapboxgl-canvas');
    const mapRoot = document.querySelector('.mapboxgl-map');
    const layoutH = window.innerHeight;
    const vvH = window.visualViewport?.height ?? layoutH;
    const canvasRect = canvas?.getBoundingClientRect();
    const mapRect = mapRoot?.getBoundingClientRect();
    return {
      layoutHeight: layoutH,
      visualViewportHeight: vvH,
      canvasHeight: canvasRect?.height ?? 0,
      canvasWidth: canvasRect?.width ?? 0,
      mapHeight: mapRect?.height ?? 0,
    };
  });
}

export async function installStuckKeyboardViewportStub(page, keyboardHeight = 320) {
  await page.addInitScript((kbHeight) => {
    const vv = window.visualViewport;
    if (!vv) return;
    let stuck = false;
    const baseHeight = () => Math.max(0, window.innerHeight - kbHeight);

    const patch = () => {
      try {
        Object.defineProperty(vv, 'height', {
          configurable: true,
          get() {
            if (stuck) return baseHeight();
            return window.innerHeight;
          },
        });
      } catch {
        /* Playwright may not allow patching */
      }
    };
    patch();

    window.__gateoE2eStuckKeyboard = {
      stick() {
        stuck = true;
        vv.dispatchEvent(new Event('resize'));
      },
      release() {
        stuck = false;
        vv.dispatchEvent(new Event('resize'));
      },
    };
  }, keyboardHeight);
}

export async function stickKeyboardViewport(page) {
  await page.evaluate(() => {
    window.__gateoE2eStuckKeyboard?.stick();
  });
}

export async function releaseKeyboardViewport(page) {
  await page.evaluate(() => {
    window.__gateoE2eStuckKeyboard?.release();
  });
}
