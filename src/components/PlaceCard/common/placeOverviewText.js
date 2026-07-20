/**
 * 갤러리 PLACE_OVERVIEW — 큐레이션 연결 문구와 고정 SSOT desc를 분리.
 * /place/ URL sync가 desc만 SSOT로 바꿔도 curationSummary가 있으면 큐레이션이 남는다.
 */
export function splitPlaceOverview(location) {
  const curation = String(location?.curationSummary || '').trim();
  let fixed = String(location?.desc || location?.description || '').trim();

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
