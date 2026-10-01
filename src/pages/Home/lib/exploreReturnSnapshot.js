/** 탐색홈 검색·선택 리스트 → 장소카드 왕복. 메모리만 (새로고침 시 초기화). */

let snapshot = null;
let seq = 0;

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
}

export function peekExploreReturn() {
  return snapshot;
}

export function clearExploreReturn() {
  snapshot = null;
}
