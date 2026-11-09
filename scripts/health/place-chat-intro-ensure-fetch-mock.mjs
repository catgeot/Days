const SUPA = String(globalThis.__VITE_ENV__?.VITE_SUPABASE_URL || 'https://example.supabase.co').replace(
  /\/$/,
  '',
);

export const ACCEPTED_FIXTURE_INTRO =
  '격리테스트섬은 조용한 해변과 산책로로 이루어진 작은 섬입니다. 방문객은 맑은 날 파도 소리를 들으며 휴식을 즐길 수 있습니다.';

export function installPlaceIntroMockStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
  };
}

/**
 * @param {{ geminiMode?: 'ok'|'empty'|'throw', saveFail?: boolean, shouldFailSave?: () => boolean, geminiDelayMs?: number, dbRows?: Record<string,string> }} opts
 */
export function installPlaceIntroEnsureFetchMock(opts = {}) {
  const counters = { geminiCalls: 0, saveCalls: 0, concurrentGemini: 0, maxConcurrentGemini: 0 };
  const geminiMode = opts.geminiMode ?? 'ok';
  const shouldFailSave =
    typeof opts.shouldFailSave === 'function'
      ? opts.shouldFailSave
      : () => Boolean(opts.saveFail);
  const geminiDelayMs = opts.geminiDelayMs ?? 0;
  const dbRows = { ...(opts.dbRows || {}) };

  const prevFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method || 'GET').toUpperCase();

    if (url.includes(`${SUPA}/rest/v1/place_chat_intro`)) {
      const eq = url.match(/destination_key=eq\.([^&]+)/);
      let key = eq ? decodeURIComponent(String(eq[1]).replace(/\+/g, ' ')) : '';
      key = key.replace(/^"+|"+$/g, '');
      const row = key && dbRows[key] ? { destination_key: key, summary: dbRows[key] } : null;
      const accept = init?.headers?.accept || init?.headers?.Accept || '';
      if (accept.includes('application/vnd.pgrst.object+json')) {
        return new Response(row ? JSON.stringify(row) : 'null', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(row ? [row] : []), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.includes(`${SUPA}/rest/v1/rpc/save_place_chat_intro`)) {
      counters.saveCalls += 1;
      if (shouldFailSave()) {
        return new Response(JSON.stringify({ message: 'mock save fail' }), { status: 500 });
      }
      try {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        if (body?.p_destination_key && body?.p_summary) {
          dbRows[body.p_destination_key] = body.p_summary;
        }
      } catch {
        // ignore
      }
      return new Response('true', { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (url.includes(`${SUPA}/functions/v1/gemini-proxy`)) {
      counters.geminiCalls += 1;
      counters.concurrentGemini += 1;
      counters.maxConcurrentGemini = Math.max(counters.maxConcurrentGemini, counters.concurrentGemini);
      try {
        if (geminiDelayMs > 0) await new Promise((r) => setTimeout(r, geminiDelayMs));
        if (geminiMode === 'throw') {
          return new Response(JSON.stringify({ success: false, error: 'mock' }), { status: 502 });
        }
        const text = geminiMode === 'empty' ? '' : ACCEPTED_FIXTURE_INTRO;
        return new Response(JSON.stringify({ success: true, text }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      } finally {
        counters.concurrentGemini -= 1;
      }
    }

    if (url.includes(`${SUPA}/auth/v1/`)) {
      return new Response(JSON.stringify({ access_token: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (typeof prevFetch === 'function') {
      return prevFetch(input, init);
    }
    return new Response('null', { status: 404 });
  };

  return counters;
}

export function restorePlaceIntroEnsureFetchMock() {
  // tests run in isolation; no-op unless we stash prevFetch on global
}
