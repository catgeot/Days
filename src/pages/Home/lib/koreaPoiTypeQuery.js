/**
 * 국내 검색어가 도시+시설/유적 접미사인지 (춘천향교 → 춘천 도시 스냅 금지).
 */

function compactKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/** 긴 토큰 우선 */
export const KOREA_POI_TYPE_TOKENS = [
  '해수욕장',
  '한옥마을',
  '민속촌',
  '기념관',
  '박물관',
  '미술관',
  '대학교',
  '휴게소',
  '향교',
  '서원',
  '사찰',
  '선굴',
  '동굴',
  '폭포',
];

/** TourAPI 전국 목록을 붙일 유형 — 허브 SSOT에 도시마다 없는 유적 */
export const KOREA_POI_TYPE_EXPAND_TOKENS = new Set(['향교', '서원']);

const HUB_QUERY_ADMIN_REST_RE = /^(시|군|구|특별시|광역시|특별자치시|특별자치도)$/;

export function parseKoreaPoiTypeQuery(query) {
  const compact = compactKey(query);
  if (!compact) return null;
  for (const type of KOREA_POI_TYPE_TOKENS) {
    if (compact === type) {
      return { type, cityPrefix: '', isTypeOnly: true };
    }
    if (compact.endsWith(type) && compact.length >= type.length + 2) {
      const cityPrefix = compact.slice(0, -type.length);
      if (cityPrefix.length >= 2) {
        return { type, cityPrefix, isTypeOnly: false };
      }
    }
  }
  return null;
}

export function shouldExpandKoreaPoiTypeSearch(queryOrParsed) {
  const parsed =
    typeof queryOrParsed === 'string'
      ? parseKoreaPoiTypeQuery(queryOrParsed)
      : queryOrParsed;
  return Boolean(parsed && KOREA_POI_TYPE_EXPAND_TOKENS.has(parsed.type));
}

/**
 * 허브 prefix: 쿼리가 도시명으로 시작해도 나머지가 시·군이 아니면 도시 히트 아님.
 * 「춘천향교」→ 춘천 허브 금지 · 「춘천시」→ 허용.
 */
export function hubNameMatchesPrefixQuery(nk, key) {
  if (!nk || !key) return false;
  if (nk.startsWith(key)) return true;
  if (key.length < 2 || !key.startsWith(nk)) return false;
  const rest = key.slice(nk.length);
  return !rest || HUB_QUERY_ADMIN_REST_RE.test(rest);
}

export function titleMatchesPoiType(title, type) {
  const t = compactKey(title);
  const token = compactKey(type);
  if (!t || !token || !t.includes(token)) return false;
  if (t.endsWith(token)) return true;
  return new RegExp(`${token}(?:대성전|명륜당|외삼문|동무|서무)`).test(t);
}
