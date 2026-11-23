const STORAGE_KEY = 'gateo:mooni-chat-planner-return';
export const MOONI_CHAT_RESTORE_EVENT = 'gateo:mooni-chat-restore';

/**
 * @param {{
 *   slug: string,
 *   activeChatId: string | number,
 *   scrollTop: number,
 *   mooniPlaceContext?: object | null,
 *   mooniEntry?: boolean,
 *   savedAt: number,
 * }} MooniChatPlannerReturn
 */
export function setMooniChatPlannerReturn(payload) {
  if (!payload?.slug || payload.activeChatId == null) return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...payload,
        scrollTop: Number(payload.scrollTop) || 0,
        savedAt: payload.savedAt || Date.now(),
      }),
    );
  } catch {
    /* private mode */
  }
}

export function clearMooniChatPlannerReturn() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

/**
 * @returns {MooniChatPlannerReturn | null}
 */
export function readMooniChatPlannerReturn() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.slug || parsed.activeChatId == null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {string | null | undefined} slug
 */
export function peekMooniChatPlannerReturn(slug) {
  const row = readMooniChatPlannerReturn();
  if (!row) return null;
  const wanted = String(slug || '').trim().toLowerCase();
  if (wanted && String(row.slug).trim().toLowerCase() !== wanted) return null;
  return row;
}

/**
 * @returns {MooniChatPlannerReturn | null}
 */
export function consumeMooniChatPlannerReturn() {
  const row = readMooniChatPlannerReturn();
  if (row) clearMooniChatPlannerReturn();
  return row;
}

export function requestMooniChatRestore() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MOONI_CHAT_RESTORE_EVENT));
}