/** 결과 집합 title에서만 뽑는 취향 키워드 (고정 백과사전 칩 금지 · 매칭 1건 이상이면 노출) */
const TASTE_KEYWORDS = [
  { id: 'cherry', label: '벚꽃', patterns: ['벚꽃', '왕벚', '벚 '] },
  { id: 'fireworks', label: '불꽃', patterns: ['불꽃', '불꽃놀이', '파이어웍'] },
  { id: 'beach', label: '해변', patterns: ['해변', '비치', '바다', '해수욕'] },
  { id: 'night', label: '야간', patterns: ['야간', '나이트', '밤 '] },
  { id: 'beer', label: '맥주', patterns: ['맥주', '비어', 'beer'] },
  { id: 'drink', label: '술', patterns: ['막걸리', '와인', '사케', '소주', '양조', '술축제'] },
  { id: 'music', label: '음악', patterns: ['음악', '뮤직', '재즈', '록페', '콘서트'] },
  { id: 'food', label: '먹거리', patterns: ['먹거리', '음식', '맛축제', '푸드', '별미'] },
  { id: 'culture', label: '문화', patterns: ['문화', '전통', '민속', '한옥'] },
  { id: 'pottery', label: '도자기', patterns: ['도자기', '도예', '세라믹', '청자', '백자'] },
  { id: 'light', label: '빛축제', patterns: ['빛축제', '일루미', '미디어아트', '라이트'] },
  { id: 'flower', label: '꽃', patterns: ['꽃축제', '정원', '플라워', '수선화', '튤립', '국화'] },
  { id: 'smelt', label: '빙어', patterns: ['빙어'] },
  { id: 'trout', label: '산천어', patterns: ['산천어'] },
  { id: 'summer', label: '썸머', patterns: ['썸머', '여름축제', '워터밤', 'summer'] },
  { id: 'snow', label: '겨울', patterns: ['눈꽃', '스키', '겨울', '얼음'] },
  { id: 'film', label: '영화', patterns: ['영화', '필름', '영화제'] },
];

const MIN_COUNT = 1;

/**
 * @param {object[]} items — 시간·권역 등으로 이미 줄어든 결과
 * @returns {{ id: string, label: string, count: number }[]}
 */
export function buildTasteTags(items) {
  /** @type {Map<string, { id: string, label: string, count: number }>} */
  const counts = new Map();

  for (const item of items || []) {
    const title = String(item?.title || '');
    if (!title) continue;
    for (const kw of TASTE_KEYWORDS) {
      const hit = kw.patterns.some((p) => title.includes(p));
      if (!hit) continue;
      const prev = counts.get(kw.id);
      if (prev) prev.count += 1;
      else counts.set(kw.id, { id: kw.id, label: kw.label, count: 1 });
    }
  }

  return [...counts.values()]
    .filter((t) => t.count >= MIN_COUNT)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
}

/**
 * @param {object[]} items
 * @param {string} tasteId
 */
export function filterByTaste(items, tasteId) {
  if (!tasteId || tasteId === 'all') return items || [];
  const kw = TASTE_KEYWORDS.find((k) => k.id === tasteId);
  if (!kw) return items || [];
  return (items || []).filter((item) => {
    const title = String(item?.title || '');
    return kw.patterns.some((p) => title.includes(p));
  });
}

export function tasteLabel(tasteId) {
  if (!tasteId || tasteId === 'all') return '';
  return TASTE_KEYWORDS.find((k) => k.id === tasteId)?.label || '';
}

export { MIN_COUNT as TASTE_MIN_COUNT };
