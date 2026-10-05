import { test, expect } from '@playwright/test';
import { classifySupabaseRequest, SMOKE_PROBE_EDGE_FUNCTIONS } from './readOnlyGuard.js';

const SUPABASE = 'https://unit-test.supabase.co'; // pragma: allowlist secret

test.describe('classifySupabaseRequest', () => {
  test('table', () => {
    const cases = [
      { method: 'GET', url: `${SUPABASE}/rest/v1/place_stats`, want: 'allow' },
      {
        method: 'POST',
        url: `${SUPABASE}/rest/v1/rpc/increment_place_stats`,
        want: 'reject',
      },
      {
        method: 'PATCH',
        url: `${SUPABASE}/rest/v1/place_stats?id=eq.1`,
        want: 'reject',
      },
      { method: 'POST', url: `${SUPABASE}/rest/v1/place_stats`, want: 'reject' },
      {
        method: 'POST',
        url: `${SUPABASE}/functions/v1/fetch-mrt-stays`,
        want: 'allow',
      },
      {
        method: 'POST',
        url: `${SUPABASE}/functions/v1/update-place-toolkit`,
        want: 'reject',
      },
      {
        method: 'POST',
        url: `${SUPABASE}/functions/v1/some-new-fn`,
        want: 'reject',
      },
      { method: 'POST', url: 'https://www.gateo.kr/api/x', want: 'allow' },
    ];

    for (const { method, url, want } of cases) {
      expect(classifySupabaseRequest(method, url), `${method} ${url}`).toBe(want);
    }

    expect(
      classifySupabaseRequest('POST', `${SUPABASE}/functions/v1/gemini-proxy`, {
        edgeAllowlist: SMOKE_PROBE_EDGE_FUNCTIONS,
      }),
    ).toBe('reject');
    expect(
      classifySupabaseRequest('POST', `${SUPABASE}/functions/v1/tourapi-proxy`, {
        edgeAllowlist: SMOKE_PROBE_EDGE_FUNCTIONS,
      }),
    ).toBe('reject');
  });
});
