import { splitOverviewParagraphs } from '../../components/PlaceCard/common/placeOverviewText';

export const LONG_PARAGRAPH_CHARS = 260;

/** intro/info 등 — 이 길이 이상이거나 문단이 여러 개면 prose 렌더 */
export const READABLE_DETAIL_FIELD_PROSE_MIN_CHARS = 100;

/**
 * TourAPI 상세 본문 — 문단 분리 후 과도하게 긴 덩어리만 프로그램/인용 접두로 한 번 더 나눔.
 */
export function splitTourApiDetailParagraphs(text) {
  const base = splitOverviewParagraphs(text);
  const out = [];

  for (const paragraph of base) {
    if (paragraph.length <= LONG_PARAGRAPH_CHARS) {
      out.push(paragraph);
      continue;
    }
    const chunks = paragraph
      .split(/(?<=[.!?。…])\s+(?=(?:SIEAF|「|'|〈|[A-Z]{2,}))/u)
      .map((s) => s.trim())
      .filter(Boolean);
    if (chunks.length > 1) out.push(...chunks);
    else out.push(paragraph);
  }

  return out;
}

export function shouldUseReadableDetailProse(text) {
  const s = String(text || '').trim();
  if (!s) return false;
  if (s.length >= READABLE_DETAIL_FIELD_PROSE_MIN_CHARS) return true;
  if (/\n/.test(s)) return true;
  return splitTourApiDetailParagraphs(s).length > 1;
}
