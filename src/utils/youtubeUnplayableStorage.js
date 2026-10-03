const STORAGE_KEY = 'gateo.yt.unplayable.v1';
const MAX_IDS = 200;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ids: [], updatedAt: Date.now() };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.ids)) return { ids: [], updatedAt: Date.now() };
    if (Date.now() - (parsed.updatedAt || 0) > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return { ids: [], updatedAt: Date.now() };
    }
    return parsed;
  } catch {
    return { ids: [], updatedAt: Date.now() };
  }
}

export function getUnplayableYoutubeIds() {
  return new Set(readStore().ids);
}

export function markYoutubeIdUnplayable(id) {
  if (!id) return;
  const store = readStore();
  const ids = store.ids.filter((x) => x !== id);
  ids.push(id);
  while (ids.length > MAX_IDS) ids.shift();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ids, updatedAt: store.updatedAt || Date.now() }),
  );
}

export function filterPlayableVideos(videos) {
  const hidden = getUnplayableYoutubeIds();
  return (videos || []).filter((v) => v?.id && !hidden.has(v.id));
}
