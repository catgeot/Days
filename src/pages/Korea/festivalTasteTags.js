/**
 * 축제 테마 SSOT — TourAPI(A02·A0207 축제 / A0208 공연·행사) + VisitKorea 구석구석·
 * 축제포털(음악·미술·스포츠·푸드·자연·키즈 등) 관례 · 제목 키워드.
 * 칩은 현재 풀에서 매칭 ≥1건만 노출(MIN_COUNT).
 */

/** @typedef {{ id: string, label: string, patterns?: string[], cat3Prefixes?: string[] }} FestivalTasteTheme */

/** @type {FestivalTasteTheme[]} */
const FESTIVAL_TASTE_THEMES = [
  {
    id: 'music',
    label: '음악',
    patterns: [
      '음악',
      '뮤직',
      '재즈',
      '록페',
      '록 페',
      '클래식',
      '오케스트라',
      '국악',
      '콘서트',
      '페스티벌',
      'song',
      'jazz',
      'rock',
      'K-POP',
      'kpop',
      '힙합',
      '어쿠스틱',
      '밴드',
      '싱어',
      '가요',
    ],
    cat3Prefixes: ['A020804'],
  },
  {
    id: 'performance',
    label: '공연·연극',
    patterns: [
      '공연',
      '연극',
      '뮤지컬',
      '인형극',
      '마당극',
      '거리예술',
      '무용',
      '댄스',
      '버스킹',
      '오페라',
      '발레',
      '실경',
      '연희',
      '탈춤',
      '마술',
      '서커스',
      '코미디',
      '스탠드업',
      '아트',
      '퍼포먼스',
      '쇼',
      '마당아트',
      '연희',
      '힐링쇼',
    ],
    cat3Prefixes: ['A020801', 'A020802', 'A020803'],
  },
  {
    id: 'film',
    label: '영화·미디어',
    patterns: [
      '영화',
      '영화제',
      '필름',
      '애니',
      '애니메이션',
      '만화',
      '미디어아트',
      '영상',
      '단편',
      '독립영화',
      '시네',
    ],
  },
  {
    id: 'culture',
    label: '문화·전통',
    patterns: [
      '문화',
      '전통',
      '민속',
      '한옥',
      '무형문화',
      '세시',
      '농악',
      '탈',
      '판소리',
      '사물놀이',
      '한복',
      '고택',
      '향토',
      '문화유산',
      '문화관광',
      'heritage',
    ],
    cat3Prefixes: ['A020701'],
  },
  {
    id: 'history',
    label: '역사·유적',
    patterns: [
      '역사',
      '유적',
      '탐방',
      '사적',
      '유산',
      '고궁',
      '성곽',
      '고분',
      '백제',
      '한양',
      '역사문화',
      '기념',
      '추모',
    ],
  },
  {
    id: 'food',
    label: '먹거리',
    patterns: [
      '먹거리',
      '음식',
      '맛',
      '맛축제',
      '푸드',
      '별미',
      '김밥',
      '빵',
      '한우',
      '흑돼지',
      '밀면',
      '갈비',
      '해물',
      '수산',
      '농산',
      '곡물',
      '쌀',
      '과일',
      '딸기',
      '사과',
      '포도',
      '복숭아',
      '감',
      '고구마',
      '옥수수',
      '초콜릿',
      '디저트',
      '요리',
      '미식',
      '식품',
      '맛집',
      'street food',
      'food',
    ],
  },
  {
    id: 'drink',
    label: '술·주류',
    patterns: [
      '맥주',
      '비어',
      'beer',
      '막걸리',
      '와인',
      '사케',
      '소주',
      '양조',
      '술축제',
      '술 페',
      '술페',
      '칵테일',
      '위스키',
      '브루어리',
      '주류',
      '이자카야',
      '칵스',
      'brew',
      'wine',
    ],
  },
  {
    id: 'flower',
    label: '꽃·정원',
    patterns: [
      '꽃축제',
      '벚꽃',
      '왕벚',
      '벚 ',
      '튤립',
      '국화',
      '장미',
      '수선화',
      '코스모스',
      '해바라기',
      '유채',
      '개나리',
      '매화',
      '동백',
      '철쭉',
      '억새',
      '정원',
      '가든',
      '플라워',
      'garden',
      'flower',
      '로즈',
      '허브',
      '수국',
      '연꽃',
      '목련',
      '산수유',
      '진달래',
      '꽃',
    ],
  },
  {
    id: 'nature',
    label: '자연·산',
    patterns: [
      '자연',
      '산',
      '숲',
      '트레킹',
      '캠핑',
      '낚시',
      '계곡',
      '폭포',
      '습지',
      '생태',
      '백두대간',
      '들판',
      '초원',
      '숲속',
      '수목원',
      '공원',
      '힐링',
      '피톤',
      '등산',
      '오솔길',
    ],
  },
  {
    id: 'beach',
    label: '바다·해변',
    patterns: [
      '해변',
      '비치',
      '바다',
      '해수욕',
      '어항',
      '포구',
      '해양',
      '섬',
      '갯벌',
      '서핑',
      '다이빙',
      '요트',
      '선박',
      'beach',
      'ocean',
      '마린',
    ],
  },
  {
    id: 'light',
    label: '빛·야경',
    patterns: [
      '빛축제',
      '일루미',
      '라이트',
      'LED',
      '네온',
      '야경',
      '루미나',
      '빛초롱',
      '등불',
      '초롱',
      '미디어파사드',
      'projection',
      'illumi',
    ],
  },
  {
    id: 'fireworks',
    label: '불꽃',
    patterns: ['불꽃', '불꽃놀이', '파이어웍', 'firework'],
  },
  {
    id: 'night',
    label: '야간',
    patterns: ['야간', '나이트', '밤 ', 'night', '달빛', '야행'],
  },
  {
    id: 'sports',
    label: '스포츠·체험',
    patterns: [
      '스포츠',
      '마라톤',
      '걷기',
      '걷기행사',
      '레이스',
      'e스포츠',
      'e-스포츠',
      '이스포츠',
      '철인',
      '레포츠',
      '골프',
      '자전거',
      '수영',
      '축구',
      '야구',
      '농구',
      '배구',
      '테니스',
      '승마',
      '패러',
      '번지',
      '클라이밍',
      '체험',
      '어드벤처',
      '트라이애슬론',
      '대회',
      '경기',
      '레슬링',
      '씨름',
      '유도',
      '태권도',
      '검도',
      '무술',
      '요가',
      '피트니스',
    ],
    cat3Prefixes: ['A020808'],
  },
  {
    id: 'craft',
    label: '공예·도자',
    patterns: [
      '도자기',
      '도예',
      '세라믹',
      '청자',
      '백자',
      '공예',
      '목공',
      '직조',
      '섬유',
      '패션',
      '핸드메이드',
      '장인',
      '옹기',
      '유기',
      '나전',
      '한지',
      '뜨개',
      '바느질',
      '도자',
      'pottery',
      'craft',
    ],
  },
  {
    id: 'market',
    label: '마켓·박람회',
    patterns: [
      '마켓',
      '박람회',
      '페어',
      'expo',
      '장터',
      '플리마켓',
      '야시장',
      '나이트마켓',
      '벼룩',
      '전시회',
      '박람',
      'fair',
      'market',
      '쇼핑',
      '아울렛',
    ],
  },
  {
    id: 'kids',
    label: '가족·키즈',
    patterns: [
      '어린이',
      '키즈',
      '유아',
      '가족',
      '패밀리',
      '동화',
      '놀이',
      '키즈랜드',
      'family',
      'kids',
      'child',
      '유치원',
      '초등',
      '청소년',
      '장애학생',
      '학생',
    ],
  },
  {
    id: 'pet',
    label: '반려동물',
    patterns: ['반려', '펫', '애완', 'pet', '멍냥', '강아지', '고양이', '도그', '캣'],
  },
  {
    id: 'summer',
    label: '물·썸머',
    patterns: [
      '썸머',
      '여름축제',
      '워터밤',
      'summer',
      '물놀이',
      '워터',
      '수상',
      '피서',
      '해수',
      '물총',
      '스플래시',
      '풀파티',
      '비치파티',
    ],
  },
  {
    id: 'snow',
    label: '겨울·눈',
    patterns: [
      '눈꽃',
      '스키',
      '겨울',
      '얼음',
      '빙어',
      '산천어',
      '썰매',
      '스노우',
      'snow',
      'ice',
      '윈터',
      'winter',
      '눈',
      '설경',
      '얼음낚시',
      '빙벽',
    ],
  },
];

