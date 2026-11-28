export const SOCIAL_REEL_LIKE_LOGIN_PROMPT =
  '좋아요는 로그인 후 누를 수 있어요. 로그인 페이지로 이동할까요?';

export const SOCIAL_REEL_LIKE_FAIL_TOAST = '좋아요를 반영하지 못했어요';

const REEL_ID_RE = /^reel-\d+$/;

/** UI rule: the RPC count is shown only from 11 up. */
export function shouldShowSocialReelLikeCount(count) {
  return Number.isFinite(count) && count > 10;
}

export function isSocialReelLikeRpcMissing(error) {
  if (!error) return false;
  const code = String(error.code || '');
  if (code === '42883' || code === 'PGRST202' || code === 'PGRST205') return true;
  const msg = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;
  return /does not exist|schema cache|Could not find the function/i.test(msg);
}

export function normalizeSocialReelIds(reelIds) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(reelIds) ? reelIds : []) {
    const id = String(raw || '').trim();
    if (!REEL_ID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function countsFromRows(rows) {
  const counts = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.reel_id || '').trim();
    const count = Number(row?.like_count);
    if (!REEL_ID_RE.test(id) || !Number.isFinite(count)) continue;
    counts[id] = count;
  }
  return counts;
}

function auditSocialReelLikeRpc(name) {
  if (typeof window !== 'undefined' && Array.isArray(window.__GATEO_SOCIAL_REEL_RPC_AUDIT__)) {
    window.__GATEO_SOCIAL_REEL_RPC_AUDIT__.push(name);
  }
}

function mineFromRows(rows) {
  const mine = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.reel_id || '').trim();
    if (REEL_ID_RE.test(id)) mine.push(id);
  }
  return mine;
}

export function createSocialReelLikeApi(client, readUser) {
  return {
    readUser,
    async fetchState(reelIds, { enabled = false } = {}) {
      if (!enabled) return { counts: {}, mine: [] };
      const ids = normalizeSocialReelIds(reelIds);
      if (!ids.length) return { counts: {}, mine: [] };
      auditSocialReelLikeRpc('get_social_reel_like_counts');
      const countsRes = await client.rpc('get_social_reel_like_counts', { p_reel_ids: ids });
      if (countsRes?.error) {
        return {
          missing: isSocialReelLikeRpcMissing(countsRes.error),
          error: countsRes.error,
          counts: {},
          mine: [],
        };
      }
      const counts = countsFromRows(countsRes?.data);
      let user = null;
      try {
        user = await readUser();
      } catch {
        user = null;
      }
      if (!user) return { counts, mine: [] };
      auditSocialReelLikeRpc('get_my_social_reel_likes');
      const mineRes = await client.rpc('get_my_social_reel_likes', { p_reel_ids: ids });
      if (mineRes?.error) {
        return {
          missing: isSocialReelLikeRpcMissing(mineRes.error),
          error: mineRes.error,
          counts,
          mine: [],
        };
      }
      return { counts, mine: mineFromRows(mineRes?.data) };
    },
    async toggle(reelId, desired, { enabled = false } = {}) {
      if (!enabled) return { error: { message: 'likes disabled' } };
      const id = String(reelId || '').trim();
      if (!REEL_ID_RE.test(id)) return { error: { message: 'bad reel_id' } };
      auditSocialReelLikeRpc('toggle_social_reel_like');
      const { data, error } = await client.rpc('toggle_social_reel_like', {
        p_reel_id: id,
        p_desired: Boolean(desired),
      });
      if (error) return { error, missing: isSocialReelLikeRpcMissing(error) };
      const row = Array.isArray(data) ? data[0] : data;
      const count = Number(row?.like_count);
      return {
        count: Number.isFinite(count) ? count : null,
        liked: row?.liked === true,
      };
    },
  };
}

let defaultApi;

export function peekSocialReelLikeApi() {
  if (typeof window !== 'undefined' && window.__GATEO_SOCIAL_REEL_LIKE_API__) {
    return window.__GATEO_SOCIAL_REEL_LIKE_API__;
  }
  return null;
}

export async function resolveSocialReelLikeApi() {
  const installed = peekSocialReelLikeApi();
  if (installed) return installed;
  if (!defaultApi) {
    const { supabase } = await import('../../shared/api/supabase.js');
    const { readSessionUser } = await import('../../shared/Auth/sessionUser.js');
    defaultApi = createSocialReelLikeApi(supabase, readSessionUser);
  }
  return defaultApi;
}
