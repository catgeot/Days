/**
 * 11/11 홍보 — 조선왕릉 검색·상세 관람 안내(공공 사실). DB·무니 생성 없음.
 */
function compactNameKey(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, '');
}

const JOSEON_UNESCO_INTRO =
  '조선 왕릉 40기(18곳)는 2009년 유네스코 세계문화유산으로 지정되었습니다. 궁능유적본부·각 지구 관리소에서 입장 안내·봉분·신도를 둘러볼 수 있습니다.';

const OFFICE_BY_NEEDLE = [
  {
    needle: '조선왕릉중부지구관리소',
    desc: `${JOSEON_UNESCO_INTRO} 중부지구 관리소는 남양주·구리 일대 동구릉·홍유릉·사릉 등 중부 왕릉군 안내·매표를 담당합니다. 관람 전 운영 시간·휴무·입장료는 국가유산권리원 조선왕릉 안내를 확인하세요. 서울 시내 카드와 다른 좌표 핀입니다.`,
    homepage: 'https://www.royaltombs.cha.go.kr/',
  },
  {
    needle: '조선왕릉서부지구관리소',
    desc: `${JOSEON_UNESCO_INTRO} 서부지구 관리소는 고양 서오릉·서삼릉 등 서부 왕릉군 안내·매표를 담당합니다. 관람 전 운영 시간·휴무·입장료는 국가유산권리원 조선왕릉 안내를 확인하세요. 서울·고양 허브 카드와 다른 좌표 핀입니다.`,
    homepage: 'https://www.royaltombs.cha.go.kr/',
  },
];

const TOUR_COPY_BY_CONTENT_ID = {
  '125545': {
    desc: '동구릉(강릉·명릉 등)은 경기 구리·남양주에 있는 조선 왕릉군으로 유네스코 세계문화유산입니다. 봉분·제상·신도가 산세와 어우러진 대표 왕릉입니다. 입장·해설·주차는 궁능유적본부 안내를 따르세요.',
    addr1: '경기도 구리시 갈매동 일원',
  },
  '125548': {
    desc: '홍유릉은 고종·명성황후·순종·순의황후의 합장릉으로 남양주에 있으며 조선 왕릉 유산입니다. 입장 동선은 안내소 표지를 따르고 사진·음식물 반입 규정을 지켜 주세요.',
    addr1: '경기도 남양주시 수동면 일원',
  },
};

const NAME_COPY = {
  동구릉: TOUR_COPY_BY_CONTENT_ID['125545'],
  홍유릉: TOUR_COPY_BY_CONTENT_ID['125548'],
  선정릉: {
    desc: '선정릉(宣靖陵)은 선조·중종의 능으로 서울 강남 선릉·정릉 옆에 있으며 조선 왕릉 유산입니다. 선릉과 함께 둘러보며 입장 시간·휴무는 현장 안내를 확인하세요.',
    addr1: '서울특별시 강남구 삼성동 일원',
  },
  왕릉: {
    desc: JOSEON_UNESCO_INTRO,
  },
  조선왕릉: {
    desc: JOSEON_UNESCO_INTRO,
  },
};

function officeCopyForName(name) {
  const n = String(name || '');
  return OFFICE_BY_NEEDLE.find((row) => n.includes(row.needle)) || null;
}

function nameCopyForPin(pin) {
  const keys = [pin?.name, pin?.name_ko, pin?.originalQuery].map(compactNameKey);
  for (const key of keys) {
    if (!key) continue;
    for (const [needle, copy] of Object.entries(NAME_COPY)) {
      if (key.includes(compactNameKey(needle))) return copy;
    }
  }
  const cid = String(pin?.contentId || '').replace(/^tour-/, '').trim();
  if (TOUR_COPY_BY_CONTENT_ID[cid]) return TOUR_COPY_BY_CONTENT_ID[cid];
  const slug = String(pin?.slug || pin?.id || '').toLowerCase();
  const tourMatch = slug.match(/^tour-(\d+)$/);
  if (tourMatch && TOUR_COPY_BY_CONTENT_ID[tourMatch[1]]) {
    return TOUR_COPY_BY_CONTENT_ID[tourMatch[1]];
  }
  return null;
}

/**
 * @param {object | null | undefined} pin
 * @returns {object | null | undefined}
 */
export function enrichJoseonRoyalTombsPromoPin(pin) {
  if (!pin || typeof pin !== 'object') return pin;
  const office = officeCopyForName(pin.name || pin.name_ko);
  const named = office || nameCopyForPin(pin);
  if (!named?.desc) return pin;

  const next = { ...pin };
  if (!String(next.desc || '').trim() || next.desc === next.curationSummary) {
    next.desc = named.desc;
  }
  if (!String(next.curationSummary || '').trim()) {
    next.curationSummary = named.desc;
  }
  if (named.addr1 && !next.addr1) next.addr1 = named.addr1;
  if (named.homepage && !next.homepage) next.homepage = named.homepage;
  if (office) next.placeChatIntroApplied = true;
  return next;
}