const THEME_BY_ID = new Map(FESTIVAL_TASTE_THEMES.map((t) => [t.id, t]));

/** 칩 정렬 — 음악·공연·먹거리 등 상위 노출 우선 */
const THEME_SORT_ORDER = [
  'music',
  'performance',
  'food',
  'drink',
  'culture',
  'flower',
  'light',
  'fireworks',
  'sports',
  'nature',
  'beach',
  'film',
  'history',
  'craft',
  'market',
  'kids',
  'summer',
  'snow',
  'night',
  'pet',
];

const MIN_COUNT = 1;

/**
 * @param {object} item
 * @returns {Set<string>}
 */
export function inferFestivalTasteIds(item) {
  const ids = new Set();
  const title = String(item?.title || '');
  if (!title) return ids;

  const cat3 = String(item?.cat3 || '').toUpperCase();

  for (const theme of FESTIVAL_TASTE_THEMES) {
    if (theme.patterns?.some((p) => title.includes(p))) ids.add(theme.id);
    if (theme.cat3Prefixes?.some((pfx) => cat3.startsWith(pfx))) ids.add(theme.id);
  }

  return ids;
}

/**
 * @param {object[]} items — 시간·권역 등으로 이미 줄어든 결과
 * @returns {{ id: string, label: string, count: number }[]}
 */
export function buildTasteTags(items) {
  /** @type {Map<string, { id: string, label: string, count: number }>} */
  const counts = new Map();

  for (const item of items || []) {
    for (const id of inferFestivalTasteIds(item)) {
      const theme = THEME_BY_ID.get(id);
      if (!theme) continue;
      const prev = counts.get(id);
      if (prev) prev.count += 1;
      else counts.set(id, { id, label: theme.label, count: 1 });
    }
  }

  const orderIdx = (id) => {
    const i = THEME_SORT_ORDER.indexOf(id);
    return i >= 0 ? i : THEME_SORT_ORDER.length;
  };

  return [...counts.values()]
    .filter((t) => t.count >= MIN_COUNT)
    .sort(
      (a, b) =>
        orderIdx(a.id) - orderIdx(b.id) ||
        b.count - a.count ||
        a.label.localeCompare(b.label, 'ko'),
    );
}

/**
 * @param {object[]} items
 * @param {string} tasteId
 */
export function filterByTaste(items, tasteId) {
  if (!tasteId || tasteId === 'all') return items || [];
  if (!THEME_BY_ID.has(tasteId)) return items || [];
  return (items || []).filter((item) => inferFestivalTasteIds(item).has(tasteId));
}

export function tasteLabel(tasteId) {
  if (!tasteId || tasteId === 'all') return '';
  return THEME_BY_ID.get(tasteId)?.label || '';
}

export { MIN_COUNT as TASTE_MIN_COUNT, FESTIVAL_TASTE_THEMES };
