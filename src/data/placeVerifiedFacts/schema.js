/** 확인된 사실 칸 — 값 / 출처(이름+URL) / 확인일. 빈 값은 추측으로 채우지 않는다. */

export const UNVERIFIED_LABEL = '확인 안 됨';

export const AI_GENERATED_LABEL = 'AI 생성 · 출처 없음';

export const CITY_SLOT_IDS = [
  'entry',
  'airport',
  'stay-area',
  'itinerary',
  'money-safety',
  'season',
];

export const ATTRACTION_SLOT_IDS = [
  'hours',
  'fee',
  'booking',
  'map',
  'duration',
  'nearby-food',
  'notes',
];

/**
 * @param {string} label
 * @param {string} value
 * @param {{ name: string, url: string }[]} sources
 * @param {string} checkedAt
 * @param {{ id: string, linkRole?: 'booking' | 'map' | null }} meta
 */
export function verifiedSlot(label, value, sources, checkedAt, meta) {
  const list = (Array.isArray(sources) ? sources : [])
    .filter((item) => item && (String(item.name || '').trim() || String(item.url || '').trim()))
    .map((item) => ({
      name: String(item.name || '').trim(),
      url: String(item.url || '').trim(),
    }));
  const primary = list[0] || null;
  return {
    id: meta.id,
    label,
    value: String(value || '').trim(),
    source: primary,
    sources: list,
    checkedAt: String(checkedAt || '').trim(),
    linkRole: meta.linkRole || null,
  };
}

export function emptySlot(id, label) {
  return verifiedSlot(label, '', [], '', { id });
}

export function presentFactText(value) {
  const text = String(value ?? '').trim();
  return text || UNVERIFIED_LABEL;
}

export function renderAiGeneratedLabel(generatedAt) {
  const date = String(generatedAt || '').trim();
  return date ? `${AI_GENERATED_LABEL} · ${date}` : AI_GENERATED_LABEL;
}

export function slotLooksEmpty(slot) {
  return !String(slot?.value || '').trim()
    && !(slot?.sources || []).length
    && !String(slot?.checkedAt || '').trim();
}
