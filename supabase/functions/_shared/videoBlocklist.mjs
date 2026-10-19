/**
 * Place / festival YouTube hygiene — IDs + title/hashtag patterns.
 * Applied on fetch-place-videos (search + cached serve) and client L2 reads.
 *
 * Note: \\b is ASCII-only in JS — do not use it after Hangul or '#'.
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

const TAG_END = '(?=$|[\\s#.,!?])';

/** @type {RegExp[]} */
const BLOCK_TITLE_PATTERNS = [
  /사망사고/,
  /#(?:발리)?사고.*#사망/,
  new RegExp(`#사망${TAG_END}`),
  new RegExp(`#horror${TAG_END}`, 'i'),
  new RegExp(`#ghost${TAG_END}`, 'i'),
  new RegExp(`#creepy${TAG_END}`, 'i'),
  new RegExp(`#scary${TAG_END}`, 'i'),
  /심약자\s*주의/,
  /기괴하고\s*오싹한/,
  new RegExp(`#괴담${TAG_END}`),
  new RegExp(`#공포${TAG_END}`),
  /200명\s*사망/,
  /송크란.*200명\s*사망/,
  /해운대\s*거리공연\s*중\s*사고/,
  /실종자가\s*나오는/,
  /#shorts?(?![A-Za-z0-9_]).*실종/i,
  /유령\s*모텔/,
];

/**
 * One probe title per pattern (id must not be in BLOCKED_VIDEO_IDS; no English horror tags unless testing that pattern).
 * @type {Array<{ key: string, title: string }>}
 */
export const BLOCK_PATTERN_PROBE_CASES = [
  { key: 'samang-sago', title: '얼마전 발리에서 생긴 사망사고 현장' },
  { key: 'bali-sago-samang', title: '클립 #발리사고 #사망' },
  { key: 'hash-samang', title: '뉴스 요약 #사망' },
  { key: 'hash-horror', title: 'clip #horror' },
  { key: 'hash-ghost', title: 'clip #ghost' },
  { key: 'hash-creepy', title: 'clip #creepy' },
  { key: 'hash-scary', title: 'clip #scary' },
  { key: 'simyakja', title: '직캠 심약자주의' },
  { key: 'gisanghan', title: '기괴하고 오싹한 이야기' },
  { key: 'hash-goedam', title: '#괴담 모음' },
  { key: 'hash-gongpo', title: '귀신 #공포' },
  { key: '200-samang', title: '송크란 200명 사망 뉴스' },
  { key: 'songkran-200', title: '송크란 축제 200명 사망 보도' },
  { key: 'haeundae', title: '해운대 거리공연 중 사고 영상' },
  { key: 'siljongja', title: '실종자가 나오는 호주?' },
  { key: 'shorts-siljong', title: '#shorts 실종자가 나오는' },
  { key: 'ghost-motel', title: '인적 드문 유령 모텔 투숙' },
];

const SHORTS_TAG_RE = /#shorts?(?![A-Za-z0-9_])/i;

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
  return SHORTS_TAG_RE.test(text);
}
