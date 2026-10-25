import { slotLooksEmpty } from './schema.js';

/** 스케치 섹션 제목·본문에 있으면 그 섹션 끝. 명세의 주제 키워드. */
export const SKETCH_SLOT_KEYWORDS = {
  entry: ['비자', '입국', '여권', '심사', 'visa', 'passport', 'immigration'],
  airport: ['공항', '택시', '도착', '리무진', 'airport', 'taxi', 'limousine'],
  itinerary: ['일째', '첫날', '이튿날', 'D1', 'day 1', 'first day'],
  'money-safety': ['환전', '현금', '치안', '소매치기', 'pickpocket', 'currency exchange'],
  safety: ['치안', '시위', '소매치기', 'protest', 'safety'],
};

/** 플래너 ToolkitCard type → 사실 슬롯. 동선은 일자 본문이 생기기 전에는 넣지 않는다. */
export const PLANNER_FACT_BY_TOOLKIT = {
  visa: 'entry',
  airport_transfer: 'airport',
  safety: 'safety',
  accommodation: 'stay-area',
};

export function verifiedFactSlots(card) {
  if (!card) return [];
  return (card.slots || []).filter((slot) => !slotLooksEmpty(slot));
}

function normTitle(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function includesKeyword(haystack, keyword) {
  const needle = String(keyword || '');
  if (!needle) return false;
  if (/[a-z0-9]/i.test(needle)) return haystack.toLowerCase().includes(needle.toLowerCase());
  return haystack.includes(needle);
}

/**
 * 섹션당 최대 1행, 주제당 1번. 여러 섹션이 맞으면 먼저 나온 섹션만.
 * @returns {{ index: number, slotId: string }[]}
 */
export function assignSketchLocalInfo(sections, card) {
  const filled = verifiedFactSlots(card);
  if (!filled.length) return [];
  const used = new Set();
  const assignments = [];
  (Array.isArray(sections) ? sections : []).forEach((section, index) => {
    const haystack = `${section?.title || ''}\n${section?.content || ''}`;
    if (!haystack.trim()) return;
    for (const slot of filled) {
      if (used.has(slot.id)) continue;
      const keywords = SKETCH_SLOT_KEYWORDS[slot.id];
      if (!keywords?.some((keyword) => includesKeyword(haystack, keyword))) continue;
      used.add(slot.id);
      assignments.push({ index, slotId: slot.id });
      break;
    }
  });
  return assignments;
}

export function plannerSlotForToolkit(card, toolkitType) {
  const slotId = PLANNER_FACT_BY_TOOLKIT[toolkitType];
  if (!card || !slotId) return null;
  const ids = toolkitType === 'safety' ? ['safety', 'money-safety'] : [slotId];
  const slot = toolkitType === 'safety'
    ? ids.map((id) => (card.slots || []).find((item) => item.id === id)).find(Boolean)
    : (card.slots || []).find((item) => ids.includes(item.id));
  if (!slot || slotLooksEmpty(slot)) return null;
  return slot;
}

/**
 * 로그북·리뷰 제목. DB에 있는 제목만. 장소명만인 제목·중복·빈 제목은 제외.
 * 순서: 에디토리얼 우선, 그다음 최신 날짜. 최대 2개.
 */
export function selectVisitStories(entries, placeNames) {
  const nameKeys = new Set((placeNames || []).map(normTitle).filter(Boolean));
  const seen = new Set();
  const rows = [];
  for (const entry of entries || []) {
    const title = String(entry?.title || '').trim();
    const key = normTitle(title);
    if (!key || nameKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    rows.push({
      id: String(entry.id || key),
      kind: entry.kind === 'review' ? 'review' : 'logbook',
      title,
      editorial: Boolean(entry.editorial || entry.is_editorial),
      date: entry.date || entry.created_at || entry.published_at || '',
      href: entry.href || '',
    });
  }
  rows.sort((a, b) => {
    if (a.editorial !== b.editorial) return a.editorial ? -1 : 1;
    const ta = Date.parse(a.date) || 0;
    const tb = Date.parse(b.date) || 0;
    return tb - ta;
  });
  return rows.slice(0, 2);
}
