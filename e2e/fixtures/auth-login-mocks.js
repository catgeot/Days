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

export async function waitForGlobeReady(page, { focusTimeoutMs = 15_000, settleMs = 8_000 } = {}) {
  const map = page.locator('.mapboxgl-map').first();
  await map.waitFor({ state: 'visible', timeout: 90_000 });
  await page.waitForFunction(
    () => {
      const api = window.__gateoGlobeApi;
      const view = api?.getMapView?.();
      return Boolean(api && view?.center);
    },
    { timeout: 60_000 },
  );
  const focusReady = await page.evaluate(
    async (timeout) => {
      const api = window.__gateoGlobeApi;
      if (!api?.whenGlobeFocusReady) return true;
      return api.whenGlobeFocusReady({ timeoutMs: timeout });
    },
    focusTimeoutMs,
  );
  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
  return { focusReady, settleMs };
}

/** WebGL center sample — 0 nonDarkRatio can mean tiles loading, preserveDrawingBuffer, or capture timing. */
export async function sampleGlobeCanvasVisual(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('.mapboxgl-canvas');
    if (!canvas) return { ok: false, reason: 'no-canvas' };
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { ok: false, reason: 'no-webgl' };
    const w = Math.min(48, canvas.width);
    const h = Math.min(48, canvas.height);
    const cx = Math.floor((canvas.width - w) / 2);
    const cy = Math.floor((canvas.height - h) / 2);
    const buf = new Uint8Array(w * h * 4);
    try {
      gl.readPixels(cx, cy, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    } catch {
      return { ok: false, reason: 'readPixels-failed' };
    }
    let nonDark = 0;
    let sum = 0;
    const n = w * h;
    for (let i = 0; i < n; i += 1) {
      const r = buf[i * 4];
      const g = buf[i * 4 + 1];
      const b = buf[i * 4 + 2];
      const lum = (r + g + b) / 3;
      sum += lum;
      if (lum > 28) nonDark += 1;
    }
    return {
      ok: true,
      canvasPixelW: canvas.width,
      canvasPixelH: canvas.height,
      meanLuminance: Math.round(sum / n),
      nonDarkRatio: Math.round((nonDark / n) * 1000) / 1000,
    };
  });
}

export function attachMapboxNetworkProbe(page) {
  const probe = { tileOk: 0, tileFail: 0, styleFail: 0 };
  const onRequest = (request) => {
    const url = request.url();
    if (!/mapbox\.com/i.test(url)) return;
    if (/\.(png|pbf|webp)/i.test(url) || /tiles|styles/i.test(url)) {
      probe.tileOk += 1;
    }
  };
  const onFailed = (request) => {
    const url = request.url();
    if (!/mapbox\.com/i.test(url)) return;
    if (/styles/i.test(url)) probe.styleFail += 1;
    else probe.tileFail += 1;
  };
  page.on('request', onRequest);
  page.on('requestfailed', onFailed);
  return probe;
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
