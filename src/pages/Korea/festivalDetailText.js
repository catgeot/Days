import { splitOverviewParagraphs } from '../../components/PlaceCard/common/placeOverviewText';

const LONG_PARAGRAPH_CHARS = 260;

/**
 * 축제 TourAPI 본문 — 문단 분리 후 과도하게 긴 덩어리만 프로그램/인용 접두로 한 번 더 나눔.
 */
export function splitFestivalDetailParagraphs(text) {
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
