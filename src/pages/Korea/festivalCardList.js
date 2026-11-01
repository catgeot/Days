export function festivalCardDedupeKey(item) {
  const contentId = String(item?.contentId ?? '').trim();
  if (contentId) return `id:${contentId}`;
  const title = String(item?.title ?? '').trim();
  if (!title) return '';
  return `t:${title}|${String(item?.eventStartDate ?? '').trim()}|${String(item?.addr1 ?? '').trim()}`;
}

export function dedupeFestivalItems(items) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const key = festivalCardDedupeKey(item);
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(item);
  }
  return out;
}

export function hasFestivalCardContent(item) {
  return Boolean(String(item?.title ?? '').trim());
}
