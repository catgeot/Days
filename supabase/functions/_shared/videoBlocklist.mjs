/**
 * Place / festival YouTube hygiene — IDs + title/hashtag patterns.
 * Applied on fetch-place-videos (search + cached serve) and client L2 reads.
 */

export const BLOCKED_VIDEO_IDS = new Set([
  'BATsLpppQms',
  '7qyoENLB85Q',
  'q5kKO6kL518',
  'qlQdD4KUoOg',
  'g2YlS-0z7XY',
  'TlT-kehJH64',
  'XyCDSlCffd8',
  'thyLPEiS9bw',
  'vuBdI-ibv6E',
]);

// PENDING_REVIEW — owner decision; not applied by shouldBlockPlaceVideo.
// OC948Uq6A90 angkor-thom (범죄도시)
// r7TXD8M7ZaU manila
// zl8atdSvWCo cape-town
// Kn6Ib3W5QBA philadelphia (마약)
// YL9d9YCmqkA san-francisco (마약)
// LsebF9t1HrA milan (소름)
// 1yOS4vIGDRI palau (공포 in travel ep)

const ALLOWLIST_PHRASES = [
  '살인적인 인플레이션',
  'missing mummy',
  '캐리어 실종',
  '벌룬투어 사건',
];

/** @type {RegExp[]} */
const BLOCK_TITLE_PATTERNS = [
  /\b사망사고\b/i,
  /#(?:발리)?사고\b.*#사망/i,
  /#사망\b/i,
  /#horror\b/i,
  /#ghost\b/i,
  /#creepy\b/i,
  /#scary\b/i,
  /심약자\s*주의/i,
  /기괴하고\s*오싹한/i,
  /#괴담\b/i,
  /#공포\b/i,
  /200명\s*사망/i,
  /송크란.*200명\s*사망/i,
  /해운대\s*거리공연\s*중\s*사고/i,
  /실종자가\s*나오는/i,
  /#shorts\b.*실종/i,
  /유령\s*모텔/i,
];

function videoText(video) {
  const title = String(video?.title ?? '');
  const desc = String(video?.ai_context?.summary ?? video?.description ?? '');
  return `${title} ${desc}`;
}

function allowlisted(text) {
  const hay = text.toLowerCase();
  return ALLOWLIST_PHRASES.some((phrase) => hay.includes(phrase.toLowerCase()));
}

/**
 * @param {{ id?: string, title?: string, description?: string, ai_context?: { summary?: string } }} video
 */
export function shouldBlockPlaceVideo(video) {
  const id = String(video?.id ?? '').trim();
  if (id && BLOCKED_VIDEO_IDS.has(id)) return true;
  const text = videoText(video);
  if (!text.trim()) return false;
  if (allowlisted(text)) return false;
  return BLOCK_TITLE_PATTERNS.some((re) => re.test(text));
}

/**
 * @template {{ id?: string }} T
 * @param {T[] | null | undefined} videos
 * @returns {T[]}
 */
export function filterBlockedPlaceVideos(videos) {
  if (!Array.isArray(videos)) return [];
  return videos.filter((v) => v && !shouldBlockPlaceVideo(v));
}

export function snippetLooksLikeShorts(snippet) {
  const title = String(snippet?.title ?? '');
  const description = String(snippet?.description ?? '');
  const text = `${title} ${description}`;
  return /#shorts\b/i.test(text) || /\b#short\b/i.test(text);
}
