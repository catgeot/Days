import { isKoreaPlaceReturnPath } from './placeReturnTo.js';

function pathnameOf(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return '';
  return path.split('?')[0];
}

/**
 * 장소카드 ← 
 * 탭·다른 장소는 히스토리 -1.
 * 탐색 검색에서 지구본 써머리를 거쳐 들어온 경우만 탐색 경로로 복귀 (지구본 홈으로 끊지 않음).
 * 탐색 스냅샷이 없으면 기존처럼 닫기(홈).
 *
 * @param {{
 *   historyIdx: number | null,
 *   prevPath: string | null,
 *   returnTo: string | null,
 *   exploreReturnPath: string | null,
 * }} input
 * @returns {{ type: 'history' } | { type: 'push', path: string, clearReturnTo?: boolean } | { type: 'close' }}
 */
export function resolvePlaceCardBack(input) {
  const historyIdx = input?.historyIdx;
  const prevPath = typeof input?.prevPath === 'string' ? input.prevPath : null;
  const prevName = pathnameOf(prevPath);
  const returnTo = typeof input?.returnTo === 'string' ? input.returnTo : null;
  const exploreReturnPath =
    typeof input?.exploreReturnPath === 'string' ? input.exploreReturnPath : null;

  if (typeof historyIdx === 'number' && historyIdx > 0) {
    if (prevName.startsWith('/place/') || prevName.startsWith('/explore')) {
      return { type: 'history' };
    }
    if (returnTo && isKoreaPlaceReturnPath(prevPath)) {
      return { type: 'push', path: returnTo, clearReturnTo: true };
    }
  }

  if (returnTo) {
    return { type: 'push', path: returnTo, clearReturnTo: true };
  }

  if (
    exploreReturnPath &&
    exploreReturnPath.startsWith('/explore') &&
    (prevName === '' || prevName === '/')
  ) {
    return { type: 'push', path: exploreReturnPath };
  }

  return { type: 'close' };
}
