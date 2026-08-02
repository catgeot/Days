/**
 * 범지구적 퍼즐 — 수도 시드 (소량).
 * #31 캠페인(아시아·유럽·남아메리카) 우선 + distractor용 소량.
 */

/** @typedef {{ id: string, capitalKo: string, capitalEn?: string }} PuzzleCapitalSeed */

/** @type {PuzzleCapitalSeed[]} */
export const GLOBAL_PUZZLE_CAPITALS = [
  // 아시아 캠페인
  { id: 'kr', capitalKo: '서울', capitalEn: 'Seoul' },
  { id: 'jp', capitalKo: '도쿄', capitalEn: 'Tokyo' },
  { id: 'cn', capitalKo: '베이징', capitalEn: 'Beijing' },
  { id: 'tw', capitalKo: '타이베이', capitalEn: 'Taipei' },
  { id: 'mn', capitalKo: '울란바토르', capitalEn: 'Ulaanbaatar' },
  { id: 'kp', capitalKo: '평양', capitalEn: 'Pyongyang' },
  // 유럽 캠페인 (본토 위주 · 섬 밀집 오세아니아 대체)
  { id: 'fr', capitalKo: '파리', capitalEn: 'Paris' },
  { id: 'de', capitalKo: '베를린', capitalEn: 'Berlin' },
  { id: 'gb', capitalKo: '런던', capitalEn: 'London' },
  { id: 'it', capitalKo: '로마', capitalEn: 'Rome' },
  { id: 'es', capitalKo: '마드리드', capitalEn: 'Madrid' },
  { id: 'pt', capitalKo: '리스본', capitalEn: 'Lisbon' },
  { id: 'pl', capitalKo: '바르샤바', capitalEn: 'Warsaw' },
  { id: 'nl', capitalKo: '암스테르담', capitalEn: 'Amsterdam' },
  // 남아메리카 캠페인
  { id: 'ar', capitalKo: '부에노스아이레스', capitalEn: 'Buenos Aires' },
  { id: 'bo', capitalKo: '수크레', capitalEn: 'Sucre' },
  { id: 'br', capitalKo: '브라질리아', capitalEn: 'Brasília' },
  { id: 'cl', capitalKo: '산티아고', capitalEn: 'Santiago' },
  { id: 'co', capitalKo: '보고타', capitalEn: 'Bogotá' },
  { id: 'ec', capitalKo: '키토', capitalEn: 'Quito' },
  { id: 'gy', capitalKo: '조지타운', capitalEn: 'Georgetown' },
  { id: 'py', capitalKo: '아순시온', capitalEn: 'Asunción' },
  { id: 'pe', capitalKo: '리마', capitalEn: 'Lima' },
  { id: 'sr', capitalKo: '파라마리보', capitalEn: 'Paramaribo' },
  { id: 'uy', capitalKo: '몬테비데오', capitalEn: 'Montevideo' },
  { id: 've', capitalKo: '카라카스', capitalEn: 'Caracas' },
  // distractor 풀 (다른 권역 · 캠페인 외)
  { id: 'th', capitalKo: '방콕', capitalEn: 'Bangkok' },
  { id: 'vn', capitalKo: '하노이', capitalEn: 'Hanoi' },
  { id: 'id', capitalKo: '자카르타', capitalEn: 'Jakarta' },
  { id: 'my', capitalKo: '쿠알라룸푸르', capitalEn: 'Kuala Lumpur' },
  { id: 'sg', capitalKo: '싱가포르', capitalEn: 'Singapore' },
  { id: 'us', capitalKo: '워싱턴 D.C.', capitalEn: 'Washington, D.C.' },
  { id: 'ca', capitalKo: '오타와', capitalEn: 'Ottawa' },
  { id: 'mx', capitalKo: '멕시코시티', capitalEn: 'Mexico City' },
  { id: 'au', capitalKo: '캔버라', capitalEn: 'Canberra' },
  { id: 'nz', capitalKo: '웰링턴', capitalEn: 'Wellington' },
  { id: 'eg', capitalKo: '카이로', capitalEn: 'Cairo' },
  { id: 'za', capitalKo: '프리토리아', capitalEn: 'Pretoria' },
  { id: 'ng', capitalKo: '아부자', capitalEn: 'Abuja' },
];

const BY_ID = new Map(GLOBAL_PUZZLE_CAPITALS.map((row) => [row.id, row]));

export function getPuzzleCapitalSeed(countryId) {
  if (!countryId) return null;
  return BY_ID.get(String(countryId)) || null;
}

export function isPuzzleCountryPlayable(countryId) {
  return Boolean(getPuzzleCapitalSeed(countryId));
}

export function listPuzzleCountryIds() {
  return GLOBAL_PUZZLE_CAPITALS.map((row) => row.id);
}

/**
 * @param {string} countryId
 * @param {string[]} [preferIds]
 * @param {number} [choiceCount]
 * @param {() => number} [rng]
 */
export function buildCapitalChoices(countryId, preferIds = [], choiceCount = 4, rng = Math.random) {
  const seed = getPuzzleCapitalSeed(countryId);
  if (!seed) return [];

  const correct = seed.capitalKo;
  const preferSet = new Set((preferIds || []).filter((id) => id && id !== countryId));
  const distractors = [];
  const used = new Set([correct]);

  const pushFrom = (ids) => {
    for (const id of ids) {
      if (distractors.length >= choiceCount - 1) break;
      const row = getPuzzleCapitalSeed(id);
      if (!row || used.has(row.capitalKo)) continue;
      used.add(row.capitalKo);
      distractors.push(row.capitalKo);
    }
  };

  pushFrom([...preferSet]);
  const rest = GLOBAL_PUZZLE_CAPITALS
    .map((row) => row.id)
    .filter((id) => id !== countryId && !preferSet.has(id));
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  pushFrom(rest);

  const choices = [correct, ...distractors].slice(0, choiceCount);
  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
