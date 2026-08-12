/**
 * TourAPI 신분류(lclsSystm)·주소로 구분류(cat)·area_code 보정.
 * 일부 인기 POI는 areacode/cat1이 빈 문자열이라 areaBasedList sync에서 누락된다.
 */

/** @type {{ re: RegExp, code: string }[]} */
const ADDR_AREA_RULES = [
  { re: /서울/u, code: '1' },
  { re: /인천/u, code: '2' },
  { re: /대전/u, code: '3' },
  { re: /대구/u, code: '4' },
  { re: /전남광주|전라남도|전남/u, code: '38' },
  { re: /광주광역시|광주\s/u, code: '5' },
  { re: /부산/u, code: '6' },
  { re: /울산/u, code: '7' },
  { re: /세종/u, code: '8' },
  { re: /경기/u, code: '31' },
  { re: /강원/u, code: '32' },
  { re: /충청북도|충북/u, code: '33' },
  { re: /충청남도|충남/u, code: '34' },
  { re: /경상북도|경북/u, code: '35' },
  { re: /경상남도|경남/u, code: '36' },
  { re: /전북특별|전라북도|전북/u, code: '37' },
  { re: /제주/u, code: '39' },
];

/**
 * @param {string | null | undefined} addr
 * @returns {string | null}
 */
export function inferTourAreaCodeFromAddr(addr) {
  const text = String(addr || '').trim();
  if (!text) return null;
  for (const rule of ADDR_AREA_RULES) {
    if (rule.re.test(text)) return rule.code;
  }
  return null;
}

/**
 * lclsSystm → 구 cat1/2/3 (검색·칩용). 모르면 null.
 * @param {string | null | undefined} l1
 * @param {string | null | undefined} l2
 * @param {string | null | undefined} l3
 * @returns {{ cat1: string, cat2: string, cat3: string } | null}
 */
export function inferTourCatsFromLcls(l1, l2, l3) {
  const a = String(l1 || '').trim().toUpperCase();
  const b = String(l2 || '').trim().toUpperCase();
  const c = String(l3 || '').trim().toUpperCase();
  if (!a) return null;

  // 역사 (HS)
  if (a === 'HS') {
    if (b === 'HS01' || c.startsWith('HS0101')) {
      return { cat1: 'A02', cat2: 'A0201', cat3: 'A02010100' }; // 고궁
    }
    if (b === 'HS02' || c.startsWith('HS0201')) {
      return { cat1: 'A02', cat2: 'A0201', cat3: 'A02010200' }; // 성
    }
    if (b === 'HS03' || c.startsWith('HS0301')) {
      return { cat1: 'A02', cat2: 'A0201', cat3: 'A02010800' }; // 사찰
    }
    return { cat1: 'A02', cat2: 'A0201', cat3: 'A02010700' }; // 유적지·사적지
  }

  // 자연 (NA)
  if (a === 'NA') {
    if (c.startsWith('NA0209') || b === 'NA02') {
      return { cat1: 'A01', cat2: 'A0101', cat3: 'A01011200' }; // 해수욕장 계열
    }
    if (c.startsWith('NA0104')) {
      return { cat1: 'A01', cat2: 'A0101', cat3: 'A01010900' }; // 계곡
    }
    if (c.startsWith('NA0101')) {
      return { cat1: 'A01', cat2: 'A0101', cat3: 'A01010400' }; // 산
    }
    return { cat1: 'A01', cat2: 'A0101', cat3: 'A01010500' }; // 자연생태
  }

  // 체험 등
  if (a === 'EX') {
    return { cat1: 'A02', cat2: 'A0203', cat3: 'A02030400' };
  }

  return null;
}

/**
 * @param {Record<string, unknown>} item TourAPI item
 * @param {{ addr1?: string | null }} [hint]
 */
export function fillTourAttractionMeta(item, hint = {}) {
  const out = { ...item };
  const addr = String(
    out.addr1 || out.addr || hint.addr1 || '',
  ).trim();

  const area =
    String(out.areacode || out.areaCode || '').trim() ||
    inferTourAreaCodeFromAddr(addr);
  if (area) {
    out.areacode = area;
    out.areaCode = area;
  }

  const hasCat = String(out.cat1 || '').trim();
  if (!hasCat) {
    const inferred = inferTourCatsFromLcls(
      out.lclsSystm1,
      out.lclsSystm2,
      out.lclsSystm3,
    );
    if (inferred) {
      out.cat1 = inferred.cat1;
      out.cat2 = inferred.cat2;
      out.cat3 = inferred.cat3;
    }
  }
  return out;
}
