/**
 * Logged-in saved_trips mock for MOONi chip race e2e (VITE_MOONI_E2E=1).
 */
export function createLoggedInSavedTripsMock({ persistPatch = false } = {}) {
  const state = { tripRow: null, omitFromGet: false, persistPatch };
  return {
    state,
    setOmitFromGet(value) {
      state.omitFromGet = Boolean(value);
    },
    /** DB still has user-only row (model reply not PATCHed) — Safari race repro. */
    forceStaleUserOnlyMessages() {
      if (!state.tripRow) return;
      const users = (state.tripRow.messages || []).filter((m) => m?.role === 'user');
      state.tripRow = {
        ...state.tripRow,
        messages: users.length ? [users[users.length - 1]] : [],
      };
    },
    setTripMessages(messages) {
      if (state.tripRow) state.tripRow = { ...state.tripRow, messages };
    },
    async attach(context) {
      await context.route(/\/rest\/v1\/saved_trips/i, async (route) => {
        const method = route.request().method();
        if (method === 'GET') {
          const trips = state.tripRow && !state.omitFromGet ? [state.tripRow] : [];
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'content-range': `0-${trips.length}/${trips.length}` },
            body: JSON.stringify(trips),
          });
          return;
        }
        if (method === 'POST') {
          const payload = route.request().postDataJSON();
          const row = Array.isArray(payload) ? payload[0] : payload;
          const stored = { ...row };
          delete stored.mooniLocale;
          state.tripRow = {
            ...stored,
            id: 'e2e-trip-stale-race',
            created_at: new Date().toISOString(),
            messages: row.messages || [],
          };
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify([state.tripRow]),
          });
          return;
        }
        if (method === 'PATCH') {
          if (state.persistPatch && state.tripRow) {
            try {
              const body = route.request().postDataJSON();
              if (body?.messages) {
                state.tripRow = { ...state.tripRow, messages: body.messages };
              }
            } catch {
              /* ignore */
            }
          }
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
          return;
        }
        await route.continue();
      });
    },
  };
}
