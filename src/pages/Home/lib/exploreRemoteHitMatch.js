/**
 * Mapbox forward autocomplete returns low-relevance places for nonsense queries
 * (zzqxnone999xyz → Y, Saxonne). Keep a hit only when a query token meets a
 * name token on a real prefix, long enough to be a place fragment.
 */

function compact(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function minTokenLength(text) {
  return /[가-힣]/.test(text) ? 2 : 3;
}

function nameParts(item) {
  const aliases = Array.isArray(item?.aliases) ? item.aliases : [];
  return [item?.name, item?.name_en, item?.name_ko, item?.place_formatted, ...aliases]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

/**
 * @param {unknown} query
 * @param {object | null | undefined} item
 */
export function exploreRemoteSuggestionMatchesQuery(query, item) {
  const q = compact(query);
  if (!q || !item) return false;
  const names = nameParts(item).map(compact).filter(Boolean);
  const qMin = minTokenLength(q);
  for (const name of names) {
    if (q.length >= qMin && (name.startsWith(q) || name.includes(q))) return true;
    if (name.length >= minTokenLength(name) && q.startsWith(name)) return true;
  }

  const qTokens = String(query || '')
    .trim()
    .split(/[\s,./·\-]+/)
    .filter(Boolean);
  for (const raw of nameParts(item)) {
    const nTokens = raw.split(/[\s,./·\-]+/).filter(Boolean);
    for (const qt of qTokens) {
      const qc = compact(qt);
      if (qc.length < minTokenLength(qc)) continue;
      for (const nt of nTokens) {
        const nc = compact(nt);
        if (!nc) continue;
        const shorter = qc.length <= nc.length ? qc : nc;
        const longer = qc.length <= nc.length ? nc : qc;
        if (shorter.length >= minTokenLength(shorter) && longer.startsWith(shorter)) return true;
      }
    }
  }
  return false;
}

export function isMapboxSearchSuggestion(item) {
  const source = String(item?.source || '');
  if (source === 'mapbox' || source === 'mapbox-geocode' || source === 'geocode') return true;
  const id = String(item?.id || '');
  return id.startsWith('mapbox-') || id.startsWith('geocode-');
}

/**
 * @param {unknown} query
 * @param {object[]} items
 */
export function dropUnrelatedMapboxSuggestions(query, items) {
  return (items || []).filter((item) => {
    if (!isMapboxSearchSuggestion(item)) return true;
    return exploreRemoteSuggestionMatchesQuery(query, item);
  });
}
