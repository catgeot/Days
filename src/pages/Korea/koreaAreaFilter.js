/**
 * TourAPI searchFestival2는 areaCode unused → 응답 addr1으로만 도·시 필터.
 * 힌트는 「포함」매칭 (강원특별자치도 ⊂ 강원, 전북특별자치도 ⊂ 전북…).
 */

/** @type {Record<string, string[]>} */
export const SIDO_ADDR_HINTS = {
  1: ['서울특별시', '서울'],
  2: ['인천광역시', '인천'],
  3: ['대전광역시', '대전'],
  4: ['대구광역시', '대구'],
  /** 경기 광주시와 구분 — 긴 표기 우선 */
  5: ['광주광역시'],
  6: ['부산광역시', '부산'],
  7: ['울산광역시', '울산'],
  8: ['세종특별자치시', '세종시', '세종'],
  31: ['경기도', '경기'],
  32: ['강원특별자치도', '강원도', '강원'],
  33: ['충청북도', '충북'],
  34: ['충청남도', '충남'],
  35: ['경상북도', '경북'],
  36: ['경상남도', '경남'],
  37: ['전북특별자치도', '전라북도', '전북'],
  38: ['전라남도', '전남'],
  39: ['제주특별자치도', '제주도', '제주'],
};

/**
 * @param {string} addr
 * @param {string | number} areaCode
 */
export function matchSido(addr, areaCode) {
  const a = String(addr || '');
  if (!a) return false;
  const hints = SIDO_ADDR_HINTS[String(areaCode)];
  if (!hints?.length) return false;
  return hints.some((h) => a.includes(h));
}

/**
 * @param {string} addr
 * @param {string} sigunguName — TourAPI areaCode(시군) name, 예: 춘천시
 */
export function matchSigungu(addr, sigunguName) {
  const a = String(addr || '');
  const name = String(sigunguName || '').trim();
  if (!a || !name) return false;
  if (a.includes(name)) return true;
  const bare = name.replace(/(특별자치시|광역시|특별시|자치시|시|군|구)$/u, '');
  if (bare.length >= 2 && a.includes(bare)) {
    // 시/군 단위만 — 「구」단독 축약은 오탐 많음
    if (/구$/u.test(name) && bare.length < 3) return false;
    return true;
  }
  return false;
}

/**
 * hub 표시명 → 시군 칩 자동 선택 (춘천 → 춘천시).
 * @param {string} hubName
 * @param {{ code: string, name: string }[]} sigunguList
 * @returns {{ code: string, name: string } | null}
 */
export function pickSigunguForHub(hubName, sigunguList) {
  const hub = String(hubName || '').trim();
  if (!hub || !Array.isArray(sigunguList) || sigunguList.length === 0) return null;

  const exact = sigunguList.find((s) => s.name === hub);
  if (exact) return exact;

  const withSuffix = sigunguList.find(
    (s) => s.name === `${hub}시` || s.name === `${hub}군` || s.name === `${hub}구`,
  );
  if (withSuffix) return withSuffix;

  const includes = sigunguList.find(
    (s) => s.name.includes(hub) || hub.includes(s.name.replace(/(시|군|구)$/u, '')),
  );
  return includes || null;
}

/**
 * @param {object[]} items
 * @param {{ areaCode?: string, sigunguName?: string }} filter
 */
export function filterFestivalsByAddr(items, filter = {}) {
  const list = Array.isArray(items) ? items : [];
  const areaCode = filter.areaCode;
  const sigunguName = filter.sigunguName;

  if (!areaCode || areaCode === 'all') return list;

  return list.filter((item) => {
    const addr = item?.addr1 || '';
    if (!matchSido(addr, areaCode)) return false;
    if (sigunguName && sigunguName !== 'all') {
      return matchSigungu(addr, sigunguName);
    }
    return true;
  });
}
