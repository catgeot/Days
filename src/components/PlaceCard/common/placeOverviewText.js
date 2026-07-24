import { isSyntheticOrEmptyPlaceDesc } from '../../../pages/Home/lib/placeDescText.js';

/**
 * 갤러리 PLACE_OVERVIEW — 큐레이션 연결 문구와 고정 SSOT desc를 분리.
 * /place/ URL sync가 desc만 SSOT로 바꿔도 curationSummary가 있으면 큐레이션이 남는다.
 * 합성 hub·종류 desc는 실문장으로 보지 않음 (무니 intro hydrate 대상).
 */
export function splitPlaceOverview(location) {
  const curation = String(location?.curationSummary || '').trim();
  let fixed = String(location?.desc || location?.description || '').trim();

  if (fixed && isSyntheticOrEmptyPlaceDesc({ ...location, desc: fixed })) {
    fixed = '';
  }

  if (curation && fixed) {
    if (fixed === curation) {
      fixed = '';
    } else if (fixed.startsWith(curation)) {
      fixed = fixed.slice(curation.length).replace(/^\s*\n+/, '').trim();
    }
  }

  return {
    curation,
    fixed,
    originalQuery: String(location?.originalQuery || '').trim(),
  };
}

/**
 * 써머리 본문을 읽기 쉬운 문단 배열로 나눔.
 * - 기존 빈 줄 단락 유지
 * - 한 덩어리면 문장(.!?。…) 단위로 분리
 */
export function splitOverviewParagraphs(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return [];

  if (/\n\s*\n/.test(raw)) {
    return raw
      .split(/\n\s*\n+/)
      .map((p) => p.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  const singleBlock = raw.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = singleBlock
    .split(/(?<=[.!?。…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return [singleBlock];
  return sentences;
}
