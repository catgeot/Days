import { splitOverviewParagraphs } from '../../components/PlaceCard/common/placeOverviewText.js';

export const LONG_PARAGRAPH_CHARS = 260;

/** intro/info 등 — 이 길이 이상이거나 문단이 여러 개면 prose 렌더 */
export const READABLE_DETAIL_FIELD_PROSE_MIN_CHARS = 100;

/** 문장 묶음 1문단 — 모바일에서 한 줄 길이 완화 */
export const READABLE_PARAGRAPH_TARGET_CHARS = 240;
export const READABLE_PARAGRAPH_MAX_SENTENCES = 2;

/** TourAPI 한글 본문 — 마침표 뒤 공백 없이 이어지는 경우(다.1392…) */
const LOOSE_SENTENCE_SPLIT = /(?<=[.!?。…])(?=\S)/u;

const PROGRAM_SENTENCE_SPLIT =
  /(?<=[.!?。…])\s+(?=(?:SIEAF|「|'|〈|[A-Z]{2,}))/u;

function splitSentencesLoose(text) {
  return String(text || '')
    .split(LOOSE_SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
}

function groupSentencesIntoParagraphs(
  sentences,
  {
    targetChars = READABLE_PARAGRAPH_TARGET_CHARS,
    maxSentences = READABLE_PARAGRAPH_MAX_SENTENCES,
  } = {},
) {
  if (!sentences.length) return [];
  const out = [];
  let bucket = [];
  let len = 0;

  for (const sentence of sentences) {
    const extra = bucket.length ? 1 : 0;
    const nextLen = len + extra + sentence.length;
    if (
      bucket.length >= maxSentences ||
      (bucket.length > 0 && nextLen > targetChars)
    ) {
      out.push(bucket.join(' '));
      bucket = [sentence];
      len = sentence.length;
    } else {
      bucket.push(sentence);
      len = nextLen;
    }
  }
  if (bucket.length) out.push(bucket.join(' '));
  return out;
}

function expandDenseParagraph(paragraph) {
  const trimmed = String(paragraph || '').trim();
  if (!trimmed) return [];

  const programChunks = trimmed
    .split(PROGRAM_SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);

  const segments = programChunks.length > 1 ? programChunks : [trimmed];
  const out = [];

  for (const segment of segments) {
    if (segment.length <= LONG_PARAGRAPH_CHARS) {
      const sentences = splitSentencesLoose(segment);
      if (sentences.length > 1) {
        out.push(...groupSentencesIntoParagraphs(sentences));
      } else {
        out.push(segment);
      }
      continue;
    }
    out.push(...groupSentencesIntoParagraphs(splitSentencesLoose(segment)));
  }

  return out;
}

/**
 * TourAPI 상세 본문 — 문단 분리 후 과도하게 긴 덩어리는 문장 단위로 재묶음.
 */
export function splitTourApiDetailParagraphs(text) {
  const base = splitOverviewParagraphs(text);
  const out = [];

  for (const paragraph of base) {
    if (paragraph.length <= LONG_PARAGRAPH_CHARS) {
      if (paragraph.length > READABLE_DETAIL_FIELD_PROSE_MIN_CHARS) {
        out.push(...expandDenseParagraph(paragraph));
      } else {
        out.push(paragraph);
      }
      continue;
    }
    out.push(...expandDenseParagraph(paragraph));
  }

  return out.length ? out : base;
}

export function shouldUseReadableDetailProse(text) {
  const s = String(text || '').trim();
  if (!s) return false;
  if (s.length >= READABLE_DETAIL_FIELD_PROSE_MIN_CHARS) return true;
  if (/\n/.test(s)) return true;
  return splitTourApiDetailParagraphs(s).length > 1;
}
