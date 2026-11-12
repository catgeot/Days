import { resolveListImageUrl } from '../../utils/listImageUrl';

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

/** 목록·카드가 같은 순서로 썸네일을 고른다. */
export function scenicSpotThumbCandidates(spot) {
  const raw = [spot?.thumbUrl, spot?.firstImage, spot?.imageUrl];
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const url = resolveListImageUrl(toHttps(item), { role: 'list' });
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}
