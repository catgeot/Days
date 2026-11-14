/** 탐색홈 검색·선택 리스트 → 장소카드 왕복. /explore→place assign 시 메모리 스냅샷 보존용. */

const SESSION_KEY = 'gateo:explore-return-snapshot';
let snapshot = null;
let seq = 0;

function readSessionSnapshot() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeSessionSnapshot(data) {
  if (typeof window === 'undefined' || !data) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

function clearSessionSnapshot() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {{
 *   path: string,
 *   query?: string,
 *   disambiguation?: object | null,
 *   scrollTop?: number,
 * }} data
 */
export function rememberExploreReturn(data) {
  const path = typeof data?.path === 'string' ? data.path : '';
  if (!path.startsWith('/explore')) return;
  seq += 1;
  snapshot = {
    id: seq,
    path,
    query: typeof data.query === 'string' ? data.query : '',
    disambiguation: data.disambiguation ?? null,
    scrollTop: Number.isFinite(data.scrollTop) ? data.scrollTop : 0,
  };
  writeSessionSnapshot(snapshot);
}

export function peekExploreReturn() {
  return snapshot ?? readSessionSnapshot();
}

export function clearExploreReturn() {
  snapshot = null;
  clearSessionSnapshot();
}
