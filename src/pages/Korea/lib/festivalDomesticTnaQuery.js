import { extractTourAttractionSigungu } from '../../Home/lib/koreaTourAttractionLocality.js';
import { resolveFestivalItemSidoCode, SIDO_ADDR_HINTS } from '../koreaAreaFilter.js';
import { stripKoAdminSuffix } from '../../../utils/mrtStayQuery.js';

/** MRT 인근 보강 시 동형어·해외 오탐이 큰 키워드 — 해당 시·군 주소·hub가 아니면 제외 */
const TNA_NEARBY_HOMONYM_BLOCK = new Set(['공주']);

/**
 * @param {string | null | undefined} areaCode
 */
function sidoMrtKeyword(areaCode) {
  const code = String(areaCode || '').trim();
  const hints = SIDO_ADDR_HINTS[code];
  if (!hints?.length) return '';
  const short = hints.find((h) => /^(충남|충북|경남|경북|전남|전북|강원|제주|경기)$/u.test(h));
  return short || stripKoAdminSuffix(hints[0]) || hints[0];
}

function normId(v) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

function mergeUniqueKeywords(primary, extras) {
  const out = [];
  const seen = new Set();
  const push = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };
  push(primary);
  for (const k of extras || []) push(k);
  return out;
}

/**
 * 국내 축제 상세 투어 — 주소 시·군·도 우선, 동형어 인근(공주) 차단.
 *
 * @param {ReturnType<import('../../Home/lib/koreaThemeCrossLinks.js').resolveFestivalThemeCrossLinks>} cross
 * @param {Record<string, unknown> | null | undefined} item
 */
export function applyFestivalDomesticTnaGuards(cross, item) {
  if (!cross || !item) return cross;

  const addr = String(item.addr1 || '');
  const addr2 = item.addr2 != null ? String(item.addr2) : '';
  const sigungu = extractTourAttractionSigungu(addr, addr2);
  const localKeyword = stripKoAdminSuffix(sigungu) || '';
  const areaCode = resolveFestivalItemSidoCode(item);
  const sidoKeyword = sidoMrtKeyword(areaCode);
  const hubId = normId(cross.tna?.location?.hubId || cross.stay?.location?.hubId);
  const allowGongjuNearby = hubId === 'gongju' || /공주시/u.test(addr);

  const allowNearby = (kw) => {
    const k = String(kw || '').trim();
    if (!k) return false;
    if (TNA_NEARBY_HOMONYM_BLOCK.has(k) && !allowGongjuNearby) return false;
    return true;
  };

  if (cross.tna) {
    if (localKeyword) {
      cross.tna.keyword = localKeyword;
    }
    const altBase = (cross.tna.altKeywords || []).filter(allowNearby);
    if (sidoKeyword && sidoKeyword !== cross.tna.keyword) {
      cross.tna.altKeywords = mergeUniqueKeywords(sidoKeyword, altBase).filter(
        (k) => k !== cross.tna.keyword,
      );
    } else {
      cross.tna.altKeywords = altBase;
    }
    cross.tna.nearbyKeywords = (cross.tna.nearbyKeywords || []).filter(allowNearby);
    if (cross.tna.location && localKeyword) {
      cross.tna.location = {
        ...cross.tna.location,
        parentCity: localKeyword,
      };
    }
  }

  if (cross.stay && localKeyword && cross.stay.keyword !== localKeyword) {
    const stayAlts = (cross.stay.altKeywords || []).filter(allowNearby);
    cross.stay.keyword = localKeyword;
    if (sidoKeyword && sidoKeyword !== localKeyword) {
      cross.stay.altKeywords = mergeUniqueKeywords(sidoKeyword, stayAlts).filter(
        (k) => k !== localKeyword,
      );
    } else {
      cross.stay.altKeywords = stayAlts;
    }
    if (cross.stay.location) {
      cross.stay.location = { ...cross.stay.location, parentCity: localKeyword };
    }
  }

  return cross;
}